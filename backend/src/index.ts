import express from 'express'
import path from 'path'
import {spawn} from 'child_process'
import fs from 'fs'
import os from 'os'
import lessons from '../data/lessons.json'
import quizzes from '../data/quizzes.json'
import challenges from '../data/challenges.json'
import games from '../data/games.json'
const progressFile = path.join(__dirname, '../data/progress.json')
import * as db from './db'
import authRouter from './auth'

// Runner configuration (can be overridden with env vars)
const DOCKER_ENABLED = process.env.DOCKER_ENABLED !== 'false'
const DOCKER_CPUS = process.env.DOCKER_CPUS || '0.5'
const DOCKER_MEMORY = process.env.DOCKER_MEMORY || '256m'
const DOCKER_TIMEOUT_MS = parseInt(process.env.DOCKER_TIMEOUT_MS || '8000', 10)
const MAX_CODE_BYTES = parseInt(process.env.MAX_CODE_BYTES || String(64 * 1024), 10)

// Simple in-memory execution queue to serialize Docker runs and enforce limits
type QueueTask = { tmp:string, id:string, input:string, resolve:(v:any)=>void, reject:(e:any)=>void }
const taskQueue: QueueTask[] = []
let runningTask = false

function convertPathForDocker(p:string){
  if (process.platform === 'win32'){
    // Convert C:\Users\... to /c/Users/... for Docker mount compatibility
    const drive = p[0]
    if (p[1] === ':'){
      const rest = p.slice(2).replace(/\\\\/g,'/').replace(/\\/g,'/')
      return `/${drive.toLowerCase()}${rest}`.replace(/:\//,'/')
    }
    return p.replace(/\\\\/g,'/').replace(/\\/g,'/')
  }
  return p
}

function runNextInQueue(){
  if (runningTask) return
  const t = taskQueue.shift()
  if (!t) return
  runningTask = true
  const dockerCmd = 'docker'
  const hostPath = convertPathForDocker(t.tmp)
  const args = [
    'run','--rm', `--cpus=${DOCKER_CPUS}`, `--memory=${DOCKER_MEMORY}`, '--pids-limit=64', '--network=none',
    '-v', `${hostPath}:/work`, '-w', '/work', 'openjdk:17', 'sh', '-c', 'javac Main.java && java Main < input.txt'
  ]
  const proc = spawn(dockerCmd, args)
  let out = ''
  let err = ''
  proc.stdout.on('data', d=> out += d.toString())
  proc.stderr.on('data', d=> err += d.toString())
  const tmo = setTimeout(()=>{ try{ proc.kill('SIGKILL') }catch(e){} }, DOCKER_TIMEOUT_MS)
  proc.on('close', ()=>{
    clearTimeout(tmo)
    try{ fs.rmSync(t.tmp, {recursive:true, force:true}) }catch(e){}
    runningTask = false
    t.resolve((out||'') + (err?('\nERR:\n'+err):'') || 'no output')
    // process next
    setImmediate(runNextInQueue)
  })
  proc.on('error',(e)=>{
    clearTimeout(tmo)
    runningTask = false
    try{ fs.rmSync(t.tmp, {recursive:true, force:true}) }catch(e){}
    t.reject(e)
    setImmediate(runNextInQueue)
  })
}

function readProgress(){ try{ return JSON.parse(fs.readFileSync(progressFile,'utf8')||'{}') }catch(e){ return {} } }
function writeProgress(obj:any){ fs.writeFileSync(progressFile, JSON.stringify(obj,null,2)) }

function recordActivity(userId:string, xp:number){
  if (process.env.DATABASE_URL || process.env.PG_CONNECTION) return
  const progress = readProgress()
  progress[userId] = progress[userId] || {}
  const meta = progress[userId]._meta || {xp: 0, streak: 0, lastActivity: ''}
  const today = new Date().toISOString().slice(0, 10)
  if (meta.lastActivity !== today) {
    const previous = new Date()
    previous.setDate(previous.getDate() - 1)
    const yesterday = previous.toISOString().slice(0, 10)
    meta.streak = meta.lastActivity === yesterday ? meta.streak + 1 : 1
    meta.lastActivity = today
  }
  meta.xp += xp
  progress[userId]._meta = meta
  writeProgress(progress)
}

function getProfile(userId:string){
  const progress = readProgress()[userId] || {}
  const meta = progress._meta || {xp: 0, streak: 0, lastActivity: ''}
  const xp = Number(meta.xp || 0)
  return {xp, level: Math.floor(xp / 100) + 1, streak: Number(meta.streak || 0), lastActivity: meta.lastActivity || ''}
}

function enqueueSandbox(code:string, input=''){
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(),'java-docker-'))
  fs.writeFileSync(path.join(tmp,'Main.java'), code)
  fs.writeFileSync(path.join(tmp,'input.txt'), input)
  const taskId = String(Date.now()) + '-' + Math.random().toString(36).slice(2,8)
  return new Promise<string>((resolve, reject)=>{
    taskQueue.push({ tmp, id: taskId, input, resolve, reject })
    setImmediate(runNextInQueue)
  })
}

function runLocal(code:string, input=''){
  return new Promise<string>((resolve, reject)=>{
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'java-local-'))
    const file = path.join(tmp, 'Main.java')
    fs.writeFileSync(file, code)
    const compile = spawn('javac', [file], {cwd: tmp})
    let compileErr = ''
    compile.stderr.on('data', c => compileErr += c.toString())
    compile.on('error', error => { try{ fs.rmSync(tmp, {recursive:true, force:true}) }catch{}; reject(error) })
    compile.on('close', codeExit => {
      if (codeExit !== 0) {
        try{ fs.rmSync(tmp, {recursive:true, force:true}) }catch{}
        resolve('Compilation error:\n' + compileErr)
        return
      }
      const runner = spawn('java', ['-cp', tmp, 'Main'], {cwd: tmp})
      let out = ''
      let err = ''
      runner.stdin.write(input)
      runner.stdin.end()
      runner.stdout.on('data', d => out += d.toString())
      runner.stderr.on('data', d => err += d.toString())
      const timeout = setTimeout(() => { try{ runner.kill('SIGKILL') }catch{} }, 5000)
      runner.on('error', error => { clearTimeout(timeout); try{ fs.rmSync(tmp, {recursive:true, force:true}) }catch{}; reject(error) })
      runner.on('close', () => {
        clearTimeout(timeout)
        try{ fs.rmSync(tmp, {recursive:true, force:true}) }catch{}
        resolve((out || '') + (err ? '\nERR:\n' + err : '') || 'Program finished with no output')
      })
    })
  })
}

async function executeJava(code:string, input=''){
  if (DOCKER_ENABLED) {
    try { return await enqueueSandbox(code, input) }
    catch { return runLocal(code, input) }
  }
  return runLocal(code, input)
}

const app = express()
const port = process.env.PORT || 4000

app.use(express.json())
app.use('/api/auth', authRouter)

app.get('/api/health', async (_req, res) => {
  let dockerAvailable = false
  try {
    await new Promise<void>((resolve, reject) => {
      const check = spawn('docker', ['info'], { stdio: 'ignore' })
      check.once('error', reject)
      check.once('close', code => code === 0 ? resolve() : reject(new Error('docker unavailable')))
    })
    dockerAvailable = true
  } catch {
    dockerAvailable = false
  }

  res.json({
    ok: true,
    dockerEnabled: DOCKER_ENABLED,
    dockerAvailable,
    persistence: process.env.DATABASE_URL || process.env.PG_CONNECTION ? 'postgres' : 'json'
  })
})

// Initialize DB tables if Postgres configured
;(async ()=>{
  if (process.env.DATABASE_URL || process.env.PG_CONNECTION){
    try{ await db.ensureTables(); console.log('Postgres tables ensured') }catch(e){ console.error('DB init error',e) }
  }
})()

app.get('/api/lessons', (req, res) => {
  res.json(lessons)
})

// Simple rule-based Duke chat endpoint — placeholder for AI integration.
app.post('/api/chat', (req,res)=>{
  const {message, lessonId} = req.body || {}
  const m = (message||'').toLowerCase()
  let reply = "I'm Duke — I can explain concepts, give analogies, and quiz you. What would you like to learn?"

  if (m.includes('hashmap') || m.includes('hash map')){
    reply = "Imagine 500 lockers, each with a number. A HashMap uses a key's hash to pick a locker — then stores the value there. Collisions mean multiple items end up in the same locker (bucket), so lists are used to chain them. Want a small example?"
  } else if (m.includes('jvm') || m.includes('bytecode')){
    reply = "Think of the JVM as Netflix: your program is the movie (bytecode) and the JVM is the app that runs the movie on different devices. The compiler produces bytecode, the JVM interprets or JIT-compiles it to run on the host platform. Ask me to show the steps and I can quiz you."
  } else if (m.includes('hello') || m.includes('hi')){
    reply = 'Hello! Which lesson are you on? I can explain the current lesson or provide a mini-quiz.'
  } else if (m.includes('quiz')){
    reply = 'Mini-quiz: What does WORA stand for in Java? (A) Write Once Run Anywhere (B) Write Often Repeat Always'
  } else if (m.includes('wora') || m.includes('write once')){
    reply = 'Correct — WORA stands for Write Once, Run Anywhere. Java compiles to bytecode that the JVM executes on multiple platforms.'
  } else if (lessonId){
    reply = `You're viewing lesson ${lessonId}. Ask a specific question or say 'explain' to get a step-by-step explanation.`
  }

  res.json({reply})
})

// AI-backed Duke endpoint: uses OpenAI if OPENAI_API_KEY is set, otherwise falls back to rule-based.
app.post('/api/ai-chat', async (req,res)=>{
  const {message, lessonId, history = '', code = ''} = req.body || {}
  const lesson:any = lessons.find((l:any)=> l.id === lessonId)
  const system = `You are Duke, a senior Java engineer tutor. Keep explanations friendly, use analogies, ask one guiding question when useful, and never give a complete challenge solution before the learner attempts it.`
  const context = lesson ? `Current lesson title: ${lesson.title}\n${lesson.content.join('\n')}\n${lesson.analogy || ''}` : ''
  const codeContext = code ? `\nLearner code:\n${String(code).slice(0, MAX_CODE_BYTES)}` : ''
  const recentHistory = Array.isArray(history) ? history.slice(-6).map((item:any) => `${item.from}: ${item.text}`).join('\n') : String(history || '')
  if (process.env.OPENAI_API_KEY){
    try{
      const body = {
        model: 'gpt-3.5-turbo',
        messages: [
          {role:'system', content: system},
          {role:'system', content: context},
          {role:'system', content: recentHistory + codeContext},
          {role:'user', content: message}
        ],
        max_tokens: 500
      }
      const r = await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Authorization':`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(body)})
      const js = await r.json()
      const reply = js?.choices?.[0]?.message?.content || 'Sorry, no reply.'
      return res.json({reply})
    }catch(e){
      console.error('OpenAI error',e)
      // fallthrough to rule-based
    }
  }

  // fallback rule-based
  let reply = "I'm Duke — I can explain concepts, give analogies, and quiz you. What would you like to learn?"
  const m = (message||'').toLowerCase()
  if (m.includes('hashmap') || m.includes('hash map')){
    reply = "Imagine 500 lockers... (fallback)"
  } else if (lessonId){
    reply = `You're viewing lesson ${lessonId}. Ask a specific question or say 'explain' to get a step-by-step explanation.`
  }
  res.json({reply})
})

// Quizzes endpoints
app.get('/api/quizzes', (req,res)=>{
  res.json(quizzes)
})

app.get('/api/games', (_req, res) => res.json(games))

app.post('/api/games/submit', (req, res) => {
  const {userId = 'anonymous', gameType, gameId, answer} = req.body || {}
  const collection:any[] = gameType === 'bug' ? games.bugs : games.output
  const game = collection.find(item => item.id === gameId)
  if (!game) return res.status(404).json({error:'game not found'})
  const correct = String(answer) === String(game.answer)
  if (correct) recordActivity(String(userId), 10)
  res.json({correct, explanation: game.explanation || (correct ? 'Correct. Nice observation.' : 'Not quite. Try tracing the code line by line.')})
})

// Challenge endpoints. Public tests are returned for the editor; hidden tests
// are only evaluated by the server and never exposed to the browser.
app.get('/api/challenges', (_req, res) => {
  res.json(challenges.map((challenge:any) => ({
    id: challenge.id,
    title: challenge.title,
    difficulty: challenge.difficulty,
    lessonId: challenge.lessonId,
    statement: challenge.statement
  })))
})

app.get('/api/challenges/:id', (req, res) => {
  const challenge = challenges.find((item:any) => item.id === req.params.id)
  if (!challenge) return res.status(404).json({error:'challenge not found'})
  res.json({
    id: challenge.id,
    title: challenge.title,
    difficulty: challenge.difficulty,
    lessonId: challenge.lessonId,
    statement: challenge.statement,
    starterCode: challenge.starterCode,
    tests: challenge.tests.filter((test:any) => test.isPublic),
    hints: challenge.hints
  })
})

async function evaluateChallenge(challenge:any, code:string, includeHidden:boolean){
  const tests = includeHidden ? challenge.tests : challenge.tests.filter((test:any) => test.isPublic)
  const results = []
  for (const test of tests) {
    const output = await executeJava(code, test.input)
    const actual = output.trim()
    const expected = String(test.expectedOutput).trim()
    results.push({passed: actual === expected, input: test.input, expected, actual})
  }
  return results
}

async function persistChallengeResult(userId:string, challengeId:string, passed:boolean){
  const score = passed ? 100 : 0
  if (process.env.DATABASE_URL || process.env.PG_CONNECTION) {
    await db.upsertProgress(userId, `challenge:${challengeId}`, passed, score)
    if (passed) {
      try { await db.pool!.query('INSERT INTO achievements (user_id,key,title) VALUES ($1,$2,$3)', [userId, `challenge:${challengeId}`, `Solved ${challengeId}`]) } catch {}
    }
    return
  }
  const progress = readProgress()
  progress[userId] = progress[userId] || {}
  progress[userId][`challenge:${challengeId}`] = {completed: passed, score, updated: new Date().toISOString()}
  progress[userId].achievements = progress[userId].achievements || []
  if (passed && !progress[userId].achievements.some((item:any) => item.key === `challenge:${challengeId}`)) {
    progress[userId].achievements.push({key:`challenge:${challengeId}`, title:`Solved ${challengeId}`, awarded_at:new Date().toISOString()})
  }
  writeProgress(progress)
  if (passed) recordActivity(userId, 50)
}

app.post('/api/challenges/:id/run', async (req, res) => {
  const challenge = challenges.find((item:any) => item.id === req.params.id)
  const code = String(req.body?.code || '')
  if (!challenge) return res.status(404).json({error:'challenge not found'})
  if (!code) return res.status(400).json({error:'no code'})
  if (Buffer.byteLength(code, 'utf8') > MAX_CODE_BYTES) return res.status(400).json({error:'code-too-large'})
  try { res.json({results: await evaluateChallenge(challenge, code, false)}) }
  catch (error) { res.status(500).json({error:'challenge-run-failed', detail:String(error)}) }
})

app.post('/api/challenges/:id/submit', async (req, res) => {
  const challenge = challenges.find((item:any) => item.id === req.params.id)
  const code = String(req.body?.code || '')
  const userId = String(req.body?.userId || 'anonymous')
  if (!challenge) return res.status(404).json({error:'challenge not found'})
  if (!code) return res.status(400).json({error:'no code'})
  if (Buffer.byteLength(code, 'utf8') > MAX_CODE_BYTES) return res.status(400).json({error:'code-too-large'})
  try {
    const results = await evaluateChallenge(challenge, code, true)
    const passed = results.every((result:any) => result.passed)
    await persistChallengeResult(userId, challenge.id, passed)
    res.json({passed, results})
  } catch (error) { res.status(500).json({error:'challenge-submit-failed', detail:String(error)}) }
})

// Submit quiz answer, update progress and award achievement on correct answer
app.post('/api/quizzes/submit', async (req,res)=>{
  const { userId = 'anonymous', lessonId, qIndex, answerIndex } = req.body || {}
  if (!lessonId) return res.status(400).json({error:'missing lessonId'})

  // find quizzes for the lesson
  const candidates = quizzes.filter((q:any)=> q.lessonId === lessonId)
  if (!candidates.length) return res.status(404).json({error:'quiz not found for lesson'})
  const qi = typeof qIndex === 'number' ? qIndex : 0
  const quiz = candidates[qi]
  if (!quiz) return res.status(404).json({error:'quiz index out of range'})

  const correct = (typeof answerIndex === 'number') && (answerIndex === quiz.ans)
  const score = correct ? 100 : 0

  // persist progress
  try{
    if (process.env.DATABASE_URL || process.env.PG_CONNECTION){
      await db.upsertProgress(String(userId), lessonId, !!correct, score)
      // award achievement if correct
      if (correct){
        try{ await db.pool!.query('INSERT INTO achievements (user_id,key,title) VALUES ($1,$2,$3)',[String(userId), `quiz:${lessonId}`, `Completed quiz for ${lessonId}`]) }catch(e){}
      }
    } else {
      const p = readProgress()
      p[userId] = p[userId] || {}
      p[userId][lessonId] = {completed: !!correct, score, updated: new Date().toISOString()}
      p[userId].achievements = p[userId].achievements || []
      if (correct) p[userId].achievements.push({key:`quiz:${lessonId}`, title:`Completed quiz for ${lessonId}`, awarded_at:new Date().toISOString()})
      writeProgress(p)
    }
  }catch(e){ console.error('quiz submit error',e); return res.status(500).json({error:String(e)}) }

  if (correct) recordActivity(String(userId), 25)

  res.json({ok:true, correct, score})
})

// Achievements endpoints
app.get('/api/achievements', async (req,res)=>{
  const userId = String(req.query.userId || 'anonymous')
  if (process.env.DATABASE_URL || process.env.PG_CONNECTION){
    try{
      const r = await db.pool!.query('SELECT id,key,title,awarded_at FROM achievements WHERE user_id=$1',[userId])
      return res.json(r.rows)
    }catch(e){ return res.status(500).json({error:String(e)}) }
  } else {
    const p = readProgress()
    return res.json(p[userId]?.achievements || [])
  }
})

app.post('/api/achievements/award', async (req,res)=>{
  const {userId='anonymous', key, title} = req.body || {}
  if (!key) return res.status(400).json({error:'missing key'})
  if (process.env.DATABASE_URL || process.env.PG_CONNECTION){
    try{
      await db.pool!.query('INSERT INTO achievements (user_id,key,title) VALUES ($1,$2,$3)',[userId,key,title||key])
      return res.json({ok:true})
    }catch(e){ return res.status(500).json({error:String(e)}) }
  } else {
    const p = readProgress()
    p[userId] = p[userId] || {}
    p[userId].achievements = p[userId].achievements || []
    p[userId].achievements.push({key,title,awarded_at:new Date().toISOString()})
    writeProgress(p)
    return res.json({ok:true})
  }
})

// Flashcards endpoints
app.get('/api/flashcards', async (req,res)=>{
  const userId = String(req.query.userId || 'anonymous')
  if (process.env.DATABASE_URL || process.env.PG_CONNECTION){
    try{ const r = await db.pool!.query('SELECT id,front,back,created_at FROM flashcards WHERE user_id=$1',[userId]); return res.json(r.rows) }catch(e){ return res.status(500).json({error:String(e)}) }
  } else {
    const p = readProgress()
    return res.json(p[userId]?.flashcards || [])
  }
})

app.post('/api/flashcards', async (req,res)=>{
  const {userId='anonymous', front, back} = req.body || {}
  if (!front || !back) return res.status(400).json({error:'missing'})
  if (process.env.DATABASE_URL || process.env.PG_CONNECTION){
    try{ await db.pool!.query('INSERT INTO flashcards (user_id,front,back) VALUES ($1,$2,$3)',[userId,front,back]); return res.json({ok:true}) }catch(e){ return res.status(500).json({error:String(e)}) }
  } else {
    const p = readProgress()
    p[userId] = p[userId] || {}
    p[userId].flashcards = p[userId].flashcards || []
    p[userId].flashcards.push({front,back,created_at:new Date().toISOString()})
    writeProgress(p)
    return res.json({ok:true})
  }
})

app.get('/api/progress', (req,res)=>{
  const userId = String(req.query.userId || 'anonymous')
  if (process.env.DATABASE_URL || process.env.PG_CONNECTION){
    db.getProgress(userId).then(p=> res.json(p || {})).catch(e=> res.status(500).json({error:String(e)}))
  } else {
    const progress = readProgress()
    res.json(progress[userId] || {})
  }
})

app.get('/api/profile', (req,res)=>{
  const userId = String(req.query.userId || 'anonymous')
  if (process.env.DATABASE_URL || process.env.PG_CONNECTION) {
    db.getProgress(userId).then(progress => {
      const completed = Object.values(progress || {}).filter((item:any) => item.completed).length
      res.json({xp: completed * 25, level: Math.floor(completed / 4) + 1, streak: 0, lastActivity: ''})
    }).catch(e => res.status(500).json({error:String(e)}))
    return
  }
  res.json(getProfile(userId))
})

app.post('/api/progress', (req,res)=>{
  const {userId='anonymous', lessonId, completed, score} = req.body || {}
  if (process.env.DATABASE_URL || process.env.PG_CONNECTION){
    db.upsertProgress(userId, lessonId, !!completed, score || 0).then(()=> res.json({ok:true})).catch(e=> res.status(500).json({error:String(e)}))
  } else {
    const p = readProgress()
    p[userId] = p[userId] || {}
    p[userId][lessonId] = {completed: !!completed, score: score || 0, updated: new Date().toISOString()}
    writeProgress(p)
    res.json({ok:true})
  }
})

// Run Java code endpoint — attempts to compile & run if javac/java available.
// WARNING: executing code has security implications. This endpoint is intended for
// local development only. Do NOT expose to the public internet without sandboxing.
app.post('/api/run', async (req, res) => {
  const code: string = req.body.code || ''
  if (!code) return res.status(400).json({error:'no code'})

  // Create temp directory
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'java-run-'))
  const file = path.join(tmp, 'Main.java')
  fs.writeFileSync(file, code)

  // Helper to cleanup
  function cleanup(){ try{ fs.rmSync(tmp, {recursive:true, force:true}) }catch(e){} }

  // Check for javac
  const javac = 'javac'
  const java = 'java'

  // Try to compile
  const compile = spawn(javac, [file], {cwd: tmp})
  let compileErr = ''
  compile.stderr.on('data', (c)=> compileErr += c.toString())
  compile.on('close', (codeExit)=>{
    if (codeExit !== 0) {
      cleanup()
      return res.json({output: 'Compilation error:\n' + compileErr})
    }

    // Run the class with timeout
    const runner = spawn(java, ['-cp', tmp, 'Main'], {cwd: tmp})
    let out = ''
    let err = ''
    runner.stdout.on('data', d=> out += d.toString())
    runner.stderr.on('data', d=> err += d.toString())

    // Kill if runs longer than 5s
    const timeout = setTimeout(()=>{ try{ runner.kill('SIGKILL') }catch(e){} }, 5000)

    runner.on('close', ()=>{
      clearTimeout(timeout)
      cleanup()
      const combined = (out || '') + (err ? ('\nERR:\n'+err) : '')
      res.json({output: combined || 'Program finished with no output'})
    })
  })
})

// Docker-based sandbox runner (best-effort). Requires Docker Desktop or docker CLI available.
app.post('/api/run-sandbox', async (req, res)=>{
  if (!DOCKER_ENABLED) return res.status(503).json({error:'docker-disabled'})
  const code: string = req.body.code || ''
  if(!code) return res.status(400).json({error:'no code'})
  if (Buffer.byteLength(code, 'utf8') > MAX_CODE_BYTES) return res.status(400).json({error:'code-too-large'})

  try{
    const output = await enqueueSandbox(code, String(req.body.input || ''))
    res.json({output})
  }catch(e){
    res.status(500).json({error:'docker-run-failed',detail:String(e)})
  }
})

// serve frontend in production (optional)
app.use(express.static(path.join(__dirname,'../../frontend/dist')))
app.get('*', (req,res)=>{
  res.sendFile(path.join(__dirname,'../../frontend/dist/index.html'))
})

app.listen(port, ()=>{
  console.log(`API listening on http://localhost:${port}`)
})

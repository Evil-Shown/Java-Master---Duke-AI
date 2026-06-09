import express from 'express'
import path from 'path'
import {spawn} from 'child_process'
import fs from 'fs'
import os from 'os'
import fetch from 'node-fetch'
import lessons from '../data/lessons.json'
import quizzes from '../data/quizzes.json'
const progressFile = path.join(__dirname, '../data/progress.json')

function readProgress(){ try{ return JSON.parse(fs.readFileSync(progressFile,'utf8')||'{}') }catch(e){ return {} } }
function writeProgress(obj:any){ fs.writeFileSync(progressFile, JSON.stringify(obj,null,2)) }

const app = express()
const port = process.env.PORT || 4000

app.use(express.json())

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
  const {message, lessonId} = req.body || {}
  const lesson = lessons.find((l:any)=> l.id === lessonId)
  const system = `You are Duke, a senior Java engineer tutor. Keep explanations friendly, use analogies, and adapt to the user's current lesson.`
  const context = lesson ? `Current lesson title: ${lesson.title}\n${lesson.content.join('\n')}` : ''
  if (process.env.OPENAI_API_KEY){
    try{
      const body = {
        model: 'gpt-3.5-turbo',
        messages: [
          {role:'system', content: system},
          {role:'system', content: context},
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

app.get('/api/progress', (req,res)=>{
  res.json(readProgress())
})

app.post('/api/progress', (req,res)=>{
  const {userId='anonymous', lessonId, completed, score} = req.body || {}
  const p = readProgress()
  p[userId] = p[userId] || {}
  p[userId][lessonId] = {completed: !!completed, score: score || 0, updated: new Date().toISOString()}
  writeProgress(p)
  res.json({ok:true})
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
  const code: string = req.body.code || ''
  if(!code) return res.status(400).json({error:'no code'})
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(),'java-docker-'))
  const file = path.join(tmp,'Main.java')
  fs.writeFileSync(file, code)

  const dockerCmd = 'docker'
  // docker run --rm -v <tmp>:/work -w /work openjdk:17 sh -c "javac Main.java && java Main"
  const args = ['run','--rm','-v', `${tmp}:/work`, '-w', '/work', 'openjdk:17', 'sh', '-c', 'javac Main.java && java Main']
  try{
    const proc = spawn(dockerCmd, args)
    let out = ''
    let err = ''
    proc.stdout.on('data', d=> out += d.toString())
    proc.stderr.on('data', d=> err += d.toString())
    const tmo = setTimeout(()=>{ try{ proc.kill('SIGKILL') }catch(e){} }, 8000)
    proc.on('close', ()=>{
      clearTimeout(tmo)
      try{ fs.rmSync(tmp, {recursive:true, force:true}) }catch(e){}
      res.json({output: (out||'') + (err?('\nERR:\n'+err):'') || 'no output'})
    })
  }catch(e){
    try{ fs.rmSync(tmp, {recursive:true, force:true}) }catch(_){}
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

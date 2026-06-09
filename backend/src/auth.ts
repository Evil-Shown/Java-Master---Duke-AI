import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'
import * as db from './db'

const router = express.Router()
const usersFile = path.join(__dirname, '../data/users.json')

function readUsers(){ try{ return JSON.parse(fs.readFileSync(usersFile,'utf8')||'{}') }catch(e){ return {} } }
function writeUsers(u:any){ fs.writeFileSync(usersFile, JSON.stringify(u,null,2)) }

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

router.post('/register', async (req,res)=>{
  const {username,password} = req.body || {}
  if (!username || !password) return res.status(400).json({error:'missing'})
  if (process.env.DATABASE_URL || process.env.PG_CONNECTION){
    // postgres user table will be created by ensureTables
    const hashed = await bcrypt.hash(password, 10)
    try{
      await db.pool?.query('INSERT INTO users (username, password_hash) VALUES ($1,$2)', [username, hashed])
      const token = jwt.sign({username}, JWT_SECRET)
      return res.json({token})
    }catch(e:any){ return res.status(400).json({error:String(e)}) }
  } else {
    const u = readUsers()
    if (u[username]) return res.status(400).json({error:'exists'})
    const hashed = await bcrypt.hash(password,10)
    u[username] = { password_hash: hashed }
    writeUsers(u)
    const token = jwt.sign({username}, JWT_SECRET)
    return res.json({token})
  }
})

router.post('/login', async (req,res)=>{
  const {username,password} = req.body || {}
  if (!username || !password) return res.status(400).json({error:'missing'})
  if (process.env.DATABASE_URL || process.env.PG_CONNECTION){
    const r = await db.pool?.query('SELECT username,password_hash FROM users WHERE username=$1',[username])
    const row = r?.rows?.[0]
    if (!row) return res.status(400).json({error:'no user'})
    const ok = await bcrypt.compare(password, row.password_hash)
    if (!ok) return res.status(401).json({error:'invalid'})
    const token = jwt.sign({username}, JWT_SECRET)
    return res.json({token})
  } else {
    const u = readUsers()
    const user = u[username]
    if (!user) return res.status(400).json({error:'no user'})
    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) return res.status(401).json({error:'invalid'})
    const token = jwt.sign({username}, JWT_SECRET)
    return res.json({token})
  }
})

export default router

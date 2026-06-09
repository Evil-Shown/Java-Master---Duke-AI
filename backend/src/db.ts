import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'

const connectionString = process.env.DATABASE_URL || process.env.PG_CONNECTION || ''

export let pool: Pool | null = null

if (connectionString) {
  pool = new Pool({ connectionString })
}

export async function ensureTables(){
  if (!pool) return false
  const sql = `
  CREATE TABLE IF NOT EXISTS progress (
    user_id TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    completed BOOLEAN,
    score INT,
    updated TIMESTAMP DEFAULT now(),
    PRIMARY KEY (user_id, lesson_id)
  );
  CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    key TEXT NOT NULL,
    title TEXT,
    awarded_at TIMESTAMP DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS flashcards (
    id SERIAL PRIMARY KEY,
    user_id TEXT,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now()
  );
  `
  await pool.query(sql)
  return true
}

export async function getProgress(userId:string){
  if (!pool) return null
  const r = await pool.query('SELECT user_id, lesson_id, completed, score, updated FROM progress WHERE user_id = $1',[userId])
  const out:any = {}
  for (const row of r.rows){ out[row.lesson_id] = {completed:row.completed, score:row.score, updated:row.updated} }
  return out
}

export async function upsertProgress(userId:string, lessonId:string, completed:boolean, score:number){
  if (!pool) return false
  const sql = `INSERT INTO progress (user_id, lesson_id, completed, score, updated) VALUES ($1,$2,$3,$4, now()) ON CONFLICT (user_id, lesson_id) DO UPDATE SET completed = EXCLUDED.completed, score = EXCLUDED.score, updated = now()`
  await pool.query(sql, [userId, lessonId, completed, score])
  return true
}

export function close(){ if (pool) pool.end() }

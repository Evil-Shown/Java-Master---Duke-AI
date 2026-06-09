import React, {useEffect, useState} from 'react'

type Lesson = {
  id:string
  title:string
  tagline?:string
  content:string[]
  code?:string
}

export default function Lessons({activeId,onSelect}:{activeId?:string,onSelect?:(id:string)=>void}){
  const [lessons,setLessons] = useState<Lesson[]>([])

  useEffect(()=>{
    fetch('/api/lessons').then(r=>r.json()).then(setLessons)
  },[])

  const active = activeId

  return (
    <div style={{display:'flex',gap:20}}>
      <div style={{width:300}}>
        <h3>Lessons</h3>
        <ul>
          {lessons.map(l=> (
            <li key={l.id}>
              <button onClick={()=>onSelect?.(l.id)} style={{background: l.id===active? '#f89820':'transparent'}}>{l.title}</button>
            </li>
          ))}
        </ul>
      </div>
      <div style={{flex:1}}>
        {active ? (
          (()=>{
            const L = lessons.find(x=>x.id===active)!
            return (
              <article>
                <h2>{L.title}</h2>
                <p>{L.tagline}</p>
                {L.content.map((c,i)=> <p key={i}>{c}</p>)}
                {L.code && <pre style={{background:'#0d1117',color:'#e6edf3',padding:12,borderRadius:8}}>{L.code}</pre>}
              </article>
            )
          })()
        ) : <div>Select a lesson</div>}
      </div>
    </div>
  )
}

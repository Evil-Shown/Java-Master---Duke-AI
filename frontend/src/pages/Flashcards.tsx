import React, {useEffect, useState} from 'react'

export default function Flashcards(){
  const [cards,setCards] = useState<any[]>([])
  const [front,setFront] = useState('')
  const [back,setBack] = useState('')
  useEffect(()=>{ fetch('/api/flashcards?userId=anonymous').then(r=>r.json()).then(setCards) },[])
  async function add(){
    await fetch('/api/flashcards',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:'anonymous',front,back})})
    const c = await fetch('/api/flashcards?userId=anonymous').then(r=>r.json())
    setCards(c)
    setFront(''); setBack('')
  }
  return (
    <div>
      <h2>Flashcards</h2>
      <div style={{display:'flex',gap:8}}>
        <input placeholder="front" value={front} onChange={e=>setFront(e.target.value)} />
        <input placeholder="back" value={back} onChange={e=>setBack(e.target.value)} />
        <button onClick={add}>Add</button>
      </div>
      <ul>
        {cards.map((c,i)=> <li key={i}>{c.front} ↔ {c.back}</li>)}
      </ul>
    </div>
  )
}

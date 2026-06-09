import React, {useEffect, useState} from 'react'

export default function Achievements(){
  const [ach,setAch] = useState<any[]>([])
  useEffect(()=>{
    const user = localStorage.getItem('username') || 'anonymous'
    fetch('/api/achievements?userId='+encodeURIComponent(user)).then(r=>r.json()).then(setAch)
  },[])
  return (
    <div>
      <h2>Achievements</h2>
      <ul>
        {ach.map(a=> <li key={a.id || a.key}>{a.title || a.key} — {a.awarded_at}</li>)}
      </ul>
    </div>
  )
}

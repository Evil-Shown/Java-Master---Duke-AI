import React, {useEffect, useState} from 'react'

export default function Quizzes({lessonId}:{lessonId?:string}){
  const [quizzes,setQuizzes] = useState<any[]>([])
  const [progress,setProgress] = useState<any>({})

  useEffect(()=>{ fetch('/api/quizzes').then(r=>r.json()).then(setQuizzes) },[])
  useEffect(()=>{
    const user = localStorage.getItem('username') || 'anonymous'
    fetch('/api/progress?userId='+encodeURIComponent(user)).then(r=>r.json()).then(setProgress)
  },[])

  const relevant = quizzes.filter(q=> !lessonId || q.lessonId===lessonId)

  async function submit(quiz:any,choice:number){
    const user = localStorage.getItem('username') || 'anonymous'
    const token = localStorage.getItem('token')
    try{
      const res = await fetch('/api/quizzes/submit',{method:'POST',headers:{'Content-Type':'application/json', ...(token?{'Authorization':'Bearer '+token}:{})},body:JSON.stringify({userId:user, lessonId:quiz.lessonId, qIndex:0, answerIndex:choice})})
      const js = await res.json()
      // update local progress view
      const p = await fetch('/api/progress?userId='+encodeURIComponent(user)).then(r=>r.json())
      setProgress(p)
      if (js.correct){
        alert('Correct! Achievement unlocked if applicable.')
      } else {
        alert('Incorrect')
      }
    }catch(e){ console.error(e); alert('Submission failed') }
  }

  return (
    <div>
      <h2>Quizzes</h2>
      {relevant.map((q,i)=> (
        <div key={i} style={{border:'1px solid #eee',padding:12,borderRadius:8,marginBottom:10}}>
          <div style={{fontWeight:600}}>{q.q}</div>
          <div style={{marginTop:8,display:'flex',flexDirection:'column',gap:8}}>
            {q.opts.map((o:string,idx:number)=> (
              <button key={idx} onClick={()=>submit(q,idx)} style={{textAlign:'left'}}>{o}</button>
            ))}
          </div>
          <div style={{marginTop:8,fontSize:13,color:'#666'}}>Progress: {JSON.stringify(progress['anonymous']?.[q.lessonId]||{})}</div>
        </div>
      ))}
    </div>
  )
}

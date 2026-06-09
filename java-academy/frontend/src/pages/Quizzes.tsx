import React, {useEffect, useState} from 'react'

export default function Quizzes({lessonId}:{lessonId?:string}){
  const [quizzes,setQuizzes] = useState<any[]>([])
  const [progress,setProgress] = useState<any>({})

  useEffect(()=>{ fetch('/api/quizzes').then(r=>r.json()).then(setQuizzes) },[])
  useEffect(()=>{ fetch('/api/progress').then(r=>r.json()).then(setProgress) },[])

  const relevant = quizzes.filter(q=> !lessonId || q.lessonId===lessonId)

  async function submit(quiz:any,choice:number){
    const correct = (choice === quiz.ans)
    await fetch('/api/progress',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:'anonymous',lessonId:quiz.lessonId,completed:correct,score: correct?100:0})})
    const p = await fetch('/api/progress').then(r=>r.json())
    setProgress(p)
    alert(correct? 'Correct!':'Incorrect')
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

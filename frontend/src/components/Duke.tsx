import React, {useState} from 'react'

type Msg = {from:'duke'|'user', text:string}

export default function Duke({lessonId}:{lessonId?:string}){
  const [open,setOpen] = useState(true)
  const [msgs,setMsgs] = useState<Msg[]>([{from:'duke',text:'Hi — I\'m Duke. Ask me about Java or your current lesson.'}])
  const [text,setText] = useState('')
  const [sending,setSending] = useState(false)

  async function send(){
    if(!text) return
    const t = text
    setMsgs(s=>[...s,{from:'user',text:t}])
    setText('')
    setSending(true)
    try{
      const res = await fetch('/api/ai-chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:t,lessonId})})
      const data = await res.json()
      setMsgs(s=>[...s,{from:'duke',text:data.reply}])
    }catch(err){
      setMsgs(s=>[...s,{from:'duke',text:'Sorry, Duke had an error.'}])
    }finally{setSending(false)}
  }

  return (
    <div style={{width:320,borderLeft:'1px solid #eee',display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{padding:10,display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid #eee'}}>
        <div style={{fontWeight:600}}>Duke — Java Tutor</div>
        <button onClick={()=>setOpen(o=>!o)} style={{background:'none',border:'none',cursor:'pointer'}}>{open? 'Hide':'Show'}</button>
      </div>
      {open && (
        <>
          <div style={{flex:1,overflow:'auto',padding:10,display:'flex',flexDirection:'column',gap:8}}>
            {msgs.map((m,i)=> (
              <div key={i} style={{alignSelf: m.from==='user' ? 'flex-end' : 'flex-start',background: m.from==='user'? '#F89820' : '#f1f1f1',color: m.from==='user' ? '#fff' : '#000',padding:8,borderRadius:8,maxWidth:'85%'}}>{m.text}</div>
            ))}
          </div>
          <div style={{padding:10,borderTop:'1px solid #eee',display:'flex',gap:8}}>
            <input placeholder="Ask Duke..." value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') send() }} style={{flex:1,padding:8,borderRadius:6,border:'1px solid #ddd'}} />
            <button onClick={send} disabled={sending} style={{background:'#F89820',color:'#fff',border:'none',padding:'8px 12px',borderRadius:6}}>Send</button>
          </div>
        </>
      )}
    </div>
  )
}

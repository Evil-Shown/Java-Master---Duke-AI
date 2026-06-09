import React, {useState} from 'react'

export default function Login(){
  const [user,setUser] = useState('')
  const [pass,setPass] = useState('')

  async function login(){
    const res = await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:user,password:pass})})
    const js = await res.json()
    if (js.token){
      localStorage.setItem('token', js.token)
      try{
        const payload = JSON.parse(atob(js.token.split('.')[1]))
        if (payload?.username) localStorage.setItem('username', payload.username)
      }catch(e){}
      alert('Logged in')
    } else { alert('Login failed') }
  }
  async function register(){
    const res = await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:user,password:pass})})
    const js = await res.json()
    if (js.token){
      localStorage.setItem('token', js.token)
      try{
        const payload = JSON.parse(atob(js.token.split('.')[1]))
        if (payload?.username) localStorage.setItem('username', payload.username)
      }catch(e){}
      alert('Registered')
    } else { alert('Register failed') }
  }

  return (
    <div style={{maxWidth:420}}>
      <h2>Login / Register</h2>
      <input placeholder="username" value={user} onChange={e=>setUser(e.target.value)} style={{display:'block',marginBottom:8,padding:8}} />
      <input placeholder="password" type="password" value={pass} onChange={e=>setPass(e.target.value)} style={{display:'block',marginBottom:8,padding:8}} />
      <div style={{display:'flex',gap:8}}>
        <button onClick={login} style={{background:'#F89820',color:'#fff',padding:'8px 12px',borderRadius:6}}>Login</button>
        <button onClick={register}>Register</button>
      </div>
    </div>
  )
}

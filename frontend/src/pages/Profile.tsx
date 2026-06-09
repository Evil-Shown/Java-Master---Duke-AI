import React from 'react'

export default function Profile(){
  const username = localStorage.getItem('username') || 'anonymous'
  function logout(){ localStorage.removeItem('token'); localStorage.removeItem('username'); alert('Logged out'); window.location.reload() }
  return (
    <div style={{maxWidth:420}}>
      <h2>Profile</h2>
      <div><strong>Username:</strong> {username}</div>
      <div style={{marginTop:12}}>
        <button onClick={logout} style={{background:'#c33',color:'#fff',padding:'8px 12px',borderRadius:6}}>Logout</button>
      </div>
    </div>
  )
}

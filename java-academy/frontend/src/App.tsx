import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Lessons from './pages/Lessons'
import Playground from './pages/Playground'

export default function App(){
  const [activeLesson,setActiveLesson] = React.useState<string | undefined>(undefined)
  return (
    <BrowserRouter>
      <div style={{display:'flex',height:'100vh'}}>
        <aside style={{width:260,padding:16,borderRight:'1px solid #eee'}}>
          <h2>Java Academy</h2>
          <nav>
            <ul>
              <li><Link to="/">Lessons</Link></li>
              <li style={{marginTop:8}}><Link to="/playground">Playground</Link></li>
            </ul>
          </nav>
        </aside>
        <main style={{flex:1,padding:20,overflow:'auto',display:'flex'}}>
          <Routes>
            <Route path="/" element={<Lessons activeId={activeLesson} onSelect={id=>setActiveLesson(id)}/>} />
            <Route path="/playground" element={<Playground/>} />
          </Routes>
        </main>
        <Duke lessonId={activeLesson} />
      </div>
    </BrowserRouter>
  )
}

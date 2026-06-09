import React, {useState} from 'react'
import Editor from '@monaco-editor/react'

export default function Playground(){
  const [code,setCode] = useState<string>(`public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java Playground!");
    }
}`)
  const [output,setOutput] = useState<string>('')
  const [running,setRunning] = useState(false)

  async function run(){
    setRunning(true)
    setOutput('Running...')
    try{
      const res = await fetch('/api/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})})
      const data = await res.json()
      setOutput(data.output || JSON.stringify(data))
    }catch(err){
      setOutput('Error: '+String(err))
    }finally{setRunning(false)}
  }

  return (
    <div>
      <h2>Playground</h2>
      <div style={{height:420,border:'1px solid #e6e6e6',borderRadius:8,overflow:'hidden'}}>
        <Editor height="100%" defaultLanguage="java" value={code} onChange={v=>setCode(v||'')} />
      </div>
      <div style={{marginTop:12,display:'flex',gap:8}}>
        <button onClick={run} disabled={running} style={{background:'#F89820',color:'#fff',padding:'8px 12px',borderRadius:6,border:'none'}}>Run ▶</button>
        <button onClick={()=>{setCode(`public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello from Java Playground!\");\n    }\n}`)}}>Reset</button>
      </div>
      <pre style={{marginTop:12,background:'#0d1117',color:'#e6edf3',padding:12,borderRadius:8,whiteSpace:'pre-wrap'}}>{output}</pre>
      <p style={{fontSize:13,color:'#666'}}>Note: Playground uses a local runner if Java is installed; otherwise returns a simulated output. Running untrusted code locally may be unsafe.</p>
    </div>
  )
}

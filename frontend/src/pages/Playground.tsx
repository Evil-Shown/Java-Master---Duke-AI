import React, { useMemo, useState } from 'react'
import Editor from '@monaco-editor/react'
import { useTheme } from '../hooks/useTheme'

const snippets = [
  {
    label: 'Hello world',
    code: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java Academy!");
    }
}`
  },
  {
    label: 'Control flow',
    code: `public class Main {
    public static void main(String[] args) {
        int score = 87;
        if (score >= 90) {
            System.out.println("Excellent");
        } else if (score >= 75) {
            System.out.println("Solid progress");
        } else {
            System.out.println("Keep practicing");
        }
    }
}`
  },
  {
    label: 'Stream example',
    code: `import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<Integer> values = List.of(1, 2, 3, 4, 5);
        int total = values.stream()
            .filter(n -> n % 2 == 1)
            .mapToInt(Integer::intValue)
            .sum();
        System.out.println(total);
    }
}`
  }
]

export default function Playground() {
  const [code, setCode] = useState(snippets[0].code)
  const [output, setOutput] = useState<string>('Run code to see output here.')
  const [running, setRunning] = useState(false)
  const [selectedSnippet, setSelectedSnippet] = useState(snippets[0].label)
  const theme = useTheme()

  const activeSnippet = useMemo(
    () => snippets.find(snippet => snippet.label === selectedSnippet) || snippets[0],
    [selectedSnippet]
  )

  async function runWith(endpoint: string, timeoutMs: number) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
        signal: controller.signal
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.detail || 'Run failed')
      }

      return data.output || JSON.stringify(data, null, 2)
    } finally {
      clearTimeout(timer)
    }
  }

  async function run() {
    setRunning(true)
    setOutput('Compiling and running...')

    try {
      try {
        setOutput(await runWith('/api/run', 25000))
      } catch {
        setOutput(await runWith('/api/run-sandbox', 40000))
      }
    } catch (error) {
      setOutput(
        'Error: ' +
          String(error) +
          '. Make sure the backend is running and the Java compiler is on PATH.'
      )
    } finally {
      setRunning(false)
    }
  }

  function reset() {
    setCode(activeSnippet.code)
    setOutput('Run code to see output here.')
  }

  return (
    <div className="page-stack">
      <div className="section-head">
        <div>
          <h2 className="section-title">Playground</h2>
          <p className="section-copy">
            Try lessons in a live editor. The app prefers the local JVM runner, then falls back to
            the sandbox runner.
          </p>
        </div>
        <div className="stacked-meta">
          <span className="pill">Monaco editor</span>
          <span className="pill">Java 17/21 compatible</span>
        </div>
      </div>

      <div className="toolbar-row">
        <div className="split-actions">
          {snippets.map(snippet => (
            <button
              key={snippet.label}
              className={snippet.label === selectedSnippet ? 'primary-button' : 'secondary-button'}
              onClick={() => {
                setSelectedSnippet(snippet.label)
                setCode(snippet.code)
              }}
            >
              {snippet.label}
            </button>
          ))}
        </div>

        <div className="split-actions">
          <button className="primary-button" onClick={run} disabled={running}>
            {running ? 'Running...' : 'Run'}
          </button>
          <button className="secondary-button" onClick={reset}>
            Reset
          </button>
        </div>
      </div>

      <div className="lesson-layout">
        <section className="lesson-detail">
          <div className="lesson-meta">
            <span className="pill">Code editor</span>
            <span className="pill">Editable snippet</span>
          </div>
          <div className="editor-shell" style={{ height: 620 }}>
            <Editor
              height="100%"
              defaultLanguage="java"
              value={code}
              onChange={value => setCode(value || '')}
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              options={{
                fontSize: 16,
                minimap: { enabled: false },
                automaticLayout: true,
                scrollBeyondLastLine: false,
                padding: { top: 14, bottom: 14 }
              }}
            />
          </div>
        </section>

        <section className="lesson-detail">
          <div className="lesson-meta">
            <span className="pill">Console</span>
            <span className="pill">Output preview</span>
          </div>
          <pre className="code-block" style={{ minHeight: 620, whiteSpace: 'pre-wrap' }}>
            <code>{output}</code>
          </pre>
          <p className="section-copy" style={{ marginTop: '1rem' }}>
            Use this as a sandbox for syntax checks, small experiments, and interview-style code
            drills. For production deployments, keep the sandbox isolated.
          </p>
        </section>
      </div>
    </div>
  )
}

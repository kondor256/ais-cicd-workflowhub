import { useEffect, useState } from 'react'
import { getHealth } from './api/client'

function App() {
  const [apiStatus, setApiStatus] = useState('checking')

  useEffect(() => {
    getHealth()
      .then((data) => setApiStatus(data.status === 'ok' ? 'online' : 'unreachable'))
      .catch(() => setApiStatus('unreachable'))
  }, [])

  return (
    <main>
      <h1>WorkFlowHub</h1>
      <p>Workflow management for remote teams.</p>
      <p role="status">
        API: {apiStatus === 'checking' ? 'checking…' : apiStatus}
      </p>
    </main>
  )
}

export default App

import { useState } from 'react'

interface AnalysisResult {
  riskScore: number
  verdict: string
  explanation: string[]
  caseId: string
}

function App() {
  const [emailContent, setEmailContent] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const analyzeEmail = async () => {
    if (!emailContent.trim()) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('http://localhost:8000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_email: emailContent }),
      })

      if (!response.ok) throw new Error('Analysis failed')

      const data = await response.json()
      setResult({
        riskScore: data.risk_score || 0,
        verdict: data.verdict || 'Unknown',
        explanation: data.explanation || [],
        caseId: data.case_id || '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const getVerdictColor = (verdict: string) => {
    switch (verdict.toLowerCase()) {
      case 'phishing':
      case 'bec':
      case 'high risk':
        return 'bg-red-500 text-white'
      case 'suspicious':
      case 'moderate risk':
        return 'bg-amber-500 text-white'
      default:
        return 'bg-green-500 text-white'
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-cyan-400 mb-2">MailShieldAI</h1>
          <p className="text-gray-400">Enterprise Email Security & Threat Intelligence</p>
        </header>

        <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Email Analysis</h2>
          <textarea
            value={emailContent}
            onChange={(e) => setEmailContent(e.target.value)}
            placeholder="Paste raw email (RFC 822 format) or .eml content here..."
            className="w-full h-64 bg-gray-900 border border-gray-600 rounded-lg p-4 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none font-mono text-sm"
          />
          <div className="mt-4 flex gap-4">
            <button
              onClick={analyzeEmail}
              disabled={loading || !emailContent.trim()}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              {loading ? 'Analyzing...' : 'Analyze Email'}
            </button>
            <button
              onClick={() => setEmailContent('')}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              Clear
            </button>
          </div>
          {error && <p className="mt-4 text-red-400">{error}</p>}
        </div>

        {result && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <p className="text-gray-400 text-sm mb-1">Risk Score</p>
                <p className="text-4xl font-bold text-cyan-400">{result.riskScore}/100</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <p className="text-gray-400 text-sm mb-1">Verdict</p>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getVerdictColor(result.verdict)}`}>
                  {result.verdict}
                </span>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <p className="text-gray-400 text-sm mb-1">Case ID</p>
                <p className="font-mono text-sm text-cyan-400">{result.caseId}</p>
              </div>
            </div>

            {result.explanation.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-3">SHAP Explainability</h3>
                <ul className="space-y-2">
                  {result.explanation.map((item, idx) => (
                    <li key={idx} className="bg-gray-900 p-3 rounded-lg border border-gray-700 text-sm">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>MailShieldAI - Powered by 5-Model ML Ensemble + Geo-Forensics + Evidence Vault</p>
          <p className="mt-1">Backend: <a href="http://localhost:8000/docs" target="_blank" className="text-cyan-400 hover:underline">API Docs</a> | ML Service: <a href="http://localhost:8001/docs" target="_blank" className="text-cyan-400 hover:underline">ML Docs</a></p>
        </footer>
      </div>
    </div>
  )
}

export default App
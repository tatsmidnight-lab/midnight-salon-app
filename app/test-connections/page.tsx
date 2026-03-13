'use client'

import { useState } from 'react'

interface ConnectionDetail {
  status: string
  [key: string]: unknown
}

interface TestResult {
  timestamp: string
  duration_ms: number
  overall_status: string
  connections: Record<string, ConnectionDetail>
}

const SERVICE_LABELS: Record<string, string> = {
  supabase: 'Supabase (Database)',
  n8n: 'n8n (Workflows)',
  twilio: 'Twilio (SMS)',
  square: 'Square (Payments)',
  claude: 'Claude AI',
  google_calendar: 'Google Calendar',
}

export default function TestConnectionsPage() {
  const [result, setResult] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function runTests() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/test/connections')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setResult(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to run tests')
    } finally {
      setLoading(false)
    }
  }

  const statusColor = (s: string) =>
    s.includes('✅') ? 'border-green-500 bg-green-950/30' :
    s.includes('⚠️') ? 'border-yellow-500 bg-yellow-950/30' :
    'border-red-500 bg-red-950/30'

  const statusBadge = (s: string) =>
    s.includes('✅') ? 'bg-green-600' :
    s.includes('⚠️') ? 'bg-yellow-600' :
    'bg-red-600'

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Backend Connection Tests</h1>
            <p className="text-gray-400 mt-1">Verify all external service integrations</p>
          </div>
          <button
            onClick={runTests}
            disabled={loading}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg font-medium transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Testing...
              </span>
            ) : 'Run Tests'}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/50 border border-red-500 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {!result && !loading && (
          <div className="text-center py-20 text-gray-500">
            Click <span className="text-purple-400">Run Tests</span> to check all backend connections
          </div>
        )}

        {result && (
          <>
            <div className={`mb-6 p-4 rounded-lg border ${statusColor(result.overall_status)}`}>
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">{result.overall_status}</span>
                <span className="text-sm text-gray-400">
                  {result.duration_ms}ms &middot; {new Date(result.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(result.connections).map(([key, conn]) => (
                <div
                  key={key}
                  className={`rounded-lg border p-5 ${statusColor(conn.status)}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">
                      {SERVICE_LABELS[key] || key}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${statusBadge(conn.status)}`}>
                      {conn.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm text-gray-300">
                    {Object.entries(conn)
                      .filter(([k]) => k !== 'status')
                      .map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-gray-500">{k.replace(/_/g, ' ')}</span>
                          <span className="text-right max-w-[60%] truncate">
                            {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

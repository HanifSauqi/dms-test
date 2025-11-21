'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'

export default function TestPage() {
  const { api, user } = useAuth()
  const [result, setResult] = useState('')

  const testAPI = async () => {
    try {
      const response = await api.get('/classification/folders')
      setResult(JSON.stringify(response.data, null, 2))
    } catch (error) {
      setResult(`Error: ${error.message}\nResponse: ${JSON.stringify(error.response?.data, null, 2)}`)
    }
  }

  return (
    <div className="p-4">
      <h1>API Test Page</h1>
      <p>User: {user ? user.email : 'Not logged in'}</p>
      <button
        onClick={testAPI}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Test API
      </button>
      <pre className="mt-4 bg-gray-100 p-4 rounded">
        {result}
      </pre>
    </div>
  )
}
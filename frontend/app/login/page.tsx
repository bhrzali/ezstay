'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'

const getApiUrl = () => {
  // In browser, use empty string if served from backend, otherwise use localhost:8000
  if (typeof window !== 'undefined') {
    // If NEXT_PUBLIC_API_URL is set, use it; otherwise default to localhost:8000 for dev
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
}

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const apiUrl = getApiUrl()
      console.log('API URL:', apiUrl)
      console.log('Attempting login for:', username)
      
      // OAuth2 expects URL-encoded form data
      const params = new URLSearchParams()
      params.append('username', username)
      params.append('password', password)

      const response = await axios.post(
        `${apiUrl}/api/auth/token`,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )

      console.log('Login successful, token received')
      localStorage.setItem('token', response.data.access_token)
      router.push('/')
      router.refresh() // Force refresh to update the page
    } catch (err: any) {
      console.error('Login error:', err)
      console.error('Error response:', err.response)
      const errorMessage = err.response?.data?.detail || err.message || 'Login failed. Please check if the backend is running.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Sign in to EazyStay
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <Link href="/" className="text-sm text-blue-600 hover:text-blue-800">
              Back to home
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}


'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('kwame.admin@uberforclean.gh')
  const [password, setPassword] = useState('Admin1234!')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }
    setLoading(true)
    const sb = createClient()
    const { error } = await sb.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    router.push('/admin/overview')
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-[#001e2b] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#00ed64]/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-[#003d4f]/60 blur-3xl" />
      </div>

      <div className="relative w-full max-w-[400px]">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-[#001e2b] flex items-center justify-center mb-4 p-2">
              <Image src="/ufc-logo.svg" alt="Uber for Cleaning logo" width={40} height={40} className="w-full h-full invert" />
            </div>
            <h1 className="text-[22px] font-bold text-[#001e2b] tracking-tight">Uber for Cleaning</h1>
            <p className="text-sm text-[#7c8c9a] mt-1">Admin Portal</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#3d4f5b] mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a8b3bc]" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@uberforclean.gh"
                  className="w-full h-11 pl-10 pr-4 rounded-lg border border-[#c1ccd6] bg-white text-sm text-[#001e2b] placeholder:text-[#a8b3bc] focus:outline-none focus:ring-2 focus:ring-[#00684a]/30 focus:border-[#00684a] transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#3d4f5b] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a8b3bc]" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-11 pl-10 pr-11 rounded-lg border border-[#c1ccd6] bg-white text-sm text-[#001e2b] placeholder:text-[#a8b3bc] focus:outline-none focus:ring-2 focus:ring-[#00684a]/30 focus:border-[#00684a] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a8b3bc] hover:text-[#5c6c7a] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-full bg-[#00ed64] text-[#001e2b] font-semibold text-sm hover:bg-[#00c853] active:bg-[#008c34] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-[#a8b3bc] mt-6">
            Authorized personnel only. All activity is monitored.
          </p>
        </div>

        <p className="text-center text-xs text-white/30 mt-6">
          &copy; {new Date().getFullYear()} Uber for Cleaning · All rights reserved
        </p>
      </div>
    </main>
  )
}

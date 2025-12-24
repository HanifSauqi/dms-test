'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Load saved email on mount (NEVER save password!)
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');

    // Clean up any previously saved passwords (security fix)
    localStorage.removeItem('rememberedPassword');

    if (savedEmail) {
      setFormData(prev => ({
        ...prev,
        email: savedEmail
      }));
      setRememberMe(true);
    }
  }, []);

  // Check for timeout
  useEffect(() => {
    if (searchParams.get('timeout') === 'true') {
      setInfo('Your session has expired due to inactivity. Please log in again.');
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Save ONLY email if remember me is checked (NEVER save password!)
    if (rememberMe) {
      localStorage.setItem('rememberedEmail', formData.email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }

    const result = await login(formData.email, formData.password);

    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Panel - Industrial Background Image */}
      <div
        className="hidden lg:flex items-center justify-center bg-gradient-to-br from-orange-500 via-red-500 to-purple-600 relative overflow-hidden"
        style={{
          backgroundImage: 'linear-gradient(rgba(249, 115, 22, 0.3), rgba(220, 38, 38, 0.3)), url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1440 800\'%3E%3Cpath fill=\'%23000\' fill-opacity=\'0.1\' d=\'M0,320L48,314.7C96,309,192,299,288,293.3C384,288,480,288,576,293.3C672,299,768,309,864,309.3C960,309,1056,299,1152,266.7C1248,235,1344,181,1392,154.7L1440,128L1440,800L1392,800C1344,800,1248,800,1152,800C1056,800,960,800,864,800C768,800,672,800,576,800C480,800,384,800,288,800C192,800,96,800,48,800L0,800Z\'%3E%3C/path%3E%3C/svg%3E")',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="text-white text-center px-12 z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Parama Data Unit</h1>
          <p className="text-lg sm:text-xl opacity-90">Document Management System</p>
          <div className="mt-8 text-sm opacity-75">
            Secure, efficient, and intelligent document management
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-lg">
          {/* White Card Container */}
          <div className="bg-white rounded-2xl shadow-xl p-10 sm:p-12">
            {/* PDU Logo / Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16">
                  <Image
                    src="/Mask group.png"
                    alt="PDU Logo"
                    width={64}
                    height={64}
                    priority
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Welcome!
              </h2>
              <p className="text-sm text-gray-600">
                Please enter your details
              </p>
            </div>

            {/* Error and Info Messages */}
            {error && (
              <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}

            {info && (
              <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
                <div className="text-sm text-blue-800">{info}</div>
              </div>
            )}

            {/* Login Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-gray-900"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-gray-900"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-orange-600 hover:text-orange-500 transition-colors">
                    Forgot password?
                  </a>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Signing in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
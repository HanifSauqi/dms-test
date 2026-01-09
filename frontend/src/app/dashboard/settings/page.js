'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRightIcon, CpuChipIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'

// Settings menu items - add more items here for future settings
const settingsMenuItems = [
  {
    id: 'auto-classification',
    title: 'Auto Classification',
    description: 'Configure automatic document classification rules based on keywords',
    icon: CpuChipIcon,
    href: '/dashboard/settings/auto-classification',
    iconBgColor: 'bg-gradient-to-br from-orange-400 to-orange-600',
    hoverColor: 'hover:border-orange-300 hover:shadow-orange-100',
  },
  // Add more settings items here in the future
  // {
  //   id: 'general',
  //   title: 'General Settings',
  //   description: 'Configure general application settings',
  //   icon: Cog6ToothIcon,
  //   href: '/dashboard/settings/general',
  //   iconBgColor: 'bg-gradient-to-br from-blue-400 to-blue-600',
  //   hoverColor: 'hover:border-blue-300 hover:shadow-blue-100',
  // },
]

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <>
      {/* Breadcrumb */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-orange-600"
            >
              Home
            </button>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRightIcon className="w-4 h-4 text-gray-400 mx-1" />
              <span className="ml-1 text-sm font-medium text-gray-500">
                Settings
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure your document management preferences
        </p>
      </div>

      {/* Settings Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsMenuItems.map((item) => {
          const IconComponent = item.icon
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className={`group relative bg-white border border-gray-200 rounded-xl p-6 text-left transition-all duration-300 ease-in-out hover:shadow-lg ${item.hoverColor} focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2`}
            >
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${item.iconBgColor} shadow-lg mb-4 transition-transform duration-300 group-hover:scale-110`}>
                <IconComponent className="w-6 h-6 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                {item.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {item.description}
              </p>

              {/* Arrow indicator */}
              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ChevronRightIcon className="w-5 h-5 text-orange-500" />
              </div>

              {/* Hover gradient overlay */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
            </button>
          )
        })}
      </div>
    </>
  )
}
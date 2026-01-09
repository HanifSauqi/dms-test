'use client'

import { useAuth } from '@/contexts/AuthContext'
import ClassificationSettings from '@/components/ClassificationSettings'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function AutoClassificationPage() {
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
                            <button
                                onClick={() => router.push('/dashboard/settings')}
                                className="ml-1 text-sm font-medium text-gray-700 hover:text-orange-600"
                            >
                                Settings
                            </button>
                        </div>
                    </li>
                    <li>
                        <div className="flex items-center">
                            <ChevronRightIcon className="w-4 h-4 text-gray-400 mx-1" />
                            <span className="ml-1 text-sm font-medium text-gray-500">
                                Auto Classification
                            </span>
                        </div>
                    </li>
                </ol>
            </nav>

            {/* Header with back button */}
            <div className="mb-6">
                <div className="flex items-center gap-4 mb-2">
                    <button
                        onClick={() => router.push('/dashboard/settings')}
                        className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
                        aria-label="Back to Settings"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Auto Classification</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Set up rules to automatically classify documents based on keywords
                        </p>
                    </div>
                </div>
            </div>

            {/* Classification Settings Component */}
            <ClassificationSettings />
        </>
    )
}

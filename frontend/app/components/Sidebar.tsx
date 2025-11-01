'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface SidebarProps {
  user: any | null
  onSearch?: (params: any) => void
  searchParams?: {
    city?: string
    minPrice?: string
    maxPrice?: string
    availableFrom?: string
    availableTo?: string
    bedrooms?: string
    // Admin search params
    apartmentSearchText?: string
    bookingSearchText?: string
    bookingStatus?: string
    paymentStatus?: string
    activeTab?: 'apartments' | 'bookings'
  }
  searchMode?: 'apartments' | 'bookings' | 'both' // Admin can have both
}

export default function Sidebar({ user, onSearch, searchParams = {}, searchMode = 'apartments' }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const isAdminPage = pathname === '/admin'
  const [isOpen, setIsOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const navigatingRef = useRef(false)
  const [activeTab, setActiveTab] = useState<'apartments' | 'bookings'>(
    searchParams?.activeTab || 'apartments'
  )
  
  // Sync activeTab when searchParams.activeTab changes (from admin page)
  useEffect(() => {
    if (searchParams?.activeTab) {
      setActiveTab(searchParams.activeTab)
    }
  }, [searchParams?.activeTab])
  const [localSearchParams, setLocalSearchParams] = useState({
    city: searchParams?.city || '',
    minPrice: searchParams?.minPrice || '',
    maxPrice: searchParams?.maxPrice || '',
    availableFrom: searchParams?.availableFrom || '',
    availableTo: searchParams?.availableTo || '',
    bedrooms: searchParams?.bedrooms || '',
    apartmentSearchText: searchParams?.apartmentSearchText || '',
    bookingSearchText: searchParams?.bookingSearchText || '',
    bookingStatus: searchParams?.bookingStatus || '',
    paymentStatus: searchParams?.paymentStatus || '',
  })

  // Memoize searchParams to prevent unnecessary re-renders
  const memoizedSearchParams = useMemo(() => ({
    city: searchParams?.city || '',
    minPrice: searchParams?.minPrice || '',
    maxPrice: searchParams?.maxPrice || '',
    availableFrom: searchParams?.availableFrom || '',
    availableTo: searchParams?.availableTo || '',
    bedrooms: searchParams?.bedrooms || '',
    apartmentSearchText: searchParams?.apartmentSearchText || '',
    bookingSearchText: searchParams?.bookingSearchText || '',
    bookingStatus: searchParams?.bookingStatus || '',
    paymentStatus: searchParams?.paymentStatus || '',
  }), [
    searchParams?.city, searchParams?.minPrice, searchParams?.maxPrice,
    searchParams?.availableFrom, searchParams?.availableTo, searchParams?.bedrooms,
    searchParams?.apartmentSearchText, searchParams?.bookingSearchText,
    searchParams?.bookingStatus, searchParams?.paymentStatus
  ])

  // Sync local state when searchParams prop changes (only if values actually changed)
  useEffect(() => {
    setLocalSearchParams(memoizedSearchParams)
  }, [memoizedSearchParams])

  // Close sidebar on mobile when route changes
  useEffect(() => {
    setIsOpen(false)
    navigatingRef.current = false
  }, [pathname])

  const handleNavigation = useCallback((path: string) => {
    if (navigatingRef.current) {
      return // Already navigating, ignore
    }
    
    const currentPath = window.location.pathname
    if (path === currentPath) {
      // Already on this page, do nothing
      setIsOpen(false)
      return
    }
    
    navigatingRef.current = true
    setIsOpen(false)
    router.push(path)
  }, [router])

  const handleLogout = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    try {
      localStorage.removeItem('token')
      // Use window.location for more reliable navigation
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
      // Fallback to router if window.location fails
      router.push('/')
    }
  }

  const handleSearch = () => {
    if (onSearch) {
      onSearch(localSearchParams)
    }
  }

  const handleClearFilters = () => {
    const cleared = {
      city: '',
      minPrice: '',
      maxPrice: '',
      availableFrom: '',
      availableTo: '',
      bedrooms: '',
      apartmentSearchText: '',
      bookingSearchText: '',
      bookingStatus: '',
      paymentStatus: '',
    }
    setLocalSearchParams(cleared)
    if (onSearch) {
      onSearch(cleared)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setLocalSearchParams({
      ...localSearchParams,
      [field]: value
    })
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-[70] p-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
          style={{ pointerEvents: 'auto' }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white shadow-xl z-[60] w-80 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 flex flex-col`}
        style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
      >
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleNavigation('/')
              }}
              onMouseDown={(e) => {
                e.preventDefault()
                handleNavigation('/')
              }}
              className="text-2xl font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              EazyStay
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
              aria-label="Close menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className="flex items-center gap-3 pb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.username}</p>
                <p className="text-xs text-gray-500">{user.is_admin ? 'Administrator' : 'User'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleNavigation('/')
            }}
            onMouseDown={(e) => {
              e.preventDefault()
              handleNavigation('/')
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-left cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Home</span>
          </button>

          {user?.is_admin && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleNavigation('/admin')
              }}
              onMouseDown={(e) => {
                e.preventDefault()
                handleNavigation('/admin')
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-left cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Admin</span>
            </button>
          )}

          {user && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleNavigation('/bookings')
                }}
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleNavigation('/bookings')
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-left cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span>My Bookings</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleNavigation('/profile')
                }}
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleNavigation('/profile')
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-left cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Profile</span>
              </button>
            </>
          )}

          {!user && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleNavigation('/login')
              }}
              onMouseDown={(e) => {
                e.preventDefault()
                handleNavigation('/login')
              }}
              className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-left cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span>Login</span>
            </button>
          )}

          {user && (
            <button
              type="button"
              onClick={(e) => handleLogout(e)}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          )}
        </nav>

        {/* Search Section */}
        {onSearch && (
          <div className="p-4 border-t bg-gray-50">
            <div className="mb-4">
              {isAdminPage ? (
                <>
                  {/* Admin Search Tabs */}
                  <div className="flex gap-2 mb-4 border-b border-gray-200">
                    <button
                      onClick={() => {
                        setActiveTab('apartments')
                        // Notify parent about tab change
                        if (onSearch) {
                          onSearch({ ...localSearchParams, activeTab: 'apartments' })
                        }
                      }}
                      className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'apartments'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Apartments
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('bookings')
                        // Notify parent about tab change
                        if (onSearch) {
                          onSearch({ ...localSearchParams, activeTab: 'bookings' })
                        }
                      }}
                      className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'bookings'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Bookings
                    </button>
                  </div>
                </>
              ) : (
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Search Apartments</h3>
              )}

              {/* Apartment Search (Home page or Admin apartments tab) */}
              {(!isAdminPage || activeTab === 'apartments') && (
                <div>
                  {isAdminPage ? (
                    /* Admin Apartment Text Search */
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Search Apartments
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search by title, description, address, or city..."
                          value={localSearchParams.apartmentSearchText}
                          onChange={(e) => handleInputChange('apartmentSearchText', e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    /* Home Page City Search */
                    <div className="mb-3">
                      <input
                        type="text"
                        placeholder="Search by city..."
                        value={localSearchParams.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  {/* Only show advanced filters on home page, not admin */}
                  {!isAdminPage && (
                    <>
                      {/* Toggle Filters */}
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors mb-3"
                      >
                        <span className="text-sm font-medium">
                          {showFilters ? 'Hide' : 'Show'} Advanced Filters
                        </span>
                        <svg
                          className={`w-4 h-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Advanced Filters */}
                      {showFilters && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Min Price ($/month)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 1000"
                      value={localSearchParams.minPrice}
                      onChange={(e) => handleInputChange('minPrice', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Max Price ($/month)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 5000"
                      value={localSearchParams.maxPrice}
                      onChange={(e) => handleInputChange('maxPrice', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Bedrooms (minimum)
                    </label>
                    <select
                      value={localSearchParams.bedrooms}
                      onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Any</option>
                      <option value="0">Studio (0)</option>
                      <option value="1">1+ Bedrooms</option>
                      <option value="2">2+ Bedrooms</option>
                      <option value="3">3+ Bedrooms</option>
                      <option value="4">4+ Bedrooms</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Available From
                    </label>
                    <input
                      type="date"
                      value={localSearchParams.availableFrom}
                      onChange={(e) => handleInputChange('availableFrom', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Available To
                    </label>
                    <input
                      type="date"
                      value={localSearchParams.availableTo}
                      onChange={(e) => handleInputChange('availableTo', e.target.value)}
                      min={localSearchParams.availableFrom || undefined}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Booking Search (Admin bookings tab) */}
              {isAdminPage && activeTab === 'bookings' && (
                <div>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Search Bookings
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by apartment, user, or payment reference..."
                        value={localSearchParams.bookingSearchText}
                        onChange={(e) => handleInputChange('bookingSearchText', e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Booking Status
                    </label>
                    <select
                      value={localSearchParams.bookingStatus}
                      onChange={(e) => handleInputChange('bookingStatus', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Payment Status
                    </label>
                    <select
                      value={localSearchParams.paymentStatus}
                      onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Payments</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="refunded">Refunded</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Search Actions */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleSearch}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search
                  </span>
                </button>
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}


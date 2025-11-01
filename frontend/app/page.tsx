'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import axios from 'axios'

const getApiUrl = () => {
  // In browser, default to localhost:8000 for development
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
}

interface Apartment {
  id: number
  title: string
  description: string | null
  address: string
  city: string
  price_per_month: number
  available_from: string
  available_to: string
  bedrooms: number
  bathrooms: number
}

function ApartmentCard({ apartment }: { apartment: Apartment }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const apiUrl = getApiUrl()

  useEffect(() => {
    // Fetch first image for the apartment
    const fetchImage = async () => {
      try {
        const imagesResponse = await axios.get(`${apiUrl}/api/apartments/${apartment.id}/images`)
        if (imagesResponse.data && imagesResponse.data.length > 0) {
          const firstImageId = imagesResponse.data[0].id
          setImageUrl(`${apiUrl}/api/apartments/${apartment.id}/images/${firstImageId}`)
        }
      } catch (error) {
        // No images available, that's okay
      }
    }
    fetchImage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apartment.id])

  return (
    <Link
      href={`/apartments/${apartment.id}`}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
    >
      {imageUrl && (
        <div className="h-48 bg-gray-200 overflow-hidden">
          <img
            src={imageUrl}
            alt={apartment.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2">{apartment.title}</h2>
        <p className="text-gray-600 mb-2">{apartment.address}, {apartment.city}</p>
        <div className="flex gap-4 text-sm text-gray-500 mb-3">
          <span>{apartment.bedrooms} beds</span>
          <span>{apartment.bathrooms} baths</span>
        </div>
        <p className="text-2xl font-bold text-blue-600">
          ${apartment.price_per_month}/month
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Available: {new Date(apartment.available_from).toLocaleDateString()} - {new Date(apartment.available_to).toLocaleDateString()}
        </p>
      </div>
    </Link>
  )
}

export default function Home() {
  const router = useRouter()
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchCity, setSearchCity] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [availableFrom, setAvailableFrom] = useState('')
  const [availableTo, setAvailableTo] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkAuth()
    fetchApartments()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        const apiUrl = getApiUrl()
        const response = await axios.get(`${apiUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setUser(response.data)
      }
    } catch (error) {
      localStorage.removeItem('token')
    }
  }

  const fetchApartments = async () => {
    try {
      const params: any = {}
      if (searchCity) params.city = searchCity
      if (minPrice) params.min_price = parseInt(minPrice)
      if (maxPrice) params.max_price = parseInt(maxPrice)
      if (availableFrom) params.available_from = availableFrom
      if (availableTo) params.available_to = availableTo
      if (bedrooms) params.bedrooms = parseInt(bedrooms)
      
      const apiUrl = getApiUrl()
      // Use trailing slash to match backend route
      const endpoint = `${apiUrl}/api/apartments/`
      console.log('Fetching apartments from:', endpoint)
      console.log('With params:', params)
      
      const response = await axios.get(endpoint, { params })
      console.log('Apartments response:', response.data)
      console.log('Number of apartments:', response.data?.length || 0)
      
      if (response.data && Array.isArray(response.data)) {
        setApartments(response.data)
      } else {
        console.error('Unexpected response format:', response.data)
        setApartments([])
      }
    } catch (error: any) {
      console.error('Error fetching apartments:', error)
      console.error('Error details:', error.response?.data)
      console.error('Error status:', error.response?.status)
      setApartments([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchApartments()
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              EazyStay
            </Link>
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {user.is_admin && (
                    <Link
                      href="/admin"
                      className="px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Admin</span>
                    </Link>
                  )}
                  <Link
                    href="/bookings"
                    className="px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <span>My Bookings</span>
                  </Link>
                  <Link
                    href="/profile"
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    title={`${user.username} - View Profile`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Find Your Perfect Apartment</h1>
          
          {/* Basic Search */}
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="Search by city..."
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              title={showFilters ? 'Hide Filters' : 'Show Filters'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showFilters ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                )}
              </svg>
            </button>
            <button
              onClick={handleSearch}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <h2 className="text-lg font-semibold mb-4">Advanced Filters</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Price ($/month)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 1000"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Price ($/month)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 5000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bedrooms (minimum)
                  </label>
                  <select
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Available From
                  </label>
                  <input
                    type="date"
                    value={availableFrom}
                    onChange={(e) => setAvailableFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Available To
                  </label>
                  <input
                    type="date"
                    value={availableTo}
                    onChange={(e) => setAvailableTo(e.target.value)}
                    min={availableFrom || undefined}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    setMinPrice('')
                    setMaxPrice('')
                    setAvailableFrom('')
                    setAvailableTo('')
                    setBedrooms('')
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apartments.map((apartment) => (
            <ApartmentCard key={apartment.id} apartment={apartment} />
          ))}
        </div>

        {apartments.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No apartments found</p>
          </div>
        )}
      </main>
    </div>
  )
}


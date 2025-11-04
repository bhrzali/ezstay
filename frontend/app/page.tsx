'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import axios from 'axios'
import Sidebar from './components/Sidebar'
import { getApiUrlSync } from './utils/api-config'

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
  const apiUrl = getApiUrlSync()

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
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useState({
    city: '',
    minPrice: '',
    maxPrice: '',
    availableFrom: '',
    availableTo: '',
    bedrooms: '',
  })
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkAuth()
    fetchApartments(searchParams)
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        const apiUrl = getApiUrlSync()
        const response = await axios.get(`${apiUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setUser(response.data)
      }
    } catch (error) {
      localStorage.removeItem('token')
    }
  }

  const fetchApartments = async (params: typeof searchParams) => {
    setLoading(true)
    try {
      const apiParams: any = {}
      if (params.city) apiParams.city = params.city
      if (params.minPrice) apiParams.min_price = parseInt(params.minPrice)
      if (params.maxPrice) apiParams.max_price = parseInt(params.maxPrice)
      if (params.availableFrom) apiParams.available_from = params.availableFrom
      if (params.availableTo) apiParams.available_to = params.availableTo
      if (params.bedrooms) apiParams.bedrooms = parseInt(params.bedrooms)
      
      const apiUrl = getApiUrlSync()
      const endpoint = `${apiUrl}/api/apartments/`
      
      const response = await axios.get(endpoint, { params: apiParams })
      
      if (response.data && Array.isArray(response.data)) {
        setApartments(response.data)
      } else {
        setApartments([])
      }
    } catch (error: any) {
      console.error('Error fetching apartments:', error)
      setApartments([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (newParams: typeof searchParams) => {
    setSearchParams(newParams)
    fetchApartments(newParams)
  }

  // Memoize searchParams to prevent Sidebar re-renders (must be before any conditional returns)
  const memoizedSearchParams = useMemo(() => searchParams, [
    searchParams.city,
    searchParams.minPrice,
    searchParams.maxPrice,
    searchParams.availableFrom,
    searchParams.availableTo,
    searchParams.bedrooms
  ])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Sidebar user={user} onSearch={handleSearch} searchParams={memoizedSearchParams} />
      
      <main className="lg:ml-80 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Find Your Perfect Apartment</h1>
            
            {apartments.length > 0 && (
              <p className="text-gray-600">
                Found {apartments.length} apartment{apartments.length !== 1 ? 's' : ''}
              </p>
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
              <p className="text-gray-400 text-sm mt-2">Try adjusting your search filters</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}


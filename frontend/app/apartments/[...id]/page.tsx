'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import Sidebar from '../../components/Sidebar'

// Required for static export with dynamic routes
// Returns empty array so routing is handled client-side
export async function generateStaticParams() {
  return []
}

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

interface Image {
  id: number
  image_name: string | null
}

export default function ApartmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [apartment, setApartment] = useState<Apartment | null>(null)
  const [images, setImages] = useState<Image[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [bookingDates, setBookingDates] = useState({
    check_in: '',
    check_out: ''
  })
  const [bookingError, setBookingError] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState('')
  const [calculatingPrice, setCalculatingPrice] = useState(false)
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null)

  useEffect(() => {
    checkAuth()
    if (params.id) {
      fetchApartment()
      fetchImages()
    }
  }, [params.id])

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
      // User not logged in
    }
  }

  const calculatePrice = async () => {
    if (!bookingDates.check_in || !bookingDates.check_out || !apartment) return
    
    const checkIn = new Date(bookingDates.check_in)
    const checkOut = new Date(bookingDates.check_out)
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    
    if (nights > 0) {
      const price = Math.ceil((apartment.price_per_month / 30) * nights)
      setEstimatedPrice(price)
    } else {
      setEstimatedPrice(null)
    }
  }

  useEffect(() => {
    if (bookingDates.check_in && bookingDates.check_out) {
      calculatePrice()
    }
  }, [bookingDates.check_in, bookingDates.check_out])

  const fetchApartment = async () => {
    try {
      const apiUrl = getApiUrl()
      const response = await axios.get(`${apiUrl}/api/apartments/${params.id}`)
      setApartment(response.data)
    } catch (error) {
      console.error('Error fetching apartment:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchImages = async () => {
    try {
      const apiUrl = getApiUrl()
      const response = await axios.get(`${apiUrl}/api/apartments/${params.id}/images`)
      setImages(response.data)
    } catch (error) {
      console.error('Error fetching images:', error)
    }
  }

  const getImageUrl = (imageId: number) => {
    const apiUrl = getApiUrl()
    return `${apiUrl}/api/apartments/${params.id}/images/${imageId}`
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBookingError('')
    setBookingSuccess('')

    if (!user) {
      setBookingError('Please login to book an apartment')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const apiUrl = getApiUrl()
      
      const response = await axios.post(
        `${apiUrl}/api/bookings/`,
        {
          apartment_id: apartment!.id,
          check_in_date: bookingDates.check_in,
          check_out_date: bookingDates.check_out
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      setBookingSuccess(`Booking confirmed! Payment Reference: ${response.data.payment_reference}`)
      setBookingDates({ check_in: '', check_out: '' })
      setShowBookingForm(false)
      
      // Redirect to bookings page after 2 seconds
      setTimeout(() => {
        router.push('/bookings')
      }, 2000)
    } catch (err: any) {
      setBookingError(err.response?.data?.detail || 'Failed to create booking')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!apartment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Apartment not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Sidebar user={user} />
      
      <main className="lg:ml-80 overflow-x-hidden bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h1 className="text-3xl font-bold mb-4">{apartment.title}</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {images.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-3">Images</h2>
                  <div className="grid grid-cols-2 gap-2">
                    {images.map((img) => (
                      <img
                        key={img.id}
                        src={getImageUrl(img.id)}
                        alt={img.image_name || 'Apartment image'}
                        className="w-full h-48 object-cover rounded"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-3">Details</h2>
                <div className="space-y-2 text-gray-700">
                  <p><span className="font-medium">Address:</span> {apartment.address}</p>
                  <p><span className="font-medium">City:</span> {apartment.city}</p>
                  <p><span className="font-medium">Bedrooms:</span> {apartment.bedrooms}</p>
                  <p><span className="font-medium">Bathrooms:</span> {apartment.bathrooms}</p>
                  <p className="text-2xl font-bold text-blue-600 mt-4">
                    ${apartment.price_per_month}/month
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">Availability</h2>
                <div className="text-gray-700">
                  <p>
                    <span className="font-medium">From:</span>{' '}
                    {new Date(apartment.available_from).toLocaleDateString()}
                  </p>
                  <p>
                    <span className="font-medium">To:</span>{' '}
                    {new Date(apartment.available_to).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {apartment.description && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-3">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{apartment.description}</p>
              </div>
            )}

            {user && !showBookingForm && (
              <div className="mt-6">
                <button
                  onClick={() => setShowBookingForm(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Book This Apartment
                </button>
              </div>
            )}

            {!user && (
              <div className="mt-6">
                <Link
                  href="/login"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Login to Book
                </Link>
              </div>
            )}

            {showBookingForm && user && (
              <div className="mt-6 border-t pt-6">
                <h2 className="text-2xl font-semibold mb-4">Book This Apartment</h2>
                
                {bookingError && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {bookingError}
                  </div>
                )}

                {bookingSuccess && (
                  <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                    {bookingSuccess}
                  </div>
                )}

                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Check-in Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={bookingDates.check_in}
                        onChange={(e) => setBookingDates({ ...bookingDates, check_in: e.target.value })}
                        min={new Date(apartment.available_from).toISOString().split('T')[0]}
                        max={new Date(apartment.available_to).toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Check-out Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={bookingDates.check_out}
                        onChange={(e) => setBookingDates({ ...bookingDates, check_out: e.target.value })}
                        min={bookingDates.check_in || new Date(apartment.available_from).toISOString().split('T')[0]}
                        max={new Date(apartment.available_to).toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {estimatedPrice && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Estimated Total:</p>
                      <p className="text-2xl font-bold text-blue-600">${estimatedPrice}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Payment will be processed automatically (demo mode)
                      </p>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Confirm Booking & Pay
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowBookingForm(false)
                        setBookingError('')
                        setBookingSuccess('')
                        setBookingDates({ check_in: '', check_out: '' })
                      }}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
        </div>
      </main>
    </div>
  )
}


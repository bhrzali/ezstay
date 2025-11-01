'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import Sidebar from '../components/Sidebar'

const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
}

interface Booking {
  id: number
  apartment_id: number
  user_id: number
  check_in_date: string
  check_out_date: string
  total_price: number
  payment_status: string
  booking_status: string
  payment_reference: string | null
  created_at: string
}

interface Apartment {
  id: number
  title: string
  city: string
}

export default function BookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [apartments, setApartments] = useState<Record<number, Apartment>>({})
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      fetchBookings()
    }
  }, [user])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }
      const apiUrl = getApiUrl()
      const response = await axios.get(`${apiUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(response.data)
    } catch (error) {
      localStorage.removeItem('token')
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = getApiUrl()
      const response = await axios.get(`${apiUrl}/api/bookings/me/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setBookings(response.data)

      // Fetch apartment details for each booking
      const apartmentIds: number[] = Array.from(new Set<number>(response.data.map((b: Booking) => b.apartment_id)))
      const apartmentPromises = apartmentIds.map(async (id: number) => {
        try {
          const aptResponse = await axios.get(`${apiUrl}/api/apartments/${id}`)
          return { id, apartment: aptResponse.data }
        } catch {
          return null
        }
      })
      const apartmentResults = await Promise.all(apartmentPromises)
      const apartmentMap: Record<number, Apartment> = {}
      apartmentResults.forEach(result => {
        if (result) {
          apartmentMap[result.id] = result.apartment
        }
      })
      setApartments(apartmentMap)
    } catch (error) {
      console.error('Error fetching bookings:', error)
    }
  }

  const handleCancel = async (bookingId: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const apiUrl = getApiUrl()
      await axios.delete(`${apiUrl}/api/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchBookings()
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to cancel booking')
    }
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
      <Sidebar user={user} />
      
      <main className="lg:ml-80 overflow-x-hidden bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">My Bookings</h1>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500 text-lg mb-4">You haven't made any bookings yet.</p>
            <Link
              href="/"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Browse Apartments
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const apartment = apartments[booking.apartment_id]
              const canCancel = booking.booking_status === 'confirmed' || booking.booking_status === 'pending'

              return (
                <div key={booking.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold mb-2">
                        {apartment ? apartment.title : `Apartment #${booking.apartment_id}`}
                      </h2>
                      {apartment && (
                        <p className="text-gray-600 mb-4">{apartment.city}</p>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Check-in</p>
                          <p className="font-medium">
                            {new Date(booking.check_in_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Check-out</p>
                          <p className="font-medium">
                            {new Date(booking.check_out_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Status: </span>
                          <span className={`font-medium ${
                            booking.booking_status === 'confirmed' ? 'text-green-600' :
                            booking.booking_status === 'cancelled' ? 'text-red-600' :
                            'text-yellow-600'
                          }`}>
                            {booking.booking_status.charAt(0).toUpperCase() + booking.booking_status.slice(1)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Payment: </span>
                          <span className={`font-medium ${
                            booking.payment_status === 'completed' ? 'text-green-600' :
                            booking.payment_status === 'refunded' ? 'text-blue-600' :
                            'text-yellow-600'
                          }`}>
                            {booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="text-2xl font-bold text-blue-600">
                          ${booking.total_price}
                        </p>
                        {booking.payment_reference && (
                          <p className="text-sm text-gray-500 mt-1">
                            Payment Ref: {booking.payment_reference}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {canCancel && (
                        <button
                          onClick={() => handleCancel(booking.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                        >
                          Cancel Booking
                        </button>
                      )}
                      <Link
                        href={`/apartments/${booking.apartment_id}`}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm text-center"
                      >
                        View Apartment
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        </div>
      </main>
    </div>
  )
}


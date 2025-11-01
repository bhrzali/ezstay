'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'

const getApiUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
}

interface Apartment {
  id: number
  title: string
  price_per_month: number
  available_from: string
  available_to: string
}

interface BookingFormProps {
  apartment: Apartment
}

export default function BookingForm({ apartment }: BookingFormProps) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [bookingDates, setBookingDates] = useState({
    check_in: '',
    check_out: ''
  })
  const [bookingError, setBookingError] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState('')
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (bookingDates.check_in && bookingDates.check_out) {
      calculatePrice()
    }
  }, [bookingDates.check_in, bookingDates.check_out])

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

  const calculatePrice = () => {
    if (!bookingDates.check_in || !bookingDates.check_out) return
    
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
          apartment_id: apartment.id,
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

  return (
    <>
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
    </>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Sidebar from '../components/Sidebar'

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

interface Booking {
  id: number
  apartment_id: number
  apartment_title: string | null
  user_id: number
  user_username: string | null
  check_in_date: string
  check_out_date: string
  total_price: number
  payment_status: string
  booking_status: string
  payment_reference: string | null
  created_at: string
}

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [activeTab, setActiveTab] = useState<'apartments' | 'bookings'>('apartments')
  const [showForm, setShowForm] = useState(false)
  const [editingApartment, setEditingApartment] = useState<Apartment | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    city: '',
    price_per_month: '',
    available_from: '',
    available_to: '',
    bedrooms: '',
    bathrooms: '',
  })
  const [images, setImages] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<Array<{id: number, image_name: string | null}>>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user && user.is_admin) {
      fetchApartments()
      fetchBookings()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        router.push('/login')
        return
      }
      const apiUrl = getApiUrl()
      const response = await axios.get(`${apiUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.data.is_admin) {
        setLoading(false)
        router.push('/')
        return
      }
      setUser(response.data)
      setLoading(false)
    } catch (error) {
      localStorage.removeItem('token')
      setLoading(false)
      router.push('/login')
    }
  }

  const fetchApartments = async () => {
    try {
      const apiUrl = getApiUrl()
      const response = await axios.get(`${apiUrl}/api/apartments/`)
      setApartments(response.data)
    } catch (error) {
      console.error('Error fetching apartments:', error)
    }
  }

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = getApiUrl()
      const response = await axios.get(`${apiUrl}/api/admin/bookings/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setBookings(response.data)
    } catch (error) {
      console.error('Error fetching bookings:', error)
    }
  }

  const fetchBookingDetails = async (bookingId: number) => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = getApiUrl()
      const response = await axios.get(`${apiUrl}/api/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSelectedBooking(response.data)
      setShowBookingModal(true)
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to fetch booking details')
    }
  }

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const apiUrl = getApiUrl()
      await axios.delete(`${apiUrl}/api/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSuccess('Booking cancelled successfully')
      fetchBookings()
      if (selectedBooking?.id === bookingId) {
        setShowBookingModal(false)
        setSelectedBooking(null)
      }
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to cancel booking')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('token')
      const apiUrl = getApiUrl()

      if (editingApartment) {
        // Update existing apartment
        const updateData = {
          title: formData.title,
          description: formData.description || null,
          address: formData.address,
          city: formData.city,
          price_per_month: parseInt(formData.price_per_month),
          available_from: formData.available_from,
          available_to: formData.available_to,
          bedrooms: parseInt(formData.bedrooms),
          bathrooms: parseInt(formData.bathrooms),
        }
        await axios.put(
          `${apiUrl}/api/admin/apartments/${editingApartment.id}`,
          updateData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )
        
        // Add new images if any
        if (images.length > 0) {
          const formDataToSend = new FormData()
          images.forEach((image) => {
            formDataToSend.append('images', image)
          })
          await axios.post(
            `${apiUrl}/api/admin/apartments/${editingApartment.id}/images`,
            formDataToSend,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
              },
            }
          )
        }
        
        setSuccess('Apartment updated successfully!')
      } else {
        // Create new apartment
        const formDataToSend = new FormData()
        Object.entries(formData).forEach(([key, value]) => {
          if (value) formDataToSend.append(key, value)
        })
        images.forEach((image) => {
          formDataToSend.append('images', image)
        })

        await axios.post(`${apiUrl}/api/admin/apartments`, formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        })
        setSuccess('Apartment created successfully!')
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        address: '',
        city: '',
        price_per_month: '',
        available_from: '',
        available_to: '',
        bedrooms: '',
        bathrooms: '',
      })
      setImages([])
      setExistingImages([])
      setShowForm(false)
      setEditingApartment(null)
      fetchApartments() // Refresh list
    } catch (err: any) {
      setError(err.response?.data?.detail || `Failed to ${editingApartment ? 'update' : 'create'} apartment`)
    }
  }

  const fetchApartmentImages = async (apartmentId: number) => {
    try {
      const apiUrl = getApiUrl()
      const response = await axios.get(`${apiUrl}/api/apartments/${apartmentId}/images`)
      setExistingImages(response.data)
    } catch (error) {
      console.error('Error fetching apartment images:', error)
      setExistingImages([])
    }
  }

  const handleEdit = async (apartment: Apartment) => {
    setEditingApartment(apartment)
    setFormData({
      title: apartment.title,
      description: apartment.description || '',
      address: apartment.address,
      city: apartment.city,
      price_per_month: apartment.price_per_month.toString(),
      available_from: apartment.available_from.split('T')[0],
      available_to: apartment.available_to.split('T')[0],
      bedrooms: apartment.bedrooms.toString(),
      bathrooms: apartment.bathrooms.toString(),
    })
    setShowForm(true)
    setError('')
    setSuccess('')
    await fetchApartmentImages(apartment.id)
  }

  const handleDelete = async (apartmentId: number) => {
    if (!confirm('Are you sure you want to delete this apartment?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const apiUrl = getApiUrl()
      await axios.delete(`${apiUrl}/api/admin/apartments/${apartmentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setSuccess('Apartment deleted successfully!')
      fetchApartments() // Refresh list
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete apartment')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingApartment(null)
    setFormData({
      title: '',
      description: '',
      address: '',
      city: '',
      price_per_month: '',
      available_from: '',
      available_to: '',
      bedrooms: '',
      bathrooms: '',
    })
    setImages([])
    setExistingImages([])
    setError('')
    setSuccess('')
  }

  const handleDeleteImage = async (apartmentId: number, imageId: number) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const apiUrl = getApiUrl()
      await axios.delete(`${apiUrl}/api/admin/apartments/${apartmentId}/images/${imageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSuccess('Image deleted successfully')
      await fetchApartmentImages(apartmentId) // Refresh images list
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to delete image')
    }
  }

  const getImageUrl = (apartmentId: number, imageId: number) => {
    const apiUrl = getApiUrl()
    return `${apiUrl}/api/apartments/${apartmentId}/images/${imageId}`
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
      
      <main className="lg:ml-80 bg-gray-50 min-h-screen">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage apartments and bookings</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Apartments</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{apartments.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{bookings.length}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Confirmed Bookings</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {bookings.filter(b => b.booking_status === 'confirmed').length}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {error && !showForm && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}

          {success && !showForm && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-400 text-green-700 px-6 py-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {success}
              </div>
            </div>
          )}

          {!showForm ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveTab('apartments')}
                      className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                        activeTab === 'apartments'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                    >
                      Apartments
                    </button>
                    <button
                      onClick={() => setActiveTab('bookings')}
                      className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                        activeTab === 'bookings'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                    >
                      Bookings
                    </button>
                  </div>
                  {activeTab === 'apartments' && (
                    <button
                      onClick={() => setShowForm(true)}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add New Apartment
                    </button>
                  )}
                </div>
              </div>

              {/* Content Area */}
              <div className="p-6">
                {activeTab === 'bookings' ? (
                  <div>
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">All Bookings</h2>
                      <p className="text-sm text-gray-600 mt-1">Manage and view all booking reservations</p>
                    </div>
                    {bookings.length === 0 ? (
                      <div className="text-center py-16">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-gray-500 text-lg mt-4">No bookings found.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto -mx-6">
                        <div className="inline-block min-w-full align-middle">
                          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                                    Booking ID
                                  </th>
                                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                                    Apartment
                                  </th>
                                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                                    User
                                  </th>
                                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                                    Dates
                                  </th>
                                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                                    Price
                                  </th>
                                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                                    Status
                                  </th>
                                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                                    Payment
                                  </th>
                                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {bookings.map((booking) => (
                                  <tr key={booking.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => fetchBookingDetails(booking.id)}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className="text-sm font-semibold text-gray-900">#{booking.id}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="text-sm font-medium text-gray-900">{booking.apartment_title || `Apartment #${booking.apartment_id}`}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="text-sm text-gray-600">{booking.user_username || `User #${booking.user_id}`}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="text-sm text-gray-600">
                                        {new Date(booking.check_in_date).toLocaleDateString()} - {new Date(booking.check_out_date).toLocaleDateString()}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm font-bold text-blue-600">
                                        ${booking.total_price}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${
                                        booking.booking_status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                        booking.booking_status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {booking.booking_status}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${
                                        booking.payment_status === 'completed' ? 'bg-green-100 text-green-800' :
                                        booking.payment_status === 'refunded' ? 'bg-blue-100 text-blue-800' :
                                        'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {booking.payment_status}
                                      </span>
                                      {booking.payment_reference && (
                                        <div className="text-xs text-gray-500 mt-1 font-mono">
                                          {booking.payment_reference}
                                        </div>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => fetchBookingDetails(booking.id)}
                                          className="text-blue-600 hover:text-blue-800 font-semibold"
                                        >
                                          View
                                        </button>
                                        {(booking.booking_status === 'confirmed' || booking.booking_status === 'pending') && (
                                          <button
                                            onClick={() => handleCancelBooking(booking.id)}
                                            className="text-red-600 hover:text-red-800 font-semibold"
                                          >
                                            Cancel
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">Manage Apartments</h2>
                      <p className="text-sm text-gray-600 mt-1">View and manage all apartment listings</p>
                    </div>

                    {apartments.length === 0 ? (
                      <div className="text-center py-16">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <p className="text-gray-500 text-lg mt-4">No apartments found. Create your first apartment!</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto -mx-6">
                        <div className="inline-block min-w-full align-middle">
                          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                                    Title
                                  </th>
                                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                                    Location
                                  </th>
                                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                                    Price
                                  </th>
                                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                                    Details
                                  </th>
                                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {apartments.map((apartment) => (
                                  <tr key={apartment.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                      <div className="text-sm font-semibold text-gray-900">{apartment.title}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="text-sm font-medium text-gray-900">{apartment.city}</div>
                                      <div className="text-sm text-gray-500">{apartment.address}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm font-bold text-blue-600">
                                        ${apartment.price_per_month}<span className="text-gray-500 font-normal">/month</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="text-sm text-gray-600">
                                        <span className="font-medium">{apartment.bedrooms}</span> bed, <span className="font-medium">{apartment.bathrooms}</span> bath
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                                      <div className="flex gap-3">
                                        <button
                                          onClick={() => handleEdit(apartment)}
                                          className="text-blue-600 hover:text-blue-800 font-semibold"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => handleDelete(apartment.id)}
                                          className="text-red-600 hover:text-red-800 font-semibold"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingApartment ? 'Edit Apartment' : 'Add New Apartment'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {editingApartment ? 'Update apartment details' : 'Create a new apartment listing'}
                </p>
              </div>

              <div className="p-6">
                {error && (
                  <div className="mb-6 bg-red-50 border-l-4 border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      {error}
                    </div>
                  </div>
                )}

                {success && (
                  <div className="mb-6 bg-green-50 border-l-4 border-green-400 text-green-700 px-6 py-4 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {success}
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price/Month ($) *
                    </label>
                    <input
                      type="number"
                      name="price_per_month"
                      required
                      value={formData.price_per_month}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bedrooms *
                    </label>
                    <input
                      type="number"
                      name="bedrooms"
                      required
                      value={formData.bedrooms}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bathrooms *
                    </label>
                    <input
                      type="number"
                      name="bathrooms"
                      required
                      value={formData.bathrooms}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Available From *
                    </label>
                    <input
                      type="date"
                      name="available_from"
                      required
                      value={formData.available_from}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Available To *
                    </label>
                    <input
                      type="date"
                      name="available_to"
                      required
                      value={formData.available_to}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Images
                  </label>
                  
                  {/* Existing Images (when editing) */}
                  {editingApartment && existingImages.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Current Images:</p>
                      <div className="grid grid-cols-3 gap-4">
                        {existingImages.map((img) => (
                          <div key={img.id} className="relative group">
                            <img
                              src={getImageUrl(editingApartment.id, img.id)}
                              alt={img.image_name || 'Apartment image'}
                              className="w-full h-32 object-cover rounded-lg border border-gray-300"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteImage(editingApartment.id, img.id)}
                              className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete image"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add New Images */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {editingApartment ? 'Add New Images' : 'Upload Images'}
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    {images.length > 0 && (
                      <p className="mt-1 text-sm text-gray-500">
                        {images.length} new image(s) selected
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    {editingApartment ? 'Update Apartment' : 'Create Apartment'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
              </div>
            </div>
          )}
        </div>

        {/* Booking Details Modal */}
        {showBookingModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowBookingModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Booking Details</h2>
                <button
                  onClick={() => {
                    setShowBookingModal(false)
                    setSelectedBooking(null)
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Booking ID</h3>
                  <p className="text-lg font-semibold">#{selectedBooking.id}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Apartment</h3>
                    <p className="text-lg">{selectedBooking.apartment_title || `Apartment #${selectedBooking.apartment_id}`}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">User</h3>
                    <p className="text-lg">{selectedBooking.user_username || `User #${selectedBooking.user_id}`}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Check-in Date</h3>
                    <p className="text-lg">{new Date(selectedBooking.check_in_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Check-out Date</h3>
                    <p className="text-lg">{new Date(selectedBooking.check_out_date).toLocaleDateString()}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Total Price</h3>
                  <p className="text-2xl font-bold text-blue-600">${selectedBooking.total_price}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Booking Status</h3>
                    <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${
                      selectedBooking.booking_status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      selectedBooking.booking_status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedBooking.booking_status}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Payment Status</h3>
                    <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${
                      selectedBooking.payment_status === 'completed' ? 'bg-green-100 text-green-800' :
                      selectedBooking.payment_status === 'refunded' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedBooking.payment_status}
                    </span>
                  </div>
                </div>

                {selectedBooking.payment_reference && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Payment Reference</h3>
                    <p className="text-lg font-mono">{selectedBooking.payment_reference}</p>
                  </div>
                )}

                {selectedBooking.created_at && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Created At</h3>
                    <p className="text-lg">{new Date(selectedBooking.created_at).toLocaleString()}</p>
                  </div>
                )}

                <div className="flex gap-4 pt-4 border-t">
                  {(selectedBooking.booking_status === 'confirmed' || selectedBooking.booking_status === 'pending') && (
                    <button
                      onClick={() => handleCancelBooking(selectedBooking.id)}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Cancel Booking
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowBookingModal(false)
                      setSelectedBooking(null)
                    }}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </main>
    </div>
  )
}


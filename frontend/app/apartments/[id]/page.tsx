import { notFound } from 'next/navigation'
import Sidebar from '../../components/Sidebar'
import BookingForm from './BookingForm'

const getApiUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
}

export async function generateStaticParams() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const res = await fetch(`${apiUrl}/api/apartments/`)
    
    if (!res.ok) {
      return []
    }
    
    const apartments = await res.json()
    
    return apartments.map((apt: any) => ({
      id: apt.id.toString(),
    }))
  } catch (error) {
    console.error('Error fetching apartments for generateStaticParams:', error)
    return []
  }
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

export default async function ApartmentDetailPage({ params }: { params: { id: string } }) {
  const apiUrl = getApiUrl()
  
  // Fetch apartment data
  const apartmentRes = await fetch(`${apiUrl}/api/apartments/${params.id}`, {
    cache: 'no-store'
  })
  
  if (!apartmentRes.ok) {
    notFound()
  }
  
  const apartment: Apartment = await apartmentRes.json()
  
  // Fetch images
  let images: Image[] = []
  try {
    const imagesRes = await fetch(`${apiUrl}/api/apartments/${params.id}/images`, {
      cache: 'no-store'
    })
    if (imagesRes.ok) {
      images = await imagesRes.json()
    }
  } catch (error) {
    console.error('Error fetching images:', error)
  }

  const getImageUrl = (imageId: number) => {
    return `${apiUrl}/api/apartments/${params.id}/images/${imageId}`
  }

  return (
    <div className="min-h-screen">
      <Sidebar user={null} />
      
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

            <BookingForm apartment={apartment} />
          </div>
        </div>
        </div>
      </main>
    </div>
  )
}




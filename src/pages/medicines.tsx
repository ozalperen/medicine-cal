import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Layout from '@/components/Layout'
import { FiPlus, FiTrash2, FiClock } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface MedicineTime {
  id: string
  hour: number
  minute: number
}

interface Medicine {
  id: string
  name: string
  startDate: string
  endDate: string
  times: MedicineTime[]
}

export default function MedicinesPage() {
  const { data: session } = useSession()
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    times: [{ hour: 9, minute: 0 }]
  })

  useEffect(() => {
    if (session?.user) {
      fetchMedicines()
    }
  }, [session])

  const fetchMedicines = async () => {
    try {
      const response = await fetch('/api/medicines')
      if (response.ok) {
        const data = await response.json()
        setMedicines(data)
      }
    } catch (error) {
      console.error('Failed to fetch medicines:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Medicine added successfully!')
        setShowAddModal(false)
        setFormData({
          name: '',
          startDate: format(new Date(), 'yyyy-MM-dd'),
          endDate: format(new Date(), 'yyyy-MM-dd'),
          times: [{ hour: 9, minute: 0 }]
        })
        fetchMedicines()
      } else {
        toast.error('Failed to add medicine')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const deleteMedicine = async (id: string) => {
    if (!confirm('Are you sure you want to delete this medicine?')) return

    try {
      const response = await fetch(`/api/medicines/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Medicine deleted successfully!')
        fetchMedicines()
      } else {
        toast.error('Failed to delete medicine')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const addTime = () => {
    setFormData({
      ...formData,
      times: [...formData.times, { hour: 9, minute: 0 }]
    })
  }

  const removeTime = (index: number) => {
    setFormData({
      ...formData,
      times: formData.times.filter((_, i) => i !== index)
    })
  }

  const updateTime = (index: number, field: 'hour' | 'minute', value: number) => {
    const newTimes = [...formData.times]
    newTimes[index] = { ...newTimes[index], [field]: value }
    setFormData({ ...formData, times: newTimes })
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Medicines</h1>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <FiPlus className="mr-2" />
              Add Medicine
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : medicines.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No medicines added yet. Click "Add Medicine" to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {medicines.map((medicine) => (
                <div key={medicine.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{medicine.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {format(new Date(medicine.startDate), 'MMM d, yyyy')} - {format(new Date(medicine.endDate), 'MMM d, yyyy')}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {medicine.times.map((time, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                          >
                            <FiClock className="mr-1" />
                            {String(time.hour).padStart(2, '0')}:{String(time.minute).padStart(2, '0')}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteMedicine(medicine.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Medicine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Add Medicine</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Medicine Name
                  </label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Start Date
                    </label>
                    <input
                      type="date"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      End Date
                    </label>
                    <input
                      type="date"
                      required
                      min={formData.startDate}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Daily Times
                    </label>
                    <button
                      type="button"
                      onClick={addTime}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      Add Time
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.times.map((time, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="23"
                          required
                          className="w-20 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          value={time.hour}
                          onChange={(e) => updateTime(index, 'hour', parseInt(e.target.value))}
                        />
                        <span>:</span>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          required
                          className="w-20 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          value={time.minute}
                          onChange={(e) => updateTime(index, 'minute', parseInt(e.target.value))}
                        />
                        {formData.times.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTime(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Add Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}

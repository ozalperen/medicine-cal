import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'
import Layout from '@/components/Layout'
import { FiCheck, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'

interface IntakeWithMedicine {
  id: string
  date: string
  time: string
  taken: boolean
  takenAt: string | null
  medicine: {
    id: string
    name: string
  }
}

export default function HomePage() {
  const { data: session } = useSession()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [weekDates, setWeekDates] = useState<Date[]>([])
  const [intakes, setIntakes] = useState<IntakeWithMedicine[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 })
    const dates = Array.from({ length: 7 }, (_, i) => addDays(start, i))
    setWeekDates(dates)
  }, [selectedDate])

  useEffect(() => {
    if (session?.user && weekDates.length > 0) {
      fetchIntakes()
    }
  }, [weekDates, session])

  const fetchIntakes = async () => {
    if (weekDates.length === 0) return
    
    setLoading(true)
    try {
      const startDate = format(weekDates[0], 'yyyy-MM-dd')
      const endDate = format(weekDates[6], 'yyyy-MM-dd')
      
      const response = await fetch(`/api/intakes?startDate=${startDate}&endDate=${endDate}`)
      if (response.ok) {
        const data = await response.json()
        setIntakes(data)
      }
    } catch (error) {
      console.error('Failed to fetch intakes:', error)
      toast.error('Failed to load medicine schedule')
    } finally {
      setLoading(false)
    }
  }

  const toggleIntake = async (intakeId: string, taken: boolean) => {
    try {
      const response = await fetch(`/api/intakes/${intakeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taken })
      })

      if (response.ok) {
        toast.success(taken ? 'Marked as taken!' : 'Marked as pending')
        fetchIntakes()
      }
    } catch (error) {
      toast.error('Failed to update intake')
    }
  }

  const getIntakesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return intakes
      .filter(intake => intake.date === dateStr)
      .sort((a, b) => a.time.localeCompare(b.time))
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Medicine Calendar</h1>
          
          <div className="mb-6 flex justify-between items-center">
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, -7))}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Previous Week
            </button>
            <span className="text-lg font-medium">
              {format(weekDates[0] || selectedDate, 'MMM d')} - {format(weekDates[6] || selectedDate, 'MMM d, yyyy')}
            </span>
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, 7))}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Next Week
            </button>
          </div>

          <div className="grid grid-cols-7 gap-4 relative">
            {loading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                <div className="text-gray-500">Loading...</div>
              </div>
            )}
            {weekDates.map((date, index) => {
              const dayIntakes = getIntakesForDate(date)
              const isToday = isSameDay(date, new Date())

              return (
                <div
                  key={index}
                  className={`border rounded-lg p-4 min-h-[200px] ${
                    isToday ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                  }`}
                >
                  <div className="text-center mb-2">
                    <div className="text-sm text-gray-500">{format(date, 'EEE')}</div>
                    <div className={`text-lg font-semibold ${isToday ? 'text-primary-700' : 'text-gray-900'}`}>
                      {format(date, 'd')}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {dayIntakes.map((intake) => (
                      <div
                        key={intake.id}
                        className={`p-2 rounded text-xs ${
                          intake.taken ? 'bg-green-100' : 'bg-yellow-100'
                        }`}
                      >
                        <div className="font-medium">{intake.medicine.name}</div>
                        <div className="flex justify-between items-center mt-1">
                          <span>{intake.time}</span>
                          <button
                            onClick={() => toggleIntake(intake.id, !intake.taken)}
                            className="text-lg"
                          >
                            {intake.taken ? (
                              <FiCheck className="text-green-600" />
                            ) : (
                              <FiX className="text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Layout>
  )
}

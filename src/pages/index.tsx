import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { format, startOfWeek, addDays, isSameDay, startOfDay } from 'date-fns'
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
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check if mobile on mount and window resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // 768px is typical tablet breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (isMobile) {
      // For mobile: show 3 days centered on selected date
      const dates = Array.from({ length: 3 }, (_, i) => addDays(selectedDate, i - 1))
      setWeekDates(dates)
    } else {
      // For desktop: show full week
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 })
      const dates = Array.from({ length: 7 }, (_, i) => addDays(start, i))
      setWeekDates(dates)
    }
  }, [selectedDate, isMobile])

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
      const endDate = format(weekDates[weekDates.length - 1], 'yyyy-MM-dd')
      
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
        <div className="bg-white shadow rounded-lg p-3 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Medicine Calendar</h1>
            {session?.user?.name && (
              <div className="text-sm sm:text-base text-gray-600">
                Patient: <span className="font-medium">{session.user.name}</span>
              </div>
            )}
          </div>
          
          <div className="mb-6 flex justify-between items-center">
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, isMobile ? -3 : -7))}
              className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {isMobile ? 'Previous 3 Days' : 'Previous Week'}
            </button>
            <span className="text-sm sm:text-lg font-medium text-center">
              {format(weekDates[0] || selectedDate, 'MMM d')} - {format(weekDates[weekDates.length - 1] || selectedDate, 'MMM d, yyyy')}
            </span>
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, isMobile ? 3 : 7))}
              className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {isMobile ? 'Next 3 Days' : 'Next Week'}
            </button>
          </div>

          <div className={`grid ${isMobile ? 'grid-cols-3' : 'grid-cols-7'} gap-2 sm:gap-4 relative`}>
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
                  className={`border rounded-lg p-2 sm:p-4 min-h-[150px] sm:min-h-[200px] ${
                    isToday ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                  }`}
                >
                  <div className="text-center mb-2">
                    <div className="text-xs sm:text-sm text-gray-500">{format(date, 'EEE')}</div>
                    <div className={`text-sm sm:text-lg font-semibold ${isToday ? 'text-primary-700' : 'text-gray-900'}`}>
                      {format(date, 'd')}
                    </div>
                  </div>
                  
                  <div className="space-y-1 sm:space-y-2">
                    {dayIntakes.map((intake) => (
                      <div
                        key={intake.id}
                        className={`p-1 sm:p-2 rounded text-xs ${
                          intake.taken ? 'bg-green-100' : 'bg-yellow-100'
                        }`}
                      >
                        <div className="font-medium text-xs truncate">{intake.medicine.name}</div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs">{intake.time}</span>
                          <button
                            onClick={() => toggleIntake(intake.id, !intake.taken)}
                            className="text-sm sm:text-lg"
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

import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addDays, eachDayOfInterval, format } from 'date-fns'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  switch (req.method) {
    case 'GET':
      return getMedicines(req, res, session.user.id)
    case 'POST':
      return createMedicine(req, res, session.user.id)
    default:
      return res.status(405).json({ message: 'Method not allowed' })
  }
}

async function getMedicines(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const medicines = await prisma.medicine.findMany({
      where: { userId },
      include: {
        times: true
      },
      orderBy: { createdAt: 'desc' }
    })

    res.status(200).json(medicines)
  } catch (error) {
    console.error('Error fetching medicines:', error)
    res.status(500).json({ message: 'Failed to fetch medicines' })
  }
}

async function createMedicine(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  const { name, startDate, endDate, times } = req.body

  if (!name || !startDate || !endDate || !times || times.length === 0) {
    return res.status(400).json({ message: 'Missing required fields' })
  }

  try {
    // Create medicine with times
    const medicine = await prisma.medicine.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        userId,
        times: {
          create: times.map((time: { hour: number; minute: number }) => ({
            hour: time.hour,
            minute: time.minute
          }))
        }
      },
      include: {
        times: true
      }
    })

    // Create intake records for each day and time
    const days = eachDayOfInterval({
      start: new Date(startDate),
      end: new Date(endDate)
    })

    const intakeData = days.flatMap(day =>
      times.map((time: { hour: number; minute: number }) => ({
        date: day,
        time: `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`,
        medicineId: medicine.id,
        userId
      }))
    )

    await prisma.intake.createMany({
      data: intakeData,
      skipDuplicates: true
    })

    res.status(201).json(medicine)
  } catch (error) {
    console.error('Error creating medicine:', error)
    res.status(500).json({ message: 'Failed to create medicine' })
  }
}

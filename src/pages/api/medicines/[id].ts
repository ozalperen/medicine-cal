import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { eachDayOfInterval } from 'date-fns'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const medicineId = req.query.id as string

  switch (req.method) {
    case 'PUT':
      return updateMedicine(req, res, session.user.id, medicineId)
    case 'DELETE':
      return deleteMedicine(req, res, session.user.id, medicineId)
    default:
      return res.status(405).json({ message: 'Method not allowed' })
  }
}

async function updateMedicine(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  medicineId: string
) {
  const { name, startDate, endDate, times } = req.body

  if (!name || !startDate || !endDate || !times || times.length === 0) {
    return res.status(400).json({ message: 'Missing required fields' })
  }

  try {
    // Verify the medicine belongs to the user
    const existingMedicine = await prisma.medicine.findFirst({
      where: {
        id: medicineId,
        userId
      }
    })

    if (!existingMedicine) {
      return res.status(404).json({ message: 'Medicine not found' })
    }

    // Delete existing times and intakes
    await prisma.medicineTime.deleteMany({
      where: { medicineId }
    })
    await prisma.intake.deleteMany({
      where: { medicineId }
    })

    // Update medicine with new times
    const medicine = await prisma.medicine.update({
      where: { id: medicineId },
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
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

    // Create new intake records for each day and time
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

    res.status(200).json(medicine)
  } catch (error) {
    console.error('Error updating medicine:', error)
    res.status(500).json({ message: 'Failed to update medicine' })
  }
}

async function deleteMedicine(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  medicineId: string
) {
  try {
    // Verify the medicine belongs to the user
    const medicine = await prisma.medicine.findFirst({
      where: {
        id: medicineId,
        userId
      }
    })

    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' })
    }

    // Delete the medicine (cascades to times and intakes due to schema)
    await prisma.medicine.delete({
      where: { id: medicineId }
    })

    res.status(200).json({ message: 'Medicine deleted successfully' })
  } catch (error) {
    console.error('Error deleting medicine:', error)
    res.status(500).json({ message: 'Failed to delete medicine' })
  }
}

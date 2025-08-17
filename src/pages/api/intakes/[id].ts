import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const intakeId = req.query.id as string

  switch (req.method) {
    case 'PATCH':
      return updateIntake(req, res, session.user.id, intakeId)
    default:
      return res.status(405).json({ message: 'Method not allowed' })
  }
}

async function updateIntake(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  intakeId: string
) {
  const { taken } = req.body

  if (typeof taken !== 'boolean') {
    return res.status(400).json({ message: 'Invalid taken value' })
  }

  try {
    // Verify the intake belongs to the user
    const intake = await prisma.intake.findFirst({
      where: {
        id: intakeId,
        userId
      }
    })

    if (!intake) {
      return res.status(404).json({ message: 'Intake not found' })
    }

    // Update the intake
    const updatedIntake = await prisma.intake.update({
      where: { id: intakeId },
      data: {
        taken,
        takenAt: taken ? new Date() : null
      }
    })

    res.status(200).json(updatedIntake)
  } catch (error) {
    console.error('Error updating intake:', error)
    res.status(500).json({ message: 'Failed to update intake' })
  }
}

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

  switch (req.method) {
    case 'GET':
      return getIntakes(req, res, session.user.id)
    default:
      return res.status(405).json({ message: 'Method not allowed' })
  }
}

async function getIntakes(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  const { startDate, endDate } = req.query

  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'Start date and end date are required' })
  }

  try {
    const intakes = await prisma.intake.findMany({
      where: {
        userId,
        date: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        }
      },
      include: {
        medicine: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ]
    })

    // Format dates for consistency
    const formattedIntakes = intakes.map(intake => ({
      ...intake,
      date: intake.date.toISOString().split('T')[0]
    }))

    res.status(200).json(formattedIntakes)
  } catch (error) {
    console.error('Error fetching intakes:', error)
    res.status(500).json({ message: 'Failed to fetch intakes' })
  }
}

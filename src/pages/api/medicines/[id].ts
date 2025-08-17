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

  const medicineId = req.query.id as string

  switch (req.method) {
    case 'DELETE':
      return deleteMedicine(req, res, session.user.id, medicineId)
    default:
      return res.status(405).json({ message: 'Method not allowed' })
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

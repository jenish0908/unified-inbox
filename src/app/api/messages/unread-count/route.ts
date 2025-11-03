import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

/**
 * Get unread message count
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const unreadCount = await prisma.message.count({
      where: {
        direction: 'inbound',
        isRead: false,
      },
    })

    // Get unread count per contact
    const unreadByContact = await prisma.message.groupBy({
      by: ['contactId'],
      where: {
        direction: 'inbound',
        isRead: false,
      },
      _count: {
        id: true,
      },
    })

    return NextResponse.json({
      total: unreadCount,
      byContact: unreadByContact.reduce((acc, item) => {
        acc[item.contactId] = item._count.id
        return acc
      }, {} as Record<string, number>),
    })
  } catch (error) {
    console.error('Unread count error:', error)
    return NextResponse.json({ error: 'Failed to get unread count' }, { status: 500 })
  }
}


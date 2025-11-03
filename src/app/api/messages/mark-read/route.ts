import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { markReadSchema, validateRequest } from '@/lib/validation'

/**
 * Mark messages as read
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate request body
    const validation = await validateRequest(markReadSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { messageIds, contactId } = validation.data

    if (messageIds && Array.isArray(messageIds)) {
      // Mark specific messages as read
      await prisma.message.updateMany({
        where: {
          id: {
            in: messageIds,
          },
        },
        data: {
          isRead: true,
        },
      })
    } else if (contactId) {
      // Mark all messages from a contact as read
      await prisma.message.updateMany({
        where: {
          contactId,
          direction: 'inbound',
          isRead: false,
        },
        data: {
          isRead: true,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark read error:', error)
    return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 })
  }
}


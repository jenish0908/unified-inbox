import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getScheduledMessages, cancelScheduledMessage } from '@/lib/scheduler'

/**
 * Get all scheduled messages
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const messages = await getScheduledMessages()
    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Get scheduled messages error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scheduled messages' },
      { status: 500 }
    )
  }
}

/**
 * Cancel a scheduled message
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get('id')

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 })
    }

    const message = await cancelScheduledMessage(messageId)
    return NextResponse.json({ message })
  } catch (error) {
    console.error('Cancel scheduled message error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel scheduled message' },
      { status: 500 }
    )
  }
}


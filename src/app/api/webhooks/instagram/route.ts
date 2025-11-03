import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const VERIFY_TOKEN = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || 'instagram_webhook_verify_123'

/**
 * Webhook verification (GET request from Facebook)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  // Verify webhook
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Instagram webhook verified')
    return new NextResponse(challenge, { status: 200 })
  }

  console.error('Instagram webhook verification failed')
  return new NextResponse('Forbidden', { status: 403 })
}

/**
 * Handle incoming Instagram messages (POST request from Facebook)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('Instagram webhook received:', JSON.stringify(body, null, 2))

    // Verify it's an Instagram webhook
    if (body.object !== 'instagram') {
      return new NextResponse('Not an Instagram webhook', { status: 400 })
    }

    // Process each entry
    for (const entry of body.entry) {
      // Process messaging events
      if (entry.messaging) {
        for (const event of entry.messaging) {
          await handleMessagingEvent(event)
        }
      }

      // Process changes (for story mentions, comments, etc.)
      if (entry.changes) {
        for (const change of entry.changes) {
          await handleChange(change)
        }
      }
    }

    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('Instagram webhook error:', error)
    return new NextResponse('Error processing webhook', { status: 500 })
  }
}

/**
 * Handle messaging event
 */
async function handleMessagingEvent(event: any) {
  try {
    const senderId = event.sender.id
    const recipientId = event.recipient.id
    const timestamp = event.timestamp

    // Handle different message types
    if (event.message) {
      await handleMessage(senderId, event.message)
    } else if (event.postback) {
      await handlePostback(senderId, event.postback)
    } else if (event.read) {
      await handleRead(senderId, event.read)
    }
  } catch (error) {
    console.error('Error handling messaging event:', error)
  }
}

/**
 * Handle incoming message
 */
async function handleMessage(senderId: string, message: any) {
  try {
    let messageText = message.text || ''
    let mediaUrl: string | null = null

    // Handle attachments
    if (message.attachments && message.attachments.length > 0) {
      const attachment = message.attachments[0]
      mediaUrl = attachment.payload?.url || null
      
      // If no text, use attachment type as text
      if (!messageText) {
        messageText = `📎 ${attachment.type} attachment`
      }
    }

    // Find or create contact
    let contact = await prisma.contact.findFirst({
      where: {
        instagram: senderId,
      },
    })

    if (!contact) {
      // Try to get Instagram profile info
      // Note: This requires additional API call with proper permissions
      contact = await prisma.contact.create({
        data: {
          instagram: senderId,
          name: `Instagram User ${senderId.slice(-6)}`,
        },
      })
    }

    // Create message in database
    await prisma.message.create({
      data: {
        contactId: contact.id,
        channel: 'instagram',
        direction: 'inbound',
        content: messageText,
        status: 'delivered',
        mediaUrl: mediaUrl,
      },
    })

    console.log(`Instagram message saved from ${senderId}`)
  } catch (error) {
    console.error('Error handling Instagram message:', error)
  }
}

/**
 * Handle postback (button clicks, quick replies)
 */
async function handlePostback(senderId: string, postback: any) {
  try {
    const payload = postback.payload
    const title = postback.title

    console.log(`Instagram postback from ${senderId}: ${payload}`)

    // Find contact
    const contact = await prisma.contact.findFirst({
      where: {
        instagram: senderId,
      },
    })

    if (contact) {
      // Save postback as a message
      await prisma.message.create({
        data: {
          contactId: contact.id,
          channel: 'instagram',
          direction: 'inbound',
          content: `[Button Click] ${title || payload}`,
          status: 'delivered',
        },
      })
    }
  } catch (error) {
    console.error('Error handling Instagram postback:', error)
  }
}

/**
 * Handle read receipt
 */
async function handleRead(senderId: string, read: any) {
  try {
    // Mark messages as read in your database if needed
    console.log(`Instagram messages read by ${senderId}`)
  } catch (error) {
    console.error('Error handling Instagram read:', error)
  }
}

/**
 * Handle changes (story mentions, comments, etc.)
 */
async function handleChange(change: any) {
  try {
    const field = change.field
    const value = change.value

    console.log(`Instagram change event - ${field}:`, value)

    // Handle different types of changes
    // For now, just log them
    // You can extend this to handle story mentions, comments, etc.
  } catch (error) {
    console.error('Error handling Instagram change:', error)
  }
}


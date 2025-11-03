import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { sendSMS, sendWhatsApp } from '@/lib/twilio'
import { sendInstagramMessage } from '@/lib/instagram'
import { sendMessageSchema, validateRequest } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate request body
    const validation = await validateRequest(sendMessageSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { contactId, channel, content, scheduledFor } = validation.data
    const mediaUrl = body.mediaUrl // Optional media URL

    // Get contact details
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    let status = 'sent'
    let sendResult

    // If scheduled, don't send now
    if (scheduledFor) {
      status = 'scheduled'
    } else {
      // Send message based on channel
      if (channel === 'sms' && contact.phone) {
        sendResult = await sendSMS(contact.phone, content, mediaUrl)
        if (!sendResult.success) {
          status = 'failed'
        }
      } else if (channel === 'whatsapp' && contact.whatsapp) {
        sendResult = await sendWhatsApp(contact.whatsapp, content, mediaUrl)
        if (!sendResult.success) {
          status = 'failed'
        }
      } else if (channel === 'instagram' && contact.instagram) {
        sendResult = await sendInstagramMessage(contact.instagram, content, mediaUrl)
        if (!sendResult.success) {
          status = 'failed'
        }
      }
    }

    // Save message to database
    const message = await prisma.message.create({
      data: {
        contactId,
        channel,
        content,
        direction: 'outbound',
        status,
        sentById: session,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        mediaUrl: mediaUrl || null,
      },
      include: {
        contact: true,
        sentBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
import { prisma } from './prisma'
import { sendSMS, sendWhatsApp } from './twilio'
import { sendInstagramMessage } from './instagram'

/**
 * Process scheduled messages that are due to be sent
 * This should be called periodically (e.g., every minute via cron job)
 */
export async function processScheduledMessages() {
  try {
    const now = new Date()

    // Find all scheduled messages that are due
    const scheduledMessages = await prisma.message.findMany({
      where: {
        status: 'scheduled',
        scheduledFor: {
          lte: now,
        },
      },
      include: {
        contact: true,
      },
    })

    console.log(`Processing ${scheduledMessages.length} scheduled messages`)

    for (const message of scheduledMessages) {
      try {
        let sendResult

        // Send based on channel
        if (message.channel === 'sms' && message.contact.phone) {
          sendResult = await sendSMS(message.contact.phone, message.content, message.mediaUrl || undefined)
        } else if (message.channel === 'whatsapp' && message.contact.whatsapp) {
          sendResult = await sendWhatsApp(message.contact.whatsapp, message.content, message.mediaUrl || undefined)
        } else if (message.channel === 'instagram' && message.contact.instagram) {
          sendResult = await sendInstagramMessage(message.contact.instagram, message.content, message.mediaUrl || undefined)
        } else {
          // No valid channel/contact info
          await prisma.message.update({
            where: { id: message.id },
            data: { status: 'failed' },
          })
          continue
        }

        // Update message status
        await prisma.message.update({
          where: { id: message.id },
          data: {
            status: sendResult?.success ? 'sent' : 'failed',
          },
        })

        console.log(`Sent scheduled message ${message.id}: ${sendResult?.success}`)
      } catch (error) {
        console.error(`Failed to send scheduled message ${message.id}:`, error)
        await prisma.message.update({
          where: { id: message.id },
          data: { status: 'failed' },
        })
      }
    }

    return { processed: scheduledMessages.length }
  } catch (error) {
    console.error('Error processing scheduled messages:', error)
    throw error
  }
}

/**
 * Get upcoming scheduled messages
 */
export async function getScheduledMessages() {
  return prisma.message.findMany({
    where: {
      status: 'scheduled',
      scheduledFor: {
        gt: new Date(),
      },
    },
    include: {
      contact: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
      sentBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      scheduledFor: 'asc',
    },
  })
}

/**
 * Cancel a scheduled message
 */
export async function cancelScheduledMessage(messageId: string) {
  return prisma.message.update({
    where: { id: messageId },
    data: { status: 'cancelled' },
  })
}


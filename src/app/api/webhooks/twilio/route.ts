import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const from = formData.get('From') as string
    const to = formData.get('To') as string
    const body = formData.get('Body') as string
    const messageSid = formData.get('MessageSid') as string
    const numMedia = formData.get('NumMedia') as string
    
    // Handle multiple media attachments
    const numMediaCount = parseInt(numMedia || '0')
    const mediaUrls: string[] = []
    const mediaContentTypes: string[] = []
    
    for (let i = 0; i < numMediaCount; i++) {
      const mediaUrl = formData.get(`MediaUrl${i}`) as string | null
      const mediaContentType = formData.get(`MediaContentType${i}`) as string | null
      
      if (mediaUrl) {
        mediaUrls.push(mediaUrl)
        if (mediaContentType) {
          mediaContentTypes.push(mediaContentType)
        }
      }
    }
    
    // Store the first media URL (for backward compatibility)
    const mediaUrl = mediaUrls.length > 0 ? mediaUrls[0] : null

    // Determine channel (SMS or WhatsApp)
    const channel = from.startsWith('whatsapp:') ? 'whatsapp' : 'sms'
    
    // Clean phone numbers
    const cleanFrom = from.replace('whatsapp:', '')
    const cleanTo = to.replace('whatsapp:', '')

    // Find or create contact
    let contact = await prisma.contact.findFirst({
      where: {
        OR: [
          { phone: cleanFrom },
          { whatsapp: cleanFrom },
        ],
      },
    })

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          phone: channel === 'sms' ? cleanFrom : undefined,
          whatsapp: channel === 'whatsapp' ? cleanFrom : undefined,
          name: cleanFrom, // Default name to phone number
        },
      })
    }

    // Create message with media
    await prisma.message.create({
      data: {
        contactId: contact.id,
        channel,
        direction: 'inbound',
        content: body || (numMediaCount > 0 ? `📎 ${numMediaCount} attachment(s)` : ''),
        status: 'delivered',
        mediaUrl: mediaUrl,
      },
    })
    
    console.log(`Received message from ${from} via ${channel}`, {
      hasMedia: numMediaCount > 0,
      mediaCount: numMediaCount,
      mediaTypes: mediaContentTypes,
    })

    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new NextResponse('Error processing webhook', { status: 500 })
  }
}
import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER

export const twilioClient = twilio(accountSid, authToken)

export async function sendSMS(to: string, message: string, mediaUrl?: string) {
  try {
    const messageData: any = {
      from: twilioPhoneNumber,
      to: to,
    }
    
    // Add media URL if provided (for MMS)
    if (mediaUrl) {
      messageData.mediaUrl = [mediaUrl]
      // Body is optional when media is present
      if (message && message.trim()) {
        messageData.body = message
      }
    } else {
      // Body is required for SMS without media
      messageData.body = message
    }
    
    const result = await twilioClient.messages.create(messageData)
    return { success: true, messageSid: result.sid }
  } catch (error) {
    console.error('SMS send error:', error)
    return { success: false, error }
  }
}

export async function sendWhatsApp(to: string, message: string, mediaUrl?: string) {
  try {
    const messageData: any = {
      from: `whatsapp:${twilioWhatsAppNumber}`,
      to: `whatsapp:${to}`,
    }
    
    // Add media URL if provided
    if (mediaUrl) {
      messageData.mediaUrl = [mediaUrl]
      // Body is optional when media is present
      if (message && message.trim()) {
        messageData.body = message
      }
    } else {
      // Body is required for WhatsApp without media
      messageData.body = message
    }
    
    const result = await twilioClient.messages.create(messageData)
    return { success: true, messageSid: result.sid }
  } catch (error) {
    console.error('WhatsApp send error:', error)
    return { success: false, error }
  }
}

/**
 * Get media content from Twilio
 */
export async function getMediaContent(mediaSid: string) {
  try {
    const media = await twilioClient.media(mediaSid).fetch()
    return {
      success: true,
      url: `https://api.twilio.com${media.uri.replace('.json', '')}`,
      contentType: media.contentType,
    }
  } catch (error) {
    console.error('Get media error:', error)
    return { success: false, error }
  }
}

/**
 * Supported media types for MMS/WhatsApp
 */
export const SUPPORTED_MEDIA_TYPES = {
  images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  videos: ['video/mp4', 'video/3gpp'],
  audio: ['audio/mpeg', 'audio/ogg', 'audio/amr'],
  documents: ['application/pdf', 'text/vcard', 'text/x-vcard'],
}

export function isMediaTypeSupported(contentType: string): boolean {
  return Object.values(SUPPORTED_MEDIA_TYPES).some((types) =>
    types.includes(contentType.toLowerCase())
  )
}
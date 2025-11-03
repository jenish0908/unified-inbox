/**
 * Instagram Direct Messaging Integration
 * Uses Facebook Graph API
 */

const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN
const INSTAGRAM_BUSINESS_ACCOUNT_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID
const GRAPH_API_VERSION = 'v18.0'
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`

export interface InstagramMessage {
  text?: string
  attachments?: Array<{
    type: 'image' | 'video' | 'audio' | 'file'
    payload: {
      url: string
    }
  }>
}

/**
 * Send Instagram Direct Message
 */
export async function sendInstagramMessage(
  recipientId: string,
  message: string,
  mediaUrl?: string
) {
  try {
    if (!INSTAGRAM_ACCESS_TOKEN) {
      throw new Error('Instagram access token not configured')
    }

    const messageData: any = {
      recipient: {
        id: recipientId,
      },
      messaging_type: 'RESPONSE', // Must be RESPONSE for messages within 24h window
    }

    // Send media if provided
    if (mediaUrl) {
      const mediaType = getMediaType(mediaUrl)
      messageData.message = {
        attachment: {
          type: mediaType,
          payload: {
            url: mediaUrl,
            is_reusable: true,
          },
        },
      }
      
      // Add caption if message provided
      if (message && message.trim()) {
        messageData.message.text = message
      }
    } else {
      // Text-only message
      messageData.message = {
        text: message,
      }
    }

    const response = await fetch(`${GRAPH_API_URL}/me/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${INSTAGRAM_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(messageData),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Instagram send error:', data)
      return {
        success: false,
        error: data.error?.message || 'Failed to send Instagram message',
      }
    }

    return {
      success: true,
      messageId: data.message_id,
    }
  } catch (error) {
    console.error('Instagram send error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get Instagram user profile
 */
export async function getInstagramProfile(userId: string) {
  try {
    if (!INSTAGRAM_ACCESS_TOKEN) {
      throw new Error('Instagram access token not configured')
    }

    const response = await fetch(
      `${GRAPH_API_URL}/${userId}?fields=name,username,profile_pic&access_token=${INSTAGRAM_ACCESS_TOKEN}`
    )

    const data = await response.json()

    if (!response.ok) {
      console.error('Get Instagram profile error:', data)
      return null
    }

    return {
      id: data.id,
      username: data.username,
      name: data.name,
      profilePic: data.profile_pic,
    }
  } catch (error) {
    console.error('Get Instagram profile error:', error)
    return null
  }
}

/**
 * Determine media type from URL
 */
function getMediaType(url: string): 'image' | 'video' | 'audio' | 'file' {
  const lowercaseUrl = url.toLowerCase()

  if (
    lowercaseUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
    lowercaseUrl.includes('image')
  ) {
    return 'image'
  }

  if (lowercaseUrl.match(/\.(mp4|mov|avi)$/i) || lowercaseUrl.includes('video')) {
    return 'video'
  }

  if (lowercaseUrl.match(/\.(mp3|wav|ogg)$/i) || lowercaseUrl.includes('audio')) {
    return 'audio'
  }

  return 'file'
}

/**
 * Check if messaging window is active (within 24 hours)
 */
export function isMessagingWindowActive(lastMessageTime: Date): boolean {
  const now = new Date()
  const diff = now.getTime() - new Date(lastMessageTime).getTime()
  const hours = diff / (1000 * 60 * 60)
  return hours < 24
}

/**
 * Supported Instagram media types
 */
export const INSTAGRAM_MEDIA_TYPES = {
  images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
  videos: ['video/mp4', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/wav'],
  files: ['application/pdf'],
}

/**
 * Instagram message size limits
 */
export const INSTAGRAM_SIZE_LIMITS = {
  image: 8 * 1024 * 1024, // 8MB
  video: 25 * 1024 * 1024, // 25MB
  audio: 25 * 1024 * 1024, // 25MB
  file: 25 * 1024 * 1024, // 25MB
}

/**
 * Validate access token
 */
export async function validateInstagramToken() {
  try {
    if (!INSTAGRAM_ACCESS_TOKEN) {
      return { valid: false, error: 'No access token configured' }
    }

    const response = await fetch(
      `${GRAPH_API_URL}/me?access_token=${INSTAGRAM_ACCESS_TOKEN}`
    )

    const data = await response.json()

    if (!response.ok) {
      return {
        valid: false,
        error: data.error?.message || 'Invalid token',
      }
    }

    return { valid: true, accountId: data.id }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}


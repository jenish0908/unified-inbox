import { z } from 'zod'

/**
 * Validation schemas for API requests
 */

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// Contact schemas
export const createContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional().nullable(),
  email: z.string().email('Invalid email').optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
})

export const updateContactSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Invalid email').optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
})

// Message schemas
export const sendMessageSchema = z.object({
  contactId: z.string().min(1, 'Contact ID is required'),
  channel: z.enum(['sms', 'whatsapp', 'email', 'instagram'], {
    errorMap: () => ({ message: 'Invalid channel' }),
  }),
  content: z.string().min(1, 'Message content is required'),
  scheduledFor: z.string().datetime().optional().nullable(),
})

export const markReadSchema = z.object({
  contactId: z.string().optional(),
  messageIds: z.array(z.string()).optional(),
}).refine(
  (data) => data.contactId || (data.messageIds && data.messageIds.length > 0),
  'Either contactId or messageIds must be provided'
)

// Note schemas
export const createNoteSchema = z.object({
  contactId: z.string().min(1, 'Contact ID is required'),
  content: z.string().min(1, 'Note content is required'),
  isPrivate: z.boolean().optional().default(false),
})

// Analytics schemas
export const analyticsQuerySchema = z.object({
  days: z.string().transform(Number).pipe(z.number().min(1).max(365)).optional(),
})

/**
 * Helper to validate request body
 */
export async function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const validated = await schema.parseAsync(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map((e) => e.message).join(', ')
      return { success: false, error: message }
    }
    return { success: false, error: 'Validation failed' }
  }
}


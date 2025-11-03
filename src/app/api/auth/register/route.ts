import { NextRequest, NextResponse } from 'next/server'
import { createUser, getUserByEmail } from '@/lib/auth'
import { registerSchema, validateRequest } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = await validateRequest(registerSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { email, password, name } = validation.data

    console.log('Registration attempt:', { email, name })

    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      console.log('User already exists:', email)
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    console.log('Creating new user...')
    const user = await createUser(email, password, name)
    console.log('User created successfully:', user.id)

    return NextResponse.json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name 
      } 
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ 
      error: 'Registration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
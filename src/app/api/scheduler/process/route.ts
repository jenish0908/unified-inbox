import { NextRequest, NextResponse } from 'next/server'
import { processScheduledMessages } from '@/lib/scheduler'

/**
 * API endpoint to process scheduled messages
 * Can be called by a cron job (e.g., Vercel Cron, external cron service)
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication via secret token
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await processScheduledMessages()

    return NextResponse.json({
      success: true,
      processed: result.processed,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Scheduler process error:', error)
    return NextResponse.json(
      { error: 'Failed to process scheduled messages' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check scheduler status
 */
export async function GET() {
  return NextResponse.json({
    status: 'active',
    timestamp: new Date().toISOString(),
  })
}


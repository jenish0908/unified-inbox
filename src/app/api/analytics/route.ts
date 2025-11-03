import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Total messages by channel
    const messagesByChannel = await prisma.message.groupBy({
      by: ['channel'],
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      _count: {
        id: true,
      },
    })

    // Total messages by direction
    const messagesByDirection = await prisma.message.groupBy({
      by: ['direction'],
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      _count: {
        id: true,
      },
    })

    // Messages by status
    const messagesByStatus = await prisma.message.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    })

    // Average response time (time between inbound and first outbound message)
    const conversations = await prisma.message.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        contactId: true,
        direction: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Calculate average response time
    const responseTimes: number[] = []
    const contactMap = new Map<string, { lastInbound: Date | null }>()

    conversations.forEach((msg) => {
      if (!contactMap.has(msg.contactId)) {
        contactMap.set(msg.contactId, { lastInbound: null })
      }

      const contact = contactMap.get(msg.contactId)!

      if (msg.direction === 'inbound') {
        contact.lastInbound = msg.createdAt
      } else if (msg.direction === 'outbound' && contact.lastInbound) {
        const responseTime = msg.createdAt.getTime() - contact.lastInbound.getTime()
        responseTimes.push(responseTime)
        contact.lastInbound = null // Reset after calculating
      }
    })

    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0

    // Messages per day for the chart
    const messagesPerDay = await prisma.$queryRaw<
      Array<{ date: Date; count: bigint }>
    >`
      SELECT 
        DATE(created_at) as date,
        COUNT(*)::bigint as count
      FROM "Message"
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `

    // Total contacts
    const totalContacts = await prisma.contact.count()

    // Active contacts (had at least 1 message in the period)
    const activeContacts = await prisma.contact.count({
      where: {
        messages: {
          some: {
            createdAt: {
              gte: startDate,
            },
          },
        },
      },
    })

    // New contacts in period
    const newContacts = await prisma.contact.count({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    })

    // Conversion metrics (contacts with both inbound and outbound messages)
    const contactsWithBothDirections = await prisma.contact.count({
      where: {
        AND: [
          {
            messages: {
              some: {
                direction: 'inbound',
                createdAt: {
                  gte: startDate,
                },
              },
            },
          },
          {
            messages: {
              some: {
                direction: 'outbound',
                createdAt: {
                  gte: startDate,
                },
              },
            },
          },
        ],
      },
    })

    const conversionRate = activeContacts > 0 
      ? (contactsWithBothDirections / activeContacts) * 100 
      : 0

    return NextResponse.json({
      analytics: {
        messagesByChannel: messagesByChannel.map((m) => ({
          channel: m.channel,
          count: m._count.id,
        })),
        messagesByDirection: messagesByDirection.map((m) => ({
          direction: m.direction,
          count: m._count.id,
        })),
        messagesByStatus: messagesByStatus.map((m) => ({
          status: m.status,
          count: m._count.id,
        })),
        averageResponseTime: Math.round(averageResponseTime / 1000 / 60), // Convert to minutes
        messagesPerDay: messagesPerDay.map((m) => ({
          date: m.date,
          count: Number(m.count),
        })),
        totalContacts,
        activeContacts,
        newContacts,
        conversionRate: Math.round(conversionRate * 10) / 10, // Round to 1 decimal
      },
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}


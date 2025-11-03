'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  TrendingUp,
  MessageSquare,
  Users,
  Clock,
  ArrowLeft,
  Download,
  Phone,
  Mail,
  Instagram,
  CheckCircle,
  XCircle,
  Loader,
} from 'lucide-react'

interface Analytics {
  messagesByChannel: Array<{ channel: string; count: number }>
  messagesByDirection: Array<{ direction: string; count: number }>
  messagesByStatus: Array<{ status: string; count: number }>
  averageResponseTime: number
  messagesPerDay: Array<{ date: string; count: number }>
  totalContacts: number
  activeContacts: number
  newContacts: number
  conversionRate: number
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    loadAnalytics()
  }, [days])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/analytics?days=${days}`)
      if (!res.ok) {
        router.push('/')
        return
      }
      const data = await res.json()
      setAnalytics(data.analytics)
    } catch (error) {
      console.error('Failed to load analytics', error)
    } finally {
      setLoading(false)
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'sms':
        return <Phone className="w-5 h-5" />
      case 'whatsapp':
        return <MessageSquare className="w-5 h-5" />
      case 'email':
        return <Mail className="w-5 h-5" />
      case 'instagram':
        return <Instagram className="w-5 h-5" />
      default:
        return <MessageSquare className="w-5 h-5" />
    }
  }

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'sms':
        return 'from-green-500 to-green-600'
      case 'whatsapp':
        return 'from-emerald-500 to-emerald-600'
      case 'email':
        return 'from-blue-500 to-blue-600'
      case 'instagram':
        return 'from-pink-500 to-pink-600'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  const exportData = () => {
    if (!analytics) return
    const dataStr = JSON.stringify(analytics, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `analytics-${new Date().toISOString()}.json`
    link.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <Loader className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No analytics data available</p>
      </div>
    )
  }

  const totalMessages =
    analytics.messagesByDirection.reduce((sum, m) => sum + m.count, 0) || 0
  const maxMessagesPerDay = Math.max(...analytics.messagesPerDay.map((d) => d.count), 1)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/inbox')}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Analytics Dashboard</h1>
                <p className="text-xs text-slate-500">Track engagement & performance</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>

            <button
              onClick={exportData}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm text-green-600 font-medium">
                +{analytics.messagesPerDay[analytics.messagesPerDay.length - 1]?.count || 0} today
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">{totalMessages}</h3>
            <p className="text-sm text-slate-600">Total Messages</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm text-green-600 font-medium">
                +{analytics.newContacts} new
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">
              {analytics.activeContacts}
            </h3>
            <p className="text-sm text-slate-600">Active Contacts</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm text-slate-500">avg</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">
              {analytics.averageResponseTime}m
            </h3>
            <p className="text-sm text-slate-600">Response Time</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm text-slate-500">rate</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">
              {analytics.conversionRate}%
            </h3>
            <p className="text-sm text-slate-600">Engagement Rate</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Messages by Channel */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Messages by Channel</h3>
            <div className="space-y-4">
              {analytics.messagesByChannel.map((channel) => {
                const percentage = totalMessages > 0 ? (channel.count / totalMessages) * 100 : 0
                return (
                  <div key={channel.channel}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 bg-gradient-to-br ${getChannelColor(
                            channel.channel
                          )} rounded-lg flex items-center justify-center text-white`}
                        >
                          {getChannelIcon(channel.channel)}
                        </div>
                        <span className="text-sm font-medium text-slate-700 capitalize">
                          {channel.channel}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-slate-800">
                        {channel.count}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`bg-gradient-to-r ${getChannelColor(
                          channel.channel
                        )} h-2 rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Message Direction */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Message Direction</h3>
            <div className="space-y-4">
              {analytics.messagesByDirection.map((dir) => {
                const percentage = totalMessages > 0 ? (dir.count / totalMessages) * 100 : 0
                return (
                  <div key={dir.direction}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700 capitalize">
                        {dir.direction}
                      </span>
                      <span className="text-sm font-semibold text-slate-800">{dir.count}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          dir.direction === 'inbound'
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                            : 'bg-gradient-to-r from-purple-500 to-purple-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Messages Over Time */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Messages Over Time</h3>
          <div className="flex items-end justify-between h-64 gap-2">
            {analytics.messagesPerDay.map((day, index) => {
              const height = (day.count / maxMessagesPerDay) * 100
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="relative w-full group">
                    <div
                      className="w-full bg-gradient-to-t from-indigo-600 to-purple-600 rounded-t-lg transition-all hover:from-indigo-700 hover:to-purple-700 cursor-pointer"
                      style={{ height: `${height}%`, minHeight: day.count > 0 ? '4px' : '0' }}
                    />
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {day.count} messages
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 transform -rotate-45 origin-left whitespace-nowrap">
                    {new Date(day.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Message Status */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Message Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {analytics.messagesByStatus.map((status) => (
              <div
                key={status.status}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-lg"
              >
                <div className="w-12 h-12 mb-3 flex items-center justify-center">
                  {status.status === 'sent' || status.status === 'delivered' ? (
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  ) : status.status === 'failed' ? (
                    <XCircle className="w-8 h-8 text-red-500" />
                  ) : status.status === 'scheduled' ? (
                    <Clock className="w-8 h-8 text-orange-500" />
                  ) : (
                    <Loader className="w-8 h-8 text-blue-500" />
                  )}
                </div>
                <p className="text-2xl font-bold text-slate-800 mb-1">{status.count}</p>
                <p className="text-sm text-slate-600 capitalize">{status.status}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


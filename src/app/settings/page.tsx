'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  User,
  Shield,
  Bell,
  Save,
  Copy,
  CheckCircle,
  Globe,
  Link as LinkIcon,
} from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  role: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  // Twilio settings from environment
  const twilioPhoneNumber = process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || '+1234567890'
  const twilioWhatsAppNumber = process.env.NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER || '+1234567890'
  const webhookUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio`
    : 'https://your-domain.com/api/webhooks/twilio'

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/')
        return
      }
      const data = await res.json()
      setUser(data.user)
    } catch (error) {
      console.error('Failed to load user', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

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
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Settings</h1>
                <p className="text-xs text-slate-500">Manage your account & integrations</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-5xl mx-auto">
        <div className="grid gap-6">
          {/* User Profile */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800">User Profile</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                <input
                  type="text"
                  value={user?.name || ''}
                  disabled
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                <div className="flex items-center gap-2">
                  <span className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium capitalize">
                    {user?.role || 'viewer'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Twilio Configuration */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800">Twilio Configuration</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  SMS Phone Number
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={twilioPhoneNumber}
                    disabled
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(twilioPhoneNumber, 'phone')}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center gap-2"
                  >
                    {copied === 'phone' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  This number is used for SMS messaging
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  WhatsApp Number
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={twilioWhatsAppNumber}
                    disabled
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(twilioWhatsAppNumber, 'whatsapp')}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center gap-2"
                  >
                    {copied === 'whatsapp' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  This number is used for WhatsApp messaging
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Webhook URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={webhookUrl}
                    disabled
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(webhookUrl, 'webhook')}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center gap-2"
                  >
                    {copied === 'webhook' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Configure this URL in your Twilio console for incoming messages
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex gap-3">
                  <LinkIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Setup Instructions</h4>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Go to your Twilio Console</li>
                      <li>Navigate to Phone Numbers → Manage → Active Numbers</li>
                      <li>Select your phone number</li>
                      <li>Scroll to "Messaging Configuration"</li>
                      <li>Paste the webhook URL in "A MESSAGE COMES IN" field</li>
                      <li>Set HTTP method to POST</li>
                      <li>Click Save</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800">Notifications</h2>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition">
                <div>
                  <p className="font-medium text-slate-800">New Message Notifications</p>
                  <p className="text-sm text-slate-600">Get notified when you receive new messages</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 text-indigo-600" />
              </label>

              <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition">
                <div>
                  <p className="font-medium text-slate-800">Email Notifications</p>
                  <p className="text-sm text-slate-600">Receive email updates for important events</p>
                </div>
                <input type="checkbox" className="w-5 h-5 text-indigo-600" />
              </label>

              <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition">
                <div>
                  <p className="font-medium text-slate-800">Scheduled Message Reminders</p>
                  <p className="text-sm text-slate-600">Get reminded before scheduled messages are sent</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 text-indigo-600" />
              </label>
            </div>
          </div>

          {/* Integration Status */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800">Integration Status</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">SMS (Twilio)</p>
                    <p className="text-sm text-green-700">Connected</p>
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">WhatsApp (Twilio)</p>
                    <p className="text-sm text-green-700">Connected</p>
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-600">Email</p>
                    <p className="text-sm text-slate-500">Not configured</p>
                  </div>
                </div>
                <button className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition">
                  Connect
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


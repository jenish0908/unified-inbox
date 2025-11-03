// src/app/inbox/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  MessageSquare,
  Phone,
  Mail,
  Instagram,
  Plus,
  Send,
  LogOut,
  User,
  Clock,
  Search,
  MoreVertical,
  Bell,
  Settings,
  Menu,
  X,
  Paperclip,
  Smile,
  Calendar,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Contact {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  whatsapp: string | null
  instagram: string | null
  messages: Message[]
  _count: { messages: number }
  notes?: Note[]
}

interface Message {
  id: string
  content: string
  channel: string
  direction: string
  createdAt: string
  status: string
  mediaUrl?: string | null
  sentBy?: { name: string }
}

interface Note {
  id: string
  content: string
  isPrivate: boolean
  createdAt: string
  user: { name: string }
}

export default function InboxPage() {
  const router = useRouter()

  // Data + UI state
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [messageContent, setMessageContent] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [selectedChannel, setSelectedChannel] = useState('sms')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [showNewContact, setShowNewContact] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showNotes, setShowNotes] = useState(true)
  const [isLargeScreen, setIsLargeScreen] = useState(true)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadByContact, setUnreadByContact] = useState<Record<string, number>>({})
  const [filterUnread, setFilterUnread] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
    loadContacts()
    loadUnreadCount()
    
    // Set up polling for real-time updates every 5 seconds
    const pollInterval = setInterval(() => {
      loadContacts()
      loadUnreadCount()
    }, 5000)

    // viewport
    const update = () => setIsLargeScreen(window.innerWidth >= 1024)
    update()
    window.addEventListener('resize', update)
    
    return () => {
      clearInterval(pollInterval)
      window.removeEventListener('resize', update)
    }
  }, [])

  const loadUnreadCount = async () => {
    try {
      const res = await fetch('/api/messages/unread-count')
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.total)
        setUnreadByContact(data.byContact)
      }
    } catch (error) {
      console.error('Failed to load unread count', error)
    }
  }

  const markContactAsRead = async (contactId: string) => {
    try {
      await fetch('/api/messages/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId }),
      })
      await loadUnreadCount()
    } catch (error) {
      console.error('Failed to mark as read', error)
    }
  }

  // ---------- Backend interactions (kept from working code) ----------
  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/')
        return
      }
      const data = await res.json()
      setUser(data.user)
    } catch (error) {
      router.push('/')
    }
  }

  const loadContacts = async () => {
    try {
      const res = await fetch('/api/contacts')
      const data = await res.json()
      setContacts(data.contacts)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load contacts', error)
      setLoading(false)
    }
  }

  const loadContact = async (contactId: string) => {
    try {
      const res = await fetch(`/api/contacts/${contactId}`)
      const data = await res.json()
      setSelectedContact(data.contact)
      setMessages(data.contact.messages ?? [])
      setNotes(data.contact.notes ?? [])
      
      // Mark messages as read
      await markContactAsRead(contactId)
    } catch (error) {
      console.error('Failed to load contact', error)
    }
  }

  const sendMessage = async (scheduledFor?: string) => {
    if ((!messageContent.trim() && !selectedFile) || !selectedContact) return

    try {
      let mediaUrl: string | undefined

      // Upload file if selected
      if (selectedFile) {
        setUploading(true)
        const uploadFormData = new FormData()
        uploadFormData.append('file', selectedFile)

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        })

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          if (uploadData.success && uploadData.url) {
            mediaUrl = uploadData.url
          } else {
            // For demo: use a placeholder or the file preview URL
            console.warn('Upload not configured, using local preview')
            // In production, you MUST upload to a public URL
            alert('File upload not configured. Please set up a storage service.')
            setUploading(false)
            return
          }
        }
        setUploading(false)
      }

      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: selectedContact.id,
          channel: selectedChannel,
          content: messageContent || (selectedFile ? '' : ''), // Send empty content if only file
          scheduledFor: scheduledFor || undefined,
          mediaUrl: mediaUrl,
        }),
      })

      if (res.ok) {
        setMessageContent('')
        setSelectedFile(null)
        setMediaPreview(null)
        setShowScheduleModal(false)
        setScheduleDate('')
        setScheduleTime('')
        // refresh selected contact and contact list
        await loadContact(selectedContact.id)
        await loadContacts()
      } else {
        console.error('Failed to send message', await res.text())
      }
    } catch (error) {
      console.error('Failed to send message', error)
      setUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (5MB for MMS)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setSelectedFile(file)

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setMediaPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setMediaPreview(null)
    }
  }

  const removeAttachment = () => {
    setSelectedFile(null)
    setMediaPreview(null)
  }

  const handleScheduleSend = () => {
    if (!scheduleDate || !scheduleTime) {
      alert('Please select date and time')
      return
    }
    const scheduledFor = `${scheduleDate}T${scheduleTime}:00`
    sendMessage(scheduledFor)
  }

  const addNote = async () => {
    if (!noteContent.trim() || !selectedContact) return

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: selectedContact.id,
          content: noteContent,
          isPrivate: false,
        }),
      })

      if (res.ok) {
        setNoteContent('')
        await loadContact(selectedContact.id)
      } else {
        console.error('Failed to add note', await res.text())
      }
    } catch (error) {
      console.error('Failed to add note', error)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  // ---------- Helpers ----------
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'sms':
        return <Phone className="w-4 h-4" />
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4" />
      case 'email':
        return <Mail className="w-4 h-4" />
      case 'instagram':
        return <Instagram className="w-4 h-4" />
      default:
        return <MessageSquare className="w-4 h-4" />
    }
  }

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'sms':
        return 'bg-green-100 text-green-700'
      case 'whatsapp':
        return 'bg-emerald-100 text-emerald-700'
      case 'email':
        return 'bg-blue-100 text-blue-700'
      case 'instagram':
        return 'bg-pink-100 text-pink-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Filtered contacts by search and unread filter
  const visibleContacts = contacts.filter((c) => {
    // Apply unread filter first
    if (filterUnread && !unreadByContact[c.id]) {
      return false
    }
    
    // Then apply search filter
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (c.name ?? '').toLowerCase().includes(q) ||
      (c.phone ?? '').toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.instagram ?? '').toLowerCase().includes(q)
    )
  })

  // ---------- UI rendering ----------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your inbox...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Unified Inbox</h1>
                <p className="text-xs text-slate-500">Multi-channel messaging</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/analytics')}
              className="p-2 hover:bg-slate-100 rounded-lg relative"
              title="Analytics"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => router.push('/settings')}
              className="p-2 hover:bg-slate-100 rounded-lg"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-slate-600" />
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3 px-3 py-2 hover:bg-slate-100 rounded-lg cursor-pointer">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-slate-800">{user?.name}</p>
                {/* <p className="text-xs text-slate-500">{user?.role}</p> */}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="ml-2 p-2 hover:bg-slate-50 rounded-lg text-sm text-red-600 flex items-center gap-2"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Contacts Sidebar */}
        <aside
          className={`${
            showMobileMenu ? 'absolute inset-0 z-50' : 'hidden'
          } lg:relative lg:flex w-full lg:w-80 bg-white border-r border-slate-200 flex-col shadow-lg lg:shadow-none`}
        >
          <div className="p-4 space-y-4 border-b border-slate-200">
            <button
              onClick={() => setShowNewContact(true)}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition shadow-md hover:shadow-lg font-medium"
            >
              <Plus className="w-5 h-5" />
              New Contact
            </button>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilterUnread(false)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  !filterUnread
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterUnread(true)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition relative ${
                  filterUnread
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                Unread
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button className="flex-1 px-3 py-2 hover:bg-slate-50 text-slate-600 rounded-lg text-sm">
                Archived
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {visibleContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={async () => {
                  setSelectedContact(contact)
                  setMessages(contact.messages ?? [])
                  setNotes(contact.notes ?? [])
                  setShowMobileMenu(false)
                  // fetch fresh single contact from backend (to get latest messages/notes)
                  await loadContact(contact.id)
                }}
                className={`w-full p-4 border-b border-slate-100 hover:bg-slate-50 text-left transition ${
                  selectedContact?.id === contact.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                    {contact.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-slate-800 truncate">{contact.name || contact.phone || 'Unknown'}</h3>
                      <span className="text-xs text-slate-500">{contact.messages[0] ? formatTime(contact.messages[0].createdAt) : 'New'}</span>
                    </div>
                    <p className="text-sm text-slate-600 truncate mb-2">{contact.messages[0]?.content || 'No messages yet'}</p>
                    <div className="flex items-center gap-2">
                      {contact.phone && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 ${getChannelColor('sms')} text-xs rounded-full`}>
                          <Phone className="w-3 h-3" />
                        </span>
                      )}
                      {contact.whatsapp && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 ${getChannelColor('whatsapp')} text-xs rounded-full`}>
                          <MessageSquare className="w-3 h-3" />
                        </span>
                      )}
                      {contact.email && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 ${getChannelColor('email')} text-xs rounded-full`}>
                          <Mail className="w-3 h-3" />
                        </span>
                      )}
                      {unreadByContact[contact.id] ? (
                        <span className="ml-auto text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-semibold">
                          {unreadByContact[contact.id]}
                        </span>
                      ) : (
                        <span className="ml-auto text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          {contact._count?.messages ?? 0}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col bg-white">
          {selectedContact ? (
            <>
              {/* Contact Header */}
              <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setShowMobileMenu(true)} className="lg:hidden p-2 hover:bg-slate-100 rounded-lg">
                      <Menu className="w-5 h-5" />
                    </button>
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                      {selectedContact.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800">{selectedContact.name || selectedContact.phone || 'Unknown Contact'}</h2>
                      <div className="flex items-center gap-3 mt-1">
                        {selectedContact.phone && (
                          <span className="text-sm text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {selectedContact.phone}
                          </span>
                        )}
                        {selectedContact.email && (
                          <span className="text-sm text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {selectedContact.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowNotes((s) => !s)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition text-sm font-medium lg:hidden"
                    >
                      Notes
                    </button>
                    <button className="p-2 hover:bg-slate-100 rounded-lg">
                      <MoreVertical className="w-5 h-5 text-slate-600" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-slate-50 to-white">
                <div className="max-w-4xl mx-auto space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                      <div className={`max-w-md ${msg.direction === 'outbound' ? 'order-2' : 'order-1'}`}>
                        <div
                          className={`px-4 py-3 rounded-2xl shadow-sm ${
                            msg.direction === 'outbound'
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-sm'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                                msg.direction === 'outbound' ? 'bg-white/20 text-white' : getChannelColor(msg.channel)
                              }`}
                            >
                              {getChannelIcon(msg.channel)}
                              <span className="capitalize">{msg.channel}</span>
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          {msg.mediaUrl && (
                            <div className="mt-3">
                              {msg.mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) || msg.mediaUrl.includes('MediaUrl') ? (
                                <img
                                  src={msg.mediaUrl}
                                  alt="Attachment"
                                  className="rounded-lg max-w-sm w-full object-cover cursor-pointer hover:opacity-90 transition"
                                  onClick={() => window.open(msg.mediaUrl!, '_blank')}
                                  onError={(e) => {
                                    const target = e.currentTarget as HTMLImageElement
                                    target.style.display = 'none'
                                    // Show fallback
                                    const fallback = document.createElement('a')
                                    fallback.href = msg.mediaUrl!
                                    fallback.target = '_blank'
                                    fallback.className = 'flex items-center gap-2 text-sm text-blue-600 hover:underline'
                                    fallback.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg> View Attachment'
                                    target.parentElement?.appendChild(fallback)
                                  }}
                                />
                              ) : msg.mediaUrl.match(/\.(mp4|mov)$/i) ? (
                                <video
                                  src={msg.mediaUrl}
                                  controls
                                  className="rounded-lg max-w-sm w-full"
                                />
                              ) : (
                                <a
                                  href={msg.mediaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-2 px-4 py-3 rounded-lg ${
                                    msg.direction === 'outbound'
                                      ? 'bg-white/20 hover:bg-white/30 text-white'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                                  } transition`}
                                >
                                  <Paperclip className="w-4 h-4" />
                                  <span className="text-sm font-medium">View Attachment</span>
                                </a>
                              )}
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-xs ${msg.direction === 'outbound' ? 'text-white/70' : 'text-slate-500'}`}>
                              {formatTime(msg.createdAt)}
                            </span>
                            {msg.direction === 'outbound' && <span className="text-xs text-white/70">✓✓</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-slate-200 p-4 shadow-lg">
                <div className="max-w-4xl mx-auto">
                  <div className="flex gap-2 mb-3">
                    {['sms', 'whatsapp'].map((channel) => (
                      <button
                        key={channel}
                        onClick={() => setSelectedChannel(channel)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                          selectedChannel === channel
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {getChannelIcon(channel)}
                        <span className="capitalize hidden sm:inline">{channel}</span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {/* Media Preview */}
                    {mediaPreview && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                        <img
                          src={mediaPreview}
                          alt="Preview"
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800">{selectedFile?.name}</p>
                          <p className="text-xs text-slate-500">
                            {selectedFile && (selectedFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <button
                          onClick={removeAttachment}
                          className="p-2 hover:bg-slate-200 rounded-lg text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {selectedFile && !mediaPreview && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                        <div className="w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center">
                          <Paperclip className="w-6 h-6 text-slate-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800">{selectedFile.name}</p>
                          <p className="text-xs text-slate-500">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <button
                          onClick={removeAttachment}
                          className="p-2 hover:bg-slate-200 rounded-lg text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-end gap-3">
                      <button
                        onClick={() => setShowScheduleModal(true)}
                        className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                        title="Schedule message"
                      >
                        <Calendar className="w-5 h-5" />
                      </button>
                      <label className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer" title="Attach file">
                        <Paperclip className="w-5 h-5" />
                        <input
                          type="file"
                          accept="image/*,video/mp4,audio/*,.pdf"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                      <div className="flex-1 relative">
                        <textarea
                          value={messageContent}
                          onChange={(e) => setMessageContent(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey && !uploading) {
                              e.preventDefault()
                              sendMessage()
                            }
                          }}
                          placeholder="Type your message..."
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm"
                          rows={2}
                          disabled={uploading}
                        />
                      </div>
                      <button
                        onClick={async () => {
                          await sendMessage()
                        }}
                        disabled={uploading}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Send"
                      >
                        {uploading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-12 h-12 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">No conversation selected</h3>
                <p className="text-slate-600">Choose a contact to start messaging</p>
              </div>
            </div>
          )}
        </main>

        {/* Notes Sidebar (toggleable) */}
        <AnimatePresence>
          {selectedContact && (showNotes || isLargeScreen) && (
            <motion.aside
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full lg:w-80 bg-white border-l border-slate-200 flex flex-col absolute lg:relative inset-0 lg:inset-auto z-40 lg:z-auto"
            >
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">📝</div>
                  Notes
                </h3>
                <button onClick={() => setShowNotes(false)} className="lg:hidden p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="bg-gradient-to-br from-yellow-50 to-amber-50 p-4 rounded-xl border border-yellow-200 shadow-sm hover:shadow-md transition">
                    <p className="text-sm text-slate-800 mb-3 leading-relaxed">{note.content}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">{note.user.name}</span>
                      <span className="text-slate-500">{formatTime(note.createdAt)}</span>
                    </div>
                    {note.isPrivate && (
                      <span className="inline-block mt-2 px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full">🔒 Private</span>
                    )}
                  </div>
                ))}
                {notes.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <p className="text-sm">No notes yet</p>
                    <p className="text-xs mt-1">Add your first note below</p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50">
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Add a note about this contact..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  rows={3}
                />
                <button
                  onClick={async () => {
                    await addNote()
                  }}
                  className="w-full mt-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition shadow-md hover:shadow-lg text-sm font-medium"
                >
                  Add Note
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* New Contact Modal */}
      <AnimatePresence>
        {showNewContact && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">New Contact</h2>
                <button onClick={() => setShowNewContact(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <NewContactModal
                onClose={() => setShowNewContact(false)}
                onSuccess={async () => {
                  setShowNewContact(false)
                  await loadContacts()
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule Message Modal */}
      <AnimatePresence>
        {showScheduleModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">Schedule Message</h2>
                </div>
                <button onClick={() => setShowScheduleModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Time</label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-sm text-slate-600 mb-2">Message Preview:</p>
                  <p className="text-sm text-slate-800 font-medium">{messageContent || 'No message content'}</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="flex-1 px-4 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleScheduleSend}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition shadow-md hover:shadow-lg font-medium"
                  >
                    Schedule
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ----------------------
   NewContactModal component (functional; posts to /api/contacts)
   ---------------------- */
function NewContactModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [instagram, setInstagram] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, whatsapp, instagram }),
      })
      if (res.ok) {
        setLoading(false)
        onSuccess()
      } else {
        console.error('Create contact failed', await res.text())
        setLoading(false)
      }
    } catch (error) {
      console.error('Failed to create contact', error)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="John Doe" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" required />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="+1234567890" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="john@example.com" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">WhatsApp Number</label>
        <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} type="tel" placeholder="+1234567890" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Instagram Handle</label>
        <input value={instagram} onChange={(e) => setInstagram(e.target.value)} type="text" placeholder="@johndoe" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
      </div>

      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition font-medium">Cancel</button>
        <button type="submit" disabled={loading} className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition shadow-md hover:shadow-lg font-medium">
          {loading ? 'Creating...' : 'Create Contact'}
        </button>
      </div>
    </form>
  )
}

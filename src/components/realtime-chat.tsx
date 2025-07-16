"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Send, X } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { getConversationMessages, sendMessage, markAllMessagesAsRead, Message } from '@/lib/messaging'
import { realtimeMessaging } from '@/lib/realtime-messaging'

interface RealtimeChatProps {
  propertyId: string
  participantId: string
  participantName: string
  onClose: () => void
}

export function RealtimeChat({ propertyId, participantId, participantName, onClose }: RealtimeChatProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load initial messages
  useEffect(() => {
    if (!user) return

    const loadMessages = async () => {
      try {
        setLoading(true)
        const conversationMessages = await getConversationMessages(
          user.id,
          participantId,
          propertyId
        )
        setMessages(conversationMessages)
        
        // Mark all messages as read
        await markAllMessagesAsRead(user.id, participantId, propertyId)
      } catch (error) {
        console.error('Error loading messages:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMessages()
  }, [user, participantId, propertyId])

  // Set up real-time subscription
  useEffect(() => {
    if (!user || !propertyId) return

    const unsubscribe = realtimeMessaging.subscribeToMessages(
      propertyId,
      (message) => {
        // Add new message to state
        setMessages(prev => [...prev, message])
        
        // Mark as read if it's for this user
        if (message.recipient_id === user.id) {
          markAllMessagesAsRead(user.id, participantId, propertyId)
        }
      },
      (message) => {
        // Update existing message
        setMessages(prev => prev.map(m => 
          m.id === message.id ? { ...m, ...message } : m
        ))
      }
    )

    return unsubscribe
  }, [user, propertyId, participantId])

  const handleSendMessage = async () => {
    if (!user || !newMessage.trim()) return

    setSending(true)
    try {
      await sendMessage({
        recipient_id: participantId,
        property_id: propertyId,
        message_text: newMessage.trim(),
        message_type: 'property_inquiry'
      })
      
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    }
    
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    }
    
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarFallback>
              {participantName.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{participantName}</h3>
            <p className="text-sm text-gray-500">Property Chat</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isCurrentUser = message.sender_id === user?.id
            const showDate = index === 0 || 
              formatDate(message.created_at) !== formatDate(messages[index - 1].created_at)
            
            return (
              <div key={message.id}>
                {showDate && (
                  <div className="text-center text-xs text-gray-500 my-4">
                    {formatDate(message.created_at)}
                  </div>
                )}
                
                <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] ${isCurrentUser ? 'order-2' : 'order-1'}`}>
                    <div className={`p-3 rounded-lg ${
                      isCurrentUser 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      {message.subject && (
                        <div className="font-medium text-sm mb-1">{message.subject}</div>
                      )}
                      <div className="text-sm">{message.message_text}</div>
                      <div className={`text-xs mt-1 ${
                        isCurrentUser ? 'text-primary-foreground/70' : 'text-gray-500'
                      }`}>
                        {formatTime(message.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1"
            disabled={sending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

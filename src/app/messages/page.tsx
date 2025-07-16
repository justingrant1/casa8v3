"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function MessagesPage() {
  const { user } = useAuth()
  const [threads, setThreads] = useState<any[]>([])
  const [selectedThread, setSelectedThread] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loadingThreads, setLoadingThreads] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)

  useEffect(() => {
    const fetchThreads = async () => {
      if (!user) return
      setLoadingThreads(true)
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id (
            full_name,
            avatar_url
          ),
          recipient:recipient_id (
            full_name,
            avatar_url
          )
        `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error(error)
      } else {
        // Group messages by thread (e.g., by property and other user)
        const groupedThreads = data.reduce((acc, msg) => {
          const otherUser = msg.sender_id === user.id ? msg.recipient : msg.sender
          const threadId = `${msg.property_id}-${otherUser.id}`
          if (!acc[threadId]) {
            acc[threadId] = {
              ...msg,
              otherUser,
              lastMessage: msg.message_text,
              lastMessageAt: msg.created_at,
            }
          }
          return acc
        }, {} as any)
        setThreads(Object.values(groupedThreads))
      }
      setLoadingThreads(false)
    }

    fetchThreads()
  }, [user])

  useEffect(() => {
    if (!selectedThread) return

    const fetchMessages = async () => {
      setLoadingMessages(true)
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id (
            full_name,
            avatar_url
          )
        `)
        .eq('property_id', selectedThread.property_id)
        .or(`sender_id.eq.${user?.id},recipient_id.eq.${user?.id}`)
        .or(`sender_id.eq.${selectedThread.otherUser.id},recipient_id.eq.${selectedThread.otherUser.id}`)
        .order('created_at', { ascending: true })

      if (error) {
        console.error(error)
      } else {
        setMessages(data)
      }
      setLoadingMessages(false)
    }

    fetchMessages()

    const subscription = supabase
      .channel(`messages:${selectedThread.property_id}:${user?.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => [...prev, payload.new])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [selectedThread, user])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedThread || !newMessage.trim()) return

    const { error } = await supabase.from('messages').insert({
      property_id: selectedThread.property_id,
      sender_id: user.id,
      recipient_id: selectedThread.otherUser.id,
      message_text: newMessage,
    })

    if (error) {
      console.error(error)
    } else {
      setNewMessage('')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Threads */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingThreads ? (
                <p>Loading conversations...</p>
              ) : (
                <ul className="space-y-2">
                  {threads.map((thread) => (
                    <li key={thread.id} onClick={() => setSelectedThread(thread)} className="cursor-pointer p-2 rounded-md hover:bg-gray-100">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={thread.otherUser.avatar_url} />
                          <AvatarFallback>{thread.otherUser.full_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold">{thread.otherUser.full_name}</div>
                          <p className="text-sm text-gray-500 truncate">{thread.lastMessage}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Messages */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{selectedThread ? `Chat with ${selectedThread.otherUser.full_name}` : 'Select a conversation'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] overflow-y-auto p-4 border rounded-md mb-4">
                {loadingMessages ? (
                  <p>Loading messages...</p>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : ''}`}>
                        <div className={`p-3 rounded-lg max-w-[70%] ${msg.sender_id === user?.id ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                          <p>{msg.message_text}</p>
                          <span className="text-xs text-gray-400 mt-1 block">{new Date(msg.created_at).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedThread && (
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                  />
                  <Button type="submit">Send</Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

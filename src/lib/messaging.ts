import { supabase } from './supabase'
import { Database } from './database.types'

export interface Message {
  id: string
  sender_id: string
  recipient_id: string
  property_id?: string
  application_id?: string
  subject?: string
  message_text: string
  message_type: 'application' | 'property_inquiry' | 'general'
  read: boolean
  created_at: string
  updated_at: string
  sender?: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone?: string
  }
  recipient?: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone?: string
  }
}

export interface MessageThread {
  id: string
  participants: string[]
  property_id?: string
  application_id?: string
  last_message: Message
  unread_count: number
  messages: Message[]
}

export async function sendMessage(messageData: {
  recipient_id: string
  property_id?: string
  application_id?: string
  subject?: string
  message_text: string
  message_type: 'application' | 'property_inquiry' | 'general'
}): Promise<string> {
  try {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('messages')
      .insert([{
        sender_id: user.user.id,
        recipient_id: messageData.recipient_id,
        property_id: messageData.property_id,
        application_id: messageData.application_id,
        subject: messageData.subject,
        message_text: messageData.message_text,
        message_type: messageData.message_type,
        read: false
      }])
      .select()
      .single()

    if (error) {
      console.error('Error sending message:', error)
      throw error
    }

    return data.id
  } catch (error) {
    console.error('Error in sendMessage:', error)
    throw error
  }
}

export async function getMessages(userId: string): Promise<Message[]> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        recipient:profiles!recipient_id (
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching messages:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getMessages:', error)
    throw error
  }
}

export async function getMessageThreads(userId: string): Promise<MessageThread[]> {
  try {
    const messages = await getMessages(userId)
    
    // Group messages by conversation threads
    const threadsMap = new Map<string, MessageThread>()
    
    messages.forEach(message => {
      // Create a unique thread ID based on participants and context
      const otherParticipant = message.sender_id === userId 
        ? message.recipient_id 
        : message.sender_id
      
      const threadKey = `${[userId, otherParticipant].sort().join('_')}_${message.property_id || 'no_property'}_${message.application_id || 'no_app'}`
      
      if (!threadsMap.has(threadKey)) {
        threadsMap.set(threadKey, {
          id: threadKey,
          participants: [userId, otherParticipant],
          property_id: message.property_id,
          application_id: message.application_id,
          last_message: message,
          unread_count: 0,
          messages: []
        })
      }
      
      const thread = threadsMap.get(threadKey)!
      thread.messages.push(message)
      
      // Update last message if this message is more recent
      if (new Date(message.created_at) > new Date(thread.last_message.created_at)) {
        thread.last_message = message
      }
      
      // Count unread messages for this user
      if (message.recipient_id === userId && !message.read) {
        thread.unread_count++
      }
    })
    
    // Sort threads by last message timestamp
    const threads = Array.from(threadsMap.values()).sort((a, b) => 
      new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime()
    )
    
    return threads
  } catch (error) {
    console.error('Error in getMessageThreads:', error)
    throw error
  }
}

export async function markMessageAsRead(messageId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', messageId)

    if (error) {
      console.error('Error marking message as read:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in markMessageAsRead:', error)
    throw error
  }
}

export async function markAllMessagesAsRead(
  userId: string,
  otherParticipantId: string,
  propertyId?: string,
  applicationId?: string
): Promise<void> {
  try {
    let query = supabase
      .from('messages')
      .update({ read: true })
      .eq('recipient_id', userId)
      .eq('sender_id', otherParticipantId)

    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }

    if (applicationId) {
      query = query.eq('application_id', applicationId)
    }

    const { error } = await query

    if (error) {
      console.error('Error marking all messages as read:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in markAllMessagesAsRead:', error)
    throw error
  }
}

export async function getUnreadMessageCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('read', false)

    if (error) {
      console.error('Error getting unread message count:', error)
      throw error
    }

    return count || 0
  } catch (error) {
    console.error('Error in getUnreadMessageCount:', error)
    throw error
  }
}

export async function getConversationMessages(
  userId: string,
  otherParticipantId: string,
  propertyId?: string,
  applicationId?: string
): Promise<Message[]> {
  try {
    let query = supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        recipient:profiles!recipient_id (
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .or(`and(sender_id.eq.${userId},recipient_id.eq.${otherParticipantId}),and(sender_id.eq.${otherParticipantId},recipient_id.eq.${userId})`)
      .order('created_at', { ascending: true })

    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }

    if (applicationId) {
      query = query.eq('application_id', applicationId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching conversation messages:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getConversationMessages:', error)
    throw error
  }
}

export async function deleteMessage(messageId: string, userId: string): Promise<void> {
  try {
    // First, verify the message belongs to the user
    const { data: message, error: fetchError } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('id', messageId)
      .single()

    if (fetchError) {
      console.error('Error fetching message:', fetchError)
      throw fetchError
    }

    if (!message || message.sender_id !== userId) {
      throw new Error('Message not found or unauthorized')
    }

    // Delete the message
    const { error: deleteError } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)

    if (deleteError) {
      console.error('Error deleting message:', deleteError)
      throw deleteError
    }
  } catch (error) {
    console.error('Error in deleteMessage:', error)
    throw error
  }
}

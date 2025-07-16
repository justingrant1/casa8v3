import { supabase } from './supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

interface MessageCallback {
  (message: any): void
}

interface UpdateCallback {
  (message: any): void
}

class RealtimeMessaging {
  private channels: Map<string, RealtimeChannel> = new Map()
  private presenceChannel: RealtimeChannel | null = null

  subscribeToMessages(
    propertyId: string,
    onMessage: MessageCallback,
    onUpdate: UpdateCallback
  ): () => void {
    const channelName = `messages:${propertyId}`
    
    // Remove existing channel if it exists
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe()
      this.channels.delete(channelName)
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `property_id=eq.${propertyId}`
        },
        (payload) => {
          console.log('New message received:', payload)
          onMessage(payload.new)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `property_id=eq.${propertyId}`
        },
        (payload) => {
          console.log('Message updated:', payload)
          onUpdate(payload.new)
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)

    // Return unsubscribe function
    return () => {
      channel.unsubscribe()
      this.channels.delete(channelName)
    }
  }

  subscribeToAllMessages(
    userId: string,
    onMessage: MessageCallback,
    onUpdate: UpdateCallback
  ): () => void {
    const channelName = `user_messages:${userId}`
    
    // Remove existing channel if it exists
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe()
      this.channels.delete(channelName)
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${userId}`
        },
        (payload) => {
          console.log('New message received for user:', payload)
          onMessage(payload.new)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${userId}`
        },
        (payload) => {
          console.log('Message updated for user:', payload)
          onUpdate(payload.new)
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)

    // Return unsubscribe function
    return () => {
      channel.unsubscribe()
      this.channels.delete(channelName)
    }
  }

  setupPresenceTracking(): () => void {
    if (this.presenceChannel) {
      this.presenceChannel.unsubscribe()
    }

    this.presenceChannel = supabase
      .channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        const newState = this.presenceChannel?.presenceState()
        console.log('Presence sync:', newState)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data: user } = await supabase.auth.getUser()
          if (user.user) {
            await this.presenceChannel?.track({
              user_id: user.user.id,
              online_at: new Date().toISOString(),
            })
          }
        }
      })

    // Return cleanup function
    return () => {
      if (this.presenceChannel) {
        this.presenceChannel.unsubscribe()
        this.presenceChannel = null
      }
    }
  }

  cleanup(): void {
    // Unsubscribe from all channels
    this.channels.forEach((channel) => {
      channel.unsubscribe()
    })
    this.channels.clear()

    if (this.presenceChannel) {
      this.presenceChannel.unsubscribe()
      this.presenceChannel = null
    }
  }
}

export const realtimeMessaging = new RealtimeMessaging()

import { google, gmail_v1 } from 'googleapis'

export interface EmailMessage {
  id: string
  threadId: string
  subject: string
  from: string
  to: string
  date: string
  snippet: string
  body?: string
  isRead: boolean
}

interface MessageHeader {
  name: string
  value: string
}

interface MessagePart {
  mimeType: string
  body?: {
    data?: string
  }
}

interface MessagePayload {
  headers?: MessageHeader[]
  body?: {
    data?: string
  }
  parts?: MessagePart[]
}

interface GmailMessage {
  id: string
  threadId: string
  snippet?: string
  labelIds?: string[]
  payload: MessagePayload
}

export class GmailClient {
  private gmail: gmail_v1.Gmail

  constructor(accessToken: string) {
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: accessToken })
    
    this.gmail = google.gmail({ version: 'v1', auth })
  }

  async getMessages(maxResults: number = 10): Promise<EmailMessage[]> {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: 'in:inbox'
      })

      const messages = response.data.messages || []
      const emailPromises = messages.map((message) => 
        this.getMessageDetails(message.id!)
      )

      return Promise.all(emailPromises)
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error)
      throw error
    }
  }

  async getMessageDetails(messageId: string): Promise<EmailMessage> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      })

      const message = response.data as GmailMessage
      const headers = message.payload.headers || []
      
      const getHeader = (name: string) => 
        headers.find((h: MessageHeader) => h.name.toLowerCase() === name.toLowerCase())?.value || ''

      const subject = getHeader('Subject')
      const from = getHeader('From')
      const to = getHeader('To')
      const date = getHeader('Date')
      
      // Extraire le corps du message
      let body = ''
      if (message.payload.body?.data) {
        body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8')
      } else if (message.payload.parts) {
        const textPart = message.payload.parts.find((part: MessagePart) => 
          part.mimeType === 'text/plain' || part.mimeType === 'text/html'
        )
        if (textPart?.body?.data) {
          body = Buffer.from(textPart.body.data, 'base64').toString('utf-8')
        }
      }

      const isRead = !message.labelIds?.includes('UNREAD')

      return {
        id: message.id,
        threadId: message.threadId,
        subject,
        from,
        to,
        date,
        snippet: message.snippet || '',
        body,
        isRead
      }
    } catch (error) {
      console.error(`Erreur lors de la récupération du message ${messageId}:`, error)
      throw error
    }
  }

  async markAsRead(messageId: string): Promise<void> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD']
        }
      })
    } catch (error) {
      console.error(`Erreur lors du marquage comme lu ${messageId}:`, error)
      throw error
    }
  }

  async searchMessages(query: string, maxResults: number = 10): Promise<EmailMessage[]> {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: query
      })

      const messages = response.data.messages || []
      const emailPromises = messages.map((message) => 
        this.getMessageDetails(message.id!)
      )

      return Promise.all(emailPromises)
    } catch (error) {
      console.error('Erreur lors de la recherche:', error)
      throw error
    }
  }
} 
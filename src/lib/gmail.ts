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

// Nouvelles interfaces pour l'envoi d'emails
export interface EmailToSend {
  to: string
  subject: string
  body: string
  cc?: string[]
  bcc?: string[]
  threadId?: string
  inReplyTo?: string
  references?: string
}

export interface ReplyData {
  body: string
  cc?: string[]
  bcc?: string[]
}

interface MessageHeader {
  name?: string | null
  value?: string | null
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
        headers.find((h: MessageHeader) => h.name?.toLowerCase() === name.toLowerCase())?.value || ''

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

  // Nouvelle méthode pour créer un email au format RFC 2822
  private createEmailMessage(emailData: EmailToSend, userEmail: string): string {
    const { to, subject, body, cc, bcc, inReplyTo, references } = emailData
    
    let message = ''
    message += `From: ${userEmail}\r\n`
    message += `To: ${to}\r\n`
    
    if (cc && cc.length > 0) {
      message += `Cc: ${cc.join(', ')}\r\n`
    }
    
    if (bcc && bcc.length > 0) {
      message += `Bcc: ${bcc.join(', ')}\r\n`
    }
    
    message += `Subject: ${subject}\r\n`
    
    if (inReplyTo) {
      message += `In-Reply-To: ${inReplyTo}\r\n`
    }
    
    if (references) {
      message += `References: ${references}\r\n`
    }
    
    message += `Content-Type: text/plain; charset=UTF-8\r\n`
    message += `Content-Transfer-Encoding: 7bit\r\n\r\n`
    message += body
    
    return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_')
  }

  // Nouvelle méthode pour envoyer un email
  async sendEmail(emailData: EmailToSend, userEmail: string): Promise<string> {
    try {
      const raw = this.createEmailMessage(emailData, userEmail)
      
      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw,
          threadId: emailData.threadId
        }
      })

      return response.data.id!
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error)
      throw error
    }
  }

  // Nouvelle méthode pour répondre à un email
  async replyToEmail(originalMessageId: string, replyData: ReplyData, userEmail: string): Promise<string> {
    try {
      // Récupérer l'email original pour extraire les métadonnées
      const originalMessage = await this.getMessageDetails(originalMessageId)
      const originalResponse = await this.gmail.users.messages.get({
        userId: 'me',
        id: originalMessageId,
        format: 'full'
      })

      const originalHeaders = originalResponse.data.payload?.headers || []
      const getOriginalHeader = (name: string) => 
        originalHeaders.find((h: MessageHeader) => h.name?.toLowerCase() === name.toLowerCase())?.value || ''

      const originalSubject = getOriginalHeader('Subject')
      const originalFrom = getOriginalHeader('From')
      const originalMessageIdHeader = getOriginalHeader('Message-ID')
      const originalReferences = getOriginalHeader('References')

      // Créer le subject pour la réponse
      const replySubject = originalSubject.startsWith('Re: ') 
        ? originalSubject 
        : `Re: ${originalSubject}`

      // Créer les références pour maintenir le thread
      let references = originalReferences
      if (originalMessageIdHeader) {
        references = references 
          ? `${references} ${originalMessageIdHeader}`
          : originalMessageIdHeader
      }

      const emailData: EmailToSend = {
        to: originalFrom,
        subject: replySubject,
        body: replyData.body,
        cc: replyData.cc,
        bcc: replyData.bcc,
        threadId: originalMessage.threadId,
        inReplyTo: originalMessageIdHeader,
        references
      }

      return await this.sendEmail(emailData, userEmail)
    } catch (error) {
      console.error('Erreur lors de la réponse à l\'email:', error)
      throw error
    }
  }

  // Nouvelle méthode pour récupérer le profil utilisateur
  async getUserProfile(): Promise<{ email: string; name: string }> {
    try {
      const response = await this.gmail.users.getProfile({
        userId: 'me'
      })

      return {
        email: response.data.emailAddress || '',
        name: response.data.emailAddress || ''
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error)
      throw error
    }
  }
} 
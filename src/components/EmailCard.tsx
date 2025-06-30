'use client'

import { useState } from 'react'
import { EmailMessage } from '@/lib/gmail'

interface EmailCardProps {
  email: EmailMessage
  onMarkAsRead?: (messageId: string) => void
}

export default function EmailCard({ email, onMarkAsRead }: EmailCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleMarkAsRead = async () => {
    if (!email.isRead && onMarkAsRead) {
      setIsLoading(true)
      try {
        await onMarkAsRead(email.id)
      } catch (error) {
        console.error('Erreur lors du marquage comme lu:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const extractEmailAddress = (emailString: string) => {
    const match = emailString.match(/<(.+)>/)
    return match ? match[1] : emailString
  }

  return (
    <div className={`border rounded-lg p-4 mb-4 transition-all duration-200 hover:shadow-md ${
      !email.isRead ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {!email.isRead && (
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
            <h3 className={`text-lg font-semibold truncate ${
              !email.isRead ? 'text-gray-900' : 'text-gray-700'
            }`}>
              {email.subject || '(Aucun sujet)'}
            </h3>
          </div>
          
          <div className="text-sm text-gray-600 mb-2">
            <p><span className="font-medium">De:</span> {extractEmailAddress(email.from)}</p>
            <p><span className="font-medium">Date:</span> {formatDate(email.date)}</p>
          </div>
          
          <p className="text-gray-700 text-sm mb-3">
            {email.snippet}
          </p>
        </div>
        
        <div className="flex flex-col gap-2 ml-4">
          {!email.isRead && (
            <button
              onClick={handleMarkAsRead}
              disabled={isLoading}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Chargement...' : 'Marquer comme lu'}
            </button>
          )}
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            {isExpanded ? 'Réduire' : 'Voir plus'}
          </button>
        </div>
      </div>
      
      {isExpanded && email.body && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">Corps du message:</h4>
          <div 
            className="prose prose-sm max-w-none text-gray-700 bg-gray-50 p-3 rounded"
            dangerouslySetInnerHTML={{ __html: email.body }}
          />
        </div>
      )}
    </div>
  )
} 
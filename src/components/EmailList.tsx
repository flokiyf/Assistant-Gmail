'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import EmailCard from './EmailCard'
import { EmailMessage } from '@/lib/gmail'

export default function EmailList() {
  const { data: session } = useSession()
  const [emails, setEmails] = useState<EmailMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [maxResults, setMaxResults] = useState(10)

  const fetchEmails = useCallback(async (query?: string) => {
    if (!session) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        maxResults: maxResults.toString(),
        ...(query && { q: query })
      })

      const response = await fetch(`/api/gmail/messages?${params}`)
      const data = await response.json()

      if (response.ok) {
        setEmails(data.messages)
      } else {
        console.error('Erreur:', data.error)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des emails:', error)
    } finally {
      setLoading(false)
    }
  }, [session, maxResults])

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const response = await fetch('/api/gmail/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageId }),
      })

      if (response.ok) {
        setEmails(emails.map(email => 
          email.id === messageId 
            ? { ...email, isRead: true }
            : email
        ))
      }
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchEmails(searchQuery)
  }

  useEffect(() => {
    if (session) {
      fetchEmails()
    }
  }, [session, fetchEmails])

  if (!session) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Mes Emails Gmail
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <input
              type="text"
              placeholder="Rechercher dans les emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Rechercher
            </button>
          </form>
          
          <div className="flex items-center gap-2">
            <label htmlFor="maxResults" className="text-sm font-medium text-gray-700">
              Nombre:
            </label>
            <select
              id="maxResults"
              value={maxResults}
              onChange={(e) => setMaxResults(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => fetchEmails()}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Chargement...' : 'Actualiser'}
          </button>
          
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('')
                fetchEmails()
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Effacer la recherche
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {!loading && emails.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">
            {searchQuery ? 'Aucun email trouvé pour cette recherche.' : 'Aucun email trouvé.'}
          </p>
        </div>
      )}

      {!loading && emails.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {emails.length} email{emails.length > 1 ? 's' : ''} trouvé{emails.length > 1 ? 's' : ''}
            {searchQuery && ` pour "${searchQuery}"`}
          </p>
          
          {emails.map((email) => (
            <EmailCard
              key={email.id}
              email={email}
              onMarkAsRead={handleMarkAsRead}
            />
          ))}
        </div>
      )}
    </div>
  )
} 
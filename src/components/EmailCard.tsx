'use client'

import { useState } from 'react'
import { EmailMessage } from '@/lib/gmail'

interface EmailAnalysis {
  summary: string
  sentiment: 'positive' | 'negative' | 'neutral'
  priority: 'high' | 'medium' | 'low'
  category: string
  keyPoints: string[]
  suggestedActions: string[]
}

interface EmailCardProps {
  email: EmailMessage
  onMarkAsRead?: (messageId: string) => void
}

export default function EmailCard({ email, onMarkAsRead }: EmailCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [analysis, setAnalysis] = useState<EmailAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)

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

  const handleAnalyzeEmail = async () => {
    if (analysis) {
      setShowAnalysis(!showAnalysis)
      return
    }

    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/gmail/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: email.subject,
          emailBody: email.body || email.snippet,
          sender: email.from
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAnalysis(data.analysis)
        setShowAnalysis(true)
      } else {
        console.error('Erreur lors de l\'analyse')
      }
    } catch (error) {
      console.error('Erreur lors de l\'analyse:', error)
    } finally {
      setIsAnalyzing(false)
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-100'
      case 'negative': return 'text-red-600 bg-red-100'
      case 'neutral': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
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
          
          <button
            onClick={handleAnalyzeEmail}
            disabled={isAnalyzing}
            className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {isAnalyzing ? '🤖 Analyse...' : analysis ? (showAnalysis ? 'Masquer IA' : 'Voir IA') : '🤖 Analyser'}
          </button>
        </div>
      </div>
      
      {/* Analyse IA */}
      {showAnalysis && analysis && (
        <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
          <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
            🤖 Analyse IA
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(analysis.priority)}`}>
                Priorité: {analysis.priority}
              </span>
            </div>
            <div className="text-center">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(analysis.sentiment)}`}>
                Sentiment: {analysis.sentiment}
              </span>
            </div>
            <div className="text-center">
              <span className="px-2 py-1 rounded-full text-xs font-medium text-blue-600 bg-blue-100">
                {analysis.category}
              </span>
            </div>
          </div>
          
          <div className="mb-3">
            <h5 className="font-semibold text-gray-800 mb-1">📋 Résumé:</h5>
            <p className="text-sm text-gray-700">{analysis.summary}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-semibold text-gray-800 mb-1">🔑 Points clés:</h5>
              <ul className="text-sm text-gray-700 list-disc list-inside">
                {analysis.keyPoints.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold text-gray-800 mb-1">💡 Actions suggérées:</h5>
              <ul className="text-sm text-gray-700 list-disc list-inside">
                {analysis.suggestedActions.map((action, index) => (
                  <li key={index}>{action}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      
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
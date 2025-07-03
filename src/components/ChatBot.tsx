'use client'

import { useState, useEffect, useRef } from 'react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isInstruction?: boolean
}

interface ChatBotProps {
  emails: any[]
}

const instructionTemplates = [
  {
    id: 'work-applications',
    title: 'Opportunités Emploi',
    icon: '🎯',
    instruction: 'Vérifie mes emails des 7 derniers jours pour toutes les demandes de travail, candidatures, ou réponses de recruteurs. Donne-moi un résumé détaillé avec : le nom de l\'entreprise, le poste, le statut de la candidature, et les actions à prendre.'
  },
  {
    id: 'urgent-emails',
    title: 'Priorité Élevée',
    icon: '⚡',
    instruction: 'Identifie tous les emails non lus marqués comme urgents ou importants. Classe-les par priorité et indique-moi les actions recommandées pour chacun.'
  },
  {
    id: 'meeting-invites',
    title: 'Agenda',
    icon: '📅',
    instruction: 'Recherche toutes les invitations de réunion, rendez-vous ou événements dans mes emails récents. Liste-moi les détails : date, heure, organisateur, et statut de ma réponse.'
  },
  {
    id: 'follow-up-needed',
    title: 'Suivi Requis',
    icon: '📋',
    instruction: 'Analyse mes emails des 14 derniers jours et identifie ceux qui nécessitent un suivi de ma part. Classe-les par urgence avec les raisons du suivi.'
  }
]

export default function ChatBot({ emails }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Bonjour ! 👋 Je suis votre assistant email professionnel.\n\nJe peux vous aider à :\n• Analyser vos emails selon vos besoins\n• Rechercher des informations spécifiques\n• Créer des résumés détaillés\n• Recommander des actions\n\nComment puis-je vous assister aujourd\'hui ?',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || inputMessage
    if (!content.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content,
      timestamp: new Date(),
      isInstruction: !!messageContent
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Décider quelle API utiliser selon le type de message
      const apiEndpoint = messageContent ? '/api/gmail/instructions' : '/api/gmail/chat'
      const requestBody = messageContent 
        ? { instruction: content }
        : { message: content, emails }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (response.ok) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.result?.summary || data.response || 'Réponse reçue',
          timestamp: new Date()
        }

        setMessages(prev => [...prev, assistantMessage])

        // Afficher les statistiques si c'est une instruction
        if (data.result?.stats) {
          const statsMessage: ChatMessage = {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: `📊 **Analyse terminée** : ${data.result.stats.total} emails analysés, ${data.result.stats.unread} non lus`,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, statsMessage])
        }
      } else {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `❌ Erreur : ${data.error || 'Impossible de traiter votre demande'}`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ Erreur de connexion. Veuillez réessayer.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleUseTemplate = (instruction: string) => {
    setShowInstructions(false)
    handleSendMessage(instruction)
  }

  const formatMessage = (content: string) => {
    // Conversion basique Markdown vers HTML
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>')
  }

  return (
    <>
      {/* Bouton flottant moderne */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center group"
        >
          {isOpen ? (
            <svg className="w-6 h-6 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          )}
        </button>
      </div>

      {/* Fenêtre de chat moderne */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[700px] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden">
          {/* Header élégant */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-3xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Assistant Email</h3>
                  <p className="text-blue-100 text-sm">MailFlow Pro</p>
                </div>
              </div>
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Instructions prédéfinies modernes */}
          {showInstructions && (
            <div className="p-4 bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
              <div className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Actions Rapides</div>
              <div className="grid grid-cols-2 gap-2">
                {instructionTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleUseTemplate(template.instruction)}
                    className="p-3 bg-white border border-gray-200 rounded-xl text-xs hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 text-left group shadow-sm hover:shadow-md"
                    disabled={isLoading}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{template.icon}</span>
                      <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {template.title}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Zone de messages avec défilement fluide */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-[85%] group">
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <span className="text-xs font-medium text-gray-600">Assistant</span>
                    </div>
                  )}
                  
                  <div
                    className={`p-4 rounded-2xl shadow-sm ${
                      message.role === 'user'
                        ? message.isInstruction
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                          : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}
                  >
                    <div
                      className="text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                    />
                    <div className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-white/70' : 'text-gray-400'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 p-4 rounded-2xl shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-600">L'assistant réfléchit...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Zone de saisie moderne */}
          <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-t border-gray-100">
            <div className="flex items-end gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Tapez votre message ou demande..."
                  className="w-full border-2 border-gray-200 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md placeholder-gray-400"
                  disabled={isLoading}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                  ⌘ + Enter
                </div>
              </div>
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                className="w-12 h-12 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                )}
              </button>
            </div>
            
            <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
              <span className="flex items-center gap-2">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Appuyez sur Entrée pour envoyer
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
                <span className="font-medium">En ligne</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 
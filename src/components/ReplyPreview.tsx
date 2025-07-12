'use client'

import React, { useState } from 'react'
import { CheckCircle, XCircle, Edit3, Send, Clock, User, Mail, MessageSquare, Sparkles } from 'lucide-react'

interface Reply {
  emailId: string
  originalFrom: string
  originalSubject: string
  replySubject: string
  replyBody: string
  tone: string
  confidence: number
  reasoning: string
}

interface EmailWithReply {
  email: {
    id: string
    from: string
    subject: string
    date: string
    snippet: string
    body?: string
    isRead: boolean
  }
  reply: Reply | null
}

interface ReplyPreviewProps {
  emailsWithReplies: EmailWithReply[]
  onSendReplies: (replies: any[]) => void
  onBack: () => void
  isLoading?: boolean
}

export default function ReplyPreview({ 
  emailsWithReplies, 
  onSendReplies, 
  onBack, 
  isLoading = false 
}: ReplyPreviewProps) {
  const [replyStates, setReplyStates] = useState<{[key: string]: {
    approved: boolean
    edited: boolean
    editedBody: string
  }}>({})

  const [isEditing, setIsEditing] = useState<{[key: string]: boolean}>({})

  // Initialiser les états des réponses
  React.useEffect(() => {
    const initialStates: {[key: string]: {approved: boolean, edited: boolean, editedBody: string}} = {}
    emailsWithReplies.forEach(({ email, reply }) => {
      if (reply) {
        initialStates[email.id] = {
          approved: false,
          edited: false,
          editedBody: reply.replyBody
        }
      }
    })
    setReplyStates(initialStates)
  }, [emailsWithReplies])

  const handleApprove = (emailId: string) => {
    setReplyStates(prev => ({
      ...prev,
      [emailId]: {
        ...prev[emailId],
        approved: !prev[emailId]?.approved
      }
    }))
  }

  const handleEdit = (emailId: string) => {
    setIsEditing(prev => ({
      ...prev,
      [emailId]: true
    }))
  }

  const handleSaveEdit = (emailId: string, newBody: string) => {
    setReplyStates(prev => ({
      ...prev,
      [emailId]: {
        ...prev[emailId],
        editedBody: newBody,
        edited: true
      }
    }))
    setIsEditing(prev => ({
      ...prev,
      [emailId]: false
    }))
  }

  const handleSendAll = () => {
    const repliesToSend = emailsWithReplies
      .filter(({ email }) => replyStates[email.id]?.approved)
      .map(({ email, reply }) => ({
        emailId: email.id,
        replyBody: replyStates[email.id]?.editedBody || reply?.replyBody,
        approved: true
      }))

    onSendReplies(repliesToSend)
  }

  const approvedCount = Object.values(replyStates).filter(state => state.approved).length
  const totalReplies = emailsWithReplies.filter(({ reply }) => reply !== null).length

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            Prévisualisation des Réponses
          </h2>
          <p className="text-gray-600 mt-1">
            {totalReplies} réponses générées • {approvedCount} approuvées
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Retour
          </button>
          <button
            onClick={handleSendAll}
            disabled={approvedCount === 0 || isLoading}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
            Envoyer {approvedCount > 0 && `(${approvedCount})`}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Réponses générées</span>
          </div>
          <div className="text-2xl font-bold text-blue-900 mt-1">{totalReplies}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-700">Approuvées</span>
          </div>
          <div className="text-2xl font-bold text-green-900 mt-1">{approvedCount}</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-700">Modifiées</span>
          </div>
          <div className="text-2xl font-bold text-yellow-900 mt-1">
            {Object.values(replyStates).filter(state => state.edited).length}
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">En attente</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {totalReplies - approvedCount}
          </div>
        </div>
      </div>

      {/* Liste des emails et réponses */}
      <div className="space-y-6">
        {emailsWithReplies.map(({ email, reply }) => {
          if (!reply) return null

          const state = replyStates[email.id]
          const isEditingThis = isEditing[email.id]

          return (
            <div
              key={email.id}
              className={`border-2 rounded-lg p-6 transition-all ${
                state?.approved
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {/* Email original */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Email original</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      Confiance: {Math.round(reply.confidence * 100)}%
                    </span>
                    <div className={`w-2 h-2 rounded-full ${
                      reply.confidence > 0.8 ? 'bg-green-500' :
                      reply.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  <strong>De:</strong> {email.from}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  <strong>Sujet:</strong> {email.subject}
                </div>
                <div className="text-sm text-gray-700 line-clamp-3">
                  {email.snippet}
                </div>
              </div>

              {/* Réponse générée */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-700">Réponse générée</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    reply.tone === 'professionnel' ? 'bg-blue-100 text-blue-700' :
                    reply.tone === 'amical' ? 'bg-green-100 text-green-700' :
                    reply.tone === 'formel' ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {reply.tone}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  <strong>Sujet:</strong> {reply.replySubject}
                </div>
                
                {isEditingThis ? (
                  <div className="space-y-2">
                    <textarea
                      defaultValue={state?.editedBody || reply.replyBody}
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={8}
                      onChange={(e) => {
                        const newBody = e.target.value
                        setReplyStates(prev => ({
                          ...prev,
                          [email.id]: {
                            ...prev[email.id],
                            editedBody: newBody
                          }
                        }))
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(email.id, state?.editedBody || reply.replyBody)}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        Sauvegarder
                      </button>
                      <button
                        onClick={() => setIsEditing(prev => ({ ...prev, [email.id]: false }))}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                      {state?.editedBody || reply.replyBody}
                    </pre>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleApprove(email.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      state?.approved
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {state?.approved ? 'Approuvé' : 'Approuver'}
                  </button>
                  
                  <button
                    onClick={() => handleEdit(email.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    Modifier
                  </button>
                </div>

                <div className="text-xs text-gray-500">
                  {reply.reasoning}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {totalReplies === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune réponse générée
          </h3>
          <p className="text-gray-500">
            Aucune réponse n'a pu être générée pour cette instruction.
          </p>
        </div>
      )}
    </div>
  )
} 
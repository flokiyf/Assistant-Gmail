'use client'

import React, { useState } from 'react'

interface InstructionTemplate {
  id: string
  title: string
  description: string
  instruction: string
  icon: React.ReactElement
  category: 'work' | 'personal' | 'analysis' | 'search'
  color: string
}

interface AnalysisResult {
  summary: string
  stats: {
    total: number
    nonLus: number
    analysés: number
  }
  emailsAnalyzed: number
}

const instructionTemplates: InstructionTemplate[] = [
  {
    id: 'work-applications',
    title: 'Opportunités Emploi',
    description: 'Analyser les emails de recrutement et candidatures',
    instruction: 'Vérifie mes emails des 15 derniers jours pour toutes les demandes de travail, candidatures, ou réponses de recruteurs (Indeed, LinkedIn, etc.). Donne-moi un résumé détaillé avec : le nom de l\'entreprise, le poste, le salaire si mentionné, le statut de la candidature, et les actions à prendre.',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" /></svg>,
    category: 'work',
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'indeed-linkedin',
    title: 'Plateformes Emploi',
    description: 'Emails spécifiques des plateformes d\'emploi',
    instruction: 'Trouve tous les emails d\'Indeed, LinkedIn, et autres plateformes d\'emploi des 30 derniers jours. Extrais les détails complets : entreprise, poste, salaire, lieu, type de contrat, et donne-moi les informations complètes sur chaque opportunité.',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    category: 'work',
    color: 'from-indigo-500 to-indigo-600'
  },
  {
    id: 'urgent-emails',
    title: 'Priorité Élevée',
    description: 'Identifier les emails nécessitant une attention immédiate',
    instruction: 'Identifie tous les emails non lus marqués comme urgents ou importants des 7 derniers jours. Classe-les par priorité et indique-moi les actions recommandées pour chacun avec le contenu complet.',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>,
    category: 'analysis',
    color: 'from-red-500 to-red-600'
  },
  {
    id: 'specific-sender',
    title: 'Recherche Expéditeur',
    description: 'Analyser les emails d\'une personne ou entreprise spécifique',
    instruction: 'Trouve tous les emails de [EXPÉDITEUR] des 30 derniers jours et donne-moi un résumé complet de nos échanges avec le contenu détaillé et les points importants à retenir.',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    category: 'search',
    color: 'from-green-500 to-green-600'
  },
  {
    id: 'meeting-invites',
    title: 'Agenda & Rendez-vous',
    description: 'Gérer les invitations de réunion et événements',
    instruction: 'Recherche toutes les invitations de réunion, rendez-vous ou événements dans mes emails des 15 derniers jours. Liste-moi les détails complets : date, heure, lieu, organisateur, objet de la réunion, et statut de ma réponse.',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    category: 'personal',
    color: 'from-purple-500 to-purple-600'
  },
  {
    id: 'keyword-search',
    title: 'Recherche Avancée',
    description: 'Chercher des emails contenant des termes spécifiques',
    instruction: 'Recherche dans mes emails des 30 derniers jours tous les messages contenant "[MOT-CLÉ]" et donne-moi un résumé complet du contexte et des informations importantes avec le contenu détaillé.',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
    category: 'search',
    color: 'from-orange-500 to-orange-600'
  },
  {
    id: 'follow-up-needed',
    title: 'Suivi Requis',
    description: 'Identifier les emails nécessitant un suivi',
    instruction: 'Analyse mes emails des 20 derniers jours et identifie ceux qui nécessitent un suivi de ma part. Classe-les par urgence avec les raisons du suivi et le contenu complet de chaque email.',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
    category: 'analysis',
    color: 'from-teal-500 to-teal-600'
  },
  {
    id: 'today-emails',
    title: 'Résumé Quotidien',
    description: 'Résumé des emails reçus aujourd\'hui',
    instruction: 'Donne-moi un résumé complet de tous les emails reçus aujourd\'hui avec le contenu détaillé, classés par importance et avec les actions recommandées.',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    category: 'analysis',
    color: 'from-yellow-500 to-yellow-600'
  }
]

const categoryLabels = {
  work: { label: 'Professionnel', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  personal: { label: 'Personnel', color: 'bg-green-100 text-green-800 border-green-200' },
  analysis: { label: 'Analyse', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  search: { label: 'Recherche', color: 'bg-orange-100 text-orange-800 border-orange-200' }
}

export default function InstructionPanel() {
  const [customInstruction, setCustomInstruction] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showTemplates, setShowTemplates] = useState(true)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentInstruction, setCurrentInstruction] = useState<string>('')

  const handleSendCustomInstruction = async () => {
    if (customInstruction.trim()) {
      await processInstruction(customInstruction)
      setCustomInstruction('')
    }
  }

  const handleUseTemplate = async (template: InstructionTemplate) => {
    setCustomInstruction(template.instruction)
    setShowTemplates(false)
    await processInstruction(template.instruction)
  }

  const processInstruction = async (instruction: string) => {
    setIsProcessing(true)
    setCurrentInstruction(instruction)
    setAnalysisResult(null)

    try {
      const response = await fetch('/api/gmail/instructions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instruction })
      })

      const data = await response.json()

      if (response.ok && data.result) {
        setAnalysisResult(data.result)
      } else {
        setAnalysisResult({
          summary: `❌ Erreur : ${data.error || 'Impossible de traiter votre instruction'}`,
          stats: { total: 0, nonLus: 0, analysés: 0 },
          emailsAnalyzed: 0
        })
      }
    } catch (error) {
      console.error('Erreur lors du traitement de l\'instruction:', error)
      setAnalysisResult({
        summary: '❌ Erreur de connexion. Veuillez réessayer.',
        stats: { total: 0, nonLus: 0, analysés: 0 },
        emailsAnalyzed: 0
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const filteredTemplates = selectedCategory === 'all' 
    ? instructionTemplates 
    : instructionTemplates.filter(t => t.category === selectedCategory)

  const formatMessage = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>')
      .replace(/###\s*(.*?)$/gm, '<h3 class="text-lg font-bold text-blue-900 mt-4 mb-2">$1</h3>')
      .replace(/##\s*(.*?)$/gm, '<h2 class="text-xl font-bold text-blue-900 mt-6 mb-3">$1</h2>')
      .replace(/^\s*[-•]\s*(.*?)$/gm, '<li class="ml-4 mb-1 text-gray-700">• $1</li>')
      .replace(/^\s*\d+\.\s*(.*?)$/gm, '<li class="ml-4 mb-2 text-gray-700 font-medium">$1</li>')
      .replace(/📧\s*(.*?)$/gm, '<div class="bg-blue-50 p-3 rounded-lg mb-2 border-l-4 border-blue-400"><span class="text-blue-700">📧 $1</span></div>')
      .replace(/🏢\s*(.*?)$/gm, '<div class="bg-green-50 p-3 rounded-lg mb-2 border-l-4 border-green-400"><span class="text-green-700">🏢 $1</span></div>')
      .replace(/💰\s*(.*?)$/gm, '<div class="bg-yellow-50 p-3 rounded-lg mb-2 border-l-4 border-yellow-400"><span class="text-yellow-700">💰 $1</span></div>')
      .replace(/📅\s*(.*?)$/gm, '<div class="bg-purple-50 p-3 rounded-lg mb-2 border-l-4 border-purple-400"><span class="text-purple-700">📅 $1</span></div>')
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="text-blue-600 hover:text-blue-800 underline break-all text-xs">🔗 Lien</a>')
      .replace(/([A-Za-z0-9]{50,})/g, '<span class="bg-gray-100 px-2 py-1 rounded text-xs font-mono break-all">$1</span>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>')
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Centre de Commande</h2>
          <p className="text-gray-600">Donnez des instructions précises à votre assistant email</p>
        </div>
      </div>

      {/* Zone de saisie personnalisée */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Instruction personnalisée
        </label>
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <textarea
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              placeholder="Exemple: Vérifie mes emails de demande de travail et donne-moi un résumé des réponses reçues..."
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 shadow-sm"
              rows={4}
              disabled={isProcessing}
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
              {customInstruction.length}/500
            </div>
          </div>
          <button
            onClick={handleSendCustomInstruction}
            disabled={!customInstruction.trim() || isProcessing}
            className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 self-start transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
            <span className="font-medium">
              {isProcessing ? 'Analyse...' : 'Analyser'}
            </span>
          </button>
        </div>
      </div>

      {/* Affichage des résultats */}
      {(isProcessing || analysisResult) && (
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-bold text-blue-900">
                  {isProcessing ? '🔄 Analyse en cours...' : '✅ Analyse terminée'}
                </h3>
                {analysisResult && (
                  <>
                    <span className="text-sm text-blue-700 bg-blue-100 px-2 py-1 rounded-lg">
                      {analysisResult.stats.analysés} emails analysés
                    </span>
                    <button
                      onClick={() => {
                        setAnalysisResult(null)
                        setCurrentInstruction('')
                      }}
                      className="ml-auto text-sm text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg transition-colors duration-200"
                    >
                      Nouvelle analyse
                    </button>
                  </>
                )}
              </div>
              
              {currentInstruction && (
                <div className="mb-4 p-3 bg-white rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-800 mb-1">Instruction :</p>
                  <p className="text-sm text-blue-700 italic">&quot;{currentInstruction}&quot;</p>
                </div>
              )}

              {isProcessing && (
                <div className="flex items-center gap-2 text-blue-700">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm">Analyse de vos emails en cours...</span>
                </div>
              )}

              {analysisResult && (
                <div className="space-y-4">
                  {/* Statistiques */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-blue-200 text-center shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-center mb-2">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="text-2xl font-bold text-blue-600 mb-1">{analysisResult.stats.total}</div>
                      <div className="text-xs text-blue-700 font-medium">Emails trouvés</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-orange-200 text-center shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-center mb-2">
                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <div className="text-2xl font-bold text-orange-600 mb-1">{analysisResult.stats.nonLus}</div>
                      <div className="text-xs text-orange-700 font-medium">Non lus</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-green-200 text-center shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-center mb-2">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="text-2xl font-bold text-green-600 mb-1">{analysisResult.stats.analysés}</div>
                      <div className="text-xs text-green-700 font-medium">Analysés</div>
                    </div>
                  </div>

                  {/* Résultat de l'analyse */}
                  <div className="bg-white p-6 rounded-xl border border-blue-200 max-h-[500px] overflow-y-auto shadow-sm">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h4 className="font-bold text-gray-900">Résultat de l&apos;Analyse</h4>
                    </div>
                    <div 
                      className="prose prose-sm max-w-none text-gray-800 leading-relaxed break-words overflow-hidden"
                      dangerouslySetInnerHTML={{ __html: formatMessage(analysisResult.summary) }}
                      style={{
                        lineHeight: '1.6',
                        fontSize: '14px',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        hyphens: 'auto',
                        maxWidth: '100%'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toggle templates */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Templates d&apos;Instructions</h3>
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
        >
          {showTemplates ? 'Masquer' : 'Afficher'} les templates
        </button>
      </div>

      {showTemplates && (
        <>
          {/* Filtres par catégorie */}
          <div className="flex gap-3 mb-6 flex-wrap">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                selectedCategory === 'all'
                  ? 'bg-gray-900 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tous
            </button>
            {Object.entries(categoryLabels).map(([key, category]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  selectedCategory === key
                    ? 'bg-gray-900 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* Templates grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="group bg-gray-50 hover:bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg"
                onClick={() => handleUseTemplate(template)}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-10 h-10 bg-gradient-to-br ${template.color} rounded-xl flex items-center justify-center text-white shadow-md group-hover:shadow-lg transition-all duration-200`}>
                    {template.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors duration-200">
                      {template.title}
                    </h4>
                    <span className={`inline-block px-2 py-1 rounded-lg text-xs font-medium border ${categoryLabels[template.category].color}`}>
                      {categoryLabels[template.category].label}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3 leading-relaxed">{template.description}</p>
                <div className="text-xs text-gray-500 bg-white p-3 rounded-lg border border-gray-100 italic">
                  &quot;{template.instruction.substring(0, 80)}...&quot;
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Instructions d'utilisation */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">💡 Conseils d&apos;utilisation</h4>
            <ul className="text-sm text-blue-800 space-y-2 leading-relaxed">
              <li>• <strong>Soyez spécifique</strong> dans vos instructions (période, expéditeur, type d&apos;email)</li>
              <li>• <strong>Utilisez les templates</strong> comme base et personnalisez-les selon vos besoins</li>
              <li>• <strong>L&apos;assistant peut traiter</strong> des demandes complexes et multi-étapes</li>
              <li>• <strong>Les résultats incluront</strong> des résumés détaillés et actions recommandées</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 
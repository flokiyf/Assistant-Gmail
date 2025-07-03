'use client'

import AuthButton from '@/components/AuthButton'
import EmailList from '@/components/EmailList'
import InstructionPanel from '@/components/InstructionPanel'
import { useSession } from 'next-auth/react'

export default function Home() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">MailFlow Pro</h1>
                <p className="text-sm text-gray-500">Assistant de gestion email intelligent</p>
              </div>
            </div>
            <AuthButton />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {!session ? (
          /* Landing Page pour utilisateurs non connectés */
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl mx-auto mb-8">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Gérez vos emails comme un 
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> professionnel</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Analysez, triez et gérez vos emails Gmail avec des instructions intelligentes. 
              Gagnez du temps et restez organisé.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-16">
              <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Recherche Intelligente</h3>
                <p className="text-gray-600">Trouvez rapidement les emails importants avec des recherches avancées.</p>
              </div>
              
              <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyse Automatique</h3>
                <p className="text-gray-600">Obtenez des résumés et des actions recommandées pour vos emails.</p>
              </div>
              
              <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Gain de Temps</h3>
                <p className="text-gray-600">Automatisez votre gestion d&apos;emails et concentrez-vous sur l&apos;essentiel.</p>
              </div>
            </div>
          </div>
        ) : (
          /* Interface principale pour utilisateurs connectés */
          <>
            {/* Panneau d'instructions */}
            <InstructionPanel 
              onSendInstruction={() => {}} // Fonction vide car maintenant géré en interne
            />
            
            {/* Liste des emails */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Vos Emails</h2>
                <p className="text-gray-600">Gérez et analysez vos messages</p>
              </div>
              <EmailList />
            </div>
          </>
        )}
      </main>
    </div>
  )
}

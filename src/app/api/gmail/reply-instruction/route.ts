import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { GmailClient } from '@/lib/gmail'
import { analyzeInstruction, generateReplyFromInstruction } from '@/lib/openai'

interface EmailItem {
  id: string
  from: string
  subject: string
  date: string
  snippet: string
  body?: string
  isRead: boolean
}

interface FilterCriteria {
  specific_sender?: string | null
  category?: string
  keywords?: string[]
  time_period?: string
  email_type?: string
  count_limit?: string
}

// Fonction pour filtrer les emails selon les critères
function filterEmailsByCriteria(emails: EmailItem[], criteria: FilterCriteria): EmailItem[] {
  let filteredEmails = emails
  
  // Filtrer par expéditeur spécifique
  if (criteria.specific_sender) {
    filteredEmails = filteredEmails.filter(email => 
      email.from.toLowerCase().includes(criteria.specific_sender!.toLowerCase())
    )
  }
  
  // Filtrer par catégorie
  if (criteria.category && criteria.category !== 'tous') {
    filteredEmails = filteredEmails.filter(email => {
      const emailContent = (email.subject + ' ' + email.snippet + ' ' + email.from).toLowerCase()
      
      switch (criteria.category) {
        case 'recrutement':
          return emailContent.includes('job') || emailContent.includes('emploi') || 
                 emailContent.includes('recrutement') || emailContent.includes('candidature') ||
                 emailContent.includes('career') || emailContent.includes('hiring') ||
                 emailContent.includes('indeed') || emailContent.includes('linkedin')
        case 'travail':
          return emailContent.includes('travail') || emailContent.includes('bureau') ||
                 emailContent.includes('projet') || emailContent.includes('meeting') ||
                 emailContent.includes('réunion') || emailContent.includes('work')
        case 'client':
          return emailContent.includes('client') || emailContent.includes('commande') ||
                 emailContent.includes('service') || emailContent.includes('support') ||
                 emailContent.includes('customer') || emailContent.includes('order')
        case 'commercial':
          return emailContent.includes('vente') || emailContent.includes('commercial') ||
                 emailContent.includes('promo') || emailContent.includes('offre') ||
                 emailContent.includes('sale') || emailContent.includes('discount')
        case 'personnel':
          return emailContent.includes('personnel') || emailContent.includes('family') ||
                 emailContent.includes('ami') || emailContent.includes('personal')
        default:
          return true
      }
    })
  }
  
  // Filtrer par mots-clés
  if (criteria.keywords && criteria.keywords.length > 0) {
    filteredEmails = filteredEmails.filter(email => {
      const emailContent = (email.subject + ' ' + email.snippet + ' ' + email.from).toLowerCase()
      return criteria.keywords!.some((keyword: string) => 
        emailContent.includes(keyword.toLowerCase())
      )
    })
  }
  
  // Filtrer par période temporelle
  if (criteria.time_period && criteria.time_period !== 'tous') {
    const now = new Date()
    const cutoffDate = new Date()
    
    switch (criteria.time_period) {
      case 'aujourd\'hui':
        cutoffDate.setHours(0, 0, 0, 0)
        break
      case '7 jours':
        cutoffDate.setDate(now.getDate() - 7)
        break
      case '30 jours':
        cutoffDate.setDate(now.getDate() - 30)
        break
      default:
        cutoffDate.setDate(now.getDate() - 20) // Par défaut 20 jours
    }
    
    filteredEmails = filteredEmails.filter(email => {
      const emailDate = new Date(email.date)
      return emailDate >= cutoffDate
    })
  }
  
  // Filtrer par type d'email
  if (criteria.email_type && criteria.email_type !== 'tous') {
    switch (criteria.email_type) {
      case 'non_lus':
        filteredEmails = filteredEmails.filter(email => !email.isRead)
        break
      case 'prioritaires':
        filteredEmails = filteredEmails.filter(email => 
          email.subject.toLowerCase().includes('urgent') || 
          email.subject.toLowerCase().includes('important')
        )
        break
      case 'urgent':
        filteredEmails = filteredEmails.filter(email => 
          email.subject.toLowerCase().includes('urgent') || 
          email.subject.toLowerCase().includes('asap')
        )
        break
    }
  }
  
  // Limiter par nombre selon count_limit
  if (criteria.count_limit) {
    switch (criteria.count_limit) {
      case 'un':
        filteredEmails = filteredEmails.slice(0, 1)
        break
      case 'quelques':
        filteredEmails = filteredEmails.slice(0, 5)
        break
      case 'tous':
        // Garder tous, mais limiter à 20 pour éviter les abus
        filteredEmails = filteredEmails.slice(0, 20)
        break
    }
  }
  
  return filteredEmails
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { instruction } = await request.json()
    if (!instruction) {
      return NextResponse.json({ error: 'Instruction manquante' }, { status: 400 })
    }

    console.log('📝 Instruction reçue:', instruction)

    // Analyser l'instruction pour déterminer si c'est une réponse
    const instructionAnalysis = await analyzeInstruction(instruction)
    console.log('🔍 Analyse de l\'instruction:', instructionAnalysis)
    
    if (!instructionAnalysis.isReplyInstruction) {
      return NextResponse.json({ error: 'Cette instruction n\'est pas une demande de réponse' }, { status: 400 })
    }

    // Créer le client Gmail
    const gmailClient = new GmailClient(session.accessToken)

    // Récupérer les emails récents (50 pour avoir plus de choix)
    const emails = await gmailClient.getMessages(50)
    console.log('📧 Emails récupérés:', emails.length)
    
    // Filtrer les emails selon les critères intelligents
    const criteria = instructionAnalysis.instruction?.targetCriteria || {}
    const filteredEmails = filterEmailsByCriteria(emails, criteria)
    
    console.log('🎯 Emails filtrés selon les critères:', filteredEmails.length)
    console.log('�� Critères appliqués:', criteria)

    // Obtenir le profil utilisateur
    const userProfile = await gmailClient.getUserProfile()

    // Générer les réponses pour les emails filtrés
    const replies = await generateReplyFromInstruction(filteredEmails, instruction, userProfile)
    console.log('💬 Réponses générées:', replies.length)

    // Créer les EmailWithReply pour le retour
    const emailsWithReplies = filteredEmails.map(email => {
      const reply = replies.find(r => r.emailId === email.id)
      return {
        email,
        reply: reply || null
      }
    }).filter(item => item.reply !== null) // Garder seulement ceux avec des réponses

    // Détecter si c'est un envoi automatique
    const automaticKeywords = [
      'automatiquement', 'directement', 'envoie', 'send', 'et envoie', 'puis envoie',
      'sans prévisualisation', 'sans validation', 'immédiatement'
    ]
    
    const isAutomatic = automaticKeywords.some(keyword => 
      instruction.toLowerCase().includes(keyword)
    )

    if (isAutomatic) {
      console.log('🚀 Mode automatique détecté')
      
      // Envoyer automatiquement les réponses
      const sentResults = []
      const failedResults = []
      let sentCount = 0
      let failedCount = 0

      for (const { email, reply } of emailsWithReplies) {
        if (!reply) continue

        try {
          await gmailClient.replyToEmail(email.id, { body: reply.replyBody }, userProfile.email)
          sentResults.push({
            to: email.from,
            subject: reply.replySubject,
            emailId: email.id
          })
          sentCount++
          console.log(`✅ Réponse envoyée à: ${email.from}`)
        } catch (error) {
          console.error(`❌ Erreur envoi réponse à ${email.id}:`, error)
          failedResults.push({
            emailId: email.id,
            error: error instanceof Error ? error.message : 'Erreur inconnue'
          })
          failedCount++
        }
      }

      const totalEmails = emailsWithReplies.length
      const successRate = totalEmails > 0 ? sentCount / totalEmails : 0

      return NextResponse.json({
        message: `🚀 ENVOI AUTOMATIQUE : ${sentCount} réponses envoyées automatiquement`,
        instruction,
        instructionAnalysis,
        emailsWithReplies,
        userProfile,
        isAutomatic: true,
        automaticResults: {
          sent: sentResults,
          failed: failedResults,
          total: totalEmails
        },
        stats: {
          totalEmails: filteredEmails.length,
          repliesGenerated: replies.length,
          averageConfidence: replies.length > 0 ? replies.reduce((sum, r) => sum + r.confidence, 0) / replies.length : 0,
          repliesSent: sentCount,
          repliesFailed: failedCount,
          successRate
        }
      })
    } else {
      console.log('👁️ Mode prévisualisation')
      
      // Mode prévisualisation
      return NextResponse.json({
        message: `${replies.length} réponses générées pour prévisualisation`,
        instruction,
        instructionAnalysis,
        emailsWithReplies,
        userProfile,
        isAutomatic: false,
        stats: {
          totalEmails: filteredEmails.length,
          repliesGenerated: replies.length,
          averageConfidence: replies.length > 0 ? replies.reduce((sum, r) => sum + r.confidence, 0) / replies.length : 0
        }
      })
    }

  } catch (error) {
    console.error('❌ Erreur lors du traitement de l\'instruction de réponse:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erreur interne du serveur' 
    }, { status: 500 })
  }
} 
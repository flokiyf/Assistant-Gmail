import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GmailClient, EmailMessage } from '@/lib/gmail'
import { analyzeInstruction, generateReplyFromInstruction } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { instruction } = body

    if (!instruction) {
      return NextResponse.json({ 
        error: 'Instruction requise' 
      }, { status: 400 })
    }

    // Analyser l'instruction pour déterminer le type
    const instructionAnalysis = await analyzeInstruction(instruction)
    
    if (!instructionAnalysis.isReplyInstruction) {
      return NextResponse.json({ 
        error: 'Cette instruction n\'est pas une instruction de réponse' 
      }, { status: 400 })
    }

    // Créer le client Gmail
    const gmailClient = new GmailClient(session.accessToken)
    
    // Récupérer le profil utilisateur
    const userProfile = await gmailClient.getUserProfile()

    // Déterminer la requête Gmail basée sur l'instruction
    let gmailQuery = 'in:inbox'
    let maxResults = 10 // Par défaut

    // Analyser l'instruction pour optimiser la requête
    const instructionLower = instruction.toLowerCase()
    
    if (instructionLower.includes('non lu') || instructionLower.includes('unread')) {
      gmailQuery += ' is:unread'
    }
    
    if (instructionLower.includes('aujourd\'hui') || instructionLower.includes('today')) {
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '/')
      gmailQuery = `in:inbox after:${today}`
      maxResults = 20
    } else if (instructionLower.includes('hier') || instructionLower.includes('yesterday')) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const dateStr = yesterday.toISOString().split('T')[0].replace(/-/g, '/')
      gmailQuery = `in:inbox after:${dateStr}`
    } else if (instructionLower.includes('cette semaine') || instructionLower.includes('this week')) {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const dateStr = weekAgo.toISOString().split('T')[0].replace(/-/g, '/')
      gmailQuery = `in:inbox after:${dateStr}`
    }

    // Rechercher des expéditeurs spécifiques
    const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g
    const emailMatches = instruction.match(emailRegex)
    if (emailMatches && emailMatches.length > 0) {
      const emailQuery = emailMatches.map(email => `from:${email}`).join(' OR ')
      gmailQuery += ` (${emailQuery})`
    }

    // Rechercher des mots-clés spécifiques
    if (instructionLower.includes('recrutement') || instructionLower.includes('job')) {
      gmailQuery += ' (job OR emploi OR recrutement OR candidature OR CV)'
    }
    
    if (instructionLower.includes('urgent') || instructionLower.includes('important')) {
      gmailQuery += ' is:important'
    }

    if (instructionLower.includes('devis') || instructionLower.includes('quote')) {
      gmailQuery += ' (devis OR quote OR prix OR tarif)'
    }

    if (instructionLower.includes('client') || instructionLower.includes('customer')) {
      gmailQuery += ' (client OR customer OR commande OR order)'
    }

    // Récupérer les emails correspondants
    const emails = await gmailClient.searchMessages(gmailQuery, maxResults)
    
    // Filtrer les emails qui ne sont pas des réponses automatiques ou des notifications
    const filteredEmails = emails.filter((email: EmailMessage) => {
      const from = email.from.toLowerCase()
      const subject = email.subject.toLowerCase()
      
      // Exclure les emails automatiques
      if (from.includes('noreply') || from.includes('no-reply') || from.includes('donotreply')) {
        return false
      }
      
      // Exclure les notifications
      if (subject.includes('notification') || subject.includes('newsletter')) {
        return false
      }
      
      return true
    })

    if (filteredEmails.length === 0) {
      return NextResponse.json({
        message: 'Aucun email correspondant trouvé pour cette instruction',
        emails: [],
        replies: []
      })
    }

    // Générer les réponses avec l'IA
    const generatedReplies = await generateReplyFromInstruction(
      filteredEmails,
      instruction,
      userProfile
    )

    // Préparer les emails avec leurs réponses générées
    const emailsWithReplies = filteredEmails.map(email => {
      const reply = generatedReplies.find(r => r.emailId === email.id)
      return {
        email: {
          id: email.id,
          from: email.from,
          subject: email.subject,
          date: email.date,
          snippet: email.snippet,
          body: email.body,
          isRead: email.isRead
        },
        reply: reply || null
      }
    })

    return NextResponse.json({
      message: `${generatedReplies.length} réponses générées pour ${filteredEmails.length} emails`,
      instruction: instruction,
      instructionAnalysis,
      emailsWithReplies,
      userProfile,
      stats: {
        totalEmails: filteredEmails.length,
        repliesGenerated: generatedReplies.length,
        averageConfidence: generatedReplies.length > 0 
          ? generatedReplies.reduce((sum, reply) => sum + reply.confidence, 0) / generatedReplies.length
          : 0
      }
    })

  } catch (error) {
    console.error('Erreur lors du traitement de l\'instruction de réponse:', error)
    return NextResponse.json({ 
      error: 'Erreur lors du traitement de votre instruction',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
} 
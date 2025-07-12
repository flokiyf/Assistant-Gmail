import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { GmailClient } from '@/lib/gmail'
import { analyzeInstruction, generateReplyFromInstruction } from '@/lib/openai'

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

    // Analyser l'instruction pour déterminer si c'est une réponse
    const instructionAnalysis = await analyzeInstruction(instruction)
    
    if (!instructionAnalysis.isReplyInstruction) {
      return NextResponse.json({ error: 'Cette instruction n\'est pas une demande de réponse' }, { status: 400 })
    }

    // Créer le client Gmail
    const gmailClient = new GmailClient(session.accessToken)

    // Récupérer les emails récents (20 derniers jours)
    const emails = await gmailClient.getMessages(50)
    
    // Filtrer les emails selon l'instruction
    const recentEmails = emails.filter(email => {
      const emailDate = new Date(email.date)
      const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
      return emailDate > twentyDaysAgo
    })

    // Obtenir le profil utilisateur
    const userProfile = await gmailClient.getUserProfile()

    // Générer les réponses pour tous les emails
    const replies = await generateReplyFromInstruction(recentEmails, instruction, userProfile)

    // Créer les EmailWithReply pour le retour
    const emailsWithReplies = recentEmails.map(email => {
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
      // Envoyer automatiquement les réponses
      const sentResults = []
      const failedResults = []
      let sentCount = 0
      let failedCount = 0

      // Limiter à 20 emails maximum pour éviter les abus
      const emailsToProcess = emailsWithReplies.slice(0, 20)

      for (const { email, reply } of emailsToProcess) {
        if (!reply) continue

        try {
          await gmailClient.replyToEmail(email.id, { body: reply.replyBody }, userProfile.email)
          sentResults.push({
            to: email.from,
            subject: reply.replySubject,
            emailId: email.id
          })
          sentCount++
        } catch (error) {
          console.error(`Erreur envoi réponse à ${email.id}:`, error)
          failedResults.push({
            emailId: email.id,
            error: error instanceof Error ? error.message : 'Erreur inconnue'
          })
          failedCount++
        }
      }

      const totalEmails = emailsToProcess.length
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
          totalEmails,
          repliesGenerated: replies.length,
          averageConfidence: replies.length > 0 ? replies.reduce((sum, r) => sum + r.confidence, 0) / replies.length : 0,
          repliesSent: sentCount,
          repliesFailed: failedCount,
          successRate
        }
      })
    } else {
      // Mode prévisualisation
      return NextResponse.json({
        message: `${replies.length} réponses générées pour prévisualisation`,
        instruction,
        instructionAnalysis,
        emailsWithReplies,
        userProfile,
        isAutomatic: false,
        stats: {
          totalEmails: recentEmails.length,
          repliesGenerated: replies.length,
          averageConfidence: replies.length > 0 ? replies.reduce((sum, r) => sum + r.confidence, 0) / replies.length : 0
        }
      })
    }

  } catch (error) {
    console.error('Erreur lors du traitement de l\'instruction de réponse:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erreur interne du serveur' 
    }, { status: 500 })
  }
} 
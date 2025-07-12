import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GmailClient, ReplyData } from '@/lib/gmail'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { replies } = body

    if (!replies || !Array.isArray(replies)) {
      return NextResponse.json({ 
        error: 'Liste des réponses requise' 
      }, { status: 400 })
    }

    // Créer le client Gmail
    const gmailClient = new GmailClient(session.accessToken)
    
    // Récupérer le profil utilisateur
    const userProfile = await gmailClient.getUserProfile()

    const results = []
    let successCount = 0
    let errorCount = 0

    // Traiter chaque réponse
    for (const reply of replies) {
      try {
        const { emailId, replyBody, approved } = reply
        
        if (!approved) {
          results.push({
            emailId,
            status: 'skipped',
            message: 'Réponse non approuvée'
          })
          continue
        }

        if (!emailId || !replyBody) {
          results.push({
            emailId: emailId || 'unknown',
            status: 'error',
            message: 'Email ID ou corps de réponse manquant'
          })
          errorCount++
          continue
        }

        // Créer les données de réponse
        const replyData: ReplyData = {
          body: replyBody
        }

        // Envoyer la réponse
        const sentMessageId = await gmailClient.replyToEmail(
          emailId,
          replyData,
          userProfile.email
        )

        results.push({
          emailId,
          sentMessageId,
          status: 'sent',
          message: 'Réponse envoyée avec succès'
        })
        successCount++

      } catch (error) {
        console.error(`Erreur lors de l'envoi de la réponse pour ${reply.emailId}:`, error)
        results.push({
          emailId: reply.emailId,
          status: 'error',
          message: error instanceof Error ? error.message : 'Erreur inconnue'
        })
        errorCount++
      }
    }

    return NextResponse.json({
      message: `${successCount} réponses envoyées, ${errorCount} erreurs`,
      results,
      stats: {
        total: replies.length,
        sent: successCount,
        errors: errorCount,
        skipped: replies.length - successCount - errorCount
      }
    })

  } catch (error) {
    console.error('Erreur lors de l\'envoi des réponses:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de l\'envoi des réponses',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
} 
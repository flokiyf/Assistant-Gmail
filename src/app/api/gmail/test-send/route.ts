import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { GmailClient } from '@/lib/gmail'

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    console.log('🧪 Début du test d\'envoi d\'email')
    console.log('🔑 Access token présent:', !!session.accessToken)

    // Créer le client Gmail
    const gmailClient = new GmailClient(session.accessToken)

    // Obtenir le profil utilisateur
    const userProfile = await gmailClient.getUserProfile()
    console.log('👤 Profil utilisateur:', userProfile)

    // Test d'envoi simple à soi-même
    const testEmailData = {
      to: userProfile.email,
      subject: 'Test envoi - Assistant Gmail',
      body: `Ceci est un test d'envoi d'email.\n\nDate: ${new Date().toLocaleString()}\n\nSi vous recevez cet email, l'envoi fonctionne correctement.`,
    }

    console.log('📧 Tentative d\'envoi d\'email de test:', testEmailData)

    const messageId = await gmailClient.sendEmail(testEmailData, userProfile.email)
    
    console.log('✅ Email de test envoyé avec succès!')

    return NextResponse.json({
      success: true,
      message: 'Email de test envoyé avec succès',
      messageId,
      userProfile,
      testEmailData
    })

  } catch (error) {
    console.error('❌ Erreur lors du test d\'envoi:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      details: error
    }, { status: 500 })
  }
} 
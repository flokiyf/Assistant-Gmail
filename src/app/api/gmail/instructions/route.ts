import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GmailClient } from '@/lib/gmail'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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

    // Créer le client Gmail
    const gmailClient = new GmailClient(session.accessToken)

    // Déterminer la requête Gmail basée sur l'instruction
    let gmailQuery = 'in:inbox'
    let maxResults = 25 // Par défaut, analyser 25 emails

    // Analyser l'instruction pour optimiser la requête
    const instructionLower = instruction.toLowerCase()
    
    if (instructionLower.includes('aujourd\'hui') || instructionLower.includes('today')) {
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '/')
      gmailQuery = `in:inbox after:${today}`
      maxResults = 20
    } else if (instructionLower.includes('7 derniers jours') || instructionLower.includes('semaine')) {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const dateStr = weekAgo.toISOString().split('T')[0].replace(/-/g, '/')
      gmailQuery = `in:inbox after:${dateStr}`
    } else if (instructionLower.includes('15 derniers jours')) {
      const daysAgo = new Date()
      daysAgo.setDate(daysAgo.getDate() - 15)
      const dateStr = daysAgo.toISOString().split('T')[0].replace(/-/g, '/')
      gmailQuery = `in:inbox after:${dateStr}`
    } else if (instructionLower.includes('30 derniers jours') || instructionLower.includes('mois')) {
      const monthAgo = new Date()
      monthAgo.setDate(monthAgo.getDate() - 30)
      const dateStr = monthAgo.toISOString().split('T')[0].replace(/-/g, '/')
      gmailQuery = `in:inbox after:${dateStr}`
    }

    // Ajouter des filtres spécifiques selon l'instruction
    if (instructionLower.includes('non lu') || instructionLower.includes('unread')) {
      gmailQuery += ' is:unread'
    }
    
    if (instructionLower.includes('urgent') || instructionLower.includes('important')) {
      gmailQuery += ' is:important'
    }

    if (instructionLower.includes('indeed') || instructionLower.includes('linkedin')) {
      gmailQuery += ' (from:indeed.com OR from:linkedin.com OR from:noreply@linkedin.com OR from:jobs-noreply@linkedin.com)'
    }

    // Récupérer les emails
    const emails = await gmailClient.searchMessages(gmailQuery, maxResults)

    // Préparer le contexte pour l'IA avec le contenu complet
    const emailContext = emails.slice(0, 10).map((email) => ({
      id: email.id,
      sujet: email.subject || 'Aucun sujet',
      expediteur: email.from,
      destinataire: email.to,
      date: email.date,
      snippet: email.snippet,
      contenu: email.body || email.snippet, // Utiliser le contenu complet
      nonLu: !email.isRead,
      threadId: email.threadId
    }))

    const emailStats = {
      total: emails.length,
      nonLus: emails.filter(e => !e.isRead).length,
      analysés: Math.min(emails.length, 10)
    }

    const prompt = `
Tu es un assistant IA spécialisé dans l'analyse d'emails Gmail. L'utilisateur t'a donné une instruction spécifique à exécuter.

INSTRUCTION DE L'UTILISATEUR : "${instruction}"

STATISTIQUES :
- Total d'emails récupérés : ${emailStats.total}
- Emails non lus : ${emailStats.nonLus}
- Emails analysés en détail : ${emailStats.analysés}

CONTEXTE DES EMAILS (avec contenu complet) :
${emailContext.map((email, index) => 
  `${index + 1}. ID: ${email.id}
   Sujet: "${email.sujet}"
   De: ${email.expediteur}
   À: ${email.destinataire}
   Date: ${email.date}
   Non lu: ${email.nonLu ? 'Oui' : 'Non'}
   Contenu complet: ${email.contenu.substring(0, 1000)}${email.contenu.length > 1000 ? '...' : ''}
   ---`
).join('\n')}

INSTRUCTIONS D'ANALYSE :
- Analyse le contenu COMPLET des emails, pas seulement les aperçus
- Réponds précisément à l'instruction donnée
- Utilise un format structuré avec des sections claires
- Inclus tous les détails pertinents (noms d'entreprises, postes, salaires, dates, etc.)
- Utilise des emojis pour améliorer la lisibilité
- Classe les informations par ordre d'importance ou de pertinence
- Donne des recommandations d'actions si approprié

Exécute l'instruction et fournis une réponse détaillée et structurée.
`

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Tu es un assistant Gmail IA expert qui analyse les emails en profondeur. Tu réponds toujours en français avec des analyses détaillées et structurées. Tu utilises le contenu complet des emails pour tes analyses."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    })

    const summary = completion.choices[0]?.message?.content

    if (!summary) {
      throw new Error('Pas de réponse de OpenAI')
    }

    return NextResponse.json({ 
      result: {
        summary,
        stats: emailStats,
        emailsAnalyzed: emailContext.length
      }
    })

  } catch (error) {
    console.error('Erreur lors du traitement de l\'instruction:', error)
    return NextResponse.json({ 
      error: 'Erreur lors du traitement de votre instruction',
      result: {
        summary: 'Désolé, je n\'ai pas pu traiter votre instruction. Veuillez réessayer.',
        stats: { total: 0, nonLus: 0, analysés: 0 }
      }
    }, { status: 500 })
  }
} 
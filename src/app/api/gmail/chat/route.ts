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
    const { message, emails } = body

    if (!message) {
      return NextResponse.json({ 
        error: 'Message requis' 
      }, { status: 400 })
    }

    // Si les emails ne sont pas fournis, les récupérer via Gmail
    let emailsToAnalyze = emails
    if (!emails || emails.length === 0) {
      const gmailClient = new GmailClient(session.accessToken)
      emailsToAnalyze = await gmailClient.getMessages(15) // Récupérer 15 emails
    }

    // Préparer le contexte des emails pour l'IA avec le contenu complet
    const emailContext = emailsToAnalyze?.slice(0, 15).map((email: any) => ({
      id: email.id,
      sujet: email.subject || 'Aucun sujet',
      expediteur: email.from,
      destinataire: email.to,
      date: email.date,
      snippet: email.snippet,
      contenu: email.body || email.snippet, // Utiliser le contenu complet
      nonLu: !email.isRead
    })) || []

    const emailStats = {
      total: emailsToAnalyze?.length || 0,
      nonLus: emailsToAnalyze?.filter((e: any) => !e.isRead).length || 0,
      aujourdhui: emailsToAnalyze?.filter((e: any) => {
        const today = new Date().toDateString()
        return new Date(e.date).toDateString() === today
      }).length || 0
    }

    const prompt = `
Tu es un assistant IA spécialisé dans l'analyse d'emails Gmail. L'utilisateur te pose une question sur sa boîte mail.

STATISTIQUES DE LA BOÎTE MAIL :
- Total d'emails : ${emailStats.total}
- Emails non lus : ${emailStats.nonLus}
- Emails d'aujourd'hui : ${emailStats.aujourdhui}

CONTEXTE DES EMAILS (avec contenu complet) :
${emailContext.map((email: any, index: number) => 
  `${index + 1}. ID: ${email.id}
   Sujet: "${email.sujet}"
   De: ${email.expediteur}
   À: ${email.destinataire}
   Date: ${email.date}
   Non lu: ${email.nonLu ? 'Oui' : 'Non'}
   Contenu complet: ${email.contenu.substring(0, 800)}${email.contenu.length > 800 ? '...' : ''}
   ---`
).join('\n')}

QUESTION DE L'UTILISATEUR : "${message}"

INSTRUCTIONS :
- Réponds en français de manière conversationnelle et utile
- Utilise les données complètes des emails pour répondre précisément
- Si la question porte sur des emails spécifiques, cite-les avec leurs détails
- Sois concis mais informatif
- Utilise des emojis pour rendre la réponse plus engageante
- Si tu ne peux pas répondre avec les données disponibles, dis-le clairement
- Analyse le contenu COMPLET des emails, pas seulement les aperçus

Réponds directement à la question sans préambule.
`

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Tu es un assistant Gmail IA qui aide les utilisateurs à gérer et comprendre leurs emails. Tu réponds toujours en français de manière claire et utile. Tu utilises le contenu complet des emails pour tes analyses."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    })

    const response = completion.choices[0]?.message?.content

    if (!response) {
      throw new Error('Pas de réponse de OpenAI')
    }

    return NextResponse.json({ response })

  } catch (error) {
    console.error('Erreur lors du chat:', error)
    return NextResponse.json({ 
      error: 'Erreur lors du traitement de votre question',
      response: 'Désolé, je n\'ai pas pu traiter votre question. Veuillez réessayer.' 
    }, { status: 500 })
  }
} 
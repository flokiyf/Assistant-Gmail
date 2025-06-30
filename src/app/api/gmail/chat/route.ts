import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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

    // Préparer le contexte des emails pour l'IA
    const emailContext = emails?.map((email: any) => ({
      sujet: email.subject || 'Aucun sujet',
      expediteur: email.from,
      date: email.date,
      snippet: email.snippet,
      nonLu: !email.isRead
    })) || []

    const emailStats = {
      total: emails?.length || 0,
      nonLus: emails?.filter((e: any) => !e.isRead).length || 0,
      aujourdhui: emails?.filter((e: any) => {
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

CONTEXTE DES EMAILS (les 10 plus récents) :
${emailContext.slice(0, 10).map((email: any, index: number) => 
  `${index + 1}. Sujet: "${email.sujet}" | De: ${email.expediteur} | Date: ${email.date} | Non lu: ${email.nonLu ? 'Oui' : 'Non'} | Aperçu: ${email.snippet}`
).join('\n')}

QUESTION DE L'UTILISATEUR : "${message}"

INSTRUCTIONS :
- Réponds en français de manière conversationnelle et utile
- Utilise les données des emails pour répondre précisément
- Si la question porte sur des emails spécifiques, cite-les
- Sois concis mais informatif
- Utilise des emojis pour rendre la réponse plus engageante
- Si tu ne peux pas répondre avec les données disponibles, dis-le clairement

Réponds directement à la question sans préambule.
`

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Tu es un assistant Gmail IA qui aide les utilisateurs à gérer et comprendre leurs emails. Tu réponds toujours en français de manière claire et utile."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
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
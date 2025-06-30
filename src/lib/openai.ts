import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface EmailAnalysis {
  summary: string
  sentiment: 'positive' | 'negative' | 'neutral'
  priority: 'high' | 'medium' | 'low'
  category: string
  keyPoints: string[]
  suggestedActions: string[]
}

export async function analyzeEmail(
  subject: string,
  body: string,
  sender: string
): Promise<EmailAnalysis> {
  try {
    const prompt = `
Analyse cet email et fournis une réponse en JSON avec cette structure exacte :

{
  "summary": "Résumé en français de l'email en 2-3 phrases",
  "sentiment": "positive|negative|neutral",
  "priority": "high|medium|low", 
  "category": "catégorie de l'email (ex: travail, personnel, commercial, etc.)",
  "keyPoints": ["point clé 1", "point clé 2", "point clé 3"],
  "suggestedActions": ["action suggérée 1", "action suggérée 2"]
}

EMAIL À ANALYSER :
Expéditeur: ${sender}
Sujet: ${subject}
Corps: ${body}

Réponds UNIQUEMENT avec le JSON, sans autre texte.
`

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Tu es un assistant qui analyse les emails et répond uniquement en JSON valide."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('Pas de réponse de OpenAI')
    }

    // Parse le JSON de la réponse
    const analysis = JSON.parse(response) as EmailAnalysis
    return analysis

  } catch (error) {
    console.error('Erreur lors de l\'analyse de l\'email:', error)
    
    // Retourne une analyse par défaut en cas d'erreur
    return {
      summary: 'Impossible d\'analyser cet email',
      sentiment: 'neutral',
      priority: 'medium',
      category: 'autre',
      keyPoints: ['Analyse non disponible'],
      suggestedActions: ['Lire manuellement l\'email']
    }
  }
} 
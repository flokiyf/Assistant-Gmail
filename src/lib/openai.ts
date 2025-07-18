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

// Nouvelles interfaces pour les réponses
export interface GeneratedReply {
  emailId: string
  originalFrom: string
  originalSubject: string
  replySubject: string
  replyBody: string
  tone: string
  confidence: number
  reasoning: string
}

export interface ReplyInstruction {
  type: 'reply'
  tone: string
  style: string
  action: string
  targetEmails: string[]
  customMessage?: string
  targetCriteria?: {
    specific_sender?: string | null
    category?: string
    keywords?: string[]
    time_period?: string
    email_type?: string
    count_limit?: string
  }
}

export interface InstructionAnalysis {
  isReplyInstruction: boolean
  isAnalysisInstruction: boolean
  instruction: ReplyInstruction | null
  confidence: number
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

// Nouvelle fonction pour analyser le type d'instruction
export async function analyzeInstruction(instruction: string): Promise<InstructionAnalysis> {
  try {
    const prompt = `
Analyse cette instruction et détermine si c'est une instruction de RÉPONSE ou d'ANALYSE d'emails.

INSTRUCTION: "${instruction}"

Réponds en JSON avec cette structure exacte :

{
  "isReplyInstruction": true/false,
  "isAnalysisInstruction": true/false,
  "tone": "professionnel|amical|formel|décontracté|neutre",
  "style": "court|moyen|long|détaillé",
  "action": "accusé de réception|remerciement|information|proposition|autre",
  "targetCriteria": {
    "specific_sender": "email ou nom spécifique ou null",
    "category": "recrutement|travail|personnel|client|commercial|tous|null",
    "keywords": ["mot-clé1", "mot-clé2"] ou [],
    "time_period": "aujourd'hui|7 jours|30 jours|tous",
    "email_type": "non_lus|tous|prioritaires|urgent",
    "count_limit": "un|quelques|tous"
  },
  "confidence": 0.0-1.0
}

RÈGLES :
- Si l'instruction contient "réponds", "reply", "envoie", "écris" → isReplyInstruction = true
- Si l'instruction contient "analyse", "montre", "trouve", "liste" → isAnalysisInstruction = true
- Extrais les critères de ciblage précis :
  * specific_sender: si un email/nom spécifique est mentionné
  * category: type d'emails (recrutement, travail, etc.)
  * keywords: mots-clés à rechercher dans les emails
  * time_period: période temporelle mentionnée
  * email_type: type d'emails (non lus, tous, etc.)
  * count_limit: si l'instruction demande un, quelques ou tous les emails

EXEMPLES :
- "Réponds à l'email de flokiyf@gmail.com" → specific_sender: "flokiyf@gmail.com", count_limit: "un"
- "Réponds aux emails de recrutement" → category: "recrutement", count_limit: "tous"
- "Réponds automatiquement à tous les emails non lus" → email_type: "non_lus", count_limit: "tous"
- "Réponds aux emails contenant 'job' ou 'emploi'" → keywords: ["job", "emploi"]

Réponds UNIQUEMENT avec le JSON.
`

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Tu es un assistant qui analyse les instructions et répond uniquement en JSON valide."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 500
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('Pas de réponse de OpenAI')
    }

    const analysis = JSON.parse(response)
    
    return {
      isReplyInstruction: analysis.isReplyInstruction || false,
      isAnalysisInstruction: analysis.isAnalysisInstruction || false,
      instruction: analysis.isReplyInstruction ? {
        type: 'reply',
        tone: analysis.tone || 'neutre',
        style: analysis.style || 'moyen',
        action: analysis.action || 'autre',
        targetEmails: [],
        customMessage: instruction,
        targetCriteria: analysis.targetCriteria || {}
      } : null,
      confidence: analysis.confidence || 0.5
    }

  } catch (error) {
    console.error('Erreur lors de l\'analyse de l\'instruction:', error)
    
    // Analyse basique par mots-clés en cas d'erreur
    const lowerInstruction = instruction.toLowerCase()
    const replyKeywords = ['réponds', 'reply', 'envoie', 'écris', 'send', 'respond']
    const analysisKeywords = ['analyse', 'montre', 'trouve', 'liste', 'analyze', 'show', 'find', 'list']
    
    const isReply = replyKeywords.some(keyword => lowerInstruction.includes(keyword))
    const isAnalysis = analysisKeywords.some(keyword => lowerInstruction.includes(keyword))
    
    // Détection basique des critères
    const targetCriteria = {
      specific_sender: null,
      category: lowerInstruction.includes('recrutement') ? 'recrutement' : 
                lowerInstruction.includes('travail') ? 'travail' : 
                lowerInstruction.includes('client') ? 'client' : 'tous',
      keywords: [],
      time_period: lowerInstruction.includes('aujourd\'hui') ? 'aujourd\'hui' : 
                   lowerInstruction.includes('7 jours') ? '7 jours' : '30 jours',
      email_type: lowerInstruction.includes('non lus') ? 'non_lus' : 'tous',
      count_limit: lowerInstruction.includes('un') || lowerInstruction.includes('seul') ? 'un' : 'tous'
    }
    
    return {
      isReplyInstruction: isReply,
      isAnalysisInstruction: isAnalysis,
      instruction: isReply ? {
        type: 'reply',
        tone: 'neutre',
        style: 'moyen',
        action: 'autre',
        targetEmails: [],
        customMessage: instruction,
        targetCriteria
      } : null,
      confidence: 0.7
    }
  }
}

interface EmailData {
  id: string
  from: string
  subject: string
  date: string
  body?: string
  snippet: string
}

interface UserProfile {
  email: string
  name: string
}

// Nouvelle fonction pour générer des réponses automatiques
export async function generateReplyFromInstruction(
  emails: EmailData[],
  instruction: string,
  userProfile?: UserProfile
): Promise<GeneratedReply[]> {
  try {
    const replies: GeneratedReply[] = []
    
    // Limiter le nombre d'emails traités en une fois pour éviter les timeouts
    const maxEmails = 20
    const emailsToProcess = emails.slice(0, maxEmails)
    
    for (const email of emailsToProcess) {
      try {
        // Limiter la longueur du contenu d'email pour éviter le dépassement de contexte
        const emailContent = email.body || email.snippet
        const maxContentLength = 1000 // Limite à 1000 caractères
        const truncatedContent = emailContent.length > maxContentLength 
          ? emailContent.substring(0, maxContentLength) + '...'
          : emailContent

        const prompt = `
Tu es un assistant IA qui génère des réponses d'emails personnalisées.

INSTRUCTION DE L'UTILISATEUR: "${instruction}"

EMAIL ORIGINAL:
- Expéditeur: ${email.from}
- Sujet: ${email.subject}
- Date: ${email.date}
- Corps: ${truncatedContent}

PROFIL UTILISATEUR:
- Email: ${userProfile?.email || 'utilisateur@exemple.com'}
- Nom: ${userProfile?.name || 'Utilisateur'}

GÉNÈRE UNE RÉPONSE EN JSON:
{
  "replyBody": "Corps de la réponse en français, personnalisé selon l'instruction",
  "tone": "professionnel|amical|formel|décontracté",
  "confidence": 0.0-1.0,
  "reasoning": "Courte explication de la réponse générée"
}

INSTRUCTIONS:
1. Respecte exactement l'instruction donnée
2. Adapte le ton selon le contexte (professionnel vs personnel)
3. Sois poli et courtois
4. Garde une longueur appropriée (ni trop court ni trop long)
5. Inclus une formule de politesse
6. Personnalise selon le contenu de l'email original

Réponds UNIQUEMENT avec le JSON, sans autre texte.
`

        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "Tu es un assistant expert en rédaction d'emails professionnels. Tu génères des réponses appropriées et personnalisées."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 400
        })

        const response = completion.choices[0]?.message?.content
        if (!response) {
          console.log(`Pas de réponse générée pour l'email ${email.id}`)
          continue
        }

        try {
          const replyData = JSON.parse(response)
          
          // Créer le sujet de réponse
          const replySubject = email.subject.startsWith('Re: ') 
            ? email.subject 
            : `Re: ${email.subject}`

          replies.push({
            emailId: email.id,
            originalFrom: email.from,
            originalSubject: email.subject,
            replySubject,
            replyBody: replyData.replyBody,
            tone: replyData.tone || 'neutre',
            confidence: replyData.confidence || 0.5,
            reasoning: replyData.reasoning || 'Réponse générée automatiquement'
          })
        } catch (parseError) {
          console.error(`Erreur lors du parsing de la réponse pour l'email ${email.id}:`, parseError)
          continue
        }
      } catch (emailError) {
        console.error(`Erreur lors de la génération de réponse pour l'email ${email.id}:`, emailError)
        continue
      }
    }

    return replies

  } catch (error) {
    console.error('Erreur lors de la génération des réponses:', error)
    return []
  }
}

// Nouvelle fonction pour générer une réponse simple
export async function generateSimpleReply(
  originalEmail: EmailData,
  replyType: 'acknowledgment' | 'thanks' | 'info_request' | 'meeting_proposal' | 'custom',
  customMessage?: string,
  userProfile?: UserProfile
): Promise<string> {
  try {
    let replyTemplate = ''
    
    switch (replyType) {
      case 'acknowledgment':
        replyTemplate = 'Générer un accusé de réception professionnel'
        break
      case 'thanks':
        replyTemplate = 'Générer un message de remerciement chaleureux'
        break
      case 'info_request':
        replyTemplate = 'Demander plus d\'informations de manière polie'
        break
      case 'meeting_proposal':
        replyTemplate = 'Proposer une réunion ou un rendez-vous'
        break
      case 'custom':
        replyTemplate = customMessage || 'Générer une réponse appropriée'
        break
    }

    const prompt = `
Génère une réponse d'email en français selon cette instruction: "${replyTemplate}"

EMAIL ORIGINAL:
- Expéditeur: ${originalEmail.from}
- Sujet: ${originalEmail.subject}
- Corps: ${originalEmail.body || originalEmail.snippet}

PROFIL UTILISATEUR:
- Nom: ${userProfile?.name || 'Utilisateur'}

INSTRUCTIONS:
1. Sois professionnel mais amical
2. Réponds directement au contenu de l'email
3. Utilise une formule de politesse appropriée
4. Garde une longueur raisonnable
5. Assure-toi que la réponse est en français

Réponds UNIQUEMENT avec le corps de l'email, sans sujet ni métadonnées.
`

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Tu es un assistant expert en rédaction d'emails professionnels en français."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.6,
      max_tokens: 300
    })

    const response = completion.choices[0]?.message?.content
    return response || 'Bonjour,\n\nMerci pour votre email.\n\nCordialement'

  } catch (error) {
    console.error('Erreur lors de la génération de la réponse simple:', error)
    return 'Bonjour,\n\nMerci pour votre email.\n\nCordialement'
  }
} 
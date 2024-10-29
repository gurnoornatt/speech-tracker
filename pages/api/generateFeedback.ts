// pages/api/generateFeedback.ts
import type { NextApiRequest, NextApiResponse } from 'next'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

if (!OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY in environment variables')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        console.warn(`Unsupported method: ${req.method}`)
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { transcription } = req.body

    if (!transcription || typeof transcription !== 'string') {
        console.warn('Invalid transcription data')
        return res.status(400).json({ error: 'Invalid transcription data' })
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an assistant that provides constructive feedback on speech performance.',
                    },
                    {
                        role: 'user',
                        content: `Here is a transcription of a speech: "${transcription}"`,
                    },
                    {
                        role: 'user',
                        content: 'Provide compliments and improvement tips based on the speech performance.',
                    },
                ],
                max_tokens: 150,
                temperature: 0.7,
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('OpenAI ChatGPT API Error:', data)
            return res.status(response.status).json({ error: data.error.message || 'Failed to generate feedback' })
        }

        const feedback = data.choices[0].message.content.trim()

        console.log('Feedback:', feedback)
        res.status(200).json({ feedback })
    } catch (error) {
        console.error('Error generating feedback:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}

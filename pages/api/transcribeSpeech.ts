// pages/api/transcribeSpeech.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import FormData from 'form-data'
import axios from 'axios'

// Disable Next.js default body parser to handle multipart/form-data
export const config = {
    api: {
        bodyParser: false,
    },
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

if (!OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY in environment variables')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        console.warn(`Unsupported method: ${req.method}`)
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const form = new formidable.IncomingForm()

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('Error parsing form data:', err)
            return res.status(400).json({ error: 'Error parsing form data' })
        }

        const file = files.file as formidable.File

        if (!file) {
            console.warn('No file received in transcribeSpeech')
            return res.status(400).json({ error: 'No file uploaded' })
        }

        try {
            const fileStream = fs.createReadStream(file.filepath)

            const formData = new FormData()
            formData.append('file', fileStream, file.originalFilename || 'speech.wav')
            formData.append('model', 'whisper-1')
            formData.append('response_format', 'json')

            const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
                headers: {
                    ...formData.getHeaders(),
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                },
            })

            const data = response.data
            const transcription = data.text.trim()

            console.log('Transcription:', transcription)
            res.status(200).json({ transcription })
        } catch (error: any) {
            console.error('OpenAI Whisper API Error:', error.response?.data || error.message)
            res.status(500).json({ error: 'Failed to transcribe speech' })
        }
    })
}

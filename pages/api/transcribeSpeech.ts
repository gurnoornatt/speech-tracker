// pages/api/transcribeSpeech.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import FormData from 'form-data'

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
    console.log('Received request:', req.method, req.url)

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

        console.log('Parsed fields:', fields)
        console.log('Parsed files:', files)

        const file = files.file as formidable.File

        if (!file) {
            console.warn('No file received in transcribeSpeech')
            return res.status(400).json({ error: 'No file uploaded' })
        }

        console.log('Received file:', file.originalFilename, file.size, file.mimetype)

        try {
            // Ensure the file exists and can be read
            if (!fs.existsSync(file.filepath)) {
                console.error('File does not exist:', file.filepath)
                return res.status(400).json({ error: 'Uploaded file not found' })
            }

            const fileStream = fs.createReadStream(file.filepath)

            // Verify that the file stream is readable
            fileStream.on('error', (streamErr) => {
                console.error('Error reading file stream:', streamErr)
            })

            const formData = new FormData()
            formData.append('file', fileStream, file.originalFilename || 'speech.wav')
            formData.append('model', 'whisper-1')
            formData.append('response_format', 'json')
            // Removed 'timestamp_granularities' as it's not recognized by OpenAI Whisper API

            // Log formData fields (Cannot log the actual data since it's a stream)
            console.log('FormData fields set: file, model, response_format')

            // Merge formData headers with Authorization
            const headers = {
                ...formData.getHeaders(),
                Authorization: `Bearer ${OPENAI_API_KEY}`,
            }

            console.log('Headers for OpenAI API:', headers)

            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: headers,
                body: formData,
            })

            console.log('Sent request to OpenAI Whisper API. Status:', response.status)

            if (!response.ok) {
                let errorMessage = 'Failed to transcribe speech'
                try {
                    const errorData = await response.json()
                    errorMessage = errorData.error.message || errorMessage
                    console.error('OpenAI Whisper API Error:', errorData)
                } catch (parseError) {
                    console.error('Error parsing OpenAI error response:', parseError)
                }
                return res.status(response.status).json({ error: errorMessage })
            }

            const data = await response.json()
            console.log('Received transcription data:', data)

            const transcription = data.text.trim()

            console.log('Transcription:', transcription)
            res.status(200).json({ transcription })
        } catch (error) {
            console.error('Error in transcribeSpeech handler:', error)
            res.status(500).json({ error: 'Internal server error' })
        }
    })
}

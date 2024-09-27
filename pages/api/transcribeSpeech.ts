// /pages/api/transcribeSpeech.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import { ReadStream } from 'fs';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY in environment variables');
}

export const config = {
    api: {
        bodyParser: false, // Disallow body parsing, consume as stream
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        console.warn(`Unsupported method: ${req.method}`);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('Error parsing form data:', err);
            return res.status(400).json({ error: 'Error parsing form data' });
        }

        const file = Array.isArray(files.file) ? files.file[0] : files.file;

        if (!file) {
            console.warn('No file received in transcribeSpeech');
            return res.status(400).json({ error: 'No file uploaded' });
        }

        try {
            const fileStream = fs.createReadStream(file.filepath);

            const buffer = await streamToBuffer(fileStream);
            const blob = new Blob([buffer]);
            const formData = new FormData();
            formData.append('file', blob, file.originalFilename || 'speech.wav');
            formData.append('model', 'whisper-1');

            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('OpenAI Whisper API Error:', errorData);
                return res.status(response.status).json({ error: errorData.error.message || 'Failed to transcribe speech' });
            }

            const data = await response.json();
            const transcription = data.text.trim();

            console.log('Transcription:', transcription);
            res.status(200).json({ transcription });
        } catch (error) {
            console.error('Error in transcribeSpeech handler:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
}

// Helper function to convert stream to buffer
async function streamToBuffer(stream: ReadStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
}




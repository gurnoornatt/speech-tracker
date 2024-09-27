// /pages/api/generateParagraph.ts
import type { NextApiRequest, NextApiResponse } from 'next';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY in environment variables');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        console.warn(`Unsupported method: ${req.method}`);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { mode } = req.body;

    if (!mode || (mode !== 'Casual' && mode !== 'Formal')) {
        console.warn(`Invalid mode received: ${mode}`);
        return res.status(400).json({ error: 'Invalid mode' });
    }

    try {
        const prompt =
            mode === 'Casual'
                ? 'Generate a casual paragraph for someone to read aloud.'
                : 'Generate a formal paragraph for someone to read aloud.';

        const response = await fetch('https://api.openai.com/v1/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'text-davinci-003',
                prompt,
                max_tokens: 100,
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('OpenAI API Error in generateParagraph:', errorData);
            return res.status(response.status).json({ error: errorData.error.message || 'Failed to generate paragraph' });
        }

        const data = await response.json();
        const paragraph = data.choices[0].text.trim();

        console.log('Generated Paragraph:', paragraph);
        res.status(200).json({ paragraph });
    } catch (error) {
        console.error('Error in generateParagraph handler:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// pages/index.tsx
import React, { useState } from 'react';
import AudioUploader from '../components/AudioUploader';
import { FaSpinner } from 'react-icons/fa';

const SpeechTracker: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [transcription, setTranscription] = useState<string>('');
    const [feedback, setFeedback] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    const handleFileUpload = (uploadedFile: File) => {
        setFile(uploadedFile);
        setTranscription('');
        setFeedback('');
        processAudio(uploadedFile);
    };

    const processAudio = async (audioFile: File) => {
        setIsProcessing(true);
        try {
            // Step 1: Transcribe Speech
            const formData = new FormData();
            formData.append('file', audioFile);
            formData.append('response_format', 'verbose_json');
            formData.append('timestamp_granularities', JSON.stringify(['word']));
            formData.append('prompt', 'The transcript is about OpenAI which makes technology like DALL·E, GPT-3, and ChatGPT with the hope of one day building an AGI system that benefits all of humanity.');

            const transcribeResponse = await fetch('/api/transcribeSpeech', {
                method: 'POST',
                body: formData,
            });

            if (!transcribeResponse.ok) {
                const errorData = await transcribeResponse.json();
                throw new Error(errorData.error || 'Failed to transcribe speech');
            }

            const transcribeData = await transcribeResponse.json();
            setTranscription(transcribeData.transcription);

            // Step 2: Generate Feedback
            const feedbackResponse = await fetch('/api/generateFeedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ transcription: transcribeData.transcription }),
            });

            if (!feedbackResponse.ok) {
                const errorData = await feedbackResponse.json();
                throw new Error(errorData.error || 'Failed to generate feedback');
            }

            const feedbackData = await feedbackResponse.json();
            setFeedback(feedbackData.feedback);
        } catch (error: any) {
            console.error('Error processing audio:', error);
            setFeedback(error.message || 'An error occurred.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4">
            <h1 className="text-3xl font-bold mb-6">Speech Tracker</h1>

            {/* Audio Uploader */}
            <AudioUploader onUpload={handleFileUpload} />

            {/* Transcription */}
            {transcription && (
                <div className="bg-gray-800 p-6 rounded-lg mt-6 w-full max-w-xl">
                    <h2 className="text-2xl font-semibold mb-4">Transcription</h2>
                    <p className="text-white whitespace-pre-wrap">{transcription}</p>
                </div>
            )}

            {/* Feedback */}
            {feedback && (
                <div className="bg-gray-800 p-6 rounded-lg mt-6 w-full max-w-xl">
                    <h2 className="text-2xl font-semibold mb-4">Feedback</h2>
                    <p className="text-white whitespace-pre-wrap">{feedback}</p>
                </div>
            )}

            {/* Processing Indicator */}
            {isProcessing && (
                <div className="mt-4 flex items-center">
                    <FaSpinner className="animate-spin mr-2" />
                    <p className="text-gray-400">Processing...</p>
                </div>
            )}
        </div>
    );
};

export default SpeechTracker;

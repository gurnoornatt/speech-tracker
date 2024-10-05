import React, { useState, useRef } from 'react';
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';

export default function SpeechTracker() {
    const [mode, setMode] = useState<'Casual' | 'Formal' | null>(null);
    const [paragraph, setParagraph] = useState<string>('');
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [feedback, setFeedback] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const SpeechTracker: React.FC = () => {
        return <div>Speech Tracker Component</div>;
    };
    // Function to select mode and generate paragraph
    const selectMode = async (selectedMode: 'Casual' | 'Formal') => {
        console.log(`Mode selected: ${selectedMode}`);
        setMode(selectedMode);
        setFeedback('');
        setParagraph('Generating paragraph...');
        try {
            const generatedParagraph = await generateParagraph(selectedMode);
            console.log('Generated Paragraph:', generatedParagraph);
            setParagraph(generatedParagraph);
        } catch (error) {
            console.error('Error in selectMode:', error);
            setParagraph('Failed to generate paragraph. Please try again.');
        }
    };

    // Function to generate paragraph using serverless function
    const generateParagraph = async (selectedMode: 'Casual' | 'Formal'): Promise<string> => {
        try {
            const response = await fetch('/api/generateParagraph', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ mode: selectedMode }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error from generateParagraph API:', errorData);
                throw new Error(errorData.error || 'Failed to generate paragraph');
            }

            const data = await response.json();
            return data.paragraph;
        } catch (error) {
            console.error('Error in generateParagraph:', error);
            throw error;
        }
    };

    // Function to start recording
    const startRecording = async () => {
        console.log('Starting recording...');
        setFeedback('');
        setIsProcessing(false);
        setIsRecording(true);
        audioChunksRef.current = [];

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.start();
            console.log('MediaRecorder started.');

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                    console.log('Audio data available:', event.data.size);
                }
            };

            mediaRecorder.onstop = () => {
                console.log('MediaRecorder stopped.');
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                processSpeech(audioBlob);
            };
        } catch (error) {
            console.error('Error accessing microphone:', error);
            setIsRecording(false);
            setFeedback('Unable to access microphone. Please check permissions.');
        }
    };

    // Function to stop recording
    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            console.log('Stopping recording...');
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    // Function to process speech using serverless functions
    const processSpeech = async (audioBlob: Blob) => {
        console.log('Processing speech...');
        setIsProcessing(true);
        setFeedback('Processing your speech...');

        try {
            // Step 1: Transcribe and analyze speech using serverless function
            const transcription = await transcribeSpeech(audioBlob);
            console.log('Transcription:', transcription);

            // Step 2: Generate feedback using serverless function based on transcription and analysis
            const aiFeedback = await generateFeedback(transcription);
            console.log('AI Feedback:', aiFeedback);

            setFeedback(aiFeedback);
        } catch (error) {
            console.error('Error in processSpeech:', error);
            setFeedback('Failed to process speech. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    // Function to transcribe speech using serverless function
    const transcribeSpeech = async (audioBlob: Blob): Promise<string> => {
        try {
            const formData = new FormData();
            formData.append('file', audioBlob, 'speech.wav');

            const response = await fetch('/api/transcribeSpeech', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error from transcribeSpeech API:', errorData);
                throw new Error(errorData.error || 'Failed to transcribe speech');
            }

            const data = await response.json();
            return data.transcription;
        } catch (error) {
            console.error('Error in transcribeSpeech:', error);
            throw error;
        }
    };

    // Function to generate feedback using serverless function
    const generateFeedback = async (transcription: string): Promise<string> => {
        try {
            const response = await fetch('/api/generateFeedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ transcription }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error from generateFeedback API:', errorData);
                throw new Error(errorData.error || 'Failed to generate feedback');
            }

            const data = await response.json();
            return data.feedback;
        } catch (error) {
            console.error('Error in generateFeedback:', error);
            return 'Failed to generate feedback. Please try again.';
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4">
            <h1 className="text-3xl font-bold mb-6">Speech Tracker</h1>

            {/* Mode Selection */}
            {!mode && (
                <div className="flex space-x-4 mb-6">
                    <button
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
                        onClick={() => selectMode('Casual')}
                    >
                        Casual
                    </button>
                    <button
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
                        onClick={() => selectMode('Formal')}
                    >
                        Formal
                    </button>
                </div>
            )}

            {/* Generated Paragraph */}
            {mode && (
                <div className="bg-gray-800 p-6 rounded-lg mb-6 w-full max-w-xl">
                    <h2 className="text-2xl font-semibold mb-4">{mode} Mode</h2>
                    <p className="text-white">{paragraph}</p>
                </div>
            )}

            {/* Microphone Button */}
            {mode && (
                <button
                    className="relative w-24 h-24 mb-6"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isProcessing}
                >
                    <div
                        className={`absolute inset-0 rounded-full border-4 border-white flex items-center justify-center transition duration-300 ${isRecording ? 'bg-red-500' : 'bg-transparent'
                            }`}
                    >
                        {isRecording ? <FaMicrophoneSlash size={32} /> : <FaMicrophone size={32} />}
                    </div>
                </button>
            )}

            {/* Feedback Section */}
            {feedback && (
                <div className="bg-gray-800 p-6 rounded-lg w-full max-w-xl">
                    <h2 className="text-2xl font-semibold mb-4">Feedback</h2>
                    <p className="text-white whitespace-pre-wrap">{feedback}</p>
                </div>
            )}

            {/* Processing Indicator */}
            {isProcessing && (
                <div className="mt-4">
                    <p className="text-gray-400">Processing...</p>
                </div>
            )}
        </div>
    );
}

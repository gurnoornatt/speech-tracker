// pages/index.tsx
import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { FaSpinner } from 'react-icons/fa'

const SpeechTracker: React.FC = () => {
    const [transcription, setTranscription] = useState<string>('')
    const [feedback, setFeedback] = useState<string>('')
    const [isProcessing, setIsProcessing] = useState<boolean>(false)

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return
        const file = acceptedFiles[0]
        processAudio(file)
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'audio/*': ['.mp3', '.wav', '.m4a', '.mp4', '.webm'],
        },
        maxSize: 25 * 1024 * 1024, // 25 MB
    })

    const processAudio = async (audioFile: File) => {
        setIsProcessing(true)
        setTranscription('')
        setFeedback('')

        try {
            // Step 1: Transcribe Speech
            const formData = new FormData()
            formData.append('file', audioFile)
            formData.append('response_format', 'json')
            // Removed 'timestamp_granularities'

            const transcribeResponse = await fetch('/api/transcribeSpeech', {
                method: 'POST',
                body: formData,
            })

            if (!transcribeResponse.ok) {
                let errorMessage = 'Failed to transcribe speech'
                try {
                    const errorData = await transcribeResponse.json()
                    errorMessage = errorData.error || errorMessage
                } catch (parseError) {
                    console.error('Error parsing transcribeResponse:', parseError)
                }
                throw new Error(errorMessage)
            }

            const transcribeData = await transcribeResponse.json()
            setTranscription(transcribeData.transcription)

            // Step 2: Generate Feedback
            const feedbackResponse = await fetch('/api/generateFeedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ transcription: transcribeData.transcription }),
            })

            if (!feedbackResponse.ok) {
                let errorMessage = 'Failed to generate feedback'
                try {
                    const errorData = await feedbackResponse.json()
                    errorMessage = errorData.error || errorMessage
                } catch (parseError) {
                    console.error('Error parsing feedbackResponse:', parseError)
                }
                throw new Error(errorMessage)
            }

            const feedbackData = await feedbackResponse.json()
            setFeedback(feedbackData.feedback)
        } catch (error: any) {
            console.error('Error processing audio:', error)
            setFeedback(error.message || 'An error occurred.')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4">
            <h1 className="text-3xl font-bold mb-6">Speech Tracker</h1>

            {/* Audio Uploader */}
            <div
                {...getRootProps()}
                className={`border-2 border-dashed p-6 rounded-lg text-center cursor-pointer ${isDragActive ? 'border-blue-500' : 'border-gray-400'
                    } w-full max-w-xl`}
            >
                <input {...getInputProps()} />
                {isDragActive ? (
                    <p>Drop the audio file here...</p>
                ) : (
                    <p>Drag & drop an audio file here, or click to select one</p>
                )}
            </div>

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
    )
}

export default SpeechTracker

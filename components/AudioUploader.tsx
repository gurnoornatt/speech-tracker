import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface AudioUploaderProps {
    onUpload: (uploadedFile: File) => void;
}

const AudioUploader: React.FC<AudioUploaderProps> = ({ onUpload }) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            onUpload(file);
        }
    }, [onUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'audio/*': ['.wav', '.mp3', '.m4a', '.aac']
        },
        multiple: false,
    });

    return (
        <div
            {...getRootProps()}
            className="w-full max-w-md p-6 border-2 border-dashed border-gray-400 rounded-md text-center cursor-pointer"
        >
            <input {...getInputProps()} />
            {
                isDragActive ?
                    <p className="text-gray-700">Drop the audio file here...</p> :
                    <p className="text-gray-700">Drag & drop an audio file here, or click to select a file</p>
            }
        </div>
    );
};

export default AudioUploader;
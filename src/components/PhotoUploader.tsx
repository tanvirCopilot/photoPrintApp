import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { usePhotoStore } from '../store/photoStore';

export const PhotoUploader: React.FC = () => {
  const { addPhotos, photos } = usePhotoStore();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      addPhotos(acceptedFiles);
    },
    [addPhotos]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    multiple: true,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        relative overflow-hidden
        border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
        transition-all duration-300 ease-out
        ${
          isDragActive
            ? 'border-violet-400 bg-violet-500/10 scale-[1.02]'
            : 'border-slate-600 hover:border-violet-400 hover:bg-slate-800/50 bg-slate-800/30'
        }
      `}
    >
      <input {...getInputProps()} />
      
      {/* Animated background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 transition-opacity duration-300 ${isDragActive ? 'opacity-100' : 'opacity-0'}`} />
      
      <div className="relative flex flex-col items-center gap-4">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
          isDragActive 
            ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/30' 
            : 'bg-slate-700/50'
        }`}>
          <svg
            className={`w-8 h-8 transition-colors ${isDragActive ? 'text-white' : 'text-slate-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
        {isDragActive ? (
          <p className="text-violet-300 font-medium">Drop your photos here...</p>
        ) : (
          <>
            <div>
              <p className="text-slate-200 font-medium mb-1">
                Drop photos here or <span className="text-violet-400">browse</span>
              </p>
              <p className="text-slate-500 text-sm">
                JPG, PNG, WebP up to 20MB each
              </p>
            </div>
          </>
        )}
        {photos.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/20 rounded-full">
            <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
            <p className="text-violet-300 text-sm font-medium">
              {photos.length} photo{photos.length !== 1 ? 's' : ''} ready
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

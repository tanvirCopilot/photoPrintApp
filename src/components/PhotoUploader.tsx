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
        border-2 border-dashed rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-center cursor-pointer
        transition-all duration-300 ease-out touch-manipulation
        ${
          isDragActive
            ? 'border-violet-400 bg-violet-500/10 scale-[1.02]'
            : 'border-slate-600 hover:border-violet-400 hover:bg-slate-800/50 bg-slate-800/30 active:bg-slate-800/50'
        }
      `}
    >
      <input {...getInputProps()} />
      
      {/* Animated background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 transition-opacity duration-300 ${isDragActive ? 'opacity-100' : 'opacity-0'}`} />
      
      <div style={{padding: "5px"}} className="relative flex flex-col items-center gap-2 sm:gap-4">
        <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 ${
          isDragActive 
            ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/30' 
            : 'bg-slate-700/50'
        }`}>
          <svg
            className={`w-6 h-6 sm:w-8 sm:h-8 transition-colors ${isDragActive ? 'text-white' : 'text-slate-400'}`}
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
          <p className="text-violet-300 font-medium text-sm sm:text-base">Drop your photos here...</p>
        ) : (
          <>
            <div>
              <p className="text-slate-200 font-medium mb-1 text-sm sm:text-base">
                Drop photos here or <span className="text-violet-400">browse</span>
              </p>
              <p className="text-slate-500 text-xs sm:text-sm">
                JPG, PNG, WebP up to 20MB each
              </p>
            </div>
          </>
        )}
        {photos.length > 0 && (
          <div style={{padding: "1px 8px", margin: "5px 0"}} className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/20 rounded">
            <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
            <p className="text-violet-300 text-xs sm:text-sm font-medium">
              {photos.length} photo{photos.length !== 1 ? 's' : ''} ready
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

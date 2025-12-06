import React from 'react';
import { usePhotoStore } from '../store/photoStore';

export const PhotoGallery: React.FC = () => {
  const { photos, removePhoto, clearPhotos } = usePhotoStore();

  if (photos.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-200">
          Your Photos
        </h3>
        <button
          onClick={clearPhotos}
          className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative group aspect-square rounded-xl overflow-hidden bg-slate-700/50 ring-1 ring-slate-600/50"
          >
            <img
              src={photo.url}
              alt={photo.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200">
              <button
                onClick={(e) => { e.stopPropagation(); removePhoto(photo.id); }}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500/90 backdrop-blur text-white rounded-lg
                         opacity-0 group-hover:opacity-100 transition-all duration-200 scale-75 group-hover:scale-100
                         flex items-center justify-center hover:bg-red-500"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

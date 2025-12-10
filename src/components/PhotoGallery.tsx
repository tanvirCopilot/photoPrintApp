import React from 'react';
import { usePhotoStore } from '../store/photoStore';

export const PhotoGallery: React.FC = () => {
  const { photos, removePhoto, clearPhotos } = usePhotoStore();

  if (photos.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-xl sm:rounded-2xl p-3 sm:p-4">
      <div style={{padding: "10px 5px"}} className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-xs sm:text-sm font-semibold text-slate-200">
          Your Photos
        </h3>
        <button
          onClick={clearPhotos}
          style={{padding: "2px 5px"}}
          className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs bg-red-500 text-white hover:bg-red-600 active:bg-red-700 rounded transition-colors touch-manipulation"
        >
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-4 gap-1.5 sm:gap-2">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative group aspect-square rounded-lg sm:rounded-xl overflow-hidden bg-slate-700/50 ring-1 ring-slate-600/50"
          >
            <img
              src={photo.url}
              alt={photo.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 sm:transition-all sm:duration-200">
              <button
                onClick={(e) => { e.stopPropagation(); removePhoto(photo.id); }}
                className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-5 h-5 sm:w-6 sm:h-6 bg-red-500/90 backdrop-blur text-white rounded-md sm:rounded-lg
                         opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 sm:scale-75 sm:group-hover:scale-100
                         flex items-center justify-center hover:bg-red-500 active:bg-red-600 touch-manipulation"
              >
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Always visible delete on mobile */}
            <button
              onClick={(e) => { e.stopPropagation(); removePhoto(photo.id); }}
              className="sm:hidden absolute top-1 right-1 w-5 h-5 bg-red-500/90 backdrop-blur text-white rounded-md
                       flex items-center justify-center active:bg-red-600 touch-manipulation"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

import React from 'react';
import { usePhotoStore } from '../store/photoStore';

export const SettingsPanel: React.FC = () => {
  const { autoArrangeEnabled, setAutoArrangeEnabled, autoArrangePhotos, getUnassignedPhotos } =
    usePhotoStore();

  const unassignedCount = getUnassignedPhotos().length;

  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-xl sm:rounded-2xl p-3 sm:p-4 touch-manipulation">
      <h3 className="text-xs sm:text-sm font-semibold text-slate-200 mb-3 sm:mb-4">Settings</h3>

      {/* Auto-arrange toggle */}
      <div className="flex items-center justify-between py-2">
        <div>
          <p className="text-xs sm:text-sm font-medium text-slate-300">Auto-arrange</p>
          <p className="text-[10px] sm:text-xs text-slate-500">Fill empty slots automatically</p>
        </div>
        <button
          onClick={() => setAutoArrangeEnabled(!autoArrangeEnabled)}
          className={`
            relative w-10 h-5 sm:w-12 sm:h-6 rounded-full transition-all duration-300 active:scale-95
            ${autoArrangeEnabled 
              ? 'bg-gradient-to-r from-violet-500 to-purple-500 shadow-lg shadow-violet-500/25' 
              : 'bg-slate-600'
            }
          `}
        >
          <span
            className={`
              absolute top-0.5 sm:top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-md
              ${autoArrangeEnabled ? 'translate-x-5 sm:translate-x-7' : 'translate-x-0.5 sm:translate-x-1'}
            `}
          />
        </button>
      </div>

      {/* Manual arrange button */}
      {unassignedCount > 0 && (
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-700/50">
          <button
            onClick={autoArrangePhotos}
            className="w-full py-2 sm:py-2.5 px-3 sm:px-4 bg-violet-500/20 hover:bg-violet-500/30 active:bg-violet-500/40 text-violet-300 rounded-sm text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-1.5 sm:gap-2 ring-1 ring-violet-500/30"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            Arrange {unassignedCount} photo{unassignedCount !== 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  );
};

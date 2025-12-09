import React from 'react';
import { usePhotoStore } from '../store/photoStore';

export const SettingsPanel: React.FC = () => {
  const { autoArrangeEnabled, setAutoArrangeEnabled, autoArrangePhotos, getUnassignedPhotos } =
    usePhotoStore();

  const unassignedCount = getUnassignedPhotos().length;

  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-slate-200 mb-4">Settings</h3>

      {/* Auto-arrange toggle */}
      <div className="flex items-center justify-between py-2">
        <div>
          <p className="text-sm font-medium text-slate-300">Auto-arrange</p>
          <p className="text-xs text-slate-500">Fill empty slots automatically</p>
        </div>
        <button
          onClick={() => setAutoArrangeEnabled(!autoArrangeEnabled)}
          className={`
            relative w-12 h-6 rounded-full transition-all duration-300
            ${autoArrangeEnabled 
              ? 'bg-gradient-to-r from-violet-500 to-purple-500 shadow-lg shadow-violet-500/25' 
              : 'bg-slate-600'
            }
          `}
        >
          <span
            className={`
              absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-md
              ${autoArrangeEnabled ? 'translate-x-7' : 'translate-x-1'}
            `}
          />
        </button>
      </div>

      {/* Manual arrange button */}
      {unassignedCount > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <button
            onClick={autoArrangePhotos}
            className="w-full py-2.5 px-4 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 rounded-sm text-sm font-medium transition-all flex items-center justify-center gap-2 ring-1 ring-violet-500/30"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            Arrange {unassignedCount} photo{unassignedCount !== 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  );
};

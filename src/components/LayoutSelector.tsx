import React from 'react';
import type { LayoutType } from '../types';
import { LAYOUT_CONFIGS } from '../types';
import { usePhotoStore } from '../store/photoStore';

export const LayoutSelector: React.FC = () => {
  const { defaultLayout, setDefaultLayout, pages, currentPageIndex, setPageLayout } = usePhotoStore();
  const currentPage = pages[currentPageIndex];

  const layouts = Object.values(LAYOUT_CONFIGS);

  const handleLayoutChange = (layout: LayoutType) => {
    if (currentPage) {
      setPageLayout(currentPage.id, layout);
    }
    setDefaultLayout(layout);
  };

  const currentLayout = currentPage?.layout ?? defaultLayout;

  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-slate-200 mb-4">Grid Layout</h3>
      <div className="grid grid-cols-4 gap-2">
        {layouts.map((config) => (
          <button
            key={config.type}
            onClick={() => handleLayoutChange(config.type)}
            className={`
              relative p-2 rounded-xl transition-all duration-200
              ${
                currentLayout === config.type
                  ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25 ring-2 ring-violet-400/50'
                  : 'bg-slate-700/50 hover:bg-slate-700 ring-1 ring-slate-600/50 hover:ring-slate-500/50'
              }
            `}
          >
            <LayoutPreview rows={config.rows} cols={config.cols} isSelected={currentLayout === config.type} />
            <span className={`block text-xs mt-2 text-center font-medium ${
              currentLayout === config.type ? 'text-white' : 'text-slate-400'
            }`}>
              {config.type} {config.type === 1 ? 'Photo' : 'Photos'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

interface LayoutPreviewProps {
  rows: number;
  cols: number;
  isSelected?: boolean;
}

const LayoutPreview: React.FC<LayoutPreviewProps> = ({ rows, cols, isSelected }) => {
  return (
    <div
      className={`aspect-[210/297] rounded-lg grid gap-0.5 p-1 ${
        isSelected ? 'bg-white/20' : 'bg-slate-600/50'
      }`}
      style={{
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
      }}
    >
      {Array.from({ length: rows * cols }).map((_, i) => (
        <div key={i} className={`rounded-sm ${
          isSelected ? 'bg-white/60' : 'bg-slate-400/40'
        }`} />
      ))}
    </div>
  );
};

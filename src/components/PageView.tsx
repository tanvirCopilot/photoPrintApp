import React from 'react';
import { usePhotoStore } from '../store/photoStore';
import { A4Page } from './A4Page';

export const PageView: React.FC = () => {
  const { pages, currentPageIndex } = usePhotoStore();

  if (pages.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500">
        <div className="w-24 h-24 rounded-3xl bg-slate-700/50 flex items-center justify-center mb-6">
          <svg className="w-12 h-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-slate-300 mb-2">No Pages Yet</h3>
        <p className="text-sm text-center max-w-sm text-slate-500">
          Upload photos to automatically generate printable A4 pages, or add a blank page manually.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Main Page View - Large Preview */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <A4Page
          page={pages[currentPageIndex]}
          pageIndex={currentPageIndex}
          isCurrentPage={true}
        />
      </div>
    </div>
  );
};

import React from 'react';
import { usePhotoStore } from '../store/photoStore';

export const PageManager: React.FC = () => {
  const {
    pages,
    currentPageIndex,
    setCurrentPageIndex,
    addPage,
    removePage,
    duplicatePage,
    defaultLayout,
  } = usePhotoStore();

  const currentPage = pages[currentPageIndex];

  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-200">Page Navigator</h3>
        <button
          onClick={() => addPage(defaultLayout)}
          className="px-3 py-1.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs font-medium rounded-sm hover:from-violet-600 hover:to-purple-600 transition-all shadow-lg shadow-violet-500/25 flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Page
        </button>
      </div>

      {pages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-500 text-sm text-center py-8">
            Upload photos to create pages
          </p>
        </div>
      ) : (
        <>
          {/* Page Navigation */}
            <div className="flex items-center justify-center gap-3 mb-4 py-2 bg-slate-700/30 rounded-sm">
            <button
              onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
              disabled={currentPageIndex === 0}
              className="p-2 rounded-sm hover:bg-slate-600/50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <span className="text-sm font-medium text-slate-300 min-w-[100px] text-center">
              Page <span className="text-violet-400">{currentPageIndex + 1}</span> of {pages.length}
            </span>

            <button
              onClick={() => setCurrentPageIndex(Math.min(pages.length - 1, currentPageIndex + 1))}
              disabled={currentPageIndex === pages.length - 1}
              className="p-2 rounded-sm hover:bg-slate-600/50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Page Thumbnails */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-3 gap-2">
              {pages.map((page, index) => (
                <button
                  key={page.id}
                  onClick={() => setCurrentPageIndex(index)}
                  className={`
                    relative aspect-[210/297] rounded-sm transition-all duration-200
                    ${
                      index === currentPageIndex
                        ? 'ring-2 ring-violet-400 bg-violet-500/20'
                        : 'ring-1 ring-slate-600/50 bg-slate-700/30 hover:ring-slate-500 hover:bg-slate-700/50'
                    }
                  `}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-sm font-bold ${index === currentPageIndex ? 'text-violet-300' : 'text-slate-500'}`}>
                      {index + 1}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Page Actions */}
          {currentPage && (
            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700/50">
              <button
                onClick={() => duplicatePage(currentPage.id)}
                className="flex-1 px-3 py-2.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-sm transition-all flex items-center justify-center gap-1.5 ring-1 ring-slate-600/50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Duplicate
              </button>
              <button
                onClick={() => removePage(currentPage.id)}
                disabled={pages.length === 1}
                className="flex-1 px-3 py-2.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-sm transition-all flex items-center justify-center gap-1.5 ring-1 ring-red-500/30 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

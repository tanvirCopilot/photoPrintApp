import { useState } from 'react';
import {
  PhotoUploader,
  PhotoGallery,
  LayoutSelector,
  PageManager,
  PageView,
  PDFExporter,
  SettingsPanel,
} from './components';
import { usePhotoStore } from './store/photoStore';

function App() {
  const [sidebarTab, setSidebarTab] = useState<'upload' | 'layout' | 'pages'>('upload');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { photos, pages } = usePhotoStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            {/* Logo & Title */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-lg flex-shrink-0 flex items-center justify-center shadow-lg shadow-purple-500/25">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-white tracking-tight truncate">PhotoPrint</h1>
                <p className="text-[10px] sm:text-xs text-slate-400 hidden xs:block">Smart Photo Layout & Print</p>
              </div>
            </div>
            
            {/* Stats - Compact pills on mobile */}
            <div className="hidden sm:flex items-center gap-3 md:gap-6">
              <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400 bg-slate-800/50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs sm:text-sm font-medium">{photos.length}</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400 bg-slate-800/50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-xs sm:text-sm font-medium">{pages.length}</span>
              </div>
            </div>

            {/* Mobile stats (inline with header) */}
            <div className="flex sm:hidden items-center gap-2 text-slate-400 text-xs">
              <span className="bg-slate-800/60 px-2 py-1 rounded-full">{photos.length} 📷</span>
              <span className="bg-slate-800/60 px-2 py-1 rounded-full">{pages.length} 📄</span>
            </div>

            {/* Export Button in Header */}
            <div className="flex items-center gap-2">
              <PDFExporter />
              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-4 lg:py-6 overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 lg:gap-6 h-full">
          
          {/* Mobile/Tablet: Horizontal Tab Bar (always visible on small screens) */}
          <div className="lg:hidden flex-shrink-0">
            <div className="bg-slate-800/60 backdrop-blur rounded-lg p-1 flex gap-1">
              <button
                onClick={() => { setSidebarTab('upload'); setMobileMenuOpen(true); }}
                className={`flex-1 py-2 px-2 sm:px-4 rounded text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                  sidebarTab === 'upload' && mobileMenuOpen
                    ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-purple-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span className="hidden xs:inline">Upload</span>
              </button>
              <button
                onClick={() => { setSidebarTab('layout'); setMobileMenuOpen(true); }}
                className={`flex-1 py-2 px-2 sm:px-4 rounded text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                  sidebarTab === 'layout' && mobileMenuOpen
                    ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-purple-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                <span className="hidden xs:inline">Layout</span>
              </button>
              <button
                onClick={() => { setSidebarTab('pages'); setMobileMenuOpen(true); }}
                className={`flex-1 py-2 px-2 sm:px-4 rounded text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                  sidebarTab === 'pages' && mobileMenuOpen
                    ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-purple-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden xs:inline">Pages</span>
              </button>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className={`flex-1 py-2 px-2 sm:px-4 rounded text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                  !mobileMenuOpen
                    ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-purple-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="hidden xs:inline">Preview</span>
              </button>
            </div>
          </div>

          {/* Mobile Panel (slides in/out) */}
          <div className={`lg:hidden transition-all duration-300 ease-in-out overflow-hidden ${
            mobileMenuOpen ? 'max-h-[50vh] opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="bg-slate-800/40 backdrop-blur-lg rounded-xl p-3 sm:p-4 overflow-y-auto max-h-[48vh] custom-scrollbar">
              {sidebarTab === 'upload' && (
                <div className="space-y-3">
                  <PhotoUploader />
                  <PhotoGallery />
                </div>
              )}
              {sidebarTab === 'layout' && (
                <div className="space-y-3">
                  <LayoutSelector />
                  <SettingsPanel />
                </div>
              )}
              {sidebarTab === 'pages' && (
                <PageManager />
              )}
            </div>
          </div>

          {/* Desktop: Left Sidebar - Controls */}
          <div className="hidden lg:flex w-80 flex-shrink-0 flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
            {/* Tab Navigation */}
            <div className="bg-slate-800/50 backdrop-blur rounded-lg p-1.5 flex gap-1">
              <button
                onClick={() => setSidebarTab('upload')}
                className={`flex-1 py-2.5 px-4 rounded text-sm font-medium transition-all ${
                  sidebarTab === 'upload'
                    ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-purple-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                Upload
              </button>
              <button
                onClick={() => setSidebarTab('layout')}
                className={`flex-1 py-2.5 px-4 rounded text-sm font-medium transition-all ${
                  sidebarTab === 'layout'
                    ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-purple-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                Layout
              </button>
              <button
                onClick={() => setSidebarTab('pages')}
                className={`flex-1 py-2.5 px-4 rounded text-sm font-medium transition-all ${
                  sidebarTab === 'pages'
                    ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-purple-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                Pages
              </button>
            </div>

            {/* Tab Content */}
            {sidebarTab === 'upload' && (
              <>
                <PhotoUploader />
                <PhotoGallery />
              </>
            )}
            
            {sidebarTab === 'layout' && (
              <>
                <LayoutSelector />
                <SettingsPanel />
              </>
            )}
            
            {sidebarTab === 'pages' && (
              <PageManager />
            )}
          </div>

          {/* Right Content - Page Preview */}
          <div className="flex-1 min-w-0 min-h-[300px] sm:min-h-0">
            <div className="bg-slate-800/30 backdrop-blur rounded-lg sm:rounded-2xl lg:rounded-3xl p-1 sm:p-4 lg:p-6 h-full overflow-auto">
              <PageView />
            </div>
          </div>
        </div>
      </main>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
        }
        @media (max-width: 640px) {
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
        }
      `}</style>
    </div>
  );
}

export default App;

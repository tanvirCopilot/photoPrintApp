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
  const { photos, pages } = usePhotoStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/25">
                <svg
                  className="w-6 h-6 text-white"
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
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">PhotoPrint</h1>
                <p className="text-xs text-slate-400">Smart Photo Layout & Print</p>
              </div>
            </div>
            
            {/* Stats */}
            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-2 text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium">{photos.length} Photos</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium">{pages.length} Pages</span>
              </div>
            </div>

            {/* Export Button in Header */}
            <PDFExporter />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6 h-[calc(100vh-120px)]">
          {/* Left Sidebar - Controls */}
          <div className="w-80 flex-shrink-0 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
            {/* Tab Navigation */}
            <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-1.5 flex gap-1">
              <button
                onClick={() => setSidebarTab('upload')}
                className={`flex-1 py-2.5 px-4 rounded-sm text-sm font-medium transition-all ${
                  sidebarTab === 'upload'
                    ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-purple-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                Upload
              </button>
              <button
                onClick={() => setSidebarTab('layout')}
                className={`flex-1 py-2.5 px-4 rounded-sm text-sm font-medium transition-all ${
                  sidebarTab === 'layout'
                    ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-purple-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                Layout
              </button>
              <button
                onClick={() => setSidebarTab('pages')}
                className={`flex-1 py-2.5 px-4 rounded-sm text-sm font-medium transition-all ${
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
          <div className="flex-1 min-w-0">
            <div className="bg-slate-800/30 backdrop-blur rounded-3xl p-6 h-full overflow-hidden">
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
      `}</style>
    </div>
  );
}

export default App;

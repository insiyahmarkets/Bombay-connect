import { Activity, Wifi } from 'lucide-react';

interface HeaderProps {
  connectionStatus: 'connecting' | 'connected' | 'error';
  isDemo: boolean;
  onToggleDemo: () => void;
  onRefresh: () => void;
}

const STATUS_CONFIG = {
  connecting: { label: 'Connecting…', dot: 'bg-yellow-400 animate-pulse', text: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  connected:  { label: 'API Connected', dot: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  error:      { label: 'Backend Unreachable', dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50 border-red-200' },
};

export function Header({ connectionStatus, isDemo, onToggleDemo, onRefresh }: HeaderProps) {
  const s = STATUS_CONFIG[connectionStatus];

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3">
        {/* Logo + Title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 w-9 h-9 bg-brand-700 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900 leading-tight">NetCompare</h1>
              {isDemo && (
                <span className="demo-badge">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                  DEMO
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 leading-tight hidden sm:block">
              Internet Quality Pilot Dashboard · Bombay Connect · A3-PS014-TC466
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* API status */}
          <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full border ${s.bg} ${s.text}`}>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
            <span className="hidden sm:inline">{s.label}</span>
            <span className="sm:hidden">{connectionStatus === 'connected' ? 'OK' : connectionStatus === 'error' ? 'ERR' : '…'}</span>
          </div>

          {/* Demo toggle */}
          <button
            onClick={onToggleDemo}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              isDemo
                ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
            title={isDemo ? 'Currently showing SYNTHETIC demo data — click to switch to real data' : 'Click to load demo/synthetic data'}
          >
            <Wifi className="w-3.5 h-3.5" />
            {isDemo ? 'Showing Demo Data' : 'Load Demo Data'}
          </button>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            className="btn-secondary text-sm px-3 py-1.5"
            title="Refresh all data from backend"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Demo banner */}
      {isDemo && (
        <div className="bg-amber-50 border-t border-amber-200 px-4 sm:px-6 py-1.5 text-center text-xs text-amber-800 font-medium">
          ⚠ SYNTHETIC DATA — All values shown are randomly generated for demonstration purposes only.
          They do not represent real network measurements.
        </div>
      )}
    </header>
  );
}

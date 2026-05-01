'use client';

import { useState } from 'react';

interface TabWidgetProps {
  blur?: number;
  isEditing?: boolean;
  isHidden?: boolean;
  settings?: {
    url?: string;
  };
  onSettingsChange?: (settings: { url?: string }) => void;
}

const DEFAULT_URL = 'https://example.com';

export default function TabWidget({ 
  blur = 0, 
  isEditing = false, 
  isHidden = false, 
  settings, 
  onSettingsChange 
}: TabWidgetProps) {
  const [url, setUrl] = useState(settings?.url || DEFAULT_URL);

  // Sync settings
  const handleUrlChange = (urlValue: string) => {
    setUrl(urlValue);
    if (onSettingsChange) onSettingsChange({ ...settings, url: urlValue });
  };

  const validateUrl = (urlString: string) => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div 
      className="flex flex-col w-full h-full rounded-2xl overflow-hidden relative transition-colors duration-300"
      style={{ 
        backdropFilter: `blur(${blur}px)`,
        backgroundColor: `rgba(0, 0, 0, 0)`
      }}
    >
      {isEditing ? (
        <div className="flex flex-col h-full w-full p-4 space-y-3 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs opacity-60">🔗</span>
            <span className="text-sm font-medium opacity-70">Tab Widget</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs opacity-60 block">URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://example.com"
              className={`w-full bg-white/10 rounded px-3 py-2 text-sm ${!validateUrl(url) ? 'border border-red-500' : ''}`}
            />
            {!validateUrl(url) && (
              <p className="text-xs text-red-400">Please enter a valid URL</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full w-full relative">
          <iframe
            src={url}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: '12px',
              background: '#1a1a1a'
            }}
            title="Tab Widget"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        </div>
      )}
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface YoutubeWidgetProps {
  blur?: number;
  isEditing?: boolean;
  settings?: {
      embedId?: string;
  };
  onSettingsChange?: (settings: { embedId?: string }) => void;
}

export default function YoutubeWidget({ blur = 0, isEditing = false, settings, onSettingsChange }: YoutubeWidgetProps) {
  const [url, setUrl] = useState('');
  const [embedId, setEmbedId] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (settings?.embedId) {
        setEmbedId(settings.embedId);
    }
  }, [settings?.embedId]);

  // Force expand in edit mode
  useEffect(() => {
      if (isEditing) {
          setIsCollapsed(false);
      }
  }, [isEditing]);

  const updateEmbedId = (id: string) => {
      setEmbedId(id);
      if (onSettingsChange) {
          onSettingsChange({ embedId: id });
      }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const videoId = extractVideoId(url);
    if (videoId) {
      updateEmbedId(videoId);
      setUrl('');
    }
  };

  const extractVideoId = (input: string) => {
    let regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    if (input.includes("custom")) {
      regExp = /^.*\/custom-youtube\/([^/?#]+).*$/   
      const match = input.match(regExp);
      return (match && match[1].length === 11) ? match[1] : null; 
    }
    const match = input.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div 
        className={`flex flex-col w-full rounded-2xl overflow-hidden relative group transition-all duration-300 ${isCollapsed ? 'h-12' : 'h-full'}`}
        style={{ 
            backdropFilter: `blur(${blur}px)`,
            backgroundColor: `rgba(0, 0, 0, 0)`
        }}
    >
      {/* Collapse Toggle - Only in View Mode */}
      {!isEditing && (
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute top-2 right-2 z-50 p-1 bg-black/50 rounded-full hover:bg-black/70 transition"
          >
            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
      )}

      {/* Collapsed View */}
      {isCollapsed && (
          <div className="flex items-center px-4 h-full">
            {/* Shows the text "YouTube Widget" to the left */}
              {/* <span className="font-bold text-sm truncate">
                  {embedId ? `YouTube Video` : 'YouTube Widget'}
              </span> */}
              {embedId && <span className="ml-2 text-xs opacity-50 truncate max-w-[200px]">ID: {embedId}</span>}
          </div>
      )}

      {/* Expanded View */}
      <div className={`flex flex-col h-full w-full ${isCollapsed ? 'hidden' : ''}`}>
        {!embedId ? ( 
            <div className="flex flex-col items-center justify-center h-full p-4">
            <form onSubmit={handleUpdate} className="flex gap-2 w-full">
                <input 
                type="text" 
                placeholder="Paste YouTube or Custom Youtube URL" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-white/10 rounded px-3 py-2 text-sm focus:outline-none"
                />
                <button type="submit" className="bg-red-600 px-3 py-2 rounded text-sm font-bold">Load</button>
            </form>
            </div>
        ) : (
            <>
                <div className="flex-1 w-full h-full relative">
                    <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${embedId}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full rounded-2xl"
                    />
                    
                    {/* Reset Button overlay - Using a different position or dependent on hover if not covered by iframe pointer events */}
                    {/* Note: Iframe captures clicks, so we need to position this carefully or use a wrapper with pointer-events-none for structure but events-auto for buttons */}
                    <div className="absolute top-2 left-2 z-10 pointer-events-none">
                         {/* Controls container that sits on top */}
                         <button 
                            onClick={() => updateEmbedId('')} 
                            className="bg-black/60 p-1 rounded text-xs opacity-0 group-hover:opacity-100 transition pointer-events-auto"
                        >
                            Change Video
                        </button>
                    </div>
                </div>
            </>
        )}
      </div>
    </div>
  );
}

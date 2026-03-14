import { useState, useEffect } from 'react';
import { Edit2, Check, Download, Upload, Plus, Image as ImageIcon, Maximize, Minimize, Zap, ZapOff, CircleEllipsis } from 'lucide-react';
import { WidgetType, AppState } from '../types';
import { getInverseColor } from '../utils/colors';

interface ControlsProps {
  isEditing: boolean;
  disableEdit?: boolean;
  onToggleEdit: () => void;
  onAddWidget: (type: WidgetType) => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpdateBlur: (value: number) => void;
  blur: number;
  onUpdateBackground: (updates: Partial<AppState['background']>) => void;
  background: AppState['background'];
  wakeLock?: boolean;
  onToggleWakeLock: () => void;
  activePage: 'page1' | 'page2';
  onTogglePage: () => void;
}

export function Controls({ isEditing, disableEdit, onToggleEdit, onAddWidget, onExport, onImport, onUpdateBlur, blur, onUpdateBackground, background, wakeLock = false, onToggleWakeLock, activePage, onTogglePage }: ControlsProps) {
  const [showBgModal, setShowBgModal] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [imageUrl, setImageUrl] = useState(background.imageValue);
  const [colorValue, setColorValue] = useState(background.colorValue);
  const [fontColorValue, setFontColorValue] = useState(background.fontColorValue || '#ffffff');
  const [textBorderColorValue, setTextBorderColorValue] = useState(background.textBorderColorValue || '#000000');
  const [activeType, setActiveType] = useState<'solid' | 'image'>(background.activeType);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fontColor = background.fontColorValue || '#ffffff';
  const inverseColor = getInverseColor(fontColor);

  const btnStyle = { backgroundColor: inverseColor, color: fontColor };

  // Sync local state when prop updates or modal opens
  useEffect(() => {
    if (showBgModal) {
        setImageUrl(background.imageValue);
        setColorValue(background.colorValue);
        setFontColorValue(background.fontColorValue || '#ffffff');
        setTextBorderColorValue(background.textBorderColorValue || '#000000');
        setActiveType(background.activeType);
    }
  }, [showBgModal, background]);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  const handleBgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBackground({ activeType, imageValue: imageUrl, colorValue, fontColorValue, textBorderColorValue });
    setShowBgModal(false);
  };

  const isValidColor = (color: string) => {
    const s = new Option().style;
    s.color = color;
    return s.color !== '';
  };

  return (
    <>
      {/* Blur Control (Bottom Left) */}
      {isEditing && (
        <div className="fixed bottom-6 left-6 z-50 bg-black/80 backdrop-blur-md p-3 rounded-xl border border-white/10 flex flex-col gap-1 w-64">
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-white uppercase font-bold tracking-wider">Effect Blur</span>
                <span className="text-white text-xs">{blur}px</span>
            </div>
            <input 
                type="range" 
                min="0" 
                max="40" 
                value={blur} 
                onChange={(e) => onUpdateBlur(parseInt(e.target.value))}
                className="w-full accent-green-500 cursor-pointer"
            />
        </div>
      )}

      <div className="fixed bottom-6 right-10 flex items-center gap-2 z-50">
        {isEditing && (
          <div className="flex gap-2 items-center animate-in slide-in-from-right-5 fade-in duration-300">
            
            {/* Settings */}
            <div className="backdrop-blur-md p-2 rounded-xl flex gap-2 border border-white/10" style={btnStyle}>
                <button onClick={() => setShowBgModal(true)} className="p-2 rounded-full hover:opacity-70" title="Change Background">
                  <ImageIcon size={20} />
                </button>
                <label className="cursor-pointer p-2 rounded-full hover:opacity-70" title="Import Config">
                  <Upload size={20} />
                  <input type="file" onChange={onImport} className="hidden" accept=".json" />
                </label>
                <button onClick={onExport} className="p-2 rounded-full hover:opacity-70" title="Export Config">
                  <Download size={20} />
                </button>
            </div>
          
            {/* Add Widgets */}
            <div className="relative">
                <button 
                  onClick={() => setShowAddMenu(!showAddMenu)} 
                  className={`backdrop-blur-md p-3 rounded-full hover:opacity-80 border border-white/10 transition-transform ${showAddMenu ? 'rotate-45' : ''}`}
                  style={btnStyle}
                  title="Add Widget"
                >
                  <Plus size={20} />
                </button>
                
                {showAddMenu && (
                  <div className="absolute bottom-full right-0 mb-4 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl grid grid-cols-2 shadow-2xl overflow-hidden w-64 animate-in slide-in-from-bottom-2 fade-in">
                        <div className="p-3 border-b border-white/10 col-span-2 text-center text-xs text-zinc-400 uppercase font-bold">Add Widget</div>
                        <button onClick={() => { onAddWidget('time'); setShowAddMenu(false); }} className="py-3 px-2 text-sm text-white hover:bg-white/10 transition border-r border-b border-white/5">Time</button>
                        <button onClick={() => { onAddWidget('date'); setShowAddMenu(false); }} className="py-3 px-2 text-sm text-white hover:bg-white/10 transition border-b border-white/5">Date</button>
                        <button onClick={() => { onAddWidget('todo'); setShowAddMenu(false); }} className="py-3 px-2 text-sm text-white hover:bg-white/10 transition border-r border-b border-white/5">Todo</button>
                        <button onClick={() => { onAddWidget('youtube'); setShowAddMenu(false); }} className="py-3 px-2 text-sm text-white hover:bg-white/10 transition border-b border-white/5">YouTube</button>
                        <button onClick={() => { onAddWidget('pomodoro'); setShowAddMenu(false); }} className="py-3 px-2 text-sm text-white hover:bg-white/10 transition border-r border-b border-white/5">Pomodoro</button>
                        <button onClick={() => { onAddWidget('weather'); setShowAddMenu(false); }} className="py-3 px-2 text-sm text-white hover:bg-white/10 transition border-b border-white/5">Weather</button>
                        <button onClick={() => { onAddWidget('spotify'); setShowAddMenu(false); }} className="py-3 px-2 text-sm text-white hover:bg-white/10 transition border-r border-b border-white/5">Spotify</button>
                        <button onClick={() => { onAddWidget('spotify_hidden'); setShowAddMenu(false); }} className="py-2 px-2 text-sm text-white hover:bg-white/10 transition border-b border-white/5 text-center leading-tight">Spotify<br/><span className="text-[10px] text-zinc-400">Minimal</span></button>
                        <button onClick={() => { onAddWidget('waterlog'); setShowAddMenu(false); }} className="py-3 px-2 text-sm text-white hover:bg-white/10 transition border-r border-white/5">WaterLog</button>
                        <button onClick={() => { onAddWidget('spacer'); setShowAddMenu(false); }} className="py-3 px-2 text-sm text-white hover:bg-white/10 transition">Spacer</button>
                  </div>
                )}
            </div>

          </div>
        )}

        <div className="flex items-center gap-1 z-50">
          {showControls && (
            <div className="flex items-center gap-1 animate-in slide-in-from-right-2 fade-in duration-200">
              <button
                onClick={onToggleEdit}
                disabled={disableEdit}
                className={`p-4 rounded-full shadow-lg transition-all transform hover:scale-105 ${disableEdit ? 'opacity-50' : 'hover:opacity-80 backdrop-blur-md'}`}
                style={isEditing && !disableEdit ? { backgroundColor: '#22c55e', color: '#ffffff' } : disableEdit ? { backgroundColor: '#6b7280', color: fontColor } : btnStyle}
              >
                {isEditing ? <Check size={16} /> : <Edit2 size={16} />}
              </button>

              <button
                onClick={onToggleWakeLock}
                className={`p-4 rounded-full shadow-lg transition-all transform hover:scale-105 ${wakeLock ? '' : 'hover:opacity-80 backdrop-blur-md'}`}
                style={wakeLock ? { backgroundColor: '#eab308', color: '#000000' } : btnStyle}
                title={wakeLock ? "Keep Screen Awake (On)" : "Keep Screen Awake (Off)"}
              >
                {wakeLock ? <Zap className="fill-black" size={16} /> : <ZapOff size={16} />}
              </button>

              <button
                onClick={onTogglePage}
                className="p-4 rounded-full shadow-lg transition-all transform hover:scale-105 hover:opacity-80 backdrop-blur-md flex items-center justify-center min-w-[48px] min-h-[48px]"
                style={btnStyle}
                title={`Switch to Page ${activePage === 'page1' ? '2' : '1'}`}
              >
                <span className="text-sm font-bold leading-none">{activePage === 'page1' ? '1' : '2'}</span>
              </button>

              <button
                onClick={() => {
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen();
                  } else {
                    document.exitFullscreen();
                  }
                }}
                className="p-4 rounded-full shadow-lg transition-all transform hover:scale-105 hover:opacity-80 backdrop-blur-md"
                style={btnStyle}
              >
                {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-2 right-2 z-50">
        <div>
          {(
            <button 
              onClick={() => setShowControls(!showControls)} 
              className="p-2 rounded-full shadow-sm transition-all transform hover:scale-105 hover:opacity-80 backdrop-blur-md"
              style={btnStyle}
            >
              <CircleEllipsis size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Background Modal */}
      {showBgModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowBgModal(false)}>
          <div className="bg-zinc-900 p-6 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
             <h3 className="text-white text-lg font-semibold mb-6">Background Settings</h3>
             <form onSubmit={handleBgSubmit} className="flex flex-col gap-6">
               
               {/* Toggle Type */}
               <div className="flex bg-black/30 p-1 rounded-lg">
                   <button 
                    type="button" 
                    className={`flex-1 py-1.5 text-sm rounded-md transition-all ${activeType === 'solid' ? 'bg-white/20 text-white font-medium shadow-sm' : 'text-zinc-400 hover:text-white'}`}
                    onClick={() => setActiveType('solid')}
                   >
                    Solid Color
                   </button>
                   <button 
                    type="button"
                    className={`flex-1 py-1.5 text-sm rounded-md transition-all ${activeType === 'image' ? 'bg-white/20 text-white font-medium shadow-sm' : 'text-zinc-400 hover:text-white'}`}
                    onClick={() => setActiveType('image')}
                   >
                    Image URL
                   </button>
               </div>

               {/* Inputs */}
               <div className="flex flex-col gap-4">
                  <div>
                      <label className="text-xs text-zinc-500 uppercase font-bold mb-1.5 block">Solid Color (Hex)</label>
                      <div className="relative">
                          {/* Color Preview */}
                          <div 
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-white/20 shadow-sm transition-colors"
                            style={{ backgroundColor: isValidColor(colorValue) ? colorValue : 'transparent' }} 
                          />
                          <input 
                              type="text" 
                              placeholder="#000000" 
                              value={colorValue} 
                              onChange={e => setColorValue(e.target.value)}
                              className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-3 text-white text-sm focus:outline-none focus:border-white/30 placeholder:text-zinc-600"
                          />
                      </div>
                  </div>

                  <div>
                      <label className="text-xs text-zinc-500 uppercase font-bold mb-1.5 block">Image URL</label>
                      <input 
                          type="text" 
                          placeholder="https://example.com/image.jpg" 
                          value={imageUrl} 
                          onChange={e => setImageUrl(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-white/30 placeholder:text-zinc-600"
                      />
                  </div>
                  
                  <div className="mt-2 border-t border-white/10 pt-4 flex gap-4">
                      <div className="flex-1">
                          <label className="text-xs text-zinc-500 uppercase font-bold mb-1.5 block">Global Font Color</label>
                          <div className="relative">
                              <div 
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-white/20 shadow-sm transition-colors"
                                style={{ backgroundColor: isValidColor(fontColorValue) ? fontColorValue : 'transparent' }} 
                              />
                              <input 
                                  type="text" 
                                  placeholder="#ffffff" 
                                  value={fontColorValue} 
                                  onChange={e => setFontColorValue(e.target.value)}
                                  className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-3 text-white text-sm focus:outline-none focus:border-white/30 placeholder:text-zinc-600"
                              />
                          </div>
                      </div>
                      <div className="flex-1">
                          <label className="text-xs text-zinc-500 uppercase font-bold mb-1.5 block">Text Border</label>
                          <div className="relative">
                              <div 
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-white/20 shadow-sm transition-colors"
                                style={{ backgroundColor: isValidColor(textBorderColorValue) ? textBorderColorValue : 'transparent' }} 
                              />
                              <input 
                                  type="text" 
                                  placeholder="#000000" 
                                  value={textBorderColorValue} 
                                  onChange={e => setTextBorderColorValue(e.target.value)}
                                  className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-3 text-white text-sm focus:outline-none focus:border-white/30 placeholder:text-zinc-600"
                              />
                          </div>
                      </div>
                  </div>
               </div>

               <div className="flex justify-end gap-2 mt-2">
                 <button type="button" onClick={() => setShowBgModal(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition">Cancel</button>
                 <button type="submit" className="bg-white text-black font-bold py-2 px-6 text-sm rounded-lg hover:bg-gray-200 transition">
                   Save Changes
                 </button>
               </div>
             </form>
          </div>
        </div>
      )}
    </>
  );
}

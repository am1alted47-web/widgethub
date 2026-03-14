'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Widget } from '../types';
import { GripVertical, X, Settings, Square, CheckSquare } from 'lucide-react';
import TimeWidget from './widgets/TimeWidget';
import DateWidget from './widgets/DateWidget';
import TodoWidget from './widgets/TodoWidget';
import YoutubeWidget from './widgets/YoutubeWidget';
import PomodoroWidget from './widgets/PomodoroWidget';
import WeatherWidget from './widgets/WeatherWidget';
import SpotifyWidget from './widgets/SpotifyWidget';
import WaterLogWidget from './widgets/WaterLogWidget';
import SpacerWidget from './widgets/SpacerWidget';

interface WidgetWrapperProps {
    widget: Widget;
    totalInColumn: number;
    isEditing: boolean;
    blur?: number;
    onRemove: (id: string) => void;
    onUpdatePosition: (id: string, position: 'top' | 'middle' | 'bottom' | 'auto') => void;
    onUpdateSettings: (id: string, settings: any) => void;
    fontColor?: string;
}

// Helper function to determine height based on total widgets in column
const getTotalHeight = (totalInColumn: number) => {
    if (totalInColumn === 1) return '100%';
    if (totalInColumn === 2) return '50%';
    if (totalInColumn === 3) return '33.33%';
    return 'auto'; // Default or for more than 3
};

export function WidgetWrapper({
  widget,
  totalInColumn,
  isEditing,
  blur,
  onRemove,
  onUpdatePosition,
  onUpdateSettings,
  fontColor
}: WidgetWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: widget.id, data: { widget } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    height: widget.customHeight ? `${widget.customHeight}%` : getTotalHeight(totalInColumn),
    zIndex: isDragging ? 100 : 'auto',
  };

  // Font scaling factor (default to 1)
  const fontSizeFactor = widget.settings?.fontSizeFactor || 1;
  const enableTextBorder = widget.settings?.enableTextBorder || false;

  const toggleTextBorder = () => {
      onUpdateSettings(widget.id, { enableTextBorder: !enableTextBorder });
  };

  // Firefox-compatible scaling:
  // scale() zooms the content
  // width/height compensation ensures the container flows correctly within the parent
  const contentStyle: React.CSSProperties = {
    width: `calc(100% / ${fontSizeFactor})`,
    height: `calc(100% / ${fontSizeFactor})`,
    transform: `scale(${fontSizeFactor})`,
    transformOrigin: 'top left',
    ...(enableTextBorder ? {
        textShadow: `
          -0.17px -0.17px 0 var(--widget-text-border-color),
           0.17px -0.17px 0 var(--widget-text-border-color),
          -0.17px  0.17px 0 var(--widget-text-border-color),
           0.17px  0.17px 0 var(--widget-text-border-color),
           0px    -0.17px 0 var(--widget-text-border-color),
           0px     0.17px 0 var(--widget-text-border-color),
          -0.17px  0px    0 var(--widget-text-border-color),
           0.17px  0px    0 var(--widget-text-border-color)
        `
    } : {})
  };

  // Common props for widgets
  const widgetProps: any = {
      settings: widget.settings,
      onSettingsChange: (newSettings: any) => onUpdateSettings(widget.id, newSettings),
      blur,
      isEditing, // Pass isEditing to all widgets
      fontColor
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVal = parseFloat(e.target.value);
      onUpdateSettings(widget.id, { fontSizeFactor: newVal });
  };

  // Content for the widget
  const renderContent = () => {
    switch (widget.type) {
      case 'time': return <TimeWidget {...widgetProps} />;
      case 'date': return <DateWidget {...widgetProps} />;
      case 'todo': return <TodoWidget {...widgetProps} />;
      case 'youtube': return <YoutubeWidget {...widgetProps} />;
      case 'pomodoro': return <PomodoroWidget {...widgetProps} />;
      case 'weather': return <WeatherWidget {...widgetProps} />;
      case 'spotify': return <SpotifyWidget {...widgetProps} />;
      case 'spotify_hidden': return <SpotifyWidget {...widgetProps} isHidden={true} />;
      case 'waterlog': return <WaterLogWidget {...widgetProps} />;
      case 'spacer': return <SpacerWidget isEditing={isEditing} />;
      default: return null;
    }
  };


  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`w-full transition-all duration-300 relative flex flex-col p-2 ${isDragging ? 'opacity-50' : ''}`}
      {...attributes} 
    >
      <div className={`relative w-full h-full group ${isEditing ? 'border-2 border-dashed border-white/30 rounded-xl' : ''} overflow-hidden`}>
        
        {/* Widget Content Wrapper for Scaling */}
        <div style={contentStyle} className="w-full h-full">
            {renderContent()}
        </div>

        {/* Edit Controls */}
        {isEditing && (
          <div className="absolute top-2 right-2 flex flex-col items-end gap-2 z-20 opacity-100 transition-opacity">
             <div className="flex gap-2">
                <button onClick={toggleTextBorder} className="p-1 bg-black/50 rounded-md text-white hover:bg-white/20 transition-colors" title="Toggle Text Border">
                    {enableTextBorder ? <CheckSquare size={16} className="text-blue-400" /> : <Square size={16} className="opacity-50" />}
                </button>
                <div {...listeners} className="p-1 bg-black/50 rounded-md cursor-grab active:cursor-grabbing text-white touch-none">
                    <GripVertical size={16} />
                </div>
                <button onClick={() => onRemove(widget.id)} className="p-1 bg-red-500/80 rounded-md text-white hover:bg-red-600">
                    <X size={16} />
                </button>
             </div>
             
             {/* Font Size Slider */}
             <div className="bg-black/80 p-2 rounded-lg flex flex-col gap-1 items-center" onPointerDown={e => e.stopPropagation()}>
                <label className="text-[10px] text-white/70 uppercase font-bold">Size</label>
                <input 
                    type="range" 
                    min="0.5" 
                    max="5.0" 
                    step="0.1" 
                    value={fontSizeFactor}
                    onChange={handleFontSizeChange}
                    className="w-25 accent-blue-500 h-1"
                />
                <span className="text-[10px] text-white">{fontSizeFactor.toFixed(1)}x</span>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

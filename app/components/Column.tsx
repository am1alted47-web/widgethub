'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Widget, ColumnId } from '../types';
import { WidgetWrapper } from './WidgetWrapper';

interface ColumnProps {
  id: ColumnId;
  widgets: Widget[];
  isEditing: boolean;
  blur?: number;
  width: number;
  onRemoveWidget: (id: string) => void;
  onUpdateWidgetPosition: (id: string, position: 'top' | 'middle' | 'bottom' | 'auto') => void;
  onUpdateWidgetHeight: (id: string, height: number) => void;
  onUpdateWidgetSettings: (id: string, settings: any) => void;
  onUpdateColumnWidth: (id: ColumnId, width: number) => void;
  fontColor?: string;
}

export function Column({ id, widgets, isEditing, blur, width, onRemoveWidget, onUpdateWidgetPosition, onUpdateWidgetHeight, onUpdateWidgetSettings, onUpdateColumnWidth, fontColor }: ColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  // For single widget alignment
  let justifyClass = 'justify-start'; // Default top
  if (widgets.length === 1 && !widgets[0].customHeight) {
    // Only use flex alignment if no custom height is set (or maybe even if it is, but usually custom height implies filling space)
    // Actually if custom height is set, flex alignment essentially positions it if it doesn't take full height.
    const pos = widgets[0].positionPreference || 'top';
    if (pos === 'middle') justifyClass = 'justify-center';
    if (pos === 'bottom') justifyClass = 'justify-end';
  }

  // Calculate total height for validation
  const totalHeight = widgets.reduce((sum, w) => sum + (w.customHeight || 0), 0);
  const isInvalid = totalHeight > 100;

  // Visibility logic: disable rendering if width is 0 and NOT editing
  if (width === 0 && !isEditing) return null;

  // If editing and width is 0, we might want to show a small stub or rely on the fact that container might be tiny?
  // Actually, if width is really 0%, it won't be visible even in edit mode.
  // We should enforce a min-width in edit mode via CSS or style to allow grabbing/editing?
  // Or maybe we treat "width" as the stored preference, but render with min-width if editing?
  // Let's use a standard style for now. If it's 0%, it disappears. 
  // Wait, if it disappears, how can user set it back to non-zero?
  // Problem: If 0, UI is gone. Can't edit.
  // Solution: If isEditing and width is 0, render with a fixed small width or just don't let it go strictly to 0 via input (min 1?).
  // User said: "If a column has a value of 0, make it fully disappear in the UI.".
  // To support bringing it back, we need to ensure the controls for it are visible elsewhere OR ensure it doesnt disappear in Edit mode.
  // Let's enforce min-width in edit mode.
  
  const effectiveWidth = (isEditing && width < 10) ? 10 : width; // Min 10% in edit mode to be usable

  return (
    <div
      ref={setNodeRef}
      className={`h-full flex flex-col ${justifyClass} transition-all p-2 ${isEditing ? 'bg-white/5 rounded-lg relative pt-20' : ''}`}
      style={{ width: `${effectiveWidth}%` }}
    >
      {/* Height & Width Controls in Edit Mode */}
      {isEditing && (
        <div className="absolute top-0 left-0 right-0 p-1 pt-6 flex flex-col items-center z-30 bg-black/50 backdrop-blur-sm rounded-t-lg">
           
           {/* Column Width Input */}
           <div className="flex items-center gap-1 mb-2">
               <span className="text-[10px] text-zinc-300 uppercase font-bold">Col Width</span>
               <input 
                    type="number"
                    min="0"
                    max="100"
                    value={width}
                    onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val)) onUpdateColumnWidth(id, val);
                    }}
                    className="w-10 text-center text-xs p-1 rounded bg-white/10 text-white focus:outline-none focus:bg-white/20"
               />
               <span className="text-xs text-zinc-300">%</span>
           </div>

           <div className="flex gap-2">
            {widgets.map((w, idx) => (
              <div key={w.id}>
                <input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="%"
                    value={w.customHeight || ''}
                    onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val)) onUpdateWidgetHeight(w.id, val);
                    }}
                    className={`w-12 text-center text-xs p-1 rounded ${isInvalid ? 'bg-red-500/50 text-white' : 'bg-white/10 text-white'}`}
                />
                <span className="text-xs text-zinc-300">%</span>
              </div>
            ))}
           </div>
           {isInvalid && (
               <div className="text-red-400 text-[10px] mt-1 font-bold">
                   ! Total &gt; 100%
               </div>
           )}
        </div>
      )}

      <SortableContext items={widgets.map(w => w.id)} strategy={verticalListSortingStrategy}>
        {widgets.map((widget) => (
          <WidgetWrapper
            key={widget.id}
            widget={widget}
            totalInColumn={widgets.length}
            isEditing={isEditing}
            blur={blur}
            onRemove={onRemoveWidget}
            onUpdatePosition={onUpdateWidgetPosition}
            onUpdateSettings={onUpdateWidgetSettings}
            fontColor={fontColor}
          />
        ))}
      </SortableContext>
      
      {/* Visual cue for empty column in edit mode */}
      {widgets.length === 0 && isEditing && (
        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-white/20 rounded-xl m-2 text-white/50 text-sm">
          Drop widgets here
        </div>
      )}
    </div>
  );
}

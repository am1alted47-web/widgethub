'use client';

import { useState, useEffect } from 'react';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { Widget, ColumnId, AppState, WidgetType } from './types';
import { Column } from './components/Column';
import { Controls } from './components/Controls';
import { WidgetWrapper } from './components/WidgetWrapper';
import { GuideModal } from './components/GuideModal';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// const MAX_WIDGETS_PER_COLUMN = 4; // Maximum widgets allowed per column

const INITIAL_STATE: AppState = {
  columns: {
    left: [],
    middle: [
        { id: 'time-widget-default', type: 'time', customHeight: 50 },
        { id: 'date-widget-default', type: 'date', customHeight: 50 }
    ],
    right: [],
  },
  columnWidths: {
    left: 25,
    middle: 50,
    right: 25,
  },
  background: {
    activeType: 'solid',
    imageValue: '',
    colorValue: '#1a1a1a', // Default dark bg
    fontColorValue: '#ffffff', // Default white text
  },
  isEditing: false,
  maxWidgetsPerColumn: 3,
  wakeLock: true,
};

export default function Home() {
  const [activeId, setActiveId] = useState<string | null>(null);
  type PageId = 'page1' | 'page2';
  const [pageStates, setPageStates] = useState<Record<PageId, AppState>>({ page1: INITIAL_STATE, page2: INITIAL_STATE });
  const [activePage, setActivePage] = useState<PageId>('page1');
  const [mounted, setMounted] = useState(false); 

  const state = pageStates[activePage];
  const setState = (updater: AppState | ((prev: AppState) => AppState)) => {
    setPageStates(prev => {
      const nextState = typeof updater === 'function' ? updater(prev[activePage]) : updater;
      return { ...prev, [activePage]: nextState };
    });
  };

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('widgethub-config');
    if (saved) {
      try {
        const loadedState = JSON.parse(saved);
        if (loadedState.pages) {
          const p1 = { ...INITIAL_STATE, ...loadedState.pages.page1, columnWidths: loadedState.pages.page1?.columnWidths || INITIAL_STATE.columnWidths, background: { ...INITIAL_STATE.background, ...loadedState.pages.page1?.background }, wakeLock: loadedState.pages.page1?.wakeLock !== undefined ? loadedState.pages.page1.wakeLock : INITIAL_STATE.wakeLock };
          const p2 = { ...INITIAL_STATE, ...loadedState.pages.page2, columnWidths: loadedState.pages.page2?.columnWidths || INITIAL_STATE.columnWidths, background: { ...INITIAL_STATE.background, ...loadedState.pages.page2?.background }, wakeLock: loadedState.pages.page2?.wakeLock !== undefined ? loadedState.pages.page2.wakeLock : INITIAL_STATE.wakeLock };
          setPageStates({ page1: p1, page2: p2 });
          setActivePage(loadedState.activePage || 'page1');
        } else {
          // Safely merge with defaults to handle new properties
          const migratedState = {
               ...INITIAL_STATE,
               ...loadedState,
               columnWidths: loadedState.columnWidths || INITIAL_STATE.columnWidths,
               wakeLock: loadedState.wakeLock !== undefined ? loadedState.wakeLock : INITIAL_STATE.wakeLock,
               background: {
                   ...INITIAL_STATE.background,
                   ...loadedState.background
               }
          };
          setPageStates({ page1: migratedState, page2: INITIAL_STATE });
          setActivePage('page1');
        }
      } catch (e) {
        console.error('Failed to load state', e);
      }
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('widgethub-config', JSON.stringify({
        pages: pageStates,
        activePage
      }));
    }
  }, [pageStates, activePage, mounted]);

  useEffect(() => {
    let wakeLockSentinel: any = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && state.wakeLock) {
          wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        console.error('Wake Lock ERROR:', err);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && state.wakeLock) {
        requestWakeLock();
      }
    };

    if (state.wakeLock) {
      requestWakeLock();
      document.addEventListener('visibilitychange', handleVisibilityChange);
    } else {
      if (wakeLockSentinel) {
        wakeLockSentinel.release();
        wakeLockSentinel = null;
      }
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockSentinel) {
        wakeLockSentinel.release().catch(console.error);
        wakeLockSentinel = null;
      }
    };
  }, [state.wakeLock]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findContainer = (id: string): ColumnId | undefined => {
    if (id in state.columns) {
      return id as ColumnId;
    }
    return (Object.keys(state.columns) as ColumnId[]).find((key) =>
      state.columns[key].find((w) => w.id === id)
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    const overId = over?.id;

    if (!overId || active.id === overId) return;

    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(overId as string) || (overId as ColumnId);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

 
    // Check limits before moving
    const limit = state.maxWidgetsPerColumn || 3;
    if (state.columns[overContainer].length >= limit) {
      // Allow if we are swapping? For now simple restrict
      // Actually DragOver is for temporary visual, we should allow it to "float" potentially
      // But let's restrict the drop.
      return; 
    }

    setState((prev) => {
      const activeItems = prev.columns[activeContainer];
      const overItems = prev.columns[overContainer];
      const activeIndex = activeItems.findIndex((i) => i.id === active.id);
      const overIndex = overItems.findIndex((i) => i.id === overId);

      let newIndex;
      if (overId in prev.columns) {
        newIndex = overItems.length + 1;
      } else {
        const isBelowOverItem =
          over &&
          active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height;

        const modifier = isBelowOverItem ? 1 : 0;
        newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
      }

      return {
        ...prev,
        columns: {
          ...prev.columns,
          [activeContainer]: [
            ...prev.columns[activeContainer].filter((item) => item.id !== active.id),
          ],
          [overContainer]: [
            ...prev.columns[overContainer].slice(0, newIndex),
            activeItems[activeIndex],
            ...prev.columns[overContainer].slice(newIndex, overItems.length),
          ],
        },
      };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(over?.id as string) || (over?.id as ColumnId);

    if (
      activeContainer &&
      overContainer &&
      (activeContainer !== overContainer || (over && active.id !== over.id))
    ) {
       // Check constraints again for final drop
      //  if (activeContainer !== overContainer && state.columns[overContainer].length > 3) {
      //      // Revert? (Complex to revert here without prev state ref, mostly rely on logic preventing the move)
      //      // If we already moved in dragOver, we might have 4 items. We need to trim or prevent.
      //      // Ideally we prevent in DragOver. A better way is:
      //      // If destination has >= 3, don't allow move.
      //  }

      const activeIndex = state.columns[activeContainer].findIndex((w) => w.id === active.id);
      const overIndex = state.columns[overContainer].findIndex((w) => w.id === over?.id);

      if (activeIndex !== overIndex || activeContainer !== overContainer) {
        setState((prev) => {
             // Logic repeated from dragOver mostly for sorting within same container
             if (activeContainer === overContainer) {
                 return {
                    ...prev,
                    columns: {
                        ...prev.columns,
                        [activeContainer]: arrayMove(prev.columns[activeContainer], activeIndex, overIndex)
                    }
                 };
             }
             return prev; // Already handled cross-container in DragOver
        });
      }
    }
    setActiveId(null);
  };

  // Constraint check helper for DragOver
  // (Simplified: we let dnd-kit handle the visuals, but we could add custom collision detection)


  const addWidget = (type: WidgetType) => {
    // Find column with space
    const limit = state.maxWidgetsPerColumn || 3;
    const targetCol = (['left', 'middle', 'right'] as ColumnId[]).find(id => state.columns[id].length < limit);
    if (!targetCol) {
        alert(`All columns are full (max ${limit} per column). Remove a widget first.`);
        return;
    }

    const newWidget: Widget = {
        id: generateId(),
        type,
        settings: {}
    };

    setState(prev => ({
        ...prev,
        columns: {
            ...prev.columns,
            [targetCol]: [...prev.columns[targetCol], newWidget]
        }
    }));
  };

  const removeWidget = (id: string) => {
      const colId = findContainer(id);
      if (!colId) return;
      setState(prev => ({
          ...prev,
          columns: {
              ...prev.columns,
              [colId]: prev.columns[colId].filter(w => w.id !== id)
          }
      }));
  };

  const updateWidgetPosition = (id: string, position: 'top' | 'middle' | 'bottom' | 'auto') => {
      const colId = findContainer(id);
      if (!colId) return;
      
      setState(prev => ({
          ...prev,
          columns: {
              ...prev.columns,
              [colId]: prev.columns[colId].map(w => w.id === id ? { ...w, positionPreference: position } : w)
          }
      }));
  };

  const updateWidgetHeight = (id: string, height: number) => {
      const colId = findContainer(id);
      if (!colId) return;
      
      setState(prev => ({
          ...prev,
          columns: {
              ...prev.columns,
              [colId]: prev.columns[colId].map(w => w.id === id ? { ...w, customHeight: height } : w)
          }
      }));
  };

  const updateWidgetSettings = (id: string, settings: any) => {
      const colId = findContainer(id);
      if (!colId) return;

      setState(prev => ({
          ...prev,
          columns: {
             ...prev.columns,
             [colId]: prev.columns[colId].map(w => w.id === id ? { ...w, settings: { ...w.settings, ...settings } } : w)
          }
      }));
  };

  const updateBackground = (updates: Partial<AppState['background']>) => {
      setState(prev => ({ 
          ...prev, 
          background: { 
              ...prev.background, 
              ...updates 
          } 
      }));
  };

  const updateBlur = (value: number) => {
      setState(prev => ({ ...prev, blur: value }));
  };

  const updateMaxWidgets = (value: number) => {
      setState(prev => ({ ...prev, maxWidgetsPerColumn: value }));
  };

  const toggleWakeLock = () => {
      setState(prev => ({ ...prev, wakeLock: !prev.wakeLock }));
  };

  const updateColumnWidth = (id: ColumnId, width: number) => {
      setState(prev => {
          // Validation: check sum <= 100 ?
          // Actually, let's allow setting it, but UI will show error or we can block here.
          // User said "Ensure... no greater than 100". STRICT.
          // Safely access columnWidths with fallback
          const currentWidths = prev.columnWidths || INITIAL_STATE.columnWidths;
          
          const currentTotal = Object.entries(currentWidths).reduce((sum, [key, val]) => key === id ? sum : sum + val, 0);
          if (currentTotal + width > 100) return prev; // Block update
          
          return {
              ...prev,
              columnWidths: {
                  ...currentWidths,
                  [id]: width
              }
          };
      });
  };

  const exportConfig = () => {
      const blob = new Blob([JSON.stringify({ pages: pageStates, activePage })], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'widgethub-config.json';
      a.click();
      URL.revokeObjectURL(url);
  };

  const importConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const config = JSON.parse(event.target?.result as string);
              if (config.pages) {
                  setPageStates({
                      page1: { ...INITIAL_STATE, ...config.pages.page1, columnWidths: config.pages.page1?.columnWidths || INITIAL_STATE.columnWidths, background: { ...INITIAL_STATE.background, ...config.pages.page1?.background } },
                      page2: { ...INITIAL_STATE, ...config.pages.page2, columnWidths: config.pages.page2?.columnWidths || INITIAL_STATE.columnWidths, background: { ...INITIAL_STATE.background, ...config.pages.page2?.background } }
                  });
                  if (config.activePage) setActivePage(config.activePage);
              } else if (config.columns && config.background) {
                  setState(config);
              }
          } catch (error) {
              console.error('Invalid config file', error);
          }
      };
      reader.readAsText(file);
  };

  const activeWidget = activeId ? (Object.values(state.columns).flat().find(w => w.id === activeId)) : null;

  // Check validity
  const checkValidity = () => {
      for (const col of Object.values(state.columns)) {
          const total = col.reduce((sum, w) => sum + (w.customHeight || 0), 0);
          if (total > 100) return false;
      }
      return true;
  };
  const isValid = checkValidity();

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <main 
        className="h-screen w-full flex overflow-hidden transition-all duration-500 bg-cover bg-center relative"
        style={{ 
            backgroundImage: state.background.activeType === 'image' && state.background.imageValue ? `url(${state.background.imageValue})` : undefined,
            backgroundColor: state.background.activeType === 'solid' ? state.background.colorValue : undefined,
            '--widget-font-color': state.background.fontColorValue || '#ffffff',
            color: 'var(--widget-font-color)'
        } as React.CSSProperties}
      >
        {Object.values(state.columns).every(col => col.length === 0) && !state.isEditing && <GuideModal />}

        {state.isEditing && (
             <div className="absolute top-0 left-1 z-50 bg-black/50 backdrop-blur-md p-1 rounded-b border-x border-b border-white/10 flex items-center gap-2">
                 <span className="text-white text-[10px] whitespace-nowrap">Max/Col:</span>
                 <input 
                    type="number" 
                    min={1} 
                    max={10} 
                    value={state.maxWidgetsPerColumn || 3} 
                    onChange={(e) => updateMaxWidgets(parseInt(e.target.value) || 3)}
                    className="w-10 bg-white/10 border border-white/20 rounded px-1 text-white text-xs"
                 />
             </div>
        )}

        {!mounted ? null : (
            <>
                <Column 
                    id="left" 
                    widgets={state.columns.left} 
                    isEditing={state.isEditing} 
                    blur={state.blur !== undefined ? state.blur : 10}
                    width={state.columnWidths?.left ?? 25}
                    onRemoveWidget={removeWidget} 
                    onUpdateWidgetPosition={updateWidgetPosition}
                    onUpdateWidgetHeight={updateWidgetHeight}
                    onUpdateWidgetSettings={updateWidgetSettings}
                    onUpdateColumnWidth={updateColumnWidth}
                    fontColor={state.background.fontColorValue}
                />
                <Column 
                    id="middle" 
                    widgets={state.columns.middle} 
                    isEditing={state.isEditing} 
                    blur={state.blur !== undefined ? state.blur : 10}
                    width={state.columnWidths?.middle ?? 50}
                    onRemoveWidget={removeWidget} 
                    onUpdateWidgetPosition={updateWidgetPosition}
                    onUpdateWidgetHeight={updateWidgetHeight}
                    onUpdateWidgetSettings={updateWidgetSettings}
                    onUpdateColumnWidth={updateColumnWidth}
                    fontColor={state.background.fontColorValue}
                />
                <Column 
                    id="right" 
                    widgets={state.columns.right} 
                    isEditing={state.isEditing} 
                    blur={state.blur !== undefined ? state.blur : 10}
                    width={state.columnWidths?.right ?? 25}
                    onRemoveWidget={removeWidget} 
                    onUpdateWidgetPosition={updateWidgetPosition}
                    onUpdateWidgetHeight={updateWidgetHeight}
                    onUpdateWidgetSettings={updateWidgetSettings}
                    onUpdateColumnWidth={updateColumnWidth}
                    fontColor={state.background.fontColorValue}
                />
            </>
        )}

        <DragOverlay>
            {activeWidget ? (
               <div className="opacity-80">
                   <WidgetWrapper 
                     widget={activeWidget} 
                     totalInColumn={1} 
                     isEditing={true} 
                     blur={state.blur !== undefined ? state.blur : 10}
                     onRemove={() => {}} 
                     onUpdatePosition={() => {}} 
                     onUpdateSettings={() => {}}
                     fontColor={state.background.fontColorValue}
                   /> 
               </div>
            ) : null}
        </DragOverlay>

        <Controls 
            isEditing={state.isEditing} 
            disableEdit={!isValid}
            onToggleEdit={() => setState(prev => ({ ...prev, isEditing: !prev.isEditing }))}
            onAddWidget={addWidget}
            onExport={exportConfig}
            onImport={importConfig}
            onUpdateBackground={updateBackground}
            background={state.background}
            onUpdateBlur={updateBlur}
            blur={state.blur !== undefined ? state.blur : 10}
            wakeLock={state.wakeLock}
            onToggleWakeLock={toggleWakeLock}
            activePage={activePage}
            onTogglePage={() => setActivePage(prev => prev === 'page1' ? 'page2' : 'page1')}
        />

      </main>
    </DndContext>
  );
}

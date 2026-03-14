import { useState, useEffect, useRef } from 'react';
import { GlassWater, Droplet, Plus, Smartphone, Monitor, Layout } from 'lucide-react';

interface WaterLogEntry {
    amount: number;
    timestamp: string; // ISO string
    timeDisplay: string; // HH:MM format
}

import { getWaterColors, getInverseColor, getGlassOutlineColor } from '../../utils/colors';

interface WaterLogWidgetProps {
    settings?: any;
    onSettingsChange: (settings: any) => void;
    blur?: number;
    isEditing: boolean;
    fontColor?: string;
}

export default function WaterLogWidget({ settings, onSettingsChange, isEditing, blur=0, fontColor }: WaterLogWidgetProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [measuredMode, setMeasuredMode] = useState<'vertical' | 'side' | 'horizontal'>('vertical');
    
    // State
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customAmount, setCustomAmount] = useState('');
    const [lastCustomAmount, setLastCustomAmount] = useState('');
    const [goalInput, setGoalInput] = useState(settings?.goal?.toString() || '2000');
    
    // Settings
    const goal = settings?.goal || 2000;
    const current = settings?.current || 0;
    const history: WaterLogEntry[] = settings?.history || [];
    const layoutPreference = settings?.layoutPreference || 'auto'; // 'auto' | 'vertical' | 'horizontal'

    // determine actual layout mode based on preference
    const layoutMode = layoutPreference === 'auto' ? measuredMode : (
        layoutPreference === 'horizontal' ? 'horizontal' : 'vertical' 
    );

    const waterColors = getWaterColors(fontColor);

    // Resize Observer for Layout
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            const { height } = entry.contentRect;

            if (height < 180) {
                setMeasuredMode('horizontal');
            } else if (height < 300) { 
                 setMeasuredMode('side');
            } else {
                 setMeasuredMode('vertical');
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);
    
    // Check for day reset
    useEffect(() => {
        const today = new Date().toLocaleDateString();
        if (settings?.lastResetDate && settings.lastResetDate !== today) {
             onSettingsChange({
                 ...settings,
                 current: 0,
                 history: [],
                 lastResetDate: today,
                 goal: goal 
             });
        } else if (!settings?.lastResetDate) {
             onSettingsChange({
                 ...settings,
                 lastResetDate: today
             });
        }
    }, [settings?.lastResetDate]);

    const addWater = (amount: number) => {
        const now = new Date();
        const newEntry: WaterLogEntry = {
            amount,
            timestamp: now.toISOString(),
            timeDisplay: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const newCurrent = (current || 0) + amount;
        
        onSettingsChange({
            ...settings,
            current: newCurrent,
            history: [...(history || []), newEntry],
            lastResetDate: new Date().toLocaleDateString()
        });
        
        setShowCustomInput(false);
        setCustomAmount('');
    };

    const submitCustomAmount = () => {
        const val = parseInt(customAmount);
        if (!isNaN(val) && val > 0) {
            setLastCustomAmount(customAmount);
            addWater(val);
        }
    };

    const handleCustomClick = () => {
        if (lastCustomAmount) {
            setCustomAmount(lastCustomAmount);
        }
        setShowCustomInput(true);
    };

    const handleGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setGoalInput(e.target.value);
    };

    const saveGoal = () => {
        let newGoal = parseInt(goalInput);
        if (isNaN(newGoal) || newGoal <= 0) newGoal = 2000;
        
        if (newGoal !== goal) {
            onSettingsChange({
                ...settings,
                goal: newGoal
            });
        }
    };
    
    const toggleLayoutPreference = () => {
        const next = layoutPreference === 'auto' ? 'vertical' : (layoutPreference === 'vertical' ? 'horizontal' : 'auto');
        onSettingsChange({ ...settings, layoutPreference: next });
    };

    useEffect(() => {
        setGoalInput(goal.toString());
    }, [goal]);

    const fillPercentage = Math.min((current / goal) * 100, 100);

    // --- Components ---

    const Controls = () => (
        <div className={`flex gap-2 ${layoutMode === 'horizontal' ? 'flex-col justify-center' : (layoutMode === 'side' ? 'flex-col justify-center' : 'justify-center w-full mt-2')}`}>
             <button 
                onClick={() => addWater(250)}
                className={`flex flex-col items-center justify-center rounded-xl group transition-all
                    ${layoutMode === 'horizontal' ? 'w-8 h-8' : (layoutMode === 'side' ? 'w-10 h-10' : 'w-12 h-12')}
                `}
                style={{ backgroundColor: fontColor ? getInverseColor(fontColor) : 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(128,128,128,0.2)', borderWidth: 1 }}
                title="Add 250mL"
            >
                <div className="relative">
                    <GlassWater size={layoutMode === 'horizontal' ? 14 : 18} style={{ color: fontColor || `rgb(${waterColors.blueLight})` }} />
                     {layoutMode !== 'horizontal' && (
                        <div className="absolute -top-1 -right-1.5 rounded-full w-3 h-3 flex items-center justify-center" style={{ backgroundColor: fontColor || `rgb(${waterColors.blueDark})` }}>
                            <Plus size={8} style={{ color: fontColor ? getInverseColor(fontColor) : '#ffffff', opacity: 1 }} />
                        </div>
                     )}
                </div>
            </button>

            <button 
                onClick={handleCustomClick}
                className={`flex flex-col items-center justify-center rounded-xl group transition-all
                   ${layoutMode === 'horizontal' ? 'w-8 h-8' : (layoutMode === 'side' ? 'w-10 h-10' : 'w-12 h-12')}
                `}
                style={{ backgroundColor: fontColor ? getInverseColor(fontColor) : 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(128,128,128,0.2)', borderWidth: 1 }}
                title="Add Custom"
            >
                <div className="relative">
                    <Droplet size={layoutMode === 'horizontal' ? 14 : 18} style={{ color: fontColor || `rgb(${waterColors.cyanLight})` }} />
                    {layoutMode !== 'horizontal' && (
                         <div className="absolute -top-1 -right-1.5 rounded-full w-3 h-3 flex items-center justify-center" style={{ backgroundColor: fontColor || `rgb(${waterColors.cyanDark})` }}>
                            <Plus size={8} style={{ color: fontColor ? getInverseColor(fontColor) : '#ffffff', opacity: 1 }} />
                         </div>
                    )}
                </div>
            </button>
        </div>
    );

    const GoalDisplay = () => (
        <div className={`flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full z-[30] border border-white/5
            ${layoutMode === 'horizontal' ? 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ' : ''}
            ${layoutMode === 'vertical' ? 'mb-2' : ''}
        `}>
            <span className="font-bold text-xs" style={{ color: `rgb(${waterColors.blueLight})` }}>{current}</span>
            <span className="opacity-40 text-[10px]">/</span>
            {isEditing ? (
                    <div className="flex items-center gap-1">
                    <input 
                        type="number" 
                        value={goalInput} 
                        onChange={handleGoalChange}
                        onBlur={saveGoal}
                        onKeyDown={(e) => e.key === 'Enter' && saveGoal()}
                        className="w-10 bg-white/10 border border-white/20 rounded px-1 text-[10px] text-center focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-[9px] opacity-50">mL</span>
                    </div>
            ) : (
                <span className="opacity-70 text-[11px]">{goal} mL</span>
            )}
        </div>
    );

    return (
        <div ref={containerRef} className="w-full h-full p-2 relative overflow-hidden flex rounded-2xl" style={{ backdropFilter: `blur(${blur}px)`, backgroundColor: `rgba(0, 0, 0, 0)` }}>
            
            {/* Editing Controls - Layout Toggle */}
            {isEditing && (
                <button 
                    onClick={toggleLayoutPreference}
                    className="absolute top-2 left-2 z-[40] p-1.5 bg-black/40 hover:bg-black/60 opacity-70 hover:opacity-100 rounded-lg border border-white/10 transition-colors"
                    title={`Layout: ${layoutPreference.charAt(0).toUpperCase() + layoutPreference.slice(1)}`}
                >
                    {layoutPreference === 'vertical' ? <Smartphone size={12} /> : 
                     layoutPreference === 'horizontal' ? <Monitor size={12} /> : 
                     <Layout size={12} />}
                </button>
            )}

            {/* Modal Overlay */}
            {showCustomInput && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowCustomInput(false)}>
                    <div className="bg-zinc-900 border border-white/20 rounded-xl p-4 flex flex-col gap-3 shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <h4 className="text-sm font-semibold text-center">Add Water Drank</h4>
                        <div className="flex gap-2">
                             <input 
                                type="number" 
                                autoFocus
                                placeholder="Amt (mL)"
                                className="w-24 bg-white/10 border border-white/10 rounded-lg p-2 text-sm outline-none text-center focus:border-blue-500"
                                value={customAmount}
                                onChange={(e) => setCustomAmount(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') submitCustomAmount();
                                    if (e.key === 'Escape') setShowCustomInput(false);
                                }}
                            />
                            <button 
                                onClick={submitCustomAmount}
                                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-500"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Layouts */}
            
            {/* Horizontal Layout */}
            {layoutMode === 'horizontal' && (
                <div className="flex w-full h-full items-center gap-3 relative">
                     {/* Text Absolute Center */}
                     <GoalDisplay />

                     {/* Controls Left */}
                     <div className="flex flex-col gap-1 items-center justify-center shrink-0 w-8">
                         <Controls />
                     </div>

                     {/* Horizontal Bar Cup */}
                     <div className="flex-1 h-12 relative">
                         {/* Bar Container */}
                         <div className="relative w-full h-full border-2 rounded-xl overflow-hidden bg-white/5" style={{ borderColor: getGlassOutlineColor(fontColor) }}>
                            <div 
                                className="absolute top-0 left-0 h-full transition-all duration-700 ease-in-out"
                                style={{ width: `${fillPercentage}%`, backgroundColor: `rgb(${waterColors.blueBase}/0.5)` }}
                            >
                                <div className="absolute top-0 right-0 h-full w-[2px]" style={{ backgroundColor: `rgb(${waterColors.blueLight})`, boxShadow: `0 0 10px rgb(${waterColors.blueBase}/0.8)` }}></div>
                                <div className="absolute top-0 left-0 w-full h-full" style={{ background: `linear-gradient(to right, rgb(${waterColors.blueLight}/0.2), rgb(${waterColors.blueDark}/0.6))` }}></div>
                            </div>
                            
                             {/* History Markers */}
                             {history.map((entry, idx) => {
                                 const cumulative = history.slice(0, idx + 1).reduce((acc, curr) => acc + curr.amount, 0);
                                 if (cumulative <= 0) return null;
                                 const pct = Math.min((cumulative / goal) * 100, 100);
                                 return (
                                     <div 
                                        key={idx}
                                        className="absolute h-full border-r border-white/40 border-dashed top-0 pointer-events-none"
                                        style={{ left: `${pct}%` }}
                                     />
                                 );
                             })}
                         </div>
                         
                         {/* Labels */}
                         {history.map((entry, idx) => {
                             const cumulative = history.slice(0, idx + 1).reduce((acc, curr) => acc + curr.amount, 0);
                             if (cumulative <= 0) return null;
                             const pct = Math.min((cumulative / goal) * 100, 100);
                             const isTop = idx % 2 === 0;
                             
                             return (
                                <div 
                                    key={idx}
                                    className={`absolute text-[9px] opacity-70 whitespace-nowrap transform -translate-x-1/2 flex flex-col items-center ${isTop ? '-top-4' : '-bottom-4'}`}
                                    style={{ left: `${pct}%` }}
                                >
                                    <span>{entry.timeDisplay}</span>
                                </div>
                             )
                         })}
                     </div>
                </div>
            )}

            {/* Vertical & Side-by-Side */}
            {layoutMode !== 'horizontal' && (
                <div className={`flex w-full h-full items-center ${layoutMode === 'side' ? 'flex-row gap-3 justify-center' : 'flex-col'}`}>
                    
                    {/* Header for Vertical */}
                    {layoutMode === 'vertical' && (
                         <div className="w-full flex justify-center mb-2">
                             <GoalDisplay />
                         </div>
                    )}
                    
                    {/* Cup container */}
                    <div className={`relative flex justify-center items-end ${layoutMode === 'side' ? 'h-[90%]' : 'w-full flex-1'}`}>
                        <div className={`relative border-b-4 border-l-4 border-r-4 rounded-b-2xl overflow-hidden bg-white/5 backdrop-blur-sm transition-all duration-300
                            ${layoutMode === 'side' ? 'w-20 h-full' : 'w-24 h-full'}
                        `} style={{ borderColor: getGlassOutlineColor(fontColor) }}>
                             {/* Water */}
                            <div 
                                className="absolute bottom-0 left-0 w-full transition-all duration-700 ease-in-out"
                                style={{ height: `${fillPercentage}%`, backgroundColor: `rgb(${waterColors.blueBase}/0.5)` }}
                            >   
                                <div className="absolute top-0 left-0 w-full h-[2px]" style={{ backgroundColor: `rgb(${waterColors.blueLight})`, boxShadow: `0 0 10px rgb(${waterColors.blueBase}/0.8)` }}></div>
                                <div className="absolute top-0 left-0 w-full h-full" style={{ background: `linear-gradient(to bottom, rgb(${waterColors.blueLight}/0.2), rgb(${waterColors.blueDark}/0.6))` }}></div>
                            </div>
                            
                            {/* History Lines */}
                            {history.map((entry, idx) => {
                                const cumulative = history.slice(0, idx + 1).reduce((acc, curr) => acc + curr.amount, 0);
                                if (cumulative <= 0) return null;
                                const pct = Math.min((cumulative / goal) * 100, 100);
                                return (
                                    <div key={idx} className="absolute w-full border-t border-white/30 border-dashed pointer-events-none" style={{ bottom: `${pct}%` }} />
                                );
                            })}
                        </div>
                        
                        {/* Labels for Vertical/Side Cup */}
                        {history.map((entry, idx) => {
                             const cumulative = history.slice(0, idx + 1).reduce((acc, curr) => acc + curr.amount, 0);
                             if (cumulative <= 0) return null;
                             const pct = Math.min((cumulative / goal) * 100, 100);
                             
                             // Side mode: Always left. Vertical: Alternating.
                             const isLeft = layoutMode === 'side' ? true : idx % 2 === 0;
                             
                             return (
                                <div 
                                    key={idx}
                                    className={`absolute text-[7px] opacity-60 whitespace-nowrap transition-all duration-500`}
                                    style={{ 
                                        bottom: `${pct}%`, 
                                        [isLeft ? 'right' : 'left']: '50%',
                                        transform: `translate(${isLeft ? '-50px' : '50px'}, 50%)`
                                    }}
                                >
                                    <span className={isLeft ? "mr-1" : "ml-1"}>{entry.timeDisplay}</span>
                                </div>
                             );
                        })}
                        
                    </div>

                    {/* Middle Column for Side Mode: GoalDisplay */}
                    {layoutMode === 'side' && (
                        <div className="flex flex-col justify-center items-center">
                            <GoalDisplay />
                        </div>
                    )}

                    {/* Controls */}
                    <div className={`${layoutMode === 'side' ? 'flex flex-col justify-center' : ''}`}>
                         <Controls />
                    </div>
                </div>
            )}

        </div>
    );
}

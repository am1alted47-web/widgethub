'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Monitor, Coffee } from 'lucide-react';
import { useWorkerInterval } from '../../hooks/useWorkerInterval';

interface PomodoroWidgetProps {
    blur?: number;
}

export default function PomodoroWidget({ blur = 0 }: PomodoroWidgetProps) {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [isAnimedoro, setIsAnimedoro] = useState(false);

  useWorkerInterval(() => {
    setTimeLeft((prev) => prev - 1);
  }, isActive && timeLeft > 0 ? 1000 : null);

  useEffect(() => {
    if (timeLeft === 0 && isActive) {
      // Play audio
      const audio = new Audio('/timer_end.mp3');
      audio.play().catch((e) => console.error('Error playing audio:', e));

      // Switch mode
      const nextMode = mode === 'work' ? 'break' : 'work';
      setMode(nextMode);

      // Set time for new mode
      if (isAnimedoro) {
          setTimeLeft(nextMode === 'work' ? 40 * 60 : 25 * 60);
      } else {
          setTimeLeft(nextMode === 'work' ? 25 * 60 : 5 * 60);
      }
    }
  }, [isActive, timeLeft, mode, isAnimedoro]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    if (isAnimedoro) {
       setTimeLeft(mode === 'work' ? 40 * 60 : 25 * 60);
    } else {
       setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
    }
  };

  const switchMode = (newMode: 'work' | 'break') => {
    setMode(newMode);
    setIsActive(false);
    if (isAnimedoro) {
        setTimeLeft(newMode === 'work' ? 40 * 60 : 25 * 60);
    } else {
        setTimeLeft(newMode === 'work' ? 25 * 60 : 5 * 60);
    }
  };

  const toggleAnimedoro = () => {
      const newAnimedoro = !isAnimedoro;
      setIsAnimedoro(newAnimedoro);
      setIsActive(false);
      // Reset times based on new mode
      if (newAnimedoro) {
          // Animedoro defaults
          setTimeLeft(mode === 'work' ? 40 * 60 : 25 * 60);
      } else {
          // Pomodoro defaults
          setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
      }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString()}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const updateTitle = () => {
      if (document.hidden && isActive) {
        document.title = `${formatTime(timeLeft)} - WidgetHub`;
      } else {
        document.title = 'WidgetHub';
      }
    };

    updateTitle();

    document.addEventListener('visibilitychange', updateTitle);
    return () => {
      document.removeEventListener('visibilitychange', updateTitle);
      document.title = 'WidgetHub';
    };
  }, [isActive, timeLeft]);

  return (
    <div 
        className="flex flex-col items-center justify-center h-full w-full rounded-2xl p-4 relative overflow-hidden transition-colors duration-300"
        style={{ 
            backdropFilter: `blur(${blur}px)`,
            backgroundColor: `rgba(0, 0, 0, 0)`
        }}
    >
      {/* Animedoro Toggle */}
      <div className="absolute top-2 right-2">
          <button 
            onClick={toggleAnimedoro}
            className={`text-[10px] px-2 py-1 rounded-full border transition ${isAnimedoro ? 'bg-pink-500/20 border-pink-500 text-pink-200' : 'bg-white/10 border-white/20 opacity-50'}`}
            title="Toggle Animedoro (40m/20m)"
          >
              {isAnimedoro ? 'LONG' : 'SHORT'}
          </button>
      </div>

      <div className="flex gap-2 mb-4 bg-white/10 p-1 rounded-lg">
        <button 
          onClick={() => switchMode('work')}
          className={`px-3 py-1 rounded text-sm font-medium transition flex items-center gap-1 ${mode === 'work' ? 'bg-red-500 text-white' : 'opacity-50 hover:opacity-100'}`}
        >
          <Monitor size={14} /> Work
        </button>
        <button 
          onClick={() => switchMode('break')}
          className={`px-3 py-1 rounded text-sm font-medium transition flex items-center gap-1 ${mode === 'break' ? 'bg-green-500 text-white' : 'opacity-50 hover:opacity-100'}`}
        >
          <Coffee size={14} /> Break
        </button>
      </div>

      <div className="text-6xl font-mono font-bold mb-4 tabular-nums tracking-tighter">
        {formatTime(timeLeft)}
      </div>

      <div className="flex items-center gap-4">
          <button 
            onClick={toggleTimer}
            className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition  backdrop-blur-sm"
          >
              {isActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
          </button>
          
          <button 
            onClick={resetTimer}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition opacity-70 hover:opacity-100"
            title="Reset Timer"
          >
              <RotateCcw size={20} />
          </button>
      </div>

      
      {/* {isAnimedoro && <span className="text-xs text-yellow-200 mt-2 font-semibold tracking-wider">ANIMEDORO ACTIVE</span>} */}

    </div>
  );
}

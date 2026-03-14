'use client';

import { useState, useEffect } from 'react';
import { useWorkerInterval } from '../../hooks/useWorkerInterval';

interface TimeWidgetProps {
    blur?: number;
}

export default function TimeWidget({ blur = 0 }: TimeWidgetProps) {
  const [time, setTime] = useState(new Date());

  useWorkerInterval(() => {
    setTime(new Date());
  }, 1000);

  return (
    <div 
        className="flex flex-col items-center justify-center h-full w-full rounded-2xl transition-colors duration-300"
        style={{ 
            backdropFilter: `blur(${blur}px)`,
            backgroundColor: `rgba(0, 0, 0, 0)`
        }}
    >
      <div className="text-7xl font-bold tracking-tight">
        {time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(/\s?(AM|PM)/i, '')}
      </div>
    </div>
  );
}

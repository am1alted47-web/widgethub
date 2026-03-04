import { useEffect, useRef } from 'react';

export function useWorkerInterval(callback: () => void, delay: number | null) {
    const savedCallback = useRef(callback);

    // Remember the latest callback if it changes.
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // Set up the interval.
    useEffect(() => {
        // Don't schedule if no delay is specified.
        if (delay === null) {
            return;
        }

        const code = `
      let timer = null;
      self.onmessage = function(e) {
        if (e.data.command === 'start') {
          timer = setInterval(function() {
            self.postMessage('tick');
          }, e.data.interval);
        } else if (e.data.command === 'stop') {
          clearInterval(timer);
          timer = null;
        }
      };
    `;

        const blob = new Blob([code], { type: 'application/javascript' });
        const worker = new Worker(URL.createObjectURL(blob));

        worker.onmessage = () => {
            savedCallback.current();
        };

        worker.postMessage({ command: 'start', interval: delay });

        return () => {
            worker.postMessage({ command: 'stop' });
            worker.terminate();
        };
    }, [delay]);
}

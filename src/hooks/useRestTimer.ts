import { useState, useEffect, useCallback, useRef } from "react";

export function useRestTimer() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            // Vibrate if available
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, seconds]);

  const startTimer = useCallback((durationSeconds: number) => {
    setTotalSeconds(durationSeconds);
    setSeconds(durationSeconds);
    setIsRunning(true);
  }, []);

  const stopTimer = useCallback(() => {
    setIsRunning(false);
    setSeconds(0);
  }, []);

  const formatTime = useCallback((s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  return {
    seconds,
    isRunning,
    totalSeconds,
    startTimer,
    stopTimer,
    formatTime,
  };
}

export function parseRestTime(rest: string): number {
  const match = rest.match(/(\d+)s/);
  if (match) return parseInt(match[1]);
  return 60; // default
}

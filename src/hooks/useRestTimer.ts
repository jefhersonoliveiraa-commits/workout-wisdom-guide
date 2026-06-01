import { useState, useEffect, useCallback, useRef } from "react";

export function useRestTimer() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const endTimeRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);
        if (remaining <= 0) {
          setSeconds(0);
          setIsRunning(false);
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        } else {
          setSeconds(remaining);
        }
      }, 200);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const startTimer = useCallback((durationSeconds: number) => {
    endTimeRef.current = Date.now() + durationSeconds * 1000;
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

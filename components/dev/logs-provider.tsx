'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface LogEntry {
  request: string;
  response: string;
}

interface LogsContextType {
  logs: LogEntry[];
  addLog: (entry: LogEntry) => void;
  unlocked: boolean;
  unlock: () => void;
}

const LogsContext = createContext<LogsContextType | undefined>(undefined);

export function LogsProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('logsUnlocked') === 'true') {
      setUnlocked(true);
    }
  }, []);

  const addLog = (entry: LogEntry) => setLogs((prev) => [...prev, entry]);

  const unlock = () => {
    setUnlocked(true);
    localStorage.setItem('logsUnlocked', 'true');
  };

  return (
    <LogsContext.Provider value={{ logs, addLog, unlocked, unlock }}>
      {children}
    </LogsContext.Provider>
  );
}

export function useLogs() {
  const ctx = useContext(LogsContext);
  if (!ctx) throw new Error('useLogs must be used within LogsProvider');
  return ctx;
}

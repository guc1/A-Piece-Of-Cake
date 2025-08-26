'use client';
import { createContext, useContext, useState } from 'react';

interface LogEntry {
  request: string;
  response: string;
}

interface LogsContextType {
  logs: LogEntry[];
  addLog: (entry: LogEntry) => void;
  enableLogs: () => void;
}

const LogsContext = createContext<LogsContextType | undefined>(undefined);

export function LogsProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);

  const addLog = (entry: LogEntry) => setLogs((prev) => [...prev, entry]);
  const enableLogs = () => setEnabled(true);

  return (
    <LogsContext.Provider value={{ logs, addLog, enableLogs }}>
      {children}
      {enabled && (
        <>
          <button
            className="fixed top-2 right-2 z-50 bg-gray-800 text-white px-2 py-1 rounded"
            onClick={() => setOpen(!open)}
          >
            Logs
          </button>
          {open && (
            <div className="fixed top-10 right-2 z-50 w-80 h-96 overflow-y-auto bg-white border shadow-lg p-2 text-sm">
              {logs.length === 0 && <p>No logs yet.</p>}
              {logs.map((l, i) => (
                <div key={i} className="mb-2">
                  <div className="font-semibold">Request:</div>
                  <pre className="whitespace-pre-wrap break-words">
                    {l.request}
                  </pre>
                  <div className="font-semibold mt-1">Response:</div>
                  <pre className="whitespace-pre-wrap break-words">
                    {l.response}
                  </pre>
                  <hr className="my-2" />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </LogsContext.Provider>
  );
}

export function useLogs() {
  const ctx = useContext(LogsContext);
  if (!ctx) {
    throw new Error('useLogs must be used within LogsProvider');
  }
  return ctx;
}

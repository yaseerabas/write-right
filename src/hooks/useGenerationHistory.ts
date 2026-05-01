import { useState, useEffect, useCallback } from 'react';
import { useSecureStorage } from './useSecureStorage';
import { generateSecureId } from '@/utils/encryption';

export interface HistoryEntry {
  id: string;
  timestamp: number;
  input: string;
  output: string;
  toolUsed: string;
  tone?: string;
  length?: string;
}

const MAX_HISTORY_ENTRIES = 50;

export function useGenerationHistory() {
  const [history, setHistory, , isReady] = useSecureStorage<HistoryEntry[]>('generation_history', []);
  const [searchQuery, setSearchQuery] = useState('');

  const addEntry = useCallback((entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
    setHistory(prev => {
      const newEntry: HistoryEntry = {
        ...entry,
        id: generateSecureId(),
        timestamp: Date.now()
      };

      // Add to beginning, limit to MAX_HISTORY_ENTRIES
      const updated = [newEntry, ...prev].slice(0, MAX_HISTORY_ENTRIES);
      return updated;
    });
  }, [setHistory]);

  const removeEntry = useCallback((id: string) => {
    setHistory(prev => prev.filter(entry => entry.id !== id));
  }, [setHistory]);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, [setHistory]);

  const filteredHistory = useCallback(() => {
    if (!searchQuery.trim()) return history;

    const query = searchQuery.toLowerCase();
    return history.filter(entry =>
      entry.input.toLowerCase().includes(query) ||
      entry.output.toLowerCase().includes(query) ||
      entry.toolUsed.toLowerCase().includes(query)
    );
  }, [history, searchQuery]);

  const getEntryById = useCallback((id: string) => {
    return history.find(entry => entry.id === id);
  }, [history]);

  const exportHistory = useCallback(() => {
    const dataStr = JSON.stringify(history, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-writing-history-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [history]);

  return {
    history,
    isReady,
    addEntry,
    removeEntry,
    clearHistory,
    searchQuery,
    setSearchQuery,
    filteredHistory: filteredHistory(),
    getEntryById,
    exportHistory,
    entryCount: history.length
  };
}

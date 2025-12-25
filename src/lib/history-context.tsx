import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface HistorySettings {
    enabled: boolean;
    save_full_text: boolean;
    retention_days: number | null;
}

export interface TranscriptionEntry {
    id: string;
    timestamp: number;
    duration_ms: number;
    text: string | null;
    word_count: number;
    char_count: number;
    shortcut_used: string | null;
    target_app: string | null;
}

export interface TranscriptionHistory {
    entries: TranscriptionEntry[];
    settings: HistorySettings;
}

interface HistoryContextType {
    settings: HistorySettings;
    entries: TranscriptionEntry[];
    isLoading: boolean;
    updateSettings: (settings: HistorySettings) => Promise<void>;
    refreshHistory: () => Promise<void>;
    deleteEntry: (id: string) => Promise<void>;
    clearHistory: () => Promise<void>;
    exportHistory: (format: 'json' | 'csv') => Promise<string>;
    saveEntry: (
        timestamp: number,
        durationMs: number,
        text: string,
        wordCount: number,
        charCount: number,
        shortcutUsed?: string,
        targetApp?: string
    ) => Promise<void>;
}

const defaultSettings: HistorySettings = {
    enabled: true,
    save_full_text: true,
    retention_days: null,
};

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export function HistoryProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<HistorySettings>(defaultSettings);
    const [entries, setEntries] = useState<TranscriptionEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshHistory = useCallback(async () => {
        try {
            setIsLoading(true);
            const history = await invoke<TranscriptionHistory>('load_history');
            setSettings(history.settings);
            setEntries(history.entries);
        } catch (error) {
            console.error('Failed to load history:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateSettings = useCallback(async (newSettings: HistorySettings) => {
        try {
            await invoke('save_history_settings', { settings: newSettings });
            setSettings(newSettings);
        } catch (error) {
            console.error('Failed to save settings:', error);
            throw error;
        }
    }, []);

    const deleteEntry = useCallback(async (id: string) => {
        try {
            await invoke('delete_history_entry', { id });
            setEntries((prev) => prev.filter((entry) => entry.id !== id));
        } catch (error) {
            console.error('Failed to delete entry:', error);
            throw error;
        }
    }, []);

    const clearHistory = useCallback(async () => {
        try {
            await invoke('clear_history');
            setEntries([]);
        } catch (error) {
            console.error('Failed to clear history:', error);
            throw error;
        }
    }, []);

    const exportHistory = useCallback(async (format: 'json' | 'csv'): Promise<string> => {
        try {
            const data = await invoke<string>('export_history', { format });
            return data;
        } catch (error) {
            console.error('Failed to export history:', error);
            throw error;
        }
    }, []);

    const saveEntry = useCallback(async (
        timestamp: number,
        durationMs: number,
        text: string,
        wordCount: number,
        charCount: number,
        shortcutUsed?: string,
        targetApp?: string
    ) => {
        try {
            await invoke('save_history_entry', {
                timestamp,
                durationMs,
                text,
                wordCount,
                charCount,
                shortcutUsed: shortcutUsed ?? null,
                targetApp: targetApp ?? null,
            });
            // Refresh to get the new entry
            await refreshHistory();
        } catch (error) {
            console.error('Failed to save entry:', error);
        }
    }, [refreshHistory]);

    useEffect(() => {
        refreshHistory();
    }, [refreshHistory]);

    return (
        <HistoryContext.Provider
            value={{
                settings,
                entries,
                isLoading,
                updateSettings,
                refreshHistory,
                deleteEntry,
                clearHistory,
                exportHistory,
                saveEntry,
            }}
        >
            {children}
        </HistoryContext.Provider>
    );
}

export function useHistory() {
    const context = useContext(HistoryContext);
    if (context === undefined) {
        throw new Error('useHistory must be used within a HistoryProvider');
    }
    return context;
}

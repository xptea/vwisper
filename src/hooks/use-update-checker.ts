import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { APP_VERSION, UPDATE_CONFIG, isUpdateAvailable } from '@/lib/version';

export interface UpdateInfo {
    isAvailable: boolean;
    currentVersion: string;
    latestVersion: string;
    downloadUrl: string;
    lastChecked: Date | null;
}

export interface UpdateState {
    updateInfo: UpdateInfo;
    isChecking: boolean;
    isDownloading: boolean;
    downloadProgress: number;
    error: string | null;
    checkForUpdates: () => Promise<void>;
    downloadAndInstall: () => Promise<void>;
}

const DEFAULT_UPDATE_INFO: UpdateInfo = {
    isAvailable: false,
    currentVersion: APP_VERSION,
    latestVersion: APP_VERSION,
    downloadUrl: '',
    lastChecked: null,
};

/**
 * Hook to check for application updates from GitHub
 * Uses Tauri backend to avoid CORS issues
 */
export function useUpdateChecker(): UpdateState {
    const [updateInfo, setUpdateInfo] = useState<UpdateInfo>(DEFAULT_UPDATE_INFO);
    const [isChecking, setIsChecking] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const checkForUpdates = useCallback(async () => {
        setIsChecking(true);

        try {
            // Use Tauri backend to fetch version (bypasses CORS)
            const latestVersion = await invoke<string>('check_for_update');
            setError(null);
            const hasUpdate = isUpdateAvailable(APP_VERSION, latestVersion);

            setUpdateInfo({
                isAvailable: hasUpdate,
                currentVersion: APP_VERSION,
                latestVersion,
                downloadUrl: UPDATE_CONFIG.getDownloadUrl(latestVersion),
                lastChecked: new Date(),
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage);
            console.error('Update check failed:', err);
        } finally {
            setIsChecking(false);
        }
    }, []);

    const downloadAndInstall = useCallback(async () => {
        if (!updateInfo.isAvailable || !updateInfo.downloadUrl) {
            setError('No update available to download');
            return;
        }

        setIsDownloading(true);
        setDownloadProgress(0);
        setError(null);

        try {
            // Call Tauri command to download and install the update
            await invoke('download_and_install_update', {
                downloadUrl: updateInfo.downloadUrl,
                version: updateInfo.latestVersion,
            });

            // If we get here, the download started successfully
            // The Tauri backend will handle the rest (launching new version, closing old)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage);
            console.error('Update download failed:', err);
            setIsDownloading(false);
        }
    }, [updateInfo]);

    // Check for updates on mount
    useEffect(() => {
        checkForUpdates();

        // Also check every 30 minutes
        const interval = setInterval(checkForUpdates, 30 * 60 * 1000);

        return () => clearInterval(interval);
    }, [checkForUpdates]);

    return {
        updateInfo,
        isChecking,
        isDownloading,
        downloadProgress,
        error,
        checkForUpdates,
        downloadAndInstall,
    };
}

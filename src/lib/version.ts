/**
 * Current application version
 * This should match the version in tauri.conf.json and Cargo.toml
 */
export const APP_VERSION = "0.0.5";

/**
 * GitHub repository information for updates
 */
export const UPDATE_CONFIG = {
    versionUrl: "https://raw.githubusercontent.com/xptea/VWisper-Releases/refs/heads/main/version",
    releaseBaseUrl: "https://github.com/xptea/VWisper-Releases/releases/download",

    /**
     * Generates the download URL for a specific version
     * Format: https://github.com/xptea/VWisper-Releases/releases/download/{version}/vwisper_{version}_x64-setup.exe
     */
    getDownloadUrl: (version: string) => {
        return `${UPDATE_CONFIG.releaseBaseUrl}/${version}/vwisper_${version}_x64-setup.exe`;
    }
} as const;

/**
 * Compare two semantic version strings
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
export function compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    const maxLength = Math.max(parts1.length, parts2.length);

    for (let i = 0; i < maxLength; i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;

        if (p1 > p2) return 1;
        if (p1 < p2) return -1;
    }

    return 0;
}

/**
 * Check if an update is available
 */
export function isUpdateAvailable(currentVersion: string, remoteVersion: string): boolean {
    return compareVersions(remoteVersion, currentVersion) > 0;
}

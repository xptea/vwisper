import { IconDownload, IconRefresh, IconSparkles } from "@tabler/icons-react";
import { useUpdate } from "@/lib/update-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UpdateCardProps {
    className?: string;
}

export function UpdateCard({ className }: UpdateCardProps) {
    const {
        updateInfo,
        isChecking,
        isDownloading,
        error,
        checkForUpdates,
        downloadAndInstall,
    } = useUpdate();

    // Don't render if no update is available
    if (!updateInfo.isAvailable && !error) {
        return null;
    }

    return (
        <div
            className={cn(
                "rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-3",
                className
            )}
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <IconSparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight">
                        {error ? "Update Error" : "Update Available"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {error
                            ? "Failed to check"
                            : `v${updateInfo.latestVersion} is ready`}
                    </p>
                </div>
            </div>

            {/* Content */}
            {error ? (
                <div className="space-y-2">
                    <p className="text-xs text-destructive line-clamp-2">{error}</p>
                    <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-8 text-xs"
                        onClick={checkForUpdates}
                        disabled={isChecking}
                    >
                        <IconRefresh
                            className={cn("mr-1.5 h-3.5 w-3.5", isChecking && "animate-spin")}
                        />
                        {isChecking ? "Checking..." : "Retry"}
                    </Button>
                </div>
            ) : (
                <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">v{updateInfo.currentVersion}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-primary font-medium">v{updateInfo.latestVersion}</span>
                    </div>
                    <Button
                        size="sm"
                        className="w-full h-8 text-xs"
                        onClick={downloadAndInstall}
                        disabled={isDownloading}
                    >
                        <IconDownload
                            className={cn(
                                "mr-1.5 h-3.5 w-3.5",
                                isDownloading && "animate-bounce"
                            )}
                        />
                        {isDownloading ? "Downloading..." : "Download & Install"}
                    </Button>
                    {isDownloading && (
                        <p className="text-[10px] text-center text-muted-foreground">
                            App will restart after download
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}


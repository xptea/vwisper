import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { IconRefresh, IconDownload, IconCheck, IconX } from "@tabler/icons-react";
import { useUpdate } from "@/lib/update-context";
import { APP_VERSION } from "@/lib/version";

export default function Settings() {
    const [pasteMode, setPasteMode] = React.useState(localStorage.getItem('pasteMode') || 'word');
    const {
        updateInfo,
        isChecking,
        isDownloading,
        error,
        checkForUpdates,
        downloadAndInstall
    } = useUpdate();

    const handlePasteModeChange = (newMode: string) => {
        setPasteMode(newMode);
        localStorage.setItem('pasteMode', newMode);
    };

    return (
        <div className="flex flex-col gap-4 p-4 md:p-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold">Settings</h1>
                <p className="text-muted-foreground">Manage your VWisper preferences</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Transcription Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Transcription</CardTitle>
                        <CardDescription>
                            Configure how VWisper transcribes and pastes text
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Paste Mode</Label>
                            <RadioGroup value={pasteMode} onValueChange={handlePasteModeChange}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="word" id="word" />
                                    <Label htmlFor="word" className="font-normal">Word by Word</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="sentence" id="sentence" />
                                    <Label htmlFor="sentence" className="font-normal">Full Sentence</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </CardContent>
                </Card>

                {/* Appearance Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Appearance</CardTitle>
                        <CardDescription>
                            Customize the look and feel of VWisper
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Theme</Label>
                            <p className="text-sm text-muted-foreground">
                                VWisper follows your system theme preference
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Updates Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Updates</CardTitle>
                        <CardDescription>
                            Check for and install VWisper updates
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Current Version</span>
                                <span className="text-sm font-medium">v{APP_VERSION}</span>
                            </div>

                            {updateInfo.lastChecked && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Last Checked</span>
                                    <span className="text-sm">{updateInfo.lastChecked.toLocaleTimeString()}</span>
                                </div>
                            )}

                            {updateInfo.isAvailable && (
                                <div className="flex items-center gap-2 p-2 rounded-md bg-primary/10 border border-primary/20">
                                    <IconCheck className="h-4 w-4 text-primary" />
                                    <span className="text-sm text-primary font-medium">
                                        Update available: v{updateInfo.latestVersion}
                                    </span>
                                </div>
                            )}

                            {error && (
                                <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 border border-destructive/20">
                                    <IconX className="h-4 w-4 text-destructive" />
                                    <span className="text-sm text-destructive">{error}</span>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={checkForUpdates}
                                    disabled={isChecking}
                                    className="flex-1"
                                >
                                    <IconRefresh className={`mr-2 h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
                                    {isChecking ? 'Checking...' : 'Check for Updates'}
                                </Button>

                                {updateInfo.isAvailable && (
                                    <Button
                                        size="sm"
                                        onClick={downloadAndInstall}
                                        disabled={isDownloading}
                                        className="flex-1"
                                    >
                                        <IconDownload className={`mr-2 h-4 w-4 ${isDownloading ? 'animate-bounce' : ''}`} />
                                        {isDownloading ? 'Downloading...' : 'Install Update'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* About Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>About VWisper</CardTitle>
                        <CardDescription>
                            Voice-to-text made simple
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Version</span>
                                <span>{APP_VERSION}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Platform</span>
                                <span>Windows</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


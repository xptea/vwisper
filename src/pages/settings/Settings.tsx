import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
    const [pasteMode, setPasteMode] = React.useState(localStorage.getItem('pasteMode') || 'word');

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

                {/* About Section */}
                <Card className="md:col-span-2">
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
                                <span>1.0.0</span>
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

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function QuickStart() {
    return (
        <div className="flex flex-col gap-4 p-4 md:p-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold">Quick Start</h1>
                <p className="text-muted-foreground">Get up and running with VWisper in minutes</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground mb-2">
                            1
                        </div>
                        <CardTitle>Hold the Key</CardTitle>
                        <CardDescription>
                            Press and hold the <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Right Ctrl</kbd> key to activate voice input
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground mb-2">
                            2
                        </div>
                        <CardTitle>Start Speaking</CardTitle>
                        <CardDescription>
                            Speak naturally and watch your words appear in real-time wherever your cursor is
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground mb-2">
                            3
                        </div>
                        <CardTitle>Release to Stop</CardTitle>
                        <CardDescription>
                            Let go of the key when you're done. Your text is automatically inserted
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pro Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p>• <strong>Shortcuts:</strong> Set up voice shortcuts to paste common phrases instantly</p>
                    <p>• <strong>Works everywhere:</strong> VWisper works in any application that accepts text input</p>
                    <p>• <strong>Background mode:</strong> The voice overlay appears when you hold the key, even when VWisper is minimized</p>
                </CardContent>
            </Card>
        </div>
    )
}

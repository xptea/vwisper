import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Help() {
    return (
        <div className="h-full overflow-auto">
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold">Help</h1>
                    <p className="text-muted-foreground">Common questions and troubleshooting</p>
                </div>

                <div className="grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Frequently Asked Questions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="font-medium">Why isn't VWisper recognizing my voice?</h4>
                            <p className="text-muted-foreground text-sm mt-1">
                                Make sure your microphone is properly connected and that you've granted microphone permissions
                                to the application. Check your system's audio settings to ensure the correct microphone is selected.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-medium">Can I change the activation key?</h4>
                            <p className="text-muted-foreground text-sm mt-1">
                                Currently VWisper uses Right Ctrl as the activation key. Custom hotkey support is coming soon!
                            </p>
                        </div>

                        <div>
                            <h4 className="font-medium">Does VWisper work offline?</h4>
                            <p className="text-muted-foreground text-sm mt-1">
                                VWisper requires an internet connection for speech recognition as it uses the Web Speech API.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-medium">Is my voice data private?</h4>
                            <p className="text-muted-foreground text-sm mt-1">
                                Your voice is processed through the browser's built-in speech recognition. VWisper itself
                                does not store or transmit your voice recordings.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Need More Help?</CardTitle>
                        <CardDescription>
                            If you're experiencing issues not covered here, please reach out
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Visit our GitHub repository for bug reports and feature requests, or join our community for support.
                        </p>
                    </CardContent>
                </Card>
                </div>
            </div>
        </div>
    )
}

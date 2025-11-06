
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [mode, setMode] = React.useState(localStorage.getItem('pasteMode') || 'word');
  const navigate = useNavigate();

  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    localStorage.setItem('pasteMode', newMode);
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>VWisper Settings</CardTitle>
          <CardDescription>
            Configure how VWisper pastes text into applications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={mode} onValueChange={handleModeChange}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="word" id="word" />
              <Label htmlFor="word">Paste Word by Word</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sentence" id="sentence" />
              <Label htmlFor="sentence">Paste After Full Sentence</Label>
            </div>
          </RadioGroup>
          <Button onClick={() => navigate('/shortcuts')} className="w-full">
            Manage Shortcuts
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

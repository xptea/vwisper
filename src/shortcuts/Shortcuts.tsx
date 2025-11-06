import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from 'react-router-dom';

interface ShortcutData {
  original: string;
  text: string;
}

export default function Shortcuts() {
  const [shortcuts, setShortcuts] = React.useState<Record<string, ShortcutData>>({});
  const [newPhrase, setNewPhrase] = React.useState('');
  const [newText, setNewText] = React.useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    loadShortcuts();
  }, []);

  const loadShortcuts = async () => {
    try {
      const data = await invoke<{ shortcuts: Record<string, ShortcutData> }>('load_shortcuts');
      setShortcuts(data.shortcuts);
    } catch (error) {
      console.error('Failed to load shortcuts:', error);
    }
  };

  const addShortcut = async () => {
    if (!newPhrase.trim() || !newText.trim()) return;
    try {
      await invoke('add_shortcut', { phrase: newPhrase.trim(), text: newText.trim() });
      setNewPhrase('');
      setNewText('');
      await loadShortcuts();
    } catch (error) {
      console.error('Failed to add shortcut:', error);
    }
  };

  const removeShortcut = async (phrase: string) => {
    try {
      await invoke('remove_shortcut', { phrase });
      await loadShortcuts();
    } catch (error) {
      console.error('Failed to remove shortcut:', error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Shortcuts</CardTitle>
          <CardDescription>
            Manage voice shortcuts. Say the phrase to paste the associated text.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phrase" className="mb-2">Phrase</Label>
              <Input
                id="phrase"
                value={newPhrase}
                onChange={(e) => setNewPhrase(e.target.value)}
                placeholder="e.g., mango"
              />
            </div>
            <div>
              <Label htmlFor="text" className="mb-2">Text to Paste</Label>
              <Input
                id="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="e.g., Hello World"
              />
            </div>
          </div>
          <Button onClick={addShortcut} className="w-full">
            Add Shortcut
          </Button>

          <div className="space-y-2">
            {Object.entries(shortcuts).map(([normalized, data]) => (
              <div key={normalized} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <strong>{data.original}</strong>: {data.text}
                </div>
                <Button variant="destructive" size="sm" onClick={() => removeShortcut(normalized)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <Button variant="outline" onClick={() => navigate('/')} className="w-full">
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
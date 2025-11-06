import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const [editingPhrase, setEditingPhrase] = React.useState<string | null>(null);
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

  const updateShortcut = async () => {
    if (!newPhrase.trim() || !newText.trim()) return;
    try {
      await invoke('remove_shortcut', { phrase: editingPhrase });
      await invoke('add_shortcut', { phrase: newPhrase.trim(), text: newText.trim() });
      setEditingPhrase(null);
      setNewPhrase('');
      setNewText('');
      await loadShortcuts();
    } catch (error) {
      console.error('Failed to update shortcut:', error);
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
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="phrase" className="mb-2">Phrase</Label>
              <Input
                id="phrase"
                value={newPhrase}
                onChange={(e) => setNewPhrase(e.target.value)}
                placeholder="e.g., mango"
              />
            </div>
            <div className="flex-[2]">
              <Label htmlFor="text" className="mb-2">Text to Paste</Label>
              <Textarea
                id="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="e.g., Hello World"
                rows={4}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={editingPhrase ? updateShortcut : addShortcut} className="flex-1">
              {editingPhrase ? 'Update Shortcut' : 'Add Shortcut'}
            </Button>
            {editingPhrase && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditingPhrase(null);
                  setNewPhrase('');
                  setNewText('');
                }}
              >
                Cancel
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {Object.entries(shortcuts).map(([normalized, data]) => (
              <div key={normalized} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <strong>{data.original}</strong>: {data.text}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingPhrase(normalized);
                      setNewPhrase(data.original);
                      setNewText(data.text);
                    }}
                  >
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => removeShortcut(normalized)}>
                    Remove
                  </Button>
                </div>
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
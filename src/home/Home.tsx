
import React from 'react';

export default function Home() {
  const [mode, setMode] = React.useState(localStorage.getItem('pasteMode') || 'word');

  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    localStorage.setItem('pasteMode', newMode);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>VWisper Settings</h1>
      <div>
        <label>
          <input
            type="radio"
            value="word"
            checked={mode === 'word'}
            onChange={(e) => handleModeChange(e.target.value)}
          />
          Paste Word by Word
        </label>
        <br />
        <label>
          <input
            type="radio"
            value="sentence"
            checked={mode === 'sentence'}
            onChange={(e) => handleModeChange(e.target.value)}
          />
          Paste After Full Sentence
        </label>
      </div>
    </div>
  );
}

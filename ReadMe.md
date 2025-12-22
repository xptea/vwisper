# VWisper Architecture Documentation
> **Platform:** Windows (primary), with cross-platform Tauri support

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Architecture Diagram](#architecture-diagram)
5. [Frontend Architecture](#frontend-architecture)
6. [Backend Architecture (Rust/Tauri)](#backend-architecture-rusttauri)
7. [Core Features & Data Flow](#core-features--data-flow)
8. [IPC Communication](#ipc-communication)
9. [Window Management](#window-management)
10. [Audio System](#audio-system)
11. [Shortcuts System](#shortcuts-system)
12. [Configuration & State Management](#configuration--state-management)
13. [Build & Development](#build--development)
14. [File Reference](#file-reference)

---

## Overview

**VWisper** is a voice-to-text desktop application built with Tauri 2. It enables users to dictate text using their voice, which is then automatically pasted into any active application. The app runs in the system tray and provides a floating voice input overlay that appears when activated.

### Key Features

- **Push-to-Talk Voice Input**: Hold Right Control key to activate voice input
- **Real-time Speech-to-Text**: Uses Web Speech API for continuous speech recognition
- **Automatic Text Pasting**: Transcribed text is automatically pasted into the active application
- **Voice Shortcuts**: Define custom phrases that expand into predefined text
- **Audio Feedback**: Start/stop sounds for voice input indication
- **System Tray Integration**: Runs minimized in system tray
- **Dark/Light Theme Support**: Automatic theme detection with manual override

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.1.0 | UI Framework |
| TypeScript | 5.8.3 | Type-safe JavaScript |
| Vite | 7.0.4 | Build tool & dev server |
| TailwindCSS | 4.1.13 | Utility-first CSS framework |
| React Router DOM | 7.9.1 | Client-side routing |
| Framer Motion | 12.23.19 | Animations |
| Radix UI | Various | Accessible UI primitives |
| next-themes | 0.4.6 | Theme management |
| Lucide React | 0.544.0 | Icon library |

### Backend (Tauri)
| Technology | Version | Purpose |
|------------|---------|---------|
| Tauri | 2.x | Desktop app framework |
| Rust | 2021 Edition | Backend language |
| arboard | 3.6.1 | Cross-platform clipboard |
| device_query | 1.1 | Global keyboard monitoring |
| rodio | 0.19 | Audio playback |
| windows | 0.58 | Windows API bindings |
| lazy_static | 1.5.0 | Lazy static initialization |
| serde/serde_json | 1.x | Serialization |

---

## Project Structure

```
vwisper/
├── src/                          # Frontend source (React/TypeScript)
│   ├── main.tsx                  # React entry point
│   ├── Index.tsx                 # Router configuration
│   ├── styles.css                # Global styles & Tailwind config
│   ├── vite-env.d.ts             # Vite type definitions
│   │
│   ├── components/               # React components
│   │   ├── theme-provider.tsx    # Theme context provider
│   │   ├── voice-input.tsx       # Voice input overlay component
│   │   └── ui/                   # Shadcn/Radix UI components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── radio-group.tsx
│   │       └── textarea.tsx
│   │
│   ├── hooks/                    # Custom React hooks
│   │   └── use-speech-to-text.ts # Web Speech API hook
│   │
│   ├── lib/                      # Utility functions
│   │   └── utils.ts              # cn() class merging utility
│   │
│   ├── home/                     # Home page
│   │   └── Home.tsx              # Settings page component
│   │
│   ├── shortcuts/                # Shortcuts management
│   │   └── Shortcuts.tsx         # Shortcuts page component
│   │
│   └── voice/                    # Voice overlay
│       └── Voice.tsx             # Voice input screen
│
├── src-tauri/                    # Backend source (Rust/Tauri)
│   ├── Cargo.toml                # Rust dependencies
│   ├── Cargo.lock                # Dependency lock file
│   ├── tauri.conf.json           # Tauri configuration
│   ├── build.rs                  # Build script
│   │
│   ├── src/                      # Rust source files
│   │   ├── main.rs               # Application entry point
│   │   ├── lib.rs                # Library root & Tauri setup
│   │   ├── audio.rs              # Audio playback system
│   │   ├── key_monitor.rs        # Global hotkey monitoring
│   │   ├── shortcuts.rs          # Voice shortcuts management
│   │   ├── stt.rs                # Speech-to-text & clipboard
│   │   ├── tray.rs               # System tray setup
│   │   ├── window_setup.rs       # Window creation & positioning
│   │   ├── window_state.rs       # Window state management
│   │   └── sounds/               # Audio assets
│   │       ├── start.wav         # Voice activation sound
│   │       └── ending.wav        # Voice deactivation sound
│   │
│   ├── capabilities/             # Tauri security capabilities
│   │   └── default.json          # Window permissions
│   │
│   └── icons/                    # Application icons
│       ├── 32x32.png
│       ├── 128x128.png
│       ├── 128x128@2x.png
│       ├── icon.icns
│       └── icon.ico
│
├── public/                       # Static assets
├── dist/                         # Built frontend output
├── index.html                    # HTML entry point
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript config
├── tsconfig.node.json            # Node TypeScript config
├── package.json                  # npm dependencies
├── bun.lock                      # Bun lockfile
└── components.json               # Shadcn UI config
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              VWisper Application                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        FRONTEND (WebView)                            │    │
│  │                                                                      │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────┐  │    │
│  │  │   Home.tsx   │  │ Shortcuts.tsx│  │       Voice.tsx           │  │    │
│  │  │  (Settings)  │  │  (Manage)    │  │  (Overlay + Recognition) │  │    │
│  │  └──────────────┘  └──────────────┘  └───────────────────────────┘  │    │
│  │         │                 │                      │                   │    │
│  │         └─────────────────┼──────────────────────┘                   │    │
│  │                           │                                          │    │
│  │  ┌────────────────────────┼────────────────────────────────────────┐│    │
│  │  │               useSpeechToText() Hook                            ││    │
│  │  │     (Web Speech API - SpeechRecognition)                        ││    │
│  │  └─────────────────────────────────────────────────────────────────┘│    │
│  │                           │                                          │    │
│  │                    @tauri-apps/api                                   │    │
│  └───────────────────────────┼──────────────────────────────────────────┘    │
│                              │                                               │
│                         IPC Bridge                                           │
│                              │                                               │
│  ┌───────────────────────────┼──────────────────────────────────────────┐    │
│  │                    BACKEND (Rust/Tauri)                               │    │
│  │                              │                                        │    │
│  │  ┌──────────────────────────┴───────────────────────────────────┐    │    │
│  │  │                      lib.rs (Entry Point)                     │    │    │
│  │  │  - Plugin initialization                                      │    │    │
│  │  │  - State management (TypingState)                             │    │    │
│  │  │  - Command handler registration                               │    │    │
│  │  └──────────────────────────┬───────────────────────────────────┘    │    │
│  │                             │                                         │    │
│  │  ┌──────────────┬───────────┴───────────┬───────────────────────┐    │    │
│  │  │              │                       │                       │    │    │
│  │  ▼              ▼                       ▼                       ▼    │    │
│  │ ┌────────┐  ┌────────────┐  ┌────────────────┐  ┌──────────────┐    │    │
│  │ │tray.rs │  │key_monitor │  │  stt.rs        │  │shortcuts.rs  │    │    │
│  │ │        │  │    .rs     │  │                │  │              │    │    │
│  │ │ System │  │  Global    │  │ Text Typing    │  │ Voice        │    │    │
│  │ │ Tray   │  │  Hotkey    │  │ Clipboard      │  │ Shortcuts    │    │    │
│  │ │ Menu   │  │  Monitor   │  │ Paste (Ctrl+V) │  │ Processing   │    │    │
│  │ └────────┘  └────────────┘  └────────────────┘  └──────────────┘    │    │
│  │                  │                  │                                │    │
│  │                  │                  │                                │    │
│  │  ┌───────────────┴──────────────────┴────────────────────────────┐  │    │
│  │  │                    Shared Modules                              │  │    │
│  │  │  ┌─────────────────┐  ┌──────────────────┐                    │  │    │
│  │  │  │   audio.rs      │  │  window_setup.rs │                    │  │    │
│  │  │  │   (rodio)       │  │  window_state.rs │                    │  │    │
│  │  │  └─────────────────┘  └──────────────────┘                    │  │    │
│  │  └────────────────────────────────────────────────────────────────┘  │    │
│  └───────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘

                              EXTERNAL SYSTEMS
┌─────────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │  Windows    │  │  Clipboard  │  │   Active     │  │  Local Data     │   │
│  │  Keyboard   │  │  (arboard)  │  │   Window     │  │  Directory      │   │
│  │  Input      │  │             │  │   (HWND)     │  │  (shortcuts.json)│   │
│  └─────────────┘  └─────────────┘  └──────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Entry Point Chain

```
index.html
    └── main.tsx (ReactDOM.createRoot)
        └── Index.tsx (BrowserRouter)
            ├── / → Home.tsx (wrapped in ThemeProvider)
            ├── /shortcuts → Shortcuts.tsx (wrapped in ThemeProvider)
            └── /voice → Voice.tsx (no theme wrapper - transparent)
```

### Pages

#### 1. Home Page (`src/home/Home.tsx`)
The main settings page for configuring VWisper.

**Features:**
- Paste mode selection (Word by Word / Sentence - currently only word mode active)
- Navigation to Shortcuts management
- Uses local storage for persistence (`pasteMode`)

**State:**
- `mode`: Current paste mode ('word' or 'sentence')

#### 2. Shortcuts Page (`src/shortcuts/Shortcuts.tsx`)
Manage voice shortcuts - phrases that trigger text expansion.

**Features:**
- Add new shortcuts (phrase → text mapping)
- Edit existing shortcuts
- Remove shortcuts
- Display all shortcuts in a list

**Tauri Commands Used:**
- `load_shortcuts` - Load all shortcuts from disk
- `save_shortcuts` - Persist shortcuts to disk
- `add_shortcut` - Add a new shortcut
- `remove_shortcut` - Delete a shortcut

**State:**
- `shortcuts`: Record of all shortcuts
- `newPhrase` / `newText`: Form input state
- `editingPhrase`: Currently editing shortcut (null if adding new)

#### 3. Voice Page (`src/voice/Voice.tsx`)
The floating overlay that appears during voice input.

**Features:**
- Displays voice input animation
- Shows recording timer
- Handles speech-to-text processing
- Manages text queue for pasting

**Key Logic:**
```typescript
// Text processing queue
const processingRef = useRef(false);
const queueRef = useRef<string[]>([]);
const hasTypedRef = useRef(false);

// Add leading space for subsequent pastes (browsers strip trailing spaces)
const textToSend = hasTypedRef.current ? " " + text : text;
await invoke('process_text', { text: textToSend });
```

**Events Listened:**
- `start-listening`: Triggered when Right Control is pressed
- `stop-listening`: Triggered when Right Control is released

### Custom Hooks

#### `useSpeechToText` (`src/hooks/use-speech-to-text.ts`)

A comprehensive React hook for Web Speech API integration.

**Options:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `lang` | string | "en-US" | Recognition language |
| `continuous` | boolean | true | Keep recognizing after results |
| `interimResults` | boolean | true | Return interim (non-final) results |
| `maxAlternatives` | number | 1 | Number of alternative results |
| `serviceURI` | string | "" | Custom speech service URI |

**Returns:**
| Property | Type | Description |
|----------|------|-------------|
| `isListening` | boolean | Whether recognition is active |
| `transcript` | string | Final recognized text |
| `interimTranscript` | string | Current interim text |
| `error` | string \| null | Error message if any |
| `start` | () => void | Start recognition |
| `stop` | () => void | Stop recognition |
| `clear` | () => void | Clear transcripts |
| `isSupported` | boolean | Browser support check |

**Word Processing Logic:**
```typescript
// Interim: Commit words that are "complete" (followed by more words)
if (words.length > committedWordCountRef.current + 1) {
    const wordsToCommit = words.slice(committedWordCountRef.current, words.length - 1);
    setTranscript((prev) => {
        const newSegment = wordsToCommit.join(" ");
        return prev ? `${prev} ${newSegment}` : newSegment;
    });
    committedWordCountRef.current += wordsToCommit.length;
}

// Final: Commit all remaining words
if (result.isFinal) {
    const newWords = words.slice(committedWordCountRef.current);
    // ... commit newWords
}
```

### Components

#### `VoiceInput` (`src/components/voice-input.tsx`)

Animated voice input indicator with microphone icon and audio waveform visualization.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `listening` | boolean | External control of listening state |
| `onStart` | () => void | Callback when listening starts |
| `onStop` | () => void | Callback when listening stops |
| `className` | string | Additional CSS classes |

**Animations:**
- Rotating square when listening (replaces microphone icon)
- Animated frequency bars (12 bars with random heights)
- Smooth expand/collapse transitions
- Recording timer display

#### UI Components (`src/components/ui/`)

Standard shadcn/ui components using Radix UI primitives:

| Component | Purpose |
|-----------|---------|
| `Button` | Action buttons with variants (default, destructive, outline, etc.) |
| `Card` | Content container with header, content, footer sections |
| `Input` | Text input field |
| `Label` | Form labels |
| `RadioGroup` | Radio button selection |
| `Textarea` | Multi-line text input |

### Styling

**CSS Variables (`src/styles.css`):**
- Uses OKLCH color space for precise color control
- Full light/dark theme support
- CSS custom properties for all colors, spacing, and radii
- Tailwind CSS 4.x with custom theme integration

**Key Design Tokens:**
```css
:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  /* ... */
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* ... */
}
```

---

## Backend Architecture (Rust/Tauri)

### Module Structure

```rust
// lib.rs - Main library entry point
mod window_setup;    // Window creation
mod key_monitor;     // Global hotkey handling
mod stt;             // Speech-to-text & clipboard
mod window_state;    // Active window tracking
mod audio;           // Sound playback
mod tray;            // System tray
mod shortcuts;       // Voice shortcuts
```

### Entry Point (`lib.rs`)

```rust
pub struct TypingState(pub Arc<Mutex<bool>>);

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(TypingState(Arc::new(Mutex::new(false))))
        .setup(|app| {
            stt::init_stt_thread();          // Initialize STT processing thread
            window_setup::setup_windows(app)?; // Create windows
            tray::setup_system_tray(app)?;    // Setup system tray
            key_monitor::start_global_key_monitor(app.handle().clone()); // Start hotkey monitor
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            key_monitor::get_listening_state,
            stt::type_text,
            stt::restore_window_focus,
            window_state::get_active_window,
            audio::play_start_sound_command,
            audio::play_end_sound_command,
            shortcuts::load_shortcuts,
            shortcuts::save_shortcuts,
            shortcuts::add_shortcut,
            shortcuts::remove_shortcut,
            shortcuts::process_text
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Key Monitor (`key_monitor.rs`)

Monitors global keyboard input for the Right Control key to toggle voice input.

**Algorithm:**
```
1. Poll keyboard state every 15ms
2. On RControl press:
   - Capture active window handle (HWND)
   - Show voice overlay window
   - Restore focus to original window
   - Emit 'start-listening' event
   - Play start sound
   - Set listening state = true
3. On RControl release:
   - Wait 100ms for processing
   - Restore focus to original window
   - Emit 'stop-listening' event
   - Play end sound
   - Set listening state = false
   - Wait 525ms, then hide voice overlay
```

**State Management:**
- `listening_state: Arc<Mutex<bool>>` - Current listening status
- `active_window: Arc<Mutex<Option<isize>>>` - HWND of window to paste into

### Speech-to-Text & Clipboard (`stt.rs`)

Handles text typing via clipboard and keyboard simulation.

**Architecture:**
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Frontend       │────▶│  TEXT_SENDER    │────▶│  STT Thread     │
│  invoke()       │     │  (mpsc channel) │     │  (background)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                                ┌───────────────┐
                                                │ 1. Set focus  │
                                                │ 2. Clipboard  │
                                                │ 3. Ctrl+V     │
                                                └───────────────┘
```

**Key Functions:**

`init_stt_thread()` - Spawns background thread for text processing:
```rust
thread::spawn(move || {
    let mut clipboard = Clipboard::new().ok();
    
    for (text, hwnd) in rx {
        // 1. Focus target window
        if let Some(h) = hwnd {
            SetForegroundWindow(HWND(h));
            thread::sleep(Duration::from_millis(20));
        }

        // 2. Set clipboard with retry logic (3 attempts)
        for _ in 0..3 {
            if cb.set_text(text.clone()).is_ok() {
                if cb.get_text() == Ok(text.clone()) {
                    success = true;
                    break;
                }
            }
            thread::sleep(Duration::from_millis(10));
        }

        // 3. Send Ctrl+V
        if success {
            send_paste_combo();
            thread::sleep(Duration::from_millis(100));
        }
    }
});
```

`send_paste_combo()` - Simulates Ctrl+V keypress:
```rust
unsafe fn send_paste_combo() {
    let inputs = vec![
        // Ctrl down
        INPUT { type: INPUT_KEYBOARD, ki: KEYBDINPUT { wVk: VK_CONTROL, ... } },
        // V down
        INPUT { type: INPUT_KEYBOARD, ki: KEYBDINPUT { wVk: VK_V, ... } },
        // V up
        INPUT { type: INPUT_KEYBOARD, ki: KEYBDINPUT { wVk: VK_V, dwFlags: KEYEVENTF_KEYUP, ... } },
        // Ctrl up
        INPUT { type: INPUT_KEYBOARD, ki: KEYBDINPUT { wVk: VK_CONTROL, dwFlags: KEYEVENTF_KEYUP, ... } },
    ];
    SendInput(&inputs, mem::size_of::<INPUT>() as i32);
}
```

### Shortcuts System (`shortcuts.rs`)

Manages voice-triggered text shortcuts.

**Data Structures:**
```rust
#[derive(Serialize, Deserialize, Clone)]
pub struct Shortcuts {
    pub shortcuts: HashMap<String, ShortcutData>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ShortcutData {
    pub original: String,  // Original phrase (for display)
    pub text: String,      // Text to paste
}
```

**Normalization:**
Phrases are normalized for fuzzy matching:
```rust
fn normalize(s: &str) -> String {
    s.chars()
        .filter(|c| c.is_alphanumeric() || c.is_whitespace())
        .collect::<String>()
        .to_lowercase()
        .trim()
        .to_string()
}
```

**Storage Location:**
```
%LOCALAPPDATA%/vwisper/shortcuts.json
```

**Migration Support:**
Handles migration from old format (HashMap<String, String>) to new format with original phrase preservation.

### Audio System (`audio.rs`)

Plays audio feedback sounds using rodio.

**Functions:**
- `play_start_sound()` - Plays `start.wav` when voice input begins
- `play_end_sound()` - Plays `ending.wav` when voice input ends

**Path Resolution:**
```rust
// Development path
let dev_path = exe_dir.join("../../../src-tauri/src/sounds/").join(filename);
// Production path  
let prod_path = exe_dir.join("sounds/").join(filename);
// Fallback
let fallback = PathBuf::from("src-tauri/src/sounds/").join(filename);
```

### System Tray (`tray.rs`)

Creates and manages the system tray icon and menu.

**Menu Items:**
1. **Open Home** - Shows/creates the home settings window
2. **Quit** - Exits the application

### Window Setup (`window_setup.rs`)

Creates the application windows during initialization.

**Windows Created:**

1. **Home Window** (`"home"`)
   - URL: `/` (root route)
   - Size: 1200x800
   - Initially hidden (launched from tray)

2. **Voice Window** (`"voice"`)
   - URL: `/voice`
   - Size: 150x43
   - Position: Center-bottom of primary monitor (150px from bottom)
   - Decorations: None (borderless)
   - Shadow: None
   - Transparent: Yes
   - Always on top: Yes
   - Skip taskbar: Yes
   - Initially hidden (shown during voice input)

**Positioning Logic:**
```rust
let primary_monitor = monitors.iter().max_by_key(|m| {
    let size = m.size();
    size.width * size.height  // Find largest monitor
});

let x = (actual_width - window_width) / 2.0;   // Centered horizontally
let y = actual_height - window_height - 150.0; // 150px from bottom
```

---

## Core Features & Data Flow

### Voice Input Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 1. USER HOLDS RIGHT CONTROL                                              │
└────────────────────────────────────────────────────────────────────────┬─┘
                                                                         │
┌────────────────────────────────────────────────────────────────────────▼─┐
│ 2. key_monitor.rs DETECTS KEYPRESS                                       │
│    - Captures active window HWND                                         │
│    - Shows voice overlay                                                 │
│    - Emits 'start-listening' event                                       │
│    - Plays start sound                                                   │
└────────────────────────────────────────────────────────────────────────┬─┘
                                                                         │
┌────────────────────────────────────────────────────────────────────────▼─┐
│ 3. Voice.tsx RECEIVES EVENT                                              │
│    - Resets hasTypedRef                                                  │
│    - Calls useSpeechToText start()                                       │
└────────────────────────────────────────────────────────────────────────┬─┘
                                                                         │
┌────────────────────────────────────────────────────────────────────────▼─┐
│ 4. WEB SPEECH API RECOGNIZES SPEECH                                      │
│    - Produces interim results (partial words)                            │
│    - Produces final results (complete sentences)                         │
└────────────────────────────────────────────────────────────────────────┬─┘
                                                                         │
┌────────────────────────────────────────────────────────────────────────▼─┐
│ 5. useSpeechToText PROCESSES RESULTS                                     │
│    - Commits "stable" words (all but last in interim)                    │
│    - Sets transcript state with new words                                │
└────────────────────────────────────────────────────────────────────────┬─┘
                                                                         │
┌────────────────────────────────────────────────────────────────────────▼─┐
│ 6. Voice.tsx useEffect HANDLES TRANSCRIPT                                │
│    - Cleans newlines, trims whitespace                                   │
│    - Adds to processing queue                                            │
│    - Prepends space if not first word                                    │
│    - Invokes 'process_text' command                                      │
└────────────────────────────────────────────────────────────────────────┬─┘
                                                                         │
┌────────────────────────────────────────────────────────────────────────▼─┐
│ 7. shortcuts.rs process_text()                                           │
│    - Normalizes text                                                     │
│    - Checks for matching shortcut                                        │
│    - Passes text (or shortcut expansion) to stt::type_text_internal()    │
└────────────────────────────────────────────────────────────────────────┬─┘
                                                                         │
┌────────────────────────────────────────────────────────────────────────▼─┐
│ 8. stt.rs TYPE THREAD                                                    │
│    - Sets focus to original window                                       │
│    - Copies text to clipboard                                            │
│    - Simulates Ctrl+V                                                    │
│    - Waits 100ms before next paste                                       │
└────────────────────────────────────────────────────────────────────────┬─┘
                                                                         │
┌────────────────────────────────────────────────────────────────────────▼─┐
│ 9. USER RELEASES RIGHT CONTROL                                           │
│    - Emits 'stop-listening' event                                        │
│    - Plays end sound                                                     │
│    - Hides voice overlay after 525ms                                     │
└──────────────────────────────────────────────────────────────────────────┘
```

### Shortcut Expansion Flow

```
User says "mango" → 
  Normalized to "mango" →
    Check shortcuts.json →
      Found: { "mango": { "original": "mango", "text": "Hello World" } } →
        Paste "Hello World"
```

---

## IPC Communication

### Tauri Commands

| Command | Module | Parameters | Returns | Description |
|---------|--------|------------|---------|-------------|
| `get_listening_state` | key_monitor | - | `bool` | Check if voice input is active |
| `type_text` | stt | `text: String` | `Result<(), String>` | Type text via clipboard |
| `restore_window_focus` | stt | `hwnd: isize` | `Result<(), String>` | Focus specific window |
| `get_active_window` | window_state | - | `Option<isize>` | Get captured window handle |
| `play_start_sound_command` | audio | - | `Result<(), String>` | Play activation sound |
| `play_end_sound_command` | audio | - | `Result<(), String>` | Play deactivation sound |
| `load_shortcuts` | shortcuts | - | `Result<Shortcuts, String>` | Load all shortcuts |
| `save_shortcuts` | shortcuts | `shortcuts: Shortcuts` | `Result<(), String>` | Save all shortcuts |
| `add_shortcut` | shortcuts | `phrase: String, text: String` | `Result<(), String>` | Add new shortcut |
| `remove_shortcut` | shortcuts | `phrase: String` | `Result<(), String>` | Remove shortcut |
| `process_text` | shortcuts | `text: String` | `Result<(), String>` | Process & paste text |

### Tauri Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `start-listening` | Backend → Frontend | `""` | Voice input started |
| `stop-listening` | Backend → Frontend | `""` | Voice input stopped |
| `hold-time` | Backend → Frontend | `u64` (ms) | Duration key was held |

---

## Window Management

### Window Definitions

| Window ID | Route | Purpose | Visibility |
|-----------|-------|---------|------------|
| `home` | `/` | Settings & shortcuts navigation | Hidden by default, opened from tray |
| `voice` | `/voice` | Voice input overlay | Hidden by default, shown during input |

### Capabilities (`capabilities/default.json`)

```json
{
  "identifier": "default",
  "description": "Capability for the main window",
  "windows": ["main", "voice", "home"],
  "permissions": [
    "core:default",
    "opener:default"
  ]
}
```

---

## Audio System

### Sound Files

| File | Size | Trigger | Purpose |
|------|------|---------|---------|
| `start.wav` | 179KB | RControl pressed | Indicates voice input started |
| `ending.wav` | 70KB | RControl released | Indicates voice input ended |

### Playback

Audio is played in dedicated threads to prevent blocking:

```rust
pub fn play_start_sound() {
    thread::spawn(|| {
        if let Err(e) = play_sound("sounds/start.wav") {
            eprintln!("Failed to play start sound: {}", e);
        }
    });
}
```

---

## Shortcuts System

### File Format

Location: `%LOCALAPPDATA%/vwisper/shortcuts.json`

```json
{
  "shortcuts": {
    "normalized phrase": {
      "original": "Original Phrase",
      "text": "Text to paste when phrase is spoken"
    }
  }
}
```

### Example

```json
{
  "shortcuts": {
    "my email": {
      "original": "my email",
      "text": "user@example.com"
    },
    "signature": {
      "original": "Signature",
      "text": "Best regards,\nJohn Doe\nSoftware Engineer"
    }
  }
}
```

---

## Configuration & State Management

### Frontend Persistence

| Key | Storage | Default | Description |
|-----|---------|---------|-------------|
| `pasteMode` | localStorage | `"word"` | Paste mode (word/sentence) |
| Theme | next-themes | system | Light/dark theme preference |

### Backend State

| State | Type | Scope | Description |
|-------|------|-------|-------------|
| `TypingState` | `Arc<Mutex<bool>>` | Managed | Whether app is currently typing |
| `listening_state` | `Arc<Mutex<bool>>` | Managed | Whether voice input is active |
| `active_window` | `Arc<Mutex<Option<isize>>>` | Managed | HWND of target window |

### Tauri Configuration (`tauri.conf.json`)

```json
{
  "productName": "vwisper",
  "version": "0.1.4",
  "identifier": "com.webst.vwisper",
  "build": {
    "beforeDevCommand": "bun run dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "bun run build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [],  // Windows created programmatically
    "security": {
      "csp": null   // No Content Security Policy restrictions
    }
  },
  "bundle": {
    "active": true,
    "targets": "all"
  }
}
```

---

## Build & Development

### Prerequisites

- Node.js / Bun
- Rust (2021 edition)
- Windows SDK (for Windows builds)

### Development Commands

```bash
# Install dependencies
bun install

# Run development server
bun run tauri dev

# Build for production
bun run tauri build
```

### Vite Configuration

```typescript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 1420,        // Fixed port for Tauri
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],  // Don't watch Rust files
    },
  },
});
```

---

## File Reference

### Frontend Files

| File | Purpose |
|------|---------|
| `src/main.tsx` | React entry point, mounts Router |
| `src/Index.tsx` | Route definitions with ThemeProvider |
| `src/styles.css` | Global CSS, Tailwind config, color tokens |
| `src/home/Home.tsx` | Settings page component |
| `src/shortcuts/Shortcuts.tsx` | Shortcuts management page |
| `src/voice/Voice.tsx` | Voice input overlay with speech processing |
| `src/hooks/use-speech-to-text.ts` | Web Speech API integration hook |
| `src/components/voice-input.tsx` | Animated voice indicator |
| `src/components/theme-provider.tsx` | next-themes wrapper |
| `src/components/ui/*.tsx` | Shadcn UI components |
| `src/lib/utils.ts` | Utility functions (cn) |

### Backend Files

| File | Purpose |
|------|---------|
| `src-tauri/src/main.rs` | Application entry point |
| `src-tauri/src/lib.rs` | Tauri setup, module declarations |
| `src-tauri/src/key_monitor.rs` | Global hotkey monitoring |
| `src-tauri/src/stt.rs` | Clipboard & paste operations |
| `src-tauri/src/shortcuts.rs` | Shortcut management & processing |
| `src-tauri/src/audio.rs` | Sound playback |
| `src-tauri/src/tray.rs` | System tray setup |
| `src-tauri/src/window_setup.rs` | Window creation |
| `src-tauri/src/window_state.rs` | Active window tracking |

### Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | npm/bun dependencies |
| `tsconfig.json` | TypeScript configuration |
| `vite.config.ts` | Vite build configuration |
| `components.json` | Shadcn UI configuration |
| `src-tauri/Cargo.toml` | Rust dependencies |
| `src-tauri/tauri.conf.json` | Tauri configuration |
| `src-tauri/capabilities/default.json` | Window permissions |

---

## Known Considerations

### Browser Compatibility

Some browsers may strip trailing whitespace when pasting. The current implementation uses **leading spaces** for subsequent paste operations to work around this:

```typescript
const textToSend = hasTypedRef.current ? " " + text : text;
```

### Platform Support

- **Windows**: Full support (primary platform)
- **macOS/Linux**: Core Tauri features work, but Windows-specific APIs (keyboard simulation, HWND) are conditionally compiled

### Timing Considerations

- **Post-paste delay**: 100ms between paste operations
- **Focus delay**: 20ms after setting foreground window
- **Overlay hide delay**: 525ms after voice input ends
- **Keyboard polling**: 15ms interval

---

*This document provides a complete reference for the VWisper application architecture. For questions or contributions, please refer to the source code.*

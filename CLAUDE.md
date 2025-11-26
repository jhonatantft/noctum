# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Noctum is a privacy-focused desktop Electron application for AI-powered meeting transcription and analysis. It uses local Deepgram API for real-time transcription and cloud-based LLMs (OpenAI/Anthropic) for generating insights from transcripts.

## Development Commands

```bash
# Install dependencies
yarn install

# Start development server with hot-reload
yarn dev

# Lint code
yarn lint

# Build for production (generates distributable in /release directory)
yarn build
```

## Architecture

### Electron Multi-Process Architecture

This is an **Electron** application with a strict separation between Main and Renderer processes:

- **Main Process** (`electron/main.ts`): Handles window management, native OS integrations (system tray, global shortcuts), IPC handlers, and database operations
- **Renderer Process** (`src/`): React app built with Vite, runs in the browser context with limited Node.js access
- **Preload Script** (`electron/preload.ts`): Secure bridge exposing IPC methods to renderer via `contextBridge`

### IPC Communication Pattern

The renderer communicates with the main process via IPC handlers defined in `electron/main.ts`:

```typescript
// Main process handlers
ipcMain.handle('get-meetings', () => getMeetings());
ipcMain.handle('create-meeting', (_, title) => createMeeting(title));
ipcMain.handle('add-transcript', (_, { meetingId, speaker, text, timestamp }) => ...);
ipcMain.handle('get-meeting-details', (_, id) => getMeetingDetails(id));
ipcMain.handle('toggle-overlay', (_, isOverlay) => ...);

// Renderer usage
window.ipcRenderer.invoke('get-meetings');
```

The main process can also send events to renderer:
```typescript
// Main → Renderer
win.webContents.send('trigger-record');

// Renderer listening
window.ipcRenderer.on('trigger-record', callback);
```

### Data Persistence

- **SQLite Database** (`electron/db.ts`): Stores meetings and transcripts using `better-sqlite3`. Database file is stored in Electron's `userData` directory
- **electron-store**: Used for user preferences (API keys, audio settings, theme)
- **Schema**:
  - `meetings` table: id, title, date, duration, summary
  - `transcripts` table: id, meeting_id, speaker, text, timestamp

### Real-Time Transcription Flow

Transcription uses the **Deepgram Live API** (via `@deepgram/sdk`):

1. **Audio Capture** (`hooks/useAudioRecorder.ts`): Uses Web Audio API to capture microphone input and generate waveform visualization
2. **Deepgram Streaming** (`hooks/useTranscription.ts`):
   - Creates WebSocket connection to Deepgram
   - Streams audio chunks via `MediaRecorder` (250ms intervals)
   - Receives real-time transcription events with partial and final results
   - Only final transcripts (`is_final: true`) are displayed to user
3. **AI Analysis** (`lib/ai.ts`): Transcripts are analyzed via OpenAI or Anthropic APIs to extract action items and data points

### Frontend Architecture

- **Router**: Uses `react-router-dom` with `HashRouter` (required for Electron file:// protocol)
- **Pages**:
  - `Dashboard.tsx`: Home screen with quick start
  - `ActiveMeeting.tsx`: Main recording interface with live transcription and AI insights
  - `History.tsx`: Past meetings browser with search and export
  - `Settings.tsx`: API keys, microphone selection, theme
- **Key Hooks**:
  - `useAudioRecorder`: Manages MediaRecorder and Web Audio API for waveform visualization
  - `useTranscription`: Handles Deepgram WebSocket connection and streaming
  - `useMeetingPersistence`: Saves transcripts to SQLite via IPC

### Native Desktop Features

- **System Tray** (`electron/main.ts:79-94`): Provides quick access menu with Show App, Start Recording, and Quit
- **Global Shortcut**: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows) triggers recording from anywhere
- **Overlay Mode**: "Always on Top" mini window (400x500px) positioned at top-right of screen
- **Native Notifications**: Triggered on recording start/stop (implementation expected in renderer)

### Environment Variables

Required environment variables (in `.env` file):

```bash
VITE_DEEPGRAM_API_KEY=your-deepgram-api-key
VITE_OPENAI_API_KEY=your-openai-api-key  # Optional
VITE_ANTHROPIC_API_KEY=your-anthropic-api-key  # Optional
```

API keys can also be set at runtime via Settings page (stored in `localStorage` and electron-store).

## Security & Privacy

- **Content Security Policy**: Custom CSP allows Web Workers, blob URLs, and external API connections (electron/main.ts:42-51)
- **Context Isolation**: Enabled (`contextIsolation: true`) for security
- **Microphone Permissions**: Automatically granted via permission handlers (electron/main.ts:59-76)
- **Privacy-First**: Audio is sent only to Deepgram API; transcripts to AI providers only if user provides API keys

## Build System

- **Vite**: Frontend build tool with React plugin
- **vite-plugin-electron**: Bundles Electron main/preload scripts
- **electron-builder**: Creates platform-specific distributables (DMG, EXE, etc.)
- **TypeScript**: All code is TypeScript with strict type checking
- **Tailwind CSS + shadcn/ui**: Styling with utility classes and pre-built components

### Important Build Notes

- Main process is bundled to CommonJS format (`format: 'cjs'`) as `dist-electron/main.cjs`
- `better-sqlite3` and `electron` are marked as external in Rollup config
- Path aliases configured: `@` resolves to `./src`, and `fs`/`path`/`url` are stubbed for renderer process

## Common Development Tasks

### Adding New IPC Handlers

1. Define handler in `electron/main.ts`:
   ```typescript
   ipcMain.handle('my-channel', async (_, args) => { ... });
   ```

2. Call from renderer:
   ```typescript
   const result = await window.ipcRenderer.invoke('my-channel', args);
   ```

### Adding Database Tables/Queries

All database logic is in `electron/db.ts`. Use `better-sqlite3` synchronous API (no promises/async needed for queries).

### Updating Transcription Model

Deepgram model configuration is in `hooks/useTranscription.ts:76-81`. Current settings:
- Model: `nova-2`
- Language: `en-US`
- Smart formatting: enabled
- Diarization: enabled (speaker detection)

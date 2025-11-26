# Noctum - AI Meeting Assistant

> **Your intelligent, privacy-focused meeting companion**

Noctum is a desktop application that provides real-time transcription and AI-powered insights during meetings. Think of it as having an expert advisor whispering smart suggestions in your ear while you talk.

<p align="center">
  <img src="https://img.shields.io/badge/Electron-30.0-47848F?logo=electron" alt="Electron">
  <img src="https://img.shields.io/badge/React-18.2-61DAFB?logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.2-3178C6?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
</p>

---

## 🎯 What Does Noctum Do?

Noctum turns your meetings into superpowers by:

1. **Transcribing everything in real-time** using Deepgram's API
2. **Generating smart AI insights** based on your meeting context (sales, pitch, interview, etc.)
3. **Storing everything locally** in a SQLite database for privacy
4. **Working as a desktop app** with system tray, global shortcuts, and overlay mode

### Real-World Example

You're in a sales call. The customer says *"I'm not sure if this fits our budget..."*

**Noctum instantly shows:**
- 🚨 **Objection Detected:** Price concerns
- 💬 **Suggested Reply:** "I understand. What if we break this into quarterly payments aligned with your ROI milestones?"
- ❓ **Smart Question:** "What budget range were you considering, and what metrics would justify the investment?"

---

## ✨ Key Features

### 🎙️ Real-Time Transcription
- **Powered by Deepgram:** Industry-leading speech-to-text API
- **Instant results:** See transcripts appear as you speak
- **Speaker detection:** Automatically identifies different speakers

### 🧠 AI Copilot Modes
Choose the right AI advisor for your meeting:

| Mode | Best For | Insight Types |
|------|----------|---------------|
| **General Advisor** | Strategy meetings, brainstorming | Strategic implications, smart questions |
| **Sales Coach** | Customer calls, demos | Objection handling, closing tactics, rebuttals |
| **Investor Pitch** | Fundraising, VC meetings | Vision feedback, investor Q&A prep |
| **Interview Prep** | Job interviews | STAR method answers, leadership cues |

### 🔒 Privacy-First Design
- **Local database:** All meetings stored in SQLite on your machine
- **No audio uploads:** Only text transcripts sent to AI (and only if you provide an API key)
- **Your data, your control:** Export anytime, delete anytime

### 🖥️ Desktop Native Features
- **System Tray Integration:** Quick controls from your menu bar
- **Global Shortcut:** `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Windows) to start/stop recording
- **Overlay Mode:** Always-on-top mini window during calls
- **Native Notifications:** Get alerts when recording starts/stops

### 💾 Meeting Management
- **Searchable history:** Find past meetings by title or content
- **Export options:** Download as Markdown, JSON, or plain text
- **Detailed transcripts:** View full conversation with timestamps

---

## 🏗️ How It Works

Noctum uses a modern Electron + React architecture:

```
┌─────────────────────────────────────────────────────────┐
│                    MAIN PROCESS                          │
│  (Node.js - electron/main.ts)                           │
│                                                          │
│  • Window Management                                     │
│  • System Tray & Global Shortcuts                       │
│  • SQLite Database (meetings.db)                        │
│  • IPC Handlers                                          │
└─────────────────┬───────────────────────────────────────┘
                  │ IPC Bridge
┌─────────────────▼───────────────────────────────────────┐
│                 RENDERER PROCESS                         │
│  (React App - src/)                                     │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐│
│  │ Dashboard   │  │ ActiveMeeting│  │ History        ││
│  │             │  │              │  │                ││
│  │ Start       │→ │ 🎙️ Record   │→ │ 📚 View Past  ││
│  │ Meeting     │  │ 📝 Transcribe│  │ 💾 Export     ││
│  └─────────────┘  │ 🤖 AI Insights│  └────────────────┘│
│                   └──────────────┘                      │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         HOOKS (State Management)                 │  │
│  │  • useTranscription → Deepgram WebSocket         │  │
│  │  • useAudioRecorder → Web Audio API              │  │
│  │  • useMeetingPersistence → SQLite via IPC        │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                  │
                  ▼
         ┌──────────────────┐
         │  EXTERNAL APIS   │
         │                  │
         │  • Deepgram      │ (Transcription)
         │  • OpenAI        │ (AI Insights)
         │  • Anthropic     │ (Alternative AI)
         │  • Google Gemini │ (Alternative AI)
         └──────────────────┘
```

### Data Flow: Recording a Meeting

1. **User clicks "Start Recording"** in `ActiveMeeting.tsx`
2. **`useAudioRecorder`** captures microphone via Web Audio API
3. **`useTranscription`** opens WebSocket to Deepgram, streams audio chunks
4. **Deepgram sends back transcripts** (partial → final)
5. **Transcripts appear in UI** in real-time
6. **Every 5 seconds**, `AIService.analyzeTranscript()` sends text to OpenAI/Anthropic/Gemini
7. **AI returns insights** (questions, strategies, objections, etc.)
8. **Insights displayed** in the sidebar
9. **On stop**, `useMeetingPersistence` saves to SQLite via IPC

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **Yarn** package manager
- **Deepgram API Key** (required) → [Get it here](https://console.deepgram.com/)
- **AI API Key** (optional) → [OpenAI](https://platform.openai.com/api-keys), [Anthropic](https://console.anthropic.com/), or [Google AI](https://aistudio.google.com/app/apikey)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/noctum.git
   cd noctum
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your API keys:
   ```bash
   # Required
   VITE_DEEPGRAM_API_KEY=your-deepgram-api-key

   # Optional (pick one for AI insights)
   VITE_OPENAI_API_KEY=your-openai-key
   # OR
   VITE_ANTHROPIC_API_KEY=your-anthropic-key
   # OR
   VITE_GEMINI_API_KEY=your-gemini-key
   ```

4. **Run in development mode**
   ```bash
   yarn dev
   ```

   The Electron app will launch with hot-reloading enabled.

---

## 📖 User Guide

### Starting Your First Meeting

1. **Launch Noctum** and go to **Active Meeting**
2. **Allow microphone access** when prompted
3. **Choose an AI mode** (General, Sales, Pitch, or Interview)
4. **Click the Record button** or press `Cmd+Shift+R`
5. **Start talking!** Transcripts and insights appear in real-time
6. **Stop recording** when done, give your meeting a title, and save

### Configuring AI Settings

1. Go to **Settings** → **AI Configuration**
2. Select your preferred provider (OpenAI, Anthropic, or Gemini)
3. Enter your API key
4. Click **Save Configuration**

> **Note:** AI insights won't work without an API key. You can still get transcripts without one!

### Viewing Past Meetings

1. Go to **History**
2. Use the search bar to find meetings
3. Click on a meeting to view full transcript
4. Export as Markdown, JSON, or text using the buttons

### Using Overlay Mode

Perfect for Zoom/Teams calls:

1. Start a meeting in **Active Meeting**
2. Click the **Overlay** button
3. Noctum shrinks to a small window in the top-right corner
4. View transcripts without covering your video call

---

## 🛠️ Development

### Project Structure

```
noctum/
├── electron/              # Electron main process
│   ├── main.ts           # Entry point, window management, IPC
│   ├── preload.ts        # Secure IPC bridge
│   └── db.ts             # SQLite database operations
├── src/                  # React renderer process
│   ├── pages/            # Main views
│   │   ├── Dashboard.tsx
│   │   ├── ActiveMeeting.tsx
│   │   ├── History.tsx
│   │   └── Settings.tsx
│   ├── hooks/            # Custom React hooks
│   │   ├── useTranscription.ts    # Deepgram integration
│   │   ├── useAudioRecorder.ts    # Web Audio API
│   │   └── useMeetingPersistence.ts # SQLite via IPC
│   ├── lib/
│   │   └── ai.ts         # AI service (OpenAI/Anthropic/Gemini)
│   ├── components/       # Reusable UI components
│   └── App.tsx           # Router setup
├── .env                  # Your API keys (not in git)
├── .env.example          # Template for .env
└── package.json
```

### Available Scripts

```bash
# Development
yarn dev          # Run with hot-reload

# Linting
yarn lint         # Check code quality

# Production Build
yarn build        # Build and package app (creates DMG/EXE in /release)
```

### Key Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Desktop** | Electron 30 | Native app wrapper |
| **UI** | React 18 + TypeScript | Component-based UI |
| **Styling** | Tailwind CSS + shadcn/ui | Modern, responsive design |
| **Build** | Vite | Fast bundler with HMR |
| **Transcription** | Deepgram SDK | Real-time speech-to-text |
| **AI** | OpenAI / Anthropic / Gemini | Smart insights generation |
| **Database** | better-sqlite3 | Local meeting storage |
| **State** | React Hooks + electron-store | Preferences & session state |

### Adding New AI Modes

Edit `src/lib/ai.ts`:

```typescript
const PROMPTS: Record<MeetingMode, string> = {
  // ... existing modes
  doctor: `
    You are a Medical AI Assistant. Help the doctor make informed decisions.

    Analyze the transcript for:
    1. "strategy": Differential diagnosis suggestions
    2. "question": Follow-up questions for patient history
  `
};
```

Then update the `MeetingMode` type and add UI in `ActiveMeeting.tsx`.

---

## 🔐 Privacy & Security

### What Data Stays Local?

- ✅ **Audio recordings:** Never sent anywhere (captured but not saved)
- ✅ **SQLite database:** Stored at `~/Library/Application Support/Noctum/meetings.db` (macOS)
- ✅ **API keys:** Stored in localStorage (renderer) or electron-store (main)

### What Gets Sent to Cloud?

- 📤 **Audio stream:** Sent to Deepgram for transcription (required)
- 📤 **Text transcripts:** Sent to OpenAI/Anthropic/Gemini for insights (only if you provide a key)

### How to Export Your Data

```bash
# Meetings are stored in:
# macOS:   ~/Library/Application Support/Noctum/
# Windows: %APPDATA%\Noctum\
# Linux:   ~/.config/Noctum/

# You can export from the UI or directly access meetings.db with sqlite3
```

---

## 🐛 Troubleshooting

### Transcription Not Working?

1. **Check Deepgram API key** in `.env`
2. **Allow microphone permissions** in Settings → Audio
3. **Check DevTools Console** (Cmd+Option+I) for errors
4. **Verify internet connection** (Deepgram requires connectivity)

### AI Insights Not Showing?

1. Go to **Settings → AI Configuration**
2. Ensure you've entered an API key
3. Verify the correct provider is selected
4. Check if you have API credits remaining

### Database Errors?

```bash
# Reset database (deletes all meetings!)
rm ~/Library/Application\ Support/Noctum/meetings.db
```

---

## 🗺️ Roadmap

- [ ] **Speaker diarization improvements** (auto-detect who's talking)
- [ ] **Meeting summaries** (auto-generate TL;DR after call)
- [ ] **Calendar integration** (auto-start recording for scheduled meetings)
- [ ] **Custom AI prompts** (user-defined coaching modes)
- [ ] **Cloud sync** (optional backup to Dropbox/Google Drive)
- [ ] **Meeting analytics** (insights over time)

---

## 📄 License

MIT © [Your Name]

Built with ❤️ using Electron, React, and TypeScript.

---

## 🙏 Credits

- **Deepgram** - Real-time transcription API
- **shadcn/ui** - Beautiful UI components
- **Lucide Icons** - Icon library
- **Electron Community** - For the amazing framework

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

**Questions?** Open an issue or reach out!

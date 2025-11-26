# Noctum - AI Meeting Assistant

Noctum is a powerful, privacy-focused desktop application designed to be your intelligent meeting companion. Built with Electron, React, and TypeScript, it leverages local AI models for real-time transcription and cloud-based LLMs for intelligent insights.

![Noctum Screenshot](https://via.placeholder.com/800x450?text=Noctum+AI+Assistant)

## 🚀 Key Features

### 🎙️ Advanced Audio & Transcription
*   **Local-First Transcription**: Uses an embedded **Whisper** model (via `@xenova/transformers`) running entirely on your device. No audio is sent to the cloud for transcription, ensuring privacy and low latency.
*   **Real-Time Visualization**: Dynamic audio waveform visualizer.
*   **Device Selection**: Choose your preferred microphone input from Settings.

### 🧠 AI Intelligence
*   **Smart Insights**: Automatically detects and categorizes:
    *   ✅ **Action Items**: Tasks and to-dos.
    *   📊 **Data Points**: Numbers, metrics, and key facts.
    *   💡 **Key Points**: Important summaries.
*   **BYO Key**: Supports **OpenAI** and **Anthropic** API keys for generating high-quality insights from your transcripts.

### 🖥️ Desktop Integration
*   **System Tray**: Quick access to controls from your menu bar.
*   **Global Shortcuts**: Toggle recording instantly with `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows), even when the app is in the background.
*   **Overlay Mode**: "Always on Top" mini-player mode for unobtrusive monitoring during calls.
*   **Native Notifications**: Get alerted when recordings start or stop.

### 💾 Management & Export
*   **Local Database**: All meetings, transcripts, and summaries are stored locally in a **SQLite** database.
*   **Searchable History**: Full-text search across all your past meetings.
*   **Flexible Exports**: Export transcripts to **Markdown**, **Text**, or **JSON**.

---

## 🛠️ How It Works

Noctum is built on a modern, robust architecture designed for performance and privacy.

### 1. The Core (Electron & React)
*   **Main Process**: Handles window management, native system integrations (Tray, Shortcuts), and database operations (SQLite).
*   **Renderer Process**: A high-performance React application built with **Vite**, **Tailwind CSS**, and **shadcn/ui** for a beautiful, responsive interface.

### 2. The Transcription Engine (Web Worker)
To ensure the UI remains buttery smooth, the heavy lifting of transcription happens in a dedicated **Web Worker**:
*   **Model**: We use `Xenova/whisper-tiny.en` (quantized) for a balance of speed and accuracy.
*   **Pipeline**: Audio is captured via the Web Audio API, buffered, and sent to the worker. The worker runs the Whisper model via ONNX Runtime (WASM) to generate text.
*   **Safety**: Includes robust error handling and timeout mechanisms to prevent hangs.

### 3. Data Persistence
*   **SQLite (`better-sqlite3`)**: Stores structured data like meeting metadata, full transcripts, and generated insights. This ensures your data is persistent and fast to query.
*   **Electron Store**: Manages user preferences (Theme, API Keys, Audio Settings).

### 4. IPC Communication
*   The Main and Renderer processes communicate via a secure **IPC (Inter-Process Communication)** bridge.
*   This allows the React UI to trigger native actions (like "Toggle Overlay" or "Save to DB") and receive system events (like "Global Shortcut Triggered").

---

## 💻 Tech Stack

*   **Runtime**: [Electron](https://www.electronjs.org/)
*   **Frontend**: [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
*   **AI/ML**: 
    *   `@xenova/transformers` (Local Whisper)
    *   OpenAI / Anthropic APIs (Insights)
*   **Database**: `better-sqlite3`
*   **State/Storage**: `electron-store`

---

## 🏁 Getting Started

### Prerequisites
*   Node.js (v18 or higher)
*   Yarn

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/noctum.git
    cd noctum
    ```

2.  **Install dependencies**:
    ```bash
    yarn install
    ```

### Development

Run the app in development mode with hot-reloading:

```bash
yarn dev
```

### Build

Build the application for production (macOS/Windows/Linux):

```bash
yarn build
```

The distributable files (DMG, Exe, etc.) will be generated in the `release` directory.

---

## 🔒 Privacy

Noctum is designed with a "Local First" philosophy:
*   **Audio**: Processed 100% locally. Never uploaded.
*   **Transcripts**: Stored locally in your SQLite database.
*   **AI Insights**: Only the text transcript is sent to the AI provider (OpenAI/Anthropic) if you provide an API key. You control your data.

## 📄 License

MIT © [Your Name]

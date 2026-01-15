# AuraSplit - Audio Silence Splitter

AuraSplit is a high-performance, silence-detection based audio splitting tool. It scans a folder for audio files and splits long tracks into smaller segments based on silence analysis.

## Features
- **Modern UI**: Dark-themed, glassmorphic design for a premium feel.
- **Silence Detection**: Uses `ffmpeg`'s advanced `silencedetect` filter.
- **Multiple Formats**: Supports MP3, WAV, OPUS, FLAC, M4A, and OGG.
- **Configurable**: Adjust silence threshold, duration, and padding.

## How to Run
### 1. Requirements
- **Python 3.x**: Installed and in PATH.
- **Node.js**: Installed and in PATH.
- **FFmpeg**: The tool currently looks for ffmpeg at:
  `C:\Users\cyberhirsch\Downloads\ffmpeg-2025-10-09-git-469aad3897-full_build\bin\ffmpeg.exe`
  If your FFmpeg is elsewhere, update the `FFMPEG_PATH` in `backend/main.py`.

### 2. Start Backend
```powershell
pip install -r backend/requirements.txt
python backend/main.py
```

### 3. Start Frontend
```powershell
cd frontend
npm install
npm run dev
```

### 4. Use the Tool
1. Open [http://localhost:5173](http://localhost:5173) in your browser.
2. Enter the **absolute path** to your audio folder.
3. Click **Scan Folder**.
4. Adjust settings if needed.
5. Click **Split** on any file to automatically detect silences and create segments.

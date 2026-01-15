# AuraSplit - Audio Silence Splitter

AuraSplit is a high-performance, silence-detection based audio splitting tool. It scans a folder for audio files and splits long tracks into smaller segments based on silence analysis.

## Features
- **✨ Modern UI**: Dark-themed, glassmorphic design with smooth animations.
- **🔍 Silence Detection**: Uses `ffmpeg`'s advanced `silencedetect` engine for surgical precision.
- **📏 Length Constraints**: Set a **Minimum Segment Length** (e.g., 20s) to automatically merge short snippets.
- **📁 Smart Export**: Automatically creates subfolders for each track to keep your library organized.
- **🎧 Wide Support**: Works with MP3, WAV, OPUS, FLAC, M4A, OGG, and more.
- **⚡ Real-time Feedback**: Live status updates and progress tracking.

## Preview
![AuraSplit UI](screenshot.png)

## How to Run (Windows - Recommended)
1.  **Install**: Double-click `install.bat`. This will set up your virtual environment and install all dependencies.
2.  **Run**: Double-click `run.bat`. This will launch both the backend and frontend.

## Manual Setup
If you are not on Windows or prefer manual setup:

### 1. Requirements
- **Python 3.10+**: For the backend API.
- **Node.js**: For the React frontend.
- **FFmpeg**: Ensure `ffmpeg` and `ffprobe` are installed and accessible. 

### 2. Start the Backend
```powershell
pip install -r backend/requirements.txt
python backend/main.py
```

### 3. Start the Frontend
```powershell
cd frontend
npm install
npm run dev
```

## How to Use
1.  **Enter Path**: Paste the absolute folder path containing your audio files.
2.  **Scan**: Click "Scan Folder" to index all compatible files.
3.  **Tweak Settings**:
    *   **Silence Threshold**: How quiet the signal must be to count as silence (default -30dB).
    *   **Min Duration**: How long the silence must last (default 1s).
    *   **Padding**: Extra time to include before/after each split for natural transitions.
    *   **Min Segment Length**: Prevents tiny files by merging segments shorter than this value.
4.  **Split**: Hit "Split" on any file. Check your folder for the new segments!

## License
MIT

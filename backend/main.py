import os
import subprocess
import re
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def find_ffmpeg():
    # Try hardcoded path first
    hardcoded = r"C:\Users\cyberhirsch\Downloads\ffmpeg-2025-10-09-git-469aad3897-full_build\bin\ffmpeg.exe"
    if os.path.exists(hardcoded):
        return hardcoded
    
    # Try system PATH
    try:
        subprocess.run(["ffmpeg", "-version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return "ffmpeg"
    except:
        pass
    
    # Check common locations
    common_locations = [
        r"C:\ffmpeg\bin\ffmpeg.exe",
        r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",
        os.path.join(os.environ.get("USERPROFILE", ""), "Downloads", "ffmpeg", "bin", "ffmpeg.exe")
    ]
    for loc in common_locations:
        if os.path.exists(loc):
            return loc
    return None

FFMPEG_PATH = find_ffmpeg()
FFPROBE_PATH = FFMPEG_PATH.replace("ffmpeg.exe", "ffprobe.exe") if FFMPEG_PATH and "ffmpeg.exe" in FFMPEG_PATH else "ffprobe"

class ScanRequest(BaseModel):
    folder_path: str

class SplitRequest(BaseModel):
    file_path: str
    silence_threshold: float = -30.0
    silence_duration: float = 1.0
    padding: float = 0.5
    min_segment_length: float = 20.0
    use_subfolder: bool = True

@app.post("/scan")
async def scan_folder(request: ScanRequest):
    folder = request.folder_path
    if not os.path.isdir(folder):
        raise HTTPException(status_code=400, detail="Invalid folder path")
    
    extensions = ('.mp3', '.wav', '.opus', '.flac', '.m4a', '.ogg')
    files = []
    for f in os.listdir(folder):
        if f.lower().endswith(extensions):
            full_path = os.path.join(folder, f)
            files.append({
                "name": f,
                "path": full_path,
                "size": os.path.getsize(full_path)
            })
    return {"files": files}

@app.post("/split")
async def split_audio(request: SplitRequest):
    if not os.path.exists(request.file_path):
        raise HTTPException(status_code=404, detail="File not found")

    # 1. Detect silences using ffmpeg silencedetect
    cmd = [
        FFMPEG_PATH,
        "-i", request.file_path,
        "-af", f"silencedetect=noise={request.silence_threshold}dB:d={request.silence_duration}",
        "-f", "null",
        "-"
    ]
    
    process = subprocess.Popen(cmd, stderr=subprocess.PIPE, text=True)
    _, stderr = process.communicate()
    
    starts = re.findall(r"silence_start: ([\d\.]+)", stderr)
    ends = re.findall(r"silence_end: ([\d\.]+)", stderr)
    
    if not starts:
        return {"message": "No silence detected. File might be too loud or threshold too low.", "splits": 0}
    
    # Get total duration
    duration_cmd = [
        FFPROBE_PATH,
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        request.file_path
    ]
    total_duration = float(subprocess.check_output(duration_cmd).decode().strip())
    
    # Initial segments based on silence
    raw_segments = []
    last_end = 0.0
    
    for start, end in zip(starts, ends):
        start_f = float(start)
        end_f = float(end)
        
        seg_start = max(0, last_end - request.padding)
        seg_end = min(total_duration, start_f + request.padding)
        
        if seg_end - seg_start > 0.1:
            raw_segments.append([seg_start, seg_end])
        
        last_end = end_f
    
    if total_duration - last_end > 0.1:
        raw_segments.append([max(0, last_end - request.padding), total_duration])

    # Merge segments that are too short
    merged_segments = []
    if raw_segments:
        current_segment = raw_segments[0]
        for i in range(1, len(raw_segments)):
            next_seg = raw_segments[i]
            # If current segment is shorter than min_length, merge with next
            if (current_segment[1] - current_segment[0]) < request.min_segment_length:
                current_segment[1] = next_seg[1]
            else:
                merged_segments.append(current_segment)
                current_segment = next_seg
        merged_segments.append(current_segment)

    # Final check: if the last segment is too short and there are previous segments, merge it back
    if len(merged_segments) > 1 and (merged_segments[-1][1] - merged_segments[-1][0]) < request.min_segment_length:
        last = merged_segments.pop()
        merged_segments[-1][1] = last[1]

    # Perform the split
    folder_path = os.path.dirname(request.file_path)
    base_name = os.path.splitext(os.path.basename(request.file_path))[0]
    ext = os.path.splitext(request.file_path)[1]
    
    output_dir = folder_path
    if request.use_subfolder:
        output_dir = os.path.join(folder_path, base_name)
        os.makedirs(output_dir, exist_ok=True)

    output_files = []
    for i, (s, e) in enumerate(merged_segments):
        out_name = os.path.join(output_dir, f"{base_name}_part_{i+1:03d}{ext}")
        split_cmd = [
            FFMPEG_PATH,
            "-y",
            "-ss", str(s),
            "-to", str(e),
            "-i", request.file_path,
            "-c", "copy",
            out_name
        ]
        subprocess.run(split_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        output_files.append(out_name)
    
    return {
        "message": "Split complete",
        "splits": len(output_files),
        "files": output_files
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

import React, { useState } from 'react';

function App() {
  const [folderPath, setFolderPath] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [splitting, setSplitting] = useState(null); // path of file being split
  const [threshold, setThreshold] = useState(-30);
  const [duration, setDuration] = useState(1.0);
  const [padding, setPadding] = useState(0.5);
  const [minLength, setMinLength] = useState(20.0);
  const [useSubfolder, setUseSubfolder] = useState(true);
  const [status, setStatus] = useState('');
  const [totalFiles, setTotalFiles] = useState(0);
  const [processedFiles, setProcessedFiles] = useState(0);

  const scanFolder = async () => {
    if (!folderPath) return;
    setLoading(true);
    setStatus('Scanning folder...');
    try {
      const response = await fetch('http://localhost:8000/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder_path: folderPath }),
      });
      const data = await response.json();
      if (response.ok) {
        setFiles(data.files);
        setStatus(`Found ${data.files.length} audio files.`);
      } else {
        setStatus(`Error: ${data.detail}`);
      }
    } catch (err) {
      setStatus('Failed to connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  const splitFile = async (filePath) => {
    setSplitting(filePath);
    setStatus(`Splitting ${filePath.split('\\').pop()}...`);
    try {
      const response = await fetch('http://localhost:8000/split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_path: filePath,
          silence_threshold: threshold,
          silence_duration: duration,
          padding: padding,
          min_segment_length: minLength,
          use_subfolder: useSubfolder,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        return { success: true, splits: data.splits };
      } else {
        return { success: false, detail: data.detail };
      }
    } catch (err) {
      return { success: false, detail: 'Connection error' };
    } finally {
      setSplitting(null);
    }
  };

  const handleSingleSplit = async (filePath) => {
    const result = await splitFile(filePath);
    if (result.success) {
      setStatus(`Successfully split into ${result.splits} parts.`);
    } else {
      setStatus(`Error: ${result.detail}`);
    }
  };

  const splitAll = async () => {
    if (files.length === 0) return;
    setLoading(true);
    setTotalFiles(files.length);
    setProcessedFiles(0);

    for (let i = 0; i < files.length; i++) {
      setProcessedFiles(i + 1);
      setStatus(`Processing file ${i + 1} of ${files.length}: ${files[i].name}`);
      const result = await splitFile(files[i].path);
      if (!result.success) {
        setStatus(`Stopped at ${files[i].name}: ${result.detail}`);
        setLoading(false);
        return;
      }
    }

    setStatus(`Successfully split all ${files.length} files.`);
    setLoading(false);
    setTotalFiles(0);
    setProcessedFiles(0);
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="app-container">
      <header>
        <h1>AuraSplit</h1>
        <p className="subtitle">Premium silence-based audio splitting tool</p>
      </header>

      <div className="input-section">
        <div className="input-group">
          <input
            type="text"
            placeholder="Enter absolute folder path (e.g. C:\Music\Albums)"
            value={folderPath}
            onChange={(e) => setFolderPath(e.target.value)}
          />
        </div>
        <button onClick={scanFolder} disabled={loading}>
          {loading && !totalFiles ? <div className="loader"></div> : 'Scan Folder'}
        </button>
        {files.length > 0 && (
          <button
            onClick={splitAll}
            disabled={loading}
            style={{ background: 'linear-gradient(to right, #6366f1, #f43f5e)' }}
          >
            {loading && totalFiles ? <div className="loader"></div> : 'Split All'}
          </button>
        )}
      </div>

      <div className="controls">
        <div className="control-item">
          <label>Silence Threshold (dB)</label>
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
          />
        </div>
        <div className="control-item">
          <label>Min Silence Duration (s)</label>
          <input
            type="number"
            step="0.1"
            value={duration}
            onChange={(e) => setDuration(parseFloat(e.target.value))}
          />
        </div>
        <div className="control-item">
          <label>Padding (s)</label>
          <input
            type="number"
            step="0.1"
            value={padding}
            onChange={(e) => setPadding(parseFloat(e.target.value))}
          />
        </div>
        <div className="control-item">
          <label>Min Segment Length (s)</label>
          <input
            type="number"
            step="1"
            value={minLength}
            onChange={(e) => setMinLength(parseFloat(e.target.value))}
          />
        </div>
        <div className="control-item" style={{ alignSelf: 'end' }}>
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={useSubfolder}
              onChange={(e) => setUseSubfolder(e.target.checked)}
            />
            <span>Create Subfolder</span>
          </label>
        </div>
      </div>

      <div style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        Status: <span style={{ color: 'var(--text)' }}>
          {status}
          {totalFiles > 0 && ` (${processedFiles}/${totalFiles})`}
        </span>
      </div>

      <div className="files-list">
        {files.map((file, idx) => (
          <div className="file-card" key={idx}>
            <div className="file-info">
              <h3>{file.name}</h3>
              <p>{formatSize(file.size)} • {file.path}</p>
            </div>
            <button
              onClick={() => handleSingleSplit(file.path)}
              disabled={splitting === file.path || loading}
              style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}
            >
              {splitting === file.path ? <div className="loader"></div> : 'Split'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;

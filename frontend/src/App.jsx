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
        setStatus(`Successfully split into ${data.splits} parts.`);
      } else {
        setStatus(`Error: ${data.detail}`);
      }
    } catch (err) {
      setStatus('Splitting failed.');
    } finally {
      setSplitting(null);
    }
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
          {loading ? <div className="loader"></div> : 'Scan Folder'}
        </button>
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
        Status: <span style={{ color: 'var(--text)' }}>{status}</span>
      </div>

      <div className="files-list">
        {files.map((file, idx) => (
          <div className="file-card" key={idx}>
            <div className="file-info">
              <h3>{file.name}</h3>
              <p>{formatSize(file.size)} • {file.path}</p>
            </div>
            <button
              onClick={() => splitFile(file.path)}
              disabled={splitting === file.path}
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

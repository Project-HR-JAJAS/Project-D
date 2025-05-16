import React, { useState } from 'react';
import './ImportPage.css';
import { useData } from '../context/DataContext';
import ImportHistory from './ImportHistory';

const ImportPage: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [uploadTime, setUploadTime] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const { refreshData } = useData();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files));
      setMessage(null);
      setUploadTime(null);
    }
  };

  const handleUpload = async () => {
    if (!files.length) {
      setMessage({ type: 'error', text: 'Please select at least one file' });
      return;
    }

    setLoading(true);
    setMessage(null);
    setUploadTime(null);

    let allSuccess = true;
    let messages: string[] = [];
    let totalProcessingTime = 0;

    for (const file of files) {
      const startTime = performance.now();
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('http://localhost:8000/api/import', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        const endTime = performance.now();
        const clientProcessingTime = (endTime - startTime) / 1000;

        if (data.success) {
          totalProcessingTime += data.processingTime || 0;
          messages.push(`✔️ ${file.name}: ${data.message} (Client: ${clientProcessingTime.toFixed(2)}s)`);
        } else {
          allSuccess = false;
          messages.push(`❌ ${file.name}: ${data.message} (Client: ${clientProcessingTime.toFixed(2)}s)`);
        }
      } catch (error) {
        allSuccess = false;
        messages.push(`❌ ${file.name}: Error uploading file.`);
      }
    }

    await refreshData();

    setUploadTime(totalProcessingTime);
    setMessage({
      type: allSuccess ? 'success' : 'error',
      text: messages.join('\n'),
    });

    setLoading(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="history-button" onClick={() => setShowHistory(true)}>
          Import History
        </button>
        
      </div>

      <div className='import-container'>
        <h1>Import Excel File</h1>

        <div className="file-upload-container">
          <input
            accept=".xlsx,.xls"
            id="file-input"
            type="file"
            multiple
            onChange={handleFileChange}
          />
          <label htmlFor="file-input" className="file-input-label">
            Select File(s)
          </label>
          {files.length > 0 && (
            <ul className="selected-file">
              {files.map(file => <li key={file.name}>{file.name}</li>)}
            </ul>
          )}
        </div>

        <button
          className="upload-button"
          onClick={handleUpload}
          disabled={!files.length || loading}
        >
          {loading ? <div className="loading-spinner"></div> : 'Upload'}
        </button>

        {message && (
          <div className={`message ${message.type}`} style={{ whiteSpace: 'pre-line' }}>
            {message.text}
          </div>
        )}

        {uploadTime !== null && (
          <p className="processing-time">
            Total server processing time: {uploadTime.toFixed(2)} seconds
          </p>
        )}
      </div>
      {showHistory && (
            <ImportHistory
              onClose={() => {
                setShowHistory(false);
              }}
            />
          )}
    </div>
  );
};

export default ImportPage; 
import React, { useState } from 'react';
import './ImportPage.css';

const ImportPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [uploadTime, setUploadTime] = useState<number | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      setMessage(null);
      setUploadTime(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file first' });
      return;
    }

    setLoading(true);
    setMessage(null);
    setUploadTime(null);

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
        setMessage({ 
          type: 'success', 
          text: `${data.message} (Client processing time: ${clientProcessingTime.toFixed(2)}s)` 
        });
        setUploadTime(data.processingTime);
      } else {
        setMessage({ 
          type: 'error', 
          text: `${data.message} (Client processing time: ${clientProcessingTime.toFixed(2)}s)` 
        });
      }
    } catch (error) {
      const endTime = performance.now();
      const clientProcessingTime = (endTime - startTime) / 1000;
      setMessage({ 
        type: 'error', 
        text: `Error uploading file. Please try again. (Client processing time: ${clientProcessingTime.toFixed(2)}s)` 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="import-container">
      <h1>Import Excel File</h1>

      <div className="file-upload-container">
        <input
          accept=".xlsx,.xls"
          id="file-input"
          type="file"
          onChange={handleFileChange}
        />
        <label htmlFor="file-input" className="file-input-label">
          Select File
        </label>
        {file && (
          <p className="selected-file">Selected file: {file.name}</p>
        )}
      </div>

      <button
        className="upload-button"
        onClick={handleUpload}
        disabled={!file || loading}
      >
        {loading ? <div className="loading-spinner"></div> : 'Upload'}
      </button>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {uploadTime && (
        <p className="processing-time">
          Server processing time: {uploadTime.toFixed(2)} seconds
        </p>
      )}
    </div>
  );
};

export default ImportPage; 
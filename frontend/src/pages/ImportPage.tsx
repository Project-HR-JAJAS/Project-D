import React, { useState } from 'react';
import { Box, Button, Typography, CircularProgress, Alert } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

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
      const clientProcessingTime = (endTime - startTime) / 1000; // Convert to seconds

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
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        gap: 3,
        p: 3,
      }}
    >
      <Typography variant="h4" component="h1" gutterBottom>
        Import Excel File
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          p: 4,
          border: '2px dashed #ccc',
          borderRadius: 2,
          width: '100%',
          maxWidth: 500,
        }}
      >
        <input
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          id="raised-button-file"
          type="file"
          onChange={handleFileChange}
        />
        <label htmlFor="raised-button-file">
          <Button
            variant="contained"
            component="span"
            startIcon={<CloudUploadIcon />}
            disabled={loading}
          >
            Select File
          </Button>
        </label>
        {file && (
          <Typography variant="body1">
            Selected file: {file.name}
          </Typography>
        )}
      </Box>

      <Button
        variant="contained"
        color="primary"
        onClick={handleUpload}
        disabled={!file || loading}
      >
        {loading ? <CircularProgress size={24} /> : 'Upload'}
      </Button>

      {message && (
        <Alert severity={message.type} sx={{ width: '100%', maxWidth: 500 }}>
          {message.text}
        </Alert>
      )}

      {uploadTime && (
        <Typography variant="body2" color="text.secondary">
          Server processing time: {uploadTime.toFixed(2)} seconds
        </Typography>
      )}
    </Box>
  );
};

export default ImportPage; 
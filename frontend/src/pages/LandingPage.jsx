import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { UploadCloud, File, AlertCircle, Loader } from 'lucide-react';

export default function LandingPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false
  });

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const { session_id } = response.data;
      navigate(`/review?session_id=${session_id}`);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>CodeReview AI</h1>
        <p style={styles.subtitle}>Automated, intelligent code reviews powered by AI</p>
      </header>

      <main style={styles.main}>
        <div 
          {...getRootProps()} 
          style={{
            ...styles.dropzone,
            ...(isDragActive ? styles.dropzoneActive : {}),
            ...(file ? styles.dropzoneFilled : {})
          }}
        >
          <input {...getInputProps()} />
          <UploadCloud size={64} color="var(--accent)" style={{ marginBottom: '1rem' }} />
          {isDragActive ? (
            <p style={styles.dropText}>Drop the file here ...</p>
          ) : (
            <p style={styles.dropText}>
              Drag & drop a .zip file or code file here, or click to select
            </p>
          )}
          <p style={styles.supportedText}>
            Supports .zip archives or individual source code files
          </p>
        </div>

        {file && (
          <div style={styles.fileInfo}>
            <File size={20} color="var(--text-muted)" />
            <span style={styles.fileName}>{file.name}</span>
            <span style={styles.fileSize}>({(file.size / 1024).toFixed(1)} KB)</span>
          </div>
        )}

        {error && (
          <div style={styles.error}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <button 
          style={{...styles.button, ...( (!file || uploading) ? styles.buttonDisabled : {} )}} 
          onClick={handleUpload}
          disabled={!file || uploading}
        >
          {uploading ? (
            <>
              <Loader size={18} style={styles.spinner} /> Uploading...
            </>
          ) : 'Upload & Review'}
        </button>
      </main>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    padding: '2rem',
  },
  header: {
    textAlign: 'center',
    marginBottom: '3rem',
  },
  title: {
    fontSize: '3rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    background: 'linear-gradient(90deg, var(--accent) 0%, #b392f0 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '1.2rem',
    color: 'var(--text-muted)',
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: '600px',
  },
  dropzone: {
    border: '2px dashed var(--border-color)',
    borderRadius: '12px',
    padding: '4rem 2rem',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backgroundColor: 'var(--bg-panel)',
    transition: 'all 0.2s ease',
  },
  dropzoneActive: {
    borderColor: 'var(--accent)',
    backgroundColor: 'rgba(88, 166, 255, 0.1)',
  },
  dropzoneFilled: {
    borderColor: 'var(--accent)',
  },
  dropText: {
    fontSize: '1.2rem',
    marginBottom: '0.5rem',
    textAlign: 'center',
  },
  supportedText: {
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    textAlign: 'center',
  },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '1.5rem',
    padding: '0.75rem 1rem',
    backgroundColor: 'var(--bg-panel)',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    width: '100%',
  },
  fileName: {
    fontWeight: '500',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  fileSize: {
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'var(--error)',
    marginTop: '1rem',
    padding: '0.75rem',
    backgroundColor: 'rgba(248, 81, 73, 0.1)',
    borderRadius: '8px',
    border: '1px solid var(--error)',
    width: '100%',
  },
  button: {
    marginTop: '2rem',
    padding: '1rem 2rem',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: 'var(--accent)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    width: '100%',
    transition: 'background-color 0.2s',
  },
  buttonDisabled: {
    backgroundColor: 'var(--border-color)',
    color: 'var(--text-muted)',
    cursor: 'not-allowed',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
  }
};

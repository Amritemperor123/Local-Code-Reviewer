import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';
import FileTree from '../components/FileTree';
import CodeViewer from '../components/CodeViewer';
import ReviewPanel from '../components/ReviewPanel';

export default function ReviewPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();

  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [fileLanguage, setFileLanguage] = useState('');
  const [loadingContent, setLoadingContent] = useState(false);
  
  const [reviewResult, setReviewResult] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewStreaming, setReviewStreaming] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    if (!sessionId) {
      navigate('/');
      return;
    }

    const fetchFiles = async () => {
      try {
        const response = await axios.get(`/api/files?session_id=${sessionId}`);
        setFiles(response.data.files || []);
      } catch (err) {
        console.error('Error fetching files:', err);
      }
    };

    fetchFiles();
  }, [sessionId, navigate]);

  const handleFileSelect = async (filePath) => {
    setSelectedFile(filePath);
    setLoadingContent(true);
    setFileContent('');
    setReviewResult('');
    setReviewError('');
    setReviewStreaming(false);
    
    try {
      const response = await axios.get(`/api/file?session_id=${sessionId}&path=${encodeURIComponent(filePath)}`);
      setFileContent(response.data.content || '');
      setFileLanguage(response.data.language || '');
    } catch (err) {
      console.error('Error fetching file content:', err);
      setFileContent('// Error loading file content');
    } finally {
      setLoadingContent(false);
    }
  };

  const handleRunReview = async () => {
    if (!selectedFile) return;

    setReviewLoading(true);
    setReviewStreaming(false);
    setReviewResult('');
    setReviewError('');

    try {
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          file_path: selectedFile,
          code: fileContent,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // First chunk received — switch from "loading" to "streaming"
      setReviewLoading(false);
      setReviewStreaming(true);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE lines are separated by "\n\n"
        const parts = buffer.split('\n\n');
        buffer = parts.pop(); // keep incomplete tail

        for (const part of parts) {
          for (const line of part.split('\n')) {
            if (line.startsWith('event: error')) continue;
            if (line.startsWith('data:')) {
              const raw = line.slice('data:'.length).trim();
              if (raw === '[DONE]') break;
              try {
                const parsed = JSON.parse(raw);
                if (parsed.error) {
                  setReviewError(parsed.error);
                  setReviewStreaming(false);
                  return;
                }
                const token = parsed?.choices?.[0]?.delta?.content;
                if (token) {
                  setReviewResult(prev => prev + token);
                }
              } catch {
                // ignore malformed chunks
              }
            }
          }
        }
      }

      // Stream complete
      setReviewStreaming(false);
    } catch (err) {
      console.error('Error running review:', err);
      setReviewError(err.message || 'Failed to generate review');
      setReviewLoading(false);
      setReviewStreaming(false);
    }
  };



  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.backBtn} onClick={() => navigate('/')}>
            <ArrowLeft size={18} />
            <span>Upload New</span>
          </button>
          <h1 style={styles.title}>CodeReview AI</h1>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.sessionBadge}>Session: {sessionId.substring(0,8)}...</span>
        </div>
      </header>

      <div style={styles.layout}>
        <div style={styles.leftPanel}>
          <FileTree 
            files={files} 
            onFileSelect={handleFileSelect} 
            selectedFile={selectedFile} 
          />
        </div>
        
        <div style={styles.middlePanel}>
          <CodeViewer 
            content={fileContent} 
            language={fileLanguage}
            filePath={selectedFile}
            isLoading={loadingContent}
            onRunReview={handleRunReview}
            reviewLoading={reviewLoading || reviewStreaming}
          />
        </div>
        
        <div style={styles.rightPanel}>
          <ReviewPanel 
            review={reviewResult} 
            isLoading={reviewLoading}
            isStreaming={reviewStreaming}
            error={reviewError}
            selectedFile={selectedFile}
          />
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
  },
  header: {
    height: '60px',
    backgroundColor: 'var(--bg-darker)',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1.5rem',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '0.9rem',
    padding: '0.5rem',
    borderRadius: '6px',
    transition: 'background-color 0.2s, color 0.2s',
  },
  title: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: 'var(--text-main)',
  },
  sessionBadge: {
    fontSize: '0.8rem',
    padding: '0.25rem 0.5rem',
    backgroundColor: 'var(--bg-panel)',
    border: '1px solid var(--border-color)',
    borderRadius: '4px',
    color: 'var(--text-muted)',
  },
  layout: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  leftPanel: {
    width: '20%',
    minWidth: '200px',
    maxWidth: '350px',
    borderRight: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-panel)',
    display: 'flex',
    flexDirection: 'column',
  },
  middlePanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: 'var(--bg-dark)',
  },
  rightPanel: {
    width: '30%',
    minWidth: '300px',
    maxWidth: '500px',
    borderLeft: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-panel)',
    display: 'flex',
    flexDirection: 'column',
  }
};

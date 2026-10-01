import React, { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { rust } from '@codemirror/lang-rust';
import { go } from '@codemirror/lang-go';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { Play, Loader, FileCode2 } from 'lucide-react';

const getLanguageExtension = (filename) => {
  if (!filename) return [];
  const lower = filename.toLowerCase();
  
  if (lower.endsWith('.js') || lower.endsWith('.jsx')) return [javascript({ jsx: true })];
  if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return [javascript({ jsx: true, typescript: true })];
  if (lower.endsWith('.py')) return [python()];
  if (lower.endsWith('.css') || lower.endsWith('.scss')) return [css()];
  if (lower.endsWith('.html')) return [html()];
  if (lower.endsWith('.java')) return [java()];
  if (lower.endsWith('.c') || lower.endsWith('.cpp') || lower.endsWith('.cc') || lower.endsWith('.h') || lower.endsWith('.hpp')) return [cpp()];
  if (lower.endsWith('.rs')) return [rust()];
  if (lower.endsWith('.go')) return [go()];
  if (lower.endsWith('.md')) return [markdown()];
  
  return []; // Default text
};

export default function CodeViewer({ content, filePath, isLoading, onRunReview, reviewLoading }) {
  const extensions = useMemo(() => getLanguageExtension(filePath), [filePath]);

  if (!filePath) {
    return (
      <div style={styles.emptyContainer}>
        <FileCode2 size={48} color="var(--border-color)" style={{ marginBottom: '1rem' }} />
        <p style={styles.emptyText}>Select a file to view its contents</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.filePath}>{filePath}</div>
        <button 
          style={{
            ...styles.button,
            ...((reviewLoading || isLoading) ? styles.buttonDisabled : {})
          }}
          onClick={onRunReview}
          disabled={reviewLoading || isLoading}
        >
          {reviewLoading ? (
            <><Loader size={16} style={styles.spinner} /> Reviewing...</>
          ) : (
            <><Play size={16} fill="currentColor" /> Run AI Review</>
          )}
        </button>
      </div>
      
      <div style={styles.editorContainer}>
        {isLoading ? (
          <div style={styles.loadingContainer}>
            <Loader size={32} style={styles.spinnerLg} />
            <p>Loading file...</p>
          </div>
        ) : (
          <CodeMirror
            value={content}
            height="100%"
            theme={oneDark}
            extensions={extensions}
            editable={false}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: true,
              highlightSpecialChars: true,
              history: true,
              foldGutter: true,
              drawSelection: true,
              dropCursor: true,
              allowMultipleSelections: true,
              indentOnInput: true,
              syntaxHighlighting: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: true,
              rectangularSelection: true,
              crosshairCursor: true,
              highlightActiveLine: true,
              highlightSelectionMatches: true,
              closeBracketsKeymap: true,
              defaultKeymap: true,
              searchKeymap: true,
              historyKeymap: true,
              foldKeymap: true,
              completionKeymap: true,
              lintKeymap: true,
            }}
          />
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  emptyContainer: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
  },
  emptyText: {
    fontSize: '1.1rem',
  },
  header: {
    padding: '0.75rem 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-panel)',
  },
  filePath: {
    fontFamily: 'monospace',
    fontSize: '0.9rem',
    color: 'var(--text-main)',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: 'var(--success)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  buttonDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  editorContainer: {
    flex: 1,
    overflow: 'auto',
    backgroundColor: 'var(--bg-dark)',
  },
  loadingContainer: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
    gap: '1rem',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
  },
  spinnerLg: {
    animation: 'spin 1s linear infinite',
    color: 'var(--accent)',
  }
};

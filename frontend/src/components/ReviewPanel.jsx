import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Loader, AlertTriangle, Info, FileCode } from 'lucide-react';

// Custom renderers passed to ReactMarkdown — styled to match the dark theme
const markdownComponents = {
  h1: ({ children }) => <h1 style={mdStyles.h1}>{children}</h1>,
  h2: ({ children }) => <h2 style={mdStyles.h2}>{children}</h2>,
  h3: ({ children }) => <h3 style={mdStyles.h3}>{children}</h3>,
  p:  ({ children }) => <p  style={mdStyles.p}>{children}</p>,
  ul: ({ children }) => <ul style={mdStyles.ul}>{children}</ul>,
  ol: ({ children }) => <ol style={mdStyles.ol}>{children}</ol>,
  li: ({ children }) => <li style={mdStyles.li}>{children}</li>,
  strong: ({ children }) => <strong style={mdStyles.strong}>{children}</strong>,
  em: ({ children }) => <em style={mdStyles.em}>{children}</em>,
  blockquote: ({ children }) => <blockquote style={mdStyles.blockquote}>{children}</blockquote>,
  hr: () => <hr style={mdStyles.hr} />,
  // Inline code
  code: ({ inline, className, children }) => {
    if (inline) {
      return <code style={mdStyles.inlineCode}>{children}</code>;
    }
    // Fenced code block — scrollable horizontally
    return (
      <div style={mdStyles.codeBlockWrapper}>
        {className && (
          <div style={mdStyles.codeBlockLang}>
            {className.replace('language-', '')}
          </div>
        )}
        <pre style={mdStyles.codeBlock}>
          <code>{children}</code>
        </pre>
      </div>
    );
  },
};

// ── Cursor rendered as a tiny inline element appended after the markdown ──────
function BlinkingCursor() {
  return <span style={styles.cursor} aria-hidden="true" />;
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ReviewPanel({ review, isLoading, isStreaming, error, selectedFile }) {

  // 1. Initial connection spinner (before first token)
  if (isLoading) {
    return (
      <div style={styles.stateContainer}>
        <div style={styles.loadingPulse}>
          <Loader size={40} style={styles.spinner} color="var(--accent)" />
          <h3 style={{ marginTop: '1rem' }}>Connecting to LM Studio</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
            Starting AI review...
          </p>
        </div>
      </div>
    );
  }

  // 2. Error state
  if (error) {
    return (
      <div style={styles.stateContainer}>
        <div style={styles.errorBox}>
          <AlertTriangle size={32} color="var(--error)" style={{ marginBottom: '1rem' }} />
          <h3>Analysis Failed</h3>
          <p style={{ marginTop: '0.5rem' }}>{error}</p>
        </div>
      </div>
    );
  }

  // 3. No review yet (empty state)
  if (!review && !isStreaming) {
    return (
      <div style={styles.stateContainer}>
        {selectedFile ? (
          <div style={styles.emptyState}>
            <Info size={32} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
            <h3>No Review Yet</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
              Click "Run AI Review" to analyze the selected file.
            </p>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <FileCode size={32} color="var(--border-color)" style={{ marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
              Select a file and run review
            </p>
          </div>
        )}
      </div>
    );
  }

  // 4. Streaming + completed — both render the same markdown view.
  //    During streaming the header shows a spinner; the cursor is appended
  //    after the markdown prose so it appears at the insertion point.
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isStreaming && (
            <Loader size={16} style={styles.spinner} color="var(--accent)" />
          )}
          {isStreaming ? 'Generating Review...' : 'AI Review Results'}
        </h3>
      </div>

      {/* Scrollable content area */}
      <div style={styles.content}>
        <div style={styles.markdownBody}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {review}
          </ReactMarkdown>
          {isStreaming && <BlinkingCursor />}
        </div>
      </div>
    </div>
  );
}

// ── Panel layout styles ────────────────────────────────────────────────────────
const styles = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',     // let children control their own scroll
  },
  header: {
    padding: '1rem',
    borderBottom: '1px solid var(--border-color)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    flexShrink: 0,          // header never shrinks
  },
  content: {
    flex: 1,
    overflowY: 'auto',      // ← panel-level vertical scroll
    overflowX: 'hidden',
    padding: '1.25rem',
  },
  markdownBody: {
    // Reserve room for the inline cursor without layout shift
    lineHeight: '1.7',
  },
  stateContainer: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingPulse: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
  },
  errorBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    backgroundColor: 'rgba(248, 81, 73, 0.1)',
    border: '1px solid var(--error)',
    borderRadius: '8px',
    textAlign: 'center',
  },
  cursor: {
    display: 'inline-block',
    width: '2px',
    height: '1em',
    backgroundColor: 'var(--accent)',
    marginLeft: '2px',
    verticalAlign: 'text-bottom',
    animation: 'blink 0.8s step-end infinite',
  },
};

// ── Markdown element styles ────────────────────────────────────────────────────
const mdStyles = {
  h1: {
    fontSize: '1.4rem',
    fontWeight: 700,
    color: 'var(--text-main)',
    margin: '1.5rem 0 0.75rem',
    paddingBottom: '0.4rem',
    borderBottom: '1px solid var(--border-color)',
  },
  h2: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: 'var(--accent)',
    margin: '1.5rem 0 0.6rem',
    paddingBottom: '0.3rem',
    borderBottom: '1px solid var(--border-color)',
  },
  h3: {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--text-main)',
    margin: '1.2rem 0 0.4rem',
  },
  p: {
    margin: '0 0 0.75rem',
    lineHeight: '1.7',
    fontSize: '0.92rem',
    color: 'var(--text-main)',
  },
  ul: {
    margin: '0 0 0.75rem 1.25rem',
    padding: 0,
    listStyleType: 'disc',
  },
  ol: {
    margin: '0 0 0.75rem 1.25rem',
    padding: 0,
  },
  li: {
    margin: '0.25rem 0',
    lineHeight: '1.6',
    fontSize: '0.92rem',
    color: 'var(--text-main)',
  },
  strong: {
    fontWeight: 600,
    color: 'var(--text-main)',
  },
  em: {
    fontStyle: 'italic',
    color: 'var(--text-muted)',
  },
  blockquote: {
    margin: '0.75rem 0',
    padding: '0.5rem 1rem',
    borderLeft: '3px solid var(--accent)',
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderRadius: '0 4px 4px 0',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
  hr: {
    border: 'none',
    borderTop: '1px solid var(--border-color)',
    margin: '1.25rem 0',
  },
  inlineCode: {
    fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
    fontSize: '0.82em',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: '#e06c75',
    padding: '0.15em 0.4em',
    borderRadius: '3px',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  codeBlockWrapper: {
    margin: '0.75rem 0',
    borderRadius: '6px',
    border: '1px solid var(--border-color)',
    overflow: 'hidden',           // clip the rounded corners
    backgroundColor: '#1a1a2e',
  },
  codeBlockLang: {
    padding: '0.3rem 0.75rem',
    fontSize: '0.72rem',
    fontFamily: 'monospace',
    color: 'var(--text-muted)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderBottom: '1px solid var(--border-color)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  codeBlock: {
    margin: 0,
    padding: '0.85rem 1rem',
    overflowX: 'auto',            // ← horizontal scroll for long lines
    overflowY: 'visible',
    fontSize: '0.82rem',
    lineHeight: '1.6',
    fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
    color: '#abb2bf',
    whiteSpace: 'pre',            // preserve indentation; scroll instead of wrap
  },
};

// ── Inject keyframe animations once ───────────────────────────────────────────
const _sheet = document.createElement('style');
_sheet.textContent = `
  @keyframes spin  { to { transform: rotate(360deg); } }
  @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
`;
document.head.appendChild(_sheet);

import React, { useState, useMemo } from 'react';
import { Folder, FolderOpen, File, FileCode, FileJson, FileText, ChevronRight, ChevronDown } from 'lucide-react';

// Simple helper to build tree from paths
function buildFileTree(paths) {
  const root = { name: 'root', type: 'folder', children: {}, path: '' };
  
  paths.forEach(filePath => {
    const parts = filePath.split('/');
    let current = root;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const currentPath = current.path ? `${current.path}/${part}` : part;
      
      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          type: isFile ? 'file' : 'folder',
          path: currentPath,
          children: isFile ? null : {}
        };
      }
      current = current.children[part];
    }
  });
  
  return root.children;
}

const getFileIcon = (fileName) => {
  if (fileName.endsWith('.js') || fileName.endsWith('.jsx') || fileName.endsWith('.ts') || fileName.endsWith('.tsx') || fileName.endsWith('.py') || fileName.endsWith('.java') || fileName.endsWith('.cpp') || fileName.endsWith('.go') || fileName.endsWith('.rs')) {
    return <FileCode size={16} color="#58a6ff" />;
  }
  if (fileName.endsWith('.json')) {
    return <FileJson size={16} color="#79c0ff" />;
  }
  if (fileName.endsWith('.md') || fileName.endsWith('.txt')) {
    return <FileText size={16} color="#d2a8ff" />;
  }
  return <File size={16} color="#8b949e" />;
};

const TreeNode = ({ node, level = 0, onFileSelect, selectedFile }) => {
  const [isOpen, setIsOpen] = useState(true);
  const isSelected = selectedFile === node.path;
  
  if (node.type === 'file') {
    return (
      <div 
        style={{
          ...styles.node,
          paddingLeft: `${level * 16 + 12}px`,
          backgroundColor: isSelected ? 'var(--border-color)' : 'transparent',
          color: isSelected ? 'var(--text-main)' : 'var(--text-muted)'
        }}
        onClick={() => onFileSelect(node.path)}
      >
        <span style={styles.iconWrapper}>{getFileIcon(node.name)}</span>
        <span style={styles.fileName}>{node.name}</span>
      </div>
    );
  }
  
  // Folder
  const childrenNodes = Object.values(node.children).sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'folder' ? -1 : 1;
  });

  return (
    <div>
      <div 
        style={{...styles.node, paddingLeft: `${level * 16 + 4}px`}}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={styles.arrowIcon}>
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <span style={styles.iconWrapper}>
          {isOpen ? <FolderOpen size={16} color="#8b949e" /> : <Folder size={16} color="#8b949e" />}
        </span>
        <span style={styles.fileName}>{node.name}</span>
      </div>
      {isOpen && childrenNodes.map(child => (
        <TreeNode 
          key={child.path} 
          node={child} 
          level={level + 1} 
          onFileSelect={onFileSelect}
          selectedFile={selectedFile}
        />
      ))}
    </div>
  );
};

export default function FileTree({ files, onFileSelect, selectedFile }) {
  const tree = useMemo(() => buildFileTree(files), [files]);
  const rootNodes = Object.values(tree).sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'folder' ? -1 : 1;
  });

  if (!files || files.length === 0) {
    return (
      <div style={styles.empty}>
        <p>No files found</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>Explorer</div>
      <div style={styles.tree}>
        {rootNodes.map(node => (
          <TreeNode 
            key={node.path} 
            node={node} 
            onFileSelect={onFileSelect}
            selectedFile={selectedFile}
          />
        ))}
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
  header: {
    padding: '0.75rem 1rem',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-muted)',
    borderBottom: '1px solid var(--border-color)',
  },
  tree: {
    flex: 1,
    overflowY: 'auto',
    padding: '0.5rem 0',
  },
  node: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.25rem 1rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
    userSelect: 'none',
  },
  arrowIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '16px',
    height: '16px',
    marginRight: '2px',
    color: 'var(--text-muted)',
  },
  iconWrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '6px',
  },
  fileName: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  empty: {
    padding: '2rem 1rem',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
  }
};

import React, { useCallback, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useStore } from '../../store/useStore';
import { useSocket } from '../../hooks/useSocket';
import './CodeEditor.css';

const DEBOUNCE_MS = 600;

const LANGUAGE_MAP = {
  js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
  html: 'html', css: 'css', scss: 'scss', json: 'json',
  md: 'markdown', py: 'python', txt: 'plaintext', sh: 'shell',
};

function getMonacoLanguage(file) {
  if (!file) return 'plaintext';
  const ext = file.name.split('.').pop().toLowerCase();
  return LANGUAGE_MAP[ext] || file.language || 'plaintext';
}

export default function CodeEditor() {
  const { getActiveFile, updateFileContent, currentProject, openTabs, files, activeFileId, setActiveFile, closeTab } = useStore();
  const { emitFileChange } = useSocket();
  const timerRef = useRef(null);
  const editorRef = useRef(null);

  const activeFile = getActiveFile();

  const handleChange = useCallback((value) => {
    if (!activeFile) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      await updateFileContent(activeFile.id, value ?? '');
      if (currentProject) emitFileChange(currentProject._id, activeFile.id, value ?? '');
    }, DEBOUNCE_MS);
  }, [activeFile, updateFileContent, currentProject, emitFileChange]);

  // Cleanup timer on unmount
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const openTabFiles = openTabs.map(id => files.find(f => f.id === id)).filter(Boolean);

  if (!currentProject) {
    return (
      <div className="editor-empty">
        <div className="editor-empty-content">
          <span className="editor-empty-icon">{'</>'}</span>
          <h2>No project open</h2>
          <p>Select a project from the dashboard to start coding</p>
        </div>
      </div>
    );
  }

  return (
    <div className="code-editor">
      {/* Tabs */}
      {openTabFiles.length > 0 && (
        <div className="editor-tabs">
          {openTabFiles.map(file => (
            <div
              key={file.id}
              className={`editor-tab ${file.id === activeFileId ? 'active' : ''}`}
              onClick={() => setActiveFile(file.id)}
            >
              <span className="tab-name">{file.name}</span>
              <button
                className="tab-close"
                onClick={e => { e.stopPropagation(); closeTab(file.id); }}
              >×</button>
            </div>
          ))}
        </div>
      )}

      {activeFile ? (
        <Editor
          key={activeFile.id}
          height="100%"
          language={getMonacoLanguage(activeFile)}
          value={activeFile.content}
          onChange={handleChange}
          theme="vs-dark"
          onMount={(editor) => { editorRef.current = editor; }}
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            lineNumbers: 'on',
            glyphMargin: false,
            folding: true,
            lineDecorationsWidth: 5,
            lineNumbersMinChars: 3,
            renderLineHighlight: 'line',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            formatOnPaste: true,
            formatOnType: true,
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            tabSize: 2,
            padding: { top: 12, bottom: 12 },
          }}
        />
      ) : (
        <div className="editor-no-file">
          <p>Open a file from the explorer</p>
        </div>
      )}
    </div>
  );
}

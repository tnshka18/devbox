import React, { useState } from 'react';
import { Folder, FolderOpen, FileCode, FileText, FileCog, Trash2, Edit2, Check, X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import toast from 'react-hot-toast';
import './FileTree.css';

const FILE_ICONS = {
  html: '🌐',
  css: '🎨',
  js: '⚡',
  jsx: '⚛️',
  ts: '🔷',
  tsx: '🔷',
  json: '{}',
  md: '📝',
  py: '🐍',
};

function getIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  return FILE_ICONS[ext] || '📄';
}

function FileItem({ file, depth = 0, allFiles }) {
  const [expanded, setExpanded] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(file.name);

  const { activeFileId, setActiveFile, deleteFile, renameFile, openTabs } = useStore();

  const children = allFiles.filter(f => f.parentId === file.id);
  const isActive = activeFileId === file.id;
  const isOpen = openTabs.includes(file.id);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${file.name}"?`)) return;
    try {
      await deleteFile(file.id);
      toast.success(`Deleted ${file.name}`);
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleRename = async () => {
    if (!newName.trim() || newName === file.name) { setRenaming(false); return; }
    try {
      await renameFile(file.id, newName.trim());
      toast.success('Renamed');
    } catch { toast.error('Rename failed'); }
    setRenaming(false);
  };

  return (
    <div className="file-item-wrapper">
      <div
        className={`file-item ${isActive ? 'active' : ''} ${isOpen && !isActive ? 'open' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
        onClick={() => {
          if (file.type === 'folder') setExpanded(e => !e);
          else setActiveFile(file.id);
        }}
      >
        <span className="file-icon">
          {file.type === 'folder'
            ? (expanded ? <FolderOpen size={14} /> : <Folder size={14} />)
            : <span style={{ fontSize: '13px' }}>{getIcon(file.name)}</span>
          }
        </span>

        {renaming ? (
          <input
            autoFocus
            className="rename-input"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setRenaming(false); }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className="file-name">{file.name}</span>
        )}

        <div className="file-actions">
          {renaming ? (
            <>
              <button onClick={e => { e.stopPropagation(); handleRename(); }}><Check size={11} /></button>
              <button onClick={e => { e.stopPropagation(); setRenaming(false); }}><X size={11} /></button>
            </>
          ) : (
            <>
              <button onClick={e => { e.stopPropagation(); setNewName(file.name); setRenaming(true); }}><Edit2 size={11} /></button>
              <button className="delete-btn" onClick={handleDelete}><Trash2 size={11} /></button>
            </>
          )}
        </div>
      </div>

      {file.type === 'folder' && expanded && children.map(child => (
        <FileItem key={child.id} file={child} depth={depth + 1} allFiles={allFiles} />
      ))}
    </div>
  );
}

export default function FileTree() {
  const { files, createFile, currentProject } = useStore();
  const [creating, setCreating] = useState(null); // 'file' | 'folder' | null
  const [newName, setNewName] = useState('');

  const rootFiles = files.filter(f => !f.parentId);

  const handleCreate = async () => {
    if (!newName.trim()) { setCreating(null); return; }
    try {
      await createFile(newName.trim(), creating);
      toast.success(`Created ${newName.trim()}`);
    } catch { toast.error('Failed to create'); }
    setNewName('');
    setCreating(null);
  };

  if (!currentProject) return null;

  return (
    <div className="file-tree">
      <div className="file-tree-header">
        <span className="tree-title">EXPLORER</span>
        <div className="tree-actions">
          <button title="New File" onClick={() => setCreating('file')}>+F</button>
          <button title="New Folder" onClick={() => setCreating('folder')}>+D</button>
        </div>
      </div>

      <div className="tree-project-name">{currentProject.name}</div>

      {creating && (
        <div className="new-file-input-wrapper">
          <span style={{ fontSize: '12px', marginRight: 4 }}>
            {creating === 'folder' ? '📁' : '📄'}
          </span>
          <input
            autoFocus
            placeholder={creating === 'folder' ? 'folder-name' : 'file.js'}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setCreating(null); setNewName(''); } }}
            className="new-file-input"
          />
        </div>
      )}

      <div className="tree-files">
        {rootFiles.map(file => (
          <FileItem key={file.id} file={file} depth={0} allFiles={files} />
        ))}
      </div>
    </div>
  );
}

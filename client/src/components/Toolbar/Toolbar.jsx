import React, { useState } from 'react';
import { ChevronLeft, Package, Moon, Sun, Save } from 'lucide-react';
import { useStore } from '../../store/useStore';
import toast from 'react-hot-toast';
import './Toolbar.css';

export default function Toolbar({ onBackToDashboard }) {
  const {
    currentProject,
    getActiveFile,
    showPackagePanel,
    setShowPackagePanel,
    packages,
    theme,
    setTheme,
    updateFileContent,
    files,
  } = useStore();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const file = getActiveFile();
    if (!file) return;
    setSaving(true);
    try {
      await updateFileContent(file.id, file.content);
      toast.success('Saved!', { duration: 1000 });
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <button className="toolbar-back" onClick={onBackToDashboard} title="Back to projects">
          <ChevronLeft size={16} />
          <span>Projects</span>
        </button>
        <div className="toolbar-divider" />
        {currentProject && (
          <div className="toolbar-project-info">
            <span className="toolbar-project-name">{currentProject.name}</span>
            <span className="toolbar-template">{currentProject.template}</span>
          </div>
        )}
      </div>

      <div className="toolbar-center">
        <span className="toolbar-brand">⬡ DevBox</span>
      </div>

      <div className="toolbar-right">
        {currentProject && (
          <>
            <button
              className="toolbar-btn"
              onClick={handleSave}
              title="Save (Ctrl+S)"
              disabled={saving}
            >
              <Save size={14} />
              <span>{saving ? 'Saving...' : 'Save'}</span>
            </button>
            <button
              className={`toolbar-btn ${showPackagePanel ? 'active' : ''}`}
              onClick={() => setShowPackagePanel(!showPackagePanel)}
              title="Package Manager"
            >
              <Package size={14} />
              <span>Packages</span>
              {packages.length > 0 && (
                <span className="pkg-badge">{packages.length}</span>
              )}
            </button>
          </>
        )}
        <button
          className="toolbar-btn"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </div>
  );
}

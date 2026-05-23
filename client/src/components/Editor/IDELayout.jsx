import React, { useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useStore } from '../../store/useStore';
import FileTree from '../FileTree/FileTree';
import CodeEditor from '../Editor/CodeEditor';
import Preview from '../Preview/Preview';
import PackagePanel from '../Preview/PackagePanel';
import Toolbar from '../Toolbar/Toolbar';
import toast from 'react-hot-toast';
import './IDELayout.css';

export default function IDELayout({ projectId, onBackToDashboard }) {
  const { loadProject, isLoading, showPackagePanel } = useStore();

  useEffect(() => {
    if (projectId) {
      loadProject(projectId).catch(() => toast.error('Failed to load project'));
    }
  }, [projectId]);

  return (
    <div className="ide-layout">
      <Toolbar onBackToDashboard={onBackToDashboard} />

      {isLoading ? (
        <div className="ide-loading">
          <div className="ide-loading-spinner" />
          <p>Loading project...</p>
        </div>
      ) : (
        <div className="ide-body">
          <PanelGroup direction="horizontal">
            {/* File Tree */}
            <Panel defaultSize={18} minSize={12} maxSize={30}>
              <FileTree />
            </Panel>

            <PanelResizeHandle className="resize-handle" />

            {/* Editor */}
            <Panel defaultSize={showPackagePanel ? 40 : 50} minSize={25}>
              <CodeEditor />
            </Panel>

            <PanelResizeHandle className="resize-handle" />

            {/* Preview + optionally Package Panel */}
            <Panel defaultSize={showPackagePanel ? 42 : 32} minSize={20}>
              <div className="preview-area">
                <Preview />
                {showPackagePanel && <PackagePanel />}
              </div>
            </Panel>
          </PanelGroup>
        </div>
      )}
    </div>
  );
}

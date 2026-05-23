import React, { useMemo, useState } from 'react';
import { useStore } from '../../store/useStore';
import { buildPreviewDoc } from '../../utils/previewBuilder';
import { RefreshCw, Maximize2, ExternalLink } from 'lucide-react';
import './Preview.css';

export default function Preview() {
  const { files, packages, previewKey, currentProject } = useStore();
  const [manualKey, setManualKey] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const srcdoc = useMemo(() => {
    return buildPreviewDoc(files, packages);
  }, [files, packages, previewKey, manualKey]);

  const handleRefresh = () => setManualKey(k => k + 1);

  const handleOpenBlank = () => {
    const blob = new Blob([srcdoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  if (!currentProject) {
    return (
      <div className="preview-empty">
        <span>👁️</span>
        <p>Open a project to see the preview</p>
      </div>
    );
  }

  return (
    <div className={`preview-panel ${fullscreen ? 'fullscreen' : ''}`}>
      <div className="preview-toolbar">
        <div className="preview-label">
          <span className="live-dot" />
          LIVE PREVIEW
        </div>
        <div className="preview-actions">
          <button onClick={handleRefresh} title="Refresh">
            <RefreshCw size={13} />
          </button>
          <button onClick={() => setFullscreen(f => !f)} title="Toggle fullscreen">
            <Maximize2 size={13} />
          </button>
          <button onClick={handleOpenBlank} title="Open in new tab">
            <ExternalLink size={13} />
          </button>
        </div>
      </div>

      <div className="preview-frame-wrapper">
        <iframe
          key={`${previewKey}-${manualKey}`}
          title="preview"
          className="preview-frame"
          srcDoc={srcdoc}
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
        />
      </div>
    </div>
  );
}

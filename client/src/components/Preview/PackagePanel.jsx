import React, { useState } from 'react';
import { Package, Plus, Trash2, X, Loader } from 'lucide-react';
import { useStore } from '../../store/useStore';
import toast from 'react-hot-toast';
import './PackagePanel.css';

export default function PackagePanel() {
  const { packages, installPackage, uninstallPackage, setShowPackagePanel } = useStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInstall = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    
    // Parse "name@version"
    const atIdx = trimmed.lastIndexOf('@');
    const name = atIdx > 0 ? trimmed.slice(0, atIdx) : trimmed;
    const version = atIdx > 0 ? trimmed.slice(atIdx + 1) : 'latest';

    setLoading(true);
    try {
      const pkg = await installPackage(name, version);
      toast.success(`Installed ${pkg.name}@${pkg.version}`);
      setInput('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Install failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUninstall = async (name) => {
    try {
      await uninstallPackage(name);
      toast.success(`Removed ${name}`);
    } catch {
      toast.error('Failed to remove package');
    }
  };

  return (
    <div className="package-panel">
      <div className="pkg-header">
        <div className="pkg-title">
          <Package size={14} />
          NPM PACKAGES
        </div>
        <button className="pkg-close" onClick={() => setShowPackagePanel(false)}>
          <X size={14} />
        </button>
      </div>

      <form onSubmit={handleInstall} className="pkg-install-form">
        <input
          placeholder="package-name or name@version"
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
          className="pkg-input"
        />
        <button type="submit" disabled={loading || !input.trim()} className="pkg-install-btn">
          {loading ? <Loader size={13} className="spinning" /> : <Plus size={13} />}
        </button>
      </form>

      <div className="pkg-hint">
        Packages load via <strong>unpkg.com</strong> CDN into the preview
      </div>

      <div className="pkg-list">
        {packages.length === 0 ? (
          <div className="pkg-empty">No packages installed</div>
        ) : (
          packages.map(pkg => (
            <div key={pkg.name} className="pkg-item">
              <div className="pkg-info">
                <span className="pkg-name">{pkg.name}</span>
                <span className="pkg-version">@{pkg.version}</span>
              </div>
              <button
                className="pkg-remove"
                onClick={() => handleUninstall(pkg.name)}
                title="Uninstall"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="pkg-popular">
        <div className="pkg-popular-label">Popular packages</div>
        {['lodash', 'axios', 'moment', 'chart.js', 'anime.js'].map(name => (
          <button
            key={name}
            className="pkg-quick"
            onClick={() => setInput(name)}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}

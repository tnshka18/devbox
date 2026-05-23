import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { Plus, Trash2, Code2, Clock, FolderOpen, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import './Dashboard.css';

const TEMPLATES = [
  { id: 'vanilla', label: 'Vanilla JS', icon: '⚡', desc: 'HTML + CSS + JS, zero config' },
  { id: 'react', label: 'React', icon: '⚛️', desc: 'React via CDN with Babel' },
  { id: 'blank', label: 'Blank', icon: '⬜', desc: 'Start from scratch' },
];

export default function Dashboard({ onOpenProject }) {
  const { projects, fetchProjects, createProject, deleteProject, isLoading } = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', template: 'vanilla' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchProjects().catch(() => toast.error('Failed to load projects'));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const project = await createProject(form.name.trim(), form.description.trim(), form.template);
      toast.success(`Created "${project.name}"`);
      setShowCreate(false);
      setForm({ name: '', description: '', template: 'vanilla' });
      onOpenProject(project._id);
    } catch (err) {
      toast.error('Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (e, id, name) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteProject(id);
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div className="dash-brand">
          <span className="dash-logo">⬡</span>
          <div>
            <h1>DevBox</h1>
            <p>Browser-based coding sandbox</p>
          </div>
        </div>
        <button className="dash-new-btn" onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          New Project
        </button>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Create New Project</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Project Name *</label>
                <input
                  autoFocus
                  placeholder="my-awesome-app"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  placeholder="Optional description..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Template</label>
                <div className="template-grid">
                  {TEMPLATES.map(t => (
                    <button
                      type="button"
                      key={t.id}
                      className={`template-card ${form.template === t.id ? 'selected' : ''}`}
                      onClick={() => setForm(f => ({ ...f, template: t.id }))}
                    >
                      <span className="tmpl-icon">{t.icon}</span>
                      <span className="tmpl-label">{t.label}</span>
                      <span className="tmpl-desc">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={creating || !form.name.trim()}>
                  {creating ? <><Loader size={14} className="spinning" /> Creating...</> : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="dash-content">
        {isLoading ? (
          <div className="dash-loading">
            <Loader size={24} className="spinning" />
            <p>Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="dash-empty">
            <Code2 size={48} />
            <h2>No projects yet</h2>
            <p>Create your first project to get started</p>
            <button className="btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Create Project
            </button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map(project => (
              <div
                key={project._id}
                className="project-card"
                onClick={() => onOpenProject(project._id)}
              >
                <div className="project-card-header">
                  <div className="project-icon">
                    {project.template === 'react' ? '⚛️' : project.template === 'vue' ? '💚' : '⚡'}
                  </div>
                  <div className="project-meta">
                    <span className="project-template">{project.template}</span>
                    <button
                      className="project-delete"
                      onClick={e => handleDelete(e, project._id, project.name)}
                      title="Delete project"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <h3 className="project-name">{project.name}</h3>
                {project.description && (
                  <p className="project-desc">{project.description}</p>
                )}
                <div className="project-footer">
                  <span className="project-time">
                    <Clock size={11} />
                    {timeAgo(project.updatedAt)}
                  </span>
                  <span className="project-open">
                    <FolderOpen size={11} /> Open
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

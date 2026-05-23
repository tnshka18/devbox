const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Project = require('../models/Project');

// GET all files for a project
router.get('/:projectId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project.files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create file or folder
router.post('/:projectId', async (req, res) => {
  try {
    const { name, type = 'file', content = '', parentId = null, language } = req.body;
    if (!name) return res.status(400).json({ error: 'File name is required' });

    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Build path
    let path = `/${name}`;
    if (parentId) {
      const parent = project.files.find(f => f.id === parentId);
      if (parent) path = `${parent.path}/${name}`;
    }

    // Detect language from extension
    const ext = name.split('.').pop().toLowerCase();
    const langMap = {
      js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
      html: 'html', css: 'css', scss: 'scss', json: 'json',
      md: 'markdown', py: 'python', txt: 'plaintext',
    };
    const detectedLang = language || langMap[ext] || 'plaintext';

    const newFile = {
      id: uuidv4(),
      name,
      path,
      type,
      content: type === 'folder' ? '' : content,
      language: detectedLang,
      parentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    project.files.push(newFile);
    await project.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) io.to(`project:${req.params.projectId}`).emit('file-created', newFile);

    res.status(201).json(newFile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update file content
router.put('/:projectId/:fileId', async (req, res) => {
  try {
    const { content, name } = req.body;
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const file = project.files.find(f => f.id === req.params.fileId);
    if (!file) return res.status(404).json({ error: 'File not found' });

    if (content !== undefined) file.content = content;
    if (name !== undefined) {
      file.name = name;
      file.path = file.path.replace(/[^/]*$/, name);
    }
    file.updatedAt = new Date();

    await project.save();

    // Emit socket event for real-time sync
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${req.params.projectId}`).emit('file-updated', {
        fileId: req.params.fileId,
        content: file.content,
        name: file.name,
      });
    }

    res.json(file);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE file
router.delete('/:projectId/:fileId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const fileIndex = project.files.findIndex(f => f.id === req.params.fileId);
    if (fileIndex === -1) return res.status(404).json({ error: 'File not found' });

    // Also delete children if folder
    const fileToDelete = project.files[fileIndex];
    const idsToDelete = [req.params.fileId];
    if (fileToDelete.type === 'folder') {
      const collectChildren = (parentId) => {
        project.files.forEach(f => {
          if (f.parentId === parentId) {
            idsToDelete.push(f.id);
            if (f.type === 'folder') collectChildren(f.id);
          }
        });
      };
      collectChildren(req.params.fileId);
    }

    project.files = project.files.filter(f => !idsToDelete.includes(f.id));
    await project.save();

    const io = req.app.get('io');
    if (io) io.to(`project:${req.params.projectId}`).emit('file-deleted', { fileIds: idsToDelete });

    res.json({ message: 'File deleted', deletedIds: idsToDelete });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

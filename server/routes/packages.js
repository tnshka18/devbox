const express = require('express');
const router = express.Router();
const Project = require('../models/Project');

// GET packages for a project
router.get('/:projectId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project.packages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST install package (resolves CDN URL via unpkg)
router.post('/:projectId', async (req, res) => {
  try {
    const { name, version = 'latest' } = req.body;
    if (!name) return res.status(400).json({ error: 'Package name required' });

    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Check if already installed
    const existing = project.packages.find(p => p.name === name);
    if (existing) {
      return res.status(400).json({ error: `Package "${name}" is already installed` });
    }

    // Resolve version from unpkg/npm registry
    let resolvedVersion = version;
    try {
      const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
      const registryRes = await fetch(`https://registry.npmjs.org/${name}/latest`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      });
      if (registryRes.ok) {
        const data = await registryRes.json();
        resolvedVersion = data.version || version;
      }
    } catch (_) {
      // Use provided version if registry fails
    }

    const cdnUrl = `https://unpkg.com/${name}@${resolvedVersion}`;

    const pkg = {
      name,
      version: resolvedVersion,
      cdnUrl,
      installedAt: new Date(),
    };

    project.packages.push(pkg);
    await project.save();

    res.status(201).json(pkg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE uninstall package
router.delete('/:projectId/:packageName', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const before = project.packages.length;
    project.packages = project.packages.filter(p => p.name !== req.params.packageName);

    if (project.packages.length === before) {
      return res.status(404).json({ error: 'Package not found' });
    }

    await project.save();
    res.json({ message: `Package "${req.params.packageName}" removed` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

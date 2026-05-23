const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Project = require('../models/Project');

const TEMPLATES = {
  vanilla: [
    {
      id: uuidv4(), name: 'index.html', path: '/index.html', type: 'file', language: 'html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My Project</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div id="app">
    <h1>Hello, DevBox! 🚀</h1>
    <p>Edit files and see live updates.</p>
    <button id="btn">Click me</button>
    <p id="counter">Count: 0</p>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
    },
    {
      id: uuidv4(), name: 'style.css', path: '/style.css', type: 'file', language: 'css',
      content: `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Segoe UI', sans-serif;
  background: #0f0f23;
  color: #e8e8e8;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
#app {
  text-align: center;
  padding: 2rem;
}
h1 { font-size: 2.5rem; margin-bottom: 1rem; color: #00d4ff; }
p { margin-bottom: 1rem; opacity: 0.8; }
button {
  background: #00d4ff;
  color: #0f0f23;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.1s;
}
button:hover { transform: scale(1.05); }`,
    },
    {
      id: uuidv4(), name: 'script.js', path: '/script.js', type: 'file', language: 'javascript',
      content: `let count = 0;
const btn = document.getElementById('btn');
const counter = document.getElementById('counter');

btn.addEventListener('click', () => {
  count++;
  counter.textContent = 'Count: ' + count;
});

console.log('Script loaded!');`,
    },
  ],
  react: [
    {
      id: uuidv4(), name: 'index.html', path: '/index.html', type: 'file', language: 'html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>React App</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; background: #1a1a2e; color: #e8e8e8; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .app { text-align: center; padding: 2rem; }
    h1 { color: #61dafb; font-size: 2.5rem; margin-bottom: 1rem; }
    button { background: #61dafb; color: #1a1a2e; border: none; padding: 0.75rem 2rem; border-radius: 8px; font-size: 1rem; cursor: pointer; font-weight: 600; margin: 0.5rem; }
    button:hover { opacity: 0.9; }
    p { margin: 1rem 0; opacity: 0.8; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" src="App.jsx"></script>
</body>
</html>`,
    },
    {
      id: uuidv4(), name: 'App.jsx', path: '/App.jsx', type: 'file', language: 'javascript',
      content: `const { useState } = React;

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>Count: <strong>{count}</strong></p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}

function App() {
  return (
    <div className="app">
      <h1>⚛️ React in DevBox</h1>
      <p>A live React environment — no build step needed!</p>
      <Counter />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);`,
    },
  ],
  blank: [
    {
      id: uuidv4(), name: 'index.html', path: '/index.html', type: 'file', language: 'html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>New Project</title>
</head>
<body>
  <h1>Start coding!</h1>
</body>
</html>`,
    },
  ],
};

// GET all projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({}, 'name description template createdAt updatedAt').sort({ updatedAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single project
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create project
router.post('/', async (req, res) => {
  try {
    const { name, description, template = 'vanilla' } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name is required' });

    const templateFiles = (TEMPLATES[template] || TEMPLATES.vanilla).map(f => ({
      ...f,
      id: uuidv4(),
    }));

    const project = new Project({
      name,
      description,
      template,
      files: templateFiles,
      entryFile: 'index.html',
    });

    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update project metadata
router.put('/:id', async (req, res) => {
  try {
    const { name, description, lastOpenedFile } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;
    if (lastOpenedFile !== undefined) update.lastOpenedFile = lastOpenedFile;

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    );
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE project
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  path: { type: String, required: true },
  type: { type: String, enum: ['file', 'folder'], default: 'file' },
  content: { type: String, default: '' },
  language: { type: String, default: 'javascript' },
  parentId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const PackageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  version: { type: String, default: 'latest' },
  installedAt: { type: Date, default: Date.now },
});

const ProjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    template: {
      type: String,
      enum: ['vanilla', 'react', 'vue', 'node', 'blank'],
      default: 'vanilla',
    },
    files: [FileSchema],
    packages: [PackageSchema],
    entryFile: { type: String, default: 'index.html' },
    sessionId: { type: String },
    lastOpenedFile: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', ProjectSchema);

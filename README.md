# 🚀 DevBox — Browser-Based Coding Sandbox

DevBox is a full-stack MERN application that provides a browser-based IDE where developers can create, edit, and preview web projects directly in the browser — without any local setup.

---

## 📌 Overview

DevBox simulates a lightweight development environment similar to VS Code, enabling users to:
- Create and manage projects
- Edit code in a browser-based editor
- Preview output in real time
- Work without installing tools locally

---

## ✨ Features

- 🧑‍💻 Browser-based code editor (Monaco Editor)
- 📁 File & project management system
- ⚡ Real-time live preview
- 🔄 Auto updates using JavaScript
- 📦 Package handling support
- 💾 State persistence using Zustand
- 🌐 No local setup required

---

## 🧠 Tech Stack

### Frontend
- React 18
- Zustand (state management)
- Monaco Editor (VS Code engine)

### Backend
- Node.js
- Express.js

### Database
- MongoDB (with Mongoose)

### Real-Time Communication
- Socket.IO (for live updates)

---

## 🏗️ Architecture

The application follows a **component-based architecture**:

- **Frontend**
  - UI built using reusable React components
  - Global state handled via Zustand
  - Editor powered by Monaco

- **Backend**
  - REST API built with Express
  - Handles project, file, and package operations

- **Database**
  - Stores project data as nested documents
  - Files are embedded within project objects

---

## 📂 Project Structure
devbox/
│
├── client/ # Frontend (React)
│ ├── components/
│ ├── hooks/
│ ├── store/
│ └── utils/
│
├── server/ # Backend (Node + Express)
│ ├── models/
│ ├── routes/
│ └── index.js
│
├── README.md
└── package.json


---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)

---


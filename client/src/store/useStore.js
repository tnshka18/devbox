import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const API = '/api';

export const useStore = create(
  persist(
    (set, get) => ({
      // Projects list
      projects: [],
      currentProject: null,
      
      // File state
      files: [],
      activeFileId: null,
      openTabs: [],
      
      // Packages
      packages: [],
      
      // UI state
      isLoading: false,
      previewKey: 0, // increment to force preview reload
      sidebarWidth: 240,
      showPackagePanel: false,
      theme: 'dark',

      // ─── Projects ───────────────────────────────────────────────────────
      fetchProjects: async () => {
        set({ isLoading: true });
        try {
          const { data } = await axios.get(`${API}/projects`);
          set({ projects: data, isLoading: false });
        } catch (e) {
          set({ isLoading: false });
          throw e;
        }
      },

      createProject: async (name, description, template) => {
        const { data } = await axios.post(`${API}/projects`, { name, description, template });
        set(s => ({ projects: [data, ...s.projects] }));
        return data;
      },

      deleteProject: async (id) => {
        await axios.delete(`${API}/projects/${id}`);
        set(s => ({ projects: s.projects.filter(p => p._id !== id) }));
        if (get().currentProject?._id === id) {
          set({ currentProject: null, files: [], activeFileId: null, openTabs: [] });
        }
      },

      loadProject: async (id) => {
        set({ isLoading: true });
        try {
          const { data } = await axios.get(`${API}/projects/${id}`);
          const activeFileId = data.lastOpenedFile || 
            data.files.find(f => f.type === 'file')?.id || null;
          set({
            currentProject: data,
            files: data.files,
            packages: data.packages || [],
            activeFileId,
            openTabs: activeFileId ? [activeFileId] : [],
            isLoading: false,
          });
        } catch (e) {
          set({ isLoading: false });
          throw e;
        }
      },

      // ─── Files ──────────────────────────────────────────────────────────
      setActiveFile: (fileId) => {
        const { openTabs, currentProject } = get();
        const newTabs = openTabs.includes(fileId) ? openTabs : [...openTabs, fileId];
        set({ activeFileId: fileId, openTabs: newTabs });
        // Persist last opened file
        if (currentProject) {
          axios.put(`${API}/projects/${currentProject._id}`, { lastOpenedFile: fileId }).catch(() => {});
        }
      },

      closeTab: (fileId) => {
        const { openTabs, activeFileId } = get();
        const newTabs = openTabs.filter(id => id !== fileId);
        let newActive = activeFileId;
        if (activeFileId === fileId) {
          const idx = openTabs.indexOf(fileId);
          newActive = newTabs[Math.max(0, idx - 1)] || newTabs[0] || null;
        }
        set({ openTabs: newTabs, activeFileId: newActive });
      },

      createFile: async (name, type = 'file', parentId = null, content = '') => {
        const { currentProject } = get();
        if (!currentProject) return;
        const { data } = await axios.post(`${API}/files/${currentProject._id}`, {
          name, type, parentId, content,
        });
        set(s => ({ files: [...s.files, data] }));
        if (type === 'file') get().setActiveFile(data.id);
        return data;
      },

      updateFileContent: async (fileId, content) => {
        const { currentProject, files } = get();
        if (!currentProject) return;
        // Optimistic update
        set({ files: files.map(f => f.id === fileId ? { ...f, content } : f) });
        set(s => ({ previewKey: s.previewKey + 1 }));
        try {
          await axios.put(`${API}/files/${currentProject._id}/${fileId}`, { content });
        } catch (e) {
          console.error('Failed to save file:', e);
        }
      },

      renameFile: async (fileId, name) => {
        const { currentProject } = get();
        if (!currentProject) return;
        const { data } = await axios.put(`${API}/files/${currentProject._id}/${fileId}`, { name });
        set(s => ({ files: s.files.map(f => f.id === fileId ? { ...f, name: data.name, path: data.path } : f) }));
      },

      deleteFile: async (fileId) => {
        const { currentProject } = get();
        if (!currentProject) return;
        const { data } = await axios.delete(`${API}/files/${currentProject._id}/${fileId}`);
        set(s => ({
          files: s.files.filter(f => !data.deletedIds.includes(f.id)),
          openTabs: s.openTabs.filter(id => !data.deletedIds.includes(id)),
          activeFileId: data.deletedIds.includes(s.activeFileId)
            ? (s.openTabs.find(id => !data.deletedIds.includes(id)) || null)
            : s.activeFileId,
        }));
      },

      // ─── Packages ───────────────────────────────────────────────────────
      installPackage: async (name, version) => {
        const { currentProject } = get();
        if (!currentProject) return;
        const { data } = await axios.post(`${API}/packages/${currentProject._id}`, { name, version });
        set(s => ({ packages: [...s.packages, data], previewKey: s.previewKey + 1 }));
        return data;
      },

      uninstallPackage: async (name) => {
        const { currentProject } = get();
        if (!currentProject) return;
        await axios.delete(`${API}/packages/${currentProject._id}/${name}`);
        set(s => ({
          packages: s.packages.filter(p => p.name !== name),
          previewKey: s.previewKey + 1,
        }));
      },

      // ─── Helpers ────────────────────────────────────────────────────────
      getActiveFile: () => {
        const { files, activeFileId } = get();
        return files.find(f => f.id === activeFileId) || null;
      },

      setShowPackagePanel: (v) => set({ showPackagePanel: v }),
      setTheme: (t) => set({ theme: t }),

      // Socket updates from other clients
      applyRemoteFileUpdate: ({ fileId, content }) => {
        set(s => ({ files: s.files.map(f => f.id === fileId ? { ...f, content } : f) }));
      },
    }),
    {
      name: 'devbox-storage',
      partialize: (state) => ({
        // Only persist lightweight UI prefs, not full file content
        theme: state.theme,
        sidebarWidth: state.sidebarWidth,
      }),
    }
  )
);

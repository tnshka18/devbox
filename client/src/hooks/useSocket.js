import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useStore } from '../store/useStore';

export function useSocket() {
  const socketRef = useRef(null);
  const currentProject = useStore(s => s.currentProject);
  const applyRemoteFileUpdate = useStore(s => s.applyRemoteFileUpdate);

  useEffect(() => {
    const socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => console.log('Socket connected:', socket.id));
    socket.on('disconnect', () => console.log('Socket disconnected'));

    socket.on('file-updated', applyRemoteFileUpdate);

    return () => {
      socket.disconnect();
    };
  }, [applyRemoteFileUpdate]);

  // Join project room when project changes
  useEffect(() => {
    if (currentProject && socketRef.current) {
      socketRef.current.emit('join-project', currentProject._id);
    }
  }, [currentProject?._id]);

  const emitFileChange = (projectId, fileId, content) => {
    socketRef.current?.emit('file-change', { projectId, fileId, content });
  };

  return { emitFileChange };
}

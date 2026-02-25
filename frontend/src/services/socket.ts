import { Socket, io } from 'socket.io-client';

let socket: Socket | null = null;

const resolveSocketUrl = (): string => {
  return "https://fraudapi.whiteocean-c75706ba.centralindia.azurecontainerapps.io";
};

export const connectSocket = (): Socket => {
  if (socket) return socket;

  const token = localStorage.getItem('token');
  socket = io(resolveSocketUrl(), {
    transports: ['websocket'],
    auth: token ? { token } : undefined
  });

  return socket;
};

export const disconnectSocket = (): void => {
  if (!socket) return;
  socket.disconnect();
  socket = null;
};

export const getSocket = (): Socket | null => socket;

import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket } from '../services/socket';

export const useSocket = () => {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const s = getSocket();
        setSocket(s);

        // No need to disconnect here as it's shared
        return () => { };
    }, []);

    return { socket };
};

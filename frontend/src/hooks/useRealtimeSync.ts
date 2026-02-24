import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectSocket, getSocket } from '../services/socket';

export const useRealtimeSync = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket() ?? connectSocket();

    const onLive = () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transactions-query'] }),
        queryClient.invalidateQueries({ queryKey: ['alerts'] }),
        queryClient.invalidateQueries({ queryKey: ['cases'] }),
        queryClient.invalidateQueries({ queryKey: ['model-health'] })
      ]);
    };

    const onAlert = () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['alerts'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
      ]);
    };

    const onSystem = () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['system-health'] }),
        queryClient.invalidateQueries({ queryKey: ['system-ml-status'] })
      ]);
    };

    socket.on('transactions.live', onLive);
    socket.on('fraud.alerts', onAlert);
    socket.on('system.status', onSystem);

    return () => {
      socket.off('transactions.live', onLive);
      socket.off('fraud.alerts', onAlert);
      socket.off('system.status', onSystem);
    };
  }, [queryClient]);
};

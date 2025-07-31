import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinHotelRoom: (hotelId: string) => void;
  leaveHotelRoom: (hotelId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated, token } = useAuth();

  useEffect(() => {
    if (isAuthenticated && token) {
      // Initialize socket connection
      const newSocket = io(SOCKET_SERVER_URL, {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setIsConnected(false);
      });

      // Room availability updates
      newSocket.on('room-availability-changed', (data) => {
        console.log('Room availability changed:', data);
        // Emit custom event for components to listen to
        window.dispatchEvent(new CustomEvent('roomAvailabilityChanged', { detail: data }));
      });

      // Booking confirmation updates
      newSocket.on('booking-confirmed', (data) => {
        console.log('Booking confirmed:', data);
        window.dispatchEvent(new CustomEvent('bookingConfirmed', { detail: data }));
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
      };
    } else {
      // Disconnect socket if not authenticated
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [isAuthenticated, token]);

  const joinHotelRoom = (hotelId: string) => {
    if (socket && isConnected) {
      socket.emit('join-hotel', hotelId);
      console.log(`Joined hotel room: ${hotelId}`);
    }
  };

  const leaveHotelRoom = (hotelId: string) => {
    if (socket && isConnected) {
      socket.emit('leave-hotel', hotelId);
      console.log(`Left hotel room: ${hotelId}`);
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    joinHotelRoom,
    leaveHotelRoom,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
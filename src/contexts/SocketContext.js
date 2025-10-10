import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const reconnectTimeoutRef = useRef(null);
  const webhookHandlerRef = useRef(null);

  useEffect(() => {
    console.log('[Socket] Initializing Socket.IO connection...');
    
    // Create Socket.IO connection with resilient options (matching netomi-integration.js)
    const socketInstance = io('http://localhost:3001', {
      transports: ['websocket'], // prefer WS
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000 // connection timeout
    });

    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log(`[Socket] Connected: ${socketInstance.id}`);
      setIsConnected(true);
      setConnectionError(false);
      
      // Send client info (matching netomi-integration.js)
      console.log('[Socket] Sending client info...');
      socketInstance.emit('authenticate', {
        clientInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          page: 'rexy-chat'
        }
      });
    });

    socketInstance.on('connected', (data) => {
      console.log('[Socket] Initial connection confirmed:', data);
    });

    socketInstance.on('authenticated', (data) => {
      console.log('[Socket] Authenticated:', data);
    });

    // Webhook update handler (matching rexy.js)
    socketInstance.on('webhook_update', (data, serverAck) => {
      console.log('[Socket] Received webhook update:', data);
      
      if (data.message && data.message.data) {
        // Call the webhook handler if it's registered
        if (webhookHandlerRef.current) {
          webhookHandlerRef.current(data.message.data);
        } else {
          console.warn('[Socket] Webhook handler not registered yet');
        }
      }

      // Always acknowledge to server
      try {
        if (typeof serverAck === 'function') {
          serverAck({ ok: true, receivedAt: Date.now(), deliveryId: data && data.deliveryId });
        }
      } catch (e) {
        console.warn('[Socket] Failed to acknowledge webhook:', e);
      }
    });

    socketInstance.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${reason}`);
      setIsConnected(false);
      
      // Show connection error for transport errors or ping timeouts
      if (reason === 'transport close' || reason === 'ping timeout' || reason === 'transport error') {
        setConnectionError(true);
      }
      
      // Try to reconnect
      if (!socketInstance.connected) {
        try {
          socketInstance.connect();
        } catch (e) {
          console.warn('[Socket] Failed to reconnect:', e);
        }
      }
    });

    socketInstance.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
      setIsConnected(false);
      
      // Show connection error for websocket errors
      if (error && (error.type === 'TransportError' || error.message.includes('websocket'))) {
        setConnectionError(true);
      }
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      console.log('[Socket] Cleaning up socket connection...');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      socketInstance.disconnect();
    };
  }, []);

  // Function to register webhook handler (matching rexy.js pattern)
  const registerWebhookHandler = (handler) => {
    console.log('[Socket] Registering webhook handler');
    webhookHandlerRef.current = handler;
  };

  // Function to unregister webhook handler
  const unregisterWebhookHandler = () => {
    console.log('[Socket] Unregistering webhook handler');
    webhookHandlerRef.current = null;
  };

  // Function to ensure socket is connected (matching netomi-integration.js)
  const ensureConnected = async (timeoutMs = 3000) => {
    if (!socket) {
      console.warn('[Socket] Socket not initialized');
      return false;
    }

    if (socket.connected) {
      return true;
    }

    try {
      await new Promise((resolve, reject) => {
        const start = Date.now();
        const onConnect = () => {
          socket.off('connect_error', onError);
          resolve();
        };
        const onError = (err) => {
          if (Date.now() - start >= timeoutMs) {
            socket.off('connect', onConnect);
            socket.off('connect_error', onError);
            reject(err);
          }
        };
        const timer = setTimeout(() => {
          socket.off('connect', onConnect);
          socket.off('connect_error', onError);
          reject(new Error('Socket connect timeout'));
        }, timeoutMs);
        
        socket.once('connect', () => {
          clearTimeout(timer);
          onConnect();
        });
        socket.on('connect_error', onError);
        
        if (!socket.connected) {
          try {
            socket.connect();
          } catch (e) {
            console.warn('[Socket] Failed to initiate connection:', e);
          }
        }
      });
      return socket.connected;
    } catch (e) {
      console.warn('[Socket] ensureConnected failed:', e?.message || e);
      return false;
    }
  };

  const value = {
    socket,
    isConnected,
    connectionError,
    registerWebhookHandler,
    unregisterWebhookHandler,
    ensureConnected
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

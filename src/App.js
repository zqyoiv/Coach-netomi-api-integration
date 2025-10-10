import React from 'react';
import ChatContainer from './components/ChatContainer';
import { SocketProvider } from './contexts/SocketContext';

function App() {
  return (
    <SocketProvider>
      <div className="App">
        <ChatContainer />
      </div>
    </SocketProvider>
  );
}

export default App;

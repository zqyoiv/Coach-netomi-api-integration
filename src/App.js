import React, { useEffect } from 'react';
import ChatContainer from './components/ChatContainer';
import { SocketProvider } from './contexts/SocketContext';
import { useAssetPreloader } from './hooks/useAssetPreloader';

function App() {
  const { isWelcomeReady, isAllReady, loadedCount, totalCount } = useAssetPreloader();

  useEffect(() => {
    if (isWelcomeReady) {
      console.log('✅ Welcome animation ready - page can start showing content');
    }
  }, [isWelcomeReady]);

  useEffect(() => {
    if (isAllReady) {
      console.log(`✅ All assets preloaded (${loadedCount}/${totalCount})`);
    }
  }, [isAllReady, loadedCount, totalCount]);

  return (
    <SocketProvider>
      <div className="App">
        <ChatContainer />
      </div>
    </SocketProvider>
  );
}

export default App;

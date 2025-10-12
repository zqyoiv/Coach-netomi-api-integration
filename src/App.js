import React, { useEffect } from 'react';
import ChatContainer from './components/ChatContainer';
import { SocketProvider } from './contexts/SocketContext';
import { useAssetPreloader } from './hooks/useAssetPreloader';
import debug from './utils/debug';

function App() {
  const { isWelcomeReady, isAllReady, loadedCount, totalCount } = useAssetPreloader();

  useEffect(() => {
    if (isWelcomeReady) {
      debug.log('✅ Welcome animation ready - page can start showing content');
    }
  }, [isWelcomeReady]);

  useEffect(() => {
    if (isAllReady) {
      debug.log(`✅ All assets preloaded (${loadedCount}/${totalCount})`);
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

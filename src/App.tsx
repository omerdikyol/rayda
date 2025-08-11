import { useState, useEffect } from 'react';
import LazyMap from './components/LazyMap';
import Sidebar from './components/Sidebar';
import StatusBar from './components/StatusBar';
import StationSelector from './components/StationSelector';
import RoutePlanner from './components/RoutePlanner';
import { LanguageProvider } from './contexts/LanguageContext';
import './App.css';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      // Close sidebar on mobile by default
      if (mobile) {
        setIsSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMenuClick = () => {
    setIsSidebarOpen(true);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  return (
    <LanguageProvider>
      <div className="h-screen flex flex-col bg-gray-900">
        {/* Status Bar */}
        <StatusBar onMenuClick={handleMenuClick} />

        {/* Main Content */}
        <div className="flex-1 flex relative">
          {/* Sidebar - Desktop always visible, Mobile overlay */}
          {isMobile ? (
            <Sidebar 
              isOpen={isSidebarOpen} 
              onClose={handleSidebarClose} 
              isMobile={true}
            />
          ) : (
            <Sidebar />
          )}
          
          {/* Map Container */}
          <div className="flex-1 relative">
            <LazyMap />
            
            {/* Overlay Components */}
            <StationSelector />
            <RoutePlanner />
          </div>
        </div>
      </div>
    </LanguageProvider>
  );
}

export default App;
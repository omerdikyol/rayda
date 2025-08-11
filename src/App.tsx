import LazyMap from './components/LazyMap';
import StatusBar from './components/StatusBar';
import StationSelector from './components/StationSelector';
import RoutePlanner from './components/RoutePlanner';
import { LanguageProvider } from './contexts/LanguageContext';
import './App.css';

function App() {
  return (
    <LanguageProvider>
      <div className="h-screen flex flex-col bg-gray-900">
        {/* Status Bar */}
        <StatusBar />

        {/* Main Content */}
        <div className="flex-1 relative">
          <LazyMap />
          
          {/* Overlay Components */}
          <StationSelector />
          <RoutePlanner />
        </div>
      </div>
    </LanguageProvider>
  );
}

export default App;
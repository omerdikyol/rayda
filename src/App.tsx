import Map from './components/Map';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Rayda
              </h1>
              <span className="ml-3 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                Beta
              </span>
            </div>
            <p className="text-sm text-gray-600 hidden sm:block">
              Real-time Marmaray Train Simulation
            </p>
          </div>
        </div>
      </header>

      {/* Map Container */}
      <main className="h-[calc(100vh-73px)]">
        <Map className="w-full h-full" />
      </main>
    </div>
  );
}

export default App;

import { lazy, Suspense } from 'react';
import { MapPin } from 'lucide-react';

// Lazy load the heavy Map component
const Map = lazy(() => import('./Map'));

const MapSkeleton = () => {
  return (
    <div className="relative w-full h-full bg-gray-100 animate-pulse">
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <MapPin className="w-12 h-12 text-gray-400 mb-4" />
        <div className="text-gray-600 font-medium">Loading map...</div>
        <div className="text-sm text-gray-500 mt-2">This may take a moment</div>
        
        {/* Loading bar */}
        <div className="w-48 h-1 bg-gray-300 rounded-full mt-4 overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full animate-loading-bar"></div>
        </div>
      </div>
      
      {/* Fake station points for visual feedback */}
      <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-gray-400 rounded-full"></div>
      <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-gray-400 rounded-full"></div>
      <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-gray-400 rounded-full"></div>
      <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-gray-400 rounded-full"></div>
    </div>
  );
};

const LazyMap = () => {
  return (
    <Suspense fallback={<MapSkeleton />}>
      <Map />
    </Suspense>
  );
};

export default LazyMap;
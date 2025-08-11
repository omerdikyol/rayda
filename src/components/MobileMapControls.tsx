import { Plus, Minus, Navigation2, Maximize2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface MobileMapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRecenter: () => void;
  onFullscreen?: () => void;
}

const MobileMapControls = ({ 
  onZoomIn, 
  onZoomOut, 
  onRecenter,
  onFullscreen 
}: MobileMapControlsProps) => {
  const { t } = useLanguage();

  return (
    <div className="lg:hidden fixed bottom-32 right-4 z-30 flex flex-col gap-2">
      {/* Zoom In */}
      <button
        onClick={onZoomIn}
        className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
        aria-label={t('zoomIn') || 'Zoom in'}
      >
        <Plus className="w-6 h-6 text-gray-700" />
      </button>

      {/* Zoom Out */}
      <button
        onClick={onZoomOut}
        className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
        aria-label={t('zoomOut') || 'Zoom out'}
      >
        <Minus className="w-6 h-6 text-gray-700" />
      </button>

      {/* Recenter */}
      <button
        onClick={onRecenter}
        className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
        aria-label={t('recenter') || 'Recenter map'}
      >
        <Navigation2 className="w-6 h-6 text-gray-700" />
      </button>

      {/* Fullscreen (optional) */}
      {onFullscreen && (
        <button
          onClick={onFullscreen}
          className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
          aria-label={t('fullscreen') || 'Fullscreen'}
        >
          <Maximize2 className="w-6 h-6 text-gray-700" />
        </button>
      )}
    </div>
  );
};

export default MobileMapControls;
import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../services/mapsLoader';
import { Loader2, Crosshair, MapPin, Navigation } from 'lucide-react';

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelect, initialLat, initialLng }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapInstance = useRef<any>(null);

  // Default to Brazil center (Cerrado/Mato Grosso area) if no initial pos
  const defaultCenter = { lat: -12.97, lng: -55.51 }; 

  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      try {
        await loadGoogleMaps();
        
        if (!isMounted || !mapRef.current) return;

        const google = (window as any).google;
        const center = (initialLat && initialLng) 
          ? { lat: initialLat, lng: initialLng } 
          : defaultCenter;

        // Create Map
        const map = new google.maps.Map(mapRef.current, {
          center: center,
          zoom: (initialLat && initialLng) ? 15 : 4,
          mapTypeId: 'hybrid', // Satellite + Labels (Best for farmers)
          disableDefaultUI: true, // Clean UI
          zoomControl: true,
        });

        mapInstance.current = map;

        // Listen for drag end to update coordinates (The "Crosshair" logic)
        map.addListener('center_changed', () => {
          const newCenter = map.getCenter();
          onLocationSelect(newCenter.lat(), newCenter.lng());
        });
        
        // Initial set
        if(initialLat && initialLng) {
             onLocationSelect(initialLat, initialLng);
        }

        setIsLoading(false);

      } catch (err: any) {
        console.error(err);
        if (isMounted) {
            setError("Erro ao carregar Google Maps. Verifique a chave de API.");
            setIsLoading(false);
        }
      }
    };

    initMap();

    return () => { isMounted = false; };
  }, []);

  const handleLocateMe = () => {
    if (navigator.geolocation && mapInstance.current) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          mapInstance.current.setCenter(pos);
          mapInstance.current.setZoom(17);
        },
        () => {
          alert("Erro ao obter localização GPS.");
        }
      );
    }
  };

  if (error) {
    return (
      <div className="w-full h-64 bg-gray-100 dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center text-gray-50 p-6 text-center border-2 border-dashed border-gray-300 dark:border-slate-600">
        <MapPin size={32} className="mb-2 opacity-50"/>
        <p className="font-bold">{error}</p>
        <p className="text-xs mt-2">Adicione VITE_GOOGLE_MAPS_API_KEY no .env</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-slate-600 group">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-slate-800 flex items-center justify-center z-20">
          <Loader2 className="animate-spin text-agro-green" size={32} />
        </div>
      )}
      
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full bg-gray-200" />

      {/* Fixed Crosshair (The "Pin") */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 text-red-500 drop-shadow-md">
         <Crosshair size={40} strokeWidth={2} />
      </div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 mt-6 pointer-events-none z-10">
         <span className="bg-black/70 text-white text-[10px] px-2 py-1 rounded-full font-bold backdrop-blur-sm">
            Área Central
         </span>
      </div>

      {/* GPS Button */}
      <button 
        onClick={handleLocateMe}
        className="absolute bottom-4 right-4 bg-white dark:bg-slate-800 p-3 rounded-full shadow-lg text-gray-700 dark:text-gray-200 hover:text-agro-green transition-colors z-10 active:scale-95"
        title="Minha Localização"
      >
        <Navigation size={20} />
      </button>
    </div>
  );
};
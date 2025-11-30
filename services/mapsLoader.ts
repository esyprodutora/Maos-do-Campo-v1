
import { GOOGLE_MAPS_API_KEY } from "../config/env";

// Singleton to load Google Maps script only once
let googleMapsPromise: Promise<void> | null = null;

export const loadGoogleMaps = (): Promise<void> => {
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (typeof window !== 'undefined' && (window as any).google && (window as any).google.maps) {
      resolve();
      return;
    }

    const apiKey = GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.warn("⚠️ Google Maps API Key não encontrada nas variáveis de ambiente (VITE_GOOGLE_MAPS_API_KEY ou VITE_API_KEY).");
      // Opcional: Rejeitar ou deixar falhar silenciosamente dependendo da estratégia
      // reject(new Error("Google Maps API Key not found.")); 
    }

    const script = document.createElement('script');
    // Carrega com a chave se existir, ou sem chave (modo desenvolvimento limitado) se não existir
    const src = apiKey 
      ? `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
      : `https://maps.googleapis.com/maps/api/js?libraries=places`;
      
    script.src = src;
    script.async = true;
    script.defer = true;
    
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    
    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

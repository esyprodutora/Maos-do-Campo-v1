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

    // @ts-ignore
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY : '');

    if (!apiKey) {
      reject(new Error("Google Maps API Key not found. Add VITE_GOOGLE_MAPS_API_KEY to env."));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    
    document.head.appendChild(script);
  });

  return googleMapsPromise;
};
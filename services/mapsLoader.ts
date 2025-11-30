
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

    let apiKey = '';
    
    // 1. Try safe import.meta.env (Vite standard)
    try {
      // @ts-ignore
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        // @ts-ignore
        apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_API_KEY;
      }
    } catch (e) {
      // Ignore
    }

    // 2. Fallback to process.env (Node/Next.js/Webpack standard)
    if (!apiKey && typeof process !== 'undefined' && process.env) {
      apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.API_KEY || '';
    }

    if (!apiKey) {
      // Last resort: try to find any key in env
      console.warn("Google Maps API Key specific var not found, trying generics...");
    }

    if (!apiKey) {
       // Allow loading without key for development (might show watermark or error in console but wont crash app logic)
       console.error("No Google Maps API Key found.");
    }

    const script = document.createElement('script');
    // Append key if found, otherwise load without (some features might work with warnings)
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

import React, { useEffect, useRef, useState, useMemo } from 'react';
import Globe from 'react-globe.gl';

const GlobeVisualization = ({
  title,
  globeImageUrl,
  bumpImageUrl,
  geojsonUrl,
  geojsonPropertyName = 'GERMAN_NAME',
  valuePropertyName = 'mean',
  initialViewPoint = { lat: 30, lng: 10, altitude: 1.5 },
  autoRotateSpeed = 0.35,
}) => {
  const globeEl = useRef();
  const [countries, setCountries] = useState({ features: [] });
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize dimensions only once
  const [dimensions, setDimensions] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight * 0.7
  }));

  // Create stable reference for initialViewPoint to prevent unnecessary re-renders
  const stableInitialViewPoint = useMemo(
    () => initialViewPoint,
    [initialViewPoint.lat, initialViewPoint.lng, initialViewPoint.altitude]
  );

  // Handle window resize with threshold to prevent excessive updates
  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight * 0.7;
      
      // Only update if dimensions changed by more than 10 pixels
      setDimensions(prevDimensions => {
        const widthDiff = Math.abs(prevDimensions.width - newWidth);
        const heightDiff = Math.abs(prevDimensions.height - newHeight);
        
        if (widthDiff < 10 && heightDiff < 10) {
          return prevDimensions;
        }
        
        return { width: newWidth, height: newHeight };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Consolidated globe setup - runs once only
  useEffect(() => {
    if (!globeEl.current) return;

    const globe = globeEl.current;

    // Auto-rotate
    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = autoRotateSpeed;

    // Set beginning coordinates
    globe.pointOfView(stableInitialViewPoint);

    // Pause auto-rotation when tab is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        globe.controls().autoRotate = false;
      } else {
        globe.controls().autoRotate = true;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // Empty dependency array - run once only

  useEffect(() => {
    if (!geojsonUrl) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    fetch(geojsonUrl)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setCountries(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error loading GeoJSON:', err);
        setIsLoading(false);
      });
  }, [geojsonUrl]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: 'Arial, sans-serif',
          fontSize: '18px',
          zIndex: 1000
        }}>
          Lade Globus...
        </div>
      )}
      <Globe
        ref={globeEl}
        width={dimensions.width}
        height={dimensions.height}
        animateIn={false}
        showAtmosphere={false}
        globeImageUrl={globeImageUrl}
        bumpImageUrl={bumpImageUrl}
        backgroundColor="#ffffff"
        polygonsData={countries.features || []}
        polygonAltitude={0.06}
        polygonCapColor={() => 'rgba(0,0,0,0)'}
        polygonSideColor={() => 'rgba(0,0,0,0)'}
        polygonStrokeColor={() => '#000'}
        polygonLabel={({ properties: d }) => {
          const value = d?.[valuePropertyName];
          const name = d?.[geojsonPropertyName];

          if (value === undefined || name === undefined) return '';

          return `
            <div class='overlay-box'>
              <div class='overlay-text'>
                <b>${name}</b><br>
                <big><i>${(value < 0 ? "" : "+") + String(Math.round(value * 10) / 10).replace('.', ',')}°C</i></big><br>
                <small>im Vergleich zum<br>Durchschnitt 1961-1990</small>
              </div>
            </div>
          `;
        }}
        polygonsTransitionDuration={300}
      />
    </div>
  );
};

export default GlobeVisualization;

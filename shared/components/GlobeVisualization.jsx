import React, { useEffect, useRef, useState } from 'react';
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
  const [hoverD, setHoverD] = useState(null);

  // Calculate dimensions directly without state
  const h = window.innerHeight;

  useEffect(() => {
    if (!globeEl.current) return;

    const globe = globeEl.current;

    // Auto-rotate
    globe.controls().autoRotate = false;
    globe.controls().autoRotateSpeed = 0;

    // Set beginning coordinates
    globe.pointOfView(initialViewPoint);

    // Pause auto-rotation when tab is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        globe.controls().autoRotate = false;
      } else {
        globe.controls().autoRotate = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [autoRotateSpeed, initialViewPoint]);

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
        width={window.innerWidth}
        height={h * 0.7}
        animateIn={false}
        showAtmosphere={false}
        globeImageUrl={globeImageUrl}
        bumpImageUrl={bumpImageUrl}
        backgroundColor="#ffffff"
        lineHoverPrecision={0}
        polygonsData={countries.features || []}
        polygonAltitude={0.001}
        polygonCapColor={() => 'rgba(0,0,0,0.01)'}
        polygonSideColor={() => 'rgba(0,0,0,0)'}
        polygonStrokeColor={() => '#000'}
        onPolygonHover={setHoverD}
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

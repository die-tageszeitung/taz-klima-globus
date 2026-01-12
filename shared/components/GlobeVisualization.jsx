import React, { useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';

const GlobeVisualization = ({
  title,
  globeImageUrl,
  bumpImageUrl,
  geojsonUrl,
  geojsonPropertyName = 'GERMAN_NAME',
  valuePropertyName = 'mean',
  height = window.innerHeight * 0.7,
  initialViewPoint = { lat: 30, lng: 10, altitude: 1.5 },
  autoRotateSpeed = 0.35,
}) => {
  const globeEl = useRef();
  const [countries, setCountries] = useState({ features: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!globeEl.current) return;

    const globe = globeEl.current;

    // Auto-rotate
    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = autoRotateSpeed;

    // Set beginning coordinates
    globe.pointOfView(initialViewPoint);

    // Pause auto-rotation when tab is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        globe.controls().autoRotate = false;
      } else {
        globe.controls().autoRotate = true;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [autoRotateSpeed, initialViewPoint]);

  useEffect(() => {
    if (!globeEl.current) return;

    const globe = globeEl.current;

    // Auto-rotate
    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = autoRotateSpeed;

    // Set beginning coordinates
    globe.pointOfView(initialViewPoint);
  }, [autoRotateSpeed, initialViewPoint]);

  useEffect(() => {
    // Load GeoJSON data
    if (!geojsonUrl) {
      console.log('No GeoJSON URL provided');
      setIsLoading(false);
      return;
    }

    console.log('Loading GeoJSON from:', geojsonUrl);
    setIsLoading(true);

    fetch(geojsonUrl)
      .then(res => {
        console.log('GeoJSON response status:', res.status);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('GeoJSON loaded successfully:', data);
        console.log('Number of features:', data.features?.length);
        if (data.features?.length > 0) {
          console.log('First feature:', data.features[0]);
        }
        setCountries(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error loading GeoJSON:', err);
        setIsLoading(false);
      });
  }, [geojsonUrl]);

  console.log('Rendering globe with', countries.features?.length || 0, 'polygons');

  return (
    <>
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
        animateIn={true}
        showAtmosphere={false}
        height={height}
        globeImageUrl={globeImageUrl}
        bumpImageUrl={bumpImageUrl}
        backgroundColor="#ffffff"
        lineHoverPrecision={0}
        polygonsData={countries.features || []}
        polygonAltitude={0.001}
        polygonCapColor={() => 'rgba(0,0,0,0)'}
        polygonSideColor={() => 'rgba(0,0,0,0)'}
        polygonStrokeColor={() => '#000'}
        polygonLabel={({ properties: d }) => `
        <div class='overlay-box'>
          <div class='overlay-text'><b>${d.GERMAN_NAME}</b><br>
            <big><i>${(d.mean<0?"":"+") + String(Math.round(d.mean * 10) / 10).replace('.',',')}°C</i></big><br>
            <small>im Vergleich zum<br>Durchschnitt 1961-1990</small>
          </div>
        </div>
      `}
        polygonsTransitionDuration={300}
      />
    </>
  );
};

export default GlobeVisualization;

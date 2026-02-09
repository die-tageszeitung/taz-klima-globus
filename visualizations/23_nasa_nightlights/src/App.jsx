import React from 'react';
import GlobeVisualization from '../../../shared/components/GlobeVisualization';

function App() {
  return (
    <div className="container">
      <header className='header'>
        <h1>NASA Night Lights</h1>
      </header>

      <div className='globe-container'>
        <GlobeVisualization
          title = "Night Lights"
          globeImageUrl="data/nightlights_2023_mid.jpg"
          initialViewPoint={{ lat: 30, lng: 10, altitude: 1.5}}
          autoRotateSpeed={0.35}
          backgroundColor="#000000"
          showAtmosphere={true}
        />
      </div>

      <footer className='footer'>
        <p>
          Source: <a href="https://svs.gsfc.nasa.gov/5276/" target="_blank" rel="noopener noreferrer">
            NASA 2023
          </a>        </p>
      </footer>
    </div>
  );
}

export default App;

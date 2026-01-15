import React from 'react';
import GlobeVisualization from '@shared/components/GlobeVisualization';
import '@shared/styles/globe-common.css';
import './styles.css';

function App() {
  return (
    <>
      <div id="wrapper" align="left">
        <h3 id="title">Wo auf der Welt war es 2025 besonders heiß?</h3>
      </div>

      <div className='my-legend'>
        <div className='legend-title'>
          Temperaturabweichung in 2 Meter Höhe in °C<br />
          im Vergleich zum Durchschnitt 1961-1990
        </div>
        <div className='legend-scale'>
          <ul className='legend-labels'>
            <li><span style={{ background: '#394dc3' }}></span>-4</li>
            <li><span style={{ background: '#8caefe' }}></span>-2</li>
            <li><span style={{ background: '#dcdddd' }}></span>0</li>
            <li><span style={{ background: '#f4997b' }}></span>+2</li>
            <li><span style={{ background: '#b50025' }}></span>+4</li>
          </ul>
        </div>
        <div className='legend-source'>
          Quelle: <a href="https://climate.copernicus.eu/surface-air-temperature-maps" target="_blank" rel="noopener noreferrer">
            Copernicus/ECMWF
          </a>
        </div>
      </div>

      <div id="globeViz" align="center" style={{ height: '100%' }}>
        <GlobeVisualization
          title="2025 Temperature Anomalies"
          globeImageUrl="data/2025_anomaly_global.webp"
          bumpImageUrl="data/textures/earth-topology.webp"
          geojsonUrl="data/ne_110_final_data_reduced.geojson"
          geojsonPropertyName="GERMAN_NAME"
          valuePropertyName="mean"
        />
      </div>
    </>
  );
}

export default App;

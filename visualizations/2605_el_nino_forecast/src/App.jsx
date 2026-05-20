import React from 'react';
import GlobeVisualization from '@shared/components/GlobeVisualization';
import '@shared/styles/globe-common.css';
import './styles.css';

function App() {
  return (
    <>
      <div id="wrapper" align="left">
        <h3 id="title">Das Wetterphänomen El Niño wird in den kommenden Monaten wohl besonders heftig ausfallen</h3>
      </div>

      <div className='my-legend'>
        <div className='legend-title'>
          Abweichung der Meeresoberflächentemperatur in °C<br />
          im Herbst 2026
        </div>
        <div className='legend-scale'>
          <ul className='legend-labels'>
            <li><span style={{ background: '#394dc3' }}></span>-2</li>
            <li><span style={{ background: '#8caefe' }}></span>-1</li>
            <li><span style={{ background: '#dcdddd' }}></span>0</li>
            <li><span style={{ background: '#f4997b' }}></span>+1</li>
            <li><span style={{ background: '#b50025' }}></span>+2</li>
          </ul>
        </div>
        <div className='legend-source'>
          Quelle: <a href="https://climate.copernicus.eu/" target="_blank" rel="noopener noreferrer">
            Copernicus/ECMWF
          </a>
        </div>
      </div>

      <div id="globeViz" align="center" style={{ height: '100%' }}>
        <GlobeVisualization
          title="2024 Temperature Anomalies"
          globeImageUrl="data/ecmwf_sst_anomaly_202605_globe_texture.webp"
          bumpImageUrl="data/earth-topology.webp"
        />
      </div>
    </>
  );
}

export default App;

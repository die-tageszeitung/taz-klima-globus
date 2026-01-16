import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import Globe from 'react-globe.gl'
import * as satellite from 'satellite.js'

const EARTH_RADIUS_KM = 6371
const TIME_STEP = 3 * 1000 // 3 seconds per frame

// OPTIMIZATION 1: Reduce update frequency
// Instead of updating every frame (60fps), update every N frames
const UPDATE_INTERVAL = 2 // Update every 2 frames = 30fps instead of 60fps

function App() {
  const globeEl = useRef()
  const [satData, setSatData] = useState([])
  const [time, setTime] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [debrisCount, setDebrisCount] = useState(0)

  // OPTIMIZATION 2: Track frame count for throttling
  const frameCountRef = useRef(0)

  // Load TLE data
  useEffect(() => {
    fetch('./data/250226_full-catalog-spacetrack_only_debakmpkmrb.txt')
      .then(response => response.text())
      .then(rawData => {
        const tleData = rawData
          .replace(/\r/g, '')
          .split(/\n(?=[^12])/)
          .filter(d => d)
          .map(tle => tle.split('\n'))

        const parsedData = tleData
          .map(([name, ...tle]) => {
            try {
              return {
                satrec: satellite.twoline2satrec(...tle),
                name: name.trim().replace(/^0 /, '')
              }
            } catch (err) {
              return null
            }
          })
          .filter(d => d !== null)
          .filter(d => {
            try {
              const result = satellite.propagate(d.satrec, new Date())
              return !!result.position
            } catch {
              return false
            }
          })

        console.log(`Loaded ${parsedData.length} trackable debris objects`)
        setSatData(parsedData)
        setDebrisCount(parsedData.length)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading TLE data:', err)
        setError('Fehler beim Laden der Satellitendaten')
        setLoading(false)
      })
  }, [])

  // OPTIMIZATION 3: Throttled animation loop
  useEffect(() => {
    let animationFrameId

    function frameTicker() {
      animationFrameId = requestAnimationFrame(frameTicker)

      // Only update every UPDATE_INTERVAL frames
      frameCountRef.current++
      if (frameCountRef.current % UPDATE_INTERVAL === 0) {
        setTime(prevTime => new Date(+prevTime + TIME_STEP))
      }
    }

    frameTicker()

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [])

  // OPTIMIZATION 4: Memoize position calculations with better filtering
  const particlesData = useMemo(() => {
    if (satData.length === 0) return []

    const gmst = satellite.gstime(time)
    const positions = []

    // Pre-allocate array size for better performance
    positions.length = satData.length
    let validCount = 0

    for (let i = 0; i < satData.length; i++) {
      const d = satData[i]

      try {
        const eci = satellite.propagate(d.satrec, time)

        if (eci.position) {
          const gdPos = satellite.eciToGeodetic(eci.position, gmst)
          const lat = satellite.radiansToDegrees(gdPos.latitude)
          const lng = satellite.radiansToDegrees(gdPos.longitude)
          const alt = gdPos.height / EARTH_RADIUS_KM

          // Quick NaN check
          if (lat === lat && lng === lng && alt === alt) {
            positions[validCount++] = {
              ...d,
              lat,
              lng,
              alt
            }
          }
        }
      } catch (err) {
        // Skip failed satellites silently
      }
    }

    // Trim array to actual valid count
    positions.length = validCount

    // Return as array of arrays (required by particlesData API)
    return [positions]
  }, [satData, time])

  // OPTIMIZATION 5: Set camera position once after loading
  useEffect(() => {
    if (globeEl.current && !loading) {
      globeEl.current.pointOfView({ altitude: 3.5 }, 1000)

      // OPTIMIZATION 6: Disable auto-rotation for better performance
      const controls = globeEl.current.controls()
      if (controls) {
        controls.autoRotate = false
        controls.enableDamping = true
        controls.dampingFactor = 0.1
        controls.rotateSpeed = 0.5
      }
    }
  }, [loading])

  return (
    <div className="app">
      <div className="header">
        <h1 className="title">So viel Weltraumschrott umkreist die Erde</h1>

        <div className="legend">
          <div className="legend-description">
            Jeder Punkt zeigt ein unbrauchbares, im Weltraum schwebendes Objekt,
            unabhängig von seiner Größe. Die Bewegungen basieren auf den tatsächlichen
            Umlaufbahnen im Februar 2025. Die Ansicht kann durch Antippen/Anklicken
            rotiert und vergrößert oder verkleinert werden.
          </div>

          {!loading && !error && (
            <div className="debris-stats">
              <span className="stat-label">Erfasste Objekte:</span>
              <span className="stat-value">{debrisCount.toLocaleString('de-DE')}</span>
            </div>
          )}

          <div className="legend-source">
            Quelle:{' '}
            <a
              href="https://www.space-track.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              US Space Force/Space Delta 2
            </a>
          </div>
        </div>
      </div>

      {loading && (
        <div className="status-overlay loading">
          <div className="spinner"></div>
          <div>Lade Satellitendaten...</div>
          <div className="loading-detail">
            Verarbeite {debrisCount > 0 ? debrisCount.toLocaleString('de-DE') : '~12.600'} Objekte
          </div>
        </div>
      )}

      {error && (
        <div className="status-overlay error">
          <div className="error-icon">⚠</div>
          <div>{error}</div>
          <button onClick={() => window.location.reload()} className="retry-button">
            Erneut versuchen
          </button>
        </div>
      )}

      <Globe
        ref={globeEl}

        // Globe appearance
        globeImageUrl="./data/earth-blue-marble.jpg"
        backgroundColor="#101010"
        atmosphereColor="#4a9eff"
        atmosphereAltitude={0.15}

        // Particles configuration
        particlesData={particlesData}
        particleLat="lat"
        particleLng="lng"
        particleAltitude="alt"
        particleColor={() => '#ffffff'}
        particleRadius={0.15}
        particlesTransitionDuration={0} // Critical: no transitions

        // OPTIMIZATION 7: Disable all unused layers
        pointsData={[]}
        arcsData={[]}
        polygonsData={[]}
        pathsData={[]}
        hexBinPointsData={[]}
        labelsData={[]}
        ringsData={[]}
        customLayerData={[]}

        // OPTIMIZATION 8: Performance settings
        waitForGlobeReady={false}
        animateIn={false}
        enablePointerInteraction={true}

        // OPTIMIZATION 9: Renderer settings for better performance
        rendererConfig={{
          antialias: false, // Disable antialiasing for speed
          alpha: false,
          powerPreference: 'high-performance'
        }}
      />
    </div>
  )
}

export default App

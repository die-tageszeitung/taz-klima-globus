# Space Debris Visualization / Weltraumschrott Visualisierung

Interactive 3D visualization showing 12,305 pieces of orbital debris around Earth.

## Features

- Real-time orbital mechanics using TLE (Two-Line Element) data
- 12,305 tracked objects from US Space Force catalog
- Smooth animation at 30-60 FPS
- Interactive globe (rotate, zoom, pan)
- Responsive design (desktop, tablet, mobile)

## Data Source

- **Provider**: US Space Force / Space Delta 2
- **Source**: [Space-Track.org](https://www.space-track.org)
- **Date**: February 2025
- **Format**: TLE (Two-Line Elements)

## Technology Stack

- **Framework**: React 18
- **Visualization**: react-globe.gl 2.27.2
- **Orbital Mechanics**: satellite.js 5.0.0
- **Build Tool**: Vite 5
- **Rendering**: Three.js + WebGL

## Development
```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Performance

- **Objects**: 12,305 debris pieces
- **Target FPS**: 45-60 on modern hardware
- **Update Rate**: 30Hz (adjustable via UPDATE_INTERVAL)
- **Bundle Size**: ~800 KB (minified)

## Deployment

The `dist/` folder contains a self-contained build that can be:
- Served from any static host
- Embedded via iframe
- Deployed to CDN

## License

Data: Public domain (US Government)
Code: [Your License]

## Credits

Visualization created for taz.de
Data provided by US Space Force / Space Delta 2 via Space-Track.org

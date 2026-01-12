# taz-klima-globus

Interactive 3D globe visualizations for climate data.

## Status

✅ **Working:** Chrome, Chromium, Edge  
❌ **Not Working:** Firefox (WebGPU compatibility issue)

## Structure
```
taz-klima-globus-new/
├── shared/                          # Shared components and styles
│   ├── components/
│   │   └── GlobeVisualization.jsx  # Main globe component
│   └── styles/
│       └── globe-common.css        # taz.de fonts and styles
└── visualizations/                  # Individual visualizations
    └── 24_annual_ecmwf_t2m/        # 2024 temperature data
        ├── public/data/             # Data files (GeoJSON, textures)
        ├── src/                     # React app
        └── vite.config.js           # Build config
```

## Development
```bash
# Install dependencies
npm install

# Run dev server (from root)
npm run dev

# Or from specific visualization
cd visualizations/24_annual_ecmwf_t2m
npm run dev
```

## Build
```bash
# Build all visualizations
npm run build

# Build specific visualization
npm run build:24
```

## Adding New Visualizations

1. Copy `visualizations/24_annual_ecmwf_t2m/` as template
2. Replace data files in `public/data/`
3. Update titles and legend in `src/App.jsx`
4. Add npm scripts to root `package.json`

## Tech Stack

- React 18.3.1
- react-globe.gl 2.27.2
- Three.js 0.158.0
- Vite 5.4.11

## Known Issues

- Firefox: `GPUShaderStage is undefined` - Three.js WebGPU compatibility
- Solution: Use Chrome/Edge or wait for library updates

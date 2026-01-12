# taz-klima-globus

Interactive 3D globe visualizations for climate data using React and WebGL/WebGPU.

## Status

✅ **Fully Working:** Chrome, Chromium, Edge, Firefox, Safari
🚀 **Performance:** WebGPU-accelerated rendering
📦 **Bundle Size:** ~300-400KB (vs 3.5MB+ in legacy version)

## Features

- Modern React 18 with Vite build system
- WebGPU/WebGL rendering via Three.js
- Interactive 3D globe with country polygons
- Hover tooltips with temperature data
- Auto-rotation with smart pause on tab switch
- Modular architecture for multiple visualizations

## Structure
```
taz-klima-globus-new/
├── shared/                          # Shared components and styles
│   ├── components/
│   │   └── GlobeVisualization.jsx  # Reusable globe component
│   └── styles/
│       └── globe-common.css        # Common styles and fonts
└── visualizations/                  # Individual visualizations
    └── 24_annual_ecmwf_t2m/        # 2024 temperature anomalies
        ├── public/
        │   └── data/                # GeoJSON, textures, images
        ├── src/
        │   ├── App.jsx              # Visualization-specific UI
        │   ├── main.jsx             # Entry point
        │   └── styles.css           # Custom styles
        ├── index.html
        ├── vite.config.js           # Build configuration
        └── package.json
```

## Quick Start

### Development
```bash
# Install dependencies (first time only)
npm install

# Run dev server
npm run dev

# Opens at http://localhost:3000
```

### Build for Production
```bash
# Build all visualizations
npm run build

# Build specific visualization
npm run build:24

# Preview production build
npm run preview
```

## Creating New Visualizations

1. **Copy the template:**
```bash
   cp -r visualizations/24_annual_ecmwf_t2m visualizations/YOUR_VIZ_NAME
   cd visualizations/YOUR_VIZ_NAME
```

2. **Update package.json:**
   - Change `"name"` to match your folder name

3. **Replace data files in `public/data/`:**
   - Globe texture image (JPG/PNG/WebP)
   - GeoJSON file with country data
   - Optional: bump map texture

4. **Customize `src/App.jsx`:**
   - Update title and legend
   - Adjust color scale if needed
   - Modify tooltip content

5. **Add npm scripts to root `package.json`:**
```json
   {
     "scripts": {
       "dev:yourname": "npm run dev --workspace=YOUR_VIZ_NAME",
       "build:yourname": "npm run build --workspace=YOUR_VIZ_NAME"
     }
   }
```

6. **Test and build:**
```bash
   npm run dev:yourname
   npm run build:yourname
```

## Deployment

Each visualization builds to its own `dist/` folder:
```
visualizations/24_annual_ecmwf_t2m/dist/
├── index.html
├── assets/
│   ├── index-[hash].js   (~300-400 KB)
│   └── index-[hash].css
└── data/
    ├── globe-texture.jpg
    └── data.geojson
```

### Embedding in Website
```html
<iframe
  src="https://your-cdn.com/path/to/dist/index.html"
  width="100%"
  height="600"
  loading="lazy"
  style="border:none;"
  title="Climate Globe Visualization">
</iframe>
```

### Server Configuration

Enable compression and caching:

**Apache (.htaccess):**
```apache
# Cache static assets
<FilesMatch "\.(js|css|jpg|png|webp|json)$">
  Header set Cache-Control "max-age=31536000, public"
</FilesMatch>

# Enable gzip
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json
</IfModule>
```

**Nginx:**
```nginx
location ~* \.(js|css|jpg|png|webp|json)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}

gzip on;
gzip_types text/css application/javascript application/json;
```

## Tech Stack

- **React** 18.3.1
- **react-globe.gl** 2.37.0
- **Three.js** 0.170.0 (with WebGPU support)
- **Vite** 5.4.11
- **Build target:** ES2020, modern browsers

## Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 113+ | ✅ Full support |
| Edge | 113+ | ✅ Full support |
| Firefox | 128+ | ✅ Full support |
| Safari | 17.4+ | ✅ Full support |

WebGPU is used when available, with automatic WebGL fallback.

## Performance Optimizations

- **Eliminated Babel in browser** - All JSX pre-compiled
- **Code splitting** - Vite automatically chunks code
- **Asset optimization** - Images compressed to WebP
- **Smart rotation** - Pauses when tab is hidden
- **Tree shaking** - Unused code eliminated
- **Minification** - Terser for production builds

## Development Notes

### Auto-Rotation Behavior
The globe automatically rotates but pauses when:
- Browser tab is not visible
- Window is minimized

This prevents the "catch-up spin" effect when returning to the tab.

### Data Format
GeoJSON files should include:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "GERMAN_NAME": "Deutschland",
        "mean": 1.5
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [...]
      }
    }
  ]
}
```

### Shared Component Props
`GlobeVisualization` accepts:
- `globeImageUrl` - Texture for globe surface
- `bumpImageUrl` - Bump map for terrain (optional)
- `geojsonUrl` - Country polygon data
- `geojsonPropertyName` - Property for country names
- `valuePropertyName` - Property for data values
- `height` / `width` - Canvas dimensions
- `initialViewPoint` - Starting camera position
- `autoRotateSpeed` - Rotation speed (default: 0.35)

## Troubleshooting

**Globe doesn't appear:**
- Check browser console for errors
- Verify data files exist in `public/data/`
- Clear browser cache (Ctrl+Shift+R)
- Check GeoJSON is valid JSON

**Slow performance:**
- Reduce globe texture resolution (2048px recommended)
- Simplify GeoJSON (use mapshaper.org)
- Check for console warnings

**Build errors:**
- Delete `node_modules` and reinstall
- Clear Vite cache: `rm -rf node_modules/.vite`
- Ensure Node.js version >= 18

## License

ISC

## Credits

Built with [react-globe.gl](https://github.com/vasturiano/react-globe.gl) by @vasturiano

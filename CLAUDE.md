# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**JJU Compass Map** is a static web service providing location information for facilities around Jeonju University based on Kakao Maps. It's a student-focused discovery tool for restaurants, cafes, convenience stores, hospitals, pharmacies, and other essential services within a 2km radius of the campus.

- **Technology Stack**: HTML5, CSS3, JavaScript (vanilla), Kakao Maps SDK v2
- **Deployment**: Oracle Cloud (Ubuntu 22.04), Nginx, HTTPS (Let's Encrypt), DuckDNS
- **Live URL**: https://jju-map.duckdns.org

## High-Level Architecture

### Frontend Structure

The project follows a simple but effective multi-page architecture:

1. **Landing Page** (`index.html`): Marketing/entry point with category navigation
2. **Map Page** (`map.html`): Main application with Kakao Maps integration
3. **Info Pages** (`about.html`, `guide.html`, `search.html`): Static content

### Core Components

#### `map.js` - Core Application Logic

This is the most complex file containing:

- **Map Initialization** (`initializeMap`): Centers on Jeonju University (35.8144, 127.0924), manages map sizing for mobile
- **Place Search** (`searchPlacesByKeyword`, `searchMultipleKeywords`):
  - Kakao Places API with 2km radius
  - Pagination support (up to 3 pages = 45 results)
  - Multi-keyword aggregation with deduplication
- **Marker Management** (`displayMarkers`, `clearMarkers`):
  - Singleton infowindow for memory efficiency
  - Auto-bounds calculation (LatLngBounds)
  - Reusable marker array
- **Animations** (extensive):
  - Drop animation (easeOutCubic)
  - Bounce animation
  - Path following with footstep trails
  - Ripple effects on click
- **Walking Directions** (`showWalkingRoute`, `attachRouteControls`):
  - Optional server proxy integration via `window.JJU_DIRECTIONS_API`
  - Falls back to straight-line interpolation if proxy unavailable
  - Caches direction responses (1 hour in-memory)
- **Caching System** (`CacheManager`):
  - Search results cached in localStorage (1 hour TTL)
  - Route calculations cached in memory (1 hour TTL)
  - Manual cache management via "캐시" button on map
  - Cache stats (search count, route count, storage size)

#### `style.css` - Unified Styling

Consolidated CSS for all pages (~8KB):

- **CSS Variables** (--primary-blue, --text-dark, --shadow-lg, etc.)
- **Landing page**: Hero section, cards, category grid
- **Map page**: Top navbar, 3-column layout (sidebar | map | results), responsive design
- **Responsive Breakpoints**: Mobile (sidebar 40vh / map 60vh), desktop (sidebar visible)
- **Animations**: Fade, scale, floating card animations

#### `map.html` - Map Page Template

Single universal map page that:

- Loads category from URL parameter (`?category=한식`)
- Uses `categoryInfo` object to map keywords → (icon, title, description)
- Sidebar with food categories (음식점 section) and other facilities (기타 section)
- 3-column layout: results list | map | [optional 3rd column space]
- Event delegation for category buttons (data-keyword, data-multi attributes)

### Key Design Patterns

1. **Global State in map.js**:
   ```javascript
   let markers = [];           // Active markers on map
   let infowindow = null;      // Singleton reused window
   let transientOverlays = []; // Temporary visual effects
   let userStartPosition = null; // For walking directions
   ```

2. **Kakao Maps Async Pattern**:
   - Search results passed to callbacks
   - Results array format: `{ place_name, road_address_name, address_name, phone, place_url, x, y, category_name }`

3. **Multi-Keyword Deduplication**:
   - Search multiple keywords in parallel
   - Deduplicate by comparing `place_name + address`
   - Return unified sorted results

4. **Mobile Responsiveness**:
   - Flexbox layout with viewport meta tag
   - CSS media queries for sidebar/map split (40/60 on mobile, auto on desktop)
   - `map.relayout()` called after DOM changes

### Kakao API Integration

- **Endpoints**:
  - Maps SDK: `https://dapi.kakao.com/v2/maps/sdk.js?appkey=...`
  - Places API: Included in Maps SDK (kakao.services.Places)
- **Quota**: 300,000 calls/day (free tier), currently ~500/day usage
- **Constraints**: Max 2km radius, 15 results per page, 3 pages max
- **API Key**: Embedded in `map.html` (fdfa17b1b09d466f785d5e9124d0e5fe) - registered for `jju-map.duckdns.org` and `localhost:5500`

## Common Development Commands

### Local Development

```bash
# Python 3 - simple HTTP server at port 5500
python3 -m http.server 5500

# Node.js - using http-server
npx http-server -p 5500

# VS Code - Live Server extension
# Right-click index.html → "Open with Live Server"
```

Browse at: `http://localhost:5500`

**Important**: Register `localhost:5500` in Kakao Developers console before testing locally.

### Deployment (Oracle Cloud / Ubuntu 22.04)

```bash
# SSH to server
ssh -i private_key ubuntu@134.185.117.30

# Project location
cd /home/ubuntu/jju-compass-map

# Pull latest changes
git pull origin main

# Restart Nginx (auto-serves from /home/ubuntu/jju-compass-map)
sudo systemctl restart nginx

# Check Nginx status
sudo systemctl status nginx

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

**Nginx Config**: `/etc/nginx/sites-available/jju-map.duckdns.org` (serves static files, HTTPS redirect, SSL certs auto-renewed by Let's Encrypt)

### Testing

No automated test suite. Manual testing workflow:
1. Open `http://localhost:5500` in browser
2. Click category buttons → verify markers appear
3. Click result list items → verify infowindow shows
4. Test mobile viewport (Chrome DevTools, 375×667)

## Key Files Reference

| File | Purpose |
|------|---------|
| `map.js` (900+ lines) | Core search, marker, animation logic |
| `map.html` | Universal map template with category selector |
| `index.html` | Landing page with category links |
| `style.css` | Unified CSS for landing + map pages |
| `about.html`, `guide.html` | Static info pages (minimal content) |

## Important Implementation Details

### Map Initialization & Relayout

Mobile browsers may not calculate map container size correctly. Always call `map.relayout()` after DOM mutations:

```javascript
setTimeout(() => map.relayout(), 100);
```

### Memory Efficiency

- **Single Infowindow**: Reused across all markers (avoids creating 45+ DOM nodes)
- **Marker Cleanup**: Always call `clearMarkers()` before new search to prevent memory leaks
- **Transient Overlays**: Animations/ripples auto-removed after timeout

### Deduplication

When searching multiple keywords, places with identical name + address are merged:

```javascript
function searchMultipleKeywords(keywords, map, callback) {
    // Search each keyword, collect results
    // Deduplicate by: place_name + (road_address_name || address_name)
    // Sort by distance from center
    // Return unified array
}
```

### Walking Routes (Directions API)

Optional feature requiring backend proxy:

1. **Frontend** checks `window.JJU_DIRECTIONS_API` (must be injected before loading `map.js`)
2. **Proxy Server** (Node.js in `/server` dir) accepts `/api/walk?origin=lng,lat&destination=lng,lat&mode=WALK`
3. **Proxy** calls Kakao Mobility REST API with REST key in `.env` (NOT committed)
4. **Response**: `{ source, path: [{lat, lng}, ...], distance, duration, guides }`
5. **Fallback**: If proxy down or rate-limited, animates straight-line path instead

**Current Status**: Skeleton code present, proxy not yet deployed in production.

### Category Info Mapping

Category keywords must match entries in `categoryInfo` object in `map.html`:

```javascript
categoryInfo = {
    '한식': { icon: '🍚', title: '한식', desc: '...' },
    // ... 15 more categories
};
```

Adding new categories: add keyword here + data-keyword button in sidebar.

## Code Style Conventions

- **Function names**: camelCase (`searchPlacesByKeyword`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RESULTS = 45`)
- **Indentation**: 4 spaces (not tabs)
- **Quotes**: Single quotes (`'keyword'`)
- **Comments**: Korean for business logic, English for complex algorithms
- **Error handling**: Try-catch around animation code (graceful degradation)

## Common Gotchas & Troubleshooting

### Markers Don't Appear
- Hard refresh browser: `Ctrl+Shift+R`
- Check console for Kakao API errors
- Verify API key is registered for your domain in Kakao Developers

### Search Returns 0 Results
- Default search radius is 2km; some categories may be sparse
- Try broader keyword (e.g., "음식" instead of specific cuisine)
- Verify category exists in Kakao database (test on kakao.com/maps)

### Mobile Sidebar/Map Not Aligning
- Ensure viewport meta tag present: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
- Check CSS media queries in style.css (~line 850+)
- Call `map.relayout()` after DOM changes

### HTTPS Certificate Issues
- Let's Encrypt auto-renews (Certbot renewal timer active)
- Check expiry: `/etc/letsencrypt/live/jju-map.duckdns.org/cert.pem`
- Manual renew: `sudo certbot renew`

## Deployment Checklist for Changes

1. Test locally at `http://localhost:5500`
2. Test mobile responsiveness (DevTools)
3. Commit with message: `feat: ...`, `fix: ...`, `docs: ...`, etc.
4. Push to GitHub: `git push origin main`
5. SSH to Oracle Cloud and `git pull`
6. Optional: `sudo systemctl restart nginx` (usually unnecessary for static files)
7. Verify at https://jju-map.duckdns.org

## Caching System Implementation (v2.0)

### Overview
Implemented comprehensive caching system to reduce API calls and improve performance:

### Cache Types
1. **Search Cache (localStorage)**
   - TTL: 1 hour (3600000ms)
   - Stores keyword → results mapping
   - Survives page refresh
   - Max size: ~30-50KB per 100 searches

2. **Route Cache (memory)**
   - TTL: 1 hour
   - Stores start-end coordinate pairs
   - Session-based (cleared on page refresh)
   - Reduces Directions API calls

### Usage
- **Automatic**: Cache is managed transparently
- **Manual**: "캐시" button in map UI shows stats and allows full clear
- **Debug**: Set `window.JJU_DEBUG_CACHE = true` in console to see cache operations

### Performance Impact
- Repeated search: ~90% faster (instant from localStorage)
- API quota savings: 50-70% reduction with typical usage
- Storage overhead: Minimal (~30-50KB for 100 unique searches)

### Future Improvements
- IndexedDB for larger result sets
- Service Worker + Cache API for offline support
- Background cache sync (sync stale results when online)

## Future Expansion Notes

- **Server Directory** (`/server`): Template for Node.js walking directions proxy (currently stub)
- **Kakao Mobility Integration**: Requires `.env` with REST key; proxy caches results
- **Additional Categories**: Simple - add keyword to map.html and Kakao will search it
- **Analytics**: Not implemented; could add GA4 for page views/searches
- **PWA/Offline**: Could add service worker for caching tiles

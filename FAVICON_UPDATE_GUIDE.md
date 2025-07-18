# Casa8 Favicon Update Guide

## Overview
This guide will help you update the favicon with the Casa8 logo (blue background with white house icon and "CASA8" text).

## Steps to Update the Favicon

### 1. Prepare the Casa8 Logo
- Save the Casa8 logo image you provided to your computer
- Make sure it's a square image (1:1 aspect ratio) for best results
- The logo should be at least 512x512 pixels for high quality

### 2. Generate Favicon Files
Use one of these online favicon generators:
- **Recommended**: https://favicon.io/favicon-converter/
- Alternative: https://www.favicon-generator.org/
- Alternative: https://realfavicongenerator.net/

### 3. Upload and Configure
1. Upload your Casa8 logo to the favicon generator
2. The generator will create multiple sizes:
   - `favicon.ico` (16x16, 32x32, 48x48)
   - `apple-touch-icon.png` (180x180)
   - `android-chrome-192x192.png` (192x192)
   - `android-chrome-512x512.png` (512x512)
   - `site.webmanifest` (optional)

### 4. Replace Files
1. **Required**: Replace `src/app/favicon.ico` with the new favicon.ico
2. **Optional**: Add other generated files to the `public/` folder:
   - `public/apple-touch-icon.png`
   - `public/android-chrome-192x192.png`
   - `public/android-chrome-512x512.png`
   - `public/site.webmanifest`

### 5. Clear Browser Cache
- Hard refresh your browser (Ctrl+F5 or Cmd+Shift+R)
- Or use incognito/private browsing mode to see the new favicon

## What's Already Done
- Updated `src/app/layout.tsx` with proper favicon metadata
- Added support for Apple touch icons and Android icons
- Configured proper icon sizes and types

## File Locations
- Main favicon: `src/app/favicon.ico` (replace this file)
- Additional icons: `public/` folder (optional)
- Metadata: `src/app/layout.tsx` (already updated)

## Expected Result
After updating, you should see the Casa8 logo with:
- Blue background
- White house icon with window details
- "CASA8" text below the house
- Proper display across all browsers and devices

## Testing
Test the favicon on:
- Chrome/Edge (desktop and mobile)
- Firefox (desktop and mobile)
- Safari (desktop and mobile)
- Browser bookmarks
- Browser tabs
- Home screen icons (mobile)

# Destination Images

This directory contains images for Nepal tourist destinations displayed on the Destinations page.

## Required Images

The following images are needed for the destinations:

### Religious Sites
- `muktinath.jpg` - Muktinath Temple, Mustang
- `lumbini.jpg` - Lumbini (Birthplace of Buddha), Rupandehi
- `janakpur.jpg` - Janaki Mandir, Dhanusha

### National Parks
- `chitwan.jpg` - Chitwan National Park, Chitwan
- `bardiya.jpg` - Bardiya National Park, Bardiya
- `sagarmatha.jpg` - Sagarmatha National Park (Everest region), Solukhumbu

### Natural Lakes
- `phoksundo.jpg` - Shey Phoksundo Lake, Dolpa
- `rara.jpg` - Rara Lake, Mugu
- `tilicho.jpg` - Tilicho Lake, Manang

### Mountain Destinations
- `manang.jpg` - Manang Village
- `langtang.jpg` - Langtang Valley, Rasuwa
- `pokhara.jpg` - Pokhara Valley with Phewa Lake, Kaski

### Fallback
- `default.jpg` - Default placeholder image when specific destination image is not available

## Image Specifications

- **Format**: JPG, PNG, or WebP
- **Dimensions**: 1200x800px (or 3:2 aspect ratio)
- **File Size**: Under 500KB for optimal loading
- **Quality**: High-resolution landscape photos
- **Content**: Iconic views of each destination showing its main attraction

## Image Guidelines

1. Use authentic, high-quality photos of each destination
2. Ensure proper licensing and usage rights
3. Images should be representative of the destination's main feature
4. Maintain consistent aspect ratio (3:2) for uniform display
5. Optimize images for web (compress without losing quality)
6. Use descriptive filenames matching the destination

## Fallback Behavior

If a specific destination image is not found, the component will automatically fall back to `default.jpg`. Ensure this file exists as a generic Nepal landscape or mountain view.

## Sources for Images

- Nepal Tourism Board official resources
- Creative Commons licensed images (CC BY or CC0)
- Public domain images from Wikimedia Commons
- Professional travel photography (with proper licensing)
- Original photography (recommended)

## Adding New Destinations

When adding new destinations to the Destinations page:

1. Add destination data to the `allDestinations` array in `Destinations.jsx`
2. Set `image` property to `/images/destinations/[destination-name].jpg`
3. Add corresponding image file to this directory
4. Update this README with the new image requirement
5. Ensure image meets the specifications above

# Images Folder Structure / Tasbir Folder Sanrachana

Website ma use hune sabai images yaha store garnuhos (Store all website images here)

## Folder Organization / Folder Byabasthapan

### `/buses`
- Bus ko photo haru (Bus images)
- Bus interior/exterior photos
- Seat layout images
- Example: `bus-abc-travels-001.jpg`, `deluxe-bus-interior.jpg`

### `/vendors`
- Vendor/Company logos (Vendor ra company ko logo)
- Vendor profile pictures
- Company building photos
- Example: `abc-travels-logo.png`, `xyz-bus-logo.png`

### `/icons`
- UI icons (Interface ko sano icons)
- Feature icons
- Payment method icons (eSewa, Khalti, etc.)
- Example: `esewa-icon.png`, `khalti-icon.png`, `ticket-icon.svg`

### `/backgrounds`
- Hero section backgrounds (Homepage ko background images)
- Banner images
- Pattern images
- Example: `hero-bg.jpg`, `pattern-green.png`

### `/logos`
- Ticket Nepal main logo (Main website logo)
- Logo variations (white, colored, etc.)
- Favicon source files
- Example: `ticket-nepal-logo.png`, `logo-white.svg`, `favicon.png`

## Image Guidelines / Tasbir Niyam

### File Naming / File Name Rakne Tarika
- Use lowercase with hyphens: `bus-deluxe-001.jpg` ✅
- Avoid spaces: `Bus Deluxe 001.jpg` ❌
- Use descriptive names: `img1.jpg` ❌ → `kathmandu-bus-station.jpg` ✅

### File Formats / File Prakar
- **Photos**: `.jpg` or `.webp` (compressed for web)
- **Logos/Icons**: `.png` or `.svg` (transparent background)
- **Backgrounds**: `.jpg` or `.webp` (optimized size)

### Size Optimization / Size Optimization
- Compress images before uploading (TinyPNG, ImageOptim)
- Recommended max sizes:
  - Hero images: 1920x1080px, < 300KB
  - Bus photos: 800x600px, < 150KB
  - Icons: 64x64px or SVG, < 10KB
  - Logos: 300x300px or SVG, < 50KB

### Usage in Code / Code ma Kaise Use Garne

```jsx
// Public folder ma bhayera direct path use garna milcha
<img src="/images/logos/ticket-nepal-logo.png" alt="Ticket Nepal" />
<img src="/images/buses/deluxe-bus-001.jpg" alt="Deluxe Bus" />

// Background image in CSS
.hero-section {
  background-image: url('/images/backgrounds/hero-bg.jpg');
}
```

## Database Integration / Database Sanga Integration

Backend API bata image URLs aaucha:
```javascript
// Example from buses table
{
  id: 1,
  registration_no: "BA 2 KHA 1234",
  bus_image_url: "/images/buses/ba-2-kha-1234.jpg"  // Database ma store gareko path
}

// Example from vendors table
{
  id: 1,
  company_name: "ABC Travels",
  company_logo: "/images/vendors/abc-travels-logo.png"
}
```

## Git Note
- Add `.gitkeep` file in empty folders to track in git
- Add large images to `.gitignore` if needed
- Store final images on CDN for production (Cloudinary, AWS S3, etc.)

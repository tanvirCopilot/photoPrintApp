# PhotoPrint - Smart Photo Layout & Print App

A modern web application for creating printable A4 photo layouts. Upload multiple photos, arrange them in customizable grids, and export to high-quality PDF.

## Features

### 📷 Photo Upload System
- Drag & drop multiple photos at once
- Support for JPG, PNG, WebP formats
- Preview gallery with thumbnails
- Easy delete and clear functionality

### 📄 Automatic A4 Layout Generation
- Default 4-photo grid layout
- Automatic page creation when photos overflow
- Photos are automatically arranged in available slots

### 🎨 Customizable Layout
- Choose from 1, 2, 3, 4, 6, 8, or 12 photos per page
- Drag-and-drop to rearrange images between slots
- Pan and zoom images within their slots (mouse drag + scroll wheel)
- Touch support for pinch-to-zoom on mobile/tablet

### 📑 Page Management
- Add new pages manually
- Duplicate existing page layouts
- Delete or navigate between pages
- Visual page thumbnails

### 📥 Export to PDF
- Generate multi-page A4 PDF
- Print-safe margins (5mm)
- High-quality image export
- Works on desktop and mobile

### 📱 Mobile-Friendly Design
- Fully responsive interface
- Touch support for dragging and resizing
- Optimized for tablets

## Tech Stack

- **React 19** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Zustand** for state management
- **@dnd-kit** for drag and drop
- **react-dropzone** for file uploads
- **jsPDF** for PDF generation

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development

The app runs on `http://localhost:5173` by default.

## Usage

1. **Upload Photos**: Drag & drop photos onto the upload area or click to select files
2. **Choose Layout**: Select how many photos per page (1-12)
3. **Arrange Photos**: Drag photos between slots to reorder them
4. **Adjust Images**: Click on a photo slot to select it, then:
   - Drag to pan the image within the slot
   - Scroll to zoom in/out
   - On touch devices: pinch to zoom
5. **Manage Pages**: Add, duplicate, or delete pages as needed
6. **Export**: Click "Download PDF" to generate your print-ready file

## License

MIT

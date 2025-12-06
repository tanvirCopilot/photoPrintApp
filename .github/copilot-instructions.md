# PhotoPrint - Smart Photo Layout & Print App

## Project Overview
A React TypeScript application for creating printable A4 photo layouts with drag-and-drop functionality and PDF export.

## Architecture

### State Management
- **Zustand** store at `src/store/photoStore.ts`
- Manages photos, pages, slots, and layout configuration

### Key Components
- `PhotoUploader` - Drag-and-drop file upload with react-dropzone
- `PhotoGallery` - Thumbnail gallery of uploaded photos
- `LayoutSelector` - Grid layout options (1-12 photos per page)
- `A4Page` - Page container with drag-and-drop slots
- `DraggableSlot` - Individual photo slots with dnd-kit
- `PhotoSlotItem` - Image display with pan/zoom support
- `PageManager` - Page navigation and management
- `PDFExporter` - PDF generation with jsPDF

### Types
All TypeScript types are in `src/types/index.ts`:
- `Photo` - Uploaded photo metadata
- `PhotoSlot` - Individual slot with position/scale
- `Page` - Collection of slots with layout
- `LayoutType` - Valid layout options (1,2,3,4,6,8,12)

## Development Guidelines

### Adding New Features
1. Add types to `src/types/index.ts`
2. Update store actions in `src/store/photoStore.ts`
3. Create/modify components in `src/components/`

### Styling
- Use Tailwind CSS classes
- Follow responsive mobile-first approach
- Breakpoints: `sm:`, `md:`, `lg:`, `xl:`

### Testing Features
1. Upload multiple photos (JPG, PNG, WebP)
2. Try different layout options
3. Test drag-and-drop between slots
4. Test pan/zoom within slots (mouse drag + scroll, touch pinch)
5. Export to PDF and verify print quality

## Commands
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Dependencies
- React 19 + TypeScript
- Vite + @tailwindcss/vite
- Zustand (state management)
- @dnd-kit/core, @dnd-kit/sortable (drag and drop)
- react-dropzone (file uploads)
- jsPDF (PDF generation)

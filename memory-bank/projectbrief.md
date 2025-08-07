# Document Preview Application - Project Brief

## Project Overview
A modern Angular 19 application for uploading and previewing various document types including Word documents, PDFs, images, and ODF files.

## Core Requirements

### Technical Stack
- **Framework**: Angular 19 (latest)
- **Language**: TypeScript
- **Styling**: SCSS
- **Architecture**: Standalone components
- **Package Manager**: npm

### File Support
The application supports the following file types:
- **Word Documents**: .docx, .doc
- **PDF Files**: .pdf
- **Images**: .png, .jpg, .jpeg
- **ODF Files**: .odf

### Key Features
1. **File Upload**: Drag-and-drop interface with file browser option
2. **File Validation**: Automatic validation of supported file types
3. **Preview Functionality**: 
   - Images: Direct display
   - PDFs: Open in new tab
   - Word documents: Converted to HTML for inline preview
   - ODF: Display conversion message
4. **Responsive Design**: Mobile-friendly interface
5. **Error Handling**: Comprehensive error messages and loading states

### Project Structure
```
src/
├── app/
│   ├── components/
│   │   ├── file-upload/
│   │   └── file-preview/
│   ├── services/
│   │   └── file-preview.service.ts
│   └── app.component.ts
├── styles.scss
└── main.ts
```

### Dependencies
- **mammoth**: Word document to HTML conversion
- **docx-preview**: Alternative Word document preview
- **pdfjs-dist**: PDF handling (for future enhancements)

## Success Criteria
- [x] Angular 19 app created in root directory (no subfolder)
- [x] File upload with drag-and-drop support
- [x] Preview functionality for all supported file types
- [x] Modern, responsive UI
- [x] Error handling and loading states
- [x] Non-interactive setup completed 
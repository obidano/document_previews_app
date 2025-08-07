# Document Preview Application

A modern Angular 19 application for uploading and previewing various document types including Word documents, PDFs, images, and ODF files, with a Node.js backend for file storage and management.

## Features

- **File Upload**: Drag-and-drop interface with file browser option
- **File Validation**: Automatic validation of supported file types
- **Preview Functionality**: 
  - Images: Direct display
  - PDFs: Inline preview with navigation and zoom controls
  - Word documents: Converted to HTML for inline preview
  - Text files: Direct text display
  - Excel/PowerPoint: Informational display
- **File Management**: 
  - Upload files to server
  - View all uploaded files in a datatable
  - Download files
  - Delete files
  - Preview files from the list
- **Responsive Design**: Mobile-friendly interface
- **Error Handling**: Comprehensive error messages and loading states

## Supported File Types

- **PDF Documents**: .pdf
- **Word Documents**: .docx, .doc
- **Images**: .png, .jpg, .jpeg, .gif, .bmp, .webp

## Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

### Option 1: Start Both Frontend and Backend Together (Recommended)

Start both the Angular frontend and Node.js server with a single command:

```bash
# Start both in development mode (with auto-restart for server)
npm run dev

# Or start both in production mode
npm run start:all
```

This will start:
- **Angular app** on `http://localhost:4555`
- **Node.js server** on `http://localhost:3001`

### Option 2: Start Frontend and Backend Separately

#### Start the Node.js Server

The server handles file uploads and provides API endpoints for file management.

```bash
# Start server in development mode (with auto-restart)
npm run server:dev

# Or start server in production mode
npm run server
```

The server will run on `http://localhost:3001`

#### Start the Angular Application

In a new terminal window:

```bash
# Start Angular development server
npm start
```

The application will be available at `http://localhost:4555`

## API Endpoints

- `POST /api/upload` - Upload a file
- `GET /api/files` - Get all uploaded files
- `DELETE /api/files/:id` - Delete a file
- `GET /uploads/:filename` - Download a file

## Project Structure

```
doc_preview/
├── src/                          # Angular application
│   ├── app/
│   │   ├── components/
│   │   │   ├── file-upload/      # File upload component
│   │   │   ├── file-preview/     # File preview component
│   │   │   └── file-list/        # File list with datatable
│   │   ├── services/
│   │   │   ├── file-preview.service.ts
│   │   │   ├── file-upload.service.ts
│   │   │   └── pdf.service.ts
│   │   └── pipes/
│   │       └── safe.pipe.ts
├── server/                       # Node.js server
│   ├── server.js                 # Main server file
│   └── uploads/                  # Uploaded files directory
└── package.json                  # Dependencies for both client and server
```

## Usage

1. Open the application in your browser
2. Upload files using the drag-and-drop area or browse button
3. View uploaded files in the datatable below
4. Use the action buttons to preview, download, or delete files
5. Preview files inline with full navigation controls

## Development

### Adding New File Types

1. Update the `acceptedFileTypes` in `file-upload.component.ts`
2. Add the MIME type to the server's `allowedTypes` array in `server.js`
3. Add handling logic in `file-preview.service.ts`

### Server Configuration

The server can be configured by modifying environment variables:
- `PORT`: Server port (default: 3001)
- `MAX_FILE_SIZE`: Maximum file size in bytes (default: 50MB)

## Troubleshooting

### Server Issues
- Ensure port 3001 is not in use
- Check that all server dependencies are installed
- Verify the uploads directory has write permissions

### Angular Issues
- Clear browser cache if changes don't appear
- Check browser console for errors
- Ensure all Angular dependencies are installed

## Technologies Used

- **Frontend**: Angular 19, TypeScript, SCSS
- **Backend**: Node.js, Express.js, Multer
- **UI Components**: ngx-datatable
- **File Processing**: PDF.js, Mammoth.js, Docx-preview
- **Styling**: Modern CSS with gradients and animations

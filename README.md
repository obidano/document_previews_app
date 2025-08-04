# Document Preview Application

A modern Angular 19 application for uploading and previewing various document types including Word documents, PDFs, images, and ODF files.

## Features

- **File Upload**: Drag-and-drop interface with file browser option
- **File Validation**: Automatic validation of supported file types
- **Preview Functionality**: 
  - Images: Direct display
  - PDFs: Inline preview with navigation, zoom, and fullscreen controls
  - Word documents: Converted to HTML for inline preview
  - ODF: Display conversion message
- **Responsive Design**: Mobile-friendly interface
- **Error Handling**: Comprehensive error messages and loading states
- **PDF Validation**: Advanced PDF validation with empty file detection and header checking

## Supported File Types

- **Documents**: PDF, DOCX, DOC
- **Images**: PNG, JPG, JPEG, GIF, BMP, WebP
- **Text Files**: TXT, MD, CSV, JSON, XML, HTML
- **Spreadsheets**: XLSX, XLS
- **Presentations**: PPTX, PPT
- **Open Documents**: ODF, ODT, ODS, ODP

## PDF Error Handling

The application includes comprehensive PDF validation and error handling:

- **Empty File Detection**: Checks for zero-byte PDF files
- **Header Validation**: Verifies PDF files have valid %PDF header
- **User-Friendly Messages**: Clear error messages with troubleshooting tips
- **Fallback Options**: Multiple viewing options when PDF.js fails
- **Pre-upload Validation**: Validates PDF files before processing

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

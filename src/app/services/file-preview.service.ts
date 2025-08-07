import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import * as docxPreview from 'docx-preview';

export interface FilePreviewResult {
  type: 'text' | 'html' | 'image' | 'pdf' | 'spreadsheet' | 'presentation';
  content: string | ArrayBuffer;
  fileName: string;
  fileType: string;
  fileSize?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FilePreviewService {

  constructor() { }

  previewFile(file: File): Observable<FilePreviewResult> {
    return from(this.processFile(file));
  }

  private async processFile(file: File): Promise<FilePreviewResult> {
    const fileType = file.type.toLowerCase();
    const fileName = file.name;
    const fileExtension = fileName.toLowerCase().split('.').pop() || '';

    // Handle image files
    if (fileType.includes('image/') || ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(fileExtension)) {
      return this.handleImageFile(file, fileName, fileType);
    }

    // Handle PDF files
    if (fileType === 'application/pdf' || fileExtension === 'pdf') {
      return this.handlePdfFile(file, fileName);
    }

    // Handle Word documents
    if (fileType.includes('word') || fileType.includes('docx') || fileType.includes('doc') || 
        ['docx', 'doc'].includes(fileExtension)) {
      return this.handleWordFile(file, fileName, fileType);
    }

    // Handle Excel files
    if (fileType.includes('excel') || fileType.includes('spreadsheet') || 
        ['xlsx', 'xls'].includes(fileExtension)) {
      return this.handleExcelFile(file, fileName, fileType);
    }

    // Handle PowerPoint files
    if (fileType.includes('powerpoint') || fileType.includes('presentation') || 
        ['pptx', 'ppt'].includes(fileExtension)) {
      return this.handlePowerPointFile(file, fileName, fileType);
    }

    // Handle text files
    if (fileType.includes('text/') || ['txt', 'md', 'csv', 'json', 'xml', 'html', 'htm'].includes(fileExtension)) {
      return this.handleTextFile(file, fileName, fileType);
    }

    // Handle ODF files
    if (fileType.includes('opendocument') || fileExtension === 'odf') {
      return this.handleOdfFile(file, fileName);
    }

    throw new Error(`Unsupported file type: ${fileType} (${fileExtension})`);
  }

  private async handleImageFile(file: File, fileName: string, fileType: string): Promise<FilePreviewResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          type: 'image',
          content: e.target?.result as string,
          fileName,
          fileType,
          fileSize: this.formatFileSize(file.size)
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private async handlePdfFile(file: File, fileName: string): Promise<FilePreviewResult> {
    return new Promise((resolve, reject) => {
      console.log('Handling PDF file:', fileName);
      console.log('File size:', file.size);
      console.log('File type:', file.type);
      
      // Check if file is empty
      if (file.size === 0) {
        console.error('PDF file is empty (0 bytes)');
        reject(new Error('The PDF file is empty, i.e. its size is zero bytes.'));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          console.log('ArrayBuffer size:', arrayBuffer?.byteLength);
          
          // Additional validation for PDF content
          if (!arrayBuffer || arrayBuffer.byteLength === 0) {
            console.error('ArrayBuffer is empty or null');
            reject(new Error('The PDF file is empty, i.e. its size is zero bytes.'));
            return;
          }
          
          // Check for valid PDF header
          const uint8Array = new Uint8Array(arrayBuffer);
          console.log('Uint8Array length:', uint8Array.length);
          
          if (uint8Array.length < 4) {
            console.error('File too small to be a valid PDF');
            reject(new Error('Invalid PDF file: File is too small to be a valid PDF.'));
            return;
          }
          
          const pdfHeader = String.fromCharCode(...uint8Array.slice(0, 4));
          console.log('PDF header:', pdfHeader);
          console.log('First 10 bytes:', Array.from(uint8Array.slice(0, 10)).map(b => b.toString(16).padStart(2, '0')).join(' '));
          
          if (pdfHeader !== '%PDF') {
            console.error('Invalid PDF header:', pdfHeader);
            reject(new Error('Invalid PDF file: File does not have a valid PDF header.'));
            return;
          }
          
          console.log('PDF validation passed, resolving...');
          resolve({
            type: 'pdf',
            content: arrayBuffer,
            fileName,
            fileType: 'application/pdf',
            fileSize: this.formatFileSize(file.size)
          });
        } catch (error) {
          console.error('Error in PDF handling:', error);
          reject(error);
        }
      };
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        reject(new Error(`Failed to read PDF file: ${error}`));
      };
      reader.readAsArrayBuffer(file);
    });
  }

  private async handleWordFile(file: File, fileName: string, fileType: string): Promise<FilePreviewResult> {
    // Use docx-preview directly without HTML conversion
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          
          // Use docx-preview for direct rendering
          const container = document.createElement('div');
          container.style.cssText = `
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            color: #333;
            background: white;
            padding: 3rem;
            max-width: 900px;
            margin: 0 auto;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            border-radius: 8px;
            min-height: 100vh;
          `;
          
          // Configure docx-preview options for optimal rendering
          const options = {
            className: 'docx-preview',
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
            breakPages: true,
            ignoreLastRenderedPageBreak: true,
            experimental: true,
            trimXmlDeclaration: true,
            useBase64URL: true,
            useMathMLPolyfill: true,
            renderEndnotes: true,
            renderFooters: true,
            renderFootnotes: true,
            renderHeaders: true,
            renderImages: true,
            renderTables: true,
            renderLists: true,
            renderParagraphs: true,
            renderSections: true,
            renderComments: true,
            renderBookmarks: true,
            renderHyperlinks: true,
            renderFields: true,
            renderShapes: true,
            renderTextboxes: true,
            renderSmartArt: true,
            renderCharts: true,
            renderEquations: true,
            renderWatermarks: true,
            renderBackgrounds: true,
            renderBorders: true,
            renderShadows: true,
            renderGradients: true,
            renderPatterns: true,
            renderTextEffects: true,
            renderPageBreaks: true,
            renderColumnBreaks: true,
            renderLineBreaks: true,
            renderSoftHyphens: true,
            renderNonBreakingSpaces: true,
            renderEmSpaces: true,
            renderEnSpaces: true,
            renderThinSpaces: true,
            renderHairSpaces: true,
            renderZeroWidthSpaces: true,
            renderZeroWidthNonJoiners: true,
            renderZeroWidthJoiners: true,
            renderLeftToRightMarks: true,
            renderRightToLeftMarks: true,
            renderLeftToRightEmbeddings: true,
            renderRightToLeftEmbeddings: true,
            renderPopDirectionalFormatting: true,
            renderPopDirectionalIsolates: true,
            renderLeftToRightOverrides: true,
            renderRightToLeftOverrides: true,
            table: {
              maxWidth: 100,
              usePercentages: true,
              borderStyle: 'solid',
              borderWidth: '1px',
              borderColor: '#333',
              cellPadding: '6px',
              cellSpacing: '0px',
              headerBackground: '#f5f5f5',
              headerColor: '#333',
              zebraStripes: false,
              responsive: true
            },
            image: {
              preserveAspectRatio: true,
              maxWidth: '100%',
              maxHeight: 'auto',
              display: 'block',
              margin: '1rem auto',
              border: '1px solid #ccc',
              borderRadius: '2px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            },
            font: {
              fallback: 'Arial, Helvetica, sans-serif',
              size: '14px',
              lineHeight: '1.6',
              color: '#333'
            },
            paragraph: {
              margin: '0 0 1rem 0',
              textAlign: 'left',
              lineHeight: '1.6'
            },
            heading: {
              margin: '1.5rem 0 0.5rem 0',
              fontWeight: 'bold',
              color: '#333'
            },
            list: {
              margin: '0 0 1rem 0',
              paddingLeft: '2rem'
            },
            listItem: {
              margin: '0.25rem 0'
            }
          };
          
          console.log('Rendering DOCX with docx-preview...');
          await docxPreview.renderAsync(arrayBuffer, container, undefined, options);
          console.log('DOCX rendered successfully');
          
          // Post-process the rendered content to ensure images are properly displayed
          const images = container.querySelectorAll('img');
          images.forEach((img, index) => {
            if (img.src && img.src.startsWith('data:')) {
              // Image is already embedded as base64, ensure it's visible
              img.style.display = 'block';
              img.style.maxWidth = '100%';
              img.style.height = 'auto';
              img.style.margin = '1rem auto';
              img.style.border = '1px solid #dee2e6';
              img.style.borderRadius = '4px';
              img.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            } else if (!img.src || img.src === '') {
              // Handle missing image sources
              console.warn(`Image ${index} has no source, creating placeholder`);
              img.style.display = 'block';
              img.style.width = '200px';
              img.style.height = '150px';
              img.style.backgroundColor = '#f8f9fa';
              img.style.border = '2px dashed #dee2e6';
              img.style.borderRadius = '4px';
              img.style.margin = '1rem auto';
              img.alt = 'Image not available';
              img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
            }
          });
          
          // Add custom CSS to preserve document integrity
          const customStyles = `
            <style>
              .docx-preview {
                font-family: 'Times New Roman', serif;
                line-height: 1.6;
                color: #333;
                background: white;
                padding: 0;
                margin: 0;
                max-width: none;
              }
              
              .docx-preview * {
                box-sizing: border-box;
              }
              
              /* Preserve original document styling */
              .docx-preview h1, .docx-preview h2, .docx-preview h3, 
              .docx-preview h4, .docx-preview h5, .docx-preview h6 {
                margin-top: 1rem;
                margin-bottom: 0.5rem;
                color: #333;
                font-weight: bold;
                line-height: 1.2;
              }
              
              .docx-preview p {
                margin-bottom: 0.8rem;
                line-height: 1.6;
              }
              
              /* Document-specific styling */
              .docx-preview .page {
                margin-bottom: 2rem;
                page-break-after: always;
              }
              
              .docx-preview .page:last-child {
                page-break-after: auto;
              }
              
              /* Preserve text alignment */
              .docx-preview .text-center { text-align: center; }
              .docx-preview .text-right { text-align: right; }
              .docx-preview .text-left { text-align: left; }
              .docx-preview .text-justify { text-align: justify; }
              
              /* Preserve text formatting */
              .docx-preview .bold { font-weight: bold; }
              .docx-preview .italic { font-style: italic; }
              .docx-preview .underline { text-decoration: underline; }
              .docx-preview .strikethrough { text-decoration: line-through; }
              .docx-preview .highlight { background-color: yellow; }
              .docx-preview .superscript { vertical-align: super; font-size: smaller; }
              .docx-preview .subscript { vertical-align: sub; font-size: smaller; }
              
              /* Preserve indentation */
              .docx-preview .indent { margin-left: 2rem; }
              .docx-preview .indent-2 { margin-left: 4rem; }
              .docx-preview .indent-3 { margin-left: 6rem; }
              
              /* Document title styling */
              .docx-preview .document-title {
                font-size: 1.5rem;
                font-weight: bold;
                text-align: center;
                margin-bottom: 2rem;
                color: #333;
              }
              
              /* Activity details styling */
              .docx-preview .activity-details {
                margin-bottom: 2rem;
                padding: 1rem;
                background-color: #f9f9f9;
                border-left: 4px solid #007bff;
                border-radius: 4px;
              }
              
              .docx-preview .activity-details strong {
                color: #007bff;
                font-weight: bold;
              }
              
              /* Section headings */
              .docx-preview .section-heading {
                font-size: 1.2rem;
                font-weight: bold;
                margin-top: 2rem;
                margin-bottom: 1rem;
                color: #333;
                border-bottom: 2px solid #007bff;
                padding-bottom: 0.5rem;
              }
            </style>
          `;
          
          // Combine custom styles with the rendered content
          const htmlContent = customStyles + container.innerHTML;
          
          resolve({
            type: 'html',
            content: htmlContent,
            fileName,
            fileType,
            fileSize: this.formatFileSize(file.size)
          });
        } catch (error) {
          console.error('docx-preview failed:', error);
          reject(new Error(`Failed to render DOCX document: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  private async handleExcelFile(file: File, fileName: string, fileType: string): Promise<FilePreviewResult> {
    return Promise.resolve({
      type: 'spreadsheet',
      content: `Excel file: ${fileName}\n\nThis file contains spreadsheet data. For full functionality, please open in Microsoft Excel, Google Sheets, or LibreOffice Calc.\n\nFile size: ${this.formatFileSize(file.size)}`,
      fileName,
      fileType,
      fileSize: this.formatFileSize(file.size)
    });
  }

  private async handlePowerPointFile(file: File, fileName: string, fileType: string): Promise<FilePreviewResult> {
    return Promise.resolve({
      type: 'presentation',
      content: `PowerPoint file: ${fileName}\n\nThis file contains presentation data. For full functionality, please open in Microsoft PowerPoint, Google Slides, or LibreOffice Impress.\n\nFile size: ${this.formatFileSize(file.size)}`,
      fileName,
      fileType,
      fileSize: this.formatFileSize(file.size)
    });
  }

  private async handleTextFile(file: File, fileName: string, fileType: string): Promise<FilePreviewResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          resolve({
            type: 'text',
            content: content,
            fileName,
            fileType,
            fileSize: this.formatFileSize(file.size)
          });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file, 'UTF-8');
    });
  }

  private async handleOdfFile(file: File, fileName: string): Promise<FilePreviewResult> {
    return Promise.resolve({
      type: 'text',
      content: `ODF file: ${fileName}\n\nODF (Open Document Format) files are not directly supported in this preview. Please convert to PDF or Word format for preview, or open in LibreOffice, OpenOffice, or other ODF-compatible applications.\n\nFile size: ${this.formatFileSize(file.size)}`,
      fileName,
      fileType: 'application/vnd.oasis.opendocument.formula',
      fileSize: this.formatFileSize(file.size)
    });
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getSupportedFileTypes(): string[] {
    return [
      // Documents
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
      
      // Images
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/bmp',
      'image/webp',
      
      // Text files
      'text/plain',
      'text/markdown',
      'text/csv',
      'application/json',
      'application/xml',
      'text/html',
      
      // ODF
      'application/vnd.oasis.opendocument.formula',
      'application/vnd.oasis.opendocument.text',
      'application/vnd.oasis.opendocument.spreadsheet',
      'application/vnd.oasis.opendocument.presentation'
    ];
  }

  getSupportedExtensions(): string[] {
    return [
      // Documents
      'pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt',
      // Images
      'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp',
      // Text files
      'txt', 'md', 'csv', 'json', 'xml', 'html', 'htm',
      // ODF
      'odf', 'odt', 'ods', 'odp'
    ];
  }

  isFileSupported(file: File): boolean {
    const supportedTypes = this.getSupportedFileTypes();
    const supportedExtensions = this.getSupportedExtensions();
    const fileExtension = file.name.toLowerCase().split('.').pop() || '';
    
    return supportedTypes.includes(file.type.toLowerCase()) || 
           supportedExtensions.includes(fileExtension);
  }


} 
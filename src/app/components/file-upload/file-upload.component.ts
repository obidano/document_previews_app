import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilePreviewService } from '../../services/file-preview.service';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="file-upload-container" 
         (dragover)="onDragOver($event)" 
         (dragleave)="onDragLeave($event)"
         (drop)="onDrop($event)"
         [class.drag-over]="isDragOver">
      
      <div class="upload-area">
        <div class="upload-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7,10 12,15 17,10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </div>
        
        <h3>Upload Files</h3>
        <p>Drag and drop files here or click to browse</p>
        
        <div class="supported-formats">
          <p><strong>Supported formats:</strong></p>
          <ul>
            <li>📄 PDF Documents (.pdf)</li>
            <li>📝 Word Documents (.docx, .doc)</li>
            <li>📊 Excel Spreadsheets (.xlsx, .xls)</li>
            <li>📈 PowerPoint Presentations (.pptx, .ppt)</li>
            <li>🖼️ Images (.png, .jpg, .jpeg, .gif, .bmp, .webp)</li>
            <li>📄 Text Files (.txt, .md, .csv, .json, .xml, .html)</li>
            <li>📋 Open Documents (.odf, .odt, .ods, .odp)</li>
          </ul>
        </div>
        
        <button type="button" class="browse-btn" (click)="fileInput.click()">
          Browse Files
        </button>
        
        <input #fileInput 
               type="file" 
               [accept]="acceptedFileTypes"
               (change)="onFileSelected($event)"
               style="display: none;"
               multiple>
      </div>
      
      <div *ngIf="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
    </div>
  `,
  styles: [`
    .file-upload-container {
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 2rem;
      text-align: center;
      transition: all 0.3s ease;
      background: #fafafa;
      min-height: 300px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    .file-upload-container.drag-over {
      border-color: #007bff;
      background: #f0f8ff;
      transform: scale(1.02);
    }

    .upload-area {
      max-width: 500px;
    }

    .upload-icon {
      color: #666;
      margin-bottom: 1rem;
    }

    .upload-icon svg {
      width: 48px;
      height: 48px;
    }

    h3 {
      margin: 0 0 0.5rem 0;
      color: #333;
      font-size: 1.5rem;
    }

    p {
      margin: 0 0 1rem 0;
      color: #666;
    }

    .supported-formats {
      margin: 1.5rem 0;
      text-align: left;
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 6px;
    }

    .supported-formats p {
      margin: 0 0 0.5rem 0;
      font-weight: 500;
    }

    .supported-formats ul {
      margin: 0;
      padding-left: 1.5rem;
      color: #666;
    }

    .supported-formats li {
      margin: 0.25rem 0;
    }

    .browse-btn {
      background: #007bff;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1rem;
      transition: background 0.3s ease;
    }

    .browse-btn:hover {
      background: #0056b3;
    }

    .error-message {
      color: #dc3545;
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 4px;
      padding: 0.75rem;
      margin-top: 1rem;
      max-width: 500px;
    }
  `]
})
export class FileUploadComponent {
  @Output() fileSelected = new EventEmitter<File>();
  
  isDragOver = false;
  errorMessage = '';
  acceptedFileTypes = '.docx,.doc,.pdf,.png,.jpg,.jpeg,.gif,.bmp,.webp,.odf,.xlsx,.xls,.pptx,.ppt,.txt,.md,.csv,.json,.xml,.html,.htm,.odt,.ods,.odp';

  constructor(private filePreviewService: FilePreviewService) {}

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFiles(Array.from(files));
    }
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
      this.processFiles(Array.from(files));
    }
  }

  private processFiles(files: File[]) {
    this.errorMessage = '';
    
    for (const file of files) {
      if (this.filePreviewService.isFileSupported(file)) {
        // Additional validation for PDF files
        if (this.isPdfFile(file)) {
          const validationError = this.validatePdfFile(file);
          if (validationError) {
            this.errorMessage = validationError;
            return;
          }
        }
        
        this.fileSelected.emit(file);
      } else {
        this.errorMessage = `Unsupported file type: ${file.name}. Please upload a supported file type.`;
        break;
      }
    }
  }

  private isPdfFile(file: File): boolean {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  }

  private validatePdfFile(file: File): string | null {
    // Check if file is empty
    if (file.size === 0) {
      return `The PDF file "${file.name}" is empty (0 bytes). Please upload a valid PDF file.`;
    }
    
    // Check if file is too small to be a valid PDF (PDF header is at least 4 bytes)
    if (file.size < 4) {
      return `The file "${file.name}" is too small to be a valid PDF file.`;
    }
    
    return null;
  }
} 
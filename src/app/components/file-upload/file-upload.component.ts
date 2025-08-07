import { Component, EventEmitter, Output, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FilePreviewService } from '../../services/file-preview.service';
import { FileUploadService } from '../../services/file-upload.service';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent {
  @Output() fileSelected = new EventEmitter<File>();
  @Output() uploadSuccess = new EventEmitter<any>();
  @Output() uploadError = new EventEmitter<string>();
  
  isDragOver = false;
  errorMessage = '';
  uploading = false;
  acceptedFileTypes = '.docx,.doc,.pdf,.png,.jpg,.jpeg,.gif,.bmp,.webp';

  constructor(
    private filePreviewService: FilePreviewService,
    private fileUploadService: FileUploadService,
    public dialogRef: MatDialogRef<FileUploadComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  // Function to sanitize filenames by replacing special characters
  private sanitizeFilename(filename: string): string {
    // Replace special characters with safe alternatives
    const replacements: { [key: string]: string } = {
      'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
      'à': 'a', 'â': 'a', 'ä': 'a', 'á': 'a', 'ã': 'a',
      'ù': 'u', 'û': 'u', 'ü': 'u', 'ú': 'u',
      'ì': 'i', 'î': 'i', 'ï': 'i', 'í': 'i',
      'ò': 'o', 'ô': 'o', 'ö': 'o', 'ó': 'o', 'õ': 'o',
      'ñ': 'n', 'ç': 'c',
      'É': 'E', 'È': 'E', 'Ê': 'E', 'Ë': 'E',
      'À': 'A', 'Â': 'A', 'Ä': 'A', 'Á': 'A', 'Ã': 'A',
      'Ù': 'U', 'Û': 'U', 'Ü': 'U', 'Ú': 'U',
      'Ì': 'I', 'Î': 'I', 'Ï': 'I', 'Í': 'I',
      'Ò': 'O', 'Ô': 'O', 'Ö': 'O', 'Ó': 'O', 'Õ': 'O',
      'Ñ': 'N', 'Ç': 'C',
      ' ': '_', // Replace spaces with underscores
      '&': 'and',
      '#': 'hash',
      '%': 'percent',
      '+': 'plus',
      '=': 'equals',
      '@': 'at',
      '!': 'exclamation',
      '$': 'dollar',
      '^': 'caret',
      '*': 'asterisk',
      '(': '',
      ')': '',
      '[': '',
      ']': '',
      '{': '',
      '}': '',
      '|': '',
      '\\': '',
      '/': '',
      ':': '',
      ';': '',
      '"': '',
      "'": '',
      '<': '',
      '>': '',
      ',': '',
      '?': '',
      '~': '',
      '`': ''
    };
    
    let sanitized = filename;
    for (const [char, replacement] of Object.entries(replacements)) {
      sanitized = sanitized.replace(new RegExp(char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
    }
    
    // Remove any remaining non-alphanumeric characters except dots and hyphens
    sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '');
    
    // Ensure the filename doesn't start or end with dots or hyphens
    sanitized = sanitized.replace(/^[._-]+/, '').replace(/[._-]+$/, '');
    
    return sanitized;
  }

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
        
        // Upload to server
        this.uploadFile(file);
      } else {
        this.errorMessage = `Unsupported file type: ${file.name}. Please upload a supported file type.`;
        break;
      }
    }
  }

  private uploadFile(file: File) {
    this.uploading = true;
    this.errorMessage = '';

    // Log original filename for debugging
    console.log('Original filename:', file.name);
    
    // Create a new File object with sanitized name if needed
    let fileToUpload = file;
    const originalName = file.name;
    const sanitizedName = this.sanitizeFilename(originalName);
    
    if (originalName !== sanitizedName) {
      console.log('Sanitized filename:', sanitizedName);
      // Create a new File object with the sanitized name
      fileToUpload = new File([file], sanitizedName, { type: file.type });
    }

    this.fileUploadService.uploadFile(fileToUpload).subscribe({
      next: (response) => {
        this.uploading = false;
        this.uploadSuccess.emit(response.file);
        this.fileSelected.emit(file); // Keep for backward compatibility
        // Close the dialog after successful upload
        this.dialogRef.close(response.file);
      },
      error: (error) => {
        this.uploading = false;
        const errorMsg = error.error?.error || 'Upload failed. Please try again.';
        this.errorMessage = errorMsg;
        this.uploadError.emit(errorMsg);
      }
    });
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
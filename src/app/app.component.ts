import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { FilePreviewComponent } from './components/file-preview/file-preview.component';
import { FilePreviewService, FilePreviewResult } from './services/file-preview.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FileUploadComponent, FilePreviewComponent],
  template: `
    <div class="app-container">
      <header class="app-header">
        <h1>Document Preview App</h1>
        <p>Upload and preview your documents, images, and PDFs</p>
      </header>

      <main class="app-main">
        <div *ngIf="!currentPreview" class="upload-section">
          <app-file-upload (fileSelected)="onFileSelected($event)"></app-file-upload>
        </div>

        <div *ngIf="currentPreview" class="preview-section">
          <app-file-preview 
            [previewResult]="currentPreview"
            (onClose)="closePreview()">
          </app-file-preview>
          
          <div class="preview-actions">
            <button class="upload-another-btn" (click)="closePreview()">
              Upload Another File
            </button>
          </div>
        </div>

        <div *ngIf="isLoading" class="loading-overlay">
          <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Processing file...</p>
          </div>
        </div>

        <div *ngIf="errorMessage" class="error-overlay">
          <div class="error-message">
            <h3>Error</h3>
            <p>{{ errorMessage }}</p>
            <button (click)="clearError()">OK</button>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
    }

    .app-header {
      text-align: center;
      color: white;
      margin-bottom: 3rem;
    }

    .app-header h1 {
      font-size: 2.5rem;
      margin: 0 0 0.5rem 0;
      font-weight: 300;
    }

    .app-header p {
      font-size: 1.1rem;
      margin: 0;
      opacity: 0.9;
    }

    .app-main {
      max-width: 1200px;
      margin: 0 auto;
      position: relative;
    }

    .upload-section {
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .preview-section {
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .preview-actions {
      padding: 1.5rem;
      text-align: center;
      background: #f8f9fa;
      border-top: 1px solid #dee2e6;
    }

    .upload-another-btn {
      background: #28a745;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1rem;
      transition: background 0.3s ease;
    }

    .upload-another-btn:hover {
      background: #218838;
    }

    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .loading-spinner {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .error-message {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      max-width: 400px;
    }

    .error-message h3 {
      color: #dc3545;
      margin: 0 0 1rem 0;
    }

    .error-message p {
      margin: 0 0 1.5rem 0;
      color: #666;
    }

    .error-message button {
      background: #007bff;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
    }

    @media (max-width: 768px) {
      .app-container {
        padding: 1rem;
      }

      .app-header h1 {
        font-size: 2rem;
      }

      .app-header p {
        font-size: 1rem;
      }
    }
  `]
})
export class AppComponent {
  currentPreview: FilePreviewResult | null = null;
  isLoading = false;
  errorMessage = '';

  constructor(private filePreviewService: FilePreviewService) {}

  onFileSelected(file: File) {
    this.isLoading = true;
    this.errorMessage = '';

    this.filePreviewService.previewFile(file).subscribe({
      next: (result) => {
        this.currentPreview = result;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.message || 'Failed to process file';
        this.isLoading = false;
      }
    });
  }

  closePreview() {
    this.currentPreview = null;
  }

  clearError() {
    this.errorMessage = '';
  }
}

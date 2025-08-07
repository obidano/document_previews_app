import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, ChangeDetectorRef, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FilePreviewResult } from '../../services/file-preview.service';
import { PdfService } from '../../services/pdf.service';
import { SafePipe } from '../../pipes/safe.pipe';
import { DocxPreviewComponent } from '../docx-preview/docx-preview.component';

@Component({
  selector: 'app-file-preview',
  standalone: true,
  imports: [CommonModule, SafePipe, MatDialogModule, MatButtonModule, MatIconModule, DocxPreviewComponent],
  templateUrl: './file-preview.component.html',
  styleUrls: ['./file-preview.component.scss']
})
export class FilePreviewComponent implements OnInit, AfterViewInit, OnDestroy {
  previewResult: FilePreviewResult | null = null;
  @ViewChild('pdfCanvas', { static: false }) pdfCanvas!: ElementRef<HTMLCanvasElement>;

  pdfDocument: any = null;
  currentPage = 1;
  totalPages = 0;
  zoomLevel = 1.0;
  isLoading = false;
  isFullscreen = false;
  Math = Math;
  private blobUrls: string[] = [];
  pdfBlobUrl: string | null = null;
  originalFile: File | null = null;

  constructor(
    private pdfService: PdfService, 
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<FilePreviewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { previewResult: FilePreviewResult; originalFile?: File }
  ) {
    this.previewResult = data.previewResult;
    this.originalFile = data.originalFile || null;
  }

  ngOnInit() {
    // Test PDF.js functionality
    this.pdfService.testPdfJs().then(success => {
      console.log('PDF.js test result:', success);
    });
  }

  ngAfterViewInit() {
    if (this.previewResult?.type === 'pdf') {
      this.loadPdf();
    }
  }

  ngOnDestroy() {
    // Clean up blob URLs to prevent memory leaks
    this.blobUrls.forEach(url => {
      this.pdfService.revokeBlobUrl(url);
    });
    this.blobUrls = [];
    if (this.pdfBlobUrl) {
      this.pdfService.revokeBlobUrl(this.pdfBlobUrl);
      this.pdfBlobUrl = null;
    }
  }

  async loadPdf() {
    if (!this.previewResult || this.previewResult.type !== 'pdf') return;

    this.isLoading = true;
    try {
      const arrayBuffer = this.previewResult.content as ArrayBuffer;
      
      // Create blob URL for iframe fallback
      this.pdfBlobUrl = this.pdfService.createBlobUrl(arrayBuffer, 'application/pdf');
      this.blobUrls.push(this.pdfBlobUrl);
      
      console.log('Attempting to load PDF with PDF.js...');
      
      // Use the PDF service to load the document
      this.pdfDocument = await this.pdfService.loadPdfDocument(arrayBuffer);
      this.totalPages = this.pdfDocument.numPages;
      this.currentPage = 1;
      
      console.log('PDF loaded successfully, pages:', this.totalPages);
      
      // Force change detection to ensure canvas is rendered
      this.cdr.detectChanges();
      
      // Wait for the next tick to ensure canvas is available
      setTimeout(() => {
        this.renderPageWithRetry();
      }, 0);
    } catch (error) {
      console.error('Error loading PDF with PDF.js:', error);
      this.pdfDocument = null;
      
      // Don't show alert, just log the error and let the iframe fallback handle it
      console.log('PDF.js failed, using iframe fallback');
      
      // Keep the blob URL for iframe fallback
    } finally {
      this.isLoading = false;
    }
  }

  async renderPage() {
    if (!this.pdfDocument) {
      console.warn('PDF document not available for rendering');
      return;
    }
    
    if (!this.pdfCanvas) {
      console.warn('PDF canvas not available for rendering');
      return;
    }

    try {
      console.log('Rendering PDF page:', this.currentPage, 'with zoom:', this.zoomLevel);
      const page = await this.pdfDocument.getPage(this.currentPage);
      await this.pdfService.renderPage(page, this.pdfCanvas.nativeElement, this.zoomLevel);
      console.log('PDF page rendered successfully');
    } catch (error) {
      console.error('Error rendering PDF page:', error);
    }
  }

  async renderPageWithRetry(maxRetries: number = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      if (this.pdfCanvas) {
        console.log(`Attempt ${attempt}: Canvas is available, rendering page`);
        try {
          await this.renderPage();
          return;
        } catch (error) {
          console.error(`Error on attempt ${attempt}:`, error);
          if (attempt === maxRetries) {
            console.error('All rendering attempts failed, falling back to iframe');
            // Force fallback to iframe
            this.pdfDocument = null;
            this.cdr.detectChanges();
          }
        }
      } else {
        console.log(`Attempt ${attempt}: Canvas not available, waiting...`);
        if (attempt < maxRetries) {
          // Wait a bit longer for each retry
          await new Promise(resolve => setTimeout(resolve, 100 * attempt));
          this.cdr.detectChanges();
        }
      }
    }
    console.error('Failed to render PDF after all retry attempts');
  }

  async previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      await this.renderPageWithRetry();
    }
  }

  async nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      await this.renderPageWithRetry();
    }
  }

  async zoomIn() {
    this.zoomLevel = Math.min(this.zoomLevel * 1.2, 3.0);
    await this.renderPageWithRetry();
  }

  async zoomOut() {
    this.zoomLevel = Math.max(this.zoomLevel / 1.2, 0.5);
    await this.renderPageWithRetry();
  }

  toggleFullscreen() {
    this.isFullscreen = !this.isFullscreen;
  }

  downloadFile() {
    if (!this.previewResult) return;

    const blob = new Blob([this.previewResult.content as ArrayBuffer], { 
      type: this.getMimeType(this.previewResult.fileName) 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.previewResult.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  getMimeType(fileName: string): string {
    const extension = fileName.toLowerCase().split('.').pop();
    switch (extension) {
      case 'pdf': return 'application/pdf';
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'doc': return 'application/msword';
      case 'png': return 'image/png';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      default: return 'application/octet-stream';
    }
  }

  openPdfInNewTab() {
    if (this.previewResult && this.previewResult.type === 'pdf') {
      try {
        let url: string;
        
        // Use existing blob URL if available, otherwise create a new one
        if (this.pdfBlobUrl) {
          url = this.pdfBlobUrl;
        } else {
          const arrayBuffer = this.previewResult.content as ArrayBuffer;
          url = this.pdfService.createBlobUrl(arrayBuffer, 'application/pdf');
          this.blobUrls.push(url);
        }
        
        // Open in new tab with proper error handling
        const newWindow = window.open(url, '_blank');
        
        if (!newWindow) {
          // If popup is blocked, show a message
          alert('Popup blocked. Please allow popups for this site to view PDFs in a new tab.');
          if (url !== this.pdfBlobUrl) {
            this.pdfService.revokeBlobUrl(url);
            this.blobUrls = this.blobUrls.filter(u => u !== url);
          }
        }
      } catch (error) {
        console.error('Error opening PDF in new tab:', error);
        alert('Failed to open PDF in new tab. Please try downloading the file instead.');
      }
    }
  }

  getImageContent(): string {
    return this.previewResult?.type === 'image' ? this.previewResult.content as string : '';
  }

  getHtmlContent(): string {
    return this.previewResult?.type === 'html' ? this.previewResult.content as string : '';
  }

  getTextContent(): string {
    return this.previewResult?.type === 'text' ? this.previewResult.content as string : '';
  }
} 
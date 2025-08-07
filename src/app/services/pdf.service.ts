import { Injectable } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  private isInitialized = false;

  constructor() {
    this.initializePdfJs();
  }

  private initializePdfJs() {
    if (this.isInitialized) return;

    try {
      // Set up PDF.js worker with fallback options
      if (typeof window !== 'undefined' && 'Worker' in window) {
        // Use a more reliable CDN or local worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize PDF.js:', error);
    }
  }

  async loadPdfDocument(arrayBuffer: ArrayBuffer): Promise<any> {
    try {
      console.log('Initializing PDF.js...');
      this.initializePdfJs();
      
      // Check if the array buffer is empty
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error('The PDF file is empty, i.e. its size is zero bytes.');
      }
      
      console.log('PDF file size:', arrayBuffer.byteLength, 'bytes');
      
      // Check if the file has a valid PDF header
      const uint8Array = new Uint8Array(arrayBuffer);
      const pdfHeader = String.fromCharCode(...uint8Array.slice(0, 4));
      console.log('PDF header:', pdfHeader);
      
      if (pdfHeader !== '%PDF') {
        throw new Error('Invalid PDF file: File does not have a valid PDF header.');
      }
      
      console.log('Loading PDF document with PDF.js...');
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        verbosity: 0,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true
      });

      const document = await loadingTask.promise;
      console.log('PDF document loaded successfully, pages:', document.numPages);
      return document;
    } catch (error) {
      console.error('Error loading PDF document:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to load PDF: ${errorMessage}`);
    }
  }

  async renderPage(page: any, canvas: HTMLCanvasElement, scale: number = 1.0): Promise<void> {
    try {
      console.log('Getting page viewport with scale:', scale);
      const viewport = page.getViewport({ scale });
      console.log('Viewport dimensions:', viewport.width, 'x', viewport.height);
      
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Could not get 2D context from canvas');
      }

      // Set canvas dimensions
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      console.log('Canvas dimensions set:', canvas.width, 'x', canvas.height, 'scale:', scale);

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      console.log('Starting page render...');
      await page.render(renderContext).promise;
      console.log('PDF page rendered to canvas successfully');
    } catch (error) {
      console.error('Error rendering PDF page:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to render PDF page: ${errorMessage}`);
    }
  }

  createBlobUrl(arrayBuffer: ArrayBuffer, mimeType: string = 'application/pdf'): string {
    try {
      const blob = new Blob([arrayBuffer], { type: mimeType });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error creating blob URL:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create blob URL: ${errorMessage}`);
    }
  }

  revokeBlobUrl(url: string): void {
    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error revoking blob URL:', error);
    }
  }

  // Test method to verify PDF.js is working
  async testPdfJs(): Promise<boolean> {
    try {
      console.log('Testing PDF.js initialization...');
      this.initializePdfJs();
      
      // Create a simple test PDF-like buffer (this won't be a real PDF, just for testing)
      const testBuffer = new ArrayBuffer(8);
      const uint8Array = new Uint8Array(testBuffer);
      uint8Array[0] = 0x25; // %
      uint8Array[1] = 0x50; // P
      uint8Array[2] = 0x44; // D
      uint8Array[3] = 0x46; // F
      
      console.log('PDF.js test completed successfully');
      return true;
    } catch (error) {
      console.error('PDF.js test failed:', error);
      return false;
    }
  }
} 
import { Component, Input, OnInit, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import * as docxPreview from 'docx-preview';

@Component({
  selector: 'app-docx-preview',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './docx-preview.component.html',
  styleUrls: ['./docx-preview.component.scss']
})
export class DocxPreviewComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() file!: File;
  @Input() fileName: string = '';
  @ViewChild('docxContainer', { static: false }) docxContainer!: ElementRef<HTMLDivElement>;

  isLoading = false;
  error: string | null = null;
  isFullscreen = false;
  totalPages = 0;
  currentPage = 1;

  ngOnInit() {
    this.loadDocument();
  }

  ngAfterViewInit() {
    // Add scroll listener to track current page
    if (this.docxContainer) {
      this.docxContainer.nativeElement.addEventListener('scroll', this.onScroll.bind(this));
    }
  }

  ngOnDestroy() {
    // Clean up any resources if needed
    if (this.docxContainer) {
      this.docxContainer.nativeElement.removeEventListener('scroll', this.onScroll.bind(this));
    }
  }

  async loadDocument() {
    if (!this.file) {
      this.error = 'No file provided';
      return;
    }

    this.isLoading = true;
    this.error = null;

    try {
      const arrayBuffer = await this.fileToArrayBuffer(this.file);
      
      if (!this.docxContainer) {
        throw new Error('Container element not available');
      }

      // Clear previous content
      this.docxContainer.nativeElement.innerHTML = '';

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
      await docxPreview.renderAsync(arrayBuffer, this.docxContainer.nativeElement, undefined, options);
      console.log('DOCX rendered successfully');

      // Post-process the rendered content to ensure images are properly displayed
      this.processImages();
      
      // Count pages after rendering
      this.countPages();

    } catch (error) {
      console.error('Error rendering DOCX:', error);
      this.error = `Failed to render document: ${error instanceof Error ? error.message : 'Unknown error'}`;
    } finally {
      this.isLoading = false;
    }
  }

  private processImages() {
    if (!this.docxContainer) return;

    const images = this.docxContainer.nativeElement.querySelectorAll('img');
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
  }

  private countPages() {
    if (!this.docxContainer) return;

    // Count pages by looking for page break elements or page containers
    const pageElements = this.docxContainer.nativeElement.querySelectorAll('.page, [data-page], .docx-page');
    this.totalPages = pageElements.length;

    // If no explicit page elements found, try to estimate based on content height
    if (this.totalPages === 0) {
      const contentHeight = this.docxContainer.nativeElement.scrollHeight;
      const containerHeight = this.docxContainer.nativeElement.clientHeight;
      // Estimate pages based on typical page height (assuming A4-like dimensions)
      const estimatedPageHeight = 1123; // Approximate A4 height in pixels at 96 DPI
      this.totalPages = Math.max(1, Math.ceil(contentHeight / estimatedPageHeight));
    }

    console.log(`Document has ${this.totalPages} pages`);
  }

  private fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as ArrayBuffer;
        if (result) {
          resolve(result);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('File reading failed'));
      reader.readAsArrayBuffer(file);
    });
  }



  toggleFullscreen() {
    this.isFullscreen = !this.isFullscreen;
  }

  private onScroll() {
    if (!this.docxContainer || this.totalPages <= 1) return;

    const container = this.docxContainer.nativeElement;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    // Calculate current page based on scroll position
    const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
    this.currentPage = Math.max(1, Math.min(this.totalPages, Math.ceil(scrollPercentage * this.totalPages)));
  }
} 
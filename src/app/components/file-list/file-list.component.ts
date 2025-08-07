import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FileUploadService, FileInfo } from '../../services/file-upload.service';
import { FilePreviewService, FilePreviewResult } from '../../services/file-preview.service';
import { FileUploadComponent } from '../file-upload/file-upload.component';
import { FilePreviewComponent } from '../file-preview/file-preview.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-file-list',
  standalone: true,
  imports: [CommonModule, NgxDatatableModule, MatButtonModule, MatIconModule],
  templateUrl: './file-list.component.html',
  styleUrls: ['./file-list.component.scss']
})
export class FileListComponent implements OnInit {

  files: FileInfo[] = [];
  loading = false;
  error = '';

  columns = [
    { prop: 'type', name: 'Type', width: 50 },
    { prop: 'originalName', name: 'File Name' },
    { prop: 'size', name: 'File Size', width: 50 },
    { prop: 'uploadDate', name: 'Upload Date', width: 180 },
    { prop: 'actions', name: 'Actions', width: 250 }
  ];

  constructor(
    private fileUploadService: FileUploadService,
    private filePreviewService: FilePreviewService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadFiles();
  }

  loadFiles() {
    this.loading = true;
    this.error = '';

    this.fileUploadService.getFiles().subscribe({
      next: (files) => {
        this.files = files;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load files. Please try again.';
        this.loading = false;
        console.error('Error loading files:', error);
      }
    });
  }

  openUploadDialog() {
    const dialogRef = this.dialog.open(FileUploadComponent, {
      width: '600px',
      maxWidth: '90vw',
      height: 'auto',
      maxHeight: '90vh',
      disableClose: false,
      autoFocus: false,
      panelClass: 'file-upload-dialog'
    });
    
    // Listen for upload success to refresh the file list
    dialogRef.componentInstance.uploadSuccess.subscribe((fileInfo: FileInfo) => {
      this.loadFiles(); // Refresh the file list after successful upload
    });
  }

  openFilePreview(previewResult: FilePreviewResult, originalFile?: File): void {
    this.dialog.open(FilePreviewComponent, {
      width: '90vw',
      maxWidth: '1200px',
      height: '85vh',
      maxHeight: '800px',
      data: { previewResult, originalFile },
      disableClose: false,
      autoFocus: false,
      panelClass: 'file-preview-dialog'
    });
  }

  previewFile(file: FileInfo) {
    // Test file content first for debugging
    console.log('Testing file content before preview...');
    console.log('File info:', file);
    
    // Check if file size is valid
    if (file.size === 0) {
      this.error = 'File appears to be empty (0 bytes)';
      console.error('File size is 0 bytes:', file);
      return;
    }
    
    this.fileUploadService.testFileContent(file.filename).subscribe({
      next: (testResult) => {
        console.log('File test result:', testResult);
        if (testResult.fileExists && testResult.size > 0) {
          console.log('File is confirmed to exist and has content, proceeding with preview...');
          this.fetchFileForPreview(file);
        } else {
          console.warn('File may not exist or is empty:', testResult);
          this.error = 'File appears to be empty or does not exist on server';
        }
      },
      error: (error) => {
        console.error('File test failed:', error);
        // Still try to proceed with preview
        this.fetchFileForPreview(file);
      }
    });
  }

  private fetchFileForPreview(file: FileInfo) {
    // Use direct API endpoint for better reliability
    const fileUrl = this.fileUploadService.getFileUrl(file.filename);
    
    console.log('Fetching file for preview:', fileUrl);
    console.log('File info:', file);
    
    // Use a single, reliable fetch approach
    this.fetchFileDirectly(fileUrl, file);
  }

  private fetchFileDirectly(fileUrl: string, file: FileInfo) {
    console.log('Direct file fetch:', fileUrl);
    
    fetch(fileUrl, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Accept': '*/*',
        'Cache-Control': 'no-cache'
      }
    })
    .then(response => {
      console.log('Fetch response:', response);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Check if response has content
      const contentLength = response.headers.get('content-length');
      console.log('Content-Length header:', contentLength);
      
      if (contentLength && parseInt(contentLength) === 0) {
        throw new Error(`Server returned empty content (Content-Length: 0)`);
      }
      
      console.log('File fetched successfully, converting to blob...');
      return response.blob();
    })
    .then(blob => {
      console.log('Blob created, size:', blob.size);
      console.log('Blob type:', blob.type);
      
      // Validate blob size
      if (blob.size === 0) {
        throw new Error(`File blob is empty (0 bytes). Original file size was ${file.size} bytes.`);
      }
      
      // For PDF files, add additional validation
      if (file.mimetype === 'application/pdf') {
        console.log('Validating PDF blob...');
        // Read the first few bytes to check for PDF header
        const reader = new FileReader();
        reader.onload = (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);
          const header = String.fromCharCode(...uint8Array.slice(0, 4));
          console.log('PDF header check:', header);
          
          if (header !== '%PDF') {
            console.warn('Warning: File does not have valid PDF header:', header);
          }
        };
        reader.readAsArrayBuffer(blob.slice(0, 10)); // Read first 10 bytes
      }
      
      const fileObj = new File([blob], file.originalName, { type: file.mimetype });
      console.log('File object created, processing for preview...');
      console.log('File object size:', fileObj.size);
      console.log('File object type:', fileObj.type);
      
      this.filePreviewService.previewFile(fileObj).subscribe({
        next: (result) => {
          console.log('Preview result:', result);
          this.openFilePreview(result, fileObj);
        },
        error: (error) => {
          this.error = error.message || 'Failed to process file';
          console.error('Error processing file for preview:', error);
        }
      });
    })
    .catch(error => {
      console.error('File fetch failed:', error);
      this.error = 'Failed to load file for preview: ' + error.message;
      
      // Try the uploads endpoint as fallback
      console.log('Trying uploads endpoint as fallback...');
      this.tryUploadsEndpoint(file);
    });
  }

  private tryUploadsEndpoint(file: FileInfo) {
    const uploadsUrl = `/uploads/${encodeURIComponent(file.filename)}`;
    console.log('Trying uploads endpoint:', uploadsUrl);
    
    fetch(uploadsUrl, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Accept': '*/*',
        'Cache-Control': 'no-cache'
      }
    })
    .then(response => {
      console.log('Uploads endpoint response:', response);
      if (!response.ok) {
        throw new Error(`Uploads endpoint failed: ${response.status}`);
      }
      return response.blob();
    })
    .then(blob => {
      console.log('Uploads endpoint blob created, size:', blob.size);
      
      if (blob.size === 0) {
        throw new Error('Uploads endpoint returned empty blob');
      }
      
      const fileObj = new File([blob], file.originalName, { type: file.mimetype });
      this.filePreviewService.previewFile(fileObj).subscribe({
        next: (result) => {
          console.log('Uploads endpoint preview result:', result);
          this.openFilePreview(result, fileObj);
        },
        error: (error) => {
          this.error = 'Uploads endpoint failed: ' + error.message;
          console.error('Uploads endpoint error:', error);
        }
      });
    })
    .catch(error => {
      console.error('Uploads endpoint failed:', error);
      this.error = 'All file access methods failed: ' + error.message;
    });
  }

  downloadFile(file: FileInfo) {
    const url = this.fileUploadService.getFileUrl(file.filename);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  deleteFile(file: FileInfo) {
    if (confirm(`Are you sure you want to delete "${file.originalName}"?`)) {
      this.fileUploadService.deleteFile(file.id).subscribe({
        next: () => {
          this.loadFiles(); // Reload the list
        },
        error: (error) => {
          this.error = 'Failed to delete file. Please try again.';
          console.error('Error deleting file:', error);
        }
      });
    }
  }

  getFileIcon(mimetype: string): string {
    if (mimetype.startsWith('image/')) return '🖼️';
    if (mimetype === 'application/pdf') return '📄';
    if (mimetype.includes('word')) return '📝';
    return '📄';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }


} 
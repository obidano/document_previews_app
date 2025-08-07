import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FileInfo {
  id: string;
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  uploadDate: string;
  path: string;
}

export interface UploadResponse {
  message: string;
  file: FileInfo;
}

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  uploadFile(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<UploadResponse>(`${this.apiUrl}/upload`, formData);
  }

  getFiles(): Observable<FileInfo[]> {
    return this.http.get<FileInfo[]>(`${this.apiUrl}/files`);
  }

  deleteFile(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/files/${id}`);
  }

  getFileUrl(filename: string): string {
    // Use the direct API endpoint for better reliability
    // The proxy will handle routing to the server
    const encodedFilename = encodeURIComponent(filename);
    console.log('Original filename:', filename);
    console.log('Encoded filename:', encodedFilename);
    return `${this.apiUrl}/file/${encodedFilename}`;
  }

  testFileContent(filename: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/test-file/${encodeURIComponent(filename)}`);
  }


} 
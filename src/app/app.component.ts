import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileListComponent } from './components/file-list/file-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FileListComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
}

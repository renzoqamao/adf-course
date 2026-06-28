import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogModule
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { QuickNoteApiService } from '../../quick-note-api.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
@Component({
  selector: 'aca-note-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TranslateModule,
    MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule,MatProgressSpinnerModule
  ],
  templateUrl: './note-dialog.component.html'
})
export class NoteDialogComponent  implements OnInit {
  private readonly ref = inject(MatDialogRef<NoteDialogComponent>);
  private readonly api = inject(QuickNoteApiService);
  readonly data = inject<{ maxLength: number; nodeId: string }>(MAT_DIALOG_DATA);
  loading = true;
  text = '';

  ngOnInit(): void {
  if (!this.data.nodeId) {      // modo lote: sin precarga
    this.loading = false;
    return;
  }
  this.api.getNote(this.data.nodeId).subscribe((current) => {
    this.text = current;
    this.loading = false;
  });
}

  save(): void {
    this.ref.close(this.text.trim());   // emite en afterClosed()
  }
  cancel(): void {
    this.ref.close();                   // emite undefined
  }
}

import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogModule
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'aca-note-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TranslateModule,
    MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule
  ],
  templateUrl: './note-dialog.component.html'
})
export class NoteDialogComponent {
  private readonly ref = inject(MatDialogRef<NoteDialogComponent>);
  readonly data = inject<{ maxLength: number }>(MAT_DIALOG_DATA);
  text = '';

  save(): void {
    this.ref.close(this.text.trim());   // emite en afterClosed()
  }
  cancel(): void {
    this.ref.close();                   // emite undefined
  }
}

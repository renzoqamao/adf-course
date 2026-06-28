import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map } from 'rxjs/operators';
import { ADD_NOTE_ACTION, AddNoteAction } from './quick-note.actions';
import { QuickNoteService } from './quick-note.service';

@Injectable()
export class QuickNoteEffects {
  private readonly actions$ = inject(Actions);
  private readonly service = inject(QuickNoteService);

  addNote$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<AddNoteAction>(ADD_NOTE_ACTION),
        map((action) => this.service.addNote(action.payload))
      ),
    { dispatch: false }   // no devolvemos otra acción
  );
}

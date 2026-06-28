import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map } from 'rxjs/operators';
import { ADD_NOTE_ACTION, AddNoteAction } from './quick-note.actions';
import { QuickNoteService } from './quick-note.service';
import { ADD_NOTE_TO_SELECTION_ACTION, AddNoteToSelectionAction } from './quick-note.actions';

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

  addNoteToSelection$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<AddNoteToSelectionAction>(ADD_NOTE_TO_SELECTION_ACTION),
        map((action) => this.service.addNoteToSelection(action.payload))
      ),
    { dispatch: false }
  );

}

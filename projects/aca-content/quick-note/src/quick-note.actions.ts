import { Action } from '@ngrx/store';
import { Node } from '@alfresco/js-api';

export const ADD_NOTE_ACTION = 'ADD_NOTE';   // == el "type" del plugin.json

export class AddNoteAction implements Action {
  readonly type = ADD_NOTE_ACTION;
  constructor(public payload: Node) {}
}

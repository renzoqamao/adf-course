import { Action } from '@ngrx/store';
import { Node, NodeEntry } from '@alfresco/js-api';

export const ADD_NOTE_ACTION = 'ADD_NOTE';   // == el "type" del plugin.json
export const ADD_NOTE_TO_SELECTION_ACTION = 'ADD_NOTE_TO_SELECTION';

export class AddNoteAction implements Action {
  readonly type = ADD_NOTE_ACTION;
  constructor(public payload: Node) {}
}

export class AddNoteToSelectionAction implements Action {
  readonly type = ADD_NOTE_TO_SELECTION_ACTION;
  constructor(public payload: NodeEntry[]) {}
}

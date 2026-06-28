/// <reference types="jasmine" />
import { canAddNote } from './quick-note.rules';

describe('canAddNote', () => {
  it('false cuando no hay selección', () => {
    const context = { selection: { count: 0 } } as any;
    expect(canAddNote(context)).toBe(false);
  });

  it('true para un nodo con permiso de update', () => {
    const context = {
      selection: { count: 1, first: { entry: { id: '1', name: 'X' } } },
      permissions: { check: () => true }
    } as any;
    expect(canAddNote(context)).toBe(true);
  });

  it('false sin permiso de update', () => {
    const context = {
      selection: { count: 1, first: { entry: { id: '1' } } },
      permissions: { check: () => false }
    } as any;
    expect(canAddNote(context)).toBe(false);
  });

  it('false con varios seleccionados', () => {
    const context = { selection: { count: 2 } } as any;
    expect(canAddNote(context)).toBe(false);
  });
});

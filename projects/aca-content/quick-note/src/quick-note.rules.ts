import { RuleContext } from '@alfresco/adf-extensions';

/** Devuelve el único nodo seleccionado, o undefined. */
const getSingleNode = (context: RuleContext) =>
  context?.selection?.count === 1 ? context.selection.first : undefined;

/**
 * Visible si hay UN nodo seleccionado y el usuario puede actualizarlo.
 * Ref JSON: `quick-note.canAddNote`
 */
export function canAddNote(context: RuleContext): boolean {
  const node = getSingleNode(context);
  return !!node && context.permissions.check(node.entry, ['update']);
}

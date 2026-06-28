import { Injectable, inject } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NodesApi } from '@alfresco/js-api';
import { AlfrescoApiService } from '@alfresco/adf-content-services';

@Injectable({ providedIn: 'root' })
export class QuickNoteApiService {
  private readonly apiService = inject(AlfrescoApiService);
  private get nodesApi() {
    return new NodesApi(this.apiService.getInstance());
  }

  /** Guarda la nota en cm:description del nodo. */
  saveNote(nodeId: string, text: string): Observable<unknown> {
    return from(
      this.nodesApi.updateNode(nodeId, { properties: { 'cm:description': text } })
    );
  }

  /** Lee la nota actual (si existe). */
  getNote(nodeId: string): Observable<string> {
    return from(this.nodesApi.getNode(nodeId, { include: ['properties'] })).pipe(
      map(({ entry }) => (entry.properties?.['cm:description'] as string) ?? '')
    );
  }
}

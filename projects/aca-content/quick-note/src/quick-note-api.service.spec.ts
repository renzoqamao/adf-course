/// <reference types="jasmine" />
import { TestBed } from '@angular/core/testing';
import { AlfrescoApiService } from '@alfresco/adf-content-services';
import { QuickNoteApiService } from './quick-note-api.service';

describe('QuickNoteApiService', () => {
  // El servicio usa inject(AlfrescoApiService) en un field initializer, así que NO
  // se puede crear con `new` (daría NG0203). Lo creamos con TestBed (contexto de DI)
  // y mockeamos AlfrescoApiService; luego reemplazamos el getter `nodesApi`.
  function createService(nodesApiDouble: any): QuickNoteApiService {
    TestBed.configureTestingModule({
      providers: [
        QuickNoteApiService,
        { provide: AlfrescoApiService, useValue: { getInstance: () => ({}) } }
      ]
    });
    const service = TestBed.inject(QuickNoteApiService);
    Object.defineProperty(service, 'nodesApi', { get: () => nodesApiDouble });
    return service;
  }

  it('saveNote llama a updateNode con cm:description', (done) => {
    const updateNode = jasmine.createSpy('updateNode').and.returnValue(Promise.resolve({}));
    const service = createService({ updateNode });

    service.saveNote('node-1', 'hola').subscribe(() => {
      expect(updateNode).toHaveBeenCalledWith('node-1', { properties: { 'cm:description': 'hola' } });
      done();
    });
  });

  it('getNote devuelve cm:description del nodo', (done) => {
    const getNode = jasmine.createSpy('getNode').and.returnValue(
      Promise.resolve({ entry: { properties: { 'cm:description': 'hola' } } })
    );
    const service = createService({ getNode });

    service.getNote('node-1').subscribe((text) => {
      expect(getNode).toHaveBeenCalledWith('node-1', { include: ['properties'] });
      expect(text).toBe('hola');
      done();
    });
  });

  it('getNote devuelve "" cuando el nodo no tiene nota', (done) => {
    const getNode = jasmine.createSpy('getNode').and.returnValue(
      Promise.resolve({ entry: { properties: {} } })
    );
    const service = createService({ getNode });

    service.getNote('node-1').subscribe((text) => {
      expect(text).toBe('');
      done();
    });
  });
});

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { NotaFiscal, StatusNF } from '../models';

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

@Injectable({ providedIn: 'root' })
export class NotaFiscalService {
  private readonly STORAGE_KEY = 'sc_notas_fiscais';
  private nfsSubject = new BehaviorSubject<NotaFiscal[]>(this.loadFromStorage());
  nfs$ = this.nfsSubject.asObservable();

  private loadFromStorage(): NotaFiscal[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveToStorage(nfs: NotaFiscal[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(nfs));
    this.nfsSubject.next(nfs);
  }

  getAll(): Observable<NotaFiscal[]> {
    return this.nfs$;
  }

  getById(id: string): Observable<NotaFiscal | undefined> {
    return this.nfs$.pipe(map(nfs => nfs.find(x => x.id === id)));
  }

  getByCliente(clienteId: string): Observable<NotaFiscal[]> {
    return this.nfs$.pipe(map(nfs => nfs.filter(x => x.tomadorId === clienteId)));
  }

  getEmitidas(): Observable<NotaFiscal[]> {
    return this.nfs$.pipe(map(nfs => nfs.filter(x => x.status === 'EMITIDA')));
  }

  create(data: Omit<NotaFiscal, 'id' | 'criadoEm' | 'atualizadoEm'>): Observable<NotaFiscal> {
    const now = new Date().toISOString();
    const total = this.nfsSubject.getValue().length + 1;
    const novo: NotaFiscal = {
      ...data,
      id: uuidv4(),
      numero: String(total).padStart(6, '0'),
      criadoEm: now,
      atualizadoEm: now,
    };
    this.saveToStorage([...this.nfsSubject.getValue(), novo]);
    return of(novo);
  }

  update(id: string, data: Partial<NotaFiscal>): Observable<NotaFiscal | undefined> {
    const lista = this.nfsSubject.getValue();
    const idx = lista.findIndex(n => n.id === id);
    if (idx === -1) return of(undefined);
    const atualizado: NotaFiscal = { ...lista[idx], ...data, id, atualizadoEm: new Date().toISOString() };
    lista[idx] = atualizado;
    this.saveToStorage([...lista]);
    return of(atualizado);
  }

  emitir(id: string): Observable<NotaFiscal | undefined> {
    return this.update(id, { status: 'EMITIDA' });
  }

  cancelar(id: string, motivo: string): Observable<NotaFiscal | undefined> {
    return this.update(id, { status: 'CANCELADA', motivoCancelamento: motivo });
  }

  delete(id: string): Observable<boolean> {
    this.saveToStorage(this.nfsSubject.getValue().filter(n => n.id !== id));
    return of(true);
  }
}

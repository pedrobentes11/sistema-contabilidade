import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Boleto, StatusBoleto } from '../models';

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

@Injectable({ providedIn: 'root' })
export class BoletoService {
  private readonly STORAGE_KEY = 'sc_boletos';
  private boletosSubject = new BehaviorSubject<Boleto[]>(this.loadFromStorage());
  boletos$ = this.boletosSubject.asObservable();

  private loadFromStorage(): Boleto[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveToStorage(boletos: Boleto[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(boletos));
    this.boletosSubject.next(boletos);
  }

  getAll(): Observable<Boleto[]> {
    return this.boletos$;
  }

  getById(id: string): Observable<Boleto | undefined> {
    return this.boletos$.pipe(map(b => b.find(x => x.id === id)));
  }

  getByCliente(clienteId: string): Observable<Boleto[]> {
    return this.boletos$.pipe(map(b => b.filter(x => x.clienteId === clienteId)));
  }

  getVencidos(): Observable<Boleto[]> {
    const hoje = new Date().toISOString().substring(0, 10);
    return this.boletos$.pipe(
      map(b => b.filter(x => x.status === 'EMITIDO' && x.dataVencimento < hoje))
    );
  }

  create(data: Omit<Boleto, 'id' | 'criadoEm' | 'atualizadoEm'>): Observable<Boleto> {
    const now = new Date().toISOString();
    const novo: Boleto = {
      ...data,
      id: uuidv4(),
      nossoNumero: this.gerarNossoNumero(),
      criadoEm: now,
      atualizadoEm: now,
    };
    this.saveToStorage([...this.boletosSubject.getValue(), novo]);
    return of(novo);
  }

  update(id: string, data: Partial<Boleto>): Observable<Boleto | undefined> {
    const lista = this.boletosSubject.getValue();
    const idx = lista.findIndex(b => b.id === id);
    if (idx === -1) return of(undefined);
    const atualizado: Boleto = { ...lista[idx], ...data, id, atualizadoEm: new Date().toISOString() };
    lista[idx] = atualizado;
    this.saveToStorage([...lista]);
    return of(atualizado);
  }

  delete(id: string): Observable<boolean> {
    this.saveToStorage(this.boletosSubject.getValue().filter(b => b.id !== id));
    return of(true);
  }

  marcarComoPago(id: string): Observable<Boleto | undefined> {
    return this.update(id, {
      status: 'PAGO',
      dataPagamento: new Date().toISOString().substring(0, 10),
    });
  }

  cancelar(id: string): Observable<Boleto | undefined> {
    return this.update(id, { status: 'CANCELADO' });
  }

  private gerarNossoNumero(): string {
    return Date.now().toString().slice(-10);
  }

  gerarLinhaDigitavel(boleto: Boleto): string {
    // Geração simplificada para simulação (em produção usa API bancária)
    const valor = boleto.valor.toFixed(2).replace('.', '').padStart(10, '0');
    return `00190.00009 ${boleto.nossoNumero.slice(0, 5)}.${boleto.nossoNumero.slice(5)} 00000.000000 1 ${boleto.dataVencimento.replace(/-/g, '')}${valor}`;
  }
}

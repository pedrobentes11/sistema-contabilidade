import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Cliente, ClienteResumo, StatusCliente } from '../models';

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly STORAGE_KEY = 'sc_clientes';
  private clientesSubject = new BehaviorSubject<Cliente[]>(this.loadFromStorage());
  clientes$ = this.clientesSubject.asObservable();

  private loadFromStorage(): Cliente[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveToStorage(clientes: Cliente[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(clientes));
    this.clientesSubject.next(clientes);
  }

  getAll(): Observable<Cliente[]> {
    return this.clientes$;
  }

  getResumos(): Observable<ClienteResumo[]> {
    return this.clientes$.pipe(
      map(clientes =>
        clientes.map(c => ({
          id: c.id,
          nomeRazaoSocial: c.tipoPessoa === 'JURIDICA' ? (c.razaoSocial || '') : (c.nomeCompleto || ''),
          cnpjCpf: c.tipoPessoa === 'JURIDICA' ? (c.cnpj || '') : (c.cpf || ''),
          email: c.contato.email,
          status: c.status,
          regimeTributario: c.regimeTributario,
          honorarioMensal: c.honorarioMensal,
        }))
      )
    );
  }

  getById(id: string): Observable<Cliente | undefined> {
    return this.clientes$.pipe(map(clientes => clientes.find(c => c.id === id)));
  }

  search(termo: string): Observable<Cliente[]> {
    const termoLower = termo.toLowerCase().trim();
    return this.clientes$.pipe(
      map(clientes =>
        clientes.filter(c => {
          const nome = c.tipoPessoa === 'JURIDICA' ? c.razaoSocial : c.nomeCompleto;
          const cnpjCpf = c.tipoPessoa === 'JURIDICA' ? c.cnpj : c.cpf;
          return (
            nome?.toLowerCase().includes(termoLower) ||
            cnpjCpf?.includes(termoLower) ||
            c.contato.email.toLowerCase().includes(termoLower) ||
            c.nomeFantasia?.toLowerCase().includes(termoLower)
          );
        })
      )
    );
  }

  filterByStatus(status: StatusCliente): Observable<Cliente[]> {
    return this.clientes$.pipe(map(clientes => clientes.filter(c => c.status === status)));
  }

  create(data: Omit<Cliente, 'id' | 'dataCadastro' | 'dataUltimaAtualizacao'>): Observable<Cliente> {
    const now = new Date().toISOString();
    const novoCliente: Cliente = {
      ...data,
      id: uuidv4(),
      dataCadastro: now,
      dataUltimaAtualizacao: now,
    };
    const clientes = [...this.clientesSubject.getValue(), novoCliente];
    this.saveToStorage(clientes);
    return of(novoCliente);
  }

  update(id: string, data: Partial<Cliente>): Observable<Cliente | undefined> {
    const clientes = this.clientesSubject.getValue();
    const idx = clientes.findIndex(c => c.id === id);
    if (idx === -1) return of(undefined);
    const atualizado: Cliente = {
      ...clientes[idx],
      ...data,
      id,
      dataUltimaAtualizacao: new Date().toISOString(),
    };
    clientes[idx] = atualizado;
    this.saveToStorage([...clientes]);
    return of(atualizado);
  }

  delete(id: string): Observable<boolean> {
    const clientes = this.clientesSubject.getValue().filter(c => c.id !== id);
    this.saveToStorage(clientes);
    return of(true);
  }

  getNomeExibicao(c: Cliente): string {
    return c.tipoPessoa === 'JURIDICA'
      ? (c.nomeFantasia || c.razaoSocial || '')
      : (c.nomeCompleto || '');
  }
}

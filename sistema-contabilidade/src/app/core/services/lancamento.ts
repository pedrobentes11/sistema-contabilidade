import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Lancamento,
  TipoLancamento,
  StatusLancamento,
  ExtratoFiltro,
  ResumoFinanceiro,
  ExtratoCliente,
} from '../models';
import { ClienteService } from './cliente';

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

@Injectable({ providedIn: 'root' })
export class LancamentoService {
  private readonly STORAGE_KEY = 'sc_lancamentos';
  private lancamentosSubject = new BehaviorSubject<Lancamento[]>(this.loadFromStorage());
  lancamentos$ = this.lancamentosSubject.asObservable();

  constructor(private clienteService: ClienteService) {}

  private loadFromStorage(): Lancamento[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveToStorage(lancamentos: Lancamento[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(lancamentos));
    this.lancamentosSubject.next(lancamentos);
  }

  getAll(): Observable<Lancamento[]> {
    return this.lancamentos$;
  }

  getById(id: string): Observable<Lancamento | undefined> {
    return this.lancamentos$.pipe(map(l => l.find(x => x.id === id)));
  }

  getByCliente(clienteId: string): Observable<Lancamento[]> {
    return this.lancamentos$.pipe(map(l => l.filter(x => x.clienteId === clienteId)));
  }

  filtrar(filtro: ExtratoFiltro): Observable<Lancamento[]> {
    return this.lancamentos$.pipe(
      map(lancamentos =>
        lancamentos.filter(l => {
          if (filtro.clienteId && l.clienteId !== filtro.clienteId) return false;
          if (filtro.tipo && l.tipo !== filtro.tipo) return false;
          if (filtro.status && l.status !== filtro.status) return false;
          if (filtro.categoria && l.categoria !== filtro.categoria) return false;
          if (filtro.dataInicio && l.dataLancamento < filtro.dataInicio) return false;
          if (filtro.dataFim && l.dataLancamento > filtro.dataFim) return false;
          return true;
        })
      )
    );
  }

  getResumoFinanceiro(clienteId?: string): Observable<ResumoFinanceiro> {
    return this.lancamentos$.pipe(
      map(lancamentos => {
        const filtrados = clienteId ? lancamentos.filter(l => l.clienteId === clienteId) : lancamentos;
        const receitas = filtrados.filter(l => l.tipo === 'RECEITA');
        const despesas = filtrados.filter(l => l.tipo === 'DESPESA');
        const hoje = new Date().toISOString().substring(0, 10);
        return {
          totalReceitas: receitas.filter(l => l.status === 'RECEBIDO').reduce((s, l) => s + l.valor, 0),
          totalDespesas: despesas.filter(l => l.status === 'PAGO').reduce((s, l) => s + l.valor, 0),
          saldo:
            receitas.filter(l => l.status === 'RECEBIDO').reduce((s, l) => s + l.valor, 0) -
            despesas.filter(l => l.status === 'PAGO').reduce((s, l) => s + l.valor, 0),
          receitasPendentes: receitas.filter(l => l.status === 'PENDENTE').reduce((s, l) => s + l.valor, 0),
          despesasPendentes: despesas.filter(l => l.status === 'PENDENTE').reduce((s, l) => s + l.valor, 0),
          lancamentosVencidos: filtrados.filter(
            l => l.status === 'PENDENTE' && l.dataVencimento < hoje
          ).length,
        };
      })
    );
  }

  gerarExtratoCliente(clienteId: string, dataInicio: string, dataFim: string): Observable<ExtratoCliente | undefined> {
    const clientes = this.clienteService['clientesSubject'].getValue();
    const cliente = clientes.find(c => c.id === clienteId);
    if (!cliente) return of(undefined);
    return this.filtrar({ clienteId, dataInicio, dataFim }).pipe(
      map(lancamentos => {
        const receitas = lancamentos.filter(l => l.tipo === 'RECEITA' && l.status === 'RECEBIDO');
        const despesas = lancamentos.filter(l => l.tipo === 'DESPESA' && l.status === 'PAGO');
        return {
          clienteId,
          clienteNome:
            cliente.tipoPessoa === 'JURIDICA'
              ? cliente.razaoSocial || ''
              : cliente.nomeCompleto || '',
          clienteCnpjCpf: cliente.tipoPessoa === 'JURIDICA' ? (cliente.cnpj || '') : (cliente.cpf || ''),
          periodo: { inicio: dataInicio, fim: dataFim },
          lancamentos,
          totalReceitas: receitas.reduce((s, l) => s + l.valor, 0),
          totalDespesas: despesas.reduce((s, l) => s + l.valor, 0),
          saldo: receitas.reduce((s, l) => s + l.valor, 0) - despesas.reduce((s, l) => s + l.valor, 0),
          dataGeracao: new Date().toISOString(),
        };
      })
    );
  }

  create(data: Omit<Lancamento, 'id' | 'criadoEm' | 'atualizadoEm'>): Observable<Lancamento> {
    const now = new Date().toISOString();
    const novo: Lancamento = { ...data, id: uuidv4(), criadoEm: now, atualizadoEm: now };
    this.saveToStorage([...this.lancamentosSubject.getValue(), novo]);
    return of(novo);
  }

  update(id: string, data: Partial<Lancamento>): Observable<Lancamento | undefined> {
    const lista = this.lancamentosSubject.getValue();
    const idx = lista.findIndex(l => l.id === id);
    if (idx === -1) return of(undefined);
    const atualizado: Lancamento = { ...lista[idx], ...data, id, atualizadoEm: new Date().toISOString() };
    lista[idx] = atualizado;
    this.saveToStorage([...lista]);
    return of(atualizado);
  }

  delete(id: string): Observable<boolean> {
    this.saveToStorage(this.lancamentosSubject.getValue().filter(l => l.id !== id));
    return of(true);
  }

  marcarComoPago(id: string): Observable<Lancamento | undefined> {
    const item = this.lancamentosSubject.getValue().find(l => l.id === id);
    if (!item) return of(undefined);
    const status: StatusLancamento = item.tipo === 'RECEITA' ? 'RECEBIDO' : 'PAGO';
    return this.update(id, { status, dataPagamento: new Date().toISOString().substring(0, 10) });
  }
}

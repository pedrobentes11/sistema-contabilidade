import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LancamentoService } from '../../../core/services/lancamento';
import { ClienteService } from '../../../core/services/cliente';
import { Lancamento } from '../../../core/models';

const TIPOS_LANCAMENTO = ['RECEITA', 'DESPESA'] as const;
const STATUS_LANCAMENTO = ['PENDENTE', 'PAGO', 'RECEBIDO', 'CANCELADO', 'VENCIDO'] as const;

@Component({
  selector: 'app-lancamentos-lista',
  standalone: false,
  templateUrl: './lancamentos-lista.html',
  styleUrl: './lancamentos-lista.scss',
})
export class LancamentosLista implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<Lancamento>();
  displayedColumns = ['tipo', 'descricao', 'cliente', 'categoria', 'data', 'valor', 'status', 'acoes'];

  tipoFiltro: string = '';
  statusFiltro: string = '';
  clienteIdFiltro: string = '';
  buscaTexto: string = '';

  clientes: { id: string; nome: string }[] = [];
  tiposLancamento = [...TIPOS_LANCAMENTO];
  statusList = [...STATUS_LANCAMENTO];

  resumo = { receitas: 0, despesas: 0, saldo: 0 };

  private todosLancamentos: Lancamento[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private lancamentoService: LancamentoService,
    private clienteService: ClienteService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.lancamentoService.lancamentos$,
      this.clienteService.clientes$,
      this.route.queryParams
    ]).pipe(takeUntil(this.destroy$)).subscribe(([lancamentos, clientes, params]) => {
      this.clientes = clientes.map(c => ({
        id: c.id,
        nome: c.tipoPessoa === 'JURIDICA' ? (c.razaoSocial || '') : (c.nomeCompleto || '')
      }));

      if (params['clienteId'] && !this.clienteIdFiltro) {
        this.clienteIdFiltro = params['clienteId'];
      }

      this.todosLancamentos = lancamentos;
      this.aplicarFiltros();

      this.resumo = {
        receitas: lancamentos.filter(l => l.tipo === 'RECEITA').reduce((s, l) => s + l.valor, 0),
        despesas: lancamentos.filter(l => l.tipo === 'DESPESA').reduce((s, l) => s + l.valor, 0),
        saldo: 0
      };
      this.resumo.saldo = this.resumo.receitas - this.resumo.despesas;
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (item, col) => {
      if (col === 'valor') return item.valor;
      if (col === 'data') return item.dataLancamento;
      return (item as any)[col] ?? '';
    };
  }

  aplicarFiltros(): void {
    const busca = this.buscaTexto.toLowerCase();
    this.dataSource.data = this.todosLancamentos.filter(l => {
      const matchTipo    = !this.tipoFiltro   || l.tipo   === this.tipoFiltro;
      const matchStatus  = !this.statusFiltro || l.status === this.statusFiltro;
      const matchCliente = !this.clienteIdFiltro || l.clienteId === this.clienteIdFiltro;
      const matchBusca   = !busca || l.descricao.toLowerCase().includes(busca) ||
                           (l.categoria || '').toLowerCase().includes(busca);
      return matchTipo && matchStatus && matchCliente && matchBusca;
    });
    if (this.paginator) this.paginator.firstPage();
  }

  limparFiltros(): void {
    this.tipoFiltro = '';
    this.statusFiltro = '';
    this.clienteIdFiltro = '';
    this.buscaTexto = '';
    this.aplicarFiltros();
    this.router.navigate([], { queryParams: {} });
  }

  marcarComoPago(id: string): void {
    this.lancamentoService.marcarComoPago(id);
    this.snackBar.open('Lançamento marcado como pago!', 'OK', { duration: 3000 });
  }

  excluir(id: string): void {
    if (confirm('Deseja excluir este lançamento?')) {
      this.lancamentoService.delete(id);
      this.snackBar.open('Lançamento excluído.', 'OK', { duration: 3000 });
    }
  }

  getNomeCliente(clienteId?: string): string {
    if (!clienteId) return '—';
    const c = this.clientes.find(x => x.id === clienteId);
    return c ? c.nome : '—';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'PAGO': 'pago', 'RECEBIDO': 'recebido',
      'PENDENTE': 'pendente', 'CANCELADO': 'cancelado', 'VENCIDO': 'vencido'
    };
    return map[status] || '';
  }

  formatCategoria(cat: string): string {
    return cat ? cat.replace(/_/g, ' ') : '—';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

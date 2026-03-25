import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BoletoService } from '../../../core/services/boleto';
import { ClienteService } from '../../../core/services/cliente';
import { PdfService } from '../../../core/services/pdf';
import { EmailService } from '../../../core/services/email';
import { Boleto } from '../../../core/models';

@Component({
  selector: 'app-boletos-lista',
  standalone: false,
  templateUrl: './boletos-lista.html',
  styleUrl: './boletos-lista.scss',
})
export class BoletosLista implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<Boleto>();
  displayedColumns = ['numero', 'cliente', 'descricao', 'emissao', 'vencimento', 'valor', 'status', 'acoes'];

  statusFiltro: string = '';
  clienteIdFiltro: string = '';

  clientes: { id: string; nome: string }[] = [];
  statusList = ['EMITIDO', 'PAGO', 'VENCIDO', 'CANCELADO'];

  private todosBoleteos: Boleto[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private boletoService: BoletoService,
    private clienteService: ClienteService,
    private pdfService: PdfService,
    private emailService: EmailService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.boletoService.boletos$,
      this.clienteService.clientes$,
      this.route.queryParams
    ]).pipe(takeUntil(this.destroy$)).subscribe(([boletos, clientes, params]) => {
      this.clientes = clientes.map(c => ({
        id: c.id,
        nome: c.tipoPessoa === 'JURIDICA' ? (c.razaoSocial || '') : (c.nomeCompleto || '')
      }));
      if (params['clienteId'] && !this.clienteIdFiltro) {
        this.clienteIdFiltro = params['clienteId'];
      }
      this.todosBoleteos = boletos;
      this.aplicarFiltros();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  aplicarFiltros(): void {
    this.dataSource.data = this.todosBoleteos.filter(b => {
      const matchStatus  = !this.statusFiltro  || b.status    === this.statusFiltro;
      const matchCliente = !this.clienteIdFiltro || b.clienteId === this.clienteIdFiltro;
      return matchStatus && matchCliente;
    });
    if (this.paginator) this.paginator.firstPage();
  }

  marcarComoPago(id: string): void {
    this.boletoService.marcarComoPago(id).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.snackBar.open('Boleto marcado como pago!', 'OK', { duration: 3000 });
    });
  }

  cancelar(id: string): void {
    if (confirm('Deseja cancelar este boleto?')) {
      this.boletoService.cancelar(id).pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.snackBar.open('Boleto cancelado.', 'OK', { duration: 3000 });
      });
    }
  }

  excluir(id: string): void {
    if (confirm('Deseja excluir este boleto?')) {
      this.boletoService.delete(id).pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.snackBar.open('Boleto excluído.', 'OK', { duration: 3000 });
      });
    }
  }

  gerarPdf(boleto: Boleto): void {
    try {
      this.pdfService.gerarBoletoPDF(boleto);
      this.snackBar.open('PDF do boleto gerado!', 'OK', { duration: 3000 });
    } catch {
      this.snackBar.open('Erro ao gerar PDF.', 'OK', { duration: 3000 });
    }
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'EMITIDO': 'emitido', 'PAGO': 'pago', 'VENCIDO': 'vencido', 'CANCELADO': 'cancelado'
    };
    return map[status] || '';
  }

  isVencido(boleto: Boleto): boolean {
    const hoje = new Date().toISOString().substring(0, 10);
    return boleto.status === 'EMITIDO' && boleto.dataVencimento < hoje;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}


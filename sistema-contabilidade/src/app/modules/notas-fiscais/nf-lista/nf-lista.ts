import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotaFiscalService } from '../../../core/services/nota-fiscal';
import { ClienteService } from '../../../core/services/cliente';
import { PdfService } from '../../../core/services/pdf';
import { NotaFiscal } from '../../../core/models';

@Component({
  selector: 'app-nf-lista',
  standalone: false,
  templateUrl: './nf-lista.html',
  styleUrl: './nf-lista.scss',
})
export class NfLista implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<NotaFiscal>();
  displayedColumns = ['numero', 'tipo', 'tomador', 'emissao', 'competencia', 'valor', 'status', 'acoes'];

  statusFiltro: string = '';
  clienteIdFiltro: string = '';

  clientes: { id: string; nome: string }[] = [];
  statusList = ['RASCUNHO', 'EMITIDA', 'CANCELADA', 'DENEGADA'];

  private todasNFs: NotaFiscal[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private nfService: NotaFiscalService,
    private clienteService: ClienteService,
    private pdfService: PdfService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.nfService.nfs$.pipe(takeUntil(this.destroy$)).subscribe(nfs => {
      this.todasNFs = nfs;
      this.aplicarFiltros();
    });

    this.clienteService.clientes$.pipe(takeUntil(this.destroy$)).subscribe(clientes => {
      this.clientes = clientes.map(c => ({
        id: c.id,
        nome: c.tipoPessoa === 'JURIDICA' ? (c.razaoSocial || '') : (c.nomeCompleto || '')
      }));
    });

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['clienteId'] && !this.clienteIdFiltro) {
        this.clienteIdFiltro = params['clienteId'];
        this.aplicarFiltros();
      }
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  aplicarFiltros(): void {
    this.dataSource.data = this.todasNFs.filter(nf => {
      const matchStatus  = !this.statusFiltro   || nf.status    === this.statusFiltro;
      const matchCliente = !this.clienteIdFiltro || nf.tomadorId === this.clienteIdFiltro;
      return matchStatus && matchCliente;
    });
    if (this.paginator) this.paginator.firstPage();
  }

  emitir(nf: NotaFiscal): void {
    if (confirm(`Deseja emitir a NF para ${nf.tomadorNome}?`)) {
      this.nfService.emitir(nf.id).pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.snackBar.open('Nota Fiscal emitida!', 'OK', { duration: 3000 });
      });
    }
  }

  cancelar(nf: NotaFiscal): void {
    const motivo = prompt('Informe o motivo do cancelamento:');
    if (motivo) {
      this.nfService.cancelar(nf.id, motivo).pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.snackBar.open('Nota Fiscal cancelada.', 'OK', { duration: 3000 });
      });
    }
  }

  excluir(id: string): void {
    if (confirm('Deseja excluir esta Nota Fiscal?')) {
      this.nfService.delete(id).pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.snackBar.open('NF excluída.', 'OK', { duration: 3000 });
      });
    }
  }

  gerarPdf(nf: NotaFiscal): void {
    try {
      this.pdfService.gerarNotaFiscalPDF(nf);
      this.snackBar.open('PDF gerado!', 'OK', { duration: 3000 });
    } catch {
      this.snackBar.open('Erro ao gerar PDF.', 'OK', { duration: 3000 });
    }
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'RASCUNHO': 'rascunho', 'EMITIDA': 'emitida',
      'CANCELADA': 'cancelada', 'DENEGADA': 'denegada'
    };
    return map[status] || '';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}


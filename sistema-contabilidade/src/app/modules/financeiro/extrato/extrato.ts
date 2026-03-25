import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LancamentoService } from '../../../core/services/lancamento';
import { ClienteService } from '../../../core/services/cliente';
import { PdfService } from '../../../core/services/pdf';
import { EmailService } from '../../../core/services/email';
import { Lancamento, ExtratoCliente } from '../../../core/models';

@Component({
  selector: 'app-extrato',
  standalone: false,
  templateUrl: './extrato.html',
  styleUrl: './extrato.scss',
})
export class Extrato implements OnInit, OnDestroy {
  filtroForm!: FormGroup;
  clientes: { id: string; nome: string; email: string }[] = [];
  lancamentos: Lancamento[] = [];
  extratoGerado: ExtratoCliente | null = null;

  gerandoPdf = false;
  enviandoEmail = false;

  displayedColumns = ['tipo', 'descricao', 'categoria', 'data', 'valor', 'status'];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private lancamentoService: LancamentoService,
    private clienteService: ClienteService,
    private pdfService: PdfService,
    private emailService: EmailService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().substring(0, 10);
    const ultimoDia = hoje.toISOString().substring(0, 10);

    this.filtroForm = this.fb.group({
      clienteId: [''],
      dataInicio: [primeiroDia],
      dataFim: [ultimoDia],
    });

    this.clienteService.clientes$.pipe(takeUntil(this.destroy$)).subscribe(clientes => {
      this.clientes = clientes.map(c => ({
        id: c.id,
        nome: c.tipoPessoa === 'JURIDICA' ? (c.razaoSocial || '') : (c.nomeCompleto || ''),
        email: c.contato?.email || ''
      }));
    });

    this.gerarExtrato();
  }

  gerarExtrato(): void {
    const { clienteId, dataInicio, dataFim } = this.filtroForm.value;

    if (clienteId) {
      this.lancamentoService.gerarExtratoCliente(clienteId, dataInicio, dataFim)
        .pipe(takeUntil(this.destroy$))
        .subscribe(extrato => {
          this.extratoGerado = extrato || null;
          this.lancamentos = extrato?.lancamentos || [];
        });
    } else {
      this.lancamentoService.filtrar({ dataInicio, dataFim })
        .pipe(takeUntil(this.destroy$))
        .subscribe(lista => {
          this.lancamentos = lista;
          this.extratoGerado = null;
        });
    }
  }

  get totalReceitas(): number {
    return this.lancamentos.filter(l => l.tipo === 'RECEITA').reduce((s, l) => s + l.valor, 0);
  }

  get totalDespesas(): number {
    return this.lancamentos.filter(l => l.tipo === 'DESPESA').reduce((s, l) => s + l.valor, 0);
  }

  get saldo(): number {
    return this.totalReceitas - this.totalDespesas;
  }

  baixarPdf(): void {
    if (!this.extratoGerado) return;
    this.gerandoPdf = true;
    try {
      this.pdfService.gerarExtratoClientePDF(this.extratoGerado);
      this.snackBar.open('PDF gerado!', 'OK', { duration: 3000 });
    } catch {
      this.snackBar.open('Erro ao gerar PDF.', 'OK', { duration: 3000 });
    } finally {
      this.gerandoPdf = false;
    }
  }

  enviarPorEmail(): void {
    if (!this.extratoGerado) return;
    const clienteSelecionado = this.clientes.find(c => c.id === this.filtroForm.value.clienteId);
    if (!clienteSelecionado?.email) {
      this.snackBar.open('Cliente sem e-mail cadastrado.', 'OK', { duration: 3000 });
      return;
    }
    this.enviandoEmail = true;
    const { dataInicio, dataFim } = this.filtroForm.value;
    this.emailService.enviarExtrato(
      clienteSelecionado.email,
      clienteSelecionado.nome,
      dataInicio,
      dataFim,
      this.saldo
    )
      .then(() => this.snackBar.open('E-mail enviado!', 'OK', { duration: 3000 }))
      .catch(() => this.snackBar.open('Erro ao enviar e-mail.', 'OK', { duration: 3000 }))
      .finally(() => this.enviandoEmail = false);
  }

  formatCategoria(cat: string): string {
    return cat ? cat.replace(/_/g, ' ') : '—';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'PAGO': 'pago', 'RECEBIDO': 'recebido',
      'PENDENTE': 'pendente', 'CANCELADO': 'cancelado', 'VENCIDO': 'vencido'
    };
    return map[status] || '';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}


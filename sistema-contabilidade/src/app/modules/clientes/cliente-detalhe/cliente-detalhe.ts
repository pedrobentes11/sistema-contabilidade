import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { combineLatest } from 'rxjs';
import { ClienteService } from '../../../core/services/cliente';
import { LancamentoService } from '../../../core/services/lancamento';
import { BoletoService } from '../../../core/services/boleto';
import { NotaFiscalService } from '../../../core/services/nota-fiscal';
import { EmailService } from '../../../core/services/email';
import { PdfService } from '../../../core/services/pdf';
import { Cliente, Lancamento, Boleto, NotaFiscal, ResumoFinanceiro } from '../../../core/models';

@Component({
  selector: 'app-cliente-detalhe',
  standalone: false,
  templateUrl: './cliente-detalhe.html',
  styleUrl: './cliente-detalhe.scss',
})
export class ClienteDetalhe implements OnInit {
  cliente?: Cliente;
  lancamentos: Lancamento[] = [];
  boletos: Boleto[] = [];
  notas: NotaFiscal[] = [];
  resumo?: ResumoFinanceiro;
  carregando = true;
  tabAtiva = 0;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private clienteService: ClienteService,
    private lancamentoService: LancamentoService,
    private boletoService: BoletoService,
    private nfService: NotaFiscalService,
    private emailService: EmailService,
    private pdfService: PdfService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    combineLatest([
      this.clienteService.getById(id),
      this.lancamentoService.getByCliente(id),
      this.boletoService.getByCliente(id),
      this.nfService.getByCliente(id),
    ]).subscribe(([cliente, lancamentos, boletos, notas]) => {
      this.cliente = cliente;
      this.lancamentos = lancamentos;
      this.boletos = boletos;
      this.notas = notas;
      this.carregando = false;
    });

    this.lancamentoService.getResumoFinanceiro(id).subscribe(r => this.resumo = r);
  }

  get nome(): string {
    if (!this.cliente) return '';
    return this.cliente.tipoPessoa === 'JURIDICA'
      ? (this.cliente.razaoSocial || '')
      : (this.cliente.nomeCompleto || '');
  }

  get cnpjCpf(): string {
    if (!this.cliente) return '';
    return this.cliente.tipoPessoa === 'JURIDICA'
      ? (this.cliente.cnpj || '')
      : (this.cliente.cpf || '');
  }

  formatCurrency(v: number): string {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  async enviarEmailExtratoAsync(): Promise<void> {
    if (!this.cliente) return;
    const res = await this.emailService.enviarExtrato(
      this.cliente.contato.email,
      this.nome,
      new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10),
      new Date().toISOString().substring(0, 10),
      this.resumo?.saldo || 0
    );
    this.snack.open(res.mensagem, 'Fechar', { duration: 4000 });
  }
}

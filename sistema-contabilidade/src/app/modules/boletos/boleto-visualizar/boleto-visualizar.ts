import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BoletoService } from '../../../core/services/boleto';
import { EmailService } from '../../../core/services/email';
import { PdfService } from '../../../core/services/pdf';
import { Boleto } from '../../../core/models';

@Component({
  selector: 'app-boleto-visualizar',
  standalone: false,
  templateUrl: './boleto-visualizar.html',
  styleUrl: './boleto-visualizar.scss',
})
export class BoletoVisualizar implements OnInit, OnDestroy {
  boleto: Boleto | null = null;
  loading = true;
  gerandoPdf = false;
  enviandoEmail = false;
  emailCliente = '';

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private boletoService: BoletoService,
    private pdfService: PdfService,
    private emailService: EmailService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.boletoService.getById(id).pipe(takeUntil(this.destroy$)).subscribe(boleto => {
      this.boleto = boleto || null;
      this.loading = false;
    });
  }

  voltar(): void {
    this.router.navigate(['/boletos']);
  }

  gerarPdf(): void {
    if (!this.boleto) return;
    this.gerandoPdf = true;
    try {
      this.pdfService.gerarBoletoPDF(this.boleto);
      this.snackBar.open('PDF gerado com sucesso!', 'OK', { duration: 3000 });
    } catch {
      this.snackBar.open('Erro ao gerar PDF.', 'OK', { duration: 3000 });
    } finally {
      this.gerandoPdf = false;
    }
  }

  enviarEmail(): void {
    if (!this.boleto || !this.emailCliente) {
      this.snackBar.open('Informe o e-mail do destinatário.', 'OK', { duration: 3000 });
      return;
    }
    this.enviandoEmail = true;
    this.emailService.enviarBoleto(
      this.emailCliente,
      this.boleto.clienteNome,
      this.boleto.nossoNumero,
      this.boleto.valor,
      this.boleto.dataVencimento,
      this.linhaDigitavel
    )
      .then(() => this.snackBar.open('E-mail enviado!', 'OK', { duration: 3000 }))
      .catch(() => this.snackBar.open('Erro ao enviar e-mail.', 'OK', { duration: 3000 }))
      .finally(() => this.enviandoEmail = false);
  }

  marcarComoPago(): void {
    if (!this.boleto) return;
    this.boletoService.marcarComoPago(this.boleto.id).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.snackBar.open('Boleto marcado como pago!', 'OK', { duration: 3000 });
    });
  }

  get linhaDigitavel(): string {
    return this.boleto ? this.boletoService.gerarLinhaDigitavel(this.boleto) : '';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'EMITIDO': 'emitido', 'PAGO': 'pago', 'VENCIDO': 'vencido', 'CANCELADO': 'cancelado'
    };
    return map[status] || '';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}


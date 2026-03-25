import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotaFiscalService } from '../../../core/services/nota-fiscal';
import { PdfService } from '../../../core/services/pdf';
import { EmailService } from '../../../core/services/email';
import { NotaFiscal } from '../../../core/models';

@Component({
  selector: 'app-nf-visualizar',
  standalone: false,
  templateUrl: './nf-visualizar.html',
  styleUrl: './nf-visualizar.scss',
})
export class NfVisualizar implements OnInit, OnDestroy {
  nf: NotaFiscal | null = null;
  loading = true;
  gerandoPdf = false;
  enviandoEmail = false;
  emailDestinatario = '';

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private nfService: NotaFiscalService,
    private pdfService: PdfService,
    private emailService: EmailService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.nfService.getById(id).pipe(takeUntil(this.destroy$)).subscribe(nf => {
      this.nf = nf || null;
      if (this.nf) {
        this.emailDestinatario = this.nf.tomadorEmail || '';
      }
      this.loading = false;
    });
  }

  voltar(): void {
    this.router.navigate(['/notas-fiscais']);
  }

  emitir(): void {
    if (!this.nf) return;
    if (confirm('Deseja emitir esta Nota Fiscal?')) {
      this.nfService.emitir(this.nf.id).pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.snackBar.open('Nota Fiscal emitida com sucesso!', 'OK', { duration: 3000 });
      });
    }
  }

  cancelar(): void {
    if (!this.nf) return;
    const motivo = prompt('Informe o motivo do cancelamento:');
    if (motivo) {
      this.nfService.cancelar(this.nf.id, motivo).pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.snackBar.open('Nota Fiscal cancelada.', 'OK', { duration: 3000 });
      });
    }
  }

  gerarPdf(): void {
    if (!this.nf) return;
    this.gerandoPdf = true;
    try {
      this.pdfService.gerarNotaFiscalPDF(this.nf);
      this.snackBar.open('PDF gerado com sucesso!', 'OK', { duration: 3000 });
    } catch {
      this.snackBar.open('Erro ao gerar PDF.', 'OK', { duration: 3000 });
    } finally {
      this.gerandoPdf = false;
    }
  }

  enviarEmail(): void {
    if (!this.nf || !this.emailDestinatario) {
      this.snackBar.open('Informe o e-mail do destinatário.', 'OK', { duration: 3000 });
      return;
    }
    this.enviandoEmail = true;
    this.emailService.enviarNotaFiscal(
      this.emailDestinatario,
      this.nf.tomadorNome,
      this.nf.numero || 'S/N',
      this.nf.valorBruto,
      this.nf.dataEmissao
    )
      .then(() => this.snackBar.open('E-mail enviado!', 'OK', { duration: 3000 }))
      .catch(() => this.snackBar.open('Erro ao enviar e-mail.', 'OK', { duration: 3000 }))
      .finally(() => this.enviandoEmail = false);
  }

  get totalItens(): number {
    return this.nf?.itens.reduce((s, i) => s + i.valorTotal, 0) || 0;
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


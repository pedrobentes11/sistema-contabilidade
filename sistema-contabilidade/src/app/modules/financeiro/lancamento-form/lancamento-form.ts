import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LancamentoService } from '../../../core/services/lancamento';
import { ClienteService } from '../../../core/services/cliente';
import { Lancamento } from '../../../core/models';

const CATEGORIAS_DESPESA = [
  'PESSOAL','ALUGUEL','SERVICOS','IMPOSTOS','MATERIAL_ESCRITORIO',
  'TECNOLOGIA','MARKETING','JURIDICO','CONTABILIDADE','OUTROS'
];
const CATEGORIAS_RECEITA = [
  'HONORARIO_CONTABIL','CONSULTORIA','DECLARACAO_IR','ABERTURA_EMPRESA',
  'ENCERRAMENTO_EMPRESA','NOTA_FISCAL','OUTROS'
];
const FORMAS_PAGAMENTO = ['PIX','TRANSFERENCIA','BOLETO','CARTAO_CREDITO','CARTAO_DEBITO','DINHEIRO','CHEQUE'];

@Component({
  selector: 'app-lancamento-form',
  standalone: false,
  templateUrl: './lancamento-form.html',
  styleUrl: './lancamento-form.scss',
})
export class LancamentoForm implements OnInit, OnDestroy {
  form!: FormGroup;
  isEditMode = false;
  lancamentoId: string | null = null;
  saving = false;

  clientes: { id: string; nome: string }[] = [];
  categorias: string[] = [];
  categoriasDespesa = CATEGORIAS_DESPESA;
  categoriasReceita = CATEGORIAS_RECEITA;
  formasPagamento = FORMAS_PAGAMENTO;
  statusList = ['PENDENTE','PAGO','RECEBIDO','CANCELADO'];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private lancamentoService: LancamentoService,
    private clienteService: ClienteService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.buildForm();

    this.clienteService.clientes$.pipe(takeUntil(this.destroy$)).subscribe(clientes => {
      this.clientes = clientes.map(c => ({
        id: c.id,
        nome: c.tipoPessoa === 'JURIDICA' ? (c.razaoSocial || '') : (c.nomeCompleto || '')
      }));
    });

    this.form.get('tipo')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(tipo => {
      this.categorias = tipo === 'RECEITA' ? this.categoriasReceita : this.categoriasDespesa;
      this.form.get('categoria')!.reset();
    });

    // Detecta edição
    this.lancamentoId = this.route.snapshot.paramMap.get('id');
    if (this.lancamentoId) {
      this.isEditMode = true;
      this.lancamentoService.getById(this.lancamentoId).pipe(takeUntil(this.destroy$)).subscribe(l => {
        if (l) {
          this.form.patchValue({ ...l });
          this.categorias = l.tipo === 'RECEITA' ? this.categoriasReceita : this.categoriasDespesa;
        }
      });
    } else {
      // Pré-preenche cliente por query param
      const clienteId = this.route.snapshot.queryParamMap.get('clienteId');
      if (clienteId) this.form.patchValue({ clienteId });
      this.categorias = this.categoriasDespesa;
    }
  }

  buildForm(): void {
    const hoje = new Date().toISOString().substring(0, 10);
    this.form = this.fb.group({
      tipo:           ['DESPESA', Validators.required],
      descricao:      ['', [Validators.required, Validators.minLength(3)]],
      valor:          [null, [Validators.required, Validators.min(0.01)]],
      dataLancamento: [hoje, Validators.required],
      dataVencimento: [hoje, Validators.required],
      status:         ['PENDENTE', Validators.required],
      categoria:      ['', Validators.required],
      clienteId:      [''],
      formaPagamento: ['PIX'],
      numeroDocumento:[''],
      observacoes:    [''],
      recorrente:     [false],
      periodicidade:  ['MENSAL'],
    });
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const dados = this.form.value;

    const op$ = this.isEditMode && this.lancamentoId
      ? this.lancamentoService.update(this.lancamentoId, dados)
      : this.lancamentoService.create(dados);

    op$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.snackBar.open(
          this.isEditMode ? 'Lançamento atualizado!' : 'Lançamento criado!',
          'OK', { duration: 3000 }
        );
        this.router.navigate(['/financeiro/lancamentos']);
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Erro ao salvar lançamento.', 'OK', { duration: 3000 });
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/financeiro/lancamentos']);
  }

  formatLabel(str: string): string {
    return str.replace(/_/g, ' ');
  }

  get tipoAtual(): string { return this.form.get('tipo')?.value || 'DESPESA'; }
  get recorrenteAtivo(): boolean { return !!this.form.get('recorrente')?.value; }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}


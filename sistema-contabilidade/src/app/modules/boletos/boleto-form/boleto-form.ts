import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BoletoService } from '../../../core/services/boleto';
import { ClienteService } from '../../../core/services/cliente';
import { Cliente } from '../../../core/models';

@Component({
  selector: 'app-boleto-form',
  standalone: false,
  templateUrl: './boleto-form.html',
  styleUrl: './boleto-form.scss',
})
export class BoletoForm implements OnInit, OnDestroy {
  form!: FormGroup;
  saving = false;

  clientes: Cliente[] = [];
  clienteSelecionado: Cliente | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private boletoService: BoletoService,
    private clienteService: ClienteService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const hoje = new Date().toISOString().substring(0, 10);
    const vencimento = new Date();
    vencimento.setDate(vencimento.getDate() + 30);

    this.form = this.fb.group({
      clienteId:      ['', Validators.required],
      descricao:      ['', [Validators.required, Validators.minLength(3)]],
      valor:          [null, [Validators.required, Validators.min(0.01)]],
      dataEmissao:    [hoje, Validators.required],
      dataVencimento: [vencimento.toISOString().substring(0, 10), Validators.required],
      valorMulta:     [2],
      valorJuros:     [1],
      descontoAte:    [''],
      valorDesconto:  [0],
      numeroDocumento:[''],
      instrucoes:     this.fb.array([
        this.fb.control('Não receber após o vencimento'),
        this.fb.control('Cobrar multa de 2% após o vencimento'),
      ]),
      observacoes:    [''],
      cedenteName:    ['Escritório de Contabilidade', Validators.required],
      cedenteAgencia: ['0001'],
      cedenteConta:   [''],
    });

    this.clienteService.clientes$.pipe(takeUntil(this.destroy$)).subscribe(c => {
      this.clientes = c;
    });

    // Pré-seleciona por query param
    const clienteId = this.route.snapshot.queryParamMap.get('clienteId');
    if (clienteId) {
      this.form.patchValue({ clienteId });
      this.onClienteChange(clienteId);
    }

    this.form.get('clienteId')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(id => {
      this.onClienteChange(id);
    });
  }

  onClienteChange(clienteId: string): void {
    this.clienteSelecionado = this.clientes.find(c => c.id === clienteId) || null;
  }

  get instrucoes(): FormArray {
    return this.form.get('instrucoes') as FormArray;
  }

  addInstrucao(): void {
    this.instrucoes.push(this.fb.control(''));
  }

  removeInstrucao(i: number): void {
    this.instrucoes.removeAt(i);
  }

  salvar(): void {
    if (this.form.invalid || !this.clienteSelecionado) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const c = this.clienteSelecionado;
    const dados = {
      ...this.form.value,
      clienteNome: c.tipoPessoa === 'JURIDICA' ? (c.razaoSocial || '') : (c.nomeCompleto || ''),
      clienteCnpjCpf: c.tipoPessoa === 'JURIDICA' ? (c.cnpj || '') : (c.cpf || ''),
      clienteEndereco: c.endereco
        ? `${c.endereco.logradouro}, ${c.endereco.numero} - ${c.endereco.bairro}, ${c.endereco.cidade}/${c.endereco.estado}`
        : '',
      sacadoNome: c.tipoPessoa === 'JURIDICA' ? (c.razaoSocial || '') : (c.nomeCompleto || ''),
      sacadoCnpjCpf: c.tipoPessoa === 'JURIDICA' ? (c.cnpj || '') : (c.cpf || ''),
      sacadoEndereco: c.endereco
        ? `${c.endereco.logradouro}, ${c.endereco.numero} - ${c.endereco.cidade}/${c.endereco.estado}`
        : '',
      status: 'EMITIDO',
      instrucoes: this.instrucoes.value.filter((i: string) => i.trim()),
    };

    this.boletoService.create(dados).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.snackBar.open('Boleto emitido com sucesso!', 'OK', { duration: 3000 });
        this.router.navigate(['/boletos']);
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Erro ao emitir boleto.', 'OK', { duration: 3000 });
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/boletos']);
  }

  getNomeCliente(c: Cliente): string {
    return c.tipoPessoa === 'JURIDICA' ? (c.razaoSocial || '') : (c.nomeCompleto || '');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}


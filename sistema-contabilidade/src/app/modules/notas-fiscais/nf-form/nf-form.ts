import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotaFiscalService } from '../../../core/services/nota-fiscal';
import { ClienteService } from '../../../core/services/cliente';
import { Cliente } from '../../../core/models';

@Component({
  selector: 'app-nf-form',
  standalone: false,
  templateUrl: './nf-form.html',
  styleUrl: './nf-form.scss',
})
export class NfForm implements OnInit, OnDestroy {
  form!: FormGroup;
  saving = false;
  clientes: Cliente[] = [];
  clienteSelecionado: Cliente | null = null;

  tiposNF = ['NF-e', 'NFS-e', 'NF-Consumer'];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private nfService: NotaFiscalService,
    private clienteService: ClienteService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const hoje = new Date().toISOString().substring(0, 10);
    const competencia = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;

    this.form = this.fb.group({
      tipo: ['NFS-e', Validators.required],
      tomadorId: ['', Validators.required],
      dataEmissao: [hoje, Validators.required],
      dataCompetencia: [competencia, Validators.required],
      discriminacaoServicos: ['', Validators.required],
      emitenteNome: ['Escritório de Contabilidade', Validators.required],
      emitenteCnpj: ['', Validators.required],
      emitenteEndereco: [''],
      emitenteInscricaoMunicipal: [''],
      optanteSimplesNacional: [true],
      incentivadorCultural: [false],
      issRetido: [false],
      observacoes: [''],
      itens: this.fb.array([this.novoItem()]),
      aliquotaISS: [5],
      aliquotaIRPJ: [0],
      aliquotaCSLL: [0],
      aliquotaPIS: [0.65],
      aliquotaCOFINS: [3],
    });

    this.clienteService.clientes$.pipe(takeUntil(this.destroy$)).subscribe(c => {
      this.clientes = c;
    });

    this.form.get('tomadorId')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(id => {
      this.clienteSelecionado = this.clientes.find(c => c.id === id) || null;
    });

    const clienteId = this.route.snapshot.queryParamMap.get('clienteId');
    if (clienteId) {
      this.form.patchValue({ tomadorId: clienteId });
    }
  }

  novoItem(): FormGroup {
    return this.fb.group({
      descricao: ['', Validators.required],
      quantidade: [1, [Validators.required, Validators.min(0.01)]],
      unidade: ['UN'],
      valorUnitario: [null, [Validators.required, Validators.min(0.01)]],
    });
  }

  get itens(): FormArray { return this.form.get('itens') as FormArray; }

  addItem(): void { this.itens.push(this.novoItem()); }

  removeItem(i: number): void {
    if (this.itens.length > 1) this.itens.removeAt(i);
  }

  getItemTotal(i: number): number {
    const item = this.itens.at(i);
    const qty = item.get('quantidade')?.value || 0;
    const val = item.get('valorUnitario')?.value || 0;
    return qty * val;
  }

  get valorBruto(): number {
    return this.itens.controls.reduce((s, _, i) => s + this.getItemTotal(i), 0);
  }

  calcularImpostos() {
    const base = this.valorBruto;
    const f = this.form.value;
    const iss   = base * ((f.aliquotaISS   || 0) / 100);
    const irpj  = base * ((f.aliquotaIRPJ  || 0) / 100);
    const csll  = base * ((f.aliquotaCSLL  || 0) / 100);
    const pis   = base * ((f.aliquotaPIS   || 0) / 100);
    const cofins= base * ((f.aliquotaCOFINS|| 0) / 100);
    const total = iss + irpj + csll + pis + cofins;
    return {
      baseCalculo:    base,
      aliquotaISS:    f.aliquotaISS,    valorISS:    iss,
      aliquotaIRPJ:   f.aliquotaIRPJ,   valorIRPJ:   irpj,
      aliquotaCSLL:   f.aliquotaCSLL,   valorCSLL:   csll,
      aliquotaPIS:    f.aliquotaPIS,    valorPIS:    pis,
      aliquotaCOFINS: f.aliquotaCOFINS, valorCOFINS: cofins,
      totalImpostos:  total,
      valorLiquido:   base - total,
    };
  }

  salvar(): void {
    if (this.form.invalid || !this.clienteSelecionado) {
      this.form.markAllAsTouched();
      this.snackBar.open('Preencha todos os campos obrigatórios.', 'OK', { duration: 3000 });
      return;
    }
    this.saving = true;
    const c = this.clienteSelecionado;
    const f = this.form.value;
    const impostos = this.calcularImpostos();
    const itens = this.itens.controls.map((ctrl, idx) => ({
      id: (idx + 1).toString(),
      descricao:     ctrl.get('descricao')?.value,
      quantidade:    ctrl.get('quantidade')?.value,
      unidade:       ctrl.get('unidade')?.value,
      valorUnitario: ctrl.get('valorUnitario')?.value,
      valorTotal:    this.getItemTotal(idx),
    }));

    const tomadorNome = c.tipoPessoa === 'JURIDICA'
      ? (c.razaoSocial || c.nomeFantasia || '')
      : (c.nomeCompleto || '');

    const dados: any = {
      tipo:         f.tipo,
      tomadorId:    c.id,
      tomadorNome,
      tomadorCnpjCpf: c.tipoPessoa === 'JURIDICA' ? (c.cnpj || '') : (c.cpf || ''),
      tomadorEmail:   c.contato?.email || '',
      tomadorEndereco: c.endereco
        ? `${c.endereco.logradouro}, ${c.endereco.numero} - ${c.endereco.cidade}/${c.endereco.estado}`
        : '',
      emitenteNome:                f.emitenteNome,
      emitenteCnpj:                f.emitenteCnpj,
      emitenteEndereco:             f.emitenteEndereco,
      emitenteInscricaoMunicipal:   f.emitenteInscricaoMunicipal,
      dataEmissao:          f.dataEmissao,
      dataCompetencia:      f.dataCompetencia,
      discriminacaoServicos: f.discriminacaoServicos,
      optanteSimplesNacional: f.optanteSimplesNacional,
      incentivadorCultural:   f.incentivadorCultural,
      issRetido:              f.issRetido,
      observacoes:            f.observacoes,
      status:                 'RASCUNHO',
      itens,
      impostos,
      valorBruto: this.valorBruto,
    };

    this.nfService.create(dados).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.snackBar.open('Nota Fiscal criada como rascunho!', 'OK', { duration: 3000 });
        this.router.navigate(['/notas-fiscais']);
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Erro ao criar Nota Fiscal.', 'OK', { duration: 3000 });
      }
    });
  }

  cancelar(): void { this.router.navigate(['/notas-fiscais']); }

  getNomeCliente(c: Cliente): string {
    return c.tipoPessoa === 'JURIDICA'
      ? (c.razaoSocial || c.nomeFantasia || '')
      : (c.nomeCompleto || '');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

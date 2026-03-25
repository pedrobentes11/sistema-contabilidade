import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClienteService } from '../../../core/services/cliente';
import { CnpjService } from '../../../core/services/cnpj';
import { Cliente } from '../../../core/models';

@Component({
  selector: 'app-cliente-form',
  standalone: false,
  templateUrl: './cliente-form.html',
  styleUrl: './cliente-form.scss',
})
export class ClienteForm implements OnInit {
  form!: FormGroup;
  clienteId: string | null = null;
  modoEdicao = false;
  carregando = false;
  buscandoCnpj = false;
  salvando = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router,
    private clienteService: ClienteService,
    private cnpjService: CnpjService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.clienteId = this.route.snapshot.paramMap.get('id');
    this.modoEdicao = !!this.clienteId && !this.route.snapshot.url.some(s => s.path === 'novo');
    this.buildForm();

    if (this.modoEdicao && this.clienteId) {
      this.carregando = true;
      this.clienteService.getById(this.clienteId).subscribe(cliente => {
        if (cliente) this.form.patchValue(cliente as any);
        this.carregando = false;
      });
    }
  }

  private buildForm(): void {
    this.form = this.fb.group({
      tipoPessoa: ['JURIDICA', Validators.required],
      // PJ
      razaoSocial: [''],
      nomeFantasia: [''],
      cnpj: [''],
      inscricaoEstadual: [''],
      inscricaoMunicipal: [''],
      regimeTributario: ['SIMPLES_NACIONAL'],
      dataAbertura: [''],
      cnae: [''],
      // PF
      nomeCompleto: [''],
      cpf: [''],
      dataNascimento: [''],
      rg: [''],
      profissao: [''],
      // Endereço
      endereco: this.fb.group({
        cep: ['', Validators.required],
        logradouro: ['', Validators.required],
        numero: ['', Validators.required],
        complemento: [''],
        bairro: ['', Validators.required],
        cidade: ['', Validators.required],
        estado: ['', Validators.required],
      }),
      // Contato
      contato: this.fb.group({
        telefone: [''],
        celular: [''],
        email: ['', [Validators.required, Validators.email]],
        emailSecundario: [''],
        site: [''],
      }),
      status: ['ATIVO', Validators.required],
      honorarioMensal: [null],
      diaVencimentoHonorario: [null],
      observacoes: [''],
    });
  }

  get isPJ(): boolean { return this.form.get('tipoPessoa')?.value === 'JURIDICA'; }

  buscarCNPJ(): void {
    const cnpj = this.form.get('cnpj')?.value;
    if (!cnpj) return;
    this.buscandoCnpj = true;
    this.cnpjService.buscarPorCNPJ(cnpj).subscribe({
      next: dados => {
        this.form.patchValue({
          razaoSocial: dados.razao_social,
          nomeFantasia: dados.nome_fantasia,
          cnae: dados.cnae_fiscal,
          dataAbertura: dados.data_inicio_atividade,
          contato: { email: dados.email, telefone: dados.telefone },
          endereco: {
            cep: dados.cep?.replace(/\D/g, ''),
            logradouro: dados.logradouro,
            numero: dados.numero,
            complemento: dados.complemento,
            bairro: dados.bairro,
            cidade: dados.municipio,
            estado: dados.uf,
          },
        });
        this.snack.open('Dados do CNPJ carregados com sucesso!', 'OK', { duration: 3000 });
        this.buscandoCnpj = false;
      },
      error: () => {
        this.snack.open('CNPJ não encontrado na Receita Federal.', 'Fechar', { duration: 4000, panelClass: 'snack-error' });
        this.buscandoCnpj = false;
      },
    });
  }

  buscarCEP(): void {
    const cep = this.form.get('endereco.cep')?.value;
    if (!cep || cep.replace(/\D/g, '').length !== 8) return;
    this.cnpjService.buscarCEP(cep).subscribe({
      next: dados => {
        this.form.get('endereco')?.patchValue({
          logradouro: dados.logradouro,
          bairro: dados.bairro,
          cidade: dados.cidade,
          estado: dados.estado,
        });
      },
      error: () => this.snack.open('CEP não encontrado.', 'Fechar', { duration: 3000 }),
    });
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.salvando = true;
    const dados = this.form.value;

    if (this.modoEdicao && this.clienteId) {
      this.clienteService.update(this.clienteId, dados).subscribe(() => {
        this.snack.open('Cliente atualizado com sucesso!', 'OK', { duration: 3000 });
        this.router.navigate(['/clientes', this.clienteId]);
        this.salvando = false;
      });
    } else {
      this.clienteService.create(dados).subscribe(novo => {
        this.snack.open('Cliente cadastrado com sucesso!', 'OK', { duration: 3000 });
        this.router.navigate(['/clientes', novo.id]);
        this.salvando = false;
      });
    }
  }
}

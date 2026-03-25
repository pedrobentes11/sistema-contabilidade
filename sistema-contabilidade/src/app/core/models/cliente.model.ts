export type RegimeTributario = 'SIMPLES_NACIONAL' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL' | 'MEI';
export type TipoPessoa = 'JURIDICA' | 'FISICA';
export type StatusCliente = 'ATIVO' | 'INATIVO' | 'SUSPENSO';

export interface Endereco {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export interface Contato {
  telefone: string;
  celular?: string;
  email: string;
  emailSecundario?: string;
  site?: string;
}

export interface RepresentanteLegal {
  nome: string;
  cpf: string;
  cargo: string;
  telefone: string;
  email: string;
}

export interface Cliente {
  id: string;
  tipoPessoa: TipoPessoa;
  // Pessoa Jurídica
  razaoSocial?: string;
  nomeFantasia?: string;
  cnpj?: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  regimeTributario?: RegimeTributario;
  dataAbertura?: string;
  cnae?: string;
  // Pessoa Física
  nomeCompleto?: string;
  cpf?: string;
  dataNascimento?: string;
  rg?: string;
  profissao?: string;
  // Dados comuns
  endereco: Endereco;
  contato: Contato;
  representanteLegal?: RepresentanteLegal;
  status: StatusCliente;
  observacoes?: string;
  honorarioMensal?: number;
  diaVencimentoHonorario?: number;
  dataCadastro: string;
  dataUltimaAtualizacao: string;
}

export interface ClienteResumo {
  id: string;
  nomeRazaoSocial: string;
  cnpjCpf: string;
  email: string;
  status: StatusCliente;
  regimeTributario?: RegimeTributario;
  honorarioMensal?: number;
}

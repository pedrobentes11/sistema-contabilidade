export type TipoLancamento = 'RECEITA' | 'DESPESA';
export type StatusLancamento = 'PENDENTE' | 'PAGO' | 'RECEBIDO' | 'CANCELADO' | 'VENCIDO';
export type CategoriaDespesa =
  | 'PESSOAL'
  | 'ALUGUEL'
  | 'SERVICOS'
  | 'IMPOSTOS'
  | 'MATERIAL_ESCRITORIO'
  | 'TECNOLOGIA'
  | 'MARKETING'
  | 'JURIDICO'
  | 'CONTABILIDADE'
  | 'OUTROS';

export type CategoriaReceita =
  | 'HONORARIO_CONTABIL'
  | 'CONSULTORIA'
  | 'DECLARACAO_IR'
  | 'ABERTURA_EMPRESA'
  | 'ENCERRAMENTO_EMPRESA'
  | 'NOTA_FISCAL'
  | 'OUTROS';

export interface Lancamento {
  id: string;
  tipo: TipoLancamento;
  descricao: string;
  valor: number;
  dataLancamento: string;
  dataVencimento: string;
  dataPagamento?: string;
  status: StatusLancamento;
  categoria: CategoriaDespesa | CategoriaReceita;
  clienteId?: string;
  clienteNome?: string;
  numeroDocumento?: string;
  formaPagamento?: FormaPagamento;
  comprovante?: string;
  observacoes?: string;
  recorrente?: boolean;
  periodicidade?: 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
  tags?: string[];
  criadoEm: string;
  atualizadoEm: string;
}

export type FormaPagamento =
  | 'PIX'
  | 'TRANSFERENCIA'
  | 'BOLETO'
  | 'CARTAO_CREDITO'
  | 'CARTAO_DEBITO'
  | 'DINHEIRO'
  | 'CHEQUE';

export interface ResumoFinanceiro {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  receitasPendentes: number;
  despesasPendentes: number;
  lancamentosVencidos: number;
}

export interface ExtratoFiltro {
  clienteId?: string;
  tipo?: TipoLancamento;
  status?: StatusLancamento;
  dataInicio?: string;
  dataFim?: string;
  categoria?: string;
}

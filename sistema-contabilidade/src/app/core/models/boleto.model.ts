export type StatusBoleto = 'EMITIDO' | 'PAGO' | 'VENCIDO' | 'CANCELADO';

export interface Boleto {
  id: string;
  clienteId: string;
  clienteNome: string;
  clienteCnpjCpf: string;
  clienteEndereco: string;
  descricao: string;
  valor: number;
  valorMulta?: number;
  valorJuros?: number;
  descontoAte?: string;
  valorDesconto?: number;
  dataEmissao: string;
  dataVencimento: string;
  dataPagamento?: string;
  status: StatusBoleto;
  codigoBarras?: string;
  linhaDigitavel?: string;
  nossoNumero: string;
  numeroDocumento: string;
  instrucoes?: string[];
  sacadoNome: string;
  sacadoCnpjCpf: string;
  sacadoEndereco: string;
  cedenteName: string;
  cedenteAgencia?: string;
  cedenteConta?: string;
  observacoes?: string;
  emailEnviado?: boolean;
  emailEnviadoEm?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface BoletoPDF {
  boletoId: string;
  dataGeracao: string;
  urlPDF?: string;
}

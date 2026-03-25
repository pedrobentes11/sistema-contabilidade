import { Lancamento } from './lancamento.model';

export interface ExtratoCliente {
  clienteId: string;
  clienteNome: string;
  clienteCnpjCpf: string;
  periodo: {
    inicio: string;
    fim: string;
  };
  lancamentos: Lancamento[];
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  dataGeracao: string;
}

export interface DashboardResumo {
  totalClientes: number;
  clientesAtivos: number;
  clientesInativos: number;
  receitaMesAtual: number;
  despesaMesAtual: number;
  saldoMesAtual: number;
  boletosVencidos: number;
  boletosPendentes: number;
  boletosEmitidosMes: number;
  nfEmitidasMes: number;
  honorariosPendentes: number;
  proximosVencimentos: VencimentoItem[];
  graficoMensalReceitas: GraficoDado[];
  graficoMensalDespesas: GraficoDado[];
  receitasPorCategoria: GraficoDado[];
  despesasPorCategoria: GraficoDado[];
}

export interface VencimentoItem {
  id: string;
  tipo: 'BOLETO' | 'LANCAMENTO' | 'NOTA_FISCAL';
  descricao: string;
  clienteNome: string;
  valor: number;
  dataVencimento: string;
  diasRestantes: number;
}

export interface GraficoDado {
  name: string;
  value: number;
}

export interface EmailPayload {
  destinatario: string;
  nomeDestinatario: string;
  assunto: string;
  mensagem: string;
  anexos?: {
    nome: string;
    base64: string;
    tipo: string;
  }[];
}

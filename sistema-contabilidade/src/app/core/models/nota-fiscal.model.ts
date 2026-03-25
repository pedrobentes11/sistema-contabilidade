export type StatusNF = 'RASCUNHO' | 'EMITIDA' | 'CANCELADA' | 'DENEGADA';
export type TipoNF = 'NF-e' | 'NFS-e' | 'NF-Consumer' | 'CT-e' | 'MDF-e';
export type RegimeEspecialTributacao =
  | 'MICROEMPRESA_MUNICIPAL'
  | 'ESTIMATIVA'
  | 'SOCIEDADE_DE_PROFISSIONAIS'
  | 'COOPERATIVA'
  | 'MICROEMPRESARIO_EMPRESARIO_INDIVIDUAL'
  | 'MICROEMPRESARIO_EPP';

export interface ItemNF {
  id: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  valorTotal: number;
  codigoServico?: string;
  aliquotaISS?: number;
}

export interface ImpostosNF {
  baseCalculo: number;
  aliquotaISS?: number;
  valorISS?: number;
  aliquotaIRPJ?: number;
  valorIRPJ?: number;
  aliquotaCSLL?: number;
  valorCSLL?: number;
  aliquotaPIS?: number;
  valorPIS?: number;
  aliquotaCOFINS?: number;
  valorCOFINS?: number;
  aliquotaINSS?: number;
  valorINSS?: number;
  totalImpostos: number;
  valorLiquido: number;
}

export interface NotaFiscal {
  id: string;
  tipo: TipoNF;
  numero?: string;
  serie?: string;
  chaveAcesso?: string;
  protocolo?: string;
  // Emitente (Contador / Empresa do cliente)
  emitenteNome: string;
  emitenteCnpj: string;
  emitenteEndereco: string;
  emitenteInscricaoMunicipal?: string;
  // Tomador (quem recebe o serviço)
  tomadorId: string;
  tomadorNome: string;
  tomadorCnpjCpf: string;
  tomadorEmail: string;
  tomadorEndereco: string;
  tomadorInscricaoMunicipal?: string;
  // Dados da NF
  dataEmissao: string;
  dataCompetencia: string;
  status: StatusNF;
  discriminacaoServicos: string;
  codigoMunicipio?: string;
  regimeEspecialTributacao?: RegimeEspecialTributacao;
  optanteSimplesNacional: boolean;
  incentivadorCultural: boolean;
  issRetido: boolean;
  itens: ItemNF[];
  impostos: ImpostosNF;
  valorBruto: number;
  observacoes?: string;
  // Envio / controle
  emailEnviado?: boolean;
  emailEnviadoEm?: string;
  xmlPath?: string;
  pdfPath?: string;
  motivoCancelamento?: string;
  criadoEm: string;
  atualizadoEm: string;
}

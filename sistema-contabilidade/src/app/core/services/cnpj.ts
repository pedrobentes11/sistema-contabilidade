import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface DadosCNPJ {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  situacao_cadastral: string;
  data_inicio_atividade: string;
  natureza_juridica: string;
  porte: string;
  email: string;
  telefone: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  cnae_fiscal: string;
  cnae_fiscal_descricao: string;
  socios?: Array<{ nome: string; qualificacao_socio: string }>;
}

@Injectable({ providedIn: 'root' })
export class CnpjService {

  constructor(private http: HttpClient) {}

  /**
   * Busca dados de CNPJ na API pública Brasil.io / ReceitaWS (sem autenticação)
   * Endpoint: https://brasilapi.com.br/api/cnpj/v1/{cnpj}
   */
  buscarPorCNPJ(cnpj: string): Observable<DadosCNPJ> {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) {
      return throwError(() => new Error('CNPJ inválido'));
    }
    return this.http
      .get<any>(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`)
      .pipe(
        map(data => ({
          cnpj: data.cnpj,
          razao_social: data.razao_social || '',
          nome_fantasia: data.nome_fantasia || '',
          situacao_cadastral: data.descricao_situacao_cadastral || '',
          data_inicio_atividade: data.data_inicio_atividade || '',
          natureza_juridica: data.natureza_juridica?.descricao || '',
          porte: data.descricao_porte || '',
          email: data.email || '',
          telefone: data.ddd_telefone_1 ? `(${data.ddd_telefone_1}) ${data.telefone_1}` : '',
          cep: data.cep || '',
          logradouro: data.logradouro || '',
          numero: data.numero || '',
          complemento: data.complemento || '',
          bairro: data.bairro || '',
          municipio: data.municipio || '',
          uf: data.uf || '',
          cnae_fiscal: String(data.cnae_fiscal || ''),
          cnae_fiscal_descricao: data.cnae_fiscal_descricao || '',
          socios: data.qsa?.map((s: any) => ({
            nome: s.nome_socio,
            qualificacao_socio: s.qualificacao_socio?.descricao || '',
          })) || [],
        })),
        catchError(err => {
          console.error('Erro ao buscar CNPJ:', err);
          return throwError(() => new Error('CNPJ não encontrado na Receita Federal'));
        })
      );
  }

  buscarCEP(cep: string): Observable<any> {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return throwError(() => new Error('CEP inválido'));
    return this.http
      .get<any>(`https://brasilapi.com.br/api/cep/v2/${cepLimpo}`)
      .pipe(
        map(data => ({
          cep: data.cep,
          logradouro: data.street || '',
          bairro: data.neighborhood || '',
          cidade: data.city || '',
          estado: data.state || '',
        })),
        catchError(() => throwError(() => new Error('CEP não encontrado')))
      );
  }

  validarCNPJ(cnpj: string): boolean {
    const c = cnpj.replace(/\D/g, '');
    if (c.length !== 14) return false;
    if (/^(\d)\1+$/.test(c)) return false;
    const calc = (s: string, n: number) => {
      let soma = 0;
      let pos = n - 7;
      for (let i = n; i >= 1; i--) {
        soma += parseInt(s.charAt(n - i)) * pos--;
        if (pos < 2) pos = 9;
      }
      return soma % 11 < 2 ? 0 : 11 - (soma % 11);
    };
    return calc(c, 12) === parseInt(c.charAt(12)) && calc(c, 13) === parseInt(c.charAt(13));
  }

  validarCPF(cpf: string): boolean {
    const c = cpf.replace(/\D/g, '');
    if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
    const calc = (s: string, n: number) => {
      let soma = 0;
      for (let i = 0; i < n; i++) soma += parseInt(s.charAt(i)) * (n + 1 - i);
      const r = 11 - (soma % 11);
      return r > 9 ? 0 : r;
    };
    return calc(c, 9) === parseInt(c.charAt(9)) && calc(c, 10) === parseInt(c.charAt(10));
  }
}

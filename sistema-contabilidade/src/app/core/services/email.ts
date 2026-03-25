import { Injectable } from '@angular/core';
import emailjs from '@emailjs/browser';
import { EmailPayload } from '../models';

// Configure suas credenciais do EmailJS em environment
const EMAILJS_SERVICE_ID = 'SEU_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'SEU_TEMPLATE_ID';
const EMAILJS_PUBLIC_KEY = 'SUA_PUBLIC_KEY';

@Injectable({ providedIn: 'root' })
export class EmailService {

  /**
   * Envia email via EmailJS.
   * Para funcionar em produção, configure suas credenciais
   * em src/environments/environment.ts e substitua as constantes acima.
   */
  async enviarEmail(payload: EmailPayload): Promise<{ sucesso: boolean; mensagem: string }> {
    try {
      const templateParams = {
        to_email: payload.destinatario,
        to_name: payload.nomeDestinatario,
        subject: payload.assunto,
        message: payload.mensagem,
      };

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );

      return { sucesso: true, mensagem: 'Email enviado com sucesso!' };
    } catch (error: any) {
      console.error('Erro ao enviar email:', error);
      return {
        sucesso: false,
        mensagem: `Erro ao enviar email: ${error?.text || error?.message || 'Erro desconhecido'}. Configure as credenciais do EmailJS.`,
      };
    }
  }

  async enviarBoleto(
    emailDestinatario: string,
    nomeDestinatario: string,
    numeroBoleto: string,
    valorBoleto: number,
    dataVencimento: string,
    linhaDigitavel: string
  ): Promise<{ sucesso: boolean; mensagem: string }> {
    const mensagem = `
Prezado(a) ${nomeDestinatario},

Segue o boleto referente aos seus serviços contábeis:

Número: ${numeroBoleto}
Valor: ${valorBoleto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
Data de Vencimento: ${new Date(dataVencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
Linha Digitável: ${linhaDigitavel}

Em caso de dúvidas, entre em contato conosco.

Atenciosamente,
Escritório de Contabilidade
    `.trim();

    return this.enviarEmail({
      destinatario: emailDestinatario,
      nomeDestinatario,
      assunto: `Boleto - Vencimento ${new Date(dataVencimento + 'T00:00:00').toLocaleDateString('pt-BR')}`,
      mensagem,
    });
  }

  async enviarNotaFiscal(
    emailDestinatario: string,
    nomeDestinatario: string,
    numeroNF: string,
    valorNF: number,
    dataEmissao: string
  ): Promise<{ sucesso: boolean; mensagem: string }> {
    const mensagem = `
Prezado(a) ${nomeDestinatario},

Segue a Nota Fiscal de Serviços referente à prestação de serviços contábeis:

Número NF: ${numeroNF}
Valor: ${valorNF.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
Data de Emissão: ${new Date(dataEmissao + 'T00:00:00').toLocaleDateString('pt-BR')}

O documento em PDF está sendo enviado em anexo.

Atenciosamente,
Escritório de Contabilidade
    `.trim();

    return this.enviarEmail({
      destinatario: emailDestinatario,
      nomeDestinatario,
      assunto: `Nota Fiscal nº ${numeroNF} - Serviços Contábeis`,
      mensagem,
    });
  }

  async enviarExtrato(
    emailDestinatario: string,
    nomeDestinatario: string,
    periodoInicio: string,
    periodoFim: string,
    saldo: number
  ): Promise<{ sucesso: boolean; mensagem: string }> {
    const mensagem = `
Prezado(a) ${nomeDestinatario},

Segue o extrato financeiro referente ao período de ${new Date(periodoInicio + 'T00:00:00').toLocaleDateString('pt-BR')} a ${new Date(periodoFim + 'T00:00:00').toLocaleDateString('pt-BR')}.

Saldo do Período: ${saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}

O extrato completo em PDF está disponível no sistema de contabilidade.

Atenciosamente,
Escritório de Contabilidade
    `.trim();

    return this.enviarEmail({
      destinatario: emailDestinatario,
      nomeDestinatario,
      assunto: `Extrato Financeiro - ${new Date(periodoInicio + 'T00:00:00').toLocaleDateString('pt-BR')} a ${new Date(periodoFim + 'T00:00:00').toLocaleDateString('pt-BR')}`,
      mensagem,
    });
  }
}

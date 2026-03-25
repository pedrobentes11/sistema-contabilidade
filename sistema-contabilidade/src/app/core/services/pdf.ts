import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ExtratoCliente, Boleto, NotaFiscal } from '../models';

@Injectable({ providedIn: 'root' })
export class PdfService {

  async gerarPdfDeElemento(elemento: HTMLElement, nomeArquivo: string): Promise<void> {
    const canvas = await html2canvas(elemento, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    pdf.save(`${nomeArquivo}.pdf`);
  }

  gerarExtratoClientePDF(extrato: ExtratoCliente): void {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const margin = 15;
    let y = margin;

    // Header
    pdf.setFillColor(25, 118, 210);
    pdf.rect(0, 0, 210, 35, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SISTEMA CONTÁBIL', margin, 15);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Extrato Financeiro', margin, 25);
    pdf.text(`Gerado em: ${new Date(extrato.dataGeracao).toLocaleDateString('pt-BR')}`, 210 - margin, 25, { align: 'right' });

    y = 45;
    pdf.setTextColor(0, 0, 0);

    // Dados do cliente
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, y, 180, 30, 'F');
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DADOS DO CLIENTE', margin + 3, y + 7);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Nome/Razão Social: ${extrato.clienteNome}`, margin + 3, y + 14);
    pdf.text(`CNPJ/CPF: ${extrato.clienteCnpjCpf}`, margin + 3, y + 21);
    pdf.text(`Período: ${new Date(extrato.periodo.inicio + 'T00:00:00').toLocaleDateString('pt-BR')} a ${new Date(extrato.periodo.fim + 'T00:00:00').toLocaleDateString('pt-BR')}`, margin + 3, y + 28);

    y += 38;

    // Resumo
    pdf.setFillColor(232, 245, 233);
    pdf.rect(margin, y, 55, 22, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(27, 94, 32);
    pdf.text('TOTAL RECEITAS', margin + 3, y + 7);
    pdf.setFontSize(12);
    pdf.text(this.formatCurrency(extrato.totalReceitas), margin + 3, y + 16);

    pdf.setFillColor(255, 235, 238);
    pdf.rect(margin + 62, y, 55, 22, 'F');
    pdf.setTextColor(183, 28, 28);
    pdf.setFontSize(9);
    pdf.text('TOTAL DESPESAS', margin + 65, y + 7);
    pdf.setFontSize(12);
    pdf.text(this.formatCurrency(extrato.totalDespesas), margin + 65, y + 16);

    const saldoPositivo = extrato.saldo >= 0;
    pdf.setFillColor(saldoPositivo ? 227 : 255, saldoPositivo ? 242 : 235, saldoPositivo ? 253 : 238);
    pdf.rect(margin + 124, y, 55, 22, 'F');
    pdf.setTextColor(saldoPositivo ? 13 : 183, saldoPositivo ? 71 : 28, saldoPositivo ? 161 : 28);
    pdf.setFontSize(9);
    pdf.text('SALDO', margin + 127, y + 7);
    pdf.setFontSize(12);
    pdf.text(this.formatCurrency(extrato.saldo), margin + 127, y + 16);

    y += 30;
    pdf.setTextColor(0, 0, 0);

    // Tabela lançamentos
    pdf.setFillColor(25, 118, 210);
    pdf.rect(margin, y, 180, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('DATA', margin + 2, y + 5.5);
    pdf.text('DESCRIÇÃO', margin + 22, y + 5.5);
    pdf.text('CATEGORIA', margin + 90, y + 5.5);
    pdf.text('TIPO', margin + 135, y + 5.5);
    pdf.text('STATUS', margin + 150, y + 5.5);
    pdf.text('VALOR', margin + 165, y + 5.5);

    y += 10;
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');

    extrato.lancamentos.forEach((l, i) => {
      if (y > 270) {
        pdf.addPage();
        y = 20;
      }
      const bg = i % 2 === 0 ? [250, 250, 250] : [255, 255, 255];
      pdf.setFillColor(bg[0], bg[1], bg[2]);
      pdf.rect(margin, y - 4, 180, 8, 'F');
      pdf.setFontSize(8);
      pdf.text(new Date(l.dataLancamento + 'T00:00:00').toLocaleDateString('pt-BR'), margin + 2, y + 1);
      pdf.text(l.descricao.substring(0, 28), margin + 22, y + 1);
      pdf.text(l.categoria.substring(0, 18), margin + 90, y + 1);
      if (l.tipo === 'RECEITA') {
        pdf.setTextColor(27, 94, 32);
      } else {
        pdf.setTextColor(183, 28, 28);
      }
      pdf.text(l.tipo, margin + 135, y + 1);
      pdf.setTextColor(100, 100, 100);
      pdf.text(l.status, margin + 150, y + 1);
      if (l.tipo === 'RECEITA') {
        pdf.setTextColor(27, 94, 32);
      } else {
        pdf.setTextColor(183, 28, 28);
      }
      pdf.text(this.formatCurrency(l.valor), margin + 165, y + 1);
      pdf.setTextColor(0, 0, 0);
      y += 8;
    });

    pdf.save(`extrato_${extrato.clienteNome.replace(/\s+/g, '_')}_${extrato.periodo.inicio}_${extrato.periodo.fim}.pdf`);
  }

  gerarBoletoPDF(boleto: Boleto): void {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const margin = 15;
    let y = margin;

    // Header banco simulado
    pdf.setFillColor(0, 86, 179);
    pdf.rect(0, 0, 210, 30, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('BOLETO BANCÁRIO', margin, 14);
    pdf.setFontSize(22);
    pdf.text('001-9', 140, 20);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Banco do Sistema Contábil', margin, 24);

    y = 38;
    pdf.setTextColor(0, 0, 0);

    // Linha digitável
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, y, 180, 10, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    const linhaDiv = boleto.linhaDigitavel || '00190.00009 00000.000000 00000.000000 1 00000000000000';
    pdf.text(linhaDiv, 105, y + 7, { align: 'center' });

    y += 18;

    // Dados cedente
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('CEDENTE:', margin, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(boleto.cedenteName, margin + 20, y);
    pdf.setFont('helvetica', 'bold');
    pdf.text('AGÊNCIA/CÓD. CEDENTE:', 120, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(boleto.cedenteAgencia || '0001 / 000001-0', 160, y);

    y += 10;
    pdf.line(margin, y, 195, y);
    y += 5;

    // Dados sacado
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('PAGADOR:', margin, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${boleto.sacadoNome} - ${boleto.sacadoCnpjCpf}`, margin + 20, y);
    y += 7;
    pdf.setFont('helvetica', 'bold');
    pdf.text('ENDEREÇO:', margin, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(boleto.sacadoEndereco, margin + 20, y);

    y += 10;
    pdf.line(margin, y, 195, y);
    y += 5;

    // Dados do boleto
    const col1 = margin;
    const col2 = margin + 65;
    const col3 = margin + 130;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text('NOSSO NÚMERO:', col1, y);
    pdf.text('DATA DE EMISSÃO:', col2, y);
    pdf.text('DATA DE VENCIMENTO:', col3, y);
    y += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(boleto.nossoNumero, col1, y);
    pdf.text(new Date(boleto.dataEmissao + 'T00:00:00').toLocaleDateString('pt-BR'), col2, y);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(200, 0, 0);
    pdf.text(new Date(boleto.dataVencimento + 'T00:00:00').toLocaleDateString('pt-BR'), col3, y);
    pdf.setTextColor(0, 0, 0);

    y += 10;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text('NÚMERO DO DOCUMENTO:', col1, y);
    pdf.text('ESPÉCIE:', col2, y);
    pdf.text('VALOR DO DOCUMENTO (R$):', col3, y);
    y += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(boleto.numeroDocumento, col1, y);
    pdf.text('DM', col2, y);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text(this.formatCurrency(boleto.valor), col3, y);

    y += 12;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('DESCRIÇÃO / INSTRUÇÕES:', margin, y);
    y += 6;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text(boleto.descricao, margin, y);
    if (boleto.instrucoes) {
      boleto.instrucoes.forEach(instrucao => {
        y += 6;
        pdf.text(`• ${instrucao}`, margin, y);
      });
    }

    y += 15;
    // Código de barras simulado (visual)
    pdf.setFillColor(0, 0, 0);
    let barX = margin;
    const barY = y;
    const barH = 18;
    const codigoBarras = boleto.codigoBarras || '00190000090000000000000000000000100000000000000';
    for (let i = 0; i < codigoBarras.length; i++) {
      const w = parseInt(codigoBarras[i]) % 2 === 0 ? 0.8 : 1.2;
      if (i % 2 === 0) {
        pdf.rect(barX, barY, w, barH, 'F');
      }
      barX += w;
    }

    y += barH + 10;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text(codigoBarras, 105, y, { align: 'center' });

    pdf.save(`boleto_${boleto.clienteNome.replace(/\s+/g, '_')}_${boleto.dataVencimento}.pdf`);
  }

  gerarNotaFiscalPDF(nf: NotaFiscal): void {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const margin = 15;
    let y = margin;

    // Header NF
    pdf.setFillColor(46, 125, 50);
    pdf.rect(0, 0, 210, 35, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('NOTA FISCAL DE SERVIÇOS', margin, 16);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Número: ${nf.numero || 'RASCUNHO'}`, margin, 26);
    pdf.text(`Status: ${nf.status}`, margin, 32);
    pdf.text(`Data de Emissão: ${new Date(nf.dataEmissao + 'T00:00:00').toLocaleDateString('pt-BR')}`, 140, 26);
    pdf.text(`Tipo: ${nf.tipo}`, 140, 32);

    y = 42;
    pdf.setTextColor(0, 0, 0);

    // Emitente
    pdf.setFillColor(232, 245, 233);
    pdf.rect(margin, y, 180, 28, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('PRESTADOR DE SERVIÇOS (EMITENTE)', margin + 3, y + 6);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text(`Razão Social: ${nf.emitenteNome}`, margin + 3, y + 12);
    pdf.text(`CNPJ: ${nf.emitenteCnpj}`, margin + 3, y + 18);
    pdf.text(`Endereço: ${nf.emitenteEndereco}`, margin + 3, y + 24);

    y += 33;

    // Tomador
    pdf.setFillColor(227, 242, 253);
    pdf.rect(margin, y, 180, 28, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('TOMADOR DE SERVIÇOS', margin + 3, y + 6);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Nome/Razão Social: ${nf.tomadorNome}`, margin + 3, y + 12);
    pdf.text(`CNPJ/CPF: ${nf.tomadorCnpjCpf}`, margin + 3, y + 18);
    pdf.text(`Endereço: ${nf.tomadorEndereco}`, margin + 3, y + 24);

    y += 33;

    // Discriminação de serviços
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('DISCRIMINAÇÃO DOS SERVIÇOS', margin, y + 6);
    y += 10;
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, y, 180, 5, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text('DESCRIÇÃO', margin + 2, y + 4);
    pdf.text('QTDE', margin + 100, y + 4);
    pdf.text('UNIT. (R$)', margin + 120, y + 4);
    pdf.text('TOTAL (R$)', margin + 150, y + 4);
    y += 7;
    pdf.setFont('helvetica', 'normal');
    nf.itens.forEach((item, i) => {
      if (y > 260) { pdf.addPage(); y = 20; }
      const bg = i % 2 === 0 ? [255, 255, 255] : [248, 248, 248];
      pdf.setFillColor(bg[0], bg[1], bg[2]);
      pdf.rect(margin, y - 3, 180, 7, 'F');
      pdf.setFontSize(8);
      pdf.text(item.descricao.substring(0, 40), margin + 2, y + 1);
      pdf.text(String(item.quantidade), margin + 102, y + 1);
      pdf.text(this.formatCurrency(item.valorUnitario), margin + 120, y + 1);
      pdf.text(this.formatCurrency(item.valorTotal), margin + 150, y + 1);
      y += 8;
    });

    y += 5;
    pdf.line(margin, y, 195, y);
    y += 8;

    // Impostos
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('TRIBUTOS', margin, y);
    y += 7;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    if (nf.impostos.aliquotaISS) {
      pdf.text(`ISS (${nf.impostos.aliquotaISS}%): ${this.formatCurrency(nf.impostos.valorISS || 0)}`, margin, y);
      y += 6;
    }
    if (nf.impostos.valorIRPJ) {
      pdf.text(`IRPJ: ${this.formatCurrency(nf.impostos.valorIRPJ)}`, margin, y);
      y += 6;
    }
    if (nf.impostos.valorINSS) {
      pdf.text(`INSS Retido: ${this.formatCurrency(nf.impostos.valorINSS)}`, margin, y);
      y += 6;
    }

    y += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setFillColor(46, 125, 50);
    pdf.setTextColor(255, 255, 255);
    pdf.rect(130, y - 5, 65, 12, 'F');
    pdf.text(`VALOR LÍQUIDO: ${this.formatCurrency(nf.impostos.valorLiquido)}`, 162, y + 2, { align: 'center' });
    pdf.setTextColor(0, 0, 0);

    if (nf.observacoes) {
      y += 20;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text('OBSERVAÇÕES:', margin, y);
      y += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.text(nf.observacoes, margin, y);
    }

    pdf.save(`nf_${nf.numero || 'rascunho'}_${nf.tomadorNome.replace(/\s+/g, '_')}.pdf`);
  }

  async obterBase64DeElemento(elemento: HTMLElement): Promise<string> {
    const canvas = await html2canvas(elemento, { scale: 2, useCORS: true });
    return canvas.toDataURL('image/png');
  }

  private formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { ClienteService } from '../../../core/services/cliente';
import { LancamentoService } from '../../../core/services/lancamento';
import { BoletoService } from '../../../core/services/boleto';
import { NotaFiscalService } from '../../../core/services/nota-fiscal';
import { DashboardResumo, VencimentoItem, GraficoDado } from '../../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  resumo: DashboardResumo = {
    totalClientes: 0,
    clientesAtivos: 0,
    clientesInativos: 0,
    receitaMesAtual: 0,
    despesaMesAtual: 0,
    saldoMesAtual: 0,
    boletosVencidos: 0,
    boletosPendentes: 0,
    boletosEmitidosMes: 0,
    nfEmitidasMes: 0,
    honorariosPendentes: 0,
    proximosVencimentos: [],
    graficoMensalReceitas: [],
    graficoMensalDespesas: [],
    receitasPorCategoria: [],
    despesasPorCategoria: [],
  };

  carregando = true;

  constructor(
    private clienteService: ClienteService,
    private lancamentoService: LancamentoService,
    private boletoService: BoletoService,
    private nfService: NotaFiscalService,
    public router: Router
  ) {}

  ngOnInit(): void {
    const mesAtual = new Date().toISOString().substring(0, 7);
    const hoje = new Date().toISOString().substring(0, 10);

    combineLatest([
      this.clienteService.getAll(),
      this.lancamentoService.getAll(),
      this.boletoService.getAll(),
      this.nfService.getAll(),
    ]).pipe(
      map(([clientes, lancamentos, boletos, nfs]) => {
        const lancMes = lancamentos.filter(l => l.dataLancamento.startsWith(mesAtual));
        const receitasMes = lancMes.filter(l => l.tipo === 'RECEITA' && l.status === 'RECEBIDO');
        const despesasMes = lancMes.filter(l => l.tipo === 'DESPESA' && l.status === 'PAGO');

        // Próximos vencimentos (boletos)
        const proxVenc: VencimentoItem[] = boletos
          .filter(b => b.status === 'EMITIDO' && b.dataVencimento >= hoje)
          .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento))
          .slice(0, 8)
          .map(b => ({
            id: b.id,
            tipo: 'BOLETO' as const,
            descricao: b.descricao,
            clienteNome: b.clienteNome,
            valor: b.valor,
            dataVencimento: b.dataVencimento,
            diasRestantes: Math.ceil(
              (new Date(b.dataVencimento + 'T00:00:00').getTime() - new Date(hoje + 'T00:00:00').getTime()) /
                (1000 * 60 * 60 * 24)
            ),
          }));

        // Gráfico últimos 6 meses
        const graficoReceitas: GraficoDado[] = [];
        const graficoDespesas: GraficoDado[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const mes = d.toISOString().substring(0, 7);
          const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
          graficoReceitas.push({
            name: label,
            value: lancamentos
              .filter(l => l.tipo === 'RECEITA' && l.status === 'RECEBIDO' && l.dataLancamento.startsWith(mes))
              .reduce((s, l) => s + l.valor, 0),
          });
          graficoDespesas.push({
            name: label,
            value: lancamentos
              .filter(l => l.tipo === 'DESPESA' && l.status === 'PAGO' && l.dataLancamento.startsWith(mes))
              .reduce((s, l) => s + l.valor, 0),
          });
        }

        // Receitas por categoria
        const mapRec: Record<string, number> = {};
        lancamentos.filter(l => l.tipo === 'RECEITA' && l.status === 'RECEBIDO').forEach(l => {
          mapRec[l.categoria] = (mapRec[l.categoria] || 0) + l.valor;
        });

        return {
          totalClientes: clientes.length,
          clientesAtivos: clientes.filter(c => c.status === 'ATIVO').length,
          clientesInativos: clientes.filter(c => c.status === 'INATIVO').length,
          receitaMesAtual: receitasMes.reduce((s, l) => s + l.valor, 0),
          despesaMesAtual: despesasMes.reduce((s, l) => s + l.valor, 0),
          saldoMesAtual:
            receitasMes.reduce((s, l) => s + l.valor, 0) -
            despesasMes.reduce((s, l) => s + l.valor, 0),
          boletosVencidos: boletos.filter(b => b.status === 'EMITIDO' && b.dataVencimento < hoje).length,
          boletosPendentes: boletos.filter(b => b.status === 'EMITIDO').length,
          boletosEmitidosMes: boletos.filter(b => b.dataEmissao.startsWith(mesAtual)).length,
          nfEmitidasMes: nfs.filter(n => n.status === 'EMITIDA' && n.dataEmissao.startsWith(mesAtual)).length,
          honorariosPendentes: lancamentos
            .filter(l => l.tipo === 'RECEITA' && l.status === 'PENDENTE' && l.categoria === 'HONORARIO_CONTABIL')
            .reduce((s, l) => s + l.valor, 0),
          proximosVencimentos: proxVenc,
          graficoMensalReceitas: graficoReceitas,
          graficoMensalDespesas: graficoDespesas,
          receitasPorCategoria: Object.entries(mapRec).map(([name, value]) => ({ name, value })),
          despesasPorCategoria: [],
        } as DashboardResumo;
      })
    ).subscribe(r => {
      this.resumo = r;
      this.carregando = false;
    });
  }

  formatCurrency(v: number): string {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  getStatusVencClass(dias: number): string {
    if (dias < 0) return 'vencido';
    if (dias <= 3) return 'urgente';
    if (dias <= 7) return 'proximo';
    return 'ok';
  }
}

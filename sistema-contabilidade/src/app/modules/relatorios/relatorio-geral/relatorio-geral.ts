import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LancamentoService } from '../../../core/services/lancamento';
import { ClienteService } from '../../../core/services/cliente';
import { BoletoService } from '../../../core/services/boleto';
import { NotaFiscalService } from '../../../core/services/nota-fiscal';
import { Lancamento } from '../../../core/models';

interface MesResumo {
  mes: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

interface CatResumo {
  categoria: string;
  total: number;
}

@Component({
  selector: 'app-relatorio-geral',
  standalone: false,
  templateUrl: './relatorio-geral.html',
  styleUrl: './relatorio-geral.scss',
})
export class RelatorioGeral implements OnInit, OnDestroy {
  filtroForm!: FormGroup;

  clientes: { id: string; nome: string }[] = [];
  lancamentosFiltrados: Lancamento[] = [];
  resumoPorMes: MesResumo[] = [];
  despesasPorCategoria: CatResumo[] = [];
  receitasPorCategoria: CatResumo[] = [];

  totalClientes = 0;
  totalBoletos = 0;
  totalNFs = 0;

  private todosLancamentos: Lancamento[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private lancamentoService: LancamentoService,
    private clienteService: ClienteService,
    private boletoService: BoletoService,
    private nfService: NotaFiscalService
  ) {}

  ngOnInit(): void {
    const hoje = new Date();
    const inicioAno = new Date(hoje.getFullYear(), 0, 1).toISOString().substring(0, 10);
    const fimAno = hoje.toISOString().substring(0, 10);

    this.filtroForm = this.fb.group({
      clienteId: [''],
      dataInicio: [inicioAno],
      dataFim: [fimAno],
    });

    combineLatest([
      this.lancamentoService.lancamentos$,
      this.clienteService.clientes$,
      this.boletoService.boletos$,
      this.nfService.nfs$
    ]).pipe(takeUntil(this.destroy$)).subscribe(([lancamentos, clientes, boletos, nfs]) => {
      this.todosLancamentos = lancamentos;
      this.clientes = clientes.map(c => ({
        id: c.id,
        nome: c.tipoPessoa === 'JURIDICA' ? (c.razaoSocial || '') : (c.nomeCompleto || '')
      }));
      this.totalClientes = clientes.length;
      this.totalBoletos = boletos.length;
      this.totalNFs = nfs.length;
      this.calcularRelatorio();
    });
  }

  calcularRelatorio(): void {
    const { clienteId, dataInicio, dataFim } = this.filtroForm.value;
    this.lancamentosFiltrados = this.todosLancamentos.filter(l => {
      const matchCliente = !clienteId || l.clienteId === clienteId;
      const matchDatas = (!dataInicio || l.dataLancamento >= dataInicio) &&
                        (!dataFim   || l.dataLancamento <= dataFim);
      return matchCliente && matchDatas;
    });

    // Resumo por mês (últimos 6 meses)
    const meses: Record<string, MesResumo> = {};
    const hoje = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      meses[key] = { mes: label, receitas: 0, despesas: 0, saldo: 0 };
    }
    this.lancamentosFiltrados.forEach(l => {
      const key = l.dataLancamento.substring(0, 7);
      if (meses[key]) {
        if (l.tipo === 'RECEITA') meses[key].receitas += l.valor;
        else meses[key].despesas += l.valor;
      }
    });
    this.resumoPorMes = Object.values(meses).map(m => ({
      ...m, saldo: m.receitas - m.despesas
    }));

    // Categorias
    const despesaMap: Record<string, number> = {};
    const receitaMap: Record<string, number> = {};
    this.lancamentosFiltrados.forEach(l => {
      const cat = l.categoria || 'OUTROS';
      if (l.tipo === 'DESPESA') despesaMap[cat] = (despesaMap[cat] || 0) + l.valor;
      else receitaMap[cat] = (receitaMap[cat] || 0) + l.valor;
    });
    this.despesasPorCategoria = Object.entries(despesaMap)
      .map(([categoria, total]) => ({ categoria: categoria.replace(/_/g, ' '), total }))
      .sort((a, b) => b.total - a.total);
    this.receitasPorCategoria = Object.entries(receitaMap)
      .map(([categoria, total]) => ({ categoria: categoria.replace(/_/g, ' '), total }))
      .sort((a, b) => b.total - a.total);
  }

  get totalReceitas(): number {
    return this.lancamentosFiltrados.filter(l => l.tipo === 'RECEITA').reduce((s, l) => s + l.valor, 0);
  }

  get totalDespesas(): number {
    return this.lancamentosFiltrados.filter(l => l.tipo === 'DESPESA').reduce((s, l) => s + l.valor, 0);
  }

  get saldo(): number {
    return this.totalReceitas - this.totalDespesas;
  }

  get maxValorMes(): number {
    return Math.max(...this.resumoPorMes.map(m => Math.max(m.receitas, m.despesas)), 1);
  }

  getBarWidth(valor: number): string {
    return `${(valor / this.maxValorMes) * 100}%`;
  }

  formatCategoria(cat: string): string {
    return cat;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}


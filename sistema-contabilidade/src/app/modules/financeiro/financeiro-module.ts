import { NgModule } from '@angular/core';
import { FinanceiroRoutingModule } from './financeiro-routing-module';
import { LancamentosLista } from './lancamentos-lista/lancamentos-lista';
import { LancamentoForm } from './lancamento-form/lancamento-form';
import { Extrato } from './extrato/extrato';
import { SharedModule } from '../shared/shared-module';

@NgModule({
  declarations: [LancamentosLista, LancamentoForm, Extrato],
  imports: [SharedModule, FinanceiroRoutingModule],
})
export class FinanceiroModule {}

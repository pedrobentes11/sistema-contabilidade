import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LancamentosLista } from './lancamentos-lista/lancamentos-lista';
import { LancamentoForm } from './lancamento-form/lancamento-form';
import { Extrato } from './extrato/extrato';

const routes: Routes = [
  { path: '', redirectTo: 'lancamentos', pathMatch: 'full' },
  { path: 'lancamentos', component: LancamentosLista },
  { path: 'lancamentos/novo', component: LancamentoForm },
  { path: 'lancamentos/:id/editar', component: LancamentoForm },
  { path: 'extrato', component: Extrato },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FinanceiroRoutingModule {}

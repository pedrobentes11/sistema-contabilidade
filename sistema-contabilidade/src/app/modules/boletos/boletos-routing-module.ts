import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BoletosLista } from './boletos-lista/boletos-lista';
import { BoletoForm } from './boleto-form/boleto-form';
import { BoletoVisualizar } from './boleto-visualizar/boleto-visualizar';

const routes: Routes = [
  { path: '', component: BoletosLista },
  { path: 'novo', component: BoletoForm },
  { path: ':id', component: BoletoVisualizar },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BoletosRoutingModule {}

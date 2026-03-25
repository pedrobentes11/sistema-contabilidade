import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NfLista } from './nf-lista/nf-lista';
import { NfVisualizar } from './nf-visualizar/nf-visualizar';
import { NfForm } from './nf-form/nf-form';

const routes: Routes = [
  { path: '', component: NfLista },
  { path: 'nova', component: NfForm },
  { path: ':id', component: NfVisualizar },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NotasFiscaisRoutingModule {}

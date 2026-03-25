import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClientesLista } from './clientes-lista/clientes-lista';
import { ClienteForm } from './cliente-form/cliente-form';
import { ClienteDetalhe } from './cliente-detalhe/cliente-detalhe';

const routes: Routes = [
  { path: '', component: ClientesLista },
  { path: 'novo', component: ClienteForm },
  { path: ':id', component: ClienteDetalhe },
  { path: ':id/editar', component: ClienteForm },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClientesRoutingModule {}

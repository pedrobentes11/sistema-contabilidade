import { NgModule } from '@angular/core';
import { ClientesRoutingModule } from './clientes-routing-module';
import { ClientesLista } from './clientes-lista/clientes-lista';
import { ClienteForm } from './cliente-form/cliente-form';
import { ClienteDetalhe } from './cliente-detalhe/cliente-detalhe';
import { SharedModule } from '../shared/shared-module';

@NgModule({
  declarations: [ClientesLista, ClienteForm, ClienteDetalhe],
  imports: [SharedModule, ClientesRoutingModule],
})
export class ClientesModule {}

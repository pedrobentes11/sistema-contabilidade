import { NgModule } from '@angular/core';
import { BoletosRoutingModule } from './boletos-routing-module';
import { BoletosLista } from './boletos-lista/boletos-lista';
import { BoletoForm } from './boleto-form/boleto-form';
import { BoletoVisualizar } from './boleto-visualizar/boleto-visualizar';
import { SharedModule } from '../shared/shared-module';

@NgModule({
  declarations: [BoletosLista, BoletoForm, BoletoVisualizar],
  imports: [SharedModule, BoletosRoutingModule],
})
export class BoletosModule {}

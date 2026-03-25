import { NgModule } from '@angular/core';
import { NotasFiscaisRoutingModule } from './notas-fiscais-routing-module';
import { NfLista } from './nf-lista/nf-lista';
import { NfVisualizar } from './nf-visualizar/nf-visualizar';
import { NfForm } from './nf-form/nf-form';
import { SharedModule } from '../shared/shared-module';

@NgModule({
  declarations: [NfLista, NfVisualizar, NfForm],
  imports: [SharedModule, NotasFiscaisRoutingModule],
})
export class NotasFiscaisModule {}

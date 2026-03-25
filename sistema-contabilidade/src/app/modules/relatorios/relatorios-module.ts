import { NgModule } from '@angular/core';
import { RelatoriosRoutingModule } from './relatorios-routing-module';
import { RelatorioGeral } from './relatorio-geral/relatorio-geral';
import { SharedModule } from '../shared/shared-module';

@NgModule({
  declarations: [RelatorioGeral],
  imports: [SharedModule, RelatoriosRoutingModule],
})
export class RelatoriosModule {}

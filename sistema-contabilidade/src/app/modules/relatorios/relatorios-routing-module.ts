import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RelatorioGeral } from './relatorio-geral/relatorio-geral';

const routes: Routes = [{ path: '', component: RelatorioGeral }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RelatoriosRoutingModule {}

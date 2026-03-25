import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadChildren: () =>
      import('./modules/auth/auth-module').then(m => m.AuthModule),
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./modules/dashboard/dashboard-module').then(m => m.DashboardModule),
  },
  {
    path: 'clientes',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./modules/clientes/clientes-module').then(m => m.ClientesModule),
  },
  {
    path: 'financeiro',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./modules/financeiro/financeiro-module').then(m => m.FinanceiroModule),
  },
  {
    path: 'boletos',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./modules/boletos/boletos-module').then(m => m.BoletosModule),
  },
  {
    path: 'notas-fiscais',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./modules/notas-fiscais/notas-fiscais-module').then(m => m.NotasFiscaisModule),
  },
  {
    path: 'relatorios',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./modules/relatorios/relatorios-module').then(m => m.RelatoriosModule),
  },
  { path: '**', redirectTo: '/dashboard' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

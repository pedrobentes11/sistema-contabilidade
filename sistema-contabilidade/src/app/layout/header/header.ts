import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  paginaAtual = 'Dashboard';
  dataHoje = new Date();

  private rotasTitulos: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/clientes': 'Clientes',
    '/clientes/novo': 'Novo Cliente',
    '/financeiro/lancamentos': 'Lançamentos',
    '/financeiro/extrato': 'Extrato Financeiro',
    '/boletos': 'Boletos',
    '/boletos/novo': 'Novo Boleto',
    '/notas-fiscais': 'Notas Fiscais',
    '/notas-fiscais/nova': 'Nova Nota Fiscal',
    '/relatorios': 'Relatórios',
  };

  constructor(public auth: AuthService, private router: Router) {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      const url = e.urlAfterRedirects.split('?')[0];
      this.paginaAtual = this.rotasTitulos[url] || 'Sistema Contábil';
    });
  }

  sair(): void {
    this.auth.logout();
  }
}

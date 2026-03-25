import { Component } from '@angular/core';
import { Router } from '@angular/router';

export interface NavItem {
  label: string;
  icon: string;
  route?: string;
  children?: NavItem[];
  expanded?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Clientes', icon: 'people', route: '/clientes' },
    {
      label: 'Financeiro',
      icon: 'account_balance_wallet',
      expanded: false,
      children: [
        { label: 'Lançamentos', icon: 'receipt_long', route: '/financeiro/lancamentos' },
        { label: 'Extrato', icon: 'summarize', route: '/financeiro/extrato' },
      ],
    },
    {
      label: 'Documentos',
      icon: 'description',
      expanded: false,
      children: [
        { label: 'Boletos', icon: 'payments', route: '/boletos' },
        { label: 'Notas Fiscais', icon: 'receipt', route: '/notas-fiscais' },
      ],
    },
    { label: 'Relatórios', icon: 'bar_chart', route: '/relatorios' },
  ];

  constructor(public router: Router) {}

  toggleItem(item: NavItem): void {
    if (item.children) {
      item.expanded = !item.expanded;
    } else if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  isActive(route?: string): boolean {
    if (!route) return false;
    return this.router.isActive(route, { paths: 'subset', queryParams: 'ignored', fragment: 'ignored', matrixParams: 'ignored' });
  }
}

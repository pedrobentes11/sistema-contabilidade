import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClienteService } from '../../../core/services/cliente';
import { Cliente, StatusCliente } from '../../../core/models';

@Component({
  selector: 'app-clientes-lista',
  standalone: false,
  templateUrl: './clientes-lista.html',
  styleUrl: './clientes-lista.scss',
})
export class ClientesLista implements OnInit {
  displayedColumns = ['nomeRazao', 'cnpjCpf', 'email', 'regimeTributario', 'honorario', 'status', 'acoes'];
  dataSource = new MatTableDataSource<Cliente>();
  carregando = true;
  termoBusca = '';
  filtroStatus: StatusCliente | '' = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private clienteService: ClienteService,
    public router: Router,
    private route: ActivatedRoute,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Suporte a query param ?busca=
    this.route.queryParams.subscribe(params => {
      if (params['busca']) this.termoBusca = params['busca'];
      if (params['status']) this.filtroStatus = params['status'];
    });

    this.clienteService.getAll().subscribe(clientes => {
      this.dataSource.data = clientes;
      this.dataSource.filterPredicate = (c, filter) => {
        const nome = c.tipoPessoa === 'JURIDICA' ? (c.razaoSocial || '') : (c.nomeCompleto || '');
        const cnpjCpf = c.tipoPessoa === 'JURIDICA' ? (c.cnpj || '') : (c.cpf || '');
        return (
          nome.toLowerCase().includes(filter) ||
          cnpjCpf.includes(filter) ||
          c.contato.email.toLowerCase().includes(filter)
        );
      };
      setTimeout(() => {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        if (this.termoBusca) this.applyFilter();
        this.carregando = false;
      });
    });
  }

  applyFilter(): void {
    this.dataSource.filter = this.termoBusca.toLowerCase().trim();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { busca: this.termoBusca || null, status: this.filtroStatus || null },
      queryParamsHandling: 'merge',
    });
  }

  clearFilter(): void {
    this.termoBusca = '';
    this.filtroStatus = '';
    this.dataSource.filter = '';
    this.router.navigate([], { queryParams: {} });
  }

  getNome(c: Cliente): string {
    return c.tipoPessoa === 'JURIDICA' ? (c.razaoSocial || '') : (c.nomeCompleto || '');
  }

  getCnpjCpf(c: Cliente): string {
    return c.tipoPessoa === 'JURIDICA' ? (c.cnpj || '') : (c.cpf || '');
  }

  getStatusClass(status: StatusCliente): string {
    return status === 'ATIVO' ? 'status-ativo' : status === 'INATIVO' ? 'status-inativo' : 'status-suspenso';
  }

  excluir(c: Cliente): void {
    if (confirm(`Deseja realmente excluir o cliente "${this.getNome(c)}"?`)) {
      this.clienteService.delete(c.id).subscribe(() => {
        this.snack.open('Cliente excluído com sucesso!', 'Fechar', { duration: 3000 });
      });
    }
  }
}

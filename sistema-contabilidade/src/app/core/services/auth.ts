import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

export interface Usuario {
  nome: string;
  login: string;
}

// Credenciais válidas — adicione/altere quantas quiser aqui
const USUARIOS: { login: string; senha: string; nome: string }[] = [
  { login: 'admin', senha: 'admin123', nome: 'Administrador' },
];

const SESSION_KEY = 'contafacil_usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _usuario$ = new BehaviorSubject<Usuario | null>(this.recuperarSessao());

  /** Observable do usuário logado (null = não autenticado) */
  usuario$ = this._usuario$.asObservable();

  constructor(private router: Router) {}

  get isLogado(): boolean {
    return this._usuario$.value !== null;
  }

  get usuarioAtual(): Usuario | null {
    return this._usuario$.value;
  }

  login(login: string, senha: string): boolean {
    const encontrado = USUARIOS.find(
      u => u.login === login.trim().toLowerCase() && u.senha === senha
    );
    if (!encontrado) return false;

    const usuario: Usuario = { nome: encontrado.nome, login: encontrado.login };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(usuario));
    this._usuario$.next(usuario);
    return true;
  }

  logout(): void {
    sessionStorage.removeItem(SESSION_KEY);
    this._usuario$.next(null);
    this.router.navigate(['/login']);
  }

  private recuperarSessao(): Usuario | null {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as Usuario) : null;
    } catch {
      return null;
    }
  }
}

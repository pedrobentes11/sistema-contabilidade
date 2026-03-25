import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Usuario {
  nome: string;
  login: string;
}

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
    const encontrado = environment.usuarios.find(
      (u: { login: string; senha: string }) =>
        u.login === login.trim().toLowerCase() && u.senha === senha
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

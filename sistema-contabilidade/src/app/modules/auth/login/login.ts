import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  form: FormGroup;
  erro = '';
  senhaVisivel = false;
  carregando = false;
  ano = new Date().getFullYear();

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    // Se já logado, redireciona direto
    if (this.auth.isLogado) this.router.navigate(['/dashboard']);

    this.form = this.fb.group({
      login: ['', [Validators.required]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  entrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.carregando = true;
    this.erro = '';

    const { login, senha } = this.form.value;

    // Pequeno delay para dar sensação de validação
    setTimeout(() => {
      const ok = this.auth.login(login, senha);
      this.carregando = false;
      if (ok) {
        this.router.navigate(['/dashboard']);
      } else {
        this.erro = 'Usuário ou senha incorretos.';
        this.form.get('senha')?.reset();
      }
    }, 600);
  }
}

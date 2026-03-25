import { Component } from '@angular/core';
import { AuthService } from './core/services/auth';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.scss'
})
export class App {
  title = 'ContaFácil - Sistema Contábil';

  constructor(public auth: AuthService) {}
}

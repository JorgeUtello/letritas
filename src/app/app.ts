import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LetritasComponent } from './letritas/letritas.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LetritasComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'letritas';
}

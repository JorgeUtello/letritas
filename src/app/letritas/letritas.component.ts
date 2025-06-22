import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
	selector: 'app-letritas',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './letritas.component.html',
	styleUrls: ['./letritas.component.css'],
})
export class LetritasComponent {
	public word = '';
	public wordLength: number = 5;
	public loading = false;
	guessArray: string[] = [];
	message = '';
	gameOver = false;
	attempts = 0;
	selectedInput = 0;
	attemptsList: string[] = [];
	keyStatus: { [key: string]: 'none' | 'correct' | 'present' | 'absent' } = {};
	keyboardRows: string[][] = [];
	public showLengthInput = false;

	constructor(private http: HttpClient) {
		// Inicializar guessArray con 3 recuadros vacíos desde el inicio
		this.guessArray = Array(this.wordLength).fill('');
		this.setKeyboardRows();
		this.fetchWord();
	}

	private setKeyboardRows() {
		// Teclado tipo QWERTY, 3 filas, 10 letras la primera, 10 la segunda, 9 la tercera (incluyendo la Ñ)
		const row1 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
		const row2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'];
		const row3 = ['Z', 'X', 'C', 'V', 'B', 'N', 'M'];
		this.keyboardRows = [row1, row2, row3];
	}

	private setKeyboardRowsMobile() {
		// Teclado tipo QWERTY, 3 filas, 10 letras la primera, 10 la segunda, 9 la tercera (incluyendo la Ñ)
		const row1 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
		const row2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'];
		const row3 = ['Z', 'X', 'C', 'V', 'B', 'N', 'M'];
		this.keyboardRows = [row1, row2, row3];
	}

	async fetchWord(length: number = this.wordLength) {
		this.loading = true;
		this.message = '';
		this.tryFetchWord(length);
	}

	private tryFetchWord(length: number) {
		this.http.get<{ word: string }>(`https://api-letritas.vercel.app/api/random-word?length=${length}`).subscribe({
			next: (data) => {
				if (data.word && data.word.length > 0) {
					this.word = data.word.toUpperCase();
					this.guessArray = Array(this.word.length).fill('');
					this.selectedInput = 0;
					this.loading = false;
					this.message = '';
					console.log('Palabra elegida:', this.word);
				} else {
					this.handleWordNotFound(length);
				}
			},
			error: () => {
				this.handleWordNotFound(length);
			},
		});
	}

	private handleWordNotFound(length: number) {
		if (length > 1) {
			this.message = `No se encontró palabra de ${length} letras. Intentando con ${length - 1}...`;
			this.tryFetchWord(length - 1);
		} else {
			this.loading = false;
			this.message = 'No se encontró ninguna palabra disponible.';
		}
	}

	getRandomWord(): string {
		const palabras = [
			'PERRO',
			'GATOS',
			'SALUD',
			'FELIZ',
			'NIEVE',
			'LIMON',
			'RATON',
			'PLAZA',
			'BESOS',
			'JUEGO',
			'LUCES',
			'NADAR',
			'TIGRE',
			'VOLAR',
			'ZORRO',
			'MANGO',
			'PIANO',
			'QUESO',
			'ROCAS',
			'SILLA',
		];
		const random = Math.floor(Math.random() * palabras.length);
		return palabras[random];
	}

	getBgColor(i: number): string {
		// Nunca mostrar colores en los inputs
		return '#fff';
	}

	onInput(i: number, event: any) {
		this.selectedInput = i;
		// Autocompletar con la letra ya puesta si viene del teclado virtual
		let value = event.target.value.toUpperCase();
		if (value.length > 1) {
			value = value.slice(-1);
			event.target.value = value;
		}
		this.guessArray[i] = value;
		if (value && i < this.word.length - 1) {
			const next = event.target.parentElement.children[i + 1];
			if (next) next.focus();
		}
	}

	onVirtualKey(letter: string) {
		this.guessArray[this.selectedInput] = letter;
		// Mover al siguiente input automáticamente
		if (this.selectedInput < this.word.length - 1) {
			this.selectedInput++;
			setTimeout(() => {
				const inputs = document.querySelectorAll('.inputs input');
				if (inputs[this.selectedInput])
					(inputs[this.selectedInput] as HTMLInputElement).focus();
			});
		}
	}

	onDeleteKey() {
		// Borra la letra del input seleccionado o el anterior si está vacío
		if (this.selectedInput > 0 && !this.guessArray[this.selectedInput]) {
			this.selectedInput--;
		}
		this.guessArray[this.selectedInput] = '';
		setTimeout(() => {
			const inputs = document.querySelectorAll('.inputs input');
			if (inputs[this.selectedInput])
				(inputs[this.selectedInput] as HTMLInputElement).focus();
		});
	}

	checkGuess() {
		if (this.guessArray.some((l) => !l)) {
			this.message = 'Completa la palabra.';
			return;
		}
		const guess = this.guessArray.join('').toUpperCase();
		// Si la palabra es igual, gana directamente
		if (guess === this.word) {
			this.attempts++;
			this.attemptsList.push(guess);
			for (let i = 0; i < this.word.length; i++) {
				const letter = guess[i];
				this.keyStatus[letter] = letter === this.word[i] ? 'correct' : (this.word.includes(letter) ? 'present' : 'absent');
			}
			this.message = `¡Correcto! Lo lograste en ${this.attempts} intento(s).`;
			this.gameOver = true;
			return;
		}
		// Si no es igual, verifica si existe
		const guessLower = guess.toLowerCase();
		this.http.get<{ exists: boolean }>(`https://api-letritas.vercel.app/api/random-word?word=${guessLower}`).subscribe({
			next: (res) => {

				if (!res.exists) {
					this.message = 'La palabra no existe';
					this.shakeInputs();
					return;
				}
				// Si existe, apila la palabra y marca las letras
				this.attempts++;
				this.attemptsList.push(guess);
				for (let i = 0; i < this.word.length; i++) {
					const letter = guess[i];
					this.keyStatus[letter] = letter === this.word[i] ? 'correct' : (this.word.includes(letter) ? 'present' : 'absent');
				}
				if (this.attempts >= 6) {
					this.message = `Perdiste. La palabra era: ${this.word}`;
					this.gameOver = true;
				} else {
					this.message = 'Intenta de nuevo.';
					this.guessArray = Array(this.word.length).fill('');
					this.selectedInput = 0;
					setTimeout(() => {
						const inputs = document.querySelectorAll('.inputs input');
						if (inputs[0]) (inputs[0] as HTMLInputElement).focus();
					});
				}
			},
			error: () => {
				this.message = 'Error al verificar la palabra.';
				this.shakeInputs();
			},
		});
	}

	// Nuevo método para continuar el flujo normal si la palabra existe
	proceedGuess(guess: string) {
		this.attempts++;
		this.attemptsList.push(guess);
		// Actualizar estado de teclas
		for (let i = 0; i < this.word.length; i++) {
			const letter = guess[i];
			if (letter === this.word[i]) {
				this.keyStatus[letter] = 'correct';
			} else if (this.word.includes(letter)) {
				if (this.keyStatus[letter] !== 'correct')
					this.keyStatus[letter] = 'present';
			} else {
				this.keyStatus[letter] = 'absent';
			}
		}
		if (guess === this.word) {
			this.message = `¡Correcto! Lo lograste en ${this.attempts} intento(s).`;
			this.gameOver = true;
		} else {
			this.message = 'Intenta de nuevo.';
			if (this.attempts >= 6) {
				this.message = `Perdiste. La palabra era: ${this.word}`;
				this.gameOver = true;
			}
			// Limpiar los campos para el siguiente intento
			this.guessArray = Array(this.word.length).fill('');
			this.selectedInput = 0;
			setTimeout(() => {
				const inputs = document.querySelectorAll('.inputs input');
				if (inputs[0]) (inputs[0] as HTMLInputElement).focus();
			});
		}
	}

	// Método para animar el shake en los inputs
	shakeInputs() {
		const inputs = document.querySelectorAll('.inputs input');
		inputs.forEach((input) => {
			input.classList.add('shake');
			setTimeout(() => input.classList.remove('shake'), 500);
		});
	}

	getKeyClass(key: string): string {
		switch (this.keyStatus[key]) {
			case 'correct':
				return 'key-correct';
			case 'present':
				return 'key-present';
			case 'absent':
				return 'key-absent';
			default:
				return '';
		}
	}

	reset() {
		this.guessArray = Array(this.word.length).fill('');
		this.message = '';
		this.gameOver = false;
		this.attempts = 0;
		this.keyStatus = {};
		this.attemptsList = [];
	}

	giveUp() {
		this.message = `La palabra era: ${this.word}`;
		this.gameOver = true;
	}

	reloadPage() {
		window.location.reload();
	}
}

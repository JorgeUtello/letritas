import { Component, ChangeDetectorRef } from '@angular/core';
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
	public timer = 0; // en décimas de segundo
	public timerVisible = true;
	private timerInterval: any;
	public isTimerRunning = false;
	public showWordLengthPopup = false;
	public showRulesPopup = false;
	darkMode = false;

	constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {
		// Inicializar guessArray con 5 recuadros vacíos desde el inicio
		this.guessArray = Array(this.wordLength).fill('');
		this.setKeyboardRows();
		this.fetchWord();
	}

	ngOnInit() {
		this.resetTimer();
		// Restaurar modo oscuro desde cookie
		const dark = this.getCookie('letritas-dark');
		if (dark === '1') {
			this.darkMode = true;
			document.body.classList.add('dark-mode');
		}
		// Restaurar cantidad de letras desde cookie
		const letras = this.getCookie('letritas-length');
		if (letras && !isNaN(+letras)) {
			this.wordLength = +letras;
		}
	}

	private setKeyboardRows() {
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
					// console.log('Palabra elegida:', this.word);
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
		if (!this.isTimerRunning && this.timer === 0) {
			this.startTimer();
		}
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
		if (!this.isTimerRunning && this.timer === 0) {
			this.startTimer();
		}
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

	resetTimer() {
		this.stopTimer();
		this.timer = 0;
		this.isTimerRunning = false;
		this.timerVisible = true;
	}

	startTimer() {
		if (this.isTimerRunning) return;
		this.isTimerRunning = true;
		this.timerInterval = setInterval(() => {
			this.timer++;
			this.cdr.detectChanges();
		}, 100);
	}

	stopTimer() {
		if (this.timerInterval) {
			clearInterval(this.timerInterval);
			this.timerInterval = null;
		}
		this.isTimerRunning = false;
	}

	get timerFormatted(): string {
		const totalDecimas = this.timer;
		const minutes = Math.floor(totalDecimas / 600);
		const seconds = Math.floor((totalDecimas % 600) / 10);
		const decimas = totalDecimas % 10;
		return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${decimas}`;
	}

	checkGuess() {
		// Si el usuario cambió la cantidad de letras, actualiza los inputs antes de validar
		if (this.guessArray.length !== this.wordLength) {
			this.guessArray = Array(this.wordLength).fill('');
			this.selectedInput = 0;
			this.message = '';
			return;
		}
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
			this.stopTimer();
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
					this.stopTimer();
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
		this.fetchWord();
		this.guessArray = Array(this.word.length).fill('');
		this.message = '';
		this.gameOver = false;
		this.attempts = 0;
		this.keyStatus = {};
		this.attemptsList = [];
		this.resetTimer();
	}

	giveUp() {
		this.message = `La palabra era: ${this.word}`;
		this.gameOver = true;
		this.stopTimer();
	}

	reloadPage() {
		window.location.reload();
	}

	openWordLengthPopup() {
		this.showWordLengthPopup = true;
	}

	closeWordLengthPopup() {
		this.showWordLengthPopup = false;
	}

	onWordLengthChange() {
		this.fetchWord(this.wordLength);
		this.closeWordLengthPopup();
	}

	onLengthConfirm() {
		this.showWordLengthPopup = false;
	}

	applyWordLength() {
		console.log(this.wordLength)
		this.setCookie('letritas-length', String(this.wordLength));
		this.showWordLengthPopup = false;
		this.reset(); // Reinicia el juego con la nueva cantidad de letras
		this.guessArray = Array(this.wordLength).fill('');
	}

	// Alterna el modo oscuro y guarda preferencia en cookie
	toggleDarkMode() {
		this.darkMode = !this.darkMode;
		setTimeout(() => {
			if (this.darkMode) {
				document.body.classList.add('dark-mode');
				this.setCookie('letritas-dark', '1');
			} else {
				document.body.classList.remove('dark-mode');
				this.setCookie('letritas-dark', '0');
			}
		}, 0);
	}

	setCookie(name: string, value: string) {
		const d = new Date();
		d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000)); // 365 días
		const expires = "expires=" + d.toUTCString();
		document.cookie = `${name}=${value};${expires};path=/`;
	}

	getCookie(name: string): string | null {
		const v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
		return v ? v[2] : null;
	}
}

import { Component, computed, inject, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { interval, map, Observable } from 'rxjs';
import { LoggerService } from './logger.service';

@Component({
  selector: 'app-counter',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './counter.component.html'
})
export class CounterComponent {
  private readonly logger = inject(LoggerService);

  readonly count = signal(0);
  readonly double = computed(() => this.count() * 2);
  readonly seconds$: Observable<number> = interval(1000).pipe(map((n) => n + 1));

  increment(): void {
    this.count.update((n) => n + 1);
    this.logger.log(`count = ${this.count()}`);
  }

  decrement(): void {
    this.count.update((n) => n - 1);
    this.logger.log(`count = ${this.count()}`);
  }
}

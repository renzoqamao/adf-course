/// <reference types="jasmine" />
import { TestBed } from '@angular/core/testing';
import { CounterComponent } from './counter.component';

describe('CounterComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CounterComponent]   // standalone → va en `imports`
    });
  });

  it('incrementa y nunca baja de 0', () => {
    const fixture = TestBed.createComponent(CounterComponent);
    const c = fixture.componentInstance;

    c.increment();
    expect(c.count()).toBe(1);
    expect(c.double()).toBe(2);

    c.decrement();
    expect(c.count()).toBe(0);
  });
});

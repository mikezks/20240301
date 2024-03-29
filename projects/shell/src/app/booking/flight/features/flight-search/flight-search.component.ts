import { CommonModule } from '@angular/common';
import { Component, computed, effect, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { patchState, signalState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap } from 'rxjs';
import { ticketActions } from '../../+state/actions';
import { injectTicketsFacade } from '../../+state/ngrx-store';
import { Flight } from '../../logic/model/flight';
import { FlightFilter } from '../../logic/model/flight-filter';
import { FlightCardComponent } from '../../ui/flight-card/flight-card.component';
import { FlightFilterComponent } from '../../ui/flight-filter/flight-filter.component';


@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FlightCardComponent,
    FlightFilterComponent
  ],
  selector: 'app-flight-search',
  templateUrl: './flight-search.component.html',
})
export class FlightSearchComponent {
  private ticketFacade = injectTicketsFacade();

  from = signal('Hamburg');
  to = signal('Graz');
  flights = signal<Flight[]>([]);
  flightRoute = computed(
    () => 'From ' + this.from() + ' to ' + this.to() + '.'
  );


  protected localState = signalState({
    filter: {
      from: 'Hamburg',
      to: 'Graz',
      urgent: false
    },
    basket: {
      3: true,
      5: true
    } as Record<number, boolean>,
    flights: [] as Flight[]
  });

  constructor() {
    this.connectInitialLogic();

    effect(() => {
      const from = this.from();
      untracked(() => {

        console.log(from, this.to())
      });
    });

    this.from.set('Madrid');
    this.to.set('Oslo');

    this.from.set('Barcelona');
    this.from.set('Rom');
    this.from.set('London');


  }

  private connectInitialLogic(): void {
    // Conntect local and global State Management
    rxMethod<Flight[]>(pipe(
      tap(flights => patchState(this.localState, { flights }))
    ))(this.ticketFacade.flights);
  }

  protected search(filter: FlightFilter): void {
    patchState(this.localState, { filter });

    this.localState.filter.urgent()

    if (!this.localState.filter.from() || !this.localState.filter.to()) {
      return;
    }

    this.ticketFacade.search(
      this.localState.filter.from(),
      this.localState.filter.to()
    );
  }

  protected select(id: number, selected: boolean): void {
    patchState(this.localState, state => ({
      basket: {
        ...state.basket,
        [id]: selected
      }
    }));
  }

  protected delay(flight: Flight): void {
    const oldFlight = flight;
    const oldDate = new Date(oldFlight.date);

    const newDate = new Date(oldDate.getTime() + 1000 * 60 * 5); // Add 5 min
    const newFlight = {
      ...oldFlight,
      date: newDate.toISOString(),
      delayed: true
    };

    this.ticketFacade.update(newFlight);
  }

  protected reset(): void {
    this.ticketFacade.clear();
  }
}

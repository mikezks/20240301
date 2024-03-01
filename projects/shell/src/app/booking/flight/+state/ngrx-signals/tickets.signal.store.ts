import { computed, inject } from '@angular/core';
import { reduxMethod } from '@angular-architects/ngrx-toolkit';
import { patchState, signalStore, type, withComputed, withMethods } from '@ngrx/signals';
import { removeAllEntities, setAllEntities, updateEntity, withEntities } from '@ngrx/signals/entities';
import { map, pipe, switchMap } from 'rxjs';
import { FlightFilter } from '../../logic/model/flight-filter';
import { FlightService } from './../../logic/data-access/flight.service';
import { Flight } from './../../logic/model/flight';


export const TicketStore = signalStore(
  { providedIn: 'root' },
  // State
  withEntities({ entity: type<Flight>(), collection: 'flight' }),
  withEntities({ entity: type<number>(), collection: 'hide' }),
  // Selectors
  withComputed(({ flightEntities, hideEntities }) => ({
    filteredFlights: computed(() => flightEntities()
      .filter(flight => !hideEntities().includes(flight.id))),
    flightCount: computed(() => flightEntities().length),
  })),
  // Updater
  withMethods(store => ({
    setFlights: (state: { flights: Flight[] }) => patchState(store,
      setAllEntities(state.flights, { collection: 'flight' })),
    updateFlight: (state: { flight: Flight }) => patchState(store,
      updateEntity({ id: state.flight.id, changes: state.flight }, { collection: 'flight' })),
    clearFlights: () => patchState(store,
      removeAllEntities({ collection: 'flight' })),
  })),
  // Effects
  withMethods((store, flightService = inject(FlightService)) => ({
    loadFlights: reduxMethod<FlightFilter, { flights: Flight[] }>(pipe(
      switchMap(filter => flightService.find(filter.from, filter.to, filter.urgent)),
      map(flights => ({ flights })),
    ), store.setFlights),
  })),
);

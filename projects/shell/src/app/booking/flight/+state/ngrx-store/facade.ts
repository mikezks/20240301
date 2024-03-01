import { inject } from "@angular/core"
import { Store } from "@ngrx/store"
import { ticketActions } from "../actions";
import { ticketFeature } from "./reducer";
import { Flight } from "../../logic/model/flight";


export function injectTicketsFacade() {
  const store = inject(Store);

  return {
    flights: store.selectSignal(ticketFeature.selectFlights),
    search: (from: string, to: string, urgent = false) => {
      store.dispatch(ticketActions.flightsLoad({ from, to, urgent }))
    },
    update: (flight: Flight) => {
      store.dispatch(ticketActions.flightUpdate({ flight }))
    },
    clear: () => {
      store.dispatch(ticketActions.flightsClear())
    }
  };
}

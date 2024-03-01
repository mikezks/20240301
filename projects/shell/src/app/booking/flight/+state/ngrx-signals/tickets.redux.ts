import { createReduxState, withActionMappers, mapAction } from "@angular-architects/ngrx-toolkit";
import { ticketActions } from "../actions";
import { TicketStore } from "./tickets.signal.store";


export const { provideTicketStore, injectTicketStore } =
  /**
   * Redux
   *  - Provider
   *  - Injectable Store
   *  - Action to Method Mapper
   *  - Selector Signals
   *  - Dispatch
   */
  createReduxState('ticket', TicketStore, store => withActionMappers(
    mapAction(ticketActions.flightsLoad, store.loadFlights, ticketActions.flightsLoaded),
    mapAction(ticketActions.flightsLoaded, ticketActions.flightsLoadedByPassenger, store.setFlights),
    mapAction(ticketActions.flightUpdate, store.updateFlight),
    mapAction(ticketActions.flightsClear, store.clearFlights),
  )
);

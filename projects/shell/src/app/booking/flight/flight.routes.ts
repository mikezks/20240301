import { Routes } from "@angular/router";
import { provideEffects } from "@ngrx/effects";
import { provideState } from "@ngrx/store";
import { TicketEffects } from "./+state/ngrx-store/effects";
import { ticketFeature } from "./+state/ngrx-store/reducer";
import { FlightBookingComponent } from "./features/flight-booking/flight-booking.component";
import { FlightEditComponent } from "./features/flight-edit/flight-edit.component";
import { FlightSearchComponent } from "./features/flight-search/flight-search.component";
import { FlightTypeaheadComponent } from "./features/flight-typeahead/flight-typeahead.component";
import { flightsResolverConfig } from "./logic/data-access/flight.resolver";
import { provideLazyStateHydration } from "../../shared/+state/hydration.feature";


export const FLIGHT_ROUTES: Routes = [
  {
    path: '',
    component: FlightBookingComponent,
    providers: [
      provideState(ticketFeature),
      provideEffects([TicketEffects]),
      provideLazyStateHydration(),
      // provideTicketStore(isDevMode())
    ],
    children: [
      {
        path: '',
        redirectTo: 'search',
        pathMatch: 'full'
      },
      {
        path: 'search',
        component: FlightSearchComponent,
      },
      {
        path: 'edit/:id',
        component: FlightEditComponent,
        resolve: flightsResolverConfig
      },
      {
        path: 'typeahead',
        component: FlightTypeaheadComponent,
      },
    ]
  }
];

export default FLIGHT_ROUTES;

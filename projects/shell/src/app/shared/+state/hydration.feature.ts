import { ENVIRONMENT_INITIALIZER, EnvironmentProviders, InjectionToken, inject, makeEnvironmentProviders } from "@angular/core";
import { Actions, concatLatestFrom, createEffect, ofType, provideEffects } from "@ngrx/effects";
import { Action, ActionReducer, META_REDUCERS, Store, createActionGroup, emptyProps, props, provideState } from "@ngrx/store";
import { distinctUntilChanged, map, of, pipe, switchMap, tap } from "rxjs";


export type HydrationConfig = {
  hydrationKey: string;
  routerStateKey: string;
};

export const DEFAULT_HYDRATION_CONFIG: HydrationConfig = {
  hydrationKey: 'ngrxGlobalState',
  routerStateKey: 'router'
};

export type RootState = Record<string, unknown>;

export const GLOBAL_STATE_HYDRATION_CONFIG = new InjectionToken<HydrationConfig>(
  'GLOBAL_STATE_HYDRATION_CONFIG'
  );

let hydratedState: RootState = {};

export const hydrationActions = createActionGroup({
  source: 'Hydration Manager',
  events: {
    'Persist to Storage triggered': emptyProps(),
    'Hydration triggered': emptyProps(),
    'Lazy Hydration triggered': emptyProps(),
    'Hydration successful': props<{ state: RootState }>(),
    'Hydration failed': emptyProps(),
    'Reset State': emptyProps()
  }
});

function isHydrationSuccessful(
  action: Action
): action is ReturnType<typeof hydrationActions.hydrationSuccessful> {
  return action.type === hydrationActions.hydrationSuccessful.type;
}

function preparePersistentState<T extends RootState, R extends string> (
  currentState: T,
  routerStateKey: R
): Omit<T, R> {
  const resultState = { ...currentState };
  delete resultState[routerStateKey];

  return resultState;
}

function patchRouterState<T extends RootState>(
  hydratedState: T,
  currentState: T,
  routerStateKey: string
): T {
  return {
    ...hydratedState,
    [routerStateKey]: currentState[routerStateKey]
  };
}

function hydrationMetaReducer<T extends RootState>(
  reducer: ActionReducer<T>
): ActionReducer<T> {
  return (state, action) => {
    if (isHydrationSuccessful(action)) {
      return action.state as T;
    } else {
      return reducer(state, action);
    }
  };
}

const init = createEffect(
  () => of(true).pipe(
    map(() => hydrationActions.hydrationTriggered())
  ), {
    functional: true
  }
);

const persist = createEffect(
  (
    actions$ = inject(Actions),
    state = inject(Store),
    config = inject(GLOBAL_STATE_HYDRATION_CONFIG),
  ) => actions$.pipe(
    ofType(
      hydrationActions.hydrationSuccessful,
      hydrationActions.hydrationFailed
    ),
    switchMap(() => state),
    distinctUntilChanged(),
    tap((state: RootState) => localStorage.setItem(
      config.hydrationKey,
      JSON.stringify(preparePersistentState({
        ...hydratedState,
        ...state
      }, config.routerStateKey))
    ))
  ), {
    functional: true,
    dispatch: false
  }
);

const hydrate = createEffect(
  (
    actions$ = inject(Actions),
    state = inject(Store),
    config = inject(GLOBAL_STATE_HYDRATION_CONFIG),
  ) => actions$.pipe(
    ofType(hydrationActions.hydrationTriggered),
    concatLatestFrom(() => state),
    map(([, currentState]: [unknown, RootState]) => {
      const stateStr = localStorage.getItem(config.hydrationKey);

      if (stateStr) {
        try {
          hydratedState = JSON.parse(stateStr);

          return hydrationActions.hydrationSuccessful({
            state: patchRouterState(hydratedState, currentState, config.routerStateKey)
          });
        } catch {
          localStorage.removeItem(config.hydrationKey);
        }
      }

      return hydrationActions.hydrationFailed();
    })
  ), {
    functional: true
  }
);

const lazyHydrate = createEffect(
  (
    actions$ = inject(Actions),
    state = inject(Store),
    config = inject(GLOBAL_STATE_HYDRATION_CONFIG),
  ) => actions$.pipe(
    ofType(hydrationActions.lazyHydrationTriggered),
    concatLatestFrom(() => state),
    map(([, currentState]: [unknown, RootState]) => {
      try {
        return hydrationActions.hydrationSuccessful({
          state: patchRouterState(hydratedState, currentState, config.routerStateKey)
        });
      } catch {
        localStorage.removeItem(config.hydrationKey);
      }

      return hydrationActions.hydrationFailed();
    })
  ), {
    functional: true
  }
);

const hydrationEffects = { persist, hydrate, lazyHydrate, init };


export function provideStateHydrationFeature(
  config: Partial<HydrationConfig> = DEFAULT_HYDRATION_CONFIG
): EnvironmentProviders {
  const hydrationConfig = {
    ...DEFAULT_HYDRATION_CONFIG,
    ...config
  };

  return makeEnvironmentProviders([
    {
      provide: GLOBAL_STATE_HYDRATION_CONFIG,
      useValue: hydrationConfig
    },
    {
      provide: META_REDUCERS,
      useValue: hydrationMetaReducer,
      multi: true,
    },
    provideEffects([hydrationEffects])
  ])
}

export function provideLazyStateHydration(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useFactory: (store = inject(Store)) => () => store.dispatch(
        hydrationActions.lazyHydrationTriggered()
      )
    }
  ]);
}

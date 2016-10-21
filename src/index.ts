import {Action as ReduxAction} from "redux";

declare var process: { env: { NODE_ENV: string } | undefined};

const isDev = (process && process.env && process.env.NODE_ENV) != 'production'

export interface Action<P> extends ReduxAction {
  type: string;
  payload: P;
  error?: boolean;
  meta?: Object;
}

export function isType<P>(
  action: ReduxAction,
  actionCreator: ActionCreator<P, P>
): action is Action<P> {
  return action.type === actionCreator.type;
}

export function isError<P, E extends Error>(action: Action<P | E>): action is Action<E> {
  return action.error
}

export interface ActionCreator<T, P> {
  type: string;
  (payload: T, meta?: Object): Action<P>;
}

export interface DoneAction<P, R> {
  params: P;
  result: R;
}

export interface FailedAction<P, E> {
  params: P;
  error: E;
}

export interface CompletedAction<P, D> {
  params: P;
  data: D;
}

export interface AsyncActionCreators<P, R, E> {
  type: string;
  started: ActionCreator<P, P>;
  done: ActionCreator<DoneAction<P, R>, DoneAction<P, R>>;
  failed: ActionCreator<FailedAction<P, E>, FailedAction<P, E>>;
  complete: (payload?: CompletedAction<P, R | E>, meta?: Object) => Action<DoneAction<P, R> | FailedAction<P, E>>;
}

export interface ActionCreatorFactory {
  <P>(type: string, commonMeta?: Object, error?: boolean): ActionCreator<P, P>;

  async<P, S, E>(type: string, commonMeta?: Object): AsyncActionCreators<P, S, E>;
}

export function actionCreatorFactory(prefix?: string):
ActionCreatorFactory {

  const actionTypes = {};
  const base = prefix ? `${prefix}/` : ""

  function baseActionCreator<P>(isError: (payload: P) => boolean, type: string, commonMeta?: Object): ActionCreator<P, P> {
                      
    const fullType = `${base}${type}`

    if (isDev) {
      if (actionTypes[fullType])
        throw new Error(`Duplicate action type: ${fullType}`);

      actionTypes[fullType] = true;
    }

    return Object.assign(
      (payload: P, meta?: Object) => {
        return {
          type: fullType,
          payload,
          meta: Object.assign({}, commonMeta, meta),
          error: isError(payload)
        };
      },
      {type: fullType}
    );
  }

  
  const actionCreator = <P, E extends (Error | void)>(type: string, commonMeta?: Object) =>
    baseActionCreator<P | E>(p => typeof p === "Error", type, commonMeta)

  const actionCreator2 = <P>(type: string, error: boolean, commonMeta?: Object) =>
    baseActionCreator<P>(() => error, type, commonMeta)

  function asyncActionCreators<P, S, E>(
    type: string, commonMeta?: Object
  ): AsyncActionCreators<P, S, E> {
    const done = actionCreator2<DoneAction<P, S>>(`${type}_DONE`, false, commonMeta)
    
    const failed = actionCreator2<FailedAction<P, E>>(`${type}_FAILED`, true, commonMeta)
    
    // Calls done or failed depending on payload type
    // Don't use unless E extends Error
    const complete = (payload: CompletedAction<P, S | E>, meta?: Object): Action<DoneAction<P, S> | FailedAction<P, E>> => {
      const isError = typeof payload.data === "Error" // Use temp variable to avoid never type in if else
      if (isError) {
        return failed({
          params: payload.params,
          error: payload.data as E,
        }, meta)
      } else {
        return done({
          params: payload.params,
          result: payload.data as S,
        }, meta)
      }
    }
    

    return {
      type: prefix ? `${prefix}/${type}` : type,
      started: actionCreator2<P>(`${type}_STARTED`, false, commonMeta),
      done,
      failed,
      complete,
    };
  }

  return Object.assign(actionCreator, {async: asyncActionCreators});
}

export default actionCreatorFactory()

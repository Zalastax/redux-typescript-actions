import { Action as ReduxAction } from "redux";
export interface Action<P> extends ReduxAction {
    type: string;
    payload: P;
    error?: boolean;
    meta?: Object;
}
export declare function isType<P>(action: ReduxAction, actionCreator: ActionCreator<P, P>): action is Action<P>;
export declare function isError<P, E extends Error>(action: Action<P | E>): action is Action<E>;
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
export declare function actionCreatorFactory(prefix?: string): ActionCreatorFactory;
declare var _default: ActionCreatorFactory;
export default _default;

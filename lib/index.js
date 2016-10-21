"use strict";
var isDev = (process && process.env && process.env.NODE_ENV) != 'production';
function isType(action, actionCreator) {
    return action.type === actionCreator.type;
}
exports.isType = isType;
function isError(action) {
    return action.error;
}
exports.isError = isError;
function actionCreatorFactory(prefix) {
    var actionTypes = {};
    var base = prefix ? prefix + "/" : "";
    function baseActionCreator(isError, type, commonMeta) {
        var fullType = "" + base + type;
        if (isDev) {
            if (actionTypes[fullType])
                throw new Error("Duplicate action type: " + fullType);
            actionTypes[fullType] = true;
        }
        return Object.assign(function (payload, meta) {
            return {
                type: fullType,
                payload: payload,
                meta: Object.assign({}, commonMeta, meta),
                error: isError(payload)
            };
        }, { type: fullType });
    }
    var actionCreator = function (type, commonMeta) {
        return baseActionCreator(function (p) { return typeof p === "Error"; }, type, commonMeta);
    };
    var actionCreator2 = function (type, error, commonMeta) {
        return baseActionCreator(function () { return error; }, type, commonMeta);
    };
    function asyncActionCreators(type, commonMeta) {
        var done = actionCreator2(type + "_DONE", false, commonMeta);
        var failed = actionCreator2(type + "_FAILED", true, commonMeta);
        // Calls done or failed depending on payload type
        // Don't use unless E extends Error
        var complete = function (payload, meta) {
            var isError = typeof payload.data === "Error"; // Use temp variable to avoid never type in if else
            if (isError) {
                return failed({
                    params: payload.params,
                    error: payload.data,
                }, meta);
            }
            else {
                return done({
                    params: payload.params,
                    result: payload.data,
                }, meta);
            }
        };
        return {
            type: prefix ? prefix + "/" + type : type,
            started: actionCreator2(type + "_STARTED", false, commonMeta),
            done: done,
            failed: failed,
            complete: complete,
        };
    }
    return Object.assign(actionCreator, { async: asyncActionCreators });
}
exports.actionCreatorFactory = actionCreatorFactory;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = actionCreatorFactory();

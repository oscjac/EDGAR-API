"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAgentError = void 0;
class UserAgentError extends Error {
    constructor(message) {
        super(message);
        this.name = "UserAgentError";
    }
}
exports.UserAgentError = UserAgentError;

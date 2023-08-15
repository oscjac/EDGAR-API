export class UserAgentError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = "UserAgentError";
    }
}
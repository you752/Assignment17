"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Resolver {
    constructor() { }
    hellowres(parent, args) {
        return `Hello, ${args.name || 'World'}! Your email is ${args.email || 'not provided'} and your password is ${args.password || 'not provided'}.`;
    }
}
const userResolver = new Resolver();
exports.default = userResolver;

import {describe, expect, test} from "@jest/globals";
import {Driver} from "../src"
import {SECError} from "../src/errors";

describe("Driver", () => {
    test("constructor", () => {
        const prev = process.env.USER_AGENT;
        delete process.env.USER_AGENT;
        expect(() => new Driver("test")).not.toThrow();
        if (prev !== undefined)
            process.env.USER_AGENT = prev;
    })
    test("constructor with user agent in env", () => {
        const prev = process.env.USER_AGENT;
        process.env.USER_AGENT = "test";
        expect(() => new Driver()).not.toThrow();
        delete process.env.USER_AGENT;
        if (prev !== undefined)
            process.env.USER_AGENT = prev;
    })
    test("constructor with no user agent throws error", () => {
        const prev = process.env.USER_AGENT;
        delete process.env.USER_AGENT;
        expect(() => new Driver()).toThrow();
        if (prev !== undefined)
            process.env.USER_AGENT = prev;
    })
    describe("submissions", () => {
        test("should throw error on invalid cik", () => {
            expect.assertions(1)
            const driver = new Driver();
            return driver.submissions("100").catch(e => {
                expect(e).toBeInstanceOf(SECError);
            })
        })
    })
    describe("companyfacts", () => {
        test("should throw error on invalid cik", () => {
            expect.assertions(1)
            const driver = new Driver();
            return driver.companyFacts("100").catch(e => {
                expect(e).toBeInstanceOf(SECError);
            })
        })
    })
})

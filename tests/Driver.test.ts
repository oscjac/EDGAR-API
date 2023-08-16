import {describe, expect, test} from "@jest/globals";
import {Driver} from "../src"
import {SECError} from "../src/errors";

describe("Driver", () => {
    test("constructor", () => {
        const driver = new Driver("test");
        expect(driver).toBeInstanceOf(Driver);
    })
    test("constructor with user agent in env", () => {
        const prev = process.env.USER_AGENT;
        process.env.USER_AGENT = "test";
        const driver = new Driver();
        expect(driver).toBeInstanceOf(Driver);
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
            return driver.submissions("6200").catch(e => {
                expect(e).toBeInstanceOf(SECError);
            })
        })
    })
    describe("companyfacts", () => {
        test("should throw error on invalid cik", () => {
            expect.assertions(1)
            const driver = new Driver();
            return driver.companyFacts("6200").catch(e => {
                expect(e).toBeInstanceOf(SECError);
            })
        })
    })
})

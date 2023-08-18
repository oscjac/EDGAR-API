import {describe, expect, test} from "@jest/globals";
import Driver from "../src/index"
import {SECError} from "../src/errors";
import {CIK} from "../src/types";

describe("CIK", () => {
    describe("should throw error", () => {
        test("on non-numeric input", () => {
            expect(() => new CIK("test")).toThrow();
        })
        test("on input with length greater than 10", () => {
            expect(() => new CIK("10000000000")).toThrow();
        })
    })
    describe("toString", () => {
        test("should return CIK with leading zeroes", () => {
            expect(new CIK("100").toString()).toBe("CIK0000000100");
        })
    })
})

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
            return driver.submissions(new CIK("100")).catch(e => {
                expect(e).toBeInstanceOf(SECError);
            })
        })
    })
    describe("companyfacts", () => {
        test("should throw error on invalid cik", () => {
            expect.assertions(1)
            const driver = new Driver();
            return driver.companyFacts(new CIK("100")).catch(e => {
                expect(e).toBeInstanceOf(SECError);
            })
        })
    })
})

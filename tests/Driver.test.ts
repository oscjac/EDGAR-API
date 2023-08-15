import {describe, expect, test} from "@jest/globals";
import {Driver} from "../src"

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
        expect(() => new Driver()).toThrow();
    })
})

import {describe, expect, test} from "@jest/globals";
import Driver, {CIK} from "../src/index"
import {SECError} from "../src";
import {CompanyConceptUnit} from "../src";
import fetch from "node-fetch";
import {env} from "process";
import path from "path"
import fs from "fs"
import Filing from "../src/Filing";

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

        test("should return correct submissions", () => {
            const driver = new Driver();
            const appleCIK = new CIK("320193");
            expect.assertions(3)
            return driver.submissions(appleCIK).then(submissions => {
                expect(submissions.cik).toBe(appleCIK.toString(false));
                expect(submissions.filings.recent.primaryDocument).toHaveLength(1000);
                expect(submissions.filings.recent.isXBRL).toHaveLength(1000);
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

        test("should return correct company facts", () => {
            const driver = new Driver();
            const cik = 6201;
            expect.assertions(5)
            return driver.companyFacts(new CIK(cik.toString())).then(facts => {
                expect(facts.cik).toBe(cik);
                expect(Object.keys(facts.facts).length).toBe(3);
                if (facts.facts["us-gaap"] === undefined || facts.facts["dei"] === undefined ||
                    facts.facts["invest"] === undefined)
                    throw new Error("us-gaap, dei, or invest not found")
                expect(Object.keys(facts.facts["us-gaap"]).length).toBe(647);
                expect(Object.keys(facts.facts["dei"]).length).toBe(3);
                expect(Object.keys(facts.facts["invest"]).length).toBe(1);
            })
        })

    })
    describe("getCompanyConcept", () => {
        test("should throw error on invalid cik", () => {
            expect.assertions(1)
            const driver = new Driver();
            return driver.getCompanyConcept(new CIK("100"), "us-gaap", "Assets").catch(e => {
                expect(e).toBeInstanceOf(SECError);
            })
        })

        const driver = new Driver();

        test("should respect start parameter", () => {
            expect.assertions(3)
            return driver.getCompanyConcept(new CIK("6201"), "us-gaap",
                "AccountsPayableCurrent").then(concept => {
                const dataPoints = concept.getUnits(new Date("2023-04-01"))
                const usd = dataPoints["USD"] as CompanyConceptUnit[]
                expect(usd).not.toBe(undefined)
                expect(usd).toHaveLength(1)
                const correct = {
                    "end": "2023-06-30",
                    "val": 2406000000,
                    "accn": "0000006201-23-000070",
                    "fy": 2023,
                    "fp": "Q2",
                    "form": "10-Q",
                    "filed": "2023-07-20",
                    "frame": "CY2023Q2I"
                }
                expect(usd[0]).toEqual(correct)
            })
        })

        test("should respect end parameter", () => {
            expect.assertions(11)
            return driver.getCompanyConcept(new CIK("6201"), "us-gaap",
                "AccountsPayableCurrent").then(concept => {
                const dataPoints = concept.getUnits(undefined, new Date("2010-01-01"))
                const usd = dataPoints["USD"] as CompanyConceptUnit[]
                expect(usd).not.toBe(undefined)
                expect(usd).toHaveLength(3)
                for (const dataPoint of usd) {
                    expect(dataPoint.val).toBe(1064000000)
                    expect(dataPoint.fy).toBe(2010)
                    expect(dataPoint.end).toBe("2009-12-31")
                }
            })
        })

    })

    describe("frames", () => {

        const testFile = fs.readFileSync(path.join(__dirname, "frames2019Q1I.json"), "utf8")
        const testData = JSON.parse(testFile)

        test("should be correct", async () => {
            expect.assertions(1)
            const driver = new Driver();
            const concept = await driver.getCompanyConcept(new CIK("6201"), "us-gaap",
                "AccountsPayableCurrent");
            const frames = await driver.frames(concept, 2019, "Q1I", "USD");
            expect(frames).toStrictEqual(testData)
        })

        test("should use default values", async () => {
            expect.assertions(1)
            let year = new Date().getFullYear();
            let quarter = Math.floor(new Date().getMonth() / 3);
            if (quarter === 0) {
                year -= 1;
                quarter = 4;
            }
            const tag = "AccountsPayableCurrent";
            const taxonomy = "us-gaap";
            const unit = "USD"
            const url = new URL(`https://data.sec.gov/api/xbrl/frames/${taxonomy}/${tag}/${unit}/CY${year}Q${quarter}I.json`)
            const res = await fetch(url, {headers: {"User-Agent": env.USER_AGENT ?? ""}})
            const data = await res.json();
            const driver = new Driver();
            const concept = await driver.getCompanyConcept(new CIK("6201"), taxonomy, tag);
            const frames = await driver.frames(concept, unit);
            expect(frames).toStrictEqual(data);
        })

        test("should accept frame parameter", async () => {
            expect.assertions(1)
            const driver = new Driver();
            const concept = await driver.getCompanyConcept(new CIK("6201"), "us-gaap",
                "AccountsPayableCurrent");
            const frames = await driver.frames(concept, "CY2019Q1I", "USD");
            expect(frames).toStrictEqual(testData);
        })

        test("should accept year, quarter parameters", async () => {
            expect.assertions(1)
            const driver = new Driver();
            const concept = await driver.getCompanyConcept(new CIK("6201"), "us-gaap",
                "AccountsPayableCurrent");
            const frames = await driver.frames(concept, 2019, "Q1I", "USD");
            expect(frames).toStrictEqual(testData);
        })

    })

    describe("getFiling", () => {

        test("should return Filing Instance", async () => {
            expect.assertions(1);
            const driver = new Driver();
            const appleCIK = new CIK("320193");
            const accn = "0000320193-23-000077";
            const primarydoc = "aapl-20230701.htm"
            const submissions = await driver.submissions(appleCIK);
            const isXBRL = (_:any, i: number) => submissions.filings.recent.isXBRL[i] === 1
            submissions.filings.recent.primaryDocument.filter(isXBRL)
                .forEach(filing => console.log(filing))
            const filing = await driver.getFiling(appleCIK, accn, primarydoc);
            expect(filing).toBeInstanceOf(Filing);
        })
    })

})

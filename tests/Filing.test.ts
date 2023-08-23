import {describe, expect, test} from "@jest/globals";
import {DOMParser} from "xmldom";
import Filing from "../src/Filing";
import fs from "fs";
import path from "path";

describe("Filing", () => {

    describe("fromDocument", () => {

        const filePath = path.join(__dirname, "aapl-20230701_htm.xml");

        test("should accept file string", () => {
            const html = fs.readFileSync(filePath, "utf8");
            const filing = Filing.fromDocument(html);
            expect(filing).toBeInstanceOf(Filing);
        })

        test("should accept root element", () => {
            const html = fs.readFileSync(filePath, "utf8");
            const root = new DOMParser().parseFromString(html, "text/html");
            const filing = Filing.fromDocument(root.documentElement);
            expect(filing).toBeInstanceOf(Filing);
        })

    })

    describe("getFact", () => {

        test("should return null on fact not found", () => {
            const html = fs.readFileSync(path.join(__dirname, "aapl-20230701_htm.xml"), "utf8");
            const filing = Filing.fromDocument(html);
            expect(filing.getFact("test")).toBeNull();
        })

        test("should return fact on fact found", () => {
            const html = fs.readFileSync(path.join(__dirname, "aapl-20230701_htm.xml"), "utf8");
            const filing = Filing.fromDocument(html);
            expect(filing.getFact("us-gaap:AccountsPayableCurrent")).not.toBeNull();
        })

        test("should return fact on fact found by id", () => {
            const html = fs.readFileSync(path.join(__dirname, "aapl-20230701_htm.xml"), "utf8");
            const filing = Filing.fromDocument(html);
            const accountsPayableCurrent = filing.getFact(178);
            expect(accountsPayableCurrent).not.toBeNull();
            expect(accountsPayableCurrent?.tag).toBe("AccountsReceivableNetCurrent");
            expect(accountsPayableCurrent?.value).toBe(28184000000);
            expect(accountsPayableCurrent?.taxonomy).toBe("us-gaap");
        })

    })

})

import {describe, expect, test} from "@jest/globals";
import CIK from "../src/cik";
import {cikByName} from "../src/lookup";

describe("cikByName", () => {

    test("should return a correct results", async () => {
        const appleCIK = new CIK("0000320193");
        const entityName = "APPLE INC";
        const results = await cikByName(entityName);
        // Apple has two CIKs, so we expect two results
        expect(results).toEqual([
            {entityName: entityName + ".", cik: appleCIK},
            {entityName: entityName, cik: appleCIK}]);
    })

    test("should return an empty list on no results", async () => {
        const results = await cikByName("testStringThatShouldNotReturnAnyResults");
        expect(results).toEqual([]);
    })

    test("should return at most 100", async () => {
        const results = await cikByName("a");
        expect(results.length).toBeLessThanOrEqual(100);
    })

})


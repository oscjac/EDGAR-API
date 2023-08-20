import CIK from "./cik";
import fetch from "node-fetch";
import {DOMParser} from "xmldom";
import xpath from "xpath";

export interface LookupResult {
    entityName: string,
    cik: CIK,
}

/**
 * Lookup a CIK by entity name
 * @param name The name of the entity
 * @return A list of results
 */
export const cikByName = async (name: string): Promise<LookupResult[]> => {
    const out = new Array<LookupResult>();
    const url = new URL(`https://www.sec.gov/cgi-bin/cik_lookup?company=${name}`);
    const res = await fetch(url);
    const text = await res.text();
    const parser = new DOMParser({errorHandler: {warning: () => null}})
    const doc = parser.parseFromString(text, "text/xml")
    const expression = "/html/body/table/tr/td[2]/pre[2]/a" // Does not include tbody for some reason
    const nodes = xpath.select(expression, doc)
    if (Array.isArray(nodes)) {
        for (const node of nodes) {
            const cik = node.textContent as string
            const entityName = node.nextSibling?.textContent
                ?.trim() as string
            out.push({entityName, cik: new CIK(cik)})
        }
    }
    return out;
}

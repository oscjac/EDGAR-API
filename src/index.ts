import fetch, {Headers, Response} from "node-fetch";
import {env} from "process";
import {ForbiddenRequestError, SECError, UserAgentError} from "./errors";
import {URL} from "url";
import {
    isSubmissionResponseData,
    isCompanyConceptBody,
    isFrameResponseBody,
    isCompanyFactsResponse
} from "./guards";
import {CompanyFactsResponse, FrameResponseBody} from "./responses";
import CompanyConcept, {CompanyConceptUnit, Taxonomy, isTaxonomy} from "./CompanyConcept";
import CIK from "./cik";
import {cikByName, LookupResult} from "./lookup";
import {DOMParser} from "xmldom";
import Filing from "./Filing";

export {
    CompanyConcept, CompanyFactsResponse, FrameResponseBody, Taxonomy, CIK, LookupResult, UserAgentError,
    ForbiddenRequestError, SECError, CompanyConceptUnit, isTaxonomy
};

export type Quarter = `Q${1 | 2 | 3 | 4}${"I" | ""}`;

const isQuarter = (data: any): data is Quarter => {
    if (typeof data !== 'string')
        return false;
    return /^Q[1-4](I)?$/.test(data);
}

const toQuarter = (month: number | string | Quarter): Quarter => {
    if (isQuarter(month))
        return month;
    const monthNum = parseInt(month.toString(10));
    const n = Math.floor(monthNum / 3) + 1;
    if (n > 4 || n < 1)
        throw new Error("Invalid month");
    return `Q${n}I` as Quarter;
}

export default class Driver {
    private readonly headers: Headers;
    private conceptCache: Map<string, CompanyConcept>;

    constructor(userAgent?: string) {
        let userAgentVal = userAgent ?? env.USER_AGENT;
        if (userAgentVal === undefined || userAgentVal === "")
            throw new Error("User agent not provided in either constructor or environment variable");
        this.headers = new Headers({
            "User-Agent": userAgentVal,
            "Accept-Encoding": "gzip, deflate",
            "Host": "data.sec.gov"
        });
        this.conceptCache = new Map<string, CompanyConcept>();
    }

    private async handleError(res: Response, text: string): Promise<Error> {
        switch (res.status) {
            case 400:
                return new UserAgentError("Bad request");
            case 403:
                return new ForbiddenRequestError(text);
            case 404:
                return new SECError(text)
        }
        return new Error;
    }

    async submissions(cik: CIK) {
        const endpoint = new URL(`https://data.sec.gov/submissions/${cik.toString()}.json`);
        const res = await fetch(endpoint, {headers: this.headers});
        const text = await res.text();
        if (res.status !== 200)
            throw await this.handleError(res, text);
        const data = JSON.parse(text)
        if (!isSubmissionResponseData(data))
            throw await this.handleError(res, text);
        return data;
    }

    async getCompanyConcept(cik: CIK, taxonomy: Taxonomy, tag: string): Promise<CompanyConcept> {
        const cached = this.conceptCache.get(`${taxonomy}/${tag}`);
        if (cached !== undefined)
            return cached;
        const endpoint = new URL(`https://data.sec.gov/api/xbrl/companyconcept/${cik.toString()}/` +
            `${taxonomy}/${tag}.json`);
        const res = await fetch(endpoint, {headers: this.headers});
        const text = await res.text();
        if (res.status !== 200)
            throw await this.handleError(res, text);
        const data = JSON.parse(text);
        if (!isCompanyConceptBody(data))
            throw await this.handleError(res, text);
        this.conceptCache.set(`${taxonomy}/${tag}`, CompanyConcept.fromBody(data));
        return CompanyConcept.fromBody(data);
    }

    async companyFacts(cik: CIK): Promise<CompanyFactsResponse> {
        const endpoint = new URL(`https://data.sec.gov/api/xbrl/companyfacts/${cik.toString()}.json`);
        const res = await fetch(endpoint, {headers: this.headers});
        const text = await res.text();
        if (res.status !== 200)
            throw await this.handleError(res, text);
        const data = JSON.parse(text);
        if (data["facts"] === undefined)
            throw await this.handleError(res, text)
        if (!isCompanyFactsResponse(data))
            throw await this.handleError(res, text);
        return data;
    }

    private async getFilingBuffer(cik: CIK, accessionNumber: string, primaryDocument: string): Promise<Buffer> {
        if (!primaryDocument.endsWith(".htm"))
            throw new Error("Primary document must be an .htm file");
        // Parse accessionNumber
        let accn = ""
        for (const char of accessionNumber)
            if (char !== "-")
                accn += char;
        const doc = primaryDocument.replace(".", "_")
        const url = new URL(`
        https://www.sec.gov/Archives/edgar/data/${cik.toString(false)}/${accn}/${doc}.xml`);
        const headers = new Headers({
            "User-Agent": this.headers.get("User-Agent") ?? "",
            "Accept": "application/xml",
            "Host": url.hostname,
            "Accept-Encoding": "gzip, deflate"
        });
        const res = await fetch(url, {headers});
        if (res.status !== 200)
            throw await this.handleError(res, await res.text());
        return res.buffer();
    }

    /**
     * Gets a filing from the SEC endpoint
     * @param cik The CIK of the company
     * @param accessionNumber The accession number of the filing
     * @param primaryDocument The primary document of the filing
     */
    async getFiling(cik: CIK, accessionNumber: string, primaryDocument: string): Promise<Filing> {
        const buffer = await this.getFilingBuffer(cik, accessionNumber, primaryDocument);
        const parser = new DOMParser();
        const document = parser.parseFromString(buffer.toString(), "text/xml");
        const root = document.documentElement;
        return Filing.fromDocument(root);
    }

    /**
     * If parameters for time are not provided, the current year and quarter will be used
     **/
    async frames(concept: CompanyConcept, unit?: string): Promise<FrameResponseBody>;
    async frames(concept: CompanyConcept, frame: string, unit?: string): Promise<FrameResponseBody>;
    async frames(concept: CompanyConcept, year: number, quarter: Quarter, unit?: string): Promise<FrameResponseBody>;
    async frames(concept: CompanyConcept, unitOrFrameOrYear?: string | number, quarterOrUnit?: Quarter | string,
                 unit: string = "pure"): Promise<FrameResponseBody> {
        let unitVal: string = unit;
        let quarter: Quarter | undefined;
        let year = new Date().getFullYear();
        let frame: string | undefined;
        if (unitOrFrameOrYear === undefined) { // concept is the only argument
            const n = Math.floor(new Date().getMonth() / 3);
            if (n === 0) {
                year -= 1;
                quarter = "Q4I";
            } else
                quarter = toQuarter(n + 1);
            unitVal = "pure"
        } else if (typeof unitOrFrameOrYear === 'string') // First or second overload signature
            if (quarterOrUnit === undefined) { // First overload signature
                unitVal = unitOrFrameOrYear;
                const n = Math.floor(new Date().getMonth() / 3);
                if (n === 0) {
                    year -= 1;
                    quarter = "Q4I";
                } else
                    quarter = toQuarter(n + 1);
            } else { // Second overload signature
                frame = unitOrFrameOrYear;
                unitVal = quarterOrUnit;
            }
        else { // Third overload signature
            year = unitOrFrameOrYear;
            if (year < 1960 || year > new Date().getFullYear())
                throw new Error("Invalid year");
            quarter = toQuarter(quarterOrUnit as Quarter | string)
            unitVal = unit;
        }
        if (frame === undefined)
            frame = `CY${year}${quarter ?? ""}`
        const endpoint = new URL(`https://data.sec.gov/api/xbrl/frames/${concept.toString()}/${unitVal}/${frame}.json`);
        const res = await fetch(endpoint, {headers: this.headers})
        const text = await res.text();
        if (res.status !== 200)
            throw await this.handleError(res, text);
        const data = JSON.parse(text);
        if (!isFrameResponseBody(data))
            throw await this.handleError(res, text);
        return data;
    }

    async cikByName(name: string): Promise<LookupResult[]> {
        return cikByName(name);
    }

}

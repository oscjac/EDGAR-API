import fetch, {Headers, Response} from "node-fetch";
import {env} from "process";
import {ForbiddenRequestError, SECError, UserAgentError} from "./errors";
import {URL} from "url";
import {
    isSubmissionResponseData,
    isCompanyConceptBody,
    isFrameResponseBody,
    isCompanyFactsResponse
} from "./validators";
import {CompanyFactsResponse, FrameResponseBody} from "./responses";
import CompanyConcept, {Taxonomy} from "./CompanyConcept";

export {CompanyConcept, CompanyFactsResponse, FrameResponseBody, Taxonomy};

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

export class CIK {
    private readonly cik: string;

    constructor(cik: string) {
        if (!/^\d+$/.test(cik) || 10 < cik.length)
            throw new Error("Invalid CIK");
        this.cik = "CIK" + cik.padStart(10, "0");
    }

    toString(): string {
        return this.cik;
    }
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
            if (quarterOrUnit === undefined){ // First overload signature
                unitVal = unitOrFrameOrYear;
                const n = Math.floor(new Date().getMonth() / 3);
                if (n === 0) {
                    year -= 1;
                    quarter = "Q4I";
                } else
                    quarter = toQuarter(n + 1);
            }
            else { // Second overload signature
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
}

import fetch, {Headers, Response} from "node-fetch";
import {env} from "process";
import {ForbiddenRequestError, SECError, UserAgentError} from "./errors";
import {URL} from "url";
import {isSubmissionResponseData, validateCompanyConcept, isFrameResponseBody} from "./validators";
import {CIK, Quarter, Taxonomy} from "./types";
import {FrameResponseBody} from "./responses";
import CompanyConcept from "./CompanyConcept";

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
        if (!validateCompanyConcept(data))
            throw await this.handleError(res, text);
        this.conceptCache.set(`${taxonomy}/${tag}`, CompanyConcept.fromBody(data));
        return CompanyConcept.fromBody(data);
    }

    async companyFacts(cik: CIK): Promise<CompanyConcept[]> {
        const endpoint = new URL(`https://data.sec.gov/api/xbrl/companyfacts/${cik.toString()}.json`);
        const res = await fetch(endpoint, {headers: this.headers});
        const text = await res.text();
        if (res.status !== 200)
            throw await this.handleError(res, text);
        const out = new Array<CompanyConcept>();
        const data = JSON.parse(text);
        if (data["data"] === undefined)
            throw await this.handleError(res, text)
        const entityName = data["entityName"];
        for (const taxonomy in data) {
            for (const tag in data[taxonomy]) {
                const conceptData = {
                    cik: parseInt(cik.toString(), 10),
                    entityName, taxonomy, tag,
                    ...data[taxonomy][tag]
                };
                if (validateCompanyConcept(conceptData))
                    out.push(CompanyConcept.fromBody(conceptData));
            }
        }
        return out;
    }

    /*
    * If parameters for time are not provided, the current year and quarter will be used
     */
    async frames(concept: CompanyConcept, year: number | null = null, quarter: Quarter | null = null,
                 unit = "pure"): Promise<FrameResponseBody> {
        let yearString = "CY" + new Date().getFullYear().toString();
        if (year != null) {
            if (year < 1960 || year > new Date().getFullYear())
                throw new Error("Invalid year");
            yearString = "CY" + year.toString();
        }
        const endpoint = new URL(`https://data.sec.gov/api/xbrl/frames/${concept.toString()}/${unit}/`
            + yearString + (quarter ?? "") + ".json");
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

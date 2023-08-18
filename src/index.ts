import fetch, {Headers, Response} from "node-fetch";
import {env} from "process";
import {ForbiddenRequestError, SECError, UserAgentError} from "./errors";
import {URL} from "url";
import {isSubmissionResponseData, validateCompanyConcept, validateFrames} from "./validators";
import {CIK, Quarter, Taxonomy, Unit} from "./types";
import {FrameResponseBody} from "./responses";
import CompanyConcept from "./CompanyConcept";

export default class Driver {
    private readonly headers: Headers;

    constructor(userAgent?: string) {
        let userAgentVal = userAgent ?? env.USER_AGENT;
        if (userAgentVal === undefined || userAgentVal === "")
            throw new Error("User agent not provided in either constructor or environment variable");
        this.headers = new Headers({
            "User-Agent": userAgentVal,
            "Accept-Encoding": "gzip, deflate",
            "Host": "data.sec.gov"
        });
    }

    private async handleError(res: Response): Promise<Error> {
        const text = await res.text();
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
        if (res.status !== 200)
            throw await this.handleError(res);
        const data = await res.json();
        if (!isSubmissionResponseData(data))
            throw await this.handleError(res);
        return data;
    }

    async getCompanyConcept(cik: CIK, taxonomy: Taxonomy, tag: string): Promise<CompanyConcept> {
        const endpoint = new URL(`https://data.sec.gov/api/xbrl/companyconcept/${cik.toString()}/`
            + taxonomy + "/" + tag + ".json");
        const res = await fetch(endpoint, {headers: this.headers});
        if (res.status !== 200)
            throw await this.handleError(res);
        const data = await res.json();
        if (!validateCompanyConcept(data))
            throw await this.handleError(res);
        return CompanyConcept.fromBody(data);
    }

    async companyFacts(cik: CIK): Promise<CompanyConcept[]> {
        const endpoint = new URL(`https://data.sec.gov/api/xbrl/companyfacts/${cik.toString()}.json`);
        const res = await fetch(endpoint, {headers: this.headers});
        if (res.status !== 200)
            throw await this.handleError(res);
        const data = await res.json();
        const out = new Array<CompanyConcept>();
        if (data["data"] === undefined)
            throw await this.handleError(res)
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
                 unit: Unit = "pure", immediate: boolean = false): Promise<FrameResponseBody> {
        let yearString = "CY" + new Date().getFullYear().toString();
        if (year != null) {
            yearString = "CY" + year.toString();
        }
        let quarterString = "Q" + Math.ceil(new Date().getMonth() / 3).toString();
        if (quarter != null) {
            quarterString = "Q" + quarter.toString();
        }
        const endpoint = new URL("https://data.sec.gov/api/xbrl/frames/" +
        concept.taxonomy + "/" + concept.concept + "/" + unit + "/" + yearString + "/" + quarterString +
        immediate ? "I" : "" + ".json");
        const res = await fetch(endpoint, {headers: this.headers})
        if (res.status !== 200)
            throw await this.handleError(res);
        const data = await res.json();
        if (!validateFrames(data))
            throw await this.handleError(res);
        return data;
    }
}

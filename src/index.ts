import {env} from "process";
import {URL} from "url";
import fetch, {Headers, Response} from "node-fetch";
import {UserAgentError} from "./errors";
import {CompanyConceptBody, CompanyConceptUnits, Quarter, Taxonomy, Unit} from "./types";
import {isSubmissionResponseData, validateCompanyConcept, validateFrames} from "./validators";
import {FrameResponseBody} from "./responses";


export class CompanyConcept {
    readonly taxonomy: Taxonomy;
    readonly concept: string;
    private readonly units: CompanyConceptUnits[];

    private constructor(taxonomy: Taxonomy, concept: string, units: CompanyConceptUnits[]) {
        this.taxonomy = taxonomy;
        this.concept = concept;
        this.units = units;
    }

    private filterFactory(start?: string | Date, end?: string | Date): (unit: CompanyConceptUnits) => boolean {
        if (start === undefined && end === undefined) return () => true;
        let after: (() => boolean) | ((d: Date) => boolean) = () => true;
        let before: (() => boolean) | ((d: Date) => boolean) = () => true;
        if (start !== undefined) {
            const startDate = new Date(start);
            after = (date: Date) => date >= startDate;
        }
        if (end !== undefined) {
            const endDate = new Date(end);
            before = (date: Date) => date <= endDate;
        }
        return (unit: CompanyConceptUnits) => {
            if (unit.start && !after(new Date(unit.start)))
                return false;
            return !(unit.end && !before(new Date(unit.end)));
        }
    }

    getUnits(start?: string | Date, end?: string | Date): CompanyConceptUnits[] {
        if (start === undefined && end === undefined) return this.units;
        const out = new Array<CompanyConceptUnits>();
        const filter = this.filterFactory(start, end);
        return out.filter(filter);
    }

    static fromBody(body: CompanyConceptBody): CompanyConcept {
        return new CompanyConcept(body.taxonomy, body.tag, body.units[body.taxonomy])
    }
}

export class Driver {
    private readonly headers: Headers;

    constructor(userAgent?: string) {
        let userAgentVal = userAgent ?? env.USER_AGENT;
        if (userAgentVal === undefined || userAgentVal === "")
            throw new Error("User agent not provided in either constructor or environment variable");
        this.headers = new Headers({
            "Accept": "application/json",
            "User-Agent": userAgentVal
        });
    }

    private handleError(res: Response): Error {
        if (res.status === 400) return new UserAgentError();
        return new Error;
    }

    async submissions(cik: string) {
        const endpoint = new URL("data.sec.gov/submission/CIK" + cik.padStart(10, "0") + ".json");
        const res = await fetch(endpoint, {headers: this.headers});
        if (res.status !== 200)
            throw this.handleError(res);
        const data = await res.json();
        if (!isSubmissionResponseData(data))
            throw this.handleError(res);
        return data;
    }

    async getCompanyConcept(cik: string, taxonomy: Taxonomy, tag: string): Promise<CompanyConcept> {
        const endpoint = new URL("data.sec.gov/api/xbrl/companyconcept/CIK" + cik.padStart(10, "0") +
            "/" + taxonomy + "/" + tag + ".json");
        const res = await fetch(endpoint, {headers: this.headers});
        if (res.status !== 200)
            throw this.handleError(res);
        const data = await res.json();
        if (!validateCompanyConcept(data))
            throw this.handleError(res);
        return CompanyConcept.fromBody(data);
    }

    async companyFacts(cik: string): Promise<CompanyConcept[]> {
        const endpoint = new URL("data.sec.gov/api/xbrl/companyfacts/CIK" + cik.padStart(10, "0") + ".json");
        const res = await fetch(endpoint, {headers: this.headers});
        if (res.status !== 200)
            throw this.handleError(res);
        const data = await res.json();
        const out = new Array<CompanyConcept>();
        if (data["data"] === undefined)
            throw this.handleError(res)
        const entityName = data["entityName"];
        for (const taxonomy in data) {
            for (const tag in data[taxonomy]) {
                const conceptData = {
                    cik: parseInt(cik, 10),
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
        const endpoint = new URL("data.sec.gov/api/xbrl/frames/" +
        concept.taxonomy + "/" + concept.concept + "/" + unit + "/" + yearString + "/" + quarterString +
        immediate ? "I" : "" + ".json");
        const res = await fetch(endpoint, {
            headers: this.headers
        })
        if (res.status !== 200)
            throw this.handleError(res);
        const data = await res.json();
        if (!validateFrames(data))
            throw this.handleError(res);
        return data;
    }
}
import { CompanyConceptBody, CompanyConceptUnits, Quarter, Taxonomy, Unit } from "./types";
import { FrameResponseBody } from "./responses";
export declare class CompanyConcept {
    readonly taxonomy: Taxonomy;
    readonly concept: string;
    private units;
    private constructor();
    private filterFactory;
    getUnits(start?: string | Date, end?: string | Date): CompanyConceptUnits[];
    static fromBody(body: CompanyConceptBody): CompanyConcept;
}
export declare class Driver {
    private readonly headers;
    constructor(userAgent?: string);
    private handleError;
    submissions(cik: string): Promise<import("./responses").SubmissionResponseData>;
    getCompanyConcept(cik: string, taxonomy: Taxonomy, tag: string): Promise<CompanyConcept>;
    companyFacts(cik: string): Promise<CompanyConcept[]>;
    frames(concept: CompanyConcept, year?: number | null, quarter?: Quarter | null, unit?: Unit, immediate?: boolean): Promise<FrameResponseBody>;
}

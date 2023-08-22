export type Taxonomy = "us-gaap" | "ifrs" | "dei" | "srt" | "invest";

export const isTaxonomy = (taxonomy: string): taxonomy is Taxonomy => {
    return ["us-gaap", "ifrs", "dei", "srt", "invest"].includes(taxonomy);
}

export type CompanyConceptBase = {
    cik: number,
    entityName: string,
    tag: string,
    taxonomy: Taxonomy,
}


export type CompanyConceptUnits = {
    [key: string]: CompanyConceptUnit[] | undefined
}

export type CompanyConceptBody = {
    label?: string,
    description?: string,
    units: CompanyConceptUnits
} & CompanyConceptBase

export type CompanyConceptUnit = {
    end?: string,
    start?: string,
    accn: string,
    fy: number,
    fp: string,
    filed: string,
    form: string,
    frame?: string
    val: number
}
export default class CompanyConcept {
    readonly taxonomy: Taxonomy;
    readonly concept: string;
    private readonly units: CompanyConceptUnits;

    private constructor(taxonomy: Taxonomy, concept: string, units: CompanyConceptUnits) {
        this.taxonomy = taxonomy;
        this.concept = concept;
        this.units = units;
    }

    private filterFactory(start?: string | Date, end?: string | Date): (unit: CompanyConceptUnit) => boolean {
        if (start === undefined && end === undefined) return () => true;
        let after: (() => boolean) | ((d: Date) => boolean) = () => true;
        let before: (() => boolean) | ((d: Date) => boolean) = () => true;
        if (start !== undefined && end === undefined){
            const startDate = new Date(start);
            after = (date: Date) => date >= startDate;
            return (unit: CompanyConceptUnit) => {
                if (unit.start === undefined) return unit.end !== undefined && after(new Date(unit.end));
                return after(new Date(unit.start));
            }
        }
        if (end !== undefined && start === undefined) {
            const endDate = new Date(end);
            before = (date: Date) => date <= endDate;
            return (unit: CompanyConceptUnit) => {
                if (unit.end === undefined) return unit.start !== undefined && before(new Date(unit.start));
                return before(new Date(unit.end));
            }
        }
        return (unit: CompanyConceptUnit) => {
            if (unit.start === undefined || unit.end === undefined){
                if (unit.start === undefined && unit.end === undefined) return true;
                if (unit.start === undefined) return before(new Date(unit.end as string));
                return after(new Date(unit.start));
            }
            const startDate = new Date(unit.start);
            const endDate = new Date(unit.end);
            return after(startDate) && before(endDate);
        }
    }

    getUnits(start?: string | Date, end?: string | Date): CompanyConceptUnits {
        if (start === undefined && end === undefined) return this.units;
        const out: CompanyConceptUnits = {};
        const filter = this.filterFactory(start, end);
        for (const [unit, conceptValues] of Object.entries(this.units)) {
            if (conceptValues === undefined) continue;
            out[unit] = conceptValues.filter(filter);
        }
        return out;
    }

    /**
     * Equivalent to `${taxonomy}/${concept}`
     */
    toString(): string {
        return `${this.taxonomy}/${this.concept}`;
    }
    static fromBody(body: CompanyConceptBody): CompanyConcept {
        return new CompanyConcept(body.taxonomy, body.tag, body.units)
    }
}


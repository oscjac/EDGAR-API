import {CompanyConceptBody, CompanyConceptUnits, Taxonomy} from "./types";

export default class CompanyConcept {
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


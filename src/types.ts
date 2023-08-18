export type Taxonomy = "us-gaap" | "ifrs";

export type Quarter = 1 | 2 | 3 | 4;

export type Unit = "pure" | "USD"

export type CompanyConceptBase = {
    cik: number,
    entityName: string,
    tag: string,
    taxonomy: Taxonomy,
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

export type CompanyConceptBody = {
    label: string,
    description?: string,
    units: {
        [key in Taxonomy]: CompanyConceptUnits[]
    }
} & CompanyConceptBase

export type CompanyConceptUnits = {
    end?: string,
    start?: string,
    accn: string,
    fy: number,
    fp: string,
    form: string,
    frame?: string
    val: number
}

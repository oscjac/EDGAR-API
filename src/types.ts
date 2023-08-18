export type Taxonomy = "us-gaap" | "ifrs" | "dei" | "srt";

export type Quarter = `Q${1 | 2 | 3 | 4}${"I" | ""}`;

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

export type CompanyConceptUnits = {
    [key: string]: CompanyConceptUnit[] | undefined
}

export type CompanyConceptBody = {
    label: string,
    description?: string,
    units: CompanyConceptUnits
} & CompanyConceptBase

export type CompanyConceptUnit = {
    end?: string,
    start?: string,
    accn: string,
    fy: number,
    fp: string,
    form: string,
    frame?: string
    val: number
}

export default class CIK {
    private readonly cik: string;

    constructor(cik: string) {
        if (!/^\d+$/.test(cik) || 10 < cik.length)
            throw new Error("Invalid CIK");
        this.cik = cik
    }

    toString(format = true): string {
        return format ? "CIK"+this.cik.padStart(10, "0") : this.cik;
    }
}


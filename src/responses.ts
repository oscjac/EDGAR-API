import {Taxonomy} from "./types";

export interface ConceptUnitBase {
    accn: string,
    end?: string,
    val: number
}

export interface ConceptUnit extends ConceptUnitBase {
    fy: number,
    fp: string,
    form: string,
    frame?: string
    filed: string,
}

interface CompanyConcept {
    label: string,
    description?: string,
    units: {
        [key: string]: ConceptUnit[] | undefined
    }
}

export interface CompanyFactsResponse {
    cik: number,
    entityName: string,
    facts: {
        [key: string]: { [tag: string]: CompanyConcept | undefined } | undefined
    }
}

export interface FrameResponseUnit extends ConceptUnitBase {
    cik: number,
    entityName: string,
    loc: string,
}

export interface FrameResponseBody {
    taxonomy: Taxonomy,
    tag: string,
    ccp: string,
    uom: string,
    label: string,
    description?: string,
    pts: number,
    data: FrameResponseUnit[]
}

export interface SubmissionResponseData {
    cik: string,
    entityType: string,
    sic: string,
    sicDescription: string,
    insiderTransactionForOwnerExists: number,
    insiderTransactionForIssuerExists: number,
    name: string,
    tickers: string[],
    exchanges: string[],
    ein: string,
    description: string,
    website: string,
    investorWebsite: string,
    category: string,
    fiscalYearEnd: string,
    stateOfIncorporation: string,
    stateOfIncorporationDescription: string,
    phone: string,
    flags: string,
    formerNames: { name: string, from: string, to: string }[]
    filings: {
        recent: {
            accessionNumber: string[],
            filingDate: string[],
            reportDate: string[],
            acceptanceDateTime: string[],
            act: string[],
            form: string[],
            fileNumber: string[],
            filmNumber: string[],
            items: string[],
            size: number[],
            isXBRL: number[],
            isInlineXBRL: number[],
            primaryDocument: string[],
            primaryDocDescription: string[]
        }
        files: { name: string, filingCount: number, filingFrom: string, filingTo: string }[]
    }
}
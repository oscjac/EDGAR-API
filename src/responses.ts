import {Taxonomy} from "./types";

export interface FrameResponseData {
    accn: string,
    cik: number,
    entityName: string,
    loc: string,
    end: string
    val: number
    start?: string
}

export interface FrameResponseBody {
    taxonomy: Taxonomy,
    tag: string,
    ccp: string,
    uom: string,
    label: string,
    description?: string,
    pts: number,
    data: FrameResponseData[]
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
    formerNames: {name: string, from: string, to: string}[]
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
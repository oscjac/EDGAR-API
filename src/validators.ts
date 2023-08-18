import {FrameResponseBody, FrameResponseData, SubmissionResponseData} from "./responses";
import {CompanyConceptBody, CompanyConceptUnits} from "./types";

export const isSubmissionResponseData = (data: any): data is SubmissionResponseData => {
    const response = data as SubmissionResponseData;
    const keys = ["cik", "entityType", "sic", "sicDescription",
        "insiderTransactionForOwnerExists", "filings", "name", "tickers", "exchanges",
        "ein", "description", "website", "investorWebsite", "category", "fiscalYearEnd",
        "stateOfIncorporation", "stateOfIncorporationDescription", "phone", "flags", "formerNames"];
    const keySet = new Set(Object.keys(response));
    return keys.length === keySet.size && keys.every(key => keySet.has(key));
}

const isFrameResponseData = (data: any): data is FrameResponseData => {
    if (data === undefined || data === null || !Array.isArray(data)) return false;
    for (const datum of data) {
        if (typeof datum["accn"] !== 'string' || typeof datum["cik"] !== 'number' ||
            typeof datum["entityName"] !== 'string' || typeof datum["loc"] !== 'string' ||
            typeof datum["end"] !== 'string' || typeof datum["val"] !== 'number')
            return false;
    }
    return true;
}

export const isFrameResponseBody = (data: any): data is FrameResponseBody => {
    return (typeof data["taxonomy"] === 'string' || typeof data["tag"] === 'string' ||
        typeof data["ccp"] === 'string' || typeof data["uom"] === 'string' ||
        typeof data["label"] === 'string' || typeof data["pts"] === 'number' ||
        isFrameResponseData(data["data"]))
}

const validateCompanyConceptUnit = (data: any): data is CompanyConceptUnits => {
    const units = data as CompanyConceptUnits;
    return !(units.accn === undefined || units.fy === undefined || units.fp === undefined ||
        units.form === undefined || units.val === undefined);
}

export const validateCompanyConcept = (data: any): data is CompanyConceptBody => {
    const concept = data as CompanyConceptBody;
    return !(concept.tag === undefined || concept.entityName === undefined ||
        concept.taxonomy === undefined || concept.units === undefined ||
        concept.label === undefined || concept.label.length === 0 ||
        validateCompanyConceptUnit(concept.units));
}
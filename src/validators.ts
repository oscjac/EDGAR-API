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

const validateFrameResponseData = (data: any): data is FrameResponseData => {
    return !(data["accn"] === undefined || data["cik"] === undefined || data["entityName"] === undefined ||
        data["loc"] === undefined || data["end"] === undefined || data["val"] === undefined);
}

export const validateFrames = (data: any): data is FrameResponseBody => {
    return !(data["taxonomy"] === undefined || data["tag"] === undefined ||
        data["ccp"] === undefined || data["uom"] === undefined || data["label"] ||
    data["pts"] === undefined || data["data"] === undefined || !validateFrameResponseData(data["data"]))
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
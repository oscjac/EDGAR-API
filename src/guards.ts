import {
    CompanyFactsResponse, ConceptUnit,
    ConceptUnitBase,
    FrameResponseBody,
    FrameResponseUnit,
    SubmissionResponseData
} from "./responses";
import CompanyConcept, {CompanyConceptBody, CompanyConceptUnits} from "./CompanyConcept";

export const isSubmissionResponseData = (data: any): data is SubmissionResponseData => {
    const response = data as SubmissionResponseData;
    const keys = ["cik", "entityType", "sic", "sicDescription",
        "insiderTransactionForOwnerExists", "filings", "name", "tickers", "exchanges",
        "ein", "description", "website", "investorWebsite", "category", "fiscalYearEnd",
        "stateOfIncorporation", "stateOfIncorporationDescription", "phone", "flags", "formerNames"];
    const keySet = new Set(Object.keys(response));
    return keys.length <= keySet.size && keys.every(key => keySet.has(key));
}

const isCompanyConcept = (data: any): data is CompanyConcept => {
    if (typeof data["units"] !== 'object')
        return false;
    for (const key in data["units"]) {
        if (data["units"][key] === undefined || data["units"][key] === null || !Array.isArray(data["units"][key]))
            return false;
        const units = data["units"][key];
        let start = 0;
        if (100 < units.length)
            start = units.length / 2;
        for (const unit of units.slice(start)) {
            if (!isConceptUnit(unit))
                return false;
        }
    }
    return true;
}

export const isCompanyFactsResponse = (data: any): data is CompanyFactsResponse => {
    if (typeof data["cik"] !== 'number' || typeof data["entityName"] !== 'string' || typeof data["facts"] !== 'object')
        return false;
    let keys = Object.keys(data["facts"]);
    if (100 < keys.length)
        keys = keys.slice(keys.length / 2);
    const predicate = (key: string) => {
        const facts = data["facts"][key];
        if (typeof facts !== 'object')
            return false;
        let start = 0;
        if (100 < Object.keys(facts).length)
            start = Object.keys(facts).length / 2;
        for (const tag of Object.keys(facts).slice(start)){
            if (!isCompanyConcept(facts[tag]))
                return false;
        }
        return true
    }
    return keys.every(predicate)
}

const isConceptUnitBase = (data: any): data is ConceptUnitBase => {
    return (typeof data["accn"] === 'string' && typeof data["val"] === 'number');
}

const isConceptUnit = (data: any): data is ConceptUnit => {
    const unit = data as ConceptUnit;
    return (isConceptUnitBase(unit) && typeof unit["fy"] === 'number' && typeof unit["fp"] === 'string'
        && typeof unit["form"] === 'string' && typeof unit["filed"] === 'string');
}

const isFrameResponseData = (data: any): data is FrameResponseUnit => {
    if (!isConceptUnitBase(data))
        return false;
    const unit = data as FrameResponseUnit
    return (typeof unit["cik"] === 'number' && typeof unit["loc"] === 'string' && typeof unit["entityName"] === 'string')
}

export const isFrameResponseBody = (data: any): data is FrameResponseBody => {
    return (typeof data["taxonomy"] === 'string' || typeof data["tag"] === 'string' ||
        typeof data["ccp"] === 'string' || typeof data["uom"] === 'string' ||
        typeof data["label"] === 'string' || typeof data["pts"] === 'number' ||
        typeof data["data"] === 'object' && Array.isArray(data["data"]) && data["data"].every(isFrameResponseData));
}

const isCompanyConceptUnits = (data: any): data is CompanyConceptUnits => {
    const units = data as CompanyConceptUnits;
    for (const key in units) {
        const unitList = units[key];
        if (unitList === undefined)
            return false;
        let start = 0;
        if (100 < unitList.length)
            start = unitList.length / 2;
        for (const unit of unitList.slice(start)) {
            if (!isConceptUnit(unit))
                return false;
        }
    }
    return true;
}

export const isCompanyConceptBody = (data: any): data is CompanyConceptBody => {
    const concept = data as CompanyConceptBody;
    return concept.tag !== undefined && concept.entityName !== undefined &&
        concept.taxonomy !== undefined && concept.units !== undefined &&
        concept.label !== undefined && concept.label.length !== 0 &&
        isCompanyConceptUnits(concept.units);
}
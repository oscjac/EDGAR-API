"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCompanyConcept = exports.validateFrames = exports.isSubmissionResponseData = void 0;
const isSubmissionResponseData = (data) => {
    const response = data;
    const keys = ["cik", "entityType", "sic", "sicDescription",
        "insiderTransactionForOwnerExists", "filings", "name", "tickers", "exchanges",
        "ein", "description", "website", "investorWebsite", "category", "fiscalYearEnd",
        "stateOfIncorporation", "stateOfIncorporationDescription", "phone", "flags", "formerNames"];
    const keySet = new Set(Object.keys(response));
    return keys.length === keySet.size && keys.every(key => keySet.has(key));
};
exports.isSubmissionResponseData = isSubmissionResponseData;
const validateFrameResponseData = (data) => {
    return !(data["accn"] === undefined || data["cik"] === undefined || data["entityName"] === undefined ||
        data["loc"] === undefined || data["end"] === undefined || data["val"] === undefined);
};
const validateFrames = (data) => {
    return !(data["taxonomy"] === undefined || data["tag"] === undefined ||
        data["ccp"] === undefined || data["uom"] === undefined || data["label"] ||
        data["pts"] === undefined || data["data"] === undefined || !validateFrameResponseData(data["data"]));
};
exports.validateFrames = validateFrames;
const validateCompanyConceptUnit = (data) => {
    const units = data;
    return !(units.accn === undefined || units.fy === undefined || units.fp === undefined ||
        units.form === undefined || units.val === undefined);
};
const validateCompanyConcept = (data) => {
    const concept = data;
    return !(concept.tag === undefined || concept.entityName === undefined ||
        concept.taxonomy === undefined || concept.units === undefined ||
        concept.label === undefined || concept.label.length === 0 ||
        validateCompanyConceptUnit(concept.units));
};
exports.validateCompanyConcept = validateCompanyConcept;

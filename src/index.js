"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Driver = exports.CompanyConcept = void 0;
const process_1 = require("process");
const url_1 = require("url");
const node_fetch_1 = __importStar(require("node-fetch"));
const errors_1 = require("./errors");
const validators_1 = require("./validators");
class CompanyConcept {
    constructor(taxonomy, concept, units) {
        this.taxonomy = taxonomy;
        this.concept = concept;
        this.units = units;
    }
    filterFactory(start, end) {
        if (start === undefined && end === undefined)
            return () => true;
        let after = (date) => true;
        let before = (date) => true;
        if (start !== undefined) {
            const startDate = new Date(start);
            after = (date) => date >= startDate;
        }
        if (end !== undefined) {
            const endDate = new Date(end);
            before = (date) => date <= endDate;
        }
        return (unit) => {
            if (unit.start && !after(new Date(unit.start)))
                return false;
            return !(unit.end && !before(new Date(unit.end)));
        };
    }
    getUnits(start, end) {
        if (start === undefined && end === undefined)
            return this.units;
        const out = new Array();
        const filter = this.filterFactory(start, end);
        return out.filter(filter);
    }
    static fromBody(body) {
        return new CompanyConcept(body.taxonomy, body.tag, body.units[body.taxonomy]);
    }
}
exports.CompanyConcept = CompanyConcept;
class Driver {
    constructor(userAgent) {
        let userAgentVal = userAgent !== null && userAgent !== void 0 ? userAgent : process_1.env.USER_AGENT;
        if (userAgentVal === undefined || userAgentVal === "")
            throw new Error("User agent not provided in either constructor or environment variable");
        this.headers = new node_fetch_1.Headers({
            "Accept": "application/json",
            "User-Agent": userAgentVal
        });
    }
    handleError(res) {
        if (res.status === 400)
            return new errors_1.UserAgentError();
        return new Error;
    }
    submissions(cik) {
        return __awaiter(this, void 0, void 0, function* () {
            const endpoint = new url_1.URL("data.sec.gov/submission/CIK" + cik.padStart(10, "0") + ".json");
            const res = yield (0, node_fetch_1.default)(endpoint, { headers: this.headers });
            if (res.status !== 200)
                throw this.handleError(res);
            const data = yield res.json();
            if (!(0, validators_1.isSubmissionResponseData)(data))
                throw this.handleError(res);
            return data;
        });
    }
    getCompanyConcept(cik, taxonomy, tag) {
        return __awaiter(this, void 0, void 0, function* () {
            const endpoint = new url_1.URL("data.sec.gov/api/xbrl/companyconcept/CIK" + cik.padStart(10, "0") +
                "/" + taxonomy + "/" + tag + ".json");
            const res = yield (0, node_fetch_1.default)(endpoint, { headers: this.headers });
            if (res.status !== 200)
                throw this.handleError(res);
            const data = yield res.json();
            if (!(0, validators_1.validateCompanyConcept)(data))
                throw this.handleError(res);
            return CompanyConcept.fromBody(data);
        });
    }
    companyFacts(cik) {
        return __awaiter(this, void 0, void 0, function* () {
            const endpoint = new url_1.URL("data.sec.gov/api/xbrl/companyfacts/CIK" + cik.padStart(10, "0") + ".json");
            const res = yield (0, node_fetch_1.default)(endpoint, { headers: this.headers });
            if (res.status !== 200)
                throw this.handleError(res);
            const data = yield res.json();
            const out = new Array();
            if (data["data"] === undefined)
                throw this.handleError(res);
            const entityName = data["entityName"];
            for (const taxonomy in data) {
                for (const tag in data[taxonomy]) {
                    const conceptData = Object.assign({ cik: parseInt(cik, 10), entityName, taxonomy, tag }, data[taxonomy][tag]);
                    if ((0, validators_1.validateCompanyConcept)(conceptData))
                        out.push(CompanyConcept.fromBody(conceptData));
                }
            }
            return out;
        });
    }
    /*
    * If parameters for time are not provided, the current year and quarter will be used
     */
    frames(concept, year = null, quarter = null, unit = "pure", immediate = false) {
        return __awaiter(this, void 0, void 0, function* () {
            let yearString = "CY" + new Date().getFullYear().toString();
            if (year != null) {
                yearString = "CY" + year.toString();
            }
            let quarterString = "Q" + Math.ceil(new Date().getMonth() / 3).toString();
            if (quarter != null) {
                quarterString = "Q" + quarter.toString();
            }
            const endpoint = new url_1.URL("data.sec.gov/api/xbrl/frames/" +
                concept.taxonomy + "/" + concept.concept + "/" + unit + "/" + yearString + "/" + quarterString +
                immediate ? "I" : "" + ".json");
            const res = yield (0, node_fetch_1.default)(endpoint, {
                headers: this.headers
            });
            if (res.status !== 200)
                throw this.handleError(res);
            const data = yield res.json();
            if (!(0, validators_1.validateFrames)(data))
                throw this.handleError(res);
            return data;
        });
    }
}
exports.Driver = Driver;

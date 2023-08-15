import { FrameResponseBody, SubmissionResponseData } from "./responses";
import { CompanyConceptBody } from "./types";
export declare const isSubmissionResponseData: (data: any) => data is SubmissionResponseData;
export declare const validateFrames: (data: any) => data is FrameResponseBody;
export declare const validateCompanyConcept: (data: any) => data is CompanyConceptBody;

import { ApiError } from "./middleware.js";
export function requireCompleteFinancialEvidence(...sources: Array<readonly [unknown[], number]>) {
  if(sources.some(([rows,limit])=>rows.length>limit))throw new ApiError(422,
    "The reporting window exceeds the supported evidence volume. No partial financial total has been returned.","FINANCIAL_REPORT_INCOMPLETE");
}

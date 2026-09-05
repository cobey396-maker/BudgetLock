// Operator details rendered on the privacy and terms pages.
//
// ⚠️ REVIEW BEFORE LAUNCH. The pages are a working draft written to match what
// the app actually does — they are not a substitute for legal advice. Fill in
// the values below (or set the matching env vars) and have a lawyer read the
// pages if you are taking real users' bank data.

export const OPERATOR = process.env.NEXT_PUBLIC_OPERATOR_NAME || "the BudgetLock team";

export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "support@example.com";

/** e.g. "the State of California, United States" */
export const GOVERNING_LAW = process.env.NEXT_PUBLIC_GOVERNING_LAW || "the State of Delaware, United States";

export const LAST_UPDATED = process.env.NEXT_PUBLIC_LEGAL_UPDATED || "5 September 2026";

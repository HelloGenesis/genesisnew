/**
 * WHERE A BUYER IS — countries, their states, dialling codes, postal codes
 * and the tax that applies (Genesis, 28 Sep 2026: "add country and drop-down
 * menu … phone, pin code for each country, state … change tax information
 * according to the countries").
 *
 * The countries Genesis sells into most, then "Other". A country with
 * `states` gets a drop-down; the rest get a free-text region. `postal` is
 * the shape of a postal code there (a regex source, used by the form and the
 * server alike); a country without one takes any short code, and where
 * postal codes are not used (the UAE, Qatar …) the field is optional.
 */

export type Country = {
  code: string;
  name: string;
  /** International dialling code. */
  dial: string;
  /** The postal code's shape, as a regex source. */
  postal?: string;
  postalLabel: string;
  /** Postal codes are not in general use there. */
  postalOptional?: boolean;
  states?: readonly string[];
  stateLabel: string;
};

const INDIA_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
  "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
] as const;

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "District of Columbia", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas",
  "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York",
  "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island",
  "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
  "West Virginia", "Wisconsin", "Wyoming",
] as const;

const CANADA_PROVINCES = [
  "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador",
  "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island", "Quebec",
  "Saskatchewan", "Yukon",
] as const;

const AUSTRALIA_STATES = [
  "Australian Capital Territory", "New South Wales", "Northern Territory", "Queensland", "South Australia",
  "Tasmania", "Victoria", "Western Australia",
] as const;

const UAE_EMIRATES = ["Abu Dhabi", "Ajman", "Dubai", "Fujairah", "Ras Al Khaimah", "Sharjah", "Umm Al Quwain"] as const;

const UK_NATIONS = ["England", "Northern Ireland", "Scotland", "Wales"] as const;

export const COUNTRIES: readonly Country[] = [
  { code: "IN", name: "India", dial: "+91", postal: "[1-9][0-9]{5}", postalLabel: "PIN code", states: INDIA_STATES, stateLabel: "State" },
  { code: "AE", name: "United Arab Emirates", dial: "+971", postalLabel: "Postal code", postalOptional: true, states: UAE_EMIRATES, stateLabel: "Emirate" },
  { code: "US", name: "United States", dial: "+1", postal: "[0-9]{5}(-[0-9]{4})?", postalLabel: "ZIP code", states: US_STATES, stateLabel: "State" },
  { code: "GB", name: "United Kingdom", dial: "+44", postal: "[A-Za-z]{1,2}[0-9][A-Za-z0-9]? ?[0-9][A-Za-z]{2}", postalLabel: "Postcode", states: UK_NATIONS, stateLabel: "Nation" },
  { code: "SG", name: "Singapore", dial: "+65", postal: "[0-9]{6}", postalLabel: "Postal code", stateLabel: "Region" },
  { code: "CA", name: "Canada", dial: "+1", postal: "[A-Za-z][0-9][A-Za-z] ?[0-9][A-Za-z][0-9]", postalLabel: "Postal code", states: CANADA_PROVINCES, stateLabel: "Province" },
  { code: "AU", name: "Australia", dial: "+61", postal: "[0-9]{4}", postalLabel: "Postcode", states: AUSTRALIA_STATES, stateLabel: "State" },
  { code: "SA", name: "Saudi Arabia", dial: "+966", postal: "[0-9]{5}", postalLabel: "Postal code", stateLabel: "Region" },
  { code: "QA", name: "Qatar", dial: "+974", postalLabel: "Postal code", postalOptional: true, stateLabel: "Municipality" },
  { code: "OM", name: "Oman", dial: "+968", postal: "[0-9]{3}", postalLabel: "Postal code", stateLabel: "Governorate" },
  { code: "KW", name: "Kuwait", dial: "+965", postal: "[0-9]{5}", postalLabel: "Postal code", stateLabel: "Governorate" },
  { code: "BH", name: "Bahrain", dial: "+973", postal: "[0-9]{3,4}", postalLabel: "Postal code", stateLabel: "Governorate" },
  { code: "DE", name: "Germany", dial: "+49", postal: "[0-9]{5}", postalLabel: "Postleitzahl", stateLabel: "State" },
  { code: "FR", name: "France", dial: "+33", postal: "[0-9]{5}", postalLabel: "Code postal", stateLabel: "Region" },
  { code: "NL", name: "Netherlands", dial: "+31", postal: "[0-9]{4} ?[A-Za-z]{2}", postalLabel: "Postcode", stateLabel: "Province" },
  { code: "IE", name: "Ireland", dial: "+353", postalLabel: "Eircode", postalOptional: true, stateLabel: "County" },
  { code: "CH", name: "Switzerland", dial: "+41", postal: "[0-9]{4}", postalLabel: "Postal code", stateLabel: "Canton" },
  { code: "HK", name: "Hong Kong", dial: "+852", postalLabel: "Postal code", postalOptional: true, stateLabel: "District" },
  { code: "MY", name: "Malaysia", dial: "+60", postal: "[0-9]{5}", postalLabel: "Postcode", stateLabel: "State" },
  { code: "ID", name: "Indonesia", dial: "+62", postal: "[0-9]{5}", postalLabel: "Postal code", stateLabel: "Province" },
  { code: "TH", name: "Thailand", dial: "+66", postal: "[0-9]{5}", postalLabel: "Postal code", stateLabel: "Province" },
  { code: "JP", name: "Japan", dial: "+81", postal: "[0-9]{3}-?[0-9]{4}", postalLabel: "Postal code", stateLabel: "Prefecture" },
  { code: "ZA", name: "South Africa", dial: "+27", postal: "[0-9]{4}", postalLabel: "Postal code", stateLabel: "Province" },
  { code: "NZ", name: "New Zealand", dial: "+64", postal: "[0-9]{4}", postalLabel: "Postcode", stateLabel: "Region" },
  { code: "NP", name: "Nepal", dial: "+977", postal: "[0-9]{5}", postalLabel: "Postal code", stateLabel: "Province" },
  { code: "LK", name: "Sri Lanka", dial: "+94", postal: "[0-9]{5}", postalLabel: "Postal code", stateLabel: "Province" },
  { code: "BD", name: "Bangladesh", dial: "+880", postal: "[0-9]{4}", postalLabel: "Postal code", stateLabel: "Division" },
  { code: "OTHER", name: "Other country", dial: "+", postalLabel: "Postal code", postalOptional: true, stateLabel: "State / region" },
];

export const DEFAULT_COUNTRY = "IN";

export const findCountry = (code: string | undefined) =>
  COUNTRIES.find((country) => country.code === code) ?? COUNTRIES[0];

/** Every dialling code offered, once each, for the phone drop-downs. */
export const DIAL_CODES = [...new Set(COUNTRIES.filter((c) => c.dial !== "+").map((c) => c.dial))].sort(
  (a, b) => Number(a.slice(1)) - Number(b.slice(1)),
);

/** A postal code is valid for its country — or absent, where postal codes are optional. */
export function validPostal(country: Country, value: string) {
  const code = value.trim();
  if (!code) return Boolean(country.postalOptional);
  if (!country.postal) return /^[A-Za-z0-9 -]{2,10}$/.test(code);
  return new RegExp(`^(?:${country.postal})$`).test(code);
}

/**
 * THE TAX A BUYER PAYS, BY COUNTRY.
 *
 *   India      GST at 18%; a GSTIN (optional) goes on the invoice.
 *   Elsewhere  An export of services from India — zero-rated, no Indian GST —
 *              with the buyer's own VAT / tax ID (optional) on the invoice.
 *
 * TODO(genesis): confirm with your accountant that Genesis files a Letter of
 * Undertaking (LUT) for zero-rated exports; without one, IGST applies and is
 * claimed back as a refund.
 */
export function taxFor(countryCode: string | undefined) {
  if (findCountry(countryCode).code === "IN") {
    return {
      rate: 0.18,
      label: "GST (18%)",
      idLabel: "GSTIN",
      idHint: "15 characters, e.g. 27ABCDE1234F1Z5. Leave blank if not registered.",
    };
  }
  return {
    rate: 0,
    label: "Tax: export of services (0%)",
    idLabel: "VAT / Tax ID",
    idHint: "Your business's VAT, GST or tax number, if you have one.",
  };
}

/** The GSTIN's shape: state code, PAN, entity number, "Z", checksum. */
export const GSTIN_PATTERN = "[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z][0-9A-Za-z][Zz][0-9A-Za-z]";

/**
 * WHERE GENESIS SHOOTS — Mumbai, for now (Genesis, 28 Sep 2026: "Studios
 * subscription or any product that requires a physical shoot shouldn't get
 * checked out for any other region apart from Mumbai as of now"). Brand &
 * Design and AI work are done worldwide.
 */
export const SHOOT_CITY = "Mumbai";
export const shootNote = "Studios plans and shoots are available in Mumbai only, for now.";

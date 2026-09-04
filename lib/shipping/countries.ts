/**
 * Where HOOR will take an order to. A curated list, ported from Kalima:
 * EasyParcel only serves some destinations from Malaysia, and a short list is
 * a decision the shop has made. Adding a country is one line here; rates come
 * live from EasyParcel for whatever is sent. Malaysia is first, is the
 * default, and is the only destination that can be priced by zone.
 */
export type Country = { code: string; name: string; dial: string };

export const COUNTRIES: Country[] = [
  { code: "MY", name: "Malaysia", dial: "60" },
  { code: "SG", name: "Singapore", dial: "65" },
  { code: "BN", name: "Brunei", dial: "673" },
  { code: "ID", name: "Indonesia", dial: "62" },
  { code: "TH", name: "Thailand", dial: "66" },
  { code: "PH", name: "Philippines", dial: "63" },
  { code: "VN", name: "Vietnam", dial: "84" },
  { code: "AU", name: "Australia", dial: "61" },
  { code: "NZ", name: "New Zealand", dial: "64" },
  { code: "GB", name: "United Kingdom", dial: "44" },
  { code: "IE", name: "Ireland", dial: "353" },
  { code: "US", name: "United States", dial: "1" },
  { code: "CA", name: "Canada", dial: "1" },
  { code: "AE", name: "United Arab Emirates", dial: "971" },
  { code: "SA", name: "Saudi Arabia", dial: "966" },
  { code: "QA", name: "Qatar", dial: "974" },
  { code: "KW", name: "Kuwait", dial: "965" },
  { code: "BH", name: "Bahrain", dial: "973" },
  { code: "OM", name: "Oman", dial: "968" },
  { code: "JP", name: "Japan", dial: "81" },
  { code: "KR", name: "South Korea", dial: "82" },
  { code: "TW", name: "Taiwan", dial: "886" },
  { code: "HK", name: "Hong Kong", dial: "852" },
];

export const DEFAULT_COUNTRY = "MY";
export const isKnownCountry = (code: string) => COUNTRIES.some((c) => c.code === code.toUpperCase());
export const countryName = (code: string) => COUNTRIES.find((c) => c.code === code.toUpperCase())?.name ?? code.toUpperCase();
export const dialCodeFor = (code: string) => COUNTRIES.find((c) => c.code === code.toUpperCase())?.dial ?? null;

/**
 * Parcel size by weight. International rates price on volumetric weight as
 * much as actual weight; everything HOOR sells is folded apparel in a mailer,
 * so weight predicts size well.
 */
export type ParcelSize = { width: number; height: number; length: number };
const TIERS: { upToGrams: number; size: ParcelSize }[] = [
  { upToGrams: 500, size: { width: 25, height: 5, length: 20 } },
  { upToGrams: 1500, size: { width: 35, height: 10, length: 25 } },
  { upToGrams: 3000, size: { width: 40, height: 20, length: 30 } },
];
const LARGEST: ParcelSize = { width: 45, height: 30, length: 35 };
export const parcelSizeFor = (weightGrams: number): ParcelSize => TIERS.find((t) => weightGrams <= t.upToGrams)?.size ?? LARGEST;

/** One packed dress, mailer included. The site's 400g figure plus headroom. */
export const PIECE_GRAMS = 500;

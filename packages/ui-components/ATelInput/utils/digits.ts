/**
 * Alternative-numeral support. Phone numbers are routinely entered with the digits of the
 * user's own script — Arabic-Indic, Persian/Urdu, Devanagari, Bengali. `libphonenumber-js`
 * and our own `\d` cleanup only understand ASCII `0-9`, so anything else silently becomes
 * an empty number. `normalizeDigits` folds those scripts down to ASCII before validation.
 */

/**
 * Base code points of contiguous decimal-digit blocks. Each block runs `base`‥`base+9`
 * for digit `0`‥`9`, so the ASCII digit is `codePoint - base`. Add a script by appending
 * one entry here.
 */
export const LOCALE_DIGIT_RANGES: { name: string; base: number }[] = [
  { name: 'arabic-indic', base: 0x0660 }, // ٠١٢٣٤٥٦٧٨٩
  { name: 'extended-arabic', base: 0x06f0 }, // ۰۱۲۳۴۵۶۷۸۹ — Persian / Urdu
  { name: 'devanagari', base: 0x0966 }, // ०१२३४५६७८९
  { name: 'bengali', base: 0x09e6 }, // ০১২৩৪৫৬৭৮৯
];

/** Lookup of every non-ASCII digit code point → its ASCII character. */
const DIGIT_MAP: Map<number, string> = (() => {
  const map = new Map<number, string>();
  for (const { base } of LOCALE_DIGIT_RANGES) {
    for (let d = 0; d <= 9; d++) map.set(base + d, String(d));
  }
  return map;
})();

/**
 * Replace any supported non-ASCII decimal digit with its ASCII equivalent. Every other
 * character (spaces, `+`, separators, letters) is left untouched — callers still run their
 * own `\D` cleanup afterwards.
 */
export function normalizeDigits(input: string): string {
  const str = String(input ?? '');
  let out = '';
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    out += (cp != null && DIGIT_MAP.get(cp)) || ch;
  }
  return out;
}

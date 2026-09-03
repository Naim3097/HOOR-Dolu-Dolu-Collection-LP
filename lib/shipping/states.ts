/** Malaysian state names to ISO 3166-2 codes; EasyParcel prices by code. */
const STATE_TO_ISO: Record<string, string> = {
  johor: "MY-01", kedah: "MY-02", kelantan: "MY-03", melaka: "MY-04", malacca: "MY-04", "negeri sembilan": "MY-05", pahang: "MY-06",
  penang: "MY-07", "pulau pinang": "MY-07", perak: "MY-08", perlis: "MY-09", selangor: "MY-10", terengganu: "MY-11", sabah: "MY-12",
  sarawak: "MY-13", "kuala lumpur": "MY-14", "wilayah persekutuan kuala lumpur": "MY-14", labuan: "MY-15", putrajaya: "MY-16",
};
export function stateToIso(name: string | null | undefined): string | null {
  if (!name) return null;
  const t = name.trim();
  if (/^MY-\d{2}$/i.test(t)) return t.toUpperCase();
  return STATE_TO_ISO[t.toLowerCase()] ?? null;
}

/** Integer sen everywhere in the database; ringgit only at the edges. */
export const toSen = (rm: number) => Math.round(rm * 100);
export const fromSen = (sen: number) => sen / 100;
export const rm = (sen: number) => {
  const v = sen / 100;
  return `RM${Number.isInteger(v) ? v : v.toFixed(2)}`;
};

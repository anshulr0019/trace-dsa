/** Fit ordinary arrays in one row; wrap long inputs without shrinking the text. */
export function arrayLayout(count: number, available: number, rowHeight = 150) {
  const space = Math.max(1, available || 280);
  const columns = Math.max(
    1,
    Math.min(count || 1, Math.floor((space + 8) / 44)),
  );
  const tile = Math.min(52, Math.max(1, (space - (columns - 1) * 8) / columns));
  const gap = tile + 8;
  const rows = Math.max(1, Math.ceil(count / columns));
  return {
    columns,
    tile,
    gap,
    rows,
    rowHeight,
    width: columns * gap - 8,
    height: rows * rowHeight,
  };
}

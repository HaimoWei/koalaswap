// src/utils/currency.ts
/** 统一的货币前缀：要显示 A$ 就写 "A$"，要只显示 $ 就写 "$" */
export const CURRENCY_PREFIX = "$";

/** 统一格式化金额。withCents=true 可强制两位小数 */
export function formatAUD(
    value: number | string,
    opts?: { withCents?: boolean }
): string {
    const n = typeof value === "string" ? Number(value) : value;
    if (!isFinite(n as number)) return `${CURRENCY_PREFIX}0`;
    if (opts?.withCents) return `${CURRENCY_PREFIX}${(+n).toFixed(2)}`;
    const s = Number.isInteger(+n) ? String(+n) : (+n).toFixed(2).replace(/\.00$/, "");
    return `${CURRENCY_PREFIX}${s}`;
}

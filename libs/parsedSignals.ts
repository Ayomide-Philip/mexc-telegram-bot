import { state } from "./telegram";

export type ParsedSignal =
  | {
      symbol: string | null;
      side: "long" | "short" | null;
      entry: string | null;
      stopLoss: number | null;
      takeProfits: number[];
      leverage: string | null;
      raw: string;
      ts?: number;
    }
  | undefined;

export function parseSignal(raw: string, ts?: number): ParsedSignal {
  const text = raw;

  // Symbol: either "$WORD" or "WORD/USDT"
  const symbolMatch =
    text.match(/\$([A-Za-z0-9]+)/) || text.match(/([A-Za-z0-9]+)\s*\/USDT/i);
  const symbol = symbolMatch ? symbolMatch[1].toUpperCase() : null;

  if (!symbol) return;

  // Side
  const side = /short/i.test(text)
    ? "short"
    : /long|buy/i.test(text)
      ? "long"
      : null;

  if (!side) return;
  // Entry: either "CMP" (market price) or a number/range
  let entry: string | null = null;
  if (/CMP/i.test(text)) {
    entry = "CMP";
  } else {
    const rangeMatch = text.match(/(\d+\.\d+)\s*[-–]\s*(\d+\.\d+)/);
    if (rangeMatch) entry = `${rangeMatch[1]}-${rangeMatch[2]}`;
  }

  const slMatch = text.match(/SL:?\s*(\d+\.\d+)/i);
  const stopLoss = slMatch ? parseFloat(slMatch[1]) : null;

  const findCurrency = state.signals.find((s) =>
    isSameSignal(s, {
      symbol,
      side,
      entry,
      stopLoss,
      takeProfits: [],
      leverage: null,
      raw: text,
      ts,
    }),
  );

  if (findCurrency) return;

  const tpMatches = [...text.matchAll(/TP\d*:?\s*(\d+\.\d+)/gi)];
  const takeProfits = tpMatches.map((m) => parseFloat(m[1]));

  const levMatch = text.match(/(\d+)x/i);
  const leverage = levMatch ? `${levMatch[1]}x` : "5x";

  return {
    symbol,
    side,
    entry,
    stopLoss,
    takeProfits,
    leverage,
    raw: text,
    ts,
  };
}

function isSameSignal(a: ParsedSignal, b: ParsedSignal): boolean {
  if (!a || !b) return false;
  return (
    a.symbol === b.symbol &&
    a.side === b.side &&
    a.entry === b.entry &&
    a.stopLoss === b.stopLoss
  );
}

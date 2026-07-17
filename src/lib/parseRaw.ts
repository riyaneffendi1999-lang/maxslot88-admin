export interface ParsedTransaction {
  date: string;
  time: string;
  ticket: string;
  user_name: string;
  full_name: string;
  group_name: string;
  amount: number;
}

const GROUPS = ['New Registration', 'New register', 'Low', 'Medium', 'High', 'VIP'];
const MONTH_MAP: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

// ── Amount ──────────────────────────────────────────────────────────────────
function parseAmount(s: string): number {
  const cleaned = s.replace(/[^\d.,]/g, '');
  if (!cleaned) return 0;
  if (cleaned.includes('.') && cleaned.includes(',')) {
    return cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')
      ? parseFloat(cleaned.replace(/\./g, '').replace(',', '.')) || 0
      : parseFloat(cleaned.replace(/,/g, '')) || 0;
  }
  if (cleaned.includes(',')) {
    const parts = cleaned.split(',');
    return parts[parts.length - 1].length === 3
      ? parseFloat(cleaned.replace(/,/g, '')) || 0
      : parseFloat(cleaned.replace(',', '.')) || 0;
  }
  if (cleaned.includes('.')) {
    const parts = cleaned.split('.');
    return parts[parts.length - 1].length === 3
      ? parseFloat(cleaned.replace(/\./g, '')) || 0
      : parseFloat(cleaned) || 0;
  }
  return parseFloat(cleaned) || 0;
}

// ── Date ─────────────────────────────────────────────────────────────────────
function parseDate(dateStr: string, timeStr: string): string {
  const parts = dateStr.trim().split(/[-/]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = MONTH_MAP[parts[1].toLowerCase()] ?? parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const [hh = 0, mm = 0, ss = 0] = timeStr.trim().split(':').map(Number);
      return new Date(year, month, day, hh, mm, ss).toISOString();
    }
  }
  return new Date().toISOString();
}

// ── Group detection (case-insensitive suffix search) ──────────────────────────
function extractGroup(text: string): { group_name: string; rest: string } {
  const lower = text.toLowerCase();
  // Sort longest first so "New register" matches before "New"
  for (const g of [...GROUPS].sort((a, b) => b.length - a.length)) {
    const idx = lower.lastIndexOf(g.toLowerCase());
    if (idx !== -1) {
      return {
        group_name: g,
        rest: (text.slice(0, idx) + text.slice(idx + g.length)).trim(),
      };
    }
  }
  return { group_name: '', rest: text.trim() };
}

// ── Ticket detection: first run of 6-12 alphanumeric chars anchored at start ─
function extractTicket(text: string): { ticket: string; rest: string } {
  // Ticket is 6-12 alphanum chars (no spaces) at the very start
  const m = text.match(/^([A-Za-z0-9]{6,12})/);
  if (!m) return { ticket: '', rest: text.trim() };
  return { ticket: m[1], rest: text.slice(m[1].length).trim() };
}

// ── Data-line parser: robust fuzzy split ────────────────────────────────────
// Input (after stripping date/time/amount) looks like:
//   "D6487335  bk3864   MUHAMMAD AZRIL S PANGABBEAN  Low"
// Or tab-separated:
//   "D6528167\takundemo1\tMXAKUNDEMO\tLow"
// But may also arrive as a single unsplit string.
function parseDataLine(line: string): {
  ticket: string; user_name: string; full_name: string; group_name: string;
} {
  // Try tab-separated format first (fields separated by tabs)
  const tabParts = line.split(/\t+/).map((s) => s.trim()).filter(Boolean);
  if (tabParts.length >= 3) {
    // Format: [ticket, username, fullname, group] or [ticket, username, group]
    const { group_name, rest: joined } = extractGroup(tabParts.join(' '));
    const partsNoGroup = joined.split(/\s{2,}|\t+/).map((s) => s.trim()).filter(Boolean);
    
    // Re-extract from tab parts excluding group
    const cleanParts = tabParts.filter((p) => {
      const lower = p.toLowerCase();
      return !GROUPS.some((g) => g.toLowerCase() === lower);
    });

    if (cleanParts.length >= 3) {
      return {
        ticket: cleanParts[0],
        user_name: cleanParts[1],
        full_name: cleanParts.slice(2).join(' '),
        group_name,
      };
    }
    if (cleanParts.length === 2) {
      const { ticket, rest } = extractTicket(cleanParts[0]);
      if (ticket) {
        const uname = rest || cleanParts[1];
        const fname = rest ? cleanParts[1] : '';
        return { ticket, user_name: uname, full_name: fname, group_name };
      }
      return { ticket: '', user_name: cleanParts[0], full_name: cleanParts[1], group_name };
    }
  }

  // Fallback: space-based parsing
  const normalised = line.replace(/\s+/g, ' ').trim();

  // 1. Remove group from anywhere in the string
  const { group_name, rest: afterGroup } = extractGroup(normalised);

  // 2. Extract ticket from the front
  const { ticket, rest: afterTicket } = extractTicket(afterGroup);

  // 3. Everything left is username + fullname
  // Username = lowercase+digit prefix; fullname = uppercase words after
  const remaining = afterTicket.trim();

  // Find the first capital-letter word boundary that starts a run of UPPERCASE
  let splitIdx = -1;
  for (let i = 0; i < remaining.length; i++) {
    const ch = remaining[i];
    if (ch >= 'A' && ch <= 'Z') {
      splitIdx = i;
      break;
    }
  }

  let user_name = '';
  let full_name = '';
  if (splitIdx > 0) {
    user_name = remaining.slice(0, splitIdx).trim();
    full_name = remaining.slice(splitIdx).trim();
  } else if (splitIdx === 0) {
    full_name = remaining.trim();
  } else {
    user_name = remaining.trim();
  }

  return { ticket, user_name, full_name, group_name };
}

// ── Regex matchers ───────────────────────────────────────────────────────────
const DATE_RE = /^\d{1,2}[-/][A-Za-z]{3}[-/]\d{4}$/;
const TIME_RE = /^\d{1,2}:\d{2}(:\d{2})?$/;
const AMOUNT_RE = /^[\d]{1,3}([.,\s]\d{3})*([.,]\d{1,2})?$/;

function looksLikeAmount(s: string): boolean {
  const stripped = s.replace(/\s/g, '');
  return AMOUNT_RE.test(stripped) && parseAmount(stripped) > 0;
}

// ── Block splitter ──────────────────────────────────────────────────────────
// Scans lines for an anchored date, then collects time / data / amount lines.
// Tolerates blank lines between fields and extra whitespace.
// Data section may span multiple lines (e.g. ticket+username on one line,
// fullname+group on the next). All non-amount lines between time and amount
// are merged into a single data string.
function splitIntoBlocks(raw: string): [string, string, string, string][] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const blocks: [string, string, string, string][] = [];
  let i = 0;

  while (i < lines.length) {
    if (!DATE_RE.test(lines[i])) { i++; continue; }

    const dateLine = lines[i];
    let j = i + 1;

    // Find time line (must immediately follow or within next 2 lines)
    while (j < i + 3 && j < lines.length && !TIME_RE.test(lines[j])) j++;
    if (j >= lines.length || !TIME_RE.test(lines[j])) { i++; continue; }
    const timeLine = lines[j];

    // Collect all data lines until we hit an amount line (max 4 lines lookahead)
    j++;
    const dataLines: string[] = [];
    const maxLookahead = j + 5;
    while (j < lines.length && j < maxLookahead) {
      if (looksLikeAmount(lines[j])) break;
      dataLines.push(lines[j]);
      j++;
    }

    if (j >= lines.length || !looksLikeAmount(lines[j]) || dataLines.length === 0) {
      i++;
      continue;
    }
    const amountLine = lines[j];
    const dataLine = dataLines.join('\t');

    blocks.push([dateLine, timeLine, dataLine, amountLine]);
    i = j + 1;
  }

  return blocks;
}

// ── Public API ───────────────────────────────────────────────────────────────
export function parseRawTransactions(raw: string): ParsedTransaction[] {
  if (!raw.trim()) return [];

  const blocks = splitIntoBlocks(raw);
  return blocks
    .map(([dateLine, timeLine, dataLine, amountLine]) => {
      const amount = parseAmount(amountLine);
      if (!amount || amount <= 0) return null;
      const { ticket, user_name, full_name, group_name } = parseDataLine(dataLine);
      return {
        date: parseDate(dateLine, timeLine),
        time: timeLine,
        ticket,
        user_name,
        full_name,
        group_name,
        amount,
      };
    })
    .filter((r): r is ParsedTransaction => r !== null);
}

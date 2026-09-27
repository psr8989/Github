/* 채널 데이터 대시보드
 * - Raw_data.xlsx를 브라우저에서 SheetJS로 직접 읽는다 (엑셀 파일 자체가 데이터 소스).
 * - RAW 시트: 1행 헤더의 일반 표 → 그대로 조회/필터.
 * - Seller/Vis/Output/ETC/Rate: 행=지표, 열=(Period_Index, Period)인 가로(피벗) 시트.
 *   Cate0 열이 없고 RAW를 SUMIFS로 집계한 값이므로, Cate0 필터를 고르면
 *   "시트의 실제 수식"을 RAW의 해당 Cate0 행만 남긴 채 재계산한다.
 */
(function () {
  'use strict';

  // ───────────────────────── 설정 ─────────────────────────
  // names: 매칭할 실제 시트명 후보 (정확히 → 공백/대소문자 무시 순)
  const CHANNELS = [
    { id: 'Seller', names: ['Seller'], chart: true },
    { id: 'Vis', names: ['Vis'], chart: true },
    { id: 'Output', names: ['Output'], chart: true },
    { id: 'ETC', names: ['ETC'], chart: true },
    { id: 'Rate', names: ['Rate'], chart: true },
    { id: 'RAW Data', names: ['RAW Data', 'RAW'], chart: false, table: true },
  ];
  const FILTER_DIMS = ['Period_Index', 'Period', 'Cate0'];
  const DROPDOWN_DIMS = ['Period'];            // 드롭다운(체크박스 다중 선택)으로 보여줄 필터
  const SINGLE_DIMS = ['Period_Index'];        // '전체' 없이 반드시 1개만 선택하는 필터
  const DEFAULT_FILTERS = { Period_Index: ['Month'] }; // 파일을 불러오거나 초기화할 때의 기본 선택
  const DEFAULT_FILE = 'Raw_data.xlsx';

  // ───────────────────────── 유틸 ─────────────────────────
  const $ = (id) => document.getElementById(id);
  const norm = (s) => String(s == null ? '' : s).toLowerCase().replace(/[\s_\-]+/g, '');
  const isBlank = (v) => v === null || v === undefined ||
    (typeof v === 'string' && v.trim() === '') || (typeof v === 'number' && !isFinite(v));
  const keyOf = (v) => (isBlank(v) ? '' : String(v).trim());
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function toNum(v) {
    if (typeof v === 'number') return isFinite(v) ? v : null;
    if (typeof v !== 'string') return null;
    let s = v.trim().replace(/,/g, '');
    if (!s) return null;
    let pct = false;
    if (s.endsWith('%')) { pct = true; s = s.slice(0, -1); }
    if (!/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(s)) return null;
    const n = Number(s);
    return pct ? n / 100 : n;
  }

  const nfInt = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 });
  const nfDec = new Intl.NumberFormat('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const nfCompact = new Intl.NumberFormat('ko-KR', { notation: 'compact', maximumFractionDigits: 1 });
  function fmtFull(v) {
    if (v === null || v === undefined || !isFinite(v)) return '–';
    return Number.isInteger(v) ? nfInt.format(v) : nfDec.format(v);
  }
  function fmtCompact(v) {
    if (v === null || !isFinite(v)) return '–';
    if (Math.abs(v) < 1000) return Number.isInteger(v) ? String(v) : nfDec.format(v);
    return nfCompact.format(v);
  }
  // 막대 값 라벨: 10만 미만은 전체 숫자, 그 이상은 유효숫자 3자리 축약(예: 45.7억)
  const nfSig3 = new Intl.NumberFormat('ko-KR', { notation: 'compact', maximumSignificantDigits: 3 });
  function fmtBar(v) {
    if (v === null || v === undefined || !isFinite(v)) return '';
    const a = Math.abs(v);
    if (a >= 100000) return nfSig3.format(v);
    if (Number.isInteger(v) || a >= 1000) return nfInt.format(v);
    return nfDec.format(v);
  }
  function naturalSort(a, b) {
    const na = toNum(a), nb = toNum(b);
    if (na !== null && nb !== null) return na - nb;
    return String(a).localeCompare(String(b), 'ko');
  }

  // ───────────────────────── 시트 읽기 ─────────────────────────
  function cellVal(cell) {
    if (!cell || cell.t === 'e' || cell.t === 'z' || cell.v === undefined) return null;
    return cell.v;
  }
  function readGrid(ws) {
    if (!ws || !ws['!ref']) return [];
    const rg = XLSX.utils.decode_range(ws['!ref']);
    const g = [];
    for (let r = 0; r <= rg.e.r; r++) {
      const row = [];
      for (let c = 0; c <= rg.e.c; c++) row.push(cellVal(ws[XLSX.utils.encode_cell({ r, c })]));
      g.push(row);
    }
    return g;
  }

  function findSheet(wb, ch) {
    for (const n of ch.names) if (wb.SheetNames.includes(n)) return n;
    for (const n of ch.names) {
      const hit = wb.SheetNames.find((s) => norm(s) === norm(n));
      if (hit) return hit;
    }
    if (ch.table) {
      const hit = wb.SheetNames.find((s) => norm(s).startsWith(norm(ch.names[ch.names.length - 1])));
      if (hit) return hit;
    }
    return null;
  }

  // 일반 표(헤더 1행 + 데이터 행)
  function parseTable(grid, sheetName) {
    const h = grid.findIndex((row) => row.some((v) => !isBlank(v)));
    if (h < 0) return { kind: 'table', sheetName, columns: [], rows: [], colIdx: {} };
    const width = Math.max(...grid.map((r) => r.length));
    const used = [];
    for (let c = 0; c < width; c++) {
      if (grid.slice(h).some((row) => !isBlank(row[c]))) used.push(c);
    }
    const seen = {};
    const columns = used.map((c) => {
      let name = isBlank(grid[h][c]) ? 'Column_' + XLSX.utils.encode_col(c) : String(grid[h][c]).trim();
      if (seen[name]) name = name + '_' + (++seen[name]); else seen[name] = 1;
      return { name, c, numeric: false, dim: false };
    });
    const rows = [];
    for (let r = h + 1; r < grid.length; r++) {
      const row = grid[r];
      if (!row.some((v) => !isBlank(v))) continue;
      const o = { __r: r };
      columns.forEach((col) => { o[col.name] = isBlank(row[col.c]) ? null : row[col.c]; });
      rows.push(o);
    }
    // 필터 차원은 문자열 키로, 나머지는 모든 값이 숫자로 해석되면 수치형으로 변환
    columns.forEach((col) => {
      col.dim = FILTER_DIMS.some((d) => norm(d) === norm(col.name));
      if (col.dim) return;
      const vals = rows.map((o) => o[col.name]).filter((v) => v !== null);
      if (vals.length && vals.every((v) => toNum(v) !== null)) {
        col.numeric = true;
        rows.forEach((o) => { o[col.name] = toNum(o[col.name]); });
      }
    });
    const colIdx = {};
    columns.forEach((col) => { colIdx[col.name] = col.c; });
    return { kind: 'table', sheetName, columns, rows, colIdx, headerRow: h };
  }

  // 가로(피벗) 시트: 위쪽 헤더 행들 = 차원, 왼쪽 라벨 열 = 지표
  function parsePivot(grid, sheetName, raw) {
    const first = grid.findIndex((row) => row.some((v) => !isBlank(v)));
    if (first < 0) return null;
    const hasNumRight = (row, c) => row.slice(c + 1).some((v) => toNum(v) !== null);
    let labelCol = Infinity;
    grid.forEach((row) => {
      const c = row.findIndex((v) => typeof v === 'string' && v.trim() !== '');
      if (c >= 0 && hasNumRight(row, c)) labelCol = Math.min(labelCol, c);
    });
    if (!isFinite(labelCol)) return null;
    // 맨 윗줄에 라벨 열 값이 있으면 일반 표로 본다
    if (!isBlank(grid[first][labelCol])) return null;

    const dataRows = [];
    grid.forEach((row, r) => {
      const v = row[labelCol];
      if (typeof v === 'string' && v.trim() !== '' && hasNumRight(row, labelCol)) dataRows.push(r);
    });
    if (!dataRows.length) return null;
    const firstData = dataRows[0];
    const headerRows = [];
    for (let r = first; r < firstData; r++) if (grid[r].slice(labelCol + 1).some((v) => !isBlank(v))) headerRows.push(r);
    if (!headerRows.length) return null;

    const width = Math.max(...grid.map((r) => r.length));
    const valueCols = [];
    for (let c = labelCol + 1; c < width; c++) {
      if (headerRows.concat(dataRows).some((r) => !isBlank(grid[r][c]))) valueCols.push(c);
    }

    // 헤더 행 이름: RAW의 어떤 열 값 집합에 모두 포함되는지로 판별 (필터 차원 우선)
    const rawSets = [];
    if (raw) {
      const order = raw.columns.slice().sort((a, b) => (b.dim ? 1 : 0) - (a.dim ? 1 : 0));
      order.forEach((col) => rawSets.push({ name: col.name, set: new Set(raw.rows.map((o) => keyOf(o[col.name]))) }));
    }
    const usedNames = new Set();
    const dims = headerRows.map((r, i) => {
      const keys = valueCols.map((c) => keyOf(grid[r][c])).filter((k) => k !== '');
      let name = null;
      for (const s of rawSets) {
        if (!usedNames.has(s.name) && keys.length && keys.every((k) => s.set.has(k))) { name = s.name; break; }
      }
      if (!name) name = !isBlank(grid[r][labelCol]) ? String(grid[r][labelCol]).trim() : '헤더' + (i + 1);
      usedNames.add(name);
      return { name, row: r };
    });

    const seen = {};
    const metrics = dataRows.map((r) => {
      let label = String(grid[r][labelCol]).trim();
      if (seen[label]) label += ' (' + (++seen[label]) + ')'; else seen[label] = 1;
      return { label, r };
    });
    const cols = valueCols.map((c) => {
      const keys = {}, disp = {};
      dims.forEach((d) => { keys[d.name] = keyOf(grid[d.row][c]); disp[d.name] = grid[d.row][c]; });
      return { c, keys, disp };
    });
    const cached = metrics.map((m) => cols.map((col) => toNum(grid[m.r][col.c])));
    return { kind: 'pivot', sheetName, labelCol, dims, metrics, cols, cached, recalc: { ok: false, reason: '' } };
  }

  // ───────────────────────── 수식 계산기 ─────────────────────────
  // 이 통합문서에 쓰인 SUMIFS / 셀 참조 사칙연산 등을 해석해, RAW 행 필터를 걸고 재계산한다.
  class ExcelError extends Error {}
  class Unsupported extends Error {}

  function tokenize(src) {
    const toks = [];
    let i = 0;
    const refRe = /^(\$?[A-Za-z]{1,3}\$?\d+:\$?[A-Za-z]{1,3}\$?\d+|\$?[A-Za-z]{1,3}:\$?[A-Za-z]{1,3}|\$?\d+:\$?\d+|\$?[A-Za-z]{1,3}\$?\d+)(?![\w(])/;
    while (i < src.length) {
      const rest = src.slice(i);
      let m;
      if (/^\s/.test(rest)) { i++; continue; }
      if ((m = /^(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?/.exec(rest))) { toks.push({ t: 'num', v: Number(m[0]) }); i += m[0].length; continue; }
      if (rest[0] === '"') {
        let j = 1, s = '';
        while (j < rest.length) {
          if (rest[j] === '"') { if (rest[j + 1] === '"') { s += '"'; j += 2; continue; } break; }
          s += rest[j++];
        }
        toks.push({ t: 'str', v: s }); i += j + 1; continue;
      }
      let sheet = null, len = 0;
      if ((m = /^'((?:[^']|'')+)'!/.exec(rest))) { sheet = m[1].replace(/''/g, "'"); len = m[0].length; }
      else if ((m = /^([A-Za-z_\u0080-￿][\w.\u0080-￿]*)!/.exec(rest))) { sheet = m[1]; len = m[0].length; }
      if (sheet !== null) {
        const r2 = refRe.exec(rest.slice(len));
        if (!r2) throw new Unsupported('참조 해석 실패: ' + rest.slice(0, 20));
        toks.push({ t: 'ref', sheet, a: r2[0] }); i += len + r2[0].length; continue;
      }
      if ((m = /^([A-Za-z_][\w.]*)\s*\(/.exec(rest))) { toks.push({ t: 'fn', v: m[1].toUpperCase() }); i += m[0].length; continue; }
      if ((m = refRe.exec(rest))) { toks.push({ t: 'ref', sheet: null, a: m[0] }); i += m[0].length; continue; }
      if ((m = /^(TRUE|FALSE)\b/i.exec(rest))) { toks.push({ t: 'num', v: m[0].toUpperCase() === 'TRUE' ? 1 : 0 }); i += m[0].length; continue; }
      if ((m = /^(<=|>=|<>|[-+*/^&=<>(),;%])/.exec(rest))) { toks.push({ t: 'op', v: m[0] === ';' ? ',' : m[0] }); i += m[0].length; continue; }
      throw new Unsupported('알 수 없는 토큰: ' + rest.slice(0, 10));
    }
    return toks;
  }

  function parseFormula(src) {
    const toks = tokenize(src);
    let p = 0;
    const peek = () => toks[p];
    const isOp = (v) => peek() && peek().t === 'op' && peek().v === v;
    const eat = (v) => { if (!isOp(v)) throw new Unsupported('구문 오류: ' + v + ' 필요'); p++; };
    function bin(next, ops) {
      return function () {
        let a = next();
        while (peek() && peek().t === 'op' && ops.includes(peek().v)) { const op = toks[p++].v; a = { t: 'bin', op, a, b: next() }; }
        return a;
      };
    }
    function unary() {
      if (isOp('-')) { p++; return { t: 'neg', a: unary() }; }
      if (isOp('+')) { p++; return unary(); }
      let a = primary();
      while (isOp('%')) { p++; a = { t: 'pct', a }; }
      return a;
    }
    const power = bin(unary, ['^']);
    const mul = bin(power, ['*', '/']);
    const add = bin(mul, ['+', '-']);
    const cat = bin(add, ['&']);
    const cmp = bin(cat, ['=', '<>', '<', '>', '<=', '>=']);
    function primary() {
      const tk = toks[p++];
      if (!tk) throw new Unsupported('수식이 끝남');
      if (tk.t === 'num' || tk.t === 'str') return tk;
      if (tk.t === 'ref') return tk;
      if (tk.t === 'fn') {
        const args = [];
        if (!isOp(')')) { do { args.push(cmp()); } while (isOp(',') && ++p); }
        eat(')');
        return { t: 'call', name: tk.v, args };
      }
      if (tk.t === 'op' && tk.v === '(') { const e = cmp(); eat(')'); return e; }
      throw new Unsupported('예상치 못한 토큰');
    }
    const ast = cmp();
    if (p !== toks.length) throw new Unsupported('남은 토큰 있음');
    return ast;
  }

  const astCache = new Map();
  function getAst(f) {
    if (!astCache.has(f)) {
      try { astCache.set(f, parseFormula(f)); } catch (e) { astCache.set(f, e); }
    }
    const a = astCache.get(f);
    if (a instanceof Error) throw a;
    return a;
  }

  function matchCriterion(val, crit) {
    if (typeof crit === 'number') {
      const n = toNum(val);
      return n !== null && n === crit;
    }
    let s = crit == null ? '' : String(crit);
    let op = '=';
    const m = /^(<=|>=|<>|=|<|>)/.exec(s);
    if (m) { op = m[1]; s = s.slice(m[1].length); }
    const cn = toNum(s), vn = toNum(val);
    if (cn !== null && (op !== '=' && op !== '<>' || vn !== null)) {
      if (vn === null) return op === '<>';
      switch (op) {
        case '=': return vn === cn; case '<>': return vn !== cn;
        case '<': return vn < cn; case '>': return vn > cn;
        case '<=': return vn <= cn; case '>=': return vn >= cn;
      }
    }
    const vs = keyOf(val).toLowerCase(), cs = s.toLowerCase();
    let eq;
    if (/[*?]/.test(cs)) {
      const re = new RegExp('^' + cs.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
      eq = re.test(vs);
    } else eq = vs === cs;
    if (op === '=') return eq;
    if (op === '<>') return !eq;
    return false;
  }

  class Evaluator {
    // rowFilter: { [sheetName]: (r) => boolean } — 범위 참조 시 false인 행은 없는 것으로 취급
    constructor(wb, rowFilter) { this.wb = wb; this.rowFilter = rowFilter || {}; this.memo = new Map(); this.stack = new Set(); }
    sheet(name) {
      if (this.wb.Sheets[name]) return name;
      const hit = this.wb.SheetNames.find((s) => s.toLowerCase() === String(name).toLowerCase());
      if (!hit) throw new ExcelError('#REF!');
      return hit;
    }
    cell(sheet, r, c) {
      const key = sheet + '!' + r + ',' + c;
      if (this.memo.has(key)) return this.memo.get(key);
      const ws = this.wb.Sheets[sheet];
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      let v;
      if (cell && cell.f && !cell.F) {
        if (this.stack.has(key)) throw new Unsupported('순환 참조');
        this.stack.add(key);
        try { v = this.evalNode(getAst(cell.f), sheet); } finally { this.stack.delete(key); }
        if (v && v.range) v = this.firstOf(v);
      } else {
        if (cell && cell.t === 'e') throw new ExcelError(cell.w || '#N/A');
        v = cellVal(cell);
      }
      this.memo.set(key, v);
      return v;
    }
    evalFormulaAt(sheet, r, c) {
      const ws = this.wb.Sheets[sheet];
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (!cell || !cell.f) return null;
      try { return toNum(this.cell(sheet, r, c)); } catch (e) { if (e instanceof ExcelError) return null; throw e; }
    }
    resolveRef(node, ctxSheet) {
      const sheet = this.sheet(node.sheet || ctxSheet);
      const a = node.a.replace(/\$/g, '').toUpperCase();
      if (!a.includes(':')) {
        const d = XLSX.utils.decode_cell(a);
        return { sheet, r1: d.r, c1: d.c, r2: d.r, c2: d.c, single: true };
      }
      const ws = this.wb.Sheets[sheet];
      const bounds = ws['!ref'] ? XLSX.utils.decode_range(ws['!ref']) : { s: { r: 0, c: 0 }, e: { r: 0, c: 0 } };
      const [p1, p2] = a.split(':');
      if (/^[A-Z]+$/.test(p1)) {
        return { sheet, r1: 0, r2: bounds.e.r, c1: XLSX.utils.decode_col(p1), c2: XLSX.utils.decode_col(p2), range: true };
      }
      if (/^\d+$/.test(p1)) {
        return { sheet, r1: Number(p1) - 1, r2: Number(p2) - 1, c1: 0, c2: bounds.e.c, range: true };
      }
      const d1 = XLSX.utils.decode_cell(p1), d2 = XLSX.utils.decode_cell(p2);
      return { sheet, r1: Math.min(d1.r, d2.r), r2: Math.max(d1.r, d2.r), c1: Math.min(d1.c, d2.c), c2: Math.max(d1.c, d2.c), range: true };
    }
    // 범위 값을 [행오프셋][열오프셋]으로 (필터된 행은 undefined)
    rangeCells(rg) {
      const f = this.rowFilter[rg.sheet];
      const out = [];
      for (let r = rg.r1; r <= rg.r2; r++) {
        if (f && !f(r)) { out.push(undefined); continue; }
        const row = [];
        for (let c = rg.c1; c <= rg.c2; c++) row.push(this.cell(rg.sheet, r, c));
        out.push(row);
      }
      return out;
    }
    firstOf(rg) { return this.cell(rg.sheet, rg.r1, rg.c1); }
    scalar(node, ctx) {
      const v = this.evalNode(node, ctx);
      return v && v.range ? this.firstOf(v) : v;
    }
    num(node, ctx) {
      const v = this.scalar(node, ctx);
      if (v === null || v === undefined || v === '') return 0;
      if (typeof v === 'boolean') return v ? 1 : 0;
      const n = toNum(v);
      if (n === null) throw new ExcelError('#VALUE!');
      return n;
    }
    evalNode(n, ctx) {
      switch (n.t) {
        case 'num': case 'str': return n.v;
        case 'ref': {
          const rg = this.resolveRef(n, ctx);
          return rg.single ? this.cell(rg.sheet, rg.r1, rg.c1) : rg;
        }
        case 'neg': return -this.num(n.a, ctx);
        case 'pct': return this.num(n.a, ctx) / 100;
        case 'bin': {
          const op = n.op;
          if (op === '&') return keyOf(this.scalar(n.a, ctx)) + keyOf(this.scalar(n.b, ctx));
          if (['=', '<>', '<', '>', '<=', '>='].includes(op)) {
            const a = this.scalar(n.a, ctx), b = this.scalar(n.b, ctx);
            const an = toNum(a), bn = toNum(b);
            const x = an !== null && bn !== null ? an : keyOf(a).toLowerCase();
            const y = an !== null && bn !== null ? bn : keyOf(b).toLowerCase();
            return { '=': x === y, '<>': x !== y, '<': x < y, '>': x > y, '<=': x <= y, '>=': x >= y }[op];
          }
          const a = this.num(n.a, ctx), b = this.num(n.b, ctx);
          if (op === '+') return a + b;
          if (op === '-') return a - b;
          if (op === '*') return a * b;
          if (op === '/') { if (b === 0) throw new ExcelError('#DIV/0!'); return a / b; }
          if (op === '^') return Math.pow(a, b);
          throw new Unsupported(op);
        }
        case 'call': return this.call(n, ctx);
      }
      throw new Unsupported('노드');
    }
    toRange(node, ctx) {
      const v = this.evalNode(node, ctx);
      if (v && v.range) return v;
      if (node.t === 'ref') return this.resolveRef(node, ctx);
      throw new Unsupported('범위가 필요합니다');
    }
    sumIfs(sumRg, pairs) {
      const sum = this.rangeCells(sumRg);
      const crits = pairs.map(([rg, c]) => [this.rangeCells(rg), c]);
      let total = 0;
      for (let i = 0; i < sum.length; i++) {
        if (!sum[i]) continue;
        let ok = true;
        for (const [cells, c] of crits) {
          if (!cells[i] || !matchCriterion(cells[i][0], c)) { ok = false; break; }
        }
        if (ok) for (const v of sum[i]) if (typeof v === 'number') total += v;
      }
      return total;
    }
    call(n, ctx) {
      const A = n.args;
      switch (n.name) {
        case 'SUM': {
          let t = 0;
          for (const a of A) {
            const v = this.evalNode(a, ctx);
            if (v && v.range) this.rangeCells(v).forEach((row) => row && row.forEach((x) => { if (typeof x === 'number') t += x; }));
            else t += this.num(a, ctx);
          }
          return t;
        }
        case 'SUMIFS': {
          const pairs = [];
          for (let i = 1; i < A.length; i += 2) pairs.push([this.toRange(A[i], ctx), this.scalar(A[i + 1], ctx)]);
          return this.sumIfs(this.toRange(A[0], ctx), pairs);
        }
        case 'SUMIF': {
          const rg = this.toRange(A[0], ctx);
          const sumRg = A[2] ? this.toRange(A[2], ctx) : rg;
          return this.sumIfs(sumRg, [[rg, this.scalar(A[1], ctx)]]);
        }
        case 'IFERROR': {
          try { return this.scalar(A[0], ctx); } catch (e) { if (e instanceof ExcelError) return this.scalar(A[1], ctx); throw e; }
        }
        case 'IF': {
          const c = this.scalar(A[0], ctx);
          const truthy = typeof c === 'string' ? c !== '' : !!toNum(c) || c === true;
          return truthy ? this.scalar(A[1], ctx) : (A[2] ? this.scalar(A[2], ctx) : false);
        }
        case 'ABS': return Math.abs(this.num(A[0], ctx));
        case 'ROUND': { const k = Math.pow(10, A[1] ? this.num(A[1], ctx) : 0); return Math.round(this.num(A[0], ctx) * k) / k; }
      }
      throw new Unsupported('지원하지 않는 함수: ' + n.name);
    }
  }

  // ───────────────────────── 모델 구성 ─────────────────────────
  function buildModel(wb) {
    const model = { wb, raw: null, rawSheet: null, channels: {}, dimCol: {}, options: {} };
    const rawCh = CHANNELS.find((c) => c.table);
    const rawName = findSheet(wb, rawCh);
    if (rawName) {
      model.rawSheet = rawName;
      model.raw = parseTable(readGrid(wb.Sheets[rawName]), rawName);
    }
    if (model.raw) {
      FILTER_DIMS.forEach((d) => {
        const col = model.raw.columns.find((c) => norm(c.name) === norm(d));
        if (col) model.dimCol[d] = col.name;
      });
    }
    CHANNELS.forEach((ch) => {
      const name = ch.table ? rawName : findSheet(wb, ch);
      if (!name) { model.channels[ch.id] = null; return; }
      if (ch.table) { model.channels[ch.id] = model.raw; return; }
      const grid = readGrid(wb.Sheets[name]);
      const data = parsePivot(grid, name, model.raw) || parseTable(grid, name);
      if (data.kind === 'pivot') {
        // 피벗 차원 이름을 필터 차원(Period_Index 등)과 연결
        data.dims.forEach((d) => {
          const f = FILTER_DIMS.find((fd) => model.dimCol[fd] === d.name || norm(fd) === norm(d.name));
          d.filter = f || null;
        });
        checkRecalc(model, data);
      }
      model.channels[ch.id] = data;
    });
    // 필터 옵션: RAW 값(없으면 피벗 헤더 값)을 기준으로 수집
    FILTER_DIMS.forEach((d) => {
      const seen = new Map();
      const add = (v) => { const k = keyOf(v); if (!seen.has(k)) seen.set(k, v); };
      if (model.dimCol[d]) model.raw.rows.forEach((o) => add(o[model.dimCol[d]]));
      Object.values(model.channels).forEach((data) => {
        if (data && data.kind === 'pivot') data.dims.filter((x) => x.filter === d).forEach((x) => data.cols.forEach((c) => add(c.keys[x.name])));
      });
      let keys = [...seen.keys()];
      const allNum = keys.filter((k) => k !== '').every((k) => toNum(k) !== null);
      if (allNum) keys.sort(naturalSort);
      if (keys.includes('')) keys = keys.filter((k) => k !== '').concat(['']);
      model.options[d] = keys;
    });
    return model;
  }

  // 수식을 필터 없이 계산해 엑셀에 저장된 값과 모두 일치할 때만 Cate0 재계산을 허용
  function checkRecalc(model, data) {
    const hasFormula = data.metrics.some((m) => data.cols.some((col) => {
      const cell = model.wb.Sheets[data.sheetName][XLSX.utils.encode_cell({ r: m.r, c: col.c })];
      return cell && cell.f;
    }));
    if (!hasFormula) { data.recalc = { ok: false, reason: '시트에 수식이 없어(값만 저장) RAW 기준 재계산을 할 수 없습니다.' }; return; }
    if (!model.raw) { data.recalc = { ok: false, reason: 'RAW 시트를 찾지 못했습니다.' }; return; }
    try {
      const ev = new Evaluator(model.wb, {});
      let bad = 0;
      data.metrics.forEach((m, mi) => data.cols.forEach((col, ci) => {
        const v = ev.evalFormulaAt(data.sheetName, m.r, col.c);
        const c = data.cached[mi][ci];
        const cell = model.wb.Sheets[data.sheetName][XLSX.utils.encode_cell({ r: m.r, c: col.c })];
        if (!cell || !cell.f) return;
        if (v === null && c === null) return;
        if (v === null || c === null || Math.abs(v - c) > 1e-6 * Math.max(1, Math.abs(c))) bad++;
      }));
      data.recalc = bad ? { ok: false, reason: '수식 재계산 결과가 저장값과 ' + bad + '개 셀에서 달라 원본값을 표시합니다.' } : { ok: true, reason: '' };
    } catch (e) {
      data.recalc = { ok: false, reason: '수식 재계산 불가 (' + e.message + ')' };
    }
  }

  // ───────────────────────── 상태 & 뷰 계산 ─────────────────────────
  const state = {
    model: null, fileName: '', channel: 'Seller', sort: null, ddOpen: null,
    filters: Object.fromEntries(FILTER_DIMS.map((d) => [d, new Set()])),
  };
  const selActive = (d) => state.filters[d].size > 0;
  const passes = (d, v) => !selActive(d) || state.filters[d].has(keyOf(v));

  function computeView() {
    const m = state.model;
    const data = m.channels[state.channel];
    if (!data) return { empty: '이 통합문서에 해당 시트가 없습니다.', columns: [], rows: [], charts: [] };

    if (data.kind === 'table') {
      const rows = data.rows.filter((o) => FILTER_DIMS.every((d) => {
        const col = data.columns.find((c) => norm(c.name) === norm(d));
        return !col || passes(d, o[col.name]);
      }));
      return { data, columns: data.columns, rows, charts: [], notes: [] };
    }

    // 피벗 시트
    const pivotDims = new Set(data.dims.map((d) => d.filter).filter(Boolean));
    const colIdx = data.cols.map((_, i) => i).filter((i) => data.dims.every((d) => !d.filter || passes(d.filter, data.cols[i].keys[d.name])));
    // 시트에 없는 차원(Cate0 등)은 RAW 행 필터로 수식 재계산
    const rawDims = FILTER_DIMS.filter((d) => !pivotDims.has(d) && m.dimCol[d] && selActive(d) &&
      state.filters[d].size < m.options[d].length);
    let values = data.cached;
    const notes = [];
    let basis = '시트 저장값';
    let filterTag = '';
    if (rawDims.length) {
      if (data.recalc.ok) {
        const rowSet = new Set(m.raw.rows.map((o) => o.__r));
        const byRow = new Map(m.raw.rows.map((o) => [o.__r, o]));
        const filt = (r) => {
          if (!rowSet.has(r)) return true; // 헤더 등 데이터 외 행은 그대로
          const o = byRow.get(r);
          return rawDims.every((d) => passes(d, o[m.dimCol[d]]));
        };
        const ev = new Evaluator(m.wb, { [m.rawSheet]: filt });
        values = data.metrics.map((mt, mi) => data.cols.map((col, ci) => {
          const cell = m.wb.Sheets[data.sheetName][XLSX.utils.encode_cell({ r: mt.r, c: col.c })];
          return cell && cell.f ? ev.evalFormulaAt(data.sheetName, mt.r, col.c) : data.cached[mi][ci];
        }));
        basis = 'RAW에서 ' + rawDims.map((d) => d + '=' + [...state.filters[d]].map((k) => k || '(빈 값)').join('·')).join(', ') + ' 행만으로 수식 재계산';
        filterTag = rawDims.map((d) => d + ': ' + [...state.filters[d]].map((k) => k || '(빈 값)').join(', ')).join(' / ');
      } else {
        notes.push(data.recalc.reason);
      }
    }
    const dimCols = data.dims.map((d) => ({ name: d.name, dim: true, numeric: false }));
    const metricCols = data.metrics.map((mt) => ({ name: mt.label, numeric: true }));
    const rows = colIdx.map((ci) => {
      const o = {};
      data.dims.forEach((d) => { o[d.name] = data.cols[ci].disp[d.name]; });
      data.metrics.forEach((mt, mi) => { o[mt.label] = values[mi][ci]; });
      return o;
    });
    // 그래프: 지표별 카드, 첫 번째 차원(Period_Index) 값별로 패널을 나눠 각자 축을 가진다
    const groupDim = data.dims.length > 1 ? data.dims[0] : null;
    const labelDims = groupDim ? data.dims.slice(1) : data.dims;
    const charts = data.metrics.map((mt, mi) => {
      const panels = [];
      const byGroup = new Map();
      colIdx.forEach((ci) => {
        const col = data.cols[ci];
        const g = groupDim ? col.keys[groupDim.name] : '';
        if (!byGroup.has(g)) { byGroup.set(g, { group: g, points: [] }); panels.push(byGroup.get(g)); }
        byGroup.get(g).points.push({
          label: labelDims.map((d) => col.keys[d.name]).join(' · ') || XLSX.utils.encode_col(col.c),
          value: values[mi][ci],
          keys: col.keys,
        });
      });
      return { metric: mt.label, panels };
    });
    return { data, columns: dimCols.concat(metricCols), rows, charts, notes, basis, filterTag, colIdx, values, groupDim };
  }

  // 다른 필터 조건을 적용했을 때 이 값이 존재하는지 (칩 비활성화용)
  function availability(dim) {
    const m = state.model, data = m.channels[state.channel];
    const all = new Set(m.options[dim]);
    if (!data) return new Set();
    if (data.kind === 'table') {
      const col = data.columns.find((c) => norm(c.name) === norm(dim));
      if (!col) return new Set();
      const s = new Set();
      data.rows.forEach((o) => {
        const ok = FILTER_DIMS.every((d) => {
          if (d === dim) return true;
          const c2 = data.columns.find((c) => norm(c.name) === norm(d));
          return !c2 || passes(d, o[c2.name]);
        });
        if (ok) s.add(keyOf(o[col.name]));
      });
      return s;
    }
    const pd = data.dims.find((d) => d.filter === dim);
    if (!pd) return data.recalc.ok && m.dimCol[dim] ? all : new Set();
    const s = new Set();
    data.cols.forEach((col) => {
      const ok = data.dims.every((d) => !d.filter || d.filter === dim || passes(d.filter, col.keys[d.name]));
      if (ok) s.add(col.keys[pd.name]);
    });
    return s;
  }

  // ───────────────────────── 렌더링 ─────────────────────────
  function render() {
    renderTabs();
    renderFilters();
    const view = computeView();
    renderContext(view);
    renderTable(view);
    renderCharts(view);
  }

  function renderTabs() {
    const m = state.model;
    $('channelTabs').innerHTML = CHANNELS.map((ch) => {
      const data = m.channels[ch.id];
      const title = data ? '시트: ' + data.sheetName : '시트 없음';
      return '<button type="button" role="tab" class="tab" data-ch="' + esc(ch.id) + '" aria-selected="' + (state.channel === ch.id) + '"' +
        ' title="' + esc(title) + '"' + (data ? '' : ' disabled') + '>' + esc(ch.id) + '</button>';
    }).join('');
  }

  const optLabel = (k) => (k === '' ? '(빈 값)' : k);

  function renderFilters() {
    const m = state.model;
    const data = m.channels[state.channel];
    const prevMenu = document.querySelector('.dd-menu');
    const menuScroll = prevMenu ? prevMenu.scrollTop : 0;
    $('filters').innerHTML = FILTER_DIMS.map((d) => {
      const opts = m.options[d] || [];
      if (!opts.length) return '';
      const avail = availability(d);
      const notApplicable = avail.size === 0;
      let note = '';
      if (data && data.kind === 'pivot' && !data.dims.some((x) => x.filter === d)) {
        note = data.recalc.ok
          ? '이 시트에는 ' + d + ' 열이 없어, 선택 시 RAW 해당 행만으로 시트 수식을 재계산합니다.'
          : '이 시트에는 적용할 수 없습니다 — ' + data.recalc.reason;
      }
      const name = '<span class="fname"' + (note ? ' title="' + esc(note) + '"' : '') + '>' + esc(m.dimCol[d] || d) +
        (note ? '<sup aria-hidden="true">*</sup>' : '') + '</span>';

      if (DROPDOWN_DIMS.includes(d)) {
        const sel = [...state.filters[d]];
        const label = !sel.length ? '전체' : sel.length === 1 ? optLabel(sel[0]) : sel.length + '개 선택';
        const open = state.ddOpen === d;
        const items = ['<label class="dd-item all"><input type="checkbox" data-dim="' + esc(d) + '" data-all="1"' +
          (sel.length ? '' : ' checked') + '> 전체</label>']
          .concat(opts.map((k) => {
            const on = state.filters[d].has(k);
            const dis = !avail.has(k) && !on;
            return '<label class="dd-item' + (dis ? ' dis' : '') + '"><input type="checkbox" data-dim="' + esc(d) + '" data-key="' + esc(k) + '"' +
              (on ? ' checked' : '') + (dis ? ' disabled' : '') + '> ' + esc(optLabel(k)) + '</label>';
          }));
        return '<div class="fgroup">' + name + '<div class="dd" data-dim="' + esc(d) + '">' +
          '<button type="button" class="dd-btn' + (sel.length ? ' on' : '') + '" aria-haspopup="true" aria-expanded="' + open + '"' +
          (notApplicable ? ' disabled' : '') + '><span>' + esc(label) + '</span><span class="caret" aria-hidden="true">▾</span></button>' +
          '<div class="dd-menu"' + (open ? '' : ' hidden') + '>' + items.join('') + '</div></div></div>';
      }

      const single = SINGLE_DIMS.includes(d);
      const chips = (single ? [] : ['<button type="button" class="chip all' + (selActive(d) ? '' : ' on') + '" data-dim="' + esc(d) + '" data-all="1"' + (notApplicable ? ' disabled' : '') + '>전체</button>'])
        .concat(opts.map((k) => {
          const on = state.filters[d].has(k);
          const dis = !single && !avail.has(k) && !on; // 단일 선택은 항상 전환 가능 (전환 시 pruneUnavailable)
          return '<button type="button" class="chip' + (on ? ' on' : '') + '" data-dim="' + esc(d) + '" data-key="' + esc(k) + '"' +
            (dis ? ' disabled' : '') + ' aria-pressed="' + on + '">' + esc(optLabel(k)) + '</button>';
        }));
      return '<div class="fgroup">' + name + '<div class="chips">' + chips.join('') + '</div></div>';
    }).join('');
    const menu = document.querySelector('.dd-menu:not([hidden])');
    if (menu) menu.scrollTop = menuScroll;
  }

  function renderContext(view) {
    // 재계산 불가 등 경고만 표시 (평소에는 비어 있어 숨김)
    $('context').innerHTML = (view.notes || []).map((n) => '<span class="warn">' + esc(n) + '</span>').join('');
  }

  function renderTable(view) {
    const wrap = $('tableWrap');
    const isPivot = view.data && view.data.kind === 'pivot';
    $('tableTitle').innerHTML = '데이터 테이블 <span class="badge">' + esc(state.channel) + '</span>';
    if (view.empty) { wrap.innerHTML = '<div class="empty">' + esc(view.empty) + '</div>'; return; }
    if (!view.rows.length) { wrap.innerHTML = '<div class="empty">선택한 조건에 맞는 데이터가 없습니다.</div>'; return; }
    if (isPivot) { wrap.innerHTML = sheetLayoutTable(view); return; }

    let rows = view.rows.slice();
    if (state.sort && view.columns.some((c) => c.name === state.sort.col)) {
      const { col, dir } = state.sort;
      rows.sort((a, b) => {
        const x = a[col], y = b[col];
        if (x === null || x === undefined) return 1;
        if (y === null || y === undefined) return -1;
        return naturalSort(x, y) * dir;
      });
    }
    const head = view.columns.map((c) => {
      const arrow = state.sort && state.sort.col === c.name ? '<span class="arrow">' + (state.sort.dir > 0 ? '▲' : '▼') + '</span>' : '';
      return '<th class="' + (c.numeric ? 'num' : '') + '" data-sort="' + esc(c.name) + '" title="클릭하여 정렬">' + esc(c.name) + arrow + '</th>';
    }).join('');
    const body = rows.map((o) => '<tr>' + view.columns.map((c) => {
      const v = o[c.name];
      if (v === null || v === undefined || v === '') return '<td class="null' + (c.numeric ? ' num' : '') + '">–</td>';
      if (c.numeric) return '<td class="num">' + (typeof v === 'number' ? fmtFull(v) : esc(v)) + '</td>';
      return '<td class="' + (c.dim ? 'dim' : '') + '">' + esc(v) + '</td>';
    }).join('') + '</tr>').join('');
    wrap.innerHTML = '<table><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table>';
  }

  // 엑셀 시트와 같은 모양(행=지표, 열=기간)으로 보여주기
  function sheetLayoutTable(view) {
    const data = view.data;
    const cols = view.colIdx.map((ci) => data.cols[ci]);
    const top = data.dims.length ? data.dims[data.dims.length - 1] : null;
    const head = '<th class="rowhead">' + (top ? esc(top.name) : '') + '</th>' +
      cols.map((c) => '<th class="num">' + (top ? esc(keyOf(c.disp[top.name])) : '') + '</th>').join('');
    // 단일 선택 필터(Period_Index)는 이미 하나로 정해져 있으므로 행으로 보여주지 않음
    const dimRows = data.dims.slice(0, -1).filter((d) => !SINGLE_DIMS.includes(d.filter)).map((d) => '<tr class="hdr"><td class="rowhead">' + esc(d.name) + '</td>' +
      cols.map((c) => '<td class="num">' + esc(keyOf(c.disp[d.name])) + '</td>').join('') + '</tr>').join('');
    const mRows = data.metrics.map((mt, mi) => '<tr><td class="rowhead">' + esc(mt.label) + '</td>' +
      view.colIdx.map((ci) => { const v = view.values[mi][ci]; return '<td class="num' + (v === null ? ' null' : '') + '">' + fmtFull(v) + '</td>'; }).join('') + '</tr>').join('');
    return '<table><thead><tr>' + head + '</tr></thead><tbody>' + dimRows + mRows + '</tbody></table>';
  }

  function renderCharts(view) {
    const el = $('charts');
    const ch = CHANNELS.find((c) => c.id === state.channel);
    $('chartTitle').innerHTML = '그래프 <span class="badge">' + esc(state.channel) + '</span>';
    $('chartSection').hidden = !ch.chart;
    if (!ch.chart) { el.innerHTML = ''; return; }
    if (!view.data || view.data.kind !== 'pivot') {
      el.innerHTML = '<div class="empty">' + (view.empty ? esc(view.empty) : '이 시트에서 그래프로 그릴 지표 구조를 찾지 못했습니다.') + '</div>';
      return;
    }
    if (!view.rows.length) { el.innerHTML = '<div class="empty">선택한 조건에 맞는 데이터가 없습니다.</div>'; return; }
    el.innerHTML = view.charts.map((c, i) => '<div class="chart-card"><h3>' + esc(c.metric) + '</h3>' +
      (view.filterTag ? '<div class="sub" title="' + esc(view.basis) + '">' + esc(view.filterTag) + '</div>' : '<div class="sub-gap"></div>') +
      '<div class="panels" data-chart="' + i + '"></div></div>').join('');
    view.charts.forEach((c, i) => {
      const host = el.querySelector('[data-chart="' + i + '"]');
      c.panels.forEach((p) => {
        const div = document.createElement('div');
        div.className = 'cpanel';
        div.style.flex = Math.max(p.points.length, 2) + ' 1 0';
        div.innerHTML = view.groupDim && c.panels.length > 1 ? '<div class="ptitle">' + esc(p.group || '(빈 값)') + '</div>' : '';
        host.appendChild(div);
      });
    });
    // 레이아웃이 잡힌 뒤 실제 폭으로 그림
    view.charts.forEach((c, i) => {
      const host = el.querySelector('[data-chart="' + i + '"]');
      [...host.children].forEach((div, pi) => drawPanel(div, c.panels[pi], c.metric, view.groupDim));
    });
  }

  function niceTicks(lo, hi, count) {
    if (lo === hi) { hi = lo === 0 ? 1 : lo + Math.abs(lo) * 0.1; }
    const span = hi - lo;
    const step0 = Math.pow(10, Math.floor(Math.log10(span / count)));
    const err = span / count / step0;
    const step = step0 * (err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1);
    const t0 = Math.floor(lo / step) * step, t1 = Math.ceil(hi / step) * step;
    const ticks = [];
    for (let t = t0; t <= t1 + step / 2; t += step) ticks.push(Math.round(t / step) * step);
    return ticks;
  }

  const SVGNS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs, parent) {
    const e = document.createElementNS(SVGNS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function barPath(x, y0, y1, w, r) {
    // y0 = 기준선, y1 = 값 끝. 값 쪽 모서리만 둥글게
    const up = y1 < y0;
    const h = Math.abs(y0 - y1);
    r = Math.min(r, w / 2, h);
    if (h === 0) return '';
    if (up) return 'M' + x + ',' + y0 + 'V' + (y1 + r) + 'Q' + x + ',' + y1 + ' ' + (x + r) + ',' + y1 + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y1 + ' ' + (x + w) + ',' + (y1 + r) + 'V' + y0 + 'Z';
    return 'M' + x + ',' + y0 + 'V' + (y1 - r) + 'Q' + x + ',' + y1 + ' ' + (x + r) + ',' + y1 + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y1 + ' ' + (x + w) + ',' + (y1 - r) + 'V' + y0 + 'Z';
  }

  function drawPanel(div, panel, metric, groupDim) {
    const W = Math.max(div.clientWidth || 300, 120);
    const pts = panel.points;
    // 모든 막대에 값 표시: 막대 폭에 들어가면 가로, 아니면 세로로 세움
    const labels = pts.map((p) => fmtBar(p.value));
    const textW = (s) => s.length * 6.1 + 2;
    const maxTW = Math.max(0, ...labels.map(textW));
    const band0 = (W - 52) / Math.max(pts.length, 1);
    const vertical = maxTW > band0 - 4;
    const m = { t: vertical ? maxTW + 10 : 20, r: 6, b: 26, l: 46 };
    const H = 190 + m.t;
    const vals = pts.map((p) => p.value).filter((v) => v !== null && isFinite(v));
    const lo = Math.min(0, ...vals), hi = Math.max(0, ...vals);
    const ticks = niceTicks(lo, hi || (lo < 0 ? 0 : 1), 4);
    const y0d = ticks[0], y1d = ticks[ticks.length - 1];
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const y = (v) => m.t + ih - ((v - y0d) / (y1d - y0d || 1)) * ih;
    const band = iw / pts.length;
    const bw = Math.max(2, Math.min(band - 2, band * 0.72, 40));
    const svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'img',
      'aria-label': metric + (panel.group ? ' (' + panel.group + ')' : '') + ' 막대그래프' });
    const gAxis = svgEl('g', { class: 'axis' }, svg);
    ticks.forEach((t) => {
      const ty = y(t);
      svgEl('line', { class: 'gridline', x1: m.l, x2: W - m.r, y1: ty, y2: ty }, gAxis);
      const tx = svgEl('text', { x: m.l - 6, y: ty + 3.5, 'text-anchor': 'end' }, gAxis);
      tx.textContent = fmtCompact(t);
    });
    const base = y(0);
    svgEl('line', { class: 'baseline', x1: m.l, x2: W - m.r, y1: base, y2: base }, svg);

    // x 라벨: 겹치면 n개마다 하나씩
    const maxLen = Math.max(...pts.map((p) => String(p.label).length));
    const step = Math.max(1, Math.ceil((maxLen * 6.2 + 8) / band));
    const gBars = svgEl('g', {}, svg);
    const bars = [];
    pts.forEach((p, i) => {
      const cx = m.l + band * i + band / 2;
      let bar = null;
      if (p.value !== null && isFinite(p.value)) {
        bar = svgEl('path', { class: 'bar', d: barPath(cx - bw / 2, base, y(p.value), bw, 4) }, gBars);
      }
      bars.push(bar);
      if (i % step === 0 || i === pts.length - 1 && pts.length <= 3) {
        const t = svgEl('text', { x: cx, y: H - m.b + 15, 'text-anchor': 'middle' }, gAxis);
        t.textContent = p.label;
      }
      if (p.value !== null && isFinite(p.value)) {
        const pos = p.value >= 0;
        const ve = y(p.value);
        const t = vertical
          ? svgEl('text', { class: 'vlabel', x: cx + 3.5, y: pos ? ve - 5 : ve + 5, 'text-anchor': pos ? 'start' : 'end',
            transform: 'rotate(-90 ' + (cx + 3.5) + ' ' + (pos ? ve - 5 : ve + 5) + ')' }, svg)
          : svgEl('text', { class: 'vlabel', x: cx, y: pos ? ve - 6 : ve + 13, 'text-anchor': 'middle' }, svg);
        t.textContent = labels[i];
      }
    });
    // 호버 영역 (막대보다 넓게)
    const gHit = svgEl('g', {}, svg);
    pts.forEach((p, i) => {
      const hit = svgEl('rect', { class: 'hit', x: m.l + band * i, y: m.t, width: band, height: ih }, gHit);
      hit.addEventListener('mousemove', (e) => {
        gBars.classList.add('dimmed');
        bars.forEach((b, j) => b && b.classList.toggle('hot', j === i));
        const keys = Object.entries(p.keys).map(([k, v]) => esc(k) + ' ' + esc(v || '(빈 값)')).join(' · ');
        showTip(e, '<div class="tt-k">' + keys + '</div><div class="tt-k">' + esc(metric) + '</div><div class="tt-v">' + fmtFull(p.value) + '</div>');
      });
      hit.addEventListener('mouseleave', () => { gBars.classList.remove('dimmed'); hideTip(); });
    });
    div.appendChild(svg);
  }

  function showTip(e, html) {
    const tip = $('tooltip');
    tip.innerHTML = html;
    tip.hidden = false;
    const r = tip.getBoundingClientRect();
    let x = e.clientX + 14, y = e.clientY + 14;
    if (x + r.width > window.innerWidth - 8) x = e.clientX - r.width - 14;
    if (y + r.height > window.innerHeight - 8) y = e.clientY - r.height - 14;
    tip.style.left = Math.max(8, x) + 'px';
    tip.style.top = Math.max(8, y) + 'px';
  }
  function hideTip() { $('tooltip').hidden = true; }

  // ───────────────────────── 이벤트 ─────────────────────────
  $('channelTabs').addEventListener('click', (e) => {
    const b = e.target.closest('.tab');
    if (!b || b.disabled) return;
    state.channel = b.dataset.ch;
    state.sort = null;
    render();
  });
  $('filters').addEventListener('click', (e) => {
    const dd = e.target.closest('.dd-btn');
    if (dd) {
      const dim = dd.closest('.dd').dataset.dim;
      state.ddOpen = state.ddOpen === dim ? null : dim;
      renderFilters();
      return;
    }
    const b = e.target.closest('.chip');
    if (!b || b.disabled) return;
    const dim = b.dataset.dim;
    const set = state.filters[dim];
    if (SINGLE_DIMS.includes(dim)) {
      if (set.has(b.dataset.key)) return;
      set.clear();
      set.add(b.dataset.key);
      pruneUnavailable(dim);
    } else if (b.dataset.all) set.clear();
    else if (set.has(b.dataset.key)) set.delete(b.dataset.key);
    else set.add(b.dataset.key);
    render();
  });
  // Period_Index를 바꾸면 새 기준에 없는 다른 필터 선택값(예: Week 전용 기간)은 해제
  function pruneUnavailable(changed) {
    FILTER_DIMS.forEach((d) => {
      if (d === changed || !selActive(d)) return;
      const avail = availability(d);
      [...state.filters[d]].forEach((k) => { if (!avail.has(k)) state.filters[d].delete(k); });
    });
  }
  $('filters').addEventListener('change', (e) => {
    const cb = e.target.closest('input[type="checkbox"][data-dim]');
    if (!cb) return;
    const set = state.filters[cb.dataset.dim];
    if (cb.dataset.all) set.clear();
    else if (cb.checked) set.add(cb.dataset.key);
    else set.delete(cb.dataset.key);
    state.ddOpen = cb.dataset.dim;
    render();
  });
  document.addEventListener('click', (e) => {
    if (state.ddOpen && !e.target.closest('.dd')) { state.ddOpen = null; renderFilters(); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.ddOpen) { state.ddOpen = null; renderFilters(); }
  });
  $('resetFilters').addEventListener('click', () => { applyDefaultFilters(); render(); });
  $('tableWrap').addEventListener('click', (e) => {
    const th = e.target.closest('th[data-sort]');
    if (!th) return;
    const col = th.dataset.sort;
    state.sort = state.sort && state.sort.col === col ? (state.sort.dir > 0 ? { col, dir: -1 } : null) : { col, dir: 1 };
    renderTable(computeView());
  });
  let resizeT;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => { if (state.model) renderCharts(computeView()); }, 150);
  });

  // ───────────────────────── 파일 로딩 ─────────────────────────
  function applyDefaultFilters() {
    FILTER_DIMS.forEach((d) => {
      state.filters[d].clear();
      const opts = state.model ? state.model.options[d] || [] : [];
      (DEFAULT_FILTERS[d] || []).forEach((v) => {
        const hit = opts.find((k) => norm(k) === norm(v)); // 실제 값 표기(month/Month)에 맞춤
        if (hit !== undefined) state.filters[d].add(hit);
      });
      if (SINGLE_DIMS.includes(d) && !state.filters[d].size && opts.length) state.filters[d].add(opts[0]);
    });
    state.ddOpen = null;
  }
  function loadWorkbook(buf, name) {
    const wb = XLSX.read(buf, { type: 'array', cellFormula: true, cellNF: false });
    astCache.clear();
    state.model = buildModel(wb);
    state.fileName = name;
    const firstAvail = CHANNELS.find((c) => state.model.channels[c.id]);
    if (!state.model.channels[state.channel] && firstAvail) state.channel = firstAvail.id;
    applyDefaultFilters();
    $('fileBtn').title = '현재 파일: ' + name + ' (시트: ' + wb.SheetNames.join(', ') + ') — 다른 엑셀 파일 열기';
    $('dropzone').hidden = true;
    render();
    window.__dashboard = { state, computeView, Evaluator, buildModel };
  }
  function showDrop(msg) {
    $('dropzone').hidden = false;
    $('dzErr').textContent = msg || '';
  }
  function readFile(file) {
    const fr = new FileReader();
    fr.onload = () => {
      try { loadWorkbook(new Uint8Array(fr.result), file.name); } catch (err) { showDrop('파일을 읽는 중 오류: ' + err.message); }
    };
    fr.readAsArrayBuffer(file);
  }
  $('fileInput').addEventListener('change', (e) => { if (e.target.files[0]) readFile(e.target.files[0]); e.target.value = ''; });
  window.addEventListener('dragover', (e) => { e.preventDefault(); });
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) readFile(f);
  });

  if (typeof XLSX === 'undefined') {
    showDrop('SheetJS 라이브러리를 불러오지 못했습니다. 인터넷 연결을 확인하세요.');
    return;
  }
  // 1순위: data.js에 내장된 데이터 (엑셀 파일 없이 동작), 2순위: 같은 폴더의 엑셀 파일
  const emb = window.EMBEDDED_WORKBOOK;
  if (emb && emb.base64) {
    try {
      const bin = atob(emb.base64);
      const buf = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      loadWorkbook(buf, emb.name || DEFAULT_FILE);
      return;
    } catch (err) {
      console.warn('내장 데이터 로드 실패, 엑셀 파일로 대체합니다.', err);
    }
  }
  fetch(DEFAULT_FILE, { cache: 'no-cache' })
    .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
    .then((buf) => loadWorkbook(new Uint8Array(buf), DEFAULT_FILE))
    .catch((err) => showDrop(DEFAULT_FILE + ' 자동 로드 실패 (' + err.message + ')'));
})();

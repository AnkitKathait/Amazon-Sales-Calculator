/* ═══════════════════════════════════════
   DATA STORE
   store[y][m][d] = [{ sku, sell, ship, fees, cost, rto }, ...]
   Profit = sell − ship − fees − cost
═══════════════════════════════════════ */
let store = {};

function getMonthStore(y, m) {
  if (!store[y])    store[y]    = {};
  if (!store[y][m]) store[y][m] = {};
  return store[y][m];
}
function getDayRows(y, m, d) {
  const ms = getMonthStore(y, m);
  if (!ms[d]) ms[d] = [];
  return ms[d];
}

const SUPABASE_URL = 'https://jopulgsuccysuhoadvim.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcHVsZ3N1Y2N5c3Vob2FkdmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMDkwNjEsImV4cCI6MjA5MDY4NTA2MX0.ce8qnEHef4SmSmsegoNJ8El3_hpA51RpR8JToFM7Vm8';
let supabase = null;

async function initSupabaseClient() {
  if (supabase) return supabase;
  try {
    console.log('🔗 Initializing Supabase client...');
    let createClient;
    try {
      const module = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
      createClient = module.createClient;
    } catch (importError) {
      console.warn('ESM import failed, trying alternative method...');
      if (typeof window.supabase !== 'undefined') {
        createClient = window.supabase.createClient;
      } else {
        throw new Error('Supabase library not available');
      }
    }
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✅ Supabase client initialized');
    return supabase;
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error);
    console.warn('Continuing without Supabase - data will be local only');
    return null;
  }
}

async function loadOrdersFromSupabase() {
  try {
    console.log('📊 Loading orders from Supabase...');
    const sb = await initSupabaseClient();
    if (!sb) {
      console.log('⚠ Supabase client not available; skipping remote load');
      return;
    }

    const { data, error } = await sb.from('orders').select('*').order('created_at', { ascending: true });
    if (error) throw error;

    store = {};
    data.forEach(o => {
      const rows = getDayRows(o.year, o.month, o.day);
      rows.push({
        id: o.id,
        sku: o.sku || '',
        sell: Number(o.sell) || 0,
        ship: Number(o.ship) || DEF_SHIP,
        fees: Number(o.fees) || 0,
        cost: Number(o.cost) || 0,
        rto: Number(o.rto) || 0
      });
    });
    console.log(`✅ Loaded ${data.length} orders from Supabase`);
  } catch (err) {
    console.warn('⚠ Supabase load failed, continuing with local data:', err);
    showToast('⚠ Using local data only');
  }
}

async function saveOrderToSupabase(y, m, d, i) {
  const row = getDayRows(y, m, d)[i];
  if (!row) return;
  try {
    const sb = await initSupabaseClient();
    if (!sb) {
      console.log('⚠ Supabase client not available; skipping remote save');
      return;
    }

    const { data: { user } } = await sb.auth.getUser();
    const payload = {
      user_id: user.id,
      year: y,
      month: m,
      day: d,
      sku: row.sku || '',
      sell: row.sell === undefined || row.sell === '' ? 0 : row.sell,
      ship: (row.ship === undefined || row.ship === '' || row.ship === 0) ? DEF_SHIP : row.ship,
      fees: row.fees === undefined || row.fees === '' ? 0 : row.fees,
      cost: row.cost === undefined || row.cost === '' ? 0 : row.cost,
      rto: row.rto === undefined || row.rto === '' ? 0 : row.rto
    };
    if (row.id) {
      const { error } = await sb.from('orders').update(payload).eq('id', row.id);
      if (error) throw error;
    } else {
      const { data, error } = await sb.from('orders').insert(payload).select().single();
      if (error) throw error;
      row.id = data.id;
    }
  } catch (err) {
    console.warn('Supabase save failed', err);
    showToast('⚠ Supabase save failed');
  }
}

async function deleteOrderFromSupabase(row) {
  if (!row?.id) return;
  try {
    const sb = await initSupabaseClient();
    if (!sb) {
      console.log('⚠ Supabase client not available; skipping remote delete');
      return;
    }
    const { error } = await sb.from('orders').delete().eq('id', row.id);
    if (error) throw error;
  } catch (err) {
    console.warn('Supabase delete failed', err);
    showToast('⚠ Supabase delete failed');
  }
}

const MONTHS   = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WDAYS    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DEF_SHIP = 65;

function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function wdName(y, m, d)   { return WDAYS[new Date(y, m, d).getDay()]; }
function wdIdx(y, m, d)    { return new Date(y, m, d).getDay(); }
function isWeekend(y, m, d){ const w = wdIdx(y,m,d); return w === 0 || w === 6; }
function isToday(y, m, d)  { const t=new Date(); return t.getFullYear()===y && t.getMonth()===m && t.getDate()===d; }
function curY() { return parseInt(document.getElementById('selYear').value)  || new Date().getFullYear(); }
function curM() { return parseInt(document.getElementById('selMonth').value); }
function fmtM(n){ return '₹' + Number(n||0).toFixed(2); }

/* ── AUTO-FILL RULES ── */
function autoCost(sell) {
  if (sell > 0  && sell < 500)  return 250;
  if (sell >= 500)              return 300;
  return 0;
}
function autoFees(sell) {
  if (sell > 0  && sell < 500) return 25.96;
  if (sell >= 500)             return 53.10;
  return 0;
}

function rowProfit(r) {
  return (r.sell||0) - (r.ship||0) - (r.fees||0) - (r.cost||0);
}

/* ══════════════════════════════════
   RENDER MONTH
══════════════════════════════════ */
function renderMonth() {
  const y = curY(), m = curM();

  const monthPill = document.getElementById('monthPill');
  if (monthPill) {
    monthPill.textContent = MONTHS[m] + ' ' + y;
  }

  const wrap = document.getElementById('daysWrap');
  wrap.innerHTML = '';

  const days = daysInMonth(y, m);
  let weekGroup = null, weekNum = 0;

  for (let d = 1; d <= days; d++) {
    const dow = wdIdx(y, m, d); // 0=Sun
    if (d === 1 || dow === 0) {
      weekNum++;
      weekGroup = document.createElement('div');
      weekGroup.className = 'week-group';
      const lbl = document.createElement('div');
      lbl.className = 'week-label';
      lbl.innerHTML = `<span class="week-label-text">Week ${weekNum}</span><span class="week-label-line"></span>`;
      weekGroup.appendChild(lbl);
      wrap.appendChild(weekGroup);
    }
    weekGroup.appendChild(buildDayBlock(y, m, d));
  }

  updateSummary(y, m);

  // Scroll to today
  if (y === new Date().getFullYear() && m === new Date().getMonth()) {
    const td = new Date().getDate();
    const b  = document.getElementById(`db-${y}-${m}-${td}`);
    if (b) setTimeout(() => b.scrollIntoView({ behavior:'smooth', block:'center' }), 250);
  }
}

/* ══════════════════════════════════
   BUILD DAY BLOCK
══════════════════════════════════ */
function buildDayBlock(y, m, d) {
  const rows    = getDayRows(y, m, d);
  const today   = isToday(y, m, d);
  const weekend = isWeekend(y, m, d);
  const stats   = calcStats(rows);

  const block = document.createElement('div');
  block.id        = `db-${y}-${m}-${d}`;
  block.className = 'day-block'
    + (today   ? ' today' : '')
    + (weekend ? ' weekend' : '')
    + (rows.length ? ' has-data' : '');

  const statsHtml = buildHdrStats(rows, stats);
  block.innerHTML = `
    <div class="day-hdr" onclick="toggleDay(this)">
      <div class="dh-left">
        <div class="dh-circle">${d}</div>
        <div class="dh-info">
          <div class="dh-dayname">${wdName(y,m,d)}</div>
          <div class="dh-date">${d} ${MONTHS[m]} ${y}</div>
        </div>
      </div>
      <div class="dh-stats" id="dhs-${y}-${m}-${d}">
        ${statsHtml || `<div class="dh-empty-wrap"><span class="dh-empty">No orders yet — click to add</span></div>`}
      </div>
      <div class="dh-right">
        ${today ? '<span class="today-tag">TODAY</span>' : ''}
        <button class="dh-qadd" onclick="event.stopPropagation();quickAddDay(${y},${m},${d})">＋ Add</button>
        <div class="dh-chev">▾</div>
      </div>
    </div>
    <div class="day-body" id="dbody-${y}-${m}-${d}">
      <div class="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th style="min-width:155px;text-align:left">Order Name / SKU</th>
              <th style="min-width:108px">Selling Price (₹)</th>
              <th style="min-width:95px">Shipping (₹)</th>
              <th style="min-width:108px">Amazon Fees (₹)</th>
              <th style="min-width:90px">Cost (₹)</th>
              <th style="min-width:100px">RTO / Loss (₹)</th>
              <th style="min-width:115px">Profit (₹)</th>
              <th style="width:38px"></th>
            </tr>
          </thead>
          <tbody id="tbody-${y}-${m}-${d}"></tbody>
          <tfoot  id="tfoot-${y}-${m}-${d}"></tfoot>
        </table>
      </div>
      <button class="add-row-btn" onclick="addRow(${y},${m},${d})">＋ Add Order Row</button>
    </div>`;

  rows.forEach((_, i) => appendRowEl(y, m, d, i, block));
  renderTotals(y, m, d);
  return block;
}

function buildHdrStats(rows, stats) {
  if (!rows.length) return '';
  const profitValCls = stats.net < 0 ? 'sv-loss'   : 'sv-profit';
  const profitDotCls = stats.net < 0 ? 'dot-loss'  : 'dot-profit';
  const arrow        = stats.net < 0 ? '↓ '        : '↑ ';
  return `
    <div class="stat-col">
      <span class="stat-lbl"><span class="stat-dot dot-orders"></span>Orders</span>
      <span class="stat-val sv-orders">${rows.length}</span>
    </div>
    <div class="stat-col">
      <span class="stat-lbl"><span class="stat-dot dot-rev"></span>Revenue</span>
      <span class="stat-val sv-rev">${fmtM(stats.rev)}</span>
    </div>
    <div class="stat-col">
      <span class="stat-lbl"><span class="stat-dot ${profitDotCls}"></span>Profit</span>
      <span class="stat-val ${profitValCls}">${arrow}${fmtM(stats.net)}</span>
    </div>`;
}

/* ══════════════════════════════════
   TOGGLE / EXPAND / COLLAPSE
══════════════════════════════════ */
function toggleDay(hdr) { hdr.closest('.day-block').classList.toggle('expanded'); }
function expandAll()    { document.querySelectorAll('.day-block').forEach(b=>b.classList.add('expanded')); }
function collapseAll()  { document.querySelectorAll('.day-block').forEach(b=>b.classList.remove('expanded')); }

/* ══════════════════════════════════
   ADD / DELETE ROW
══════════════════════════════════ */
function addRow(y, m, d) {
  const rows = getDayRows(y, m, d);
  rows.push({ sku:'', sell:0, ship: DEF_SHIP, fees:0, cost:0, rto:0 });
  const idx = rows.length - 1;
  appendRowEl(y, m, d, idx);
  renderTotals(y, m, d);
  updateHeader(y, m, d);
  updateSummary(y, m);
  setTimeout(() => {
    const inp = document.querySelector(`#row-${y}-${m}-${d}-${idx} .ci-sku`);
    if (inp) inp.focus();
  }, 40);
}

async function deleteRow(y, m, d, i) {
  const rows = getDayRows(y, m, d);
  const row   = rows[i];
  await deleteOrderFromSupabase(row);
  rows.splice(i, 1);
  rerenderTable(y, m, d);
  updateHeader(y, m, d);
  updateSummary(y, m);
}

function rerenderTable(y, m, d) {
  const tb = document.getElementById(`tbody-${y}-${m}-${d}`);
  if (!tb) return;
  tb.innerHTML = '';
  getDayRows(y, m, d).forEach((_, i) => appendRowEl(y, m, d, i));
  renderTotals(y, m, d);
}

/* ══════════════════════════════════
   APPEND ROW ELEMENT
══════════════════════════════════ */
function appendRowEl(y, m, d, i, block) {
  const tb = block ? block.querySelector(`#tbody-${y}-${m}-${d}`) : document.getElementById(`tbody-${y}-${m}-${d}`);
  if (!tb) return;
  const r  = getDayRows(y, m, d)[i];
  const tr = document.createElement('tr');
  tr.className = 'dr';
  tr.id = `row-${y}-${m}-${d}-${i}`;

  const shipVal = r.ship || '';

  tr.innerHTML = `
    <td><input class="ci ci-sku" type="text" placeholder="Order name / SKU"
      value="${esc(r.sku||'')}"
      onchange="setTxt(${y},${m},${d},${i},'sku',this.value)"/></td>
    <td><input class="ci ci-num" type="number" placeholder="0.00" min="0" step="0.01"
      value="${r.sell||''}" id="sell-${y}-${m}-${d}-${i}"
      oninput="setNum(${y},${m},${d},${i},'sell',this.value)"/></td>
    <td><input class="ci ci-num" type="number" placeholder="${DEF_SHIP}" min="0" step="0.01"
      value="${shipVal}"
      oninput="setNum(${y},${m},${d},${i},'ship',this.value)"/></td>
    <td><input class="ci ci-num" type="number" placeholder="0.00" min="0" step="0.01"
      value="${r.fees||''}" id="fees-${y}-${m}-${d}-${i}"
      oninput="setNum(${y},${m},${d},${i},'fees',this.value)"/></td>
    <td><input class="ci ci-num" type="number" placeholder="0.00" min="0" step="0.01"
      value="${r.cost||''}" id="cost-${y}-${m}-${d}-${i}"
      oninput="setNum(${y},${m},${d},${i},'cost',this.value)"/></td>
    <td><input class="ci ci-num" type="number" placeholder="0.00" min="0" step="0.01"
      value="${r.rto||''}"
      oninput="setNum(${y},${m},${d},${i},'rto',this.value)"/></td>
    <td id="pc-${y}-${m}-${d}-${i}">${profitCell(r)}</td>
    <td><button class="del-btn" title="Remove row" onclick="deleteRow(${y},${m},${d},${i})">✕</button></td>`;

  tb.appendChild(tr);
}

/* ── FIELD SETTERS ── */
async function setTxt(y, m, d, i, key, val) {
  getDayRows(y, m, d)[i][key] = val;
  updateHeader(y, m, d);
  updateSummary(y, m);
  await saveOrderToSupabase(y, m, d, i);
}

async function setNum(y, m, d, i, key, val) {
  const rows = getDayRows(y, m, d);
  const numVal = val === '' ? undefined : parseFloat(val) || 0;
  rows[i][key] = numVal;

  /* ── AUTO-FILL: Selling Price → Cost → Fees ── */
  if (key === 'sell') {
    const newCost = autoCost(rows[i].sell);
    if (newCost > 0) {
      rows[i].cost = newCost;
      const costEl = document.getElementById(`cost-${y}-${m}-${d}-${i}`);
      if (costEl) costEl.value = newCost;
    }
    const newFees = autoFees(rows[i].sell);
    if (newFees > 0) {
      rows[i].fees = newFees;
      const feesEl = document.getElementById(`fees-${y}-${m}-${d}-${i}`);
      if (feesEl) feesEl.value = newFees;
    }
  }

  const pc = document.getElementById(`pc-${y}-${m}-${d}-${i}`);
  if (pc) pc.innerHTML = profitCell(rows[i]);
  renderTotals(y, m, d);
  updateHeader(y, m, d);
  updateSummary(y, m);
  await saveOrderToSupabase(y, m, d, i);
}

/* ── PROFIT CELL ── */
function profitCell(r) {
  const p   = rowProfit(r);
  const cls = p > 0 ? 'pos' : p < 0 ? 'neg' : 'zer';
  return `<span class="pb ${cls}">${fmtM(p)}</span>`;
}

/* ══════════════════════════════════
   STATS & TOTALS
══════════════════════════════════ */
function calcStats(rows) {
  let rev=0, ship=0, fees=0, cost=0, rto=0;
  rows.forEach(r => {
    rev  += r.sell || 0;
    ship += r.ship || 0;
    fees += r.fees || 0;
    cost += r.cost || 0;
    rto  += r.rto  || 0;
  });
  return { rev, ship, fees, cost, rto, net: rev-ship-fees-cost };
}

function renderTotals(y, m, d) {
  const tf = document.getElementById(`tfoot-${y}-${m}-${d}`);
  if (!tf) return;
  const rows = getDayRows(y, m, d);
  if (!rows.length) { tf.innerHTML=''; return; }
  const s   = calcStats(rows);
  const cls = s.net >= 0 ? 'green' : 'red';
  tf.innerHTML = `<tr>
    <td><strong>${rows.length}</strong> order${rows.length>1?'s':''}</td>
    <td><span class="tv blue">${fmtM(s.rev)}</span></td>
    <td><span class="tv dark">${fmtM(s.ship)}</span></td>
    <td><span class="tv dark">${fmtM(s.fees)}</span></td>
    <td><span class="tv dark">${fmtM(s.cost)}</span></td>
    <td><span class="tv red">${fmtM(s.rto)}</span></td>
    <td colspan="2"><span class="tv ${cls}">${fmtM(s.net)}</span></td>
  </tr>`;
}

function updateHeader(y, m, d) {
  const block = document.getElementById(`db-${y}-${m}-${d}`);
  if (!block) return;
  const rows  = getDayRows(y, m, d);
  const stats = calcStats(rows);
  const el    = document.getElementById(`dhs-${y}-${m}-${d}`);
  if (el) el.innerHTML = rows.length
    ? buildHdrStats(rows, stats)
    : `<div class="dh-empty-wrap"><span class="dh-empty">No orders yet — click to add</span></div>`;
  if (rows.length) block.classList.add('has-data');
  else block.classList.remove('has-data');
}

/* ══════════════════════════════════
   SUMMARY CARDS
══════════════════════════════════ */
function updateSummary(y, m) {
  const ms = getMonthStore(y, m);
  let orders=0, rev=0, ship=0, fees=0, cost=0, rto=0;
  Object.keys(ms).forEach(d => {
    const rows = ms[d];
    if (!Array.isArray(rows)) return;
    orders += rows.length;
    const s = calcStats(rows);
    rev  += s.rev;  ship += s.ship;
    fees += s.fees; cost += s.cost; rto += s.rto;
  });
  const net = rev - ship - fees - cost;
  setText('sc-orders', orders);
  setText('sc-rev',    fmtM(rev));
  setText('sc-ship',   fmtM(ship));
  setText('sc-fees',   fmtM(fees));
  setText('sc-cost',   fmtM(cost));
  setText('sc-rto',    fmtM(rto));
  const ne = document.getElementById('sc-net');
  ne.textContent = fmtM(net);
  ne.className = 'sc-val ' + (net >= 0 ? 'green' : 'red');
}
function setText(id, v) { document.getElementById(id).textContent = v; }

/* ══════════════════════════════════
   MODAL
══════════════════════════════════ */
function openModal(preDay) {
  const y=curY(), m=curM(), days=daysInMonth(y,m);
  const sel = document.getElementById('mDay');
  sel.innerHTML = '';
  for (let d=1; d<=days; d++) {
    const o = document.createElement('option');
    o.value = d;
    o.textContent = `${d} ${MONTHS[m]} (${wdName(y,m,d)})${isToday(y,m,d)?' — Today':''}`;
    if (preDay ? d===preDay : isToday(y,m,d)) o.selected = true;
    sel.appendChild(o);
  }
  ['mSku','mSell','mFees','mCost','mRto'].forEach(id => document.getElementById(id).value='');
  document.getElementById('mShip').value = DEF_SHIP;
  hideHints();
  document.getElementById('overlay').classList.add('on');
  setTimeout(() => document.getElementById('mSku').focus(), 150);
}
function quickAddDay(y, m, d) { openModal(d); }

function closeModal(e) {
  if (!e || e.target===document.getElementById('overlay'))
    document.getElementById('overlay').classList.remove('on');
}

function hideHints() {
  ['mSellHint','mFeesHint','mCostHint'].forEach(id => {
    const el=document.getElementById(id); if(el){el.textContent='';el.classList.remove('show');}
  });
}
function showHint(id, msg) {
  const el=document.getElementById(id);
  if(el){ el.textContent=msg; el.classList.add('show'); }
}

/* Modal auto-fill: Selling Price → Cost → Fees */
function modalAutoFill() {
  const sell = parseFloat(document.getElementById('mSell').value)||0;
  if (!sell) return;
  const c = autoCost(sell);
  if (c > 0) {
    document.getElementById('mCost').value = c;
    showHint('mCostHint', `Auto-set: ₹${c} (sell ${sell < 500 ? '< ₹500' : '≥ ₹500'})`);
  }
  const f = autoFees(sell);
  if (f > 0) {
    document.getElementById('mFees').value = f;
    showHint('mFeesHint', `Auto-set: ₹${f} (sell ${sell < 500 ? '< ₹500' : '≥ ₹500'})`);
  }
}

/* Modal auto-fill: Cost change — fees stay based on selling price */
function modalFeesAutoFill() {
  const sell = parseFloat(document.getElementById('mSell').value)||0;
  if (!sell) return;
  const f = autoFees(sell);
  if (f > 0) {
    document.getElementById('mFees').value = f;
    showHint('mFeesHint', `Auto-set: ₹${f} (sell ${sell < 500 ? '< ₹500' : '≥ ₹500'})`);
  }
}

async function quickAdd() {
  const y=curY(), m=curM();
  const d    = parseInt(document.getElementById('mDay').value);
  const sku  = document.getElementById('mSku').value.trim();
  const sell = parseFloat(document.getElementById('mSell').value)||0;
  const ship = parseFloat(document.getElementById('mShip').value);
  const fees = parseFloat(document.getElementById('mFees').value)||0;
  const cost = parseFloat(document.getElementById('mCost').value)||0;
  const rto  = parseFloat(document.getElementById('mRto').value)||0;
  const shipFinal = isNaN(ship) ? DEF_SHIP : ship;

  if (!sku) { document.getElementById('mSku').focus(); showToast('⚠ Enter an Order Name / SKU'); return; }

  const rows = getDayRows(y,m,d);
  rows.push({ sku, sell, ship: shipFinal, fees, cost, rto });
  const idx = rows.length - 1;

  const block = document.getElementById(`db-${y}-${m}-${d}`);
  if (block) {
    block.classList.add('expanded');
    const tbody = document.getElementById(`tbody-${y}-${m}-${d}`);
    if (tbody) { appendRowEl(y,m,d,idx); renderTotals(y,m,d); updateHeader(y,m,d); }
  }

  await saveOrderToSupabase(y, m, d, idx);
  updateSummary(y,m);
  closeModal();
  showToast(`✓ Order added for ${d} ${MONTHS[m]}`);
  setTimeout(() => block && block.scrollIntoView({ behavior:'smooth', block:'center' }), 200);
}

/* ══════════════════════════════════
   EXPORT / IMPORT
══════════════════════════════════ */
function exportData() {
  const y=curY(), m=curM();
  const blob = new Blob([JSON.stringify({meta:{v:'2.1',exported:new Date().toISOString()},store},null,2)],{type:'application/json'});
  const a = Object.assign(document.createElement('a'),{href:URL.createObjectURL(blob),download:`amazon_sales_${MONTHS[m]}_${y}.json`});
  a.click(); URL.revokeObjectURL(a.href);
  showToast('✓ Data exported');
}
function importData(ev) {
  const f=ev.target.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=e=>{
    try {
      const p=JSON.parse(e.target.result);
      const src=p.store||p.data;
      if(src){
        Object.keys(src).forEach(y=>{
          if(!store[y]) store[y]={};
          Object.keys(src[y]).forEach(m=>{
            if(!store[y][m]) store[y][m]={};
            Object.assign(store[y][m],src[y][m]);
          });
        });
        renderMonth(); showToast('✓ Data imported');
      }
    } catch { showToast('✗ Invalid file'); }
  };
  r.readAsText(f); ev.target.value='';
}

/* ══════════════════════════════════
   AUTH
══════════════════════════════════ */
function switchAuthTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('tabLogin').classList.toggle('active', isLogin);
  document.getElementById('tabSignup').classList.toggle('active', !isLogin);
  document.getElementById('loginForm').style.display = isLogin ? 'flex' : 'none';
  document.getElementById('signupForm').style.display = isLogin ? 'none' : 'flex';
  document.getElementById('loginError').textContent = '';
  document.getElementById('signupError').textContent = '';
  document.getElementById('signupError').classList.remove('success');
}

function togglePasswordVis(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  const show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  btn.textContent = show ? '🙈' : '👁';
}

function handleRememberMe(cb) {
  if (cb.checked) {
    const email = document.getElementById('loginEmail').value.trim();
    if (email) localStorage.setItem('rememberedEmail', email);
  } else {
    localStorage.removeItem('rememberedEmail');
  }
}

async function handleForgotPassword() {
  const email = document.getElementById('loginEmail').value.trim();
  const errEl = document.getElementById('loginError');
  if (!email) {
    errEl.textContent = 'Enter your email above first.';
    errEl.classList.remove('success');
    return;
  }
  try {
    const sb = await initSupabaseClient();
    if (!sb) throw new Error('Could not connect.');
    const { error } = await sb.auth.resetPasswordForEmail(email);
    if (error) throw error;
    errEl.classList.add('success');
    errEl.textContent = '✓ Reset link sent! Check your email.';
  } catch (err) {
    errEl.classList.remove('success');
    errEl.textContent = err.message || 'Failed to send reset email.';
  }
}

async function handleLogin() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl    = document.getElementById('loginError');
  const btn      = document.getElementById('loginBtn');
  errEl.textContent = ''; errEl.classList.remove('success');

  if (!email || !password) { errEl.textContent = 'Please fill in all fields.'; return; }

  btn.textContent = 'Logging in…'; btn.disabled = true;
  try {
    const sb = await initSupabaseClient();
    if (!sb) throw new Error('Could not connect. Check your internet.');
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await loadApp();
  } catch (err) {
    errEl.textContent = err.message || 'Login failed.';
    btn.textContent = 'Login'; btn.disabled = false;
  }
}

async function handleSignup() {
  const email    = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const confirm  = document.getElementById('signupConfirm').value;
  const errEl    = document.getElementById('signupError');
  const btn      = document.getElementById('signupBtn');
  errEl.textContent = ''; errEl.classList.remove('success');

  if (!email || !password || !confirm) { errEl.textContent = 'Please fill in all fields.'; return; }
  if (password !== confirm)            { errEl.textContent = 'Passwords do not match.'; return; }
  if (password.length < 6)             { errEl.textContent = 'Password must be at least 6 characters.'; return; }

  btn.textContent = 'Creating account…'; btn.disabled = true;
  try {
    const sb = await initSupabaseClient();
    if (!sb) throw new Error('Could not connect. Check your internet.');
    const { error } = await sb.auth.signUp({ email, password });
    if (error) throw error;
    errEl.classList.add('success');
    errEl.textContent = '✓ Account created! Check your email to confirm.';
  } catch (err) {
    errEl.textContent = err.message || 'Sign up failed.';
  } finally {
    btn.textContent = 'Create Account'; btn.disabled = false;
  }
}

async function handleLogout() {
  try {
    const sb = await initSupabaseClient();
    if (sb) await sb.auth.signOut();
  } catch {}
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) { loginBtn.textContent = 'Login'; loginBtn.disabled = false; }
  const emailEl = document.getElementById('tbUserEmail');
  if (emailEl) { emailEl.textContent = ''; emailEl.style.display = 'none'; }
  switchAuthTab('login');
  document.getElementById('authScreen').classList.remove('hidden');
  document.getElementById('logoutBtn').style.display = 'none';
  store = {};
  renderMonth();
}

async function checkAuthAndLoad() {
  try {
    const sb = await initSupabaseClient();
    if (!sb) { await loadApp(); return; }
    const { data: { session } } = await sb.auth.getSession();
    if (session) { await loadApp(); return; }
    // No session — stay on auth screen
  } catch {
    await loadApp(); // On error allow access
  }
}

async function loadApp() {
  document.getElementById('authScreen').classList.add('hidden');
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.style.display = '';
  // Show logged-in email
  try {
    const sb = await initSupabaseClient();
    if (sb) {
      const { data: { user } } = await sb.auth.getUser();
      const emailEl = document.getElementById('tbUserEmail');
      if (emailEl && user?.email) { emailEl.textContent = user.email; emailEl.style.display = ''; }
    }
  } catch {}

  const mainEl = document.querySelector('.main');
  const loadingOverlay = document.getElementById('loadingOverlay');
  try {
    if (mainEl) mainEl.classList.add('page-loading');
    if (loadingOverlay) loadingOverlay.classList.remove('hidden');
    await loadOrdersFromSupabase();
    renderMonth();
    showToast('✓ App loaded');
  } catch (error) {
    console.error('✗ App load failed:', error);
    showToast('✗ Failed to load data');
  } finally {
    if (mainEl) mainEl.classList.remove('page-loading');
    if (loadingOverlay) loadingOverlay.classList.add('hidden');
  }
}

/* ══════════════════════════════════
   THEME TOGGLE
══════════════════════════════════ */
function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function initTheme() {
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
  }
  document.documentElement.classList.remove('dark-pre');
}

/* ══════════════════════════════════
   TOAST
══════════════════════════════════ */
function showToast(msg) {
  const t=document.getElementById('toast');
  document.getElementById('toastMsg').textContent=msg;
  t.classList.add('on');
  clearTimeout(t._t);
  t._t=setTimeout(()=>t.classList.remove('on'),3000);
}

function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

/* ══════════════════════════════════
   INIT
══════════════════════════════════ */
(async function(){
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

  async function initApp() {
    initTheme();
    const n = new Date();
    document.getElementById('selMonth').value = n.getMonth();
    document.getElementById('selYear').value  = n.getFullYear();
    await checkAuthAndLoad();
  }
})();

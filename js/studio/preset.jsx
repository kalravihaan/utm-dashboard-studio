// FY-26 preset dashboard.
// Canonical column names: Brand, Article Type, Style id, Total Sales Qty,
// Total Return Qty, GMV, Revenue, Inventory, Active Days, ROS, (optional) Month / Date

const FY26_PRESET_NAME = 'FY-26 Performance Dashboard';

const _dim = (col)              => ({ fieldId: col, name: col });
const _met = (col, agg='SUM', name, fmt) => ({ fieldId: col, agg, name: name || col, ...(fmt ? { fmt } : {}) });

// ROS tier calculated field formula
const ROS_TIER_FORMULA = "ROS > 1.5 ? 'Very Fast' : ROS >= 0.7 ? 'Fast' : ROS >= 0.3 ? 'Moderate' : ROS > 0 ? 'Slow' : (Inventory > 0 ? 'Dead' : 'No Stock')";

const FY26_CALC_FIELDS = [
  { id: 'ROS_Tier', name: 'ROS Tier', formula: ROS_TIER_FORMULA, dataType: 'string', role: 'dimension', source: 'calc' },
];

function fy26Widget(type, x, y, w, h, title, cfg) {
  return { id: uid('w_'), type, x, y, w, h, title: title || '', config: cfg || {} };
}

// Build a sub-tab for a specific ROS tier
function buildROSTierSubTab(tabName, tierVal) {
  const filter = [{ fieldId: 'ROS_Tier', op: '=', value: tierVal }];
  return {
    id: uid('st_'),
    name: tabName,
    widgets: [
      // KPI row
      fy26Widget('scorecard', 0, 0, 3, 2, 'Active Styles', {
        metric: _met('Style id', 'COUNT_DISTINCT', 'Active Styles'),
        filters: filter,
      }),
      fy26Widget('scorecard', 3, 0, 3, 2, 'Revenue', {
        metric: _met('Revenue', 'SUM', 'Revenue', 'inr'),
        filters: filter,
      }),
      fy26Widget('scorecard', 6, 0, 3, 2, 'Sales Qty', {
        metric: _met('Total Sales Qty', 'SUM', 'Sales Qty'),
        filters: filter,
      }),
      fy26Widget('scorecard', 9, 0, 3, 2, 'Inventory', {
        metric: _met('Inventory', 'SUM', 'Inventory'),
        filters: filter,
      }),
      // Style-level breakdown table
      fy26Widget('table', 0, 2, 12, 9, `${tabName} — Style ID Breakdown`, {
        dimensions: [_dim('Style id'), _dim('Brand'), _dim('Article Type')],
        metrics: [
          _met('Revenue',          'SUM', 'Revenue', 'inr'),
          _met('GMV',              'SUM', 'GMV',     'inr'),
          _met('Total Sales Qty',  'SUM', 'Sales Qty'),
          _met('Total Return Qty', 'SUM', 'Return Qty'),
          _met('Inventory',        'SUM', 'Inventory'),
          _met('ROS',              'AVG', 'Avg ROS'),
        ],
        filters: filter,
        pageSize: 25, showRowNumbers: true,
      }),
    ],
  };
}

function buildFY26Dashboard() {
  // ===== Tab 1: Overview =====
  const overview = {
    id: uid('t_'), name: 'Overview', subTabs: [],
    widgets: [
      fy26Widget('scorecard', 0,  0, 3, 2, 'Revenue',   { metric: _met('Revenue', 'SUM', 'Revenue', 'inr') }),
      fy26Widget('scorecard', 3,  0, 3, 2, 'GMV',       { metric: _met('GMV',     'SUM', 'GMV',     'inr') }),
      fy26Widget('scorecard', 6,  0, 2, 2, 'Sales Qty', { metric: _met('Total Sales Qty',  'SUM', 'Units Sold') }),
      fy26Widget('scorecard', 8,  0, 2, 2, 'Returns',   { metric: _met('Total Return Qty', 'SUM', 'Units Returned') }),
      fy26Widget('scorecard', 10, 0, 2, 2, 'Inventory', { metric: _met('Inventory') }),

      fy26Widget('bar', 0, 2, 8, 5, 'Revenue by Brand', {
        dimension: _dim('Brand'), metrics: [_met('Revenue', 'SUM', 'Revenue', 'inr')],
        showLegend: false, sortDesc: true, limit: 20,
      }),
      fy26Widget('donut', 8, 2, 4, 5, 'GMV share by Brand', {
        dimension: _dim('Brand'), metric: _met('GMV', 'SUM', 'GMV', 'inr'),
        limit: 8, showLegend: true,
      }),
      fy26Widget('hbar', 0, 7, 6, 5, 'Top Article Types · Revenue', {
        dimension: _dim('Article Type'), metrics: [_met('Revenue', 'SUM', 'Revenue', 'inr')],
        showLegend: false, sortDesc: true, limit: 12,
      }),
      fy26Widget('bar', 6, 7, 6, 5, 'Sales vs Returns by Brand', {
        dimension: _dim('Brand'),
        metrics: [_met('Total Sales Qty', 'SUM', 'Sales'), _met('Total Return Qty', 'SUM', 'Returns')],
        showLegend: true, sortDesc: true, limit: 20,
      }),
      fy26Widget('table', 0, 12, 12, 6, 'Brand Summary', {
        dimensions: [_dim('Brand')],
        metrics: [
          _met('Revenue',          'SUM', 'Revenue',    'inr'),
          _met('GMV',              'SUM', 'GMV',        'inr'),
          _met('Total Sales Qty',  'SUM', 'Sales Qty'),
          _met('Total Return Qty', 'SUM', 'Return Qty'),
          _met('Inventory'),
        ],
        pageSize: 10, showRowNumbers: true,
      }),
    ],
  };

  // ===== Tab 2: By Article Type =====
  const byArticle = {
    id: uid('t_'), name: 'By Article Type', subTabs: [],
    widgets: [
      fy26Widget('hbar', 0, 0, 6, 7, 'Revenue by Article Type', {
        dimension: _dim('Article Type'), metrics: [_met('Revenue', 'SUM', 'Revenue', 'inr')],
        sortDesc: true, limit: 25,
      }),
      fy26Widget('hbar', 6, 0, 6, 7, 'Inventory by Article Type', {
        dimension: _dim('Article Type'), metrics: [_met('Inventory')],
        sortDesc: true, limit: 25,
      }),
      fy26Widget('table', 0, 7, 12, 6, 'Article Type Breakdown', {
        dimensions: [_dim('Article Type'), _dim('Brand')],
        metrics: [
          _met('Revenue',         'SUM', 'Revenue', 'inr'),
          _met('GMV',             'SUM', 'GMV',     'inr'),
          _met('Total Sales Qty', 'SUM', 'Sales Qty'),
          _met('Inventory'),
        ],
        pageSize: 15, showRowNumbers: false,
      }),
    ],
  };

  // ===== Tab 3: ROS Analysis (with sub-tabs per tier) =====
  const rosAnalysis = {
    id: uid('t_'), name: 'ROS Analysis',
    widgets: [
      // Overview chart — shown when no sub-tab is active (first load shows first sub-tab)
      fy26Widget('bar', 0, 0, 8, 5, 'Revenue by ROS Tier', {
        dimension: _dim('ROS_Tier'),
        metrics: [_met('Revenue', 'SUM', 'Revenue', 'inr')],
        showLegend: false, sortDesc: true, limit: 10,
      }),
      fy26Widget('donut', 8, 0, 4, 5, 'Style Count by Tier', {
        dimension: _dim('ROS_Tier'),
        metric: _met('Style id', 'COUNT_DISTINCT', 'Styles'),
        limit: 10, showLegend: true,
      }),
    ],
    subTabs: [
      buildROSTierSubTab('Very Fast (>1.5)',  'Very Fast'),
      buildROSTierSubTab('Fast (0.7–1.5)',    'Fast'),
      buildROSTierSubTab('Moderate (0.3–0.7)','Moderate'),
      buildROSTierSubTab('Slow (0–0.3)',      'Slow'),
      buildROSTierSubTab('Dead (0 + stock)',  'Dead'),
    ],
  };

  // ===== Tab 4: Raw data =====
  const raw = {
    id: uid('t_'), name: 'Raw Data', subTabs: [],
    widgets: [
      fy26Widget('text', 0, 0, 12, 1, '', {
        text: 'Raw rows from the uploaded workbook',
        size: 14, weight: 500, align: 'left',
      }),
      fy26Widget('table', 0, 1, 12, 11, '', {
        dimensions: [_dim('Brand'), _dim('Article Type'), _dim('Style id')],
        metrics: [
          _met('Revenue',          'SUM', 'Revenue',    'inr'),
          _met('GMV',              'SUM', 'GMV',        'inr'),
          _met('Total Sales Qty',  'SUM', 'Sales Qty'),
          _met('Total Return Qty', 'SUM', 'Return Qty'),
          _met('Inventory'),
          _met('ROS',              'AVG', 'Avg ROS'),
        ],
        pageSize: 25, showRowNumbers: true,
      }),
    ],
  };

  return {
    id: uid('d_'),
    name: FY26_PRESET_NAME,
    theme: { ...DEFAULT_THEME },
    tabs: [overview, byArticle, rosAnalysis, raw],
    datasetId: null,
    filters: [],
    calcFields: FY26_CALC_FIELDS,
    fieldOverrides: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
    _isFY26Preset: true,
  };
}

async function loadBundledFY26Dataset(onProgress) {
  const candidates = [
    'data/master_data_final.xlsx',
    'data/master data final.xlsx',
  ];
  for (const path of candidates) {
    try {
      const res = await fetch(path);
      if (!res.ok) continue;
      const blob = await res.blob();
      if (!blob.size) continue;
      const file = new File([blob], path.split('/').pop(), {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      if (onProgress) onProgress('Reading bundled FY-26 data…');
      const parsed = await parseAnyExcel(file, onProgress);
      const ds = {
        id: uid('ds_'),
        name: 'FY-26 master data',
        rows: parsed.rows,
        fields: parsed.fields,
        rawXlsx: parsed.rawBlob,
        sheetName: parsed.sheetName,
      };
      await dbSaveDataset(ds);
      return ds;
    } catch (e) {
      console.warn('Bundled FY-26 dataset fetch failed for', path, e);
    }
  }
  return null;
}

Object.assign(window, { buildFY26Dashboard, loadBundledFY26Dataset, FY26_PRESET_NAME, FY26_CALC_FIELDS });
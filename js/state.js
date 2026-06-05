// =====================================================================
// STATE
// =====================================================================
let CY = null;       // current year_id (integer)
let CYbe = null;     // current year_be (display)
let YEARS = [];
let PROJECTS = [];
let PROC = [];
let PROC_TAB = 'all';
let PENDING_DEL = null;
let ACTIVE_PROJ_ID = null;
let FUND_CATEGORIES = [];
let FINANCE_BALANCES = [];
let FINANCE_TRANSACTIONS = [];
let FINANCE_LOADED = false;
let FIN_TAB = 'balance'; // 'balance' | 'transactions'

// External Expenses (เงินนอก)
let EXT_CATEGORIES   = [];
let EXT_TRANSACTIONS = [];
let EXT_LOADED       = false;

// Pagination
const PAGE_SIZE = 100;
let PROC_PAGE = 1;
let EXT_PAGE  = 1;

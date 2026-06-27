/* ==========================================================================
   Coffee Ledger - Daily Summary Application Logic (v1.1 - Password Auth Enabled)
   Features: State Management, localStorage, Duplicate Date Checks, Charts, CSV, PDF Print, Authentication
   ========================================================================== */

// --- Global Error Handler ---
window.addEventListener('error', function(event) {
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '0';
    errorDiv.style.left = '0';
    errorDiv.style.width = '100%';
    errorDiv.style.background = 'rgba(220, 38, 38, 0.95)';
    errorDiv.style.color = '#fff';
    errorDiv.style.padding = '16px';
    errorDiv.style.zIndex = '99999';
    errorDiv.style.fontFamily = 'monospace';
    errorDiv.style.fontSize = '14px';
    errorDiv.style.whiteSpace = 'pre-wrap';
    errorDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    errorDiv.innerHTML = '<strong>⚠️ JavaScript Error Detected:</strong><br>' + 
                          event.message + '<br>at ' + event.filename + ':' + event.lineno + ':' + event.colno;
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Dismiss';
    closeBtn.style.marginLeft = '12px';
    closeBtn.style.background = '#fff';
    closeBtn.style.color = '#000';
    closeBtn.style.border = 'none';
    closeBtn.style.padding = '4px 8px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.borderRadius = '4px';
    closeBtn.onclick = function() { errorDiv.remove(); };
    errorDiv.appendChild(closeBtn);
    
    document.body.appendChild(errorDiv);
});

// --- Global Variables & App State ---
let state = {
    transactions: [], // Array of { id, date, income, expense, note }
    settings: {
        theme: 'dark',
        lang: 'th' // Default language is Thai
    }
};
let isCloudMode = false;

// Helper to parse date string safely across all browsers (specifically Safari/iOS)
function parseLocalDate(dateStr) {
    if (!dateStr) return new Date();
    // Convert YYYY-MM-DD to YYYY/MM/DD for cross-browser parsing in local timezone
    return new Date(String(dateStr).replace(/-/g, '/'));
}

// --- Localization Dictionary (i18n) ---
const translations = {
    th: {
        nav_dashboard: "แดชบอร์ด",
        nav_entries: "บันทึกรายวัน",
        nav_reports: "รายงานสรุป",
        
        theme_light: "โหมดสว่าง",
        theme_dark: "โหมดมืด",
        
        dashboard_title: "แดชบอร์ด",
        dashboard_subtitle: "สรุปยอดรายรับรายจ่ายรายวันร้านกาแฟวันนี้",
        entries_title: "บันทึกรายวัน",
        entries_subtitle: "บันทึกยอดสรุปบัญชีรายรับรายจ่าย และประวัติรายวัน",
        reports_title: "รายงานสรุป",
        reports_subtitle: "วิเคราะห์รายงานบัญชีรายวัน พร้อมเครื่องมือพิมพ์สรุป PDF",
        
        btn_add_entry: "บันทึกยอดรายวัน",
        btn_view_all: "ดูทั้งหมด",
        btn_print_report: "พิมพ์รายงาน / PDF",
        btn_clear_all: "ล้างยอดทั้งหมด",
        btn_cancel: "ยกเลิก",
        btn_save: "บันทึกข้อมูล",
        
        filter_search_notes: "ค้นหาหมายเหตุ",
        filter_period: "ช่วงเวลาสรุป",
        filter_preset_all: "ทั้งหมด",
        filter_preset_week: "สัปดาห์นี้",
        filter_preset_month: "เดือนนี้",
        filter_preset_custom: "กำหนดเอง",
        filter_start_date: "จากวันที่",
        filter_end_date: "ถึงวันที่",
        
        kpi_income: "รายรับรวม",
        kpi_expense: "รายจ่ายรวม",
        kpi_profit: "กำไรสะสม",
        kpi_avg_daily: "เฉลี่ยรายรับต่อวัน",
        
        kpi_vs_15d: "จาก 15 วันก่อน",
        kpi_profit_margin: "กำไรสะสมอัตรา <span id=\"profit-percentage\">{val}%</span> ของรายรับ",
        kpi_loss_margin: "อัตราการขาดทุน <span id=\"profit-percentage\">{val}%</span> ของรายรับ",
        kpi_days_recorded: "<span id=\"days-recorded\">{val} วัน</span> ที่บันทึกไว้",
        
        table_date: "วันที่",
        table_income: "รายรับประจำวัน",
        table_expense: "รายจ่ายประจำวัน",
        table_profit: "กำไร / ขาดทุนสุทธิ",
        table_notes: "หมายเหตุ",
        table_actions: "จัดการ",
        
        no_data: "ยังไม่มีบันทึกยอดสรุปรายวัน",
        
        modal_title_add: "บันทึกยอดสรุปประจำวัน",
        modal_title_edit: "แก้ไขยอดสรุปรายวัน",
        modal_date: "ระบุวันที่ทำรายการ",
        modal_income: "รายรับวันนี้ (บาท)",
        modal_expense: "รายจ่ายวันนี้ (บาท)",
        modal_note: "หมายเหตุ / รายละเอียด (เช่น ซื้อสต็อกบด 2 ถุง, ซ่อมท่อน้ำ)",
        
        confirm_delete_title: "ยืนยันการลบข้อมูลรายวัน",
        confirm_delete_body: "คุณแน่ใจหรือไม่ที่จะลบยอดสรุปวันที่ \"{val}\"?",
        confirm_delete_sub: "การดำเนินการนี้จะลบตัวเลขรายวันและไม่สามารถย้อนกลับได้",
        confirm_delete_btn: "ยืนยันการลบ",
        
        confirm_clear_all: "⚠️ คุณแน่ใจหรือไม่ที่จะลบยอดสะสมรายวันทั้งหมดที่บันทึกมา?\nการดำเนินการนี้จะลบข้อมูลออกทั้งหมดและไม่สามารถย้อนคืนได้",
        confirm_duplicate_date: "⚠️ มียอดสรุปของวันที่ {val} อยู่ในระบบแล้ว!\nยอดเดิม: รายรับ ฿{income}, รายจ่าย ฿{expense}\n\nคุณต้องการบันทึกทับอัปเดตยอดเดิมของวันนี้ใช่หรือไม่?",
        
        // Reports summary labels
        rep_accum_income: "รายรับสะสม",
        rep_accum_expense: "รายจ่ายสะสม",
        rep_net_profit: "กำไรรวมสุทธิ",
        rep_avg_margin: "อัตรากำไรเฉลี่ย",
        rep_chart_title: "กราฟแนวโน้มกระแสเงินสดรายวัน",
        rep_table_title: "ตารางสรุปรายรับรายจ่ายรายวัน",
        rep_period_week: "สัปดาห์นี้",
        rep_period_month: "เดือนนี้ (30 วันล่าสุด)",
        rep_period_year: "ปีนี้",
        
        results_count: "พบ {val} รายการ",
        
        action_edit: "แก้ไข",
        action_delete: "ลบ",
        note_placeholder: "ระบุข้อมูลเพิ่มเติมของวันนี้ (ถ้ามี)...",
        sync_cloud: "โหมดเชื่อมต่อคลาวด์",
        sync_offline: "โหมดออฟไลน์",
        login_title: "เข้าสู่ระบบ",
        login_subtitle: "กรุณากรอกรหัสผ่านเพื่อเข้าใช้งานข้อมูลบัญชีร้านค้า",
        login_password_label: "รหัสผ่านสำหรับเข้าใช้งาน",
        login_error_text: "รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง",
        btn_login: "เข้าสู่ระบบ",
        lock_app: "ล็อกแอปพลิเคชัน"
    },
    en: {
        nav_dashboard: "Dashboard",
        nav_entries: "Daily Entries",
        nav_reports: "Reports",
        
        theme_light: "Light Mode",
        theme_dark: "Dark Mode",
        
        dashboard_title: "Dashboard",
        dashboard_subtitle: "Daily coffee shop financial overview and summary",
        entries_title: "Daily Entries",
        entries_subtitle: "Record daily income, expense, and notes",
        reports_title: "Reports Summary",
        reports_subtitle: "Analyze daily statements and export reports PDF",
        
        btn_add_entry: "Add Daily Entry",
        btn_view_all: "View All",
        btn_print_report: "Print Report / PDF",
        btn_clear_all: "Clear All Entries",
        btn_cancel: "Cancel",
        btn_save: "Save Changes",
        
        filter_search_notes: "Search Notes",
        filter_period: "Preset Period",
        filter_preset_all: "All Time",
        filter_preset_week: "This Week",
        filter_preset_month: "This Month",
        filter_preset_custom: "Custom Range",
        filter_start_date: "From Date",
        filter_end_date: "To Date",
        
        kpi_income: "Total Income",
        kpi_expense: "Total Expense",
        kpi_profit: "Net Profit",
        kpi_avg_daily: "Avg. Daily Income",
        
        kpi_vs_15d: "vs last 15d",
        kpi_profit_margin: "Profit margin <span id=\"profit-percentage\">{val}%</span> of income",
        kpi_loss_margin: "Net loss <span id=\"profit-percentage\">{val}%</span> of income",
        kpi_days_recorded: "<span id=\"days-recorded\">{val} days</span> recorded",
        
        table_date: "Date",
        table_income: "Daily Income",
        table_expense: "Daily Expense",
        table_profit: "Net Profit / Loss",
        table_notes: "Notes",
        table_actions: "Actions",
        
        no_data: "No daily summaries recorded yet.",
        
        modal_title_add: "Record Daily Summary",
        modal_title_edit: "Edit Daily Summary",
        modal_date: "Transaction Date",
        modal_income: "Daily Income (Baht)",
        modal_expense: "Daily Expense (Baht)",
        modal_note: "Notes / details (e.g. bought 2 bags of coffee beans, fixed water pipe)",
        
        confirm_delete_title: "Confirm Delete",
        confirm_delete_body: "Are you sure you want to delete daily summary for \"{val}\"?",
        confirm_delete_sub: "This action cannot be undone.",
        confirm_delete_btn: "Confirm Delete",
        
        confirm_clear_all: "⚠️ Are you sure you want to clear all daily summaries?\nThis action will delete all data permanently and cannot be undone!",
        confirm_duplicate_date: "⚠️ A summary for date {val} already exists!\nExisting: Income ฿{income}, Expense ฿{expense}\n\nDo you want to edit and overwrite this record?",
        
        // Reports summary labels
        rep_accum_income: "Total Income",
        rep_accum_expense: "Total Expense",
        rep_net_profit: "Net Profit",
        rep_avg_margin: "Avg. Profit Margin",
        rep_chart_title: "Daily Cash Flow Trend Chart",
        rep_table_title: "Daily Statement Table",
        rep_period_week: "This Week",
        rep_period_month: "This Month (Last 30d)",
        rep_period_year: "This Year",
        
        results_count: "Found {val} records",
        
        action_edit: "Edit",
        action_delete: "Delete",
        note_placeholder: "Specify additional info for today (if any)...",
        sync_cloud: "Cloud Sync Mode",
        sync_offline: "Offline Mode",
        login_title: "Log In",
        login_subtitle: "Please enter your password to access the store transactions",
        login_password_label: "Access Password",
        login_error_text: "Invalid password. Please try again.",
        btn_login: "Log In",
        lock_app: "Lock Application"
    }
};

function t(key, val = '') {
    const lang = state.settings.lang || 'th';
    let text = translations[lang][key] || key;
    if (val !== '') {
        text = text.replace('{val}', val);
    }
    return text;
}

// Chart.js references
let cashflowChartInstance = null;

// Pagination State
let currentPage = 1;
const itemsPerPage = 10;

// --- Initialize App ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Load data
    loadState();
    
    // Initialize Language Selector
    initLanguage();
    
    // 2. Initialize Lucide Icons
    lucide.createIcons();
    
    // 3. Set up Navigation
    initNavigation();
    
    // 4. Set up Theme Control
    initTheme();
    
    // 5. Render UI Components
    renderDashboard();
    renderTransactionsTable();
    initFilters();
    renderReports();
    
    // 6. Set up Forms & Modals
    initFormsAndModals();

    // 7. Set up Security Handlers
    initSecurityHandlers();
});

// --- Language Management ---
function initLanguage() {
    const langToggleBtn = document.getElementById('lang-toggle');
    
    state.settings.lang = state.settings.lang || 'th';
    updateLanguageUI();
    
    const toggleAction = () => {
        state.settings.lang = state.settings.lang === 'th' ? 'en' : 'th';
        saveState();
        updateLanguageUI();
        
        // Re-trigger navigation tab switch to refresh active view titles
        const activeNav = document.querySelector('.nav-item.active');
        if (activeNav) {
            const targetSectionId = activeNav.getAttribute('data-target');
            document.querySelectorAll('.nav-item').forEach(btn => {
                if (btn.getAttribute('data-target') === targetSectionId) {
                    btn.click();
                }
            });
        }
    };

    if (langToggleBtn) langToggleBtn.addEventListener('click', toggleAction);
}

function updateLanguageUI() {
    const lang = state.settings.lang || 'th';
    
    // Sidebar nav labels
    const navItems = document.querySelectorAll('.nav-item, .bottom-nav-item');
    navItems.forEach(item => {
        const target = item.getAttribute('data-target');
        const span = item.querySelector('span');
        if (span) {
            if (target === 'dashboard-section') span.textContent = t('nav_dashboard');
            if (target === 'transactions-section') span.textContent = t('nav_entries');
            if (target === 'reports-section') span.textContent = t('nav_reports');
        }
    });

    // Theme toggle text
    const themeText = document.querySelector('.theme-text');
    if (themeText) {
        themeText.textContent = state.settings.theme === 'light' ? t('theme_dark') : t('theme_light');
    }

    // Language selector labels
    const langBadge = document.querySelector('.lang-badge');
    if (langBadge) {
        langBadge.textContent = lang === 'th' ? 'EN' : 'TH';
    }

    // Add entry button
    const addBtnText = document.getElementById('btn-add-text');
    if (addBtnText) addBtnText.textContent = t('btn_add_entry');

    // Date Filter dropdown options
    const presetSelect = document.getElementById('filter-date-preset');
    if (presetSelect && presetSelect.options.length >= 4) {
        presetSelect.options[0].text = t('filter_preset_all');
        presetSelect.options[1].text = t('filter_preset_week');
        presetSelect.options[2].text = t('filter_preset_month');
        presetSelect.options[3].text = t('filter_preset_custom');
    }

    // Search input placeholder & label
    const searchLabel = document.querySelector('label[for="search-input"]');
    if (searchLabel) searchLabel.textContent = t('filter_search_notes');
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.placeholder = lang === 'th' ? 'พิมพ์คำค้นหาในหมายเหตุ...' : 'Type search terms in notes...';
    
    const filterPeriodLabel = document.querySelector('label[for="filter-date-preset"]');
    if (filterPeriodLabel) filterPeriodLabel.textContent = t('filter_period');

    // Custom date range inputs
    const startDateLabel = document.querySelector('label[for="filter-start-date"]');
    if (startDateLabel) startDateLabel.textContent = t('filter_start_date');
    const endDateLabel = document.querySelector('label[for="filter-end-date"]');
    if (endDateLabel) endDateLabel.textContent = t('filter_end_date');

    // Clear and export buttons
    const clearBtn = document.getElementById('btn-clear-all');
    if (clearBtn) {
        const span = clearBtn.querySelector('span');
        if (span) span.textContent = t('btn_clear_all');
    }

    // Reports Toolbar Period selector
    const reportPeriodSelect = document.getElementById('report-period-select');
    if (reportPeriodSelect && reportPeriodSelect.options.length >= 3) {
        reportPeriodSelect.options[0].text = t('rep_period_week');
        reportPeriodSelect.options[1].text = t('rep_period_month');
        reportPeriodSelect.options[2].text = t('rep_period_year');
    }
    
    const printReportBtn = document.getElementById('btn-print-report');
    if (printReportBtn) {
        const span = printReportBtn.querySelector('span');
        if (span) span.textContent = t('btn_print_report');
    }

    // Print Report Header title
    const reportPrintHeader = document.querySelector('.report-header-print h2');
    if (reportPrintHeader) reportPrintHeader.textContent = lang === 'th' ? 'รายงานสรุปรายรับรายจ่ายรายวันร้านกาแฟ' : 'Daily Coffee Shop Cash Flow Statement';

    // Widget Titles
    const widgetIncomeTitle = document.querySelector('.widget-income h3');
    if (widgetIncomeTitle) widgetIncomeTitle.textContent = t('kpi_income');
    const widgetExpenseTitle = document.querySelector('.widget-expense h3');
    if (widgetExpenseTitle) widgetExpenseTitle.textContent = t('kpi_expense');
    const widgetProfitTitle = document.querySelector('.widget-profit h3');
    if (widgetProfitTitle) widgetProfitTitle.textContent = t('kpi_profit');
    const widgetSalesTitle = document.querySelector('.widget-sales h3');
    if (widgetSalesTitle) widgetSalesTitle.textContent = t('kpi_avg_daily');

    // Recent transaction cards header
    const recentTxTitle = document.querySelector('.recent-transactions-card .card-header h3');
    if (recentTxTitle) recentTxTitle.textContent = t('rep_table_title');
    const viewAllBtn = document.querySelector('.btn-view-all');
    if (viewAllBtn) {
        viewAllBtn.innerHTML = `${t('btn_view_all')} <i data-lucide="arrow-right"></i>`;
    }

    // Table headers for all tables
    const tables = document.querySelectorAll('.data-table');
    tables.forEach(table => {
        const ths = table.querySelectorAll('thead th');
        if (ths.length >= 6) {
            ths[0].textContent = t('table_date');
            ths[1].textContent = t('table_income');
            ths[2].textContent = t('table_expense');
            ths[3].textContent = t('table_profit');
            ths[4].textContent = t('table_notes');
            ths[5].textContent = t('table_actions');
        }
    });

    // Reports section elements
    const repSummaryGrid = document.querySelector('.report-summary-cards');
    if (repSummaryGrid) {
        const repCards = repSummaryGrid.querySelectorAll('.rep-card');
        if (repCards.length >= 4) {
            repCards[0].querySelector('h4').textContent = t('rep_accum_income');
            repCards[1].querySelector('h4').textContent = t('rep_accum_expense');
            repCards[2].querySelector('h4').textContent = t('rep_net_profit');
            repCards[3].querySelector('h4').textContent = t('rep_avg_margin');
        }
    }
    const reportStatementTitle = document.querySelector('.report-statement-list h3');
    if (reportStatementTitle) reportStatementTitle.textContent = t('rep_table_title');
    const repDetailTable = document.querySelector('.report-detail-table');
    if (repDetailTable) {
        const ths = repDetailTable.querySelectorAll('thead th');
        if (ths.length >= 5) {
            ths[0].textContent = t('table_date');
            ths[1].textContent = t('table_income');
            ths[2].textContent = t('table_expense');
            ths[3].textContent = t('table_profit');
            ths[4].textContent = t('table_notes');
        }
    }
    const reportChartTitle = document.querySelector('.chart-header h3');
    if (reportChartTitle) reportChartTitle.textContent = t('rep_chart_title');

    // Modals
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) {
        modalTitle.textContent = document.getElementById('tx-id').value ? t('modal_title_edit') : t('modal_title_add');
    }
    const modalDateLabel = document.querySelector('label[for="tx-date"]');
    if (modalDateLabel) modalDateLabel.textContent = t('modal_date');
    const modalIncomeLabel = document.querySelector('label[for="tx-income"]');
    if (modalIncomeLabel) modalIncomeLabel.textContent = t('modal_income');
    const modalExpenseLabel = document.querySelector('label[for="tx-expense"]');
    if (modalExpenseLabel) modalExpenseLabel.textContent = t('modal_expense');
    const modalNoteLabel = document.querySelector('label[for="tx-note"]');
    if (modalNoteLabel) modalNoteLabel.textContent = t('modal_note');
    const modalNoteTextarea = document.getElementById('tx-note');
    if (modalNoteTextarea) modalNoteTextarea.placeholder = t('note_placeholder');
    const saveBtn = document.getElementById('btn-save-transaction');
    if (saveBtn) saveBtn.textContent = t('btn_save');

    // Modal footer cancel buttons
    const modalCloseBtns = document.querySelectorAll('.btn-close-modal');
    modalCloseBtns.forEach(btn => {
        if (btn.classList.contains('btn') && btn.tagName === 'BUTTON') {
            btn.textContent = t('btn_cancel');
        }
    });

    // Delete confirmation modal elements
    const deleteModalContainer = document.getElementById('delete-confirm-modal');
    if (deleteModalContainer) {
        deleteModalContainer.querySelector('.modal-header h3').textContent = t('confirm_delete_title');
        deleteModalContainer.querySelector('.modal-footer .btn-close-delete-modal').textContent = t('btn_cancel');
        deleteModalContainer.querySelector('#btn-confirm-delete').textContent = t('confirm_delete_btn');
        deleteModalContainer.querySelector('.text-muted.text-small').textContent = t('confirm_delete_sub');
    }
    
    // Update Sync Badge
    const syncStatusEl = document.getElementById('sync-status');
    if (syncStatusEl) {
        if (isCloudMode) {
            syncStatusEl.className = "sync-badge cloud-mode";
            syncStatusEl.innerHTML = `<i data-lucide="cloud" style="width: 12px; height: 12px; margin-right: 4px;"></i><span id="sync-status-text">${t('sync_cloud')}</span>`;
        } else {
            syncStatusEl.className = "sync-badge offline-mode";
            syncStatusEl.innerHTML = `<i data-lucide="cloud-off" style="width: 12px; height: 12px; margin-right: 4px;"></i><span id="sync-status-text">${t('sync_offline')}</span>`;
        }
    }
    
    // Login Modal Translations
    const loginTitle = document.getElementById('login-title');
    if (loginTitle) loginTitle.textContent = t('login_title');
    const loginSubtitle = document.getElementById('login-subtitle');
    if (loginSubtitle) loginSubtitle.textContent = t('login_subtitle');
    const loginPasswordLabel = document.getElementById('login-password-label');
    if (loginPasswordLabel) loginPasswordLabel.textContent = t('login_password_label');
    const loginErrorText = document.getElementById('login-error-text');
    if (loginErrorText) loginErrorText.textContent = t('login_error_text');
    const btnLoginText = document.getElementById('btn-login-text');
    if (btnLoginText) btnLoginText.textContent = t('btn_login');
    const loginLangText = document.getElementById('login-lang-text');
    if (loginLangText) loginLangText.textContent = lang === 'th' ? 'English' : 'ไทย';

    // Lock button translations
    const lockBtnText = document.querySelector('#lock-app-btn .lock-text');
    if (lockBtnText) lockBtnText.textContent = t('lock_app');
    
    // Refresh lucide icons for translated dynamic elements
    lucide.createIcons();
}

// --- Theme Management ---
function initTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeText = themeToggleBtn ? themeToggleBtn.querySelector('.theme-text') : null;
    
    if (state.settings.theme === 'light') {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        if (themeText) themeText.textContent = t('theme_dark');
    } else {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        if (themeText) themeText.textContent = t('theme_light');
    }
    
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            if (document.body.classList.contains('dark-theme')) {
                document.body.classList.remove('dark-theme');
                document.body.classList.add('light-theme');
                state.settings.theme = 'light';
                if (themeText) themeText.textContent = t('theme_dark');
            } else {
                document.body.classList.remove('light-theme');
                document.body.classList.add('dark-theme');
                state.settings.theme = 'dark';
                if (themeText) themeText.textContent = t('theme_light');
            }
            saveState();
            renderCharts(); // Redraw chart for color sync
        });
    }
}

// --- Navigation ---
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item, .bottom-nav-item, .btn-view-all');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetSectionId = item.getAttribute('data-target') || 
                (item.classList.contains('btn-view-all') ? 'transactions-section' : null);
            
            if (!targetSectionId) return;

            document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(btn => {
                if (btn.getAttribute('data-target') === targetSectionId) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            const pageTitle = document.getElementById('page-title');
            const pageSubtitle = document.getElementById('page-subtitle');
            
            switch (targetSectionId) {
                case 'dashboard-section':
                    pageTitle.textContent = 'Dashboard';
                    pageSubtitle.textContent = 'Daily coffee shop financial overview and summary';
                    renderDashboard();
                    break;
                case 'transactions-section':
                    pageTitle.textContent = 'บันทึกรายวัน';
                    pageSubtitle.textContent = 'บันทึกยอดสรุปบัญชีรายรับรายจ่าย และประวัติรายวัน';
                    currentPage = 1;
                    renderTransactionsTable();
                    break;
                case 'reports-section':
                    pageTitle.textContent = 'รายงานสรุป';
                    pageSubtitle.textContent = 'วิเคราะห์รายงานบัญชีรายวัน พร้อมเครื่องมือพิมพ์สรุป PDF';
                    renderReports();
                    break;
            }

            document.querySelectorAll('.content-section').forEach(section => {
                if (section.id === targetSectionId) {
                    section.classList.add('active');
                } else {
                    section.classList.remove('active');
                }
            });

            lucide.createIcons();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

// --- Login Overlay & Locking Helpers ---
function showLoginModal(show) {
    const overlay = document.getElementById('login-overlay');
    if (!overlay) return;
    if (show) {
        overlay.classList.add('active');
        // Clear UI data to prevent leaking info
        document.getElementById('dashboard-total-income').textContent = '฿0.00';
        document.getElementById('dashboard-total-expense').textContent = '฿0.00';
        const profitEl = document.getElementById('dashboard-net-profit');
        if (profitEl) {
            profitEl.textContent = '฿0.00';
            profitEl.className = 'value-loading';
        }
        document.getElementById('dashboard-avg-daily').textContent = '฿0.00';
        
        const dashboardTableBody = document.getElementById('dashboard-recent-table-body');
        if (dashboardTableBody) {
            dashboardTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">${t('login_title')}</td></tr>`;
        }
        const dashboardMobileList = document.getElementById('dashboard-recent-mobile-list');
        if (dashboardMobileList) {
            dashboardMobileList.innerHTML = '';
        }
        const transactionsTableBody = document.getElementById('transactions-table-body');
        if (transactionsTableBody) {
            transactionsTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">${t('login_title')}</td></tr>`;
        }
        const transactionsMobileList = document.getElementById('transactions-mobile-list');
        if (transactionsMobileList) {
            transactionsMobileList.innerHTML = '';
        }
        const reportTransactionsList = document.getElementById('report-transactions-list');
        if (reportTransactionsList) {
            reportTransactionsList.innerHTML = `<tr><td colspan="5" class="text-center text-muted">${t('login_title')}</td></tr>`;
        }
        
        // Hide lock buttons
        const lockBtn = document.getElementById('lock-app-btn');
        if (lockBtn) lockBtn.classList.add('hidden');
    } else {
        overlay.classList.remove('active');
    }
}

function handleUnauthorizedError() {
    alert(state.settings.lang === 'th' 
        ? '⚠️ เซสชันหมดอายุหรือรหัสผ่านไม่ถูกต้อง กรุณาล็อกอินใหม่' 
        : '⚠️ Session expired or invalid password. Please log in again.');
    localStorage.removeItem('gio_auth_token');
    showLoginModal(true);
}

// --- State Persistence ---
async function loadState() {
    // 1. First load from localStorage to show cached data immediately
    const savedState = localStorage.getItem('coffee_ledger_state');
    if (savedState) {
        try {
            state = JSON.parse(savedState);
            
            // Ensure settings and lang exist
            state.settings = state.settings || {};
            state.settings.theme = state.settings.theme || 'dark';
            state.settings.lang = state.settings.lang || 'th';
            
            // Migrate state structure if legacy schema or non-array transactions are found
            const hasLegacy = !Array.isArray(state.transactions) || 
                              state.categories || 
                              state.transactions.some(t => t.income === undefined || t.expense === undefined || t.amount !== undefined || t.categoryId !== undefined);
            if (hasLegacy) {
                console.log('Legacy schema detected, resetting to clean slate.');
                initializeDefaultState();
            }
        } catch (e) {
            console.error('Error parsing stored data, resetting...', e);
            initializeDefaultState();
        }
    } else {
        initializeDefaultState();
    }

    // 2. Perform async check to probe Cloudflare Pages Functions D1 API
    const token = localStorage.getItem('gio_auth_token');
    const headers = {};
    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }

    try {
        const response = await fetch('/api/transactions', { headers });
        
        // Handle 401 Unauthorized
        if (response.status === 401) {
            console.warn("D1 API returned 401 Unauthorized. Access is protected.");
            isCloudMode = true;
            showLoginModal(true);
            return;
        }

        if (response.ok) {
            const remoteTransactions = await response.json();
            if (Array.isArray(remoteTransactions)) {
                isCloudMode = true;
                
                // Hide login screen if authorized
                showLoginModal(false);

                // Show lock buttons only if password authentication is actually active on backend
                // (e.g. if we get 200 with no token but there was a password, wait, if we got 200 with NO token, it means it is not protected!)
                if (token) {
                    const lockBtn = document.getElementById('lock-app-btn');
                    if (lockBtn) lockBtn.classList.remove('hidden');
                }
                
                // If Cloud is empty but we have local transactions, populate Cloud DB with them
                if (remoteTransactions.length === 0 && state.transactions.length > 0) {
                    console.log("Cloud DB is empty. Syncing local transactions to D1 database...");
                    for (const tx of state.transactions) {
                        try {
                            await fetch('/api/transactions', {
                                method: 'POST',
                                headers: { 
                                    'Content-Type': 'application/json',
                                    'Authorization': 'Bearer ' + token
                                },
                                body: JSON.stringify(tx)
                            });
                        } catch (err) {
                            console.error("Failed to sync tx:", tx, err);
                        }
                    }
                } else {
                    // Otherwise, remote transactions are the source of truth
                    state.transactions = remoteTransactions;
                }

                // Keep local storage cache in sync
                localStorage.setItem('coffee_ledger_state', JSON.stringify(state));
                
                // Re-render UI with live data
                updateLanguageUI();
                renderDashboard();
                renderTransactionsTable();
                renderReports();
                console.log("Cloud Sync Mode active: Connected to Cloudflare D1.");
            }
        } else {
            console.warn("D1 API returned non-ok response. Offline mode active.");
            isCloudMode = false;
            showLoginModal(false);
            updateLanguageUI();
        }
    } catch (err) {
        console.log("D1 API is unreachable (expected in local offline environment). Running in offline localStorage mode.");
        isCloudMode = false;
        showLoginModal(false);
        updateLanguageUI();
    }
}

function saveState() {
    localStorage.setItem('coffee_ledger_state', JSON.stringify(state));
}

async function saveTransaction(tx) {
    if (isCloudMode) {
        try {
            const token = localStorage.getItem('gio_auth_token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = 'Bearer ' + token;

            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(tx)
            });
            
            if (response.status === 401) {
                handleUnauthorizedError();
                return;
            }

            if (!response.ok) {
                throw new Error(await response.text());
            }
        } catch (error) {
            console.error("Failed to save transaction to Cloud D1 database, saving locally instead:", error);
            alert(state.settings.lang === 'th' 
                ? '⚠️ ล้มเหลวในการเชื่อมต่อฐานข้อมูลคลาวด์ ระบบจะเซฟลงเครื่องไว้ชั่วคราว' 
                : '⚠️ Failed to connect to cloud database. Data will be saved locally.');
        }
    }
    
    // Always update the local state and localStorage cache
    const idx = state.transactions.findIndex(t => t.id === tx.id);
    if (idx !== -1) {
        state.transactions[idx] = tx;
    } else {
        state.transactions.push(tx);
    }
    saveState();
    
    // Re-render all views
    renderDashboard();
    renderTransactionsTable();
    renderReports();
}

function initializeDefaultState() {
    state.transactions = []; // Start completely empty for the user to key in their own daily figures
    state.settings = { theme: 'dark', lang: 'th' };
    saveState();
}

// --- Dashboard Calculations & Rendering ---
function renderDashboard() {
    const tx = state.transactions;
    const sortedTx = [...tx].sort((a, b) => parseLocalDate(b.date) - parseLocalDate(a.date));
    
    // 1. Calculations
    let totalIncome = 0;
    let totalExpense = 0;
    
    tx.forEach(t => {
        totalIncome += (t.income || 0);
        totalExpense += (t.expense || 0);
    });

    const netProfit = totalIncome - totalExpense;
    const daysRecorded = tx.length;
    const avgDailyIncome = daysRecorded > 0 ? (totalIncome / daysRecorded) : 0;
    
    // Percentage growth comparisons (Latest 15 days vs prior 15 days)
    let incomeCurrent15 = 0, incomePrior15 = 0;
    let expenseCurrent15 = 0, expensePrior15 = 0;
    
    const now = new Date();
    const midPointDate = new Date();
    midPointDate.setDate(now.getDate() - 15);
    
    tx.forEach(t => {
        const tDate = parseLocalDate(t.date);
        if (tDate >= midPointDate) {
            incomeCurrent15 += (t.income || 0);
            expenseCurrent15 += (t.expense || 0);
        } else {
            incomePrior15 += (t.income || 0);
            expensePrior15 += (t.expense || 0);
        }
    });

    const calcPercentageGrowth = (current, prior) => {
        if (prior === 0) return current > 0 ? '+100%' : '0%';
        const diff = current - prior;
        const pct = (diff / prior) * 100;
        return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
    };

    const incomeGrowthStr = calcPercentageGrowth(incomeCurrent15, incomePrior15);
    const expenseGrowthStr = calcPercentageGrowth(expenseCurrent15, expensePrior15);
    const profitMarginPct = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0';

    // 2. Populate widgets
    const formatCurrency = (val) => '฿' + val.toLocaleString(state.settings.lang === 'th' ? 'th-TH' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    document.getElementById('dashboard-total-income').textContent = formatCurrency(totalIncome);
    document.getElementById('dashboard-total-expense').textContent = formatCurrency(totalExpense);
    
    const profitEl = document.getElementById('dashboard-net-profit');
    profitEl.textContent = formatCurrency(netProfit);
    profitEl.className = netProfit >= 0 ? 'value-loading text-success' : 'value-loading text-danger';

    document.getElementById('dashboard-avg-daily').textContent = formatCurrency(avgDailyIncome);
    
    // Re-render trend badges safely without query crashes
    const incTrendBadge = document.getElementById('income-percentage').parentElement;
    const incIcon = incomeCurrent15 >= incomePrior15 ? 'trending-up' : 'trending-down';
    incTrendBadge.className = incomeCurrent15 >= incomePrior15 ? 'widget-trend text-success' : 'widget-trend text-danger';
    incTrendBadge.innerHTML = `<i data-lucide="${incIcon}"></i> <span id="income-percentage">${incomeGrowthStr}</span> ${t('kpi_vs_15d')}`;
    
    const expTrendBadge = document.getElementById('expense-percentage').parentElement;
    const expIcon = expenseCurrent15 >= expensePrior15 ? 'trending-up' : 'trending-down';
    expTrendBadge.className = expenseCurrent15 >= expensePrior15 ? 'widget-trend text-danger' : 'widget-trend text-success';
    expTrendBadge.innerHTML = `<i data-lucide="${expIcon}"></i> <span id="expense-percentage">${expenseGrowthStr}</span> ${t('kpi_vs_15d')}`;
    
    const profitTrendBadge = document.getElementById('profit-trend-badge');
    if (netProfit >= 0) {
        profitTrendBadge.className = 'widget-trend text-success';
        profitTrendBadge.innerHTML = `<i data-lucide="smile"></i> <span>${t('kpi_profit_margin', profitMarginPct)}</span>`;
    } else {
        profitTrendBadge.className = 'widget-trend text-danger';
        profitTrendBadge.innerHTML = `<i data-lucide="frown"></i> <span>${t('kpi_loss_margin', profitMarginPct)}</span>`;
    }
    
    const daysRecordedEl = document.getElementById('days-recorded');
    if (daysRecordedEl) {
        daysRecordedEl.parentElement.innerHTML = t('kpi_days_recorded', daysRecorded);
    }



    // 4. Render recent daily table
    const tableBody = document.getElementById('dashboard-recent-table-body');
    const mobileList = document.getElementById('dashboard-recent-mobile-list');
    
    if (tableBody && mobileList) {
        const recentTx = sortedTx.slice(0, 5);
        tableBody.innerHTML = '';
        mobileList.innerHTML = '';
        
        if (recentTx.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">${t('no_data')}</td></tr>`;
            mobileList.innerHTML = `<div class="text-center text-muted py-4">${t('no_data')}</div>`;
        } else {
            recentTx.forEach(tx => {
                const formattedDate = parseLocalDate(tx.date).toLocaleDateString(state.settings.lang === 'th' ? 'th-TH' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
                const pnl = tx.income - tx.expense;
                
                // Desktop Row
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="text-bold">${formattedDate}</td>
                    <td class="text-right text-success text-bold">฿${(tx.income || 0).toLocaleString(state.settings.lang === 'th' ? 'th-TH' : 'en-US', { minimumFractionDigits: 2 })}</td>
                    <td class="text-right text-danger text-bold">฿${(tx.expense || 0).toLocaleString(state.settings.lang === 'th' ? 'th-TH' : 'en-US', { minimumFractionDigits: 2 })}</td>
                    <td class="text-right text-bold ${pnl >= 0 ? 'text-success' : 'text-danger'}">
                        ฿${pnl.toLocaleString(state.settings.lang === 'th' ? 'th-TH' : 'en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td class="text-small text-muted" style="max-width: 200px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${tx.note || '-'}</td>
                    <td class="text-center">
                        <button class="row-icon-btn btn-edit-tx" data-id="${tx.id}" title="${t('action_edit')}"><i data-lucide="edit-2" style="width:14px;height:14px;"></i></button>
                        <button class="row-icon-btn btn-row-delete" data-id="${tx.id}" title="${t('action_delete')}"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
                    </td>
                `;
                tableBody.appendChild(row);
                
                // Mobile Card
                const card = document.createElement('div');
                card.className = 'mobile-tx-card';
                card.innerHTML = `
                    <div class="mobile-tx-header">
                        <div class="mobile-tx-title">${formattedDate}</div>
                        <div class="mobile-tx-amount ${pnl >= 0 ? 'text-success' : 'text-danger'}">
                            ฿${pnl.toLocaleString(state.settings.lang === 'th' ? 'th-TH' : 'en-US', { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                    <div class="mobile-tx-meta">
                        <div><span>${t('table_income')}:</span> <span class="text-success text-bold">฿${(tx.income || 0).toLocaleString(state.settings.lang === 'th' ? 'th-TH' : 'en-US', { minimumFractionDigits: 2 })}</span></div>
                        <div><span>${t('table_expense')}:</span> <span class="text-danger text-bold">฿${(tx.expense || 0).toLocaleString(state.settings.lang === 'th' ? 'th-TH' : 'en-US', { minimumFractionDigits: 2 })}</span></div>
                        ${tx.note ? `<div style="margin-top: 4px; font-style: italic; color: var(--text-muted);">${tx.note}</div>` : ''}
                    </div>
                    <div class="mobile-tx-actions">
                        <button class="row-icon-btn btn-edit-tx" data-id="${tx.id}"><i data-lucide="edit-2" style="width:14px;height:14px;"></i> ${t('action_edit')}</button>
                        <button class="row-icon-btn btn-row-delete" data-id="${tx.id}"><i data-lucide="trash-2" style="width:14px;height:14px;"></i> ${t('action_delete')}</button>
                    </div>
                `;
                mobileList.appendChild(card);
            });
        }
        bindRowActions();
    }
    lucide.createIcons();
}

// --- Render Chart ---
let dashboardChartInstance = null;
let reportChartInstance = null;

function renderCharts() {
    const isDark = document.body.classList.contains('dark-theme');
    const textThemeColor = isDark ? '#c2b9b5' : '#66564e';
    const gridThemeColor = isDark ? 'rgba(78, 60, 52, 0.2)' : 'rgba(142, 88, 60, 0.08)';
    
    // Helper to generate chart data for a given number of days
    const getChartDataForDays = (days) => {
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - days);
        
        const filteredTx = state.transactions
            .filter(t => parseLocalDate(t.date) >= dateLimit)
            .sort((a, b) => parseLocalDate(a.date) - parseLocalDate(b.date));

        const dailyData = {};
        for (let j = days - 1; j >= 0; j--) {
            const d = new Date();
            d.setDate(d.getDate() - j);
            const dateKey = d.toISOString().split('T')[0];
            dailyData[dateKey] = { income: 0, expense: 0 };
        }
        
        filteredTx.forEach(t => {
            if (dailyData[t.date]) {
                dailyData[t.date].income = t.income;
                dailyData[t.date].expense = t.expense;
            }
        });

        const labels = Object.keys(dailyData).map(k => {
            const d = parseLocalDate(k);
            return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
        });
        
        const incomeData = Object.values(dailyData).map(o => o.income);
        const expenseData = Object.values(dailyData).map(o => o.expense);

        return { labels, incomeData, expenseData };
    };

    // 1. Render Dashboard Chart (Based on Select dropdown)
    const dashboardCanvas = document.getElementById('dashboardCashflowChart');
    if (dashboardCanvas) {
        const dashboardPeriodSelect = document.getElementById('dashboard-period-select');
        const dashboardPeriod = dashboardPeriodSelect ? dashboardPeriodSelect.value : 'month';
        let dashboardChartPeriod = 30;
        if (dashboardPeriod === 'week') {
            dashboardChartPeriod = 7;
        } else if (dashboardPeriod === 'month') {
            dashboardChartPeriod = 30;
        } else if (dashboardPeriod === 'year') {
            dashboardChartPeriod = 365;
        }

        const { labels, incomeData, expenseData } = getChartDataForDays(dashboardChartPeriod);
        if (dashboardChartInstance) dashboardChartInstance.destroy();
        
        dashboardChartInstance = new Chart(dashboardCanvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'รายรับ (Income)',
                        data: incomeData,
                        borderColor: isDark ? '#34d399' : '#059669',
                        backgroundColor: isDark ? 'rgba(52, 211, 153, 0.85)' : 'rgba(5, 150, 105, 0.85)',
                        borderWidth: 1,
                        borderRadius: 6,
                        borderSkipped: 'bottom'
                    },
                    {
                        label: 'รายจ่าย (Expense)',
                        data: expenseData,
                        borderColor: isDark ? '#f87171' : '#dc2626',
                        backgroundColor: isDark ? 'rgba(248, 113, 113, 0.85)' : 'rgba(220, 38, 38, 0.85)',
                        borderWidth: 1,
                        borderRadius: 6,
                        borderSkipped: 'bottom'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { 
                            color: textThemeColor, 
                            font: { family: 'Outfit, Noto Sans Thai' },
                            usePointStyle: true,
                            pointStyle: 'circle',
                            boxWidth: 8
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: context => context.dataset.label + ': ฿' + context.raw.toLocaleString()
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: textThemeColor, font: { family: 'Outfit, Noto Sans Thai', size: 10 } }
                    },
                    y: {
                        grid: { color: gridThemeColor },
                        ticks: { 
                            color: textThemeColor, 
                            font: { family: 'Outfit, Noto Sans Thai', size: 10 },
                            callback: value => '฿' + value.toLocaleString()
                        }
                    }
                }
            }
        });
    }

    // 2. Render Reports Chart (Based on Select dropdown)
    const reportCanvas = document.getElementById('reportCashflowChart');
    if (reportCanvas) {
        const periodSelect = document.getElementById('report-period-select');
        const period = periodSelect ? periodSelect.value : 'month';
        let chartPeriod = 30;
        if (period === 'week') {
            chartPeriod = 7;
        } else if (period === 'month') {
            chartPeriod = 30;
        } else if (period === 'year') {
            chartPeriod = 365;
        }

        const { labels, incomeData, expenseData } = getChartDataForDays(chartPeriod);
        if (reportChartInstance) reportChartInstance.destroy();
        
        reportChartInstance = new Chart(reportCanvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'รายรับ (Income)',
                        data: incomeData,
                        borderColor: isDark ? '#34d399' : '#059669',
                        backgroundColor: isDark ? 'rgba(52, 211, 153, 0.85)' : 'rgba(5, 150, 105, 0.85)',
                        borderWidth: 1,
                        borderRadius: 6,
                        borderSkipped: 'bottom'
                    },
                    {
                        label: 'รายจ่าย (Expense)',
                        data: expenseData,
                        borderColor: isDark ? '#f87171' : '#dc2626',
                        backgroundColor: isDark ? 'rgba(248, 113, 113, 0.85)' : 'rgba(220, 38, 38, 0.85)',
                        borderWidth: 1,
                        borderRadius: 6,
                        borderSkipped: 'bottom'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { 
                            color: textThemeColor, 
                            font: { family: 'Outfit, Noto Sans Thai' },
                            usePointStyle: true,
                            pointStyle: 'circle',
                            boxWidth: 8
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: context => context.dataset.label + ': ฿' + context.raw.toLocaleString()
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: textThemeColor, font: { family: 'Outfit, Noto Sans Thai', size: 10 } }
                    },
                    y: {
                        grid: { color: gridThemeColor },
                        ticks: { 
                            color: textThemeColor, 
                            font: { family: 'Outfit, Noto Sans Thai', size: 10 },
                            callback: value => '฿' + value.toLocaleString()
                        }
                    }
                }
            }
        });
    }
}

// --- Filters ---
function initFilters() {
    const searchInput = document.getElementById('search-input');
    const filterDatePreset = document.getElementById('filter-date-preset');
    const customDateContainer = document.getElementById('custom-date-range-container');
    const startDateInput = document.getElementById('filter-start-date');
    const endDateInput = document.getElementById('filter-end-date');

    const triggerFilter = () => {
        currentPage = 1;
        renderTransactionsTable();
    };

    searchInput.addEventListener('input', triggerFilter);
    
    filterDatePreset.addEventListener('change', (e) => {
        if (e.target.value === 'custom') {
            customDateContainer.classList.remove('hidden');
            const today = new Date();
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            
            startDateInput.value = lastMonth.toISOString().split('T')[0];
            endDateInput.value = today.toISOString().split('T')[0];
        } else {
            customDateContainer.classList.add('hidden');
        }
        triggerFilter();
    });

    startDateInput.addEventListener('change', triggerFilter);
    endDateInput.addEventListener('change', triggerFilter);

    // CSV Download
    document.getElementById('btn-export-csv').addEventListener('click', exportCSV);
}

function getFilteredTransactions() {
    const searchQuery = document.getElementById('search-input').value.toLowerCase().trim();
    const datePreset = document.getElementById('filter-date-preset').value;
    const startDate = document.getElementById('filter-start-date').value;
    const endDate = document.getElementById('filter-end-date').value;

    return state.transactions.filter(t => {
        // Search note
        if (searchQuery && !(t.note || '').toLowerCase().includes(searchQuery)) return false;

        // Date preset
        const txDate = parseLocalDate(t.date);
        txDate.setHours(0,0,0,0);
        
        const today = new Date();
        today.setHours(0,0,0,0);

        if (datePreset === 'week') {
            const day = today.getDay();
            const diff = today.getDate() - day + (day === 0 ? -6 : 1);
            const startOfWeek = new Date(today.setDate(diff));
            startOfWeek.setHours(0,0,0,0);
            if (txDate < startOfWeek) return false;
        } else if (datePreset === 'month') {
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            if (txDate < startOfMonth) return false;
        } else if (datePreset === 'custom') {
            if (startDate) {
                const sDate = parseLocalDate(startDate);
                sDate.setHours(0,0,0,0);
                if (txDate < sDate) return false;
            }
            if (endDate) {
                const eDate = parseLocalDate(endDate);
                eDate.setHours(0,0,0,0);
                if (txDate > eDate) return false;
            }
        }

        return true;
    });
}

// --- Render Table in Transactions Tab ---
function renderTransactionsTable() {
    let filteredList = getFilteredTransactions();
    filteredList.sort((a, b) => parseLocalDate(b.date) - parseLocalDate(a.date));

    const isTh = state.settings.lang === 'th';
    const countStr = filteredList.length.toLocaleString(isTh ? 'th-TH' : 'en-US');
    document.getElementById('results-count').textContent = t('results_count', countStr);

    const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedList = filteredList.slice(startIndex, startIndex + itemsPerPage);

    const tableBody = document.getElementById('transactions-table-body');
    const mobileList = document.getElementById('transactions-mobile-list');
    
    tableBody.innerHTML = '';
    mobileList.innerHTML = '';

    if (paginatedList.length === 0) {
        const noResultsText = isTh ? 'ไม่พบข้อมูลตามช่วงเวลาที่คัดกรอง' : 'No statements found for the selected period.';
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">${noResultsText}</td></tr>`;
        mobileList.innerHTML = `<div class="text-center text-muted py-5">${noResultsText}</div>`;
    } else {
        paginatedList.forEach(tx => {
            const formattedDate = parseLocalDate(tx.date).toLocaleDateString(isTh ? 'th-TH' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
            const pnl = tx.income - tx.expense;
            
            // Desktop
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="text-bold">${formattedDate}</td>
                <td class="text-right text-success text-bold">฿${(tx.income || 0).toLocaleString(isTh ? 'th-TH' : 'en-US', { minimumFractionDigits: 2 })}</td>
                <td class="text-right text-danger text-bold">฿${(tx.expense || 0).toLocaleString(isTh ? 'th-TH' : 'en-US', { minimumFractionDigits: 2 })}</td>
                <td class="text-right text-bold ${pnl >= 0 ? 'text-success' : 'text-danger'}">
                    ฿${pnl.toLocaleString(isTh ? 'th-TH' : 'en-US', { minimumFractionDigits: 2 })}
                </td>
                <td class="text-small text-muted" style="max-width: 250px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${tx.note || ''}">${tx.note || '-'}</td>
                <td class="text-center">
                    <button class="row-icon-btn btn-edit-tx" data-id="${tx.id}" title="${t('action_edit')}"><i data-lucide="edit-2" style="width:14px;height:14px;"></i></button>
                    <button class="row-icon-btn btn-row-delete" data-id="${tx.id}" title="${t('action_delete')}"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
                </td>
            `;
            tableBody.appendChild(row);

            // Mobile
            const card = document.createElement('div');
            card.className = 'mobile-tx-card';
            card.innerHTML = `
                <div class="mobile-tx-header">
                    <div class="mobile-tx-title">${formattedDate}</div>
                    <div class="mobile-tx-amount ${pnl >= 0 ? 'text-success' : 'text-danger'}">
                        ฿${pnl.toLocaleString(isTh ? 'th-TH' : 'en-US', { minimumFractionDigits: 2 })}
                    </div>
                </div>
                <div class="mobile-tx-meta">
                    <div><span>${t('table_income')}:</span> <span class="text-success text-bold">฿${(tx.income || 0).toLocaleString(isTh ? 'th-TH' : 'en-US', { minimumFractionDigits: 2 })}</span></div>
                    <div><span>${t('table_expense')}:</span> <span class="text-danger text-bold">฿${(tx.expense || 0).toLocaleString(isTh ? 'th-TH' : 'en-US', { minimumFractionDigits: 2 })}</span></div>
                    ${tx.note ? `<div style="margin-top: 4px; font-style: italic; color: var(--text-muted);">${tx.note}</div>` : ''}
                </div>
                <div class="mobile-tx-actions">
                    <button class="row-icon-btn btn-edit-tx" data-id="${tx.id}"><i data-lucide="edit-2" style="width:14px;height:14px;"></i> ${t('action_edit')}</button>
                    <button class="row-icon-btn btn-row-delete" data-id="${tx.id}"><i data-lucide="trash-2" style="width:14px;height:14px;"></i> ${t('action_delete')}</button>
                </div>
            `;
            mobileList.appendChild(card);
        });
    }

    renderPagination(totalPages);
    bindRowActions();
    lucide.createIcons();
}

function renderPagination(totalPages) {
    const container = document.getElementById('pagination-container');
    container.innerHTML = '';

    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerHTML = '<i data-lucide="chevron-left" style="width:16px;height:16px;"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTransactionsTable();
        }
    });
    container.appendChild(prevBtn);

    const pagesDiv = document.createElement('div');
    pagesDiv.className = 'pagination-pages';
    
    for (let p = 1; p <= totalPages; p++) {
        if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
            const pBtn = document.createElement('button');
            pBtn.className = `page-btn ${currentPage === p ? 'active' : ''}`;
            pBtn.textContent = p;
            pBtn.addEventListener('click', () => {
                currentPage = p;
                renderTransactionsTable();
            });
            pagesDiv.appendChild(pBtn);
        } else if (p === currentPage - 2 || p === currentPage + 2) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.style.padding = '0 6px';
            ellipsis.style.alignSelf = 'flex-end';
            pagesDiv.appendChild(ellipsis);
        }
    }
    container.appendChild(pagesDiv);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerHTML = '<i data-lucide="chevron-right" style="width:16px;height:16px;"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderTransactionsTable();
        }
    });
    container.appendChild(nextBtn);
}

function bindRowActions() {
    document.querySelectorAll('.btn-edit-tx').forEach(btn => {
        btn.addEventListener('click', () => {
            const txId = btn.getAttribute('data-id');
            openTransactionModal(txId);
        });
    });

    document.querySelectorAll('.btn-row-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const txId = btn.getAttribute('data-id');
            openDeleteConfirmModal(txId);
        });
    });
}

// --- Reports ---
function renderReports() {
    const period = document.getElementById('report-period-select').value;
    const now = new Date();
    
    let startDate = new Date();
    let endDate = new Date(now);

    startDate.setHours(0,0,0,0);
    endDate.setHours(23,59,59,999);

    if (period === 'week') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        startDate.setDate(diff);
    } else if (period === 'month') {
        startDate.setDate(now.getDate() - 30);
    } else if (period === 'year') {
        startDate = new Date(now.getFullYear(), 0, 1);
    }

    const reportTx = state.transactions.filter(t => {
        const tDate = parseLocalDate(t.date);
        return tDate >= startDate && tDate <= endDate;
    });

    reportTx.sort((a, b) => parseLocalDate(b.date) - parseLocalDate(a.date));

    const isTh = state.settings.lang === 'th';
    const opt = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    const prefix = isTh ? 'ช่วงเวลา: ' : 'Period: ';
    document.getElementById('report-print-date-range').textContent = `${prefix}${startDate.toLocaleDateString(isTh ? 'th-TH' : 'en-US', opt)} - ${endDate.toLocaleDateString(isTh ? 'th-TH' : 'en-US', opt)}`;
    document.getElementById('report-generation-time').textContent = new Date().toLocaleString(isTh ? 'th-TH' : 'en-US');

    let totalIncome = 0;
    let totalExpense = 0;

    reportTx.forEach(t => {
        totalIncome += (t.income || 0);
        totalExpense += (t.expense || 0);
    });

    const netProfit = totalIncome - totalExpense;
    const margin = totalIncome > 0 ? ((netProfit / totalIncome) * 100) : 0;

    const formatCurrency = (val) => '฿' + val.toLocaleString(isTh ? 'th-TH' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    document.getElementById('rep-total-income').textContent = formatCurrency(totalIncome);
    document.getElementById('rep-total-expense').textContent = formatCurrency(totalExpense);
    
    const profitEl = document.getElementById('rep-net-profit');
    profitEl.textContent = formatCurrency(netProfit);
    profitEl.className = netProfit >= 0 ? 'text-success' : 'text-danger';
    
    const marginEl = document.getElementById('rep-profit-margin');
    marginEl.textContent = `${margin.toFixed(1)}%`;
    marginEl.className = margin >= 0 ? 'text-primary' : 'text-danger';

    // Detailed lists report
    const reportListBody = document.getElementById('report-transactions-list');
    reportListBody.innerHTML = '';

    if (reportTx.length === 0) {
        const noDataText = isTh ? 'ไม่มีประวัติสรุปข้อมูลในช่วงเวลานี้' : 'No statements recorded for this period.';
        reportListBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">${noDataText}</td></tr>`;
    } else {
        reportTx.forEach(t => {
            const dateStr = parseLocalDate(t.date).toLocaleDateString(isTh ? 'th-TH' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
            const pnl = t.income - t.expense;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="text-bold">${dateStr}</td>
                <td class="text-right text-success text-bold">฿${(t.income || 0).toLocaleString(isTh ? 'th-TH' : 'en-US', { minimumFractionDigits: 2 })}</td>
                <td class="text-right text-danger text-bold">฿${(t.expense || 0).toLocaleString(isTh ? 'th-TH' : 'en-US', { minimumFractionDigits: 2 })}</td>
                <td class="text-right text-bold ${pnl >= 0 ? 'text-success' : 'text-danger'}">
                    ฿${pnl.toLocaleString(isTh ? 'th-TH' : 'en-US', { minimumFractionDigits: 2 })}
                </td>
                <td class="text-small">${t.note || '-'}</td>
            `;
            reportListBody.appendChild(tr);
        });
    }
    
    // Render the trend chart matching this report period
    renderCharts();
}

// --- Forms & Modals Handlers ---
function initFormsAndModals() {
    document.getElementById('report-period-select').addEventListener('change', renderReports);
    
    const dbPeriodSelect = document.getElementById('dashboard-period-select');
    if (dbPeriodSelect) {
        dbPeriodSelect.addEventListener('change', renderCharts);
    }

    const modal = document.getElementById('transaction-modal');
    
    document.querySelectorAll('.btn-add-transaction').forEach(btn => {
        btn.addEventListener('click', () => {
            openTransactionModal();
        });
    });

    document.querySelectorAll('.btn-close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    });

    const txForm = document.getElementById('transaction-form');
    txForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const txId = document.getElementById('tx-id').value;
        const date = document.getElementById('tx-date').value;
        const income = parseFloat(document.getElementById('tx-income').value) || 0;
        const expense = parseFloat(document.getElementById('tx-expense').value) || 0;
        const note = document.getElementById('tx-note').value.trim();

        // VALIDATION: Check duplicate date on new entries
        if (!txId) {
            const duplicate = state.transactions.find(t => t.date === date);
            if (duplicate) {
                const isTh = state.settings.lang === 'th';
                const formattedDate = parseLocalDate(date).toLocaleDateString(isTh ? 'th-TH' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
                
                let confirmMsg = t('confirm_duplicate_date', formattedDate);
                confirmMsg = confirmMsg.replace('{income}', duplicate.income.toLocaleString(isTh ? 'th-TH' : 'en-US', { minimumFractionDigits: 2 }));
                confirmMsg = confirmMsg.replace('{expense}', duplicate.expense.toLocaleString(isTh ? 'th-TH' : 'en-US', { minimumFractionDigits: 2 }));
                
                const confirmOverwrite = confirm(confirmMsg);
                
                if (confirmOverwrite) {
                    const updatedTx = {
                        id: duplicate.id,
                        date, income, expense, note
                    };
                    await saveTransaction(updatedTx);
                    modal.classList.remove('active');
                }
                return;
            }
        }

        if (txId) {
            // Edit existing
            const idx = state.transactions.findIndex(t => t.id === txId);
            if (idx !== -1) {
                // Check if they changed date to another existing date
                const duplicateOther = state.transactions.find(t => t.date === date && t.id !== txId);
                if (duplicateOther) {
                    alert(state.settings.lang === 'th' 
                        ? '⚠️ ไม่สามารถแก้ไขวันที่ไปเป็นวันที่มียอดบันทึกอยู่แล้วได้ หากต้องการแก้ไขกรุณาลบรายการวันนั้นออกก่อนครับ' 
                        : '⚠️ Cannot change date to an already recorded day. Please delete that day first.');
                    return;
                }
                
                const updatedTx = {
                    id: txId,
                    date, income, expense, note
                };
                await saveTransaction(updatedTx);
            }
        } else {
            // Add new
            const newTx = {
                id: `day-${Date.now()}`,
                date, income, expense, note
            };
            await saveTransaction(newTx);
        }

        modal.classList.remove('active');
    });

    // Delete Modal
    const deleteModal = document.getElementById('delete-confirm-modal');
    
    document.querySelectorAll('.btn-close-delete-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            deleteModal.classList.remove('active');
        });
    });

    // Clear all
    document.getElementById('btn-clear-all').addEventListener('click', async () => {
        if (confirm(t('confirm_clear_all'))) {
            if (isCloudMode) {
                try {
                    const token = localStorage.getItem('gio_auth_token');
                    const headers = {};
                    if (token) headers['Authorization'] = 'Bearer ' + token;

                    const response = await fetch('/api/transactions?id=all', {
                        method: 'DELETE',
                        headers: headers
                    });
                    if (response.status === 401) {
                        handleUnauthorizedError();
                        return;
                    }
                    if (!response.ok) {
                        throw new Error(await response.text());
                    }
                } catch (error) {
                    console.error("Failed to clear Cloud D1 database:", error);
                    alert(state.settings.lang === 'th' 
                        ? '⚠️ ล้มเหลวในการลบข้อมูลบนคลาวด์' 
                        : '⚠️ Failed to clear cloud database.');
                }
            }
            state.transactions = [];
            saveState();
            
            renderDashboard();
            renderTransactionsTable();
            renderReports();
            
            alert(state.settings.lang === 'th' ? 'ลบข้อมูลประวัติรายวันทั้งหมดเรียบร้อยแล้วครับ' : 'All daily summaries have been successfully deleted.');
        }
    });

    document.getElementById('btn-print-report').addEventListener('click', () => {
        window.print();
    });

    // Reset whole app logic
    const resetAppBtn = document.getElementById('reset-app');
    if (resetAppBtn) {
        resetAppBtn.addEventListener('click', () => {
            if (confirm('⚠️ คำเตือน! คุณต้องการรีเซ็ตระบบทั้งหมดใช่หรือไม่?\nข้อมูลธุรกรรมรายวันและสถิติสะสมทั้งหมดจะถูกลบออกถาวร และระบบจะเริ่มใหม่แบบว่างเปล่า')) {
                localStorage.removeItem('coffee_ledger_state');
                window.location.reload();
            }
        });
    }
}

// --- Security & Login Handlers ---
function initSecurityHandlers() {
    const loginForm = document.getElementById('login-form');
    const loginPasswordInput = document.getElementById('login-password');
    const btnTogglePassword = document.getElementById('btn-toggle-password');
    const loginErrorMsg = document.getElementById('login-error-msg');
    const loginLangToggle = document.getElementById('login-lang-toggle');
    const lockAppBtn = document.getElementById('lock-app-btn');

    // Toggle Password Visibility
    if (btnTogglePassword && loginPasswordInput) {
        btnTogglePassword.addEventListener('click', () => {
            const isPassword = loginPasswordInput.getAttribute('type') === 'password';
            loginPasswordInput.setAttribute('type', isPassword ? 'text' : 'password');
            btnTogglePassword.innerHTML = `<i data-lucide="${isPassword ? 'eye-off' : 'eye'}" style="width: 18px; height: 18px;"></i>`;
            lucide.createIcons();
        });
    }

    // Toggle Language inside Login Overlay
    if (loginLangToggle) {
        loginLangToggle.addEventListener('click', () => {
            state.settings.lang = state.settings.lang === 'th' ? 'en' : 'th';
            saveState();
            updateLanguageUI();
        });
    }

    // Submit Password Form
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = loginPasswordInput.value;
            
            // Show loading state
            const btnSubmit = document.getElementById('btn-login-submit');
            if (!btnSubmit) return;
            const originalBtnText = btnSubmit.innerHTML;
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = `<i data-lucide="loader-2" class="animate-spin" style="width: 18px; height: 18px; margin-right: 6px;"></i><span>Loading...</span>`;
            lucide.createIcons();
            
            if (loginErrorMsg) loginErrorMsg.classList.add('hidden');

            try {
                // Test the password against D1 API using GET probe
                const response = await fetch('/api/transactions', {
                    headers: { 'Authorization': 'Bearer ' + password }
                });

                if (response.ok) {
                    // Password is correct!
                    localStorage.setItem('gio_auth_token', password);
                    loginPasswordInput.value = '';
                    showLoginModal(false);
                    
                    // Reload state to fetch all data and update UI
                    await loadState();
                } else {
                    // Password incorrect (e.g. 401)
                    if (loginErrorMsg) loginErrorMsg.classList.remove('hidden');
                }
            } catch (err) {
                console.error("Login verification error:", err);
                alert(state.settings.lang === 'th' 
                    ? '⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง' 
                    : '⚠️ Connection error. Please try again.');
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = originalBtnText;
                lucide.createIcons();
            }
        });
    }

    // Lock/Logout handlers
    const lockAction = () => {
        if (confirm(state.settings.lang === 'th' 
            ? 'คุณต้องการล็อกหน้าจอและออกจากระบบใช่หรือไม่?' 
            : 'Are you sure you want to lock and log out?')) {
            localStorage.removeItem('gio_auth_token');
            // Clear D1 transactions cache memory
            state.transactions = [];
            saveState();
            // Reload page to start with a fresh slate and bring up the login dialog
            window.location.reload();
        }
    };

    if (lockAppBtn) {
        lockAppBtn.addEventListener('click', lockAction);
    }
}


function openDeleteConfirmModal(txId) {
    const tx = state.transactions.find(t => t.id === txId);
    if (!tx) return;

    const formattedDate = parseLocalDate(tx.date).toLocaleDateString(state.settings.lang === 'th' ? 'th-TH' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    document.getElementById('delete-tx-title').textContent = formattedDate;
    
    const deleteModal = document.getElementById('delete-confirm-modal');
    deleteModal.classList.add('active');
    
    document.getElementById('btn-confirm-delete').onclick = async () => {
        if (isCloudMode) {
            try {
                const token = localStorage.getItem('gio_auth_token');
                const headers = {};
                if (token) headers['Authorization'] = 'Bearer ' + token;

                const response = await fetch(`/api/transactions?id=${encodeURIComponent(txId)}`, {
                    method: 'DELETE',
                    headers: headers
                });
                if (response.status === 401) {
                    handleUnauthorizedError();
                    return;
                }
                if (!response.ok) {
                    throw new Error(await response.text());
                }
            } catch (error) {
                console.error("Failed to delete transaction from Cloud D1 database, deleting locally instead:", error);
                alert(state.settings.lang === 'th' 
                    ? '⚠️ ล้มเหลวในการลบข้อมูลบนฐานข้อมูลคลาวด์ จะทำรายการลบบนเบราว์เซอร์แทน' 
                    : '⚠️ Failed to delete on cloud database. Transaction will be deleted locally.');
            }
        }
        
        state.transactions = state.transactions.filter(t => t.id !== txId);
        saveState();
        deleteModal.classList.remove('active');
        
        renderDashboard();
        renderTransactionsTable();
        renderReports();
    };
}

function openTransactionModal(txId = null) {
    const modal = document.getElementById('transaction-modal');
    const modalTitle = document.getElementById('modal-title');
    const txForm = document.getElementById('transaction-form');
    
    txForm.reset();
    document.getElementById('tx-id').value = '';
    
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    if (txId) {
        modalTitle.textContent = 'แก้ไขยอดสรุปประจำวัน';
        const tx = state.transactions.find(t => t.id === txId);
        if (!tx) return;

        document.getElementById('tx-id').value = tx.id;
        document.getElementById('tx-date').value = tx.date;
        document.getElementById('tx-income').value = tx.income;
        document.getElementById('tx-expense').value = tx.expense;
        document.getElementById('tx-note').value = tx.note || '';
    } else {
        modalTitle.textContent = 'บันทึกยอดสรุปประจำวัน';
        document.getElementById('tx-date').value = dateStr;
        document.getElementById('tx-income').value = '0.00';
        document.getElementById('tx-expense').value = '0.00';
    }

    modal.classList.add('active');
    lucide.createIcons();
}

// --- CSV Export ---
function exportCSV() {
    const filteredTx = getFilteredTransactions();
    filteredTx.sort((a, b) => parseLocalDate(b.date) - parseLocalDate(a.date));

    let csvContent = '\uFEFF'; // Excel encoding BOM for Thai support
    csvContent += 'วันที่,ยอดรายรับรวม (บาท),ยอดรายจ่ายรวม (บาท),กำไร/ขาดทุนสุทธิ (บาท),หมายเหตุ/รายละเอียด\n';

    filteredTx.forEach(t => {
        const escapeCSV = (str) => {
            if (!str) return '""';
            return `"${String(str).replace(/"/g, '""')}"`;
        };

        const dateStr = t.date;
        const income = t.income;
        const expense = t.expense;
        const pnl = income - expense;
        const note = escapeCSV(t.note);

        csvContent += `${dateStr},${income},${expense},${pnl},${note}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `coffee_ledger_daily_summary_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}



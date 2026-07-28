# Toys Factory ERP AI Coding Rules and Constraints

These instructions govern all future modifications to Toys Factory ERP to maintain UI consistency, codebase safety, and logical simplicity.

## Architecture & Layout Rules
1. **Multi-Page App (MPA):**
   - Each top-level module has its sub-menus split into separate dedicated HTML files (e.g., `crm-leads.html`, `sales-quotations.html`). Monolithic single-file modules are deprecated.
   - Standard components like sidebar (`<app-sidebar>`), header (`<app-header>`), and footer (`<app-footer>`) are injected via `layout.js`.
   - Never inject popups/modals for primary data creation. All creation or editing forms must reside inline within the same route/page layout.

2. **Inline Form Navigation Pattern:**
   - Standardize on `[module]-main-view` for the listing (table/pipeline board) and `[module]-form-view` for the data entry screen.
   - Show/hide them using class lists (e.g., `hidden`).
   - Reuse the `<app-form-header>` custom element for the top header of all inline forms:
     ```html
     <app-form-header 
       title-id="optional-dynamic-title-id" 
       title="Create Quote" 
       subtitle="Brief descriptive subtitle" 
       back-action="window.showSalesMainView()">
     </app-form-header>
     ```

## Form Fields & UX Standards
1. **Low Cognitive Load Forms:**
   - Keep basic fields (Name, Status, Dates, core details) visible at all times.
   - Hide complex or secondary fields (such as credit terms, WhatsApp flags, address grids) behind a collapsible toggle labelled **"Show Advanced Details"**.
   - Make all complex details collapsed by default.

2. **Validation Safeguards:**
   - **Do not make email required.** It is optional by default to support low-literacy or quick-record environments.
   - Only make absolutely necessary fields `required` (e.g., Name, total value, or identifier SKU).

3. **Global Control / Reusability:**
   - Always place global UI components or shared styles inside `layout.js` or `index.css`.
   - Before building new elements, check if a global Web Component or helper exists in `js/shared.js`.

## Interactive Elements & UX Standards
1. **Pointer Cursors:**
   - Always ensure that all clickable links, buttons, option menus, toggle inputs, and custom interactive items have `cursor: pointer` applied. Do not rely solely on default browser styling.
   - Maintain global CSS rules in `index.css` to enforce `cursor: pointer` across standard interactive elements (`a`, `button`, `input[type="submit"]`, `[role="button"]`, etc.).


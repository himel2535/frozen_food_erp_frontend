# Toys Factory ERP File Map

Use this map before searching the repo when a request mentions shared UI, layout, or navigation.

## Shared Shell
- `layout.js`
  Shared web components and shell markup:
  `app-sidebar`, `app-header`, `app-footer`, `app-form-header`
- `js/shared.js`
  Shared client state, auth guard, sidebar collapse behavior, icon bootstrapping, global helpers
- `index.css`
  Global styles, shared polish, sidebar motion, reusable visual rules

## Module Screens
- `crm.html`, `sales.html`, `inventory.html`, `purchases.html`, `accounting.html`, `hrm.html`, `payroll.html`, `projects.html`, `manufacturing.html`, `reports.html`, `settings.html`
  Route-level layout and module-specific markup
- `js/crm.js`, `js/sales.js`, `js/inventory.js`, `js/purchases.js`, `js/accounting.js`, `js/hrm.js`, `js/payroll.js`, `js/projects.js`, `js/manufacturing.js`, `js/reports.js`, `js/settings.js`
  Module-specific behaviors and rendering

## Data and Services
- `js/crm-service.js`
  CRM state shaping and service helpers
- `js/firebase.js`
  Remote sync and realtime app state integration

## Decision Rules
- If the change affects every page's sidebar, header, footer, or shell layout, start in `layout.js`.
- If the change affects collapse state, auth guards, or reusable UI behavior, start in `js/shared.js`.
- If the change is purely visual and reused across modules, start in `index.css`.
- If the change only affects one module's table, form, filters, or views, start in that module's HTML and JS pair.

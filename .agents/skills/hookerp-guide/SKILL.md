---
name: hookerp-guide
description: Specific development guidelines for creating, modifying, and structuring screens in Toys Factory ERP. Includes routing, layout parameters, form design, and dynamic rendering scripts.
---

# Toys Factory ERP Development Skill

Use this skill when designing, building, or modifying views, navigation menus, and screens for Toys Factory ERP.

## Page Layout Template
Each top-level module has its own page containing the sidebar, header, main view, form view, and footer. Keep them clean and organized inside `<main>`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Module Name - Toys Factory ERP</title>
  <link rel="stylesheet" href="/index.css">
</head>
<body class="bg-slate-50 font-sans text-slate-800 antialiased">
  <div id="screen-workspace" class="min-h-screen flex">
    <app-sidebar mode="tenant"></app-sidebar>
    
    <main class="flex-1 flex flex-col min-h-screen overflow-hidden">
      <app-header mode="tenant" title="Enterprise Workspace"></app-header>
      
      <!-- List View -->
      <div id="[module]-main-view" class="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 flex flex-col justify-between">
         <!-- Content (Header with Add Button, Tables, Lists, Kanban) -->
         <app-footer></app-footer>
      </div>

      <!-- Form View (Hidden by Default) -->
      <div id="[module]-form-view" class="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 hidden bg-slate-50">
         <div class="max-w-3xl mx-auto w-full space-y-6">
            <app-form-header 
              title="Add New [Entity]" 
              subtitle="Capture required fields to create a new profile." 
              back-action="window.show[Module]MainView()">
            </app-form-header>
            <form id="[module]-form" onsubmit="window.handleFormSubmit(event)" class="bg-white rounded-2xl border border-slate-200 p-6 premium-shadow space-y-6">
               <!-- Inputs -->
            </form>
         </div>
      </div>
    </main>
  </div>

  <script type="module" src="/layout.js"></script>
  <script type="module" src="/js/shared.js"></script>
  <script type="module" src="/js/[module].js"></script>
</body>
</html>
```

## Fast File Routing
Before editing, check this ownership map first so shared UI work lands in the correct file:

- Use `references/file-map.md` for a quick "what lives where" lookup.
- Sidebar, header, footer, and shared navigation markup belong in `layout.js`.
- Shared interaction logic, state, auth guards, and reusable UI helpers belong in `js/shared.js`.
- Global visual rules, shared sidebar sizing, and reusable polish belong in `index.css`.
- Module-specific screen content belongs in `[module].html` and `/js/[module].js`.
- If the request changes every page's layout or navigation, do not patch a single module page first. Start from `layout.js`, `js/shared.js`, and `index.css`.

## Form Logic & Validation
1. **Dynamic Titles:** If you support editing, pass a `title-id` attribute to `<app-form-header>` (e.g. `title-id="crm-customer-modal-title"`) so the JS can dynamically swap the text of the header from "Create" to "Edit" without destroying the back button layout.
2. **Email Option:** Email fields should NOT have the `required` attribute.
3. **Advanced Toggles:** Collapsible section for advanced details:
   ```html
   <div>
     <button type="button" onclick="window.toggleAdvancedFields()" class="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-xs font-bold transition-colors">
       <i data-lucide="chevron-down" id="[module]-advanced-icon" class="w-4 h-4 transition-transform"></i>
       Show Advanced Details
     </button>
   </div>
   <div id="[module]-advanced-section" class="hidden space-y-6 pt-4 border-t border-slate-100">
      <!-- Advanced Inputs -->
   </div>
   ```

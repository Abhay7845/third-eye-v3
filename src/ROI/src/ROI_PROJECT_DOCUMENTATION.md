# ROI (Return on Investment) Application — Complete Project Documentation

**Version:** As of August 2026 — updated with approval-security, RBM dashboard redesign, and 404 standardisation
**Backend:** FastAPI (Python) · `f:\ROI\ROI_server\server\`  
**Frontend:** React 18 embedded inside Third Eye (`third-eye-v3`) · `f:\ROI\git_ROI_THIRD_EYE\third-eye-v3\src\ROI\src\`  
**Base URL (local):** `http://127.0.0.1:8000`

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [Role-Based Entry Point](#4-role-based-entry-point)
5. [ABM Flow — Screen-by-Screen](#5-abm-flow--screen-by-screen)
   - [Screen 1 — Basic Store Details](#screen-1--basic-store-details)
   - [Screen 2 — Store Retail Specifications](#screen-2--store-retail-specifications)
   - [Screen 3 — Sales Planning (4 Sub-pages)](#screen-3--sales-planning-4-sub-pages)
   - [Screen 4 — Expense Planning (3 Sub-pages)](#screen-4--expense-planning-3-sub-pages)
   - [Screen 5 — Final Summary & Submit](#screen-5--final-summary--submit)
6. [RBM Dashboard](#6-rbm-dashboard)
7. [Approval Workflow](#7-approval-workflow)
8. [Resume / History Flow](#8-resume--history-flow)
9. [Backend API Reference](#9-backend-api-reference)
10. [Data Models (Pydantic)](#10-data-models-pydantic)
11. [Database Stored Procedures Reference](#11-database-stored-procedures-reference)
12. [TOT Computation Engine](#12-tot-computation-engine)
13. [Frontend Component Tree](#13-frontend-component-tree)
14. [Key Data Flow — New Store](#14-key-data-flow--new-store)
15. [Status Lifecycle](#15-status-lifecycle)

---

## 1. Project Overview

The ROI application allows Tanishq store managers (ABM — Area Business Managers) to submit capital investment proposals for new stores, renovations, relocations, and expansions. The proposal goes through a multi-level approval chain managed by RBMs, Commercial teams, and senior approvers.

### Core Capabilities

| Capability | Description |
|---|---|
| New Investment Request | ABM fills a 5-screen wizard capturing store specs, sales projections, and expense plans |
| Resume | ABM can pause and resume any previously started ROI from the History page |
| TOT Computation | Auto-generates Turn-Over-Time financial model after expense summary is saved |
| Multi-Level Approval | RBM → Commercial → Sunil → Arun → Retail approval chain with Seek Clarification and Reject options |
| RBM Dashboard | Dedicated approver console with per-page data view and action controls |

---

## 2. Technology Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 |
| Build Tool | Vite (embedded in Third Eye CRA shell) |
| Styling | Tailwind CSS |
| Forms | react-hook-form + useWatch |
| State Management | Redux Toolkit (`state.user.user`) |
| Notifications | react-toastify |

### Backend
| Layer | Technology |
|---|---|
| Framework | FastAPI (Python) |
| ORM | SQLAlchemy (text() with named params) |
| Database | MySQL (via stored procedures) |
| Schema Validation | Pydantic v2 |
| Server | Uvicorn |

---

## 3. Architecture Overview

```
Browser
  │
  ▼
Third Eye Shell (third-eye-v3)
  │
  └── ROIMainPage.jsx   ← role check on mount
         │
         ├── [Role = RBM]  ──►  RBMDashboard.jsx
         │
         └── [Role = ABM]
               │
               ├── MultiStepROIForm.jsx  (5-step wizard)
               │     ├── Step 1: BasicStoreRetailForm
               │     ├── Step 2: StoreRetailSpecification
               │     ├── Step 3: Section3 (Sales Planning)
               │     │         ├── Subpage3_1 (Key Expenses)
               │     │         ├── Subpage3_2 (Sales Summary)
               │     │         ├── Subpage3_3 (Stock/Pricing)
               │     │         └── Subpage3_4 (Discounts)
               │     ├── Step 4: Section4 (Expense Planning)
               │     │         ├── Subpage4_1 (CAPEX)
               │     │         ├── Subpage4_2 (Salaries & Ops)
               │     │         └── Subpage4_3 (Rent & Summary)
               │     └── Step 5: Summary (submit)
               │
               └── HistoryPage.jsx  (resume in-progress ROIs)

          ▼ HTTP (REST)

FastAPI Backend (main.py)
  │
  └── MySQL Database (stored procedures)
```

---

## 4. Role-Based Entry Point

**File:** `ROIMainPage.jsx`

On mount, the component fetches the logged-in user's role from the backend using the email stored in Redux (`state.user.user.email`).

```
GET /user_role?email={email}
→ returns { data: [{ user_role: "RBM" | "ABM" }] }
```

| Role | Rendered Component |
|---|---|
| `RBM` | `<RBMDashboard userRole="RBM" />` |
| `Commercial` | `<RBMDashboard userRole="Commercial" />` |
| `ABM` (default) | Existing New Request / History flow |
| Loading | Full-screen spinner |

---

## 5. ABM Flow — Screen-by-Screen

### Screen 1 — Basic Store Details

**File:** `BasicStoreRetailForm.jsx`  
**Saves to:** `POST /basic-store-details` → **generates `ROI_ID`**

#### Accordion Sections

| Section | Fields |
|---|---|
| Project Type | projectType (`New Store`, `Renovation`, `Relocation`, `Store Expansion`) |
| Location | historyId (New Store) or existingStoreCode (others), city, state, region, newCity |
| Store Format | existingStoreFormat, storeFormatChange, newStoreFormat |
| Franchise | newFranchise, franchiseeStoreCode, baiatScore, partnerDbStatus, partnerScore |

#### Key Logic

- **New Store**: selects a `historyId` → auto-populates city/state/region/newCity/storeType/historyRetailArea/`refStoreCode` (from `GET /history/{historyId}`)
- **Other types**: selects from BTQ store list → auto-populates store fields
- After save: backend generates `ROI_ID = username + timestamp` and returns it
- `roiContext` is built and passed to all subsequent screens:

```js
roiContext = {
  roiId,              // master key for all subsequent API calls
  projectType,
  historyId,          // New Store's history record
  refStoreCode,       // reference store for sales benchmarks
  city, state, region,
  existingStoreCode,  // for headcount lookup
  existingStoreFormat || newStoreFormat,
  storeType,
  historyRetailArea,  // pre-fills newRetailArea in Screen 2
}
```

---

### Screen 2 — Store Retail Specifications

**File:** `StoreRetailSpecification.jsx`  
**Saves to:** `POST /store-retail-spec`

#### Fields

| Group | Fields |
|---|---|
| Specifications | storeType, existing/new overall area (SBA), existing/new retail area, noOfFloors, floorPlate (GF/FF/SF/TF sqft) |
| Architecture | frontage, ceilingHeight, facadeLed, terraceBranding, totemPole, displayType, flooringType, retailFloors |
| Fit-out Counts | cashierCount, karatmeterCount, strongRoom, franchiseRoom, managerRoom, conferenceRoom, pvrRoom, additionalWorkstation, regionalServiceCentre |
| Remarks | remarks (optional) |

#### Key Points
- `newRetailArea` is pre-populated from `roiContext.historyRetailArea`
- Floor plate areas are individually entered per floor; their sum must equal `newRetailArea`
- `floorPlate` is serialized as `"GF:1000 | FF:500"` string for DB storage
- **SBA (`newOverallArea`) and `newRetailArea` are the critical fields** — consumed by Section 3 and 4

---

### Screen 3 — Sales Planning (4 Sub-pages)

**Wrapper:** `Section3.jsx` + `Section3Context`

On mount, Section3 fetches:
1. `GET /fetchScreen?parameter=roi_store_retail_specifications&roiid=` → SBA + carpet area (New Store)
2. `GET /refStore/{refStoreCode}` → sales/inventory benchmarks

The fetched data is stored in `Section3Context`:
- `storeParticulars` — reference store metrics (sales, inventory, mix %, stock turns, AMC %)
- `forwardDetail` — `{ roiid, refStoreCode, region, storeFormat }`
- `subpage3_2Data` — carries computed sales data forward to sub-pages 3.3 and 3.4

#### Sub-page 3.1 — Key Expenses

**File:** `Subpage3_1.jsx`  
**Saves to:** `POST /sales_planning_page_1`

Captures 14 monthly operating expense fields (Rent, Staff Salaries, Security, Electricity, etc.) against Store Particulars table from the reference store. Computes annual values per line.

Validation: Labour-law warnings (min wage thresholds) and business warnings (rent floor).

---

#### Sub-page 3.2 — Sales Summary

**File:** `Subpage3_2.jsx`  
**Saves to:** `POST /sales_planning_page_2`

Inputs (yearly arrays):
- Walk-ins/day, % increase, conversion %, avg ticket size, % growth, store days
- Sales mix: Plain / Studded / Coins-Silver shares
- Plain mix: LCG / MCG / HCG (must sum to 100%)
- Studded mix: GIS / Regular / Color Stones / Solitaire A-D (must sum to 100%)

Computed: Total sales per year, sales growth %, buyers/day, average ticket size

Validation metrics fetched from `GET /validation_metrics?region=&store_format=` for reference benchmarks.

---

#### Sub-page 3.3 — Stock Summary / Pricing Metrics

**File:** `Subpage3_3.jsx`  
**Saves to:** `POST /sales_planning_page_3`

Inputs:
- Base Rate (22K gold), Markup %
- AMC % for Plain groups (LCG/MCG/HCG/Coins) — must sum to 100%
- Stock turns (Plain / Studded / Coins-Silver) per year

Computed: Total stock turns, stock values (Plain / Studded / Coins), brand guideline comparisons

---

#### Sub-page 3.4 — Discounts

**File:** `Subpage3_4.jsx`  
**Saves to:** `POST /sales_planning_page_4`

Reads customer discount master (`GET /cutomer_discount`) and computes:
- Total Customer Discount (TCD) per category per year
- Total GHS Discount per year
- % of UCP totals

This page is fully computed from upstream data (3.2 sales data + discount master).

---

### Screen 4 — Expense Planning (3 Sub-pages)

**Wrapper:** `Section4.jsx` + `Section4Context`

On mount, Section4 fetches:
`GET /fetchScreen?parameter=roi_store_retail_specifications&roiid=` → populates `storeData` (carpet area, store type, flooring type) used across all 3 sub-pages.

#### Sub-page 4.1 — CAPEX

**File:** `Subpage4_1.jsx`  
**Saves to:** `POST /expense_planning_page1`

Fetches rates: `GET /roi_expenses?store_type=&floor_type=&retail_area=`

User selects Yes/No or dropdown for optional items:
- Civil Works, Corner Property, Lift, Facade Height, EHV Zone, DxC, Art & Craft Type 1/2/3, LED Screen, Solar, Engraving Machine

Computed: `totalCapex = Interiors + IT Equipment + Additional Capex`, `ratePerSqft = totalCapex / carpetArea`

---

#### Sub-page 4.2 — Salaries & Operating Expenses

**File:** `Subpage4_2.jsx`  
**Saves to:** `POST /expense_planning_page2`

**Salary table** — for each resource role:
- Level (dropdown from `GET /role_level?role=`)
- Reference salary (auto-filled from level selection)
- No. of staff (pre-seeded from `GET /head_count?store={existingStoreCode}`)
- Monthly fixed, Variable %, Annual Fixed, Annual Variable, Annual Total

**Additional inputs:**
- Electricity: Rate per sqft (× carpet area)
- Other Expenses: Registration Charges, Temporary Relocation Cost
- Security & Housekeeping: nos + monthly per role

---

#### Sub-page 4.3 — Rent & Expense Summary

**File:** `Subpage4_3.jsx`  
**Saves to:** `POST /expense_planning_page3` → **auto-triggers TOT computation**

**Rent model** (6-year inputs):
- SBA (sqft), Rate per sqft per year
- OR Revenue Sharing: Rev Share %, Min Guarantee Monthly, NSV

**6-year Expense Summary table** (auto-computed with escalation):

| Line Item | Basis | Escalation |
|---|---|---|
| Rent | User inputs | — |
| Salaries | From Subpage4_2 | 5% |
| Security & Housekeeping | From Subpage4_2 | 5% |
| Electricity | From Subpage4_2 | 5% |
| Repairs & Maintenance | Screen3 Yr1 base | 5% |
| Insurance | 1% interiors | 5% |
| BTL | 0.3% sale | 10% |
| Travel & Conveyance | Screen3 base | 7% |
| Telephone/Internet | Screen3 base | 7% |
| Credit Card Commission | Screen3 base | 5% |
| GST (rental) | Screen3 base | 3% |
| Store Printing/Pantry | Screen3 base | 10% |
| Consumables | Screen3 base | 10% |
| Staff Welfare/Uniforms | 3.5k/person | 10% |

After save, `_compute_and_save_tot()` is automatically called.

---

### Screen 5 — Final Summary & Submit

**File:** `Summary.jsx`  
**Reads from:** `GET /summary_screen_5/{roiid}`  
**Saves to:** `POST /summary_screen_5/save`  
**Submits to:** `POST /roi/submit/{roiid}` → status = `Submitted_toRBM`

Displays the final financial KPI table compiled from all previous screens. ABM reviews and clicks Submit to push the ROI into the approval workflow.

---

## 6. RBM Dashboard

**File:** `RBMDashboard.jsx`  
**Prop:** `userRole` (passed from `ROIMainPage`)

### Layout

```
┌──────────────────────┬──────────────────────────────────────────────┐
│   Left Sidebar       │   Main Panel                                 │
│                      │                                              │
│  Header: RBM name    │  ROI Hero Card                               │
│  Search + Filters    │  ├── ROI ID, Project, City, ABM, Date        │
│  Counts: Total /     │  ├── Status badge                            │
│    Pending / Approved│  ├── Completion progress bar (X/10 pages)    │
│                      │  └── Action buttons (if actionable)          │
│  ROI cards (list)    │                                              │
│  ├── ROI ID          │  Pages Accordion (10 pages)                  │
│  ├── Project + City  │  ├── Expand → View Page Data button          │
│  ├── Date            │  └── Status badge per page                   │
│  └── Status badge    │                                              │
└──────────────────────┴──────────────────────────────────────────────┘
```

### Actions (only shown when `isActionable = true`)

| Button | Color | Action |
|---|---|---|
| ✓ Approve | Emerald | Calls `POST /roi/action/{roiid}` with `action:"approve"` |
| 💬 Seek Clarification | Violet | Opens remark modal → calls `/roi/action` with `action:"clarify"` |
| ✗ Reject | Red | Opens remark modal → calls `/roi/action` with `action:"reject"` |

**Seek Clarification and Reject require a mandatory remark** (textarea, max 500 chars). The remark is saved via `POST /roi_page_comment` with `page_name: "CLARIFICATION_REMARK"` or `"REJECTION_REASON"` before the status is updated.

### `isActionable` Logic

```
isActionable = status === "Submitted_toRBM" OR status === "Submitted to RBM"

// All other statuses lock the buttons:
// Approved_by*      → already actioned — no re-approval
// Rejected_by*      → terminal
// SK_by*            → RBM sent clarification, waiting for ABM — buttons hidden
// BPM_Requestraised → final state
```

Once an RBM seeks clarification (`SK_byRBM`), the action buttons disappear. They reappear only when the ABM revises and resubmits (status goes back to `Submitted_toRBM`).

### Page Data Modal (Redesigned August 2026)

Clicking "View Page Data" now fetches **all rows** from the API and displays them in full:

| Data Type | Detected By | Rendered As |
|---|---|---|
| Scalar fields | Any non-array, non-object | 4-column card grid |
| 6-year projections | Comma-separated numeric string (3+ values) | Full-width Yr 1–Yr 6 table |
| Nested JSON objects | `typeof === "object"` | Named amber card section |
| Multiple rows (e.g. RESOURCE — one row per role) | `data.length > 1` | Scrollable table, amber header |

Modal is now `max-w-6xl` with a gradient header coloured by page group.

---

## 7. Approval Workflow

### Approval Matrix

The approval chain is driven by `CALL get_roi_approval_details(channel, store_format, project_type, region)`:

| Channel | Level | Project Type | Approval 1 | Approval 2 (Commercial) | Approval 3 | Approval 4 | BPM |
|---|---|---|---|---|---|---|---|
| Tanishq | L1–L4, L2.5 | **New Store** | RBM of Region | rinkalv, harshsagar, rheabhattacharyya @titan.co.in | sunilr@titan.co.in | arun@titan.co.in | vineetashok@titan.co.in |
| Tanishq | L1–L4, L2.5 | **Renovation** | RBM of Region | rinkalv, harshsagar, rheabhattacharyya @titan.co.in | sunilr@titan.co.in | *(none — skipped)* | vineetashok@titan.co.in |
| Tanishq | L1–L4, L2.5 | **Relocation** | RBM of Region | rinkalv, harshsagar, rheabhattacharyya @titan.co.in | sunilr@titan.co.in | *(none — skipped)* | vineetashok@titan.co.in |
| Tanishq | L1–L4, L2.5 | **Expansion** | RBM of Region | rinkalv, harshsagar, rheabhattacharyya @titan.co.in | sunilr@titan.co.in | *(none — skipped)* | vineetashok@titan.co.in |

> **New Store** requires 4 levels (RBM → Commercial → Sunil → Arun → BPM). All other types need 3 (RBM → Commercial → Sunil → BPM). The `Approval4` column is empty for non-New-Store rows, and the backend skips that level automatically.

---

### Status Strings

| Action | Actor | Resulting Status |
|---|---|---|
| ABM submits | ABM | `Submitted_toRBM` |
| Approve | RBM | `Approved_byRBM` |
| Reject | RBM | `Rejected_byRBM` |
| Seek Clarification | RBM | `SK_byRBM` |
| Approve | Commercial | `Approved_byCommercial` |
| Reject | Commercial | `Rejected_byCommercial` |
| Seek Clarification | Commercial | `SK_byCommercial` |
| Approve | Sunil | `Approved_bySunil` |
| Reject | Sunil | `Rejected_bySunil` |
| Seek Clarification | Sunil | `SK_bySunil` |
| Approve | Arun | `Approved_byArun` |
| Reject | Arun | `Rejected_byArun` |
| Seek Clarification | Arun | `SK_byArun` |
| Auto-accept | Retail | `BPM_Requestraised` |

---

### End-to-End Action Flow (`POST /roi/action/{roiid}`)

The `_run_approval_action()` function executes **5 steps in strict order**:

```
Step 1 — Auto-resolve missing context
  If store_format / region / project_type are empty strings,
  pull them from Screen-1 saved data:
    CALL fetch_store_details(roiid, 'roi_basic_store_details')
  → fills store_format (existing_store_format || new_store_format),
    region, project_type

Step 2 — Fetch approval chain (BEFORE writing anything)
  CALL get_roi_approval_details(channel, store_format, project_type, region)
  Returns one row:
    { Approval1: "RBM of the Region",
      Approval2: "rinkalv@..., harshsagar@..., rheabhattacharyya@...",
      Approval3: "sunilr@titan.co.in",
      Approval4: "arun@titan.co.in"  ← empty for Renovation/Relocation/Expansion
      BPM_Request_By: "vineetashok@titan.co.in" }

Step 3 — Validate actor is authorised
  a. Fetch current ROI status:
       CALL get_roi_current_status(roiid)
  b. Map status → expected column:
       Submitted_toRBM       → Approval1
       Approved_byRBM        → Approval2
       Approved_byCommercial → Approval3
       Approved_bySunil      → Approval4
       Approved_byArun       → BPM_Request_By
  c. Read expected approver from that column in the chain row
  d. Validate:
       "RBM of the Region" → check actor_role == "RBM"    (role-based)
       email list          → check actor_email in list     (email-based)
       empty column        → allow (level not in this chain)
  e. NOT authorised → raise AuthorizationError → HTTP 403
     (zero DB writes — history table stays clean)

Step 4 — Apply the action
  CALL roi_status_update(roiid, new_status)
  CALL InsertApprovalHistory(
    channel, roiid, new_status, actor_email,
    remark, 'Active',
    go_back  ← 'Yes' for reject/clarify, 'No' for approve
  )

Step 5 — Return
  { new_status, next_approver: [chain_row] }
  Frontend shows toast with next approver name if available.
```

---

### Status → Authorised Actor Mapping

| Current Status | Column Checked | Authorised Actor |
|---|---|---|
| `Submitted_toRBM` | `Approval1` | Any user with `actor_role == "RBM"` |
| `Approved_byRBM` | `Approval2` | rinkalv@, harshsagar@, rheabhattacharyya@ |
| `Approved_byCommercial` | `Approval3` | sunilr@titan.co.in |
| `Approved_bySunil` | `Approval4` | arun@titan.co.in (New Store) or skipped |
| `Approved_byArun` | `BPM_Request_By` | vineetashok@titan.co.in |

---

### HTTP Response Codes for Approval Actions

| Code | Meaning |
|---|---|
| 200 | Action completed, returns `new_status` + `next_approver` |
| 403 | Actor is not authorised for this stage (wrong role/email) |
| 500 | DB error |

---

### Required Stored Procedure (to create)

```sql
CREATE PROCEDURE get_roi_current_status(IN p_roiid VARCHAR(100))
BEGIN
    SELECT status FROM <roi_master_table> WHERE roiid = p_roiid LIMIT 1;
END;
```

Until this proc exists, the auth check is **gracefully skipped** (warning logged, action proceeds). This prevents breakage during staged rollout.

---

### Payload Required by `/roi/action`

```json
{
  "action": "approve | reject | clarify | retail_accept",
  "actor_email": "rbm@titan.co.in",
  "actor_role": "RBM",
  "remark": "Please revise the rent assumptions",
  "channel": "Tanishq",
  "store_format": "L2",
  "project_type": "New Store",
  "region": "NORTH 1"
}
```

> `store_format`, `project_type`, and `region` are auto-resolved from Screen-1 DB data if sent as empty strings — the frontend does not need to carry them explicitly.

---

## 8. Resume / History Flow

**File:** `HistoryPage.jsx`

### How Resume Works

```
1. Fetch all user's ROIs:   GET /roi_id?username=
2. User selects an ROI:     GET /summary/{roiid}  → page statuses
3. User clicks Continue:
   a. GET /fetchScreen?parameter=roi_basic_store_details&roiid=    (d1)
   b. GET /fetchScreen?parameter=roi_store_retail_specifications&roiid=  (d2)
   c. Build roiContext from d1 + d2
   d. Compute firstIncompleteStep from page statuses
   e. Call onContinueROI(roiContext, step, subStep)
4. MultiStepROIForm opens at exactly the first incomplete page
```

### Fields Carried in roiContext (Resume)

| Field | Source |
|---|---|
| `roiId` | selectedRoi.roiid |
| `projectType` | d1.project_type |
| `historyId` | d1.ty_history_id |
| `city / state / region` | d1.city / state / region |
| `existingStoreCode` | d1.exsisting_store_code |
| `existingStoreFormat` | `d1.existing_store_format \|\| d1.new_store_format` |
| `storeType` | d2.store_type |
| `existingRetailArea` | d2.existing_retail_area |
| `historyRetailArea` | d2.new_retail_area |
| `refStoreCode` | d1.ref_store_code (New Store) or existingStoreCode |

### Per-Section Resume Behavior

| Screen/Section | Resume Implemented? |
|---|---|
| Screen 1 | ❌ No direct reload (directed there only if incomplete) |
| Screen 2 | ✅ Full restore from `fetchScreen` + `isSaved = true` + "Next" button |
| Section 3 wrapper | ✅ Parallel fetch of all 4 screens → restores `savedSteps` + `subpage3_2Data` |
| Subpage 3.1 | ✅ Restores expense values |
| Subpage 3.2 | ✅ Restores all inputs |
| Subpage 3.3 | ✅ Restores pricing inputs |
| Subpage 3.4 | ⚠️ Sets `isSaved` but inputs are computed anyway |
| Section 4 wrapper | ✅ Fetches CAPEX/RESOURCE/OTHER → restores `savedSteps` + context data |
| Subpage 4.1 | ✅ Restores CAPEX selections |
| Subpage 4.2 | ✅ Restores salary rows + electricity + other expenses (merged effect) |
| Subpage 4.3 | ✅ Restores rent inputs |
| Screen 5 | ✅ Full restore from `GET /summary_screen_5` |

---

## 9. Backend API Reference

### Read / Lookup Endpoints

| Method | URL | Purpose |
|---|---|---|
| GET | `/` | Health check |
| GET | `/test-db` | Database connectivity check |
| GET | `/history_id?username=` | History ID dropdown for New Store |
| GET | `/history/{history_id}` | History ID detail (city, region, refStore) |
| GET | `/btq_details` | BTQ store list for non-New-Store types |
| GET | `/refStore/{storeCode}` | Reference store sales/inventory benchmarks |
| GET | `/area_detail/{roiId}` | SBA + retail area for non-New-Store |
| GET | `/store/{store_code}` | Franchisee store details |
| GET | `/attribute/{parameter}` | Attribute masters (store_format, project_type, store_type, etc.) |
| GET | `/fetchScreen?parameter=&roiid=` | Generic saved screen data reader |
| GET | `/roi_id?username=` | All ROI IDs for an ABM |
| GET | `/validation_metrics?region=&store_format=` | Regional benchmark metrics |
| GET | `/summary/{roiid}` | All 10 page statuses for an ROI |
| GET | `/cutomer_discount` | Customer discount master list |
| GET | `/roi_expenses?store_type=&floor_type=&retail_area=` | CAPEX rate lookup |
| GET | `/role_level?role=` | Salary levels for a role |
| GET | `/head_count?store=` | Role headcounts for a store |
| GET | `/expense_details/{roiid}?expense_type=` | Saved expense data (CAPEX/RESOURCE/OTHER/SUMMARY) |
| GET | `/tot_details/{roiid}?tot_type=` | TOT section data |
| GET | `/summary_screen_5/{roiid}` | Final summary screen data |
| GET | `/user_role?email=` | User role lookup |
| GET | `/rbm_roi_id?username=` | ROI list for RBM approver |
| GET | `/roi/approval_details?channel=&store_format=&project_type=&region=` | Approval chain |

### Save Endpoints

| Method | URL | Purpose |
|---|---|---|
| POST | `/basic-store-details` | Save Screen 1 → returns `roiId` |
| POST | `/store-retail-spec` | Save Screen 2 |
| POST | `/sales_planning_page_1` | Save Screen 3.1 (key expenses) |
| POST | `/sales_planning_page_2` | Save Screen 3.2 (sales summary) |
| POST | `/sales_planning_page_3` | Save Screen 3.3 (stock/pricing) |
| POST | `/sales_planning_page_4` | Save Screen 3.4 (discounts) |
| POST | `/expense_planning_page1` | Save Screen 4.1 (CAPEX) |
| POST | `/expense_planning_page2` | Save Screen 4.2 (salaries/ops) |
| POST | `/expense_planning_page3` | Save Screen 4.3 (rent/summary) + auto-TOT |
| POST | `/summary_screen_5/save` | Save final summary payload |
| POST | `/roi_page_comment` | Save RBM page-level comment |

### Approval Endpoints

| Method | URL | Body | Purpose |
|---|---|---|---|
| POST | `/roi/submit/{roiid}` | — | ABM submits → `Submitted_toRBM` |
| POST | `/roi/action/{roiid}` | `ApprovalActionPayload` | **Unified approver action — validates actor before any DB write** |
| POST | `/roi/approve/{roiid}` | `ApprovalActionPayload` | Explicit approve wrapper (same auth validation) |
| POST | `/roi/reject/{roiid}` | `ApprovalActionPayload` | Explicit reject wrapper (same auth validation) |
| POST | `/roi/request_changes/{roiid}` | `ApprovalActionPayload` | Explicit clarify wrapper (same auth validation) |
| GET | `/roi/approval_details` | — | Returns full approval chain for channel/format/type/region |

> All POST approval endpoints return **HTTP 403** if the actor is not authorised for the current stage.

### Read Screen-3 Data

| Method | URL | Body | Purpose |
|---|---|---|---|
| POST | `/sales_planning` | `{ screen: 1-4, roiid }` | Fetch saved sales planning page |

### Stock Turn & TOT

| Method | URL | Purpose |
|---|---|---|
| POST | `/stock_turn_guideline` | Stock turn lookup by cluster/sales/region |
| GET | `/tot_calculation/{roiid}?store_format=` | Manually recompute full TOT |

---

## 10. Data Models (Pydantic)

### `BasicStorePayload` (Screen 1)
```python
username, projectType, historyId, existingStoreCode,
city, state, region, newCity, existingStoreFormat,
storeFormatChange, newStoreFormat, newFranchise,
newFranchiseeStoreName, newFranchiseeStoreCode,
franchiseeStoreCode, franchiseeStoreName,
baiatScore, partnerDbStatus, partnerScore,
retailArea, storeType
```

### `StoreRetailSpecPayload` (Screen 2)
```python
roiId, username, tyHistoryId, storeType,
existingOverallArea, existingRetailArea,
newOverallArea, newRetailArea,
noOfFloors, floorPlate (dict),
frontage, ceilingHeight, facadeLed, terraceBranding, totemPole,
displayType, flooringType, retailFloors (list),
cashierCount, karatmeterCount, strongRoom, franchiseRoom,
managerRoom, conferenceRoom, pvrRoom, additionalWorkstation,
regionalServiceCentre, remarks
```

### `SalesPlanningPage2Model` (Screen 3.2)
```python
roiid, inputs (SalesPlanningInputs), computed (SalesPlanningComputed)

SalesPlanningInputs:
  totalAreaSBA, totalAreaCarpet,
  walkInPerDayYr1, avgTicketSizeYr1,
  increaseWalkIns[5], conversionPct[6], growthTicketSize[5],
  storeDays,
  salesMix: { plainShare[6], studdedShare[6], coinsShare[6] }
  plainMix: { lcg[6], mcg[6], hcg[6], stoneShareHCG[6] }
  studdedMix: { gis[6], regular[6], colorStones[6], solitaireA-D[6] }

SalesPlanningComputed:
  walkInPerDay[6], buyersPerDay[6], avgTicketSize[6],
  totalSales[6], salesGrowthPct[6]
```

### `ExpenseSummaryRequest` (Screen 4.3)
```python
roiid, store_format,
rent: {
  revenueSharing, sba[6], ratePerSqft[6],
  revSharePct[6], minGuaranteeMth[6], nsv[6],
  annualRent[6], monthlyRent[6], securityDeposit
},
expenseSummary: {
  rows: [{ label, basis, escalation, values[6] }],
  total[6]
}
```

### `ApprovalActionPayload`
```python
action: str           # 'approve' | 'reject' | 'clarify' | 'retail_accept'
actor_email: str
actor_role: str       # 'RBM' | 'Commercial' | 'Sunil' | 'Arun' | 'Retail'
remark: str = ""
channel: str = "Tanishq"
store_format: str = ""
project_type: str = ""
region: str = ""
```

### `ROIPageCommentPayload`
```python
roiid: str
page_name: str        # e.g. "CLARIFICATION_REMARK", "REJECTION_REASON"
comment: str
commented_by: str
```

---

## 11. Database Stored Procedures Reference

### Screen Save Procedures

| Procedure | Called By |
|---|---|
| `get_roi_basic_store_details(...)` | `POST /basic-store-details` |
| `get_roi_store_retail_specifications(...)` | `POST /store-retail-spec` |
| `get_sales_planning_ref_strcode_details(...)` | `POST /sales_planning_page_1` |
| `get_roi_sales_planning_sales_summary(...)` | `POST /sales_planning_page_2` |
| `get_roi_sales_planning_stock_summary(...)` | `POST /sales_planning_page_3` |
| `get_roi_sales_planning_discount(...)` | `POST /sales_planning_page_4` |
| `get_roi_capex_expense_details(...)` | `POST /expense_planning_page1` |
| `get_roi_resource_expense_details(...)` | `POST /expense_planning_page2` (per role) |
| `get_roi_other_expense_details(...)` | `POST /expense_planning_page2` |
| `get_roi_expense_summary(...)` | `POST /expense_planning_page3` |
| `save_roi_final_summary_screen(roiid, json, status)` | `POST /summary_screen_5/save` |

### Screen Read Procedures

| Procedure | Called By |
|---|---|
| `fetch_store_details(roiid, parameter)` | `GET /fetchScreen` |
| `view_sales_planning_ref_strcode_details(roiid)` | `POST /sales_planning` screen=1 |
| `view_sales_planning_sales_summary(roiid)` | `POST /sales_planning` screen=2 |
| `view_sales_planning_stock_summary(roiid)` | `POST /sales_planning` screen=3 |
| `view_sales_planning_discount(roiid)` | `POST /sales_planning` screen=4 |
| `view_roi_expense_details(roiid, expense_type)` | `GET /expense_details` |
| `get_roi_final_summary_screen(roiid)` | `GET /summary_screen_5` |
| `get_roi_summary_page(roiid)` | `GET /summary` |

### Approval Procedures

| Procedure | Signature | Called By |
|---|---|---|
| `roi_status_update` | `(roiid, status)` | All approval action endpoints |
| `InsertApprovalHistory` | `(channel, roiid, approval_status, approved_by, remarks, status, go_back)` | All approval action endpoints |
| `get_roi_approval_details` | `(channel, store_format, project_type, region)` | Fetched **before** DB writes for validation + next-approver info |
| `get_roi_current_status` | `(roiid)` | Fetches live status for actor validation. **Must be created in DB.** |

### Master / Lookup Procedures

| Procedure | Purpose |
|---|---|
| `history_id_dropdown(username)` | History IDs for dropdown |
| `get_history_id_details(history_id)` | History location/store details |
| `get_btq_details(username)` | BTQ store list |
| `get_roi_sales_planning(storeCode)` | Reference store benchmarks |
| `fetch_roi_area_details(roiId)` | SBA/retail area for non-New-Store |
| `get_existing_franchisee_details(store_code)` | Franchisee info |
| `get_roi_attribute_parameter(parameter)` | Attribute masters |
| `fetch_list_of_roiid(username)` | ABM ROI list |
| `get_roi_metrics_reference(store_format, region)` | Validation benchmarks |
| `get_customer_discount_list()` | Discount master |
| `get_roi_expenses(store_type, floor_type, retail_area)` | CAPEX rate master |
| `get_roi_role_level(role)` | Salary levels |
| `get_roi_role_headcount(store)` | Role headcounts |
| `get_roi_user_role(email)` | User role |
| `fetch_abm_roiid_list_by_rbm(username)` | ROI list for RBM |
| `save_roi_page_comment(roiid, page_name, comment, commented_by)` | Save RBM comment |
| `get_roi_page_comments(roiid)` | Fetch RBM comments |

### TOT Procedures

| Procedure | TOT Section |
|---|---|
| `view_roi_tot_details(roiid, tot_type)` | Read any TOT section |
| (multiple save procedures inside TOTFunctions.py) | Plain/Studded/Coins yearly data |

---

## 12. TOT Computation Engine

**File:** `TOTFunctions.py`  
**Auto-triggered:** after `POST /expense_planning_page3` succeeds

The `_compute_and_save_tot(roiid, store_format, db)` function:

1. Reads saved expense summary, sales data, and store details for the ROI
2. Computes Plain TOT sections:
   - UCP Sales, AMC GM, Grammage, AMC Lakhs, Net AMC, Year-wise data, Pre-summary, Final
3. Computes Coins TOT
4. Computes Studded TOT:
   - Year-wise data, Slab-wise data, Final
5. Saves each section via dedicated stored procedures
6. Returns metadata: `{ "saved_procedures": [...], "errors": [...] }`

The TOT data is viewable via `GET /tot_details/{roiid}?tot_type=` using one of these types:

```
Plain_TOT_Ucp_Sales | Plain_TOT_amcgm | Plain_TOT_Gramcmu | Pain_TOT_Grammage
Plain_TOT_amclakhs  | Plain_TOT_yearwise_data | Plain_netamc | Coins_TOT
Plain_TOT_Presummary | Plain_TOT_Final | Studded_TOT_Yearwise_data
Studded_TOT_slabwise_data | Studded_TOT_Final
```

---

## 13. Frontend Component Tree

```
ROIMainPage
├── [Loading] — spinner while role is being fetched
├── [Role = RBM/Commercial/etc.] → RBMDashboard
│     ├── StatusBadge
│     ├── PageRow (×10)
│     ├── PageDataModal
│     └── ActionModal (Approve / Seek Clarification / Reject)
│
└── [Role = ABM]
      ├── Landing panel (New Request / History buttons)
      ├── HistoryPage
      │     └── (view modal per page)
      └── MultiStepROIForm
            ├── Stepper
            ├── Step 1: BasicStoreRetailForm
            │     └── Section (accordion ×4)
            ├── Step 2: StoreRetailSpecification
            │     └── Section (accordion ×2)
            ├── Step 3: Section3 (Section3Context.Provider)
            │     ├── Subpage3_1
            │     ├── Subpage3_2
            │     ├── Subpage3_3
            │     └── Subpage3_4
            ├── Step 4: Section4 (Section4Context.Provider)
            │     ├── Subpage4_1
            │     ├── Subpage4_2 (SalaryRow ×n)
            │     └── Subpage4_3
            └── Step 5: SummaryPage5
```

---

## 14. Key Data Flow — New Store

```
Screen 1
  historyId → GET /history/{id}
           → city, state, region, storeType, historyRetailArea, refStoreCode
  POST /basic-store-details → roiId (master key for everything)

Screen 2
  roiContext.historyRetailArea → pre-fills newRetailArea
  User enters SBA + floor plates
  POST /store-retail-spec → saves new_over_all_area_SBA, new_retail_area

Section 3 mount
  GET /fetchScreen?roi_store_retail_specifications
       → SBA, new_retail_area  (storeParticulars["Super Built Up Area"], ["Carpet area"])
  GET /refStore/{refStoreCode}
       → sales, inventory, mix%, stock turns, AMC%  (storeParticulars)
  forwardDetail = { roiid, refStoreCode, region, storeFormat }

Subpage 3.2 saves → subpage3_2Data propagated to 3.3 and 3.4 via context

Section 4 mount
  GET /fetchScreen?roi_store_retail_specifications
       → storeData (carpet area, store_type, flooring_type)

Subpage 4.2
  GET /fetchScreen?roi_basic_store_details → existingStoreCode
  GET /head_count?store={existingStoreCode} → nos per role

Subpage 4.3
  Reads subpage4_2Data (salary/electricity totals) from Section4Context
  Reads subpage4_1Data (totalCapex, interiors) from Section4Context
  Saves → auto-triggers TOT computation

Screen 5
  GET /summary_screen_5/{roiid}
  POST /roi/submit/{roiid} → status = Submitted_toRBM
```

---

## 15. Status Lifecycle

```
(blank)
  |
  v ABM fills screens 1-5
  |
Pending (per page)
  |
  v ABM clicks Submit
  |
Submitted_toRBM  <--------------------------------------------+
  |  [Auth: actor_role == "RBM"]                              |
  |                                                           |
  +--[Approve]--> Approved_byRBM                             |
  |               [Auth: actor_email in Commercial list]      |
  |                 |                                         |
  |               Approved_byCommercial                       |
  |               [Auth: actor_email == sunilr@]              |
  |                 |                                         |
  |               Approved_bySunil                            |
  |                 |                                         |
  |                 +--[New Store: Auth: arun@]               |
  |                 |      Approved_byArun                    |
  |                 |            |                            |
  |                 +--[Others]--+                            |
  |                              |                            |
  |                    BPM_Requestraised  <- FINAL            |
  |                                                           |
  +--[Reject]--> Rejected_by{Actor}   <- TERMINAL             |
  |              (HTTP 403 if wrong actor)                    |
  |                                                           |
  +--[Clarify]--> SK_by{Actor}                                |
                  (buttons locked on RBM dashboard            |
                   until ABM revises + resubmits) -----------+
```

### Security Gate (added August 2026)

Every approval action passes through this gate **before any DB write**:

```
1. Fetch approval chain:  CALL get_roi_approval_details(...)
2. Fetch current status:  CALL get_roi_current_status(roiid)
3. Map status -> expected Approval column (_STATUS_TO_APPROVAL_COL)
4. Validate actor:
     Approval1 = "RBM of the Region" -> check actor_role == "RBM"
     Approval2/3/4 = email list      -> check actor_email in list
     Column empty                    -> allow (level absent for this project type)
5a. Pass  -> write roi_status_update + InsertApprovalHistory
5b. Fail  -> HTTP 403 (history table stays clean)
```

---

## 16. Recent Changes (August 2026)

### Backend

| Change | Detail |
|---|---|
| Actor authorisation | `_validate_actor()` checks `actor_role`/`actor_email` against the approval chain before any write |
| `AuthorizationError` -> HTTP 403 | Distinct from 500 — tells the frontend the actor is wrong, not that the server crashed |
| `_STATUS_TO_APPROVAL_COL` | Maps each ROI status to the `ApprovalN` column that must authorise next action |
| `_fetch_roi_current_status()` | Calls `get_roi_current_status(roiid)` — returns `""` gracefully if proc not yet created |
| `_run_approval_action()` order | Context resolve -> chain fetch -> validate -> **then** write (was write-first before) |
| `project_type` auto-resolve | Now also resolved from Screen-1 data (was only `store_format` + `region` before) |
| 404 responses standardised | All 19 occurrences now return `{"success": false, "message": "..."}` with descriptive messages |
| `store_format` 404 fix | `get_roi_approval_details` no longer called with empty `store_format` — resolved from DB first |

### Frontend — RBM Dashboard

| Change | Detail |
|---|---|
| `isActionable` tightened | Only `Submitted_toRBM` shows buttons. `SK_by*` locks the panel — RBM must wait for ABM resubmit. |
| `PageDataModal` redesigned | Shows all rows; 6-year CSV arrays rendered as Yr1-Yr6 tables; multi-row data as scrollable table; widened to `max-w-6xl`. |
| Per-page comments removed | Single overall remark in action modal. Saved as `CLARIFICATION_REMARK` or `REJECTION_REASON` page comment. |
| `userRole` prop added | Flows `ROIMainPage` -> `RBMDashboard` -> action payload as `actor_role`. |
| Double-header / scrollbar fixed | `RBMDashboard` removed its own `ThirdEyeHeader`; root div changed to `flex-1 overflow-hidden`. |
| "Request Changes" renamed | Now **"Seek Clarification"** throughout UI and API. |

### Approval Matrix (from DB)

| Channel | Level | Project Type | Approval1 | Approval2 | Approval3 | Approval4 | BPM |
|---|---|---|---|---|---|---|---|
| Tanishq | L1-L4, L2.5 | **New Store** | RBM of Region | 3 Commercial emails | sunilr@ | arun@ | vineetashok@ |
| Tanishq | L1-L4, L2.5 | **Renovation** | RBM of Region | 3 Commercial emails | sunilr@ | *(none)* | vineetashok@ |
| Tanishq | L1-L4, L2.5 | **Relocation** | RBM of Region | 3 Commercial emails | sunilr@ | *(none)* | vineetashok@ |
| Tanishq | L1-L4, L2.5 | **Expansion** | RBM of Region | 3 Commercial emails | sunilr@ | *(none)* | vineetashok@ |

**New Store** is the only project type requiring 4 approval levels. All others skip `Approval4`.

### Stored Procedure to Create

```sql
CREATE PROCEDURE get_roi_current_status(IN p_roiid VARCHAR(100))
BEGIN
    SELECT status FROM <roi_master_table> WHERE roiid = p_roiid LIMIT 1;
END;
```

Until this proc exists the auth check is skipped with a warning log — safe for staged rollout.

---

## Environment Setup

### Backend
```
cd f:\ROI\ROI_server\server
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend
```
cd f:\ROI\git_ROI_THIRD_EYE\third-eye-v3
npm install
npm run dev
```

### .env (backend)
```
DB_HOST=...
DB_PORT=3306
DB_NAME=...
DB_USER=...
DB_PASSWORD=...
```

---

*Documentation last updated: August 2026*

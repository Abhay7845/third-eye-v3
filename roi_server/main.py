import re
import json
import logging
from datetime import datetime
from fastapi import FastAPI,Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional,Dict
from sqlalchemy.orm import Session
from sqlalchemy import text
from db_connection import get_db
from pydantic_model import StockTurnGuidelineModel,BasicStorePayload,StoreRetailSpecPayload,Expense,SalesPlanningPage1Model,SalesPlanningPage2Model,SalesPlanningPage3Model,SalesPlanningDiscountModel,ViewSalesPlanningModel,CapexRequest,ResourceExpenseRequest,ExpenseSummaryRequest
from TOTFunctions import _compute_and_save_tot

app = FastAPI()

app = FastAPI(
    title="ROI",
    root_path="/roi/api",  # This will prefix all paths when behind a reverse proxy
)

# origins = [
#     "http://localhost:3000",  # React
#     "http://localhost:5173",  # Vite
#     "http://127.0.0.1:3000",
#     "http://127.0.0.1:5173",
# ]


# CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://localhost:5173",
        "https://tanishqdigitalmerch.titan.in",
        "https://uat-tanishqdigitalmerch.titan.in",
        "https://tanishqmerchtools.titan.in",
        "https://digital.titan.in",
    ],
    allow_origin_regex=r"http://localhost:3\d{3}",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

_logger = logging.getLogger(__name__)


# ─── API routes ────────────────────────────────────────────────────────────────

@app.get('/')
def root():
    return {'message':'ROI BACKEND'}
@app.get('/test-db')
def test_db(db:Session=Depends(get_db)):
    result = db.execute(text('SELECT 1')).fetchone()
    return {'status':'connected','result':result[0]}

@app.get('/history_id')
def get_history_id(username:str,db:Session=Depends(get_db)):
    try:
        result = db.execute(
            text("Call history_id_dropdown(:username);"),{'username':username}
        )

        rows = result.mappings().all()

        if not rows:
            return JSONResponse(
                status_code=404,
                content="Store not found"
            )

        return {
            "success": True,
            "data": rows
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.get('/history/{history_id}')
def get_history_id_detail(
    history_id:str,
    db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("call get_history_id_details(:history_id);"),
            {"history_id": history_id}
        )

        rows = result.mappings().all()

        if not rows:
            return JSONResponse(
                status_code=404,
                content="Store not found"
            )

        return {
            "success": True,
            "data": rows
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


@app.get('/btq_details')
def get_btq_detail(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("call get_btq_details('jayant09@titan.co.in');"))

        rows = result.mappings().all()

        if not rows:
            return JSONResponse(
                status_code=404,
                content="Store not found"
            )

        return {
            "success": True,
            "data": rows
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


@app.get('/refStore/{storeCode}')
def get_ref_store_detail(
    storeCode:str,
    db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("call get_roi_sales_planning(:storeCode);"),
            {"storeCode": storeCode}
        )

        rows = result.mappings().all()

        if not rows:
            return JSONResponse(
                status_code=404,
                content="Store not found"
            )

        return {
            "success": True,
            "data": rows
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.get('/area_detail/{roiId}')
def get_sba_retail_area_detail(
    roiId:str,
    db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("call fetch_roi_area_details(:roiId);"),
            {"roiId": roiId}
        )

        rows = result.mappings().all()

        if not rows:
            return JSONResponse(
                status_code=404,
                content="Store not found"
            )

        return {
            "success": True,
            "data": rows
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.get("/store/{store_code}")
def get_store_details(
    store_code: str,
    db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("CALL get_existing_franchisee_details(:store_code)"),
            {"store_code": store_code}
        )

        rows = result.mappings().all()

        if not rows:
            return JSONResponse(
                status_code=404,
                content="Store not found"
            )

        return {
            "success": True,
            "data": rows
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


@app.get("/attribute/{parameter}")
def get_parameter_details(
    parameter: str,
    db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("CALL get_roi_attribute_parameter(:parameter)"),
            {"parameter": parameter}
        )

        rows = result.mappings().all()

        if not rows:
            return JSONResponse(
                status_code=404,
                content="Store not found"
            )

        return {
            "success": True,
            "data": rows
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.get('/fetchScreen')
def fetch_store_detail_screenwise(parameter: str, roiid: str, db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("CALL fetch_store_details(:roiid,:parameter);"),
            {"parameter": parameter,"roiid": roiid}
        )

        rows = result.mappings().all()
        print(rows)

        if not rows:
            return JSONResponse(
                status_code=404,
                content="Store not found"
            )

        return {
            "success": True,
            "data": rows
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.get('/roi_id')
def fetch_all_roi_id(username:str,db:Session=Depends(get_db)):
    try:
        result = db.execute(
            text("call fetch_list_of_roiid(:username);"),{'username':username})

        rows = result.mappings().all()

        if not rows:
            return JSONResponse(
                status_code=404,
                content="Store not found"
            )

        return {
            "success": True,
            "data": rows
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.get('/validation_metrics')
def fetch_all_roi_id(region:str,store_format:str,db:Session=Depends(get_db)):
    try:
        region = region.replace(' ','-')
        result = db.execute(
            text("call get_roi_metrics_reference(:store_format,:region);"),
                    {"store_format":store_format,"region":region})

        rows = result.mappings().all()

        if not rows:
            return JSONResponse(
                status_code=404,
                content="Store not found"
            )

        return {
            "success": True,
            "data": rows
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.get('/summary/{roiid}')
def fetch_summary_roi_id(roiid:str,db:Session=Depends(get_db)):
    try:
        result = db.execute(
            text("call get_roi_summary_page(:roiid);"),{"roiid":roiid})

        rows = result.mappings().all()

        if not rows:
            return JSONResponse(
                status_code=404,
                content="Store not found"
            )

        return {
            "success": True,
            "data": rows
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.get('/cutomer_discount')
def get_customer_discount_list(db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("CALL get_customer_discount_list()"),
        )

        rows = result.mappings().all()

        response = []

        for row in rows:
            data = {f'{row['customer_discount_pct']}' :row['yr1_pct']}
            response.append(data)
        
        if not rows:
            return JSONResponse(
                status_code=404,
                content="Store not found"
            )

        return {
            "success": True,
            "data": response
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.post('/stock_turn_guideline')
def get_stock_turn_guideline(payload:StockTurnGuidelineModel,db:Session=Depends(get_db)):
    try:
        result = db.execute(
            text("CALL get_stock_turn_value(:cluster,:sales,:region);"),
            {"cluster": payload.cluster,"sales": payload.sales,"region":payload.region}
        )

        rows = result.mappings().all()
        print(rows)

        if not rows:
            return JSONResponse(
                status_code=404,
                content="Store not found"
            )

        return {
            "success": True,
            "data": rows
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.get('/roi_expenses')
def get_roi_expenses(store_type:str,floor_type:str,retail_area:str,db:Session=Depends(get_db)):
    try:
        if(store_type == 'Mall Store' or store_type == 'standalone_store'):
            store_type='Mall'
        if(store_type.lower() == 'highstreet store'):
            store_type = 'HighStreet'
        result = db.execute(
            text("CALL get_roi_expenses(:store_type,:floor_type,:retail_area)"),
            {"store_type": store_type,"floor_type": floor_type,"retail_area":int(retail_area)}
        )

        rows = result.mappings().all()
        
        if not rows:
            return JSONResponse(
                status_code=404,
                content="Details not found"
            )

        return {
            "success": True,
            "data": rows
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.get('/role_level')
def get_role_levels(role:str,db:Session=Depends(get_db)):
    try:
        result = db.execute(
            text("CALL get_roi_role_level(:role)"),
            {"role": role}
        )

        rows = result.mappings().all()
        
        if not rows:
            return JSONResponse(
                status_code=404,
                content="Details not found"
            )

        return {
            "success": True,
            "data": rows
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.get('/head_count')
def get_role_head_counts(store:str,db:Session=Depends(get_db)):
    try:
        result = db.execute(
            text("CALL get_roi_role_headcount(:store)"),
            {"store": store}
        )

        rows = result.mappings().all()
        
        if not rows:
            return JSONResponse(
                status_code=404,
                content="Details not found"
            )

        return {
            "success": True,
            "data": rows
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


# Screen Data Save API's
# Screen 1
@app.post("/basic-store-details")
def save_basic_store_details(
    payload: BasicStorePayload,
    db: Session = Depends(get_db)):
    try:
        def to_float(val):
            try:
                return float(val) if val not in ('', "") else ''
            except (ValueError, TypeError):
                return ''

        roi_id = f"{payload.username.replace(" ","")}{datetime.now().strftime('%d%m%y%H%M%S')}"

        result = db.execute(
            text("""CALL get_roi_basic_store_details(
                :username, :roiid, :ty_history_id, :city, :state,
                :existing_store_code, :new_store_name_code, :region,
                :existing_store_format, :store_format_change, :new_store_format,
                :new_city, :project_type, :new_franchise, :new_franchisee_storename,
                :new_franchisee_storecode, :existing_franchisee_store_name,
                :existing_franchisee_store_code, :franchisee_ba_iat_score,
                :partner_db_status, :partner_score, :status
            )"""),
            {
                "username": payload.username,
                "roiid": roi_id,
                "ty_history_id": payload.historyId or '',
                "city": payload.city or '',
                "state": payload.state or '',
                "existing_store_code": payload.existingStoreCode or '',
                "new_store_name_code": '',
                "region": payload.region or '',
                "existing_store_format": payload.existingStoreFormat or '',
                "store_format_change": payload.storeFormatChange or '',
                "new_store_format": payload.newStoreFormat or '',
                "new_city": payload.newCity or '',
                "project_type": payload.projectType or '',
                "new_franchise": payload.newFranchise or '',
                "new_franchisee_storename": payload.newFranchiseeStoreName or '',
                "new_franchisee_storecode": payload.newFranchiseeStoreCode or '',
                "existing_franchisee_store_name": payload.franchiseeStoreName or '',
                "existing_franchisee_store_code": payload.franchiseeStoreCode or '',
                "franchisee_ba_iat_score": to_float(payload.baiatScore),
                "partner_db_status": payload.partnerDbStatus or '',
                "partner_score": to_float(payload.partnerScore),
                "status": "Pending",
            }
        )

        rows = result.mappings().all()

        # MySQL stored procedures can return multiple result sets (e.g., from
        # intermediate INSERT/UPDATE statements before the final SELECT).
        # Iterate through them until we find non-empty rows.
        if not rows:
            try:
                while result.cursor.nextset():
                    rows = result.mappings().all()
                    if rows:
                        break
            except Exception:
                pass

        db.commit()

        roi_id = ''
        if rows:
            row = dict(rows[0])
            roi_id = row.get("p_roiid") or row.get("ROIID") or row.get("roi_id") or next(iter(row.values()), '')

        return {
            "success": True,
            "roiId": roi_id,
            "data": [dict(r) for r in rows],
        }

    except Exception as e:
        db.rollback()
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

# Screen 2
@app.post("/store-retail-spec")
def save_store_retail_spec(
    payload: StoreRetailSpecPayload,
    db: Session = Depends(get_db)):
    try:
        def to_int(val):
            try:
                return int(val) if val not in ('', "") else ''
            except (ValueError, TypeError):
                return ''

        # Serialize floorPlate dict → "GF:1000 | FF:500" string
        floor_plate_str = ''
        if payload.floorPlate:
            parts = [f"{k}:{v}" for k, v in payload.floorPlate.items() if v not in ('', "")]
            floor_plate_str = " | ".join(parts) if parts else ''

        # p_number_of_floors_for_facade = count of selected facade floors
        floors_for_facade = len(payload.retailFloors) if payload.retailFloors else 0
        

        result = db.execute(
            text("""CALL get_roi_store_retail_specifications(
                :roiid, :ty_history_id, :store_type,
                :existing_overall_area, :existing_retail_area,
                :new_overall_area, :new_retail_area,
                :no_of_floors, :floor_plate,
                :frontage, :ceiling_height,
                :facade_led, :terrace_branding, :totem_pole,
                :display_type, :flooring_type,
                :floors_for_facade,
                :cashier_count, :karatmeter_count,
                :strong_room, :franchise_room, :manager_room,
                :conference_room, :pvr_room, :additional_workstation,
                :regional_service_centre, :remarks, :status
            )"""),
            {
                "roiid": payload.roiId or '',
                "ty_history_id": payload.tyHistoryId or '',
                "store_type": payload.storeType or '',
                "existing_overall_area": payload.existingOverallArea or '',
                "existing_retail_area": payload.existingRetailArea or '',
                "new_overall_area": payload.newOverallArea or '',
                "new_retail_area": payload.newRetailArea or '',
                "no_of_floors": to_int(payload.noOfFloors),
                "floor_plate": floor_plate_str,
                "frontage": payload.frontage or '',
                "ceiling_height": payload.ceilingHeight or '',
                "facade_led": payload.facadeLed or '',
                "terrace_branding": payload.terraceBranding or '',
                "totem_pole": payload.totemPole or '',
                "display_type": payload.displayType or '',
                "flooring_type": payload.flooringType or '',
                "floors_for_facade": floors_for_facade,
                "cashier_count": to_int(payload.cashierCount),
                "karatmeter_count": to_int(payload.karatmeterCount),
                "strong_room": to_int(payload.strongRoom),
                "franchise_room": to_int(payload.franchiseRoom),
                "manager_room": to_int(payload.managerRoom),
                "conference_room": to_int(payload.conferenceRoom),
                "pvr_room": to_int(payload.pvrRoom),
                "additional_workstation": to_int(payload.additionalWorkstation),
                "regional_service_centre": payload.regionalServiceCentre or '',
                "remarks": payload.remarks or '',
                "status": "Pending",
            }
        )

        rows = result.mappings().all()

        if not rows:
            try:
                while result.cursor.nextset():
                    rows = result.mappings().all()
                    if rows:
                        break
            except Exception:
                pass

        db.commit()

        return {"success": True, "data": [dict(r) for r in rows]}

    except Exception as e:
        db.rollback()
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

# Screen 3
def csv(values):
    if values is None:
        return ""
    return ",".join("" if v is None else str(v).replace("%", "") for v in values)

def expense_csv(escalation_str: str, values: list) -> str:
    """Build CSV: escalation,Yr1,Yr2,Yr3,Yr4,Yr5,Yr6 for stored procedure."""
    esc = 0
    if escalation_str and escalation_str not in ("\u2014", "-", ""):
        m = re.search(r"\d+\.?\d*", escalation_str)
        esc = m.group() if m else 0
    parts = [str(esc)] + ["" if v is None else str(v) for v in (values or [])]
    return ",".join(parts)

@app.post("/sales_planning_page_1")
def save_reference_storecode(payload: SalesPlanningPage1Model,db: Session = Depends(get_db)):
    try:
        store = payload.storeParticulars
        expenses = payload.expenses
        totals = payload.totals
        print(expenses)
        db.execute(
            text("""
                CALL get_sales_planning_ref_strcode_details(
                    :username,
                    :roiid,
                    :ref_store_code,
                    :sba,
                    :carpet_area,
                    :sales,
                    :inventory,
                    :sales_plain_share,
                    :sales_studded_share,
                    :inventory_plain_share,
                    :inventory_studded_share,
                    :plain_stock_turns,
                    :studded_stock_turns,
                    :lcg_mix,
                    :hcg_mix,
                    :mcg_mix,
                    :btq_amc_per,
                    :city_amc_pct,
                    :rent,
                    :staff_salaries,
                    :security_housekeeping,
                    :electricty,
                    :repairs_maintenance,
                    :insurance,
                    :btl,
                    :travel_conveyance,
                    :telephone_internet,
                    :cc_commission,
                    :gst,
                    :store_printing_pantry,
                    :consumables,
                    :other_staff_welfare,
                    :total_expenses,
                    :status
                )
            """),
            {
                "username": payload.username,
                "roiid": payload.roiid,
                "ref_store_code": payload.ref_storecode,

                "sba": store.get("Super Built Up Area", 0) or 0,
                "carpet_area": store.get("Carpet area", 0) or 0,
                "sales": store.get("Sales", 0) or 0,
                "inventory": store.get("Inventory", 0) or 0,
                "sales_plain_share": store.get("Sales Plain share", 0) or 0,
                "sales_studded_share": store.get("Sales Studded share", 0) or 0,
                "inventory_plain_share": store.get("Inventory Plain share", 0) or 0,
                "inventory_studded_share": store.get("Inventory Studded share", 0) or 0,
                "plain_stock_turns": store.get("Plain Stock Turns", 0) or 0,
                "studded_stock_turns": store.get("Studded Stock Turns", 0) or 0,
                "lcg_mix": store.get("LCG mix", 0) or 0,
                "hcg_mix": store.get("HCG mix", 0) or 0,
                "mcg_mix": store.get("MCG mix", 0) or 0,
                "btq_amc_per": store.get("Btg AMC%", 0) or 0,
                "city_amc_pct": store.get("City AMC%", 0) or 0,

                "rent": expenses.get("Rent", Expense()).monthly or 0,
                "staff_salaries": expenses.get("Staff Salaries", Expense()).monthly or 0,
                "security_housekeeping": expenses.get("Security & Housekeeping", Expense()).monthly or 0,
                "electricty": expenses.get("Electricity", Expense()).monthly or 0,
                "repairs_maintenance": expenses.get("Repairs & Maintenance", Expense()).monthly or 0,
                "insurance": expenses.get("Insurance", Expense()).monthly or 0,
                "btl": expenses.get("BTL", Expense()).monthly or 0,
                "travel_conveyance": expenses.get("Travel & Conveyance", Expense()).monthly or 0,
                "telephone_internet": expenses.get("Telephone/Internet", Expense()).monthly or 0,
                "cc_commission": expenses.get("Credit Card Commission", Expense()).monthly or 0,
                "gst": expenses.get("GST (primarily rental)", Expense()).monthly or 0,
                "store_printing_pantry": expenses.get("Store - Printing/Pantry etc", Expense()).monthly or 0,
                "consumables": expenses.get("Consumables", Expense()).monthly or 0,
                "other_staff_welfare": expenses.get("Other - Staff welfare/Uniforms etc", Expense()).monthly or 0,

                "total_expenses": totals.totalMonthly or 0,
                "status": "Pending",
            }
        )

        db.commit()

        return {
            "status": "success",
            "message": "Reference store details saved successfully."
        }
    except Exception as e:
        db.rollback()
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": str(e)
            }
        )

@app.post("/sales_planning_page_2")
def save_sales_planning_summary(payload: SalesPlanningPage2Model,db: Session = Depends(get_db)):
    try:
        i = payload.inputs
        c = payload.computed
        db.execute(
            text("""
                CALL get_roi_sales_planning_sales_summary(
                    :roiid,
                    :total_area_sba,
                    :carpet_area,
                    :walkin_per_day,
                    :increase_walkin,
                    :conversion_pct,
                    :buyers_per_day,
                    :average_ticket_size,
                    :growth_ticket_size,
                    :store_days,
                    :total_sales,
                    :sales_growth_pct,
                    :plain_share,
                    :studded_share,
                    :coins_silver_share,
                    :total_share,
                    :lcg,
                    :mcg,
                    :hcg,
                    :total_plain_mix,
                    :stone_share,
                    :gis,
                    :regular,
                    :color_stones,
                    :solitaire_a,
                    :solitaire_b,
                    :solitaire_c,
                    :solitaire_d,
                    :total_studded_mix,
                    :status
                )
            """),
            {

                "roiid": payload.roiid,

                "total_area_sba": csv([
                    i.totalAreaSBA,
                    i.totalAreaSBA,
                    i.totalAreaSBA,
                    i.totalAreaSBA,
                    i.totalAreaSBA,
                    i.totalAreaSBA
                ]),

                "carpet_area": csv([
                    i.totalAreaCarpet,
                    i.totalAreaCarpet,
                    i.totalAreaCarpet,
                    i.totalAreaCarpet,
                    i.totalAreaCarpet,
                    i.totalAreaCarpet
                ]),

                "walkin_per_day": csv(c.walkInPerDay),

                "increase_walkin": csv([
                    0,
                    *i.increaseWalkIns
                ]),

                "conversion_pct": csv(i.conversionPct),

                "buyers_per_day": csv(c.buyersPerDay),

                "average_ticket_size": csv(c.avgTicketSize),

                "growth_ticket_size": csv([
                    0,
                    *i.growthTicketSize
                ]),

                "store_days": csv([
                    i.storeDays
                ] * 6),

                "total_sales": csv(c.totalSales),

                "sales_growth_pct": csv(c.salesGrowthPct),

                "plain_share": csv(i.salesMix.plainShare),

                "studded_share": csv(i.salesMix.studdedShare),

                "coins_silver_share": csv(i.salesMix.coinsShare),

                "total_share": csv([
                    100,
                    100,
                    100,
                    100,
                    100,
                    100
                ]),

                "lcg": csv(i.plainMix.lcg),

                "mcg": csv(i.plainMix.mcg),

                "hcg": csv(i.plainMix.hcg),

                "total_plain_mix": csv([
                    100,
                    100,
                    100,
                    100,
                    100,
                    100
                ]),

                "stone_share": csv(i.plainMix.stoneShareHCG),

                "gis": csv(i.studdedMix.gis),

                "regular": csv(i.studdedMix.regular),

                "color_stones": csv(i.studdedMix.colorStones),

                "solitaire_a": csv(i.studdedMix.solitaireA),

                "solitaire_b": csv(i.studdedMix.solitaireB),

                "solitaire_c": csv(i.studdedMix.solitaireC),

                "solitaire_d": csv(i.studdedMix.solitaireD),

                "total_studded_mix": csv([
                    100,
                    100,
                    100,
                    100,
                    100,
                    100
                ]),

                "status": "Pending"
            }
        )

        db.commit()

        return {
            "status": "success",
            "message": "Sales Planning Summary saved successfully."
        }
    except Exception as e:
        db.rollback()
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": str(e)
            }
        )

@app.post("/sales_planning_page_3")
def save_stock_summary(payload: SalesPlanningPage3Model,db: Session = Depends(get_db)):
    try:
        i = payload.inputs
        c = payload.computed
        db.execute(
            text("""
                CALL get_roi_sales_planning_stock_summary(
                    :roiid,
                    :base_rate,
                    :markup_pct,
                    :plaingroup_amc_pct,
                    :lcg,
                    :mcg,
                    :hcg,
                    :coins_amc_pct,
                    :stock_turn_plain,
                    :stock_turn_studded,
                    :stock_turn_coins_silver,
                    :stock_turn_total,
                    :stock_plain,
                    :stock_studded,
                    :stock_coins_silver,
                    :stock_total,
                    :stockturn_bg_plain,
                    :stockturn_bg_studded,
                    :stockturn_bg_coins_silver,
                    :stockturn_bg_total,
                    :status
                )
            """),
            {
                "roiid": payload.roiid,

                "base_rate": csv([
                    i.baseRate22K,
                    i.baseRate22K,
                    i.baseRate22K,
                    i.baseRate22K,
                    i.baseRate22K,
                    i.baseRate22K
                    ]),
                "markup_pct": csv([
                    i.markupPct,
                    i.markupPct,
                    i.markupPct,
                    i.markupPct,
                    i.markupPct,
                    i.markupPct
                    ]),

                # Plain AMC %
                "plaingroup_amc_pct": csv([
                    (
                        (float(i.plainAMC.lcg[idx] or 0) +
                         float(i.plainAMC.mcg[idx] or 0) +
                         float(i.plainAMC.hcg[idx] or 0)) / 3
                    )
                    for idx in range(6)
                ]),

                "lcg": csv(i.plainAMC.lcg),
                "mcg": csv(i.plainAMC.mcg),
                "hcg": csv(i.plainAMC.hcg),

                "coins_amc_pct": csv(i.coinsAMC),

                "stock_turn_plain": csv(i.stockTurnPlain),
                "stock_turn_studded": csv(i.stockTurnStudded),
                "stock_turn_coins_silver": csv(i.stockTurnCoins),

                "stock_turn_total": csv(c.totalStockTurn),

                "stock_plain": csv(c.stockPlain),
                "stock_studded": csv(c.stockStudded),
                "stock_coins_silver": csv(c.stockCoins),
                "stock_total": csv(c.totalStock),

                "stockturn_bg_plain": csv(c.bgPlainStockTurn),
                "stockturn_bg_studded": csv(c.bgStuddedStockTurn),
                "stockturn_bg_coins_silver": csv(c.bgCoinsStockTurn),
                "stockturn_bg_total": csv(c.bgTotalStockTurn),

                "status": "Pending"
            }
        )

        db.commit()

        return {
            "status": "success",
            "message": "Stock summary saved successfully."
        }

    except Exception as e:
        db.rollback()
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": str(e)
            }
        )

@app.post("/sales_planning_page_4")
def save_sales_planning_discount(payload: SalesPlanningDiscountModel,db: Session = Depends(get_db)):
    try:
        tcd = payload.totalCustomerDiscount
        ghs = payload.totalGHSDiscount
        db.execute(
            text("""
                CALL get_roi_sales_planning_discount(
                    :roiid,
                    :tcd_lcg,
                    :tcd_mcg,
                    :tcd_hcg,
                    :tcd_gis,
                    :tcd_regular,
                    :tcd_color_stones,
                    :tcd_solitaire_a,
                    :tcd_solitaire_b,
                    :tcd_solitaire_c,
                    :tcd_solitaire_d,
                    :tcd_coins,
                    :tcd_total,
                    :tcd_pct_ucp,
                    :tghsd_plain,
                    :tghsd_studded,
                    :tghsd_coins,
                    :tghsd_total,
                    :tghsd_pct_ucp,
                    :status
                )
            """),
            {
                "roiid": payload.roiid,

                # Total Customer Discount
                "tcd_lcg": csv(tcd.plain.lcg),
                "tcd_mcg": csv(tcd.plain.mcg),
                "tcd_hcg": csv(tcd.plain.hcg),

                "tcd_gis": csv(tcd.studded.gis),
                "tcd_regular": csv(tcd.studded.regular),
                "tcd_color_stones": csv(tcd.studded.colorStones),

                "tcd_solitaire_a": csv(tcd.studded.solitaireA),
                "tcd_solitaire_b": csv(tcd.studded.solitaireB),
                "tcd_solitaire_c": csv(tcd.studded.solitaireC),
                "tcd_solitaire_d": csv(tcd.studded.solitaireD),

                "tcd_coins": csv(tcd.coins),
                "tcd_total": csv(tcd.total),
                "tcd_pct_ucp": csv(tcd.pctOfUCP),

                # Total GHS Discount
                "tghsd_plain": csv(ghs.plain),
                "tghsd_studded": csv(ghs.studded),
                "tghsd_coins": csv(ghs.coins),
                "tghsd_total": csv(ghs.total),
                "tghsd_pct_ucp": csv(ghs.pctOfUCP),

                "status": "Pending"
            }
        )

        db.commit()

        return {
            "status": "success",
            "message": "Sales Planning Discount saved successfully."
        }

    except Exception as e:
        db.rollback()
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": str(e)
            }
        )

# To view Screen 3 Data
@app.post("/sales_planning")
def view_sales_planning(payload: ViewSalesPlanningModel,db: Session = Depends(get_db)):
    procedures = {
        1: "view_sales_planning_ref_strcode_details",
        2: "view_sales_planning_sales_summary",
        3: "view_sales_planning_stock_summary",
        4: "view_sales_planning_discount",
    }

    procedure = procedures.get(payload.screen)

    if procedure is None:
        return JSONResponse(
            status_code=400,
            content={"message": "Invalid screen number. Use 1, 2, 3 or 4."}
        )

    try:
        result = db.execute(
            text(f"CALL {procedure}(:roiid)"),
            {"roiid": payload.roiid}
        )

        rows = result.mappings().all()

        # Handle procedures that return result in next result set
        if not rows:
            try:
                while result.cursor.nextset():
                    rows = result.mappings().all()
                    if rows:
                        break
            except Exception:
                pass

        if not rows:
            return JSONResponse(
                status_code=404,
                content={"message": "No data found"}
            )

        return {
            "success": True,
            "data": rows
        }

    except Exception as e:
        db.rollback()
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": str(e)
            }
        )

@app.post("/expense_planning_page1")
def save_capex_details(payload: CapexRequest, db: Session = Depends(get_db)):
    try:
        store = payload.storeData
        selections = payload.selections
        amounts = payload.computedAmounts

        db.execute(
            text("""
                CALL get_roi_capex_expense_details(
                    :p_roiid,
                    :p_flooring_type,
                    :p_property_type,
                    :p_retail_area,
                    :p_interiors,
                    :p_additional_civil_works,
                    :p_corner_property_work,
                    :p_lift_installation,
                    :p_increase_facade_height_per_floor,
                    :p_ehv_zone_addition,
                    :p_dxc_equipment_interiors,
                    :p_art_crafts_type1,
                    :p_art_crafts_type2,
                    :p_art_crafts_type3,
                    :p_led_screen,
                    :p_solar_installation,
                    :p_engraving_machine,
                    :p_it_equipments_installation,
                    :p_total_capex,
                    :p_rate_per_sqft,
                    :p_status
                )
            """),
            {
                "p_roiid": store["roiid"],
                "p_flooring_type": store["flooring_type"],
                "p_property_type": store["store_type"],
                "p_retail_area": float(store["existing_retail_area"]),

                "p_interiors": payload.interiors,

                "p_additional_civil_works": amounts.get("Civil Works", 0),

                "p_corner_property_work": amounts.get(
                    "Additional Work for Corner Property", 0
                ),

                "p_lift_installation": amounts.get(
                    "Lift(Irrespective of the area - 1 No)", 0
                ),

                "p_increase_facade_height_per_floor": amounts.get(
                    "Increase Façade Height per Floor", 0
                ),

                "p_ehv_zone_addition": amounts.get(
                    "EHV zone addition - Furniture and interior", 0
                ),

                "p_dxc_equipment_interiors": amounts.get(
                    "DxC (Equipment and Interiors)", 0
                ),

                # Since frontend currently has a single Art & Crafts amount,
                # passing it as Type1 and keeping Type2/Type3 as 0.
                "p_art_crafts_type1": amounts.get("Art & Craft - TYPE 1", 0),
                "p_art_crafts_type2": amounts.get("Art & Craft - TYPE 2 & TYPE 3", 0),
                "p_art_crafts_type3": amounts.get("Art & Craft - TYPE 2 & TYPE 3", 0),

                "p_led_screen": amounts.get("LED Screen", 0),

                "p_solar_installation": amounts.get("Solar", 0),

                "p_engraving_machine": amounts.get(
                    "engravingMachine", 0
                ),

                "p_it_equipments_installation": payload.itEquipment,

                "p_total_capex": payload.totalCapex,

                "p_rate_per_sqft": payload.ratePerSqft,

                "p_status": "Pending"
            }
        )

        db.commit()

        return {
            "status": True,
            "message": "CAPEX details saved successfully."
        }

    except Exception as e:
        db.rollback()
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": str(e)
            }
        )

@app.post("/expense_planning_page2")
def save_resource_other_expenses(payload: ResourceExpenseRequest,db: Session = Depends(get_db),):
    try:

        # -----------------------------
        # Save Resource Expenses
        # -----------------------------
        rows = payload.salaries["rows"]

        security = 0
        housekeeping = 0

        for item in payload.securityHousekeeping["rows"]:
            if item["role"].lower() == "security":
                security = float(item["monthly"])
            elif item["role"].lower() == "housekeeping":
                housekeeping = float(item["monthly"])

        for role, values in rows.items():

            db.execute(
                text("""
                    CALL get_roi_resource_expense_details(
                        :p_roiid,
                        :p_role,
                        :p_level,
                        :p_commercial_ref_salary,
                        :p_monthly_fixed,
                        :p_annual_fixed,
                        :p_variable_component,
                        :p_annual_variable,
                        :p_annual_total,
                        :p_no_of_resource,
                        :p_security,
                        :p_housekeeping,
                        :p_status
                    )
                """),
                {
                    "p_roiid": payload.roiid,
                    "p_role": role,
                    "p_level": values.get("level", ""),
                    "p_commercial_ref_salary": float(values.get("commercialRefSalary", 0)),
                    "p_monthly_fixed": float(values.get("monthlyFixed", 0)),
                    "p_annual_fixed": float(values.get("annualFixed", 0)),
                    "p_variable_component": float(values.get("variableComponent", 0)),
                    "p_annual_variable": float(values.get("annualVariable", 0)),
                    "p_annual_total": float(values.get("annualTotal", 0)),
                    "p_no_of_resource": int(values.get("nos", 0)),
                    "p_security": security,
                    "p_housekeeping": housekeeping,
                    "p_status": "Pending",
                },
            )

        # -----------------------------
        # Save Other Expenses
        # -----------------------------
        db.execute(
            text("""
                CALL get_roi_other_expense_details(
                    :p_roiid,
                    :p_sqft_emp,
                    :p_cost_emp,
                    :p_electricity_rate_sqft,
                    :p_electricity_total,
                    :p_registration_charges,
                    :p_temp_cost,
                    :p_status
                )
            """),
            {
                "p_roiid": payload.roiid,
                "p_sqft_emp": float(payload.salaries["sqftPerEmp"]),
                "p_cost_emp": float(payload.salaries["costPerEmp"]),
                "p_electricity_rate_sqft": float(payload.electricity["ratePerSqft"]),
                "p_electricity_total": float(payload.electricity["total"]),
                "p_registration_charges": float(payload.otherExpenses["registrationCharges"]),
                "p_temp_cost": float(payload.otherExpenses["relocCost"]),
                "p_status": "Pending",
            },
        )

        db.commit()

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Resource and other expense details saved successfully."
            }
        )

    except Exception as e:
        db.rollback()
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": str(e)
            }
        )

@app.post("/expense_planning_page3")
def save_expense_summary(payload: ExpenseSummaryRequest, db: Session = Depends(get_db)):
    try:
        r  = payload.rent
        es = payload.expenseSummary

        # Build label → row lookup
        row_map = {row.label: row for row in es.rows}

        def row_csv(label: str) -> str:
            row = row_map.get(label)
            if not row:
                return expense_csv("0", [None] * 6)
            return expense_csv(row.escalation, row.values)

        no_esc = lambda vals: expense_csv("0", vals)

        db.execute(
            text("""
                CALL get_roi_expense_summary(
                    :p_roiid,
                    :p_sqft_super_built_area,
                    :p_rate_per_sqft,
                    :p_revenue_sharing_pct,
                    :p_min_guarantee_monthly,
                    :p_total_annual_rent,
                    :p_total_monthly_rent,
                    :p_rent,
                    :p_salaries,
                    :p_security_housekeeping,
                    :p_electricity,
                    :p_repairs_maintenance,
                    :p_insurance,
                    :p_btl,
                    :p_travel_conveyance,
                    :p_telephone_internet,
                    :p_credit_card_commission,
                    :p_gst_rental,
                    :p_store_printing_pantry,
                    :p_consumables_safety,
                    :p_other_staff_welfare,
                    :p_total_expense,
                    :p_status
                )
            """),
            {
                "p_roiid":                  payload.roiid,
                "p_sqft_super_built_area":  no_esc(r.sba),
                "p_rate_per_sqft":          no_esc(r.ratePerSqft),
                "p_revenue_sharing_pct":    no_esc(r.revSharePct) if r.revenueSharing == "Yes" else None,
                "p_min_guarantee_monthly":  no_esc(r.minGuaranteeMth) if r.revenueSharing == "Yes" else None,
                "p_total_annual_rent":       no_esc(r.annualRent),
                "p_total_monthly_rent":      no_esc(r.monthlyRent),
                "p_rent":                    row_csv("Rent"),
                "p_salaries":                row_csv("Salaries"),
                "p_security_housekeeping":   row_csv("Security & Housekeeping"),
                "p_electricity":             row_csv("Electricity"),
                "p_repairs_maintenance":     row_csv("Repairs & Maintenance"),
                "p_insurance":               row_csv("Insurance"),
                "p_btl":                     row_csv("BTL"),
                "p_travel_conveyance":       row_csv("Travel & Conveyance"),
                "p_telephone_internet":      row_csv("Telephone/Internet"),
                "p_credit_card_commission":  row_csv("Credit Card Commission"),
                "p_gst_rental":              row_csv("GST (primarily rental)"),
                "p_store_printing_pantry":   row_csv("Store \u2014 Printing/Pantry etc"),
                "p_consumables_safety":      row_csv("Consumables, Safety, Cust Exp"),
                "p_other_staff_welfare":     row_csv("Other \u2014 Staff welfare/Uniforms"),
                "p_total_expense":           expense_csv("0", es.total),
                "p_status": "Pending",
            }
        )

        db.commit()

        # ── Auto-trigger TOT computation (non-fatal if it fails) ──────────────
        try:
            tot_metadata = _compute_and_save_tot(payload.roiid, payload.store_format or "", db)
            _logger.info("TOT auto-saved (%d procs) for ROI: %s", len(tot_metadata["saved_procedures"]), payload.roiid)
        except Exception as tot_err:
            # Expense summary already committed — log and continue
            _logger.error("TOT computation failed for ROI %s: %s", payload.roiid, tot_err, exc_info=True)
            tot_metadata = {}

        return {
            "status": "success",
            "message": "Expense summary saved successfully.",
            "tot_metadata": tot_metadata,
        }

    except Exception as e:
        db.rollback()
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": str(e)}
        )


@app.get("/tot_calculation/{roiid}")
def recompute_tot_calculation(roiid: str, store_format: str = "", db: Session = Depends(get_db)):
    """
    Manually compute (or re-compute) the full TOT sheet for a given ROI ID.
    Saves each section via its dedicated stored procedure and returns metadata.

    Query params:
      store_format  — e.g. "L1", "L2.5" (optional, falls back to empty string)
    """
    try:
        metadata = _compute_and_save_tot(roiid, store_format, db)
        return {"success": True, "data": metadata}
    except ValueError as ve:
        return JSONResponse(status_code=404, content={"success": False, "message": str(ve)})
    except Exception as e:
        db.rollback()
        _logger.error("TOT computation error for ROI %s: %s", roiid, e, exc_info=True)
        return JSONResponse(status_code=500, content={"success": False, "message": str(e)})


_VALID_TOT_TYPES = {
    "Plain_TOT_Ucp_Sales", "Plain_TOT_amcgm", "Plain_TOT_Gramcmu",
    "Pain_TOT_Grammage", "Plain_TOT_amclakhs", "Plain_TOT_yearwise_data",
    "Plain_netamc", "Coins_TOT", "Plain_TOT_Presummary", "Plain_TOT_Final",
    "Studded_TOT_Yearwise_data", "Studded_TOT_slabwise_data", "Studded_TOT_Final",
}

@app.get("/tot_details/{roiid}")
def view_tot_details(roiid: str, tot_type: str, db: Session = Depends(get_db)):
    if tot_type not in _VALID_TOT_TYPES:
        return JSONResponse(
            status_code=400,
            content={"success": False, "message": f"Invalid tot_type '{tot_type}'. Valid values: {sorted(_VALID_TOT_TYPES)}"},
        )
    try:
        result = db.execute(
            text("CALL view_roi_tot_details(:p_roiid, :p_tot_type)"),
            {"p_roiid": roiid, "p_tot_type": tot_type},
        )
        rows = result.mappings().all()
        if not rows:
            try:
                while result.cursor.nextset():
                    rows = result.mappings().all()
                    if rows:
                        break
            except Exception:
                pass
        if not rows:
            return JSONResponse(status_code=404, content={"success": False, "message": "No TOT data found for this ROI ID and type."})
        return {"success": True, "tot_type": tot_type, "data": [dict(r) for r in rows]}
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "message": str(e)})

@app.get("/summary_screen_5/{roiid}")
def get_final_summary(roiid: str, db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("CALL get_roi_final_summary_screen(:p_roiid)"),
            {"p_roiid": roiid},
        )
        rows = result.mappings().all()
        if not rows:
            try:
                while result.cursor.nextset():
                    rows = result.mappings().all()
                    if rows:
                        break
            except Exception:
                pass
        if not rows:
            return JSONResponse(status_code=404, content={"success": False, "message": "No TOT data found for this ROI ID and type."})
        return {"success": True, "data": [dict(r) for r in rows]}
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "message": str(e)})


class FinalSummaryPayload(BaseModel):
    roiid: str
    summary_data: list

@app.post("/summary_screen_5/save")
def save_final_summary(payload: FinalSummaryPayload, db: Session = Depends(get_db)):
    try:
        db.execute(
            text("CALL save_roi_final_summary_screen(:roiid, :p_json, :status)"),
            {
                "roiid":  payload.roiid,
                "p_json": json.dumps(payload.summary_data, default=str),
                "status": "Pending",
            },
        )
        db.commit()
        return {"success": True, "message": "Summary saved successfully."}
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"success": False, "message": str(e)})


@app.post("/roi/submit/{roiid}")
def submit_roi_for_approval(roiid: str, db: Session = Depends(get_db)):
    try:
        db.execute(
            text("CALL roi_status_update(:roiid, :status)"),
            {"roiid": roiid, "status": "Submitted to RBM"},
        )
        db.commit()
        return {"success": True, "message": "ROI submitted for approval."}
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"success": False, "message": str(e)})


_VALID_EXPENSE_TYPES = {"CAPEX", "RESOURCE", "OTHER", "SUMMARY"}

@app.get("/expense_details/{roiid}")
def view_expense_details(roiid: str, expense_type: str, db: Session = Depends(get_db)):
    if expense_type.upper() not in _VALID_EXPENSE_TYPES:
        return JSONResponse(
            status_code=400,
            content={"success": False, "message": f"Invalid expense_type '{expense_type}'. Valid values: {sorted(_VALID_EXPENSE_TYPES)}"},
        )
    try:
        result = db.execute(
            text("CALL view_roi_expense_details(:p_roiid, :p_expense_type)"),
            {"p_roiid": roiid, "p_expense_type": expense_type.upper()},
        )
        rows = result.mappings().all()
        if not rows:
            try:
                while result.cursor.nextset():
                    rows = result.mappings().all()
                    if rows:
                        break
            except Exception:
                pass
        if not rows:
            return JSONResponse(status_code=404, content={"success": False, "message": f"No {expense_type} data found for ROI {roiid}."})
        return {"success": True, "expense_type": expense_type.upper(), "data": [dict(r) for r in rows]}
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "message": str(e)})

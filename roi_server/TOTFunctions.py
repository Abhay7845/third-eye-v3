import json
from sqlalchemy import text
import logging
from sqlalchemy.orm import Session
# ─── TOT-sheet static reference tables ────────────────────────────────────────
# GST back-calculated from a GST-inclusive price (3% GST on gold jewellery)

_logger = logging.getLogger(__name__)

_GST_RATE_GOLD: float = 3.0 / 103.0

# Transfer-of-Title (TOT) %, indexed by Net Selling Value (NSV) band in lakhs
_TOT_BANDS = [
    {"lower":   0, "upper":    20, "lcg": 0.23, "mcg": 0.26, "hcg": 0.29, "hcg_stone": 0.05},
    {"lower":  20, "upper":    40, "lcg": 0.20, "mcg": 0.23, "hcg": 0.27, "hcg_stone": 0.05},
    {"lower":  40, "upper":    60, "lcg": 0.18, "mcg": 0.20, "hcg": 0.24, "hcg_stone": 0.03},
    {"lower":  60, "upper":    80, "lcg": 0.16, "mcg": 0.18, "hcg": 0.21, "hcg_stone": 0.03},
    {"lower":  80, "upper":   100, "lcg": 0.16, "mcg": 0.18, "hcg": 0.20, "hcg_stone": 0.03},
    {"lower": 100, "upper": 1e15,  "lcg": 0.16, "mcg": 0.18, "hcg": 0.20, "hcg_stone": 0.03},
]

# Studded TOT%: NSV band (in lakhs) → ToT% per studded category
_STUDDED_TOT_BANDS = [
    {"lower":  0, "upper":    10, "gis": 0.100, "regular": 0.125, "color_stones": 0.050, "solitaire_a": 0.090, "solitaire_b": 0.070, "solitaire_c": 0.050, "solitaire_d": 0.040},
    {"lower": 10, "upper":    20, "gis": 0.090, "regular": 0.115, "color_stones": 0.045, "solitaire_a": 0.090, "solitaire_b": 0.070, "solitaire_c": 0.050, "solitaire_d": 0.040},
    {"lower": 20, "upper":    50, "gis": 0.070, "regular": 0.105, "color_stones": 0.040, "solitaire_a": 0.090, "solitaire_b": 0.070, "solitaire_c": 0.050, "solitaire_d": 0.040},
    {"lower": 50, "upper":  1e15, "gis": 0.060, "regular": 0.095, "color_stones": 0.040, "solitaire_a": 0.090, "solitaire_b": 0.070, "solitaire_c": 0.050, "solitaire_d": 0.040},
]


# ─── TOT helper utilities ──────────────────────────────────────────────────────

def _parse_csv_floats(raw, n: int = 6) -> list:
    """Convert a comma-separated DB string into a list of floats, zero-padded to n."""
    if not raw:
        return [0.0] * n
    parts = str(raw).split(",")
    result = []
    for p in parts[:n]:
        try:
            result.append(float(p.strip()) if p.strip() else 0.0)
        except (ValueError, TypeError):
            result.append(0.0)
    while len(result) < n:
        result.append(0.0)
    return result


def _safe_div(a: float, b: float) -> float:
    return a / b if b else 0.0


def _sp_first_row(db: Session, proc: str, roiid: str) -> dict:
    """Execute a stored procedure and return the first row as a dict,
    handling procedures that emit multiple result sets."""
    result = db.execute(text(f"CALL {proc}(:roiid)"), {"roiid": roiid})
    rows = result.mappings().all()
    if not rows:
        try:
            while result.cursor.nextset():
                rows = result.mappings().all()
                if rows:
                    break
        except Exception:
            pass
    return dict(rows[0]) if rows else {}


def _sp_header_dict(db: Session, proc: str, roiid: str) -> dict:
    """For view SPs that return one row per metric with Header/Yr1..Yr6 columns."""
    result = db.execute(text(f"CALL {proc}(:roiid)"), {"roiid": roiid})
    rows = result.mappings().all()
    if not rows:
        try:
            while result.cursor.nextset():
                rows = result.mappings().all()
                if rows:
                    break
        except Exception:
            pass
    out: dict = {}
    for row in rows:
        h = row.get("Header")
        if h:
            out[h] = [float(row.get(f"Yr{y}") or 0) for y in range(1, 7)]
    return out


def _compute_tot(roiid: str, db: Session) -> dict:
    """
    Compute the full TOT (Transfer-of-Title) sheet for a given ROI ID,
    covering all six years for both Plain (LCG/MCG/HCG) and Studded categories.

    Data sources:
      • view_sales_planning_sales_summary  – page-2: total sales & mix %
      • view_sales_planning_stock_summary  – page-3: base rate, markup, AMC %
      • view_sales_planning_discount       – page-4: discount amounts by category

    DB persistence: CALL save_roi_tot_calculation(p_roiid VARCHAR, p_tot_json LONGTEXT)
    """
    # ── 1. Fetch source data ───────────────────────────────────────────────
    p2 = _sp_header_dict(db, "view_sales_planning_sales_summary", roiid)
    if not p2:
        raise ValueError(f"Sales-planning page-2 data not found for ROI: {roiid}")
    p3 = _sp_header_dict(db, "view_sales_planning_stock_summary", roiid)
    if not p3:
        raise ValueError(f"Sales-planning page-3 data not found for ROI: {roiid}")
    p4 = _sp_first_row(db, "view_sales_planning_discount", roiid)  # single-row CSV format

    # ── 2. Extract year arrays by Header name ────────────────────────────────
    _z = [0.0] * 6  # default when a header is missing
    total_sales   = p2.get("Sales Planning_Total Sales",            _z)
    plain_share   = p2.get("Sales Planning_Plain Share",            _z)
    studded_share = p2.get("Sales Planning_Studded Share",          _z)
    coins_share   = p2.get("Sales Planning_Coins /Silver Share",    _z)
    lcg_mix       = p2.get("Sales Planning_LCG",                    _z)
    mcg_mix       = p2.get("Sales Planning_MCG",                    _z)
    hcg_mix       = p2.get("Sales Planning_HCG",                    _z)
    stone_share   = p2.get("Sales Planning_Stoneshare(HCG only)",   _z)
    gis_mix       = p2.get("Sales Planning_GIS",                    _z)
    reg_mix       = p2.get("Sales Planning_Regular",                _z)
    cs_mix        = p2.get("Sales Planning_Color Stones",           _z)
    sa_mix        = p2.get("Sales Planning_Solitaire A(<70C)",      _z)
    sb_mix        = p2.get("Sales Planning_Solitaire B(70-100C)",   _z)
    sc_mix        = p2.get("Sales Planning_Solitaire C(1CRT+)",     _z)
    sd_mix        = p2.get("Sales Planning_Solitaire D(2CRT+)",     _z)

    base_rate     = p3.get("Pricing Metrics_BaseRate",              _z)
    markup_pct    = p3.get("Pricing Metrics_Mark-up%",              _z)
    amc_pct_lcg   = p3.get("Pricing Metrics_LCG",                   _z)
    amc_pct_mcg   = p3.get("Pricing Metrics_MCG",                   _z)
    amc_pct_hcg   = p3.get("Pricing Metrics_HCG",                   _z)
    amc_pct_coins = p3.get("Pricing Metrics_Coins AMC%",            _z)

    ghs_plain_pct   = _parse_csv_floats(p4.get("tghsd_plain"))    if p4 else _z
    ghs_studded_pct = _parse_csv_floats(p4.get("tghsd_studded"))  if p4 else _z
    cust_disc_pct   = _parse_csv_floats(p4.get("tcd_pct_ucp"))    if p4 else _z
    disc_gis  = _parse_csv_floats(p4.get("tcd_gis"))          if p4 else _z
    disc_reg  = _parse_csv_floats(p4.get("tcd_regular"))       if p4 else _z
    disc_cs   = _parse_csv_floats(p4.get("tcd_color_stones"))  if p4 else _z
    disc_sa   = _parse_csv_floats(p4.get("tcd_solitaire_a"))   if p4 else _z
    disc_sb   = _parse_csv_floats(p4.get("tcd_solitaire_b"))   if p4 else _z
    disc_sc   = _parse_csv_floats(p4.get("tcd_solitaire_c"))   if p4 else _z
    disc_sd   = _parse_csv_floats(p4.get("tcd_solitaire_d"))   if p4 else _z

    # ── 3. Per-year metric arrays (Yr1–Yr6) ───────────────────────────────────
    ucp_lcg, ucp_mcg, ucp_hcg, ucp_coins                        = [], [], [], []
    ucp_gis, ucp_reg, ucp_cs_, ucp_sa_, ucp_sb_, ucp_sc_, ucp_sd_ = [], [], [], [], [], [], []
    btq_rate_yr                                                   = []
    amc_gm_lcg, amc_gm_mcg, amc_gm_hcg, amc_gm_coins           = [], [], [], []
    eff_lcg, eff_mcg, eff_hcg, eff_coins                        = [], [], [], []
    gram_lcg, gram_mcg, gram_hcg, gram_coins                     = [], [], [], []
    amcl_lcg, amcl_mcg, amcl_hcg, amcl_coins                    = [], [], [], []
    amcc_lcg, amcc_mcg, amcc_hcg, amcc_coins                     = [], [], [], []

    for i in range(6):
        ts = total_sales[i]
        ps = plain_share[i]   / 100.0
        ss = studded_share[i] / 100.0
        cs = coins_share[i]   / 100.0

        ul = ts*ps*(lcg_mix[i]/100.0); um = ts*ps*(mcg_mix[i]/100.0)
        uh = ts*ps*(hcg_mix[i]/100.0); uc = ts*cs
        ucp_lcg.append(round(ul,4)); ucp_mcg.append(round(um,4))
        ucp_hcg.append(round(uh,4)); ucp_coins.append(round(uc,4))

        ucp_gis.append(round(ts*ss*(gis_mix[i]/100.0),4))
        ucp_reg.append(round(ts*ss*(reg_mix[i]/100.0),4))
        ucp_cs_.append(round(ts*ss*(cs_mix[i] /100.0),4))
        ucp_sa_.append(round(ts*ss*(sa_mix[i] /100.0),4))
        ucp_sb_.append(round(ts*ss*(sb_mix[i] /100.0),4))
        ucp_sc_.append(round(ts*ss*(sc_mix[i] /100.0),4))
        ucp_sd_.append(round(ts*ss*(sd_mix[i] /100.0),4))

        bq = base_rate[i] * (1.0 + markup_pct[i]/100.0)
        btq_rate_yr.append(round(bq,4))

        al = bq*(amc_pct_lcg[i]/100.0);  am = bq*(amc_pct_mcg[i]/100.0)
        ah = bq*(amc_pct_hcg[i]/100.0);  ac = bq*(amc_pct_coins[i]/100.0)
        amc_gm_lcg.append(round(al,4)); amc_gm_mcg.append(round(am,4))
        amc_gm_hcg.append(round(ah,4)); amc_gm_coins.append(round(ac,4))

        erl,erm,erh,erc = bq+al, bq+am, bq+ah, bq+ac
        eff_lcg.append(round(erl,4)); eff_mcg.append(round(erm,4))
        eff_hcg.append(round(erh,4)); eff_coins.append(round(erc,4))

        gml=_safe_div(ul*100_000,erl); gmm=_safe_div(um*100_000,erm)
        gmh=_safe_div(uh*100_000,erh); gmc=_safe_div(uc*100_000,erc)
        gram_lcg.append(round(gml,4)); gram_mcg.append(round(gmm,4))
        gram_hcg.append(round(gmh,4)); gram_coins.append(round(gmc,4))

        ll=gml*al/100_000; lm=gmm*am/100_000; lh=gmh*ah/100_000; lc=gmc*ac/100_000
        amcl_lcg.append(round(ll,4)); amcl_mcg.append(round(lm,4))
        amcl_hcg.append(round(lh,4)); amcl_coins.append(round(lc,4))
        amcc_lcg.append(round(ll/100,6)); amcc_mcg.append(round(lm/100,6))
        amcc_hcg.append(round(lh/100,6)); amcc_coins.append(round(lc/100,6))

    # ── 4. Plain TOT helper (per year) ─────────────────────────────────────────
    def _plain_year_tot(i: int) -> dict:
        ul1,um1,uh1       = ucp_lcg[i],  ucp_mcg[i],  ucp_hcg[i]
        aml1,amm1,amh1    = amcl_lcg[i], amcl_mcg[i], amcl_hcg[i]
        disc_f = cust_disc_pct[i]/100.0
        ghs_f  = ghs_plain_pct[i]/100.0

        gst_l,gst_m,gst_h    = ul1*_GST_RATE_GOLD, um1*_GST_RATE_GOLD, uh1*_GST_RATE_GOLD
        disc_l,disc_m,disc_h = ul1*disc_f,          um1*disc_f,          uh1*disc_f
        ghs_l,ghs_m,ghs_h   = ul1*ghs_f,            um1*ghs_f,            uh1*ghs_f
        net_amc_l = aml1*(1.0-_GST_RATE_GOLD-disc_f)
        net_amc_m = amm1*(1.0-_GST_RATE_GOLD-disc_f)
        net_amc_h = amh1*(1.0-_GST_RATE_GOLD-disc_f)
        nsv_l = ul1-gst_l-disc_l-ghs_l
        nsv_m = um1-gst_m-disc_m-ghs_m
        nsv_h = uh1-gst_h-disc_h-ghs_h
        stone = (stone_share[i]/100.0)*uh1

        def _pbands(nsv_tot, amc_tot, stone_ucp, cat):
            rows, rem = [], nsv_tot
            for band in _TOT_BANDS:
                bw    = band["upper"]-band["lower"]
                b_nsv = min(bw,max(0.0,rem)) if band["upper"]<1e14 else max(0.0,rem)
                r     = _safe_div(b_nsv, nsv_tot)
                b_amc   = amc_tot*r
                b_stone = stone_ucp*r if cat=="hcg" else 0.0
                b_tot   = b_amc*band[cat] + b_stone*band["hcg_stone"]
                rows.append({"band":f"{band['lower']}-{int(min(band['upper'],100))}","nsv":round(b_nsv,4),"amc":round(b_amc,4),"stone":round(b_stone,4),"tot":round(b_tot,4)})
                rem -= b_nsv
                if rem<=0: break
            return rows

        bl=_pbands(nsv_l,aml1,0.0,"lcg")
        bm=_pbands(nsv_m,amm1,0.0,"mcg")
        bh=_pbands(nsv_h,amh1,stone,"hcg")
        tl=sum(b["tot"] for b in bl); tm=sum(b["tot"] for b in bm)
        th=sum(b["tot"] for b in bh); tt=tl+tm+th
        gil,gim,gih = tl*ghs_f, tm*ghs_f, th*ghs_f

        return {
            "summary": {
                "ucp":          {"lcg":round(ul1,4),"mcg":round(um1,4),"hcg":round(uh1,4),"overall":round(ul1+um1+uh1,4)},
                "ucp_mix_pct": {"lcg":lcg_mix[i],"mcg":mcg_mix[i],"hcg":hcg_mix[i]},
                "amc":          {"lcg":round(aml1,4),"mcg":round(amm1,4),"hcg":round(amh1,4),"overall":round(aml1+amm1+amh1,4)},
                "amc_pct":      {"lcg":amc_pct_lcg[i],"mcg":amc_pct_mcg[i],"hcg":amc_pct_hcg[i]},
                "discount":     {"lcg":round(disc_l,4),"mcg":round(disc_m,4),"hcg":round(disc_h,4),"overall":round(disc_l+disc_m+disc_h,4)},
                "gst":          {"lcg":round(gst_l,4),"mcg":round(gst_m,4),"hcg":round(gst_h,4),"overall":round(gst_l+gst_m+gst_h,4)},
                "net_amc":      {"lcg":round(net_amc_l,4),"mcg":round(net_amc_m,4),"hcg":round(net_amc_h,4),"overall":round(net_amc_l+net_amc_m+net_amc_h,4)},
                "ghs_discount": {"lcg":round(ghs_l,4),"mcg":round(ghs_m,4),"hcg":round(ghs_h,4),"overall":round(ghs_l+ghs_m+ghs_h,4)},
                "stone":        round(stone,4),
                "nsv":          {"lcg":round(nsv_l,4),"mcg":round(nsv_m,4),"hcg":round(nsv_h,4),"overall":round(nsv_l+nsv_m+nsv_h,4)},
            },
            "bands": {"lcg":bl,"mcg":bm,"hcg":bh},
            "tot_summary": {
                "tot":         {"lcg":round(tl,4),"mcg":round(tm,4),"hcg":round(th,4),"total":round(tt,4)},
                "nsv":         {"lcg":round(nsv_l,4),"mcg":round(nsv_m,4),"hcg":round(nsv_h,4),"total":round(nsv_l+nsv_m+nsv_h,4)},
                "tot_nsv_pct": {"lcg":round(_safe_div(tl,nsv_l)*100,2),"mcg":round(_safe_div(tm,nsv_m)*100,2),"hcg":round(_safe_div(th,nsv_h)*100,2),"total":round(_safe_div(tt,nsv_l+nsv_m+nsv_h)*100,2)},
                "ghs_impact":  {"lcg":round(gil,4),"mcg":round(gim,4),"hcg":round(gih,4),"total":round(gil+gim+gih,4)},
                "net_tot":     {"lcg":round(tl-gil,4),"mcg":round(tm-gim,4),"hcg":round(th-gih,4),"total":round(tt-gil-gim-gih,4)},
            },
        }

    # ── 5. Studded TOT helper (per year) ────────────────────────────────────
    _STUD_CATS = ("gis","regular","color_stones","solitaire_a","solitaire_b","solitaire_c","solitaire_d")

    def _studded_year_tot(i: int) -> dict:
        ucp_vals = {
            "gis":ucp_gis[i],"regular":ucp_reg[i],"color_stones":ucp_cs_[i],
            "solitaire_a":ucp_sa_[i],"solitaire_b":ucp_sb_[i],
            "solitaire_c":ucp_sc_[i],"solitaire_d":ucp_sd_[i],
        }
        disc_vals = {
            "gis":disc_gis[i],"regular":disc_reg[i],"color_stones":disc_cs[i],
            "solitaire_a":disc_sa[i],"solitaire_b":disc_sb[i],
            "solitaire_c":disc_sc[i],"solitaire_d":disc_sd[i],
        }
        ghs_f   = ghs_studded_pct[i]/100.0
        ucp_tot = sum(ucp_vals.values())

        tax      = {k: round(v*_GST_RATE_GOLD,4)              for k,v in ucp_vals.items()}
        disc     = {k: round(disc_vals[k],4)                  for k in _STUD_CATS}
        disc_pct = {k: round(_safe_div(disc[k],ucp_vals[k])*100,2) for k in _STUD_CATS}
        nsv      = {k: round(ucp_vals[k]-tax[k]-disc[k],4)   for k in _STUD_CATS}
        nsv_tot  = sum(nsv.values())

        def _sbands():
            rows, rem = [], nsv_tot
            for band in _STUDDED_TOT_BANDS:
                bw    = band["upper"]-band["lower"]
                b_nsv = min(bw,max(0.0,rem)) if band["upper"]<1e14 else max(0.0,rem)
                ratio = _safe_div(b_nsv, nsv_tot)
                row   = {"band":f"{band['lower']}-{int(min(band['upper'],50))}","nsv_total":round(b_nsv,4)}
                tot_band = 0.0
                for cat in _STUD_CATS:
                    c_nsv = nsv.get(cat,0.0)*ratio
                    c_tot = c_nsv*band[cat]
                    row[f"{cat}_nsv"] = round(c_nsv,4)
                    row[f"{cat}_tot"] = round(c_tot,4)
                    tot_band += c_tot
                row["total_tot"] = round(tot_band,4)
                rows.append(row)
                rem -= b_nsv
                if rem<=0.0: break
            return rows

        bands   = _sbands()
        tot_by  = {cat: round(sum(b[f"{cat}_tot"] for b in bands),4) for cat in _STUD_CATS}
        tot_tot = round(sum(tot_by.values()),4)
        ghs_imp = {k: round(tot_by[k]*ghs_f,4) for k in _STUD_CATS}
        net_tot = {k: round(tot_by[k]-ghs_imp[k],4) for k in _STUD_CATS}
        tot_ucp = {k: round(_safe_div(tot_by[k],ucp_vals[k])*100,2) for k in _STUD_CATS}

        def _m(d, total_val): return {**d, "total": total_val}

        return {
            "summary": {
                "ucp":          _m({k:round(v,4) for k,v in ucp_vals.items()}, round(ucp_tot,4)),
                "share_pct":    {"gis":gis_mix[i],"regular":reg_mix[i],"color_stones":cs_mix[i],"solitaire_a":sa_mix[i],"solitaire_b":sb_mix[i],"solitaire_c":sc_mix[i],"solitaire_d":sd_mix[i]},
                "tax":          _m(tax,  round(sum(tax.values()),4)),
                "discount":     _m(disc, round(sum(disc.values()),4)),
                "discount_pct": disc_pct,
                "nsv":          _m(nsv,  round(nsv_tot,4)),
            },
            "bands": bands,
            "tot_summary": {
                "tot":         _m(tot_by,  tot_tot),
                "nsv":         _m(nsv,     round(nsv_tot,4)),
                "tot_ucp_pct": _m(tot_ucp, round(_safe_div(tot_tot,ucp_tot)*100,2)),
                "ghs_impact":  _m(ghs_imp, round(sum(ghs_imp.values()),4)),
                "net_tot":     _m(net_tot, round(sum(net_tot.values()),4)),
            },
        }

    # ── 6. Build all-years result (Y1–Y6) ──────────────────────────────────
    yearly_tot = [
        {"year": i+1, "plain": _plain_year_tot(i), "studded": _studded_year_tot(i)}
        for i in range(6)
    ]

    return {
        "roiid":              roiid,
        "ucp_sales":          {"lcg":ucp_lcg,"mcg":ucp_mcg,"hcg":ucp_hcg,"coins":ucp_coins},
        "ucp_sales_studded":  {"gis":ucp_gis,"regular":ucp_reg,"color_stones":ucp_cs_,"solitaire_a":ucp_sa_,"solitaire_b":ucp_sb_,"solitaire_c":ucp_sc_,"solitaire_d":ucp_sd_},
        "btq_rate":           btq_rate_yr,
        "amc_per_gm":         {"lcg":amc_gm_lcg,"mcg":amc_gm_mcg,"hcg":amc_gm_hcg,"coins":amc_gm_coins},
        "gold_amc_mu_per_gm":{"lcg":eff_lcg,"mcg":eff_mcg,"hcg":eff_hcg,"coins":eff_coins},
        "grammage":           {"lcg":gram_lcg,"mcg":gram_mcg,"hcg":gram_hcg,"coins":gram_coins},
        "amc_lakhs":          {"lcg":amcl_lcg,"mcg":amcl_mcg,"hcg":amcl_hcg,"coins":amcl_coins},
        "amc_crs":            {"lcg":amcc_lcg,"mcg":amcc_mcg,"hcg":amcc_hcg,"coins":amcc_coins},
        "yearly_tot":         yearly_tot,
    }


def _compute_and_save_tot(roiid: str, store_format: str, db: Session) -> dict:
    """
    Compute full TOT (Plain + Studded + Coins) for all 6 years, persist each
    section via its dedicated stored procedure, and return a metadata summary
    for the UI.

    Called automatically from POST /expense_planning_page3 after a successful
    commit.  Can also be re-triggered via GET /tot_calculation/{roiid}.
    """
    # ── Compute all TOT data ──────────────────────────────────────────────────
    result  = _compute_tot(roiid, db)
    yr_tot  = result["yearly_tot"]

    # Extra page-4 data needed for Coins TOT
    p4            = _sp_first_row(db, "view_sales_planning_discount", roiid)
    disc_coins    = _parse_csv_floats(p4.get("tcd_coins"))    if p4 else [0.0] * 6
    ghs_plain_pct = _parse_csv_floats(p4.get("tghsd_plain"))  if p4 else [0.0] * 6

    # ── Local helpers ─────────────────────────────────────────────────────────
    def _ac(arr) -> str:
        return ",".join("" if v is None else str(v) for v in arr)

    saved: list = []
    failed: list = []

    def _call(proc: str, params: dict):
        try:
            ph = ", ".join(f":{k}" for k in params)
            db.execute(text(f"CALL {proc}({ph})"), params)
            saved.append(proc)
        except Exception as exc:
            err = str(exc)
            # SP-level bug (e.g. unquoted 'Header' identifier) — must be fixed in MySQL
            if "Unknown column 'Header'" in err:
                _logger.warning("Skipping %s — DB stored procedure has an unquoted 'Header' identifier bug. Fix the SP.", proc)
            else:
                _logger.error("TOT SP %s failed for ROI %s: %s", proc, roiid, exc)
            failed.append({"proc": proc, "error": err})

    # Flatten: cat_Y1..Y6 for each cat in order
    def _flat_plain(field: str, cats: tuple) -> str:
        return _ac(
            v
            for cat in cats
            for yr in yr_tot
            for v in [yr["plain"]["summary"][field].get(cat)]
        )

    def _flat_plain_tot(field: str, cats: tuple) -> str:
        return _ac(
            v
            for cat in cats
            for yr in yr_tot
            for v in [yr["plain"]["tot_summary"][field].get(cat)]
        )

    def _flat_stud(field: str, cats: tuple) -> str:
        return _ac(
            v
            for cat in cats
            for yr in yr_tot
            for v in [yr["studded"]["summary"][field].get(cat)]
        )

    def _flat_stud_tot(field: str, cats: tuple) -> str:
        return _ac(
            v
            for cat in cats
            for yr in yr_tot
            for v in [yr["studded"]["tot_summary"][field].get(cat)]
        )

    def _plain_band(band_label: str) -> str:
        """[nsv_Y1..6, tot_lcg_Y1..6, tot_mcg_Y1..6, tot_hcg_Y1..6, tot_total_Y1..6]"""
        nsv, tl, tm, th, tt = [], [], [], [], []
        for yr in yr_tot:
            bands = yr["plain"]["bands"]
            bl = next((b for b in bands["lcg"] if b["band"] == band_label), {})
            bm = next((b for b in bands["mcg"] if b["band"] == band_label), {})
            bh = next((b for b in bands["hcg"] if b["band"] == band_label), {})
            nsv.append(bl.get("nsv", 0));  tl.append(bl.get("tot", 0))
            tm.append(bm.get("tot", 0));   th.append(bh.get("tot", 0))
            tt.append(round(bl.get("tot", 0) + bm.get("tot", 0) + bh.get("tot", 0), 4))
        return _ac(nsv + tl + tm + th + tt)

    def _plain_net_amc_band(band_label: str) -> str:
        """[nsv_Y1..6, amc_lcg_Y1..6, amc_mcg_Y1..6, amc_hcg_Y1..6, amc_total_Y1..6]"""
        nsv, al, am, ah = [], [], [], []
        for yr in yr_tot:
            bands = yr["plain"]["bands"]
            bl = next((b for b in bands["lcg"] if b["band"] == band_label), {})
            bm = next((b for b in bands["mcg"] if b["band"] == band_label), {})
            bh = next((b for b in bands["hcg"] if b["band"] == band_label), {})
            nsv.append(bl.get("nsv", 0))
            al.append(bl.get("amc", 0)); am.append(bm.get("amc", 0)); ah.append(bh.get("amc", 0))
        at = [round(al[i] + am[i] + ah[i], 4) for i in range(6)]
        return _ac(nsv + al + am + ah + at)

    STUD_CATS = ("gis", "regular", "color_stones", "solitaire_a", "solitaire_b", "solitaire_c", "solitaire_d")
    STUD_8    = STUD_CATS + ("total",)

    def _stud_band(band_label: str) -> str:
        """[nsv_total_Y1..6, gis_nsv_Y1..6…sd_nsv_Y1..6, gis_tot_Y1..6…sd_tot_Y1..6, band_total_Y1..6]"""
        nsv_t = []; cat_nsv = {c: [] for c in STUD_CATS}; cat_tot = {c: [] for c in STUD_CATS}; tot_t = []
        for yr in yr_tot:
            b = next((x for x in yr["studded"]["bands"] if x["band"] == band_label), {})
            nsv_t.append(b.get("nsv_total", 0))
            for c in STUD_CATS:
                cat_nsv[c].append(b.get(f"{c}_nsv", 0))
                cat_tot[c].append(b.get(f"{c}_tot", 0))
            tot_t.append(b.get("total_tot", 0))
        flat = nsv_t[:]
        for c in STUD_CATS: flat += cat_nsv[c]
        for c in STUD_CATS: flat += cat_tot[c]
        return _ac(flat + tot_t)

    def _stud_final_band(band_label: str) -> str:
        """[gis_tot_Y1..6, …, sd_tot_Y1..6, total_Y1..6]  (8 × 6 = 48 values)"""
        cat_tot = {c: [] for c in STUD_CATS}; tot_t = []
        for yr in yr_tot:
            b = next((x for x in yr["studded"]["bands"] if x["band"] == band_label), {})
            for c in STUD_CATS: cat_tot[c].append(b.get(f"{c}_tot", 0))
            tot_t.append(b.get("total_tot", 0))
        flat = []
        for c in STUD_CATS: flat += cat_tot[c]
        return _ac(flat + tot_t)

    # ── Coins TOT ─────────────────────────────────────────────────────────────
    ucp_c     = result["ucp_sales"]["coins"]
    amc_lkh_c = result["amc_lakhs"]["coins"]
    gst_c     = [round(v * _GST_RATE_GOLD, 4) for v in ucp_c]
    disc_c    = disc_coins
    disc_pct_c= [round(_safe_div(disc_c[i], ucp_c[i]) * 100, 2) for i in range(6)]
    ghs_f_c   = [ghs_plain_pct[i] / 100.0 for i in range(6)]
    ghs_c     = [round(ucp_c[i] * ghs_f_c[i], 4) for i in range(6)]
    ghs_pct_c = [round(ghs_f_c[i] * 100, 2) for i in range(6)]
    net_amc_c = [round(amc_lkh_c[i] * (1.0 - _GST_RATE_GOLD - _safe_div(disc_c[i], ucp_c[i])), 4) for i in range(6)]
    nsv_c     = [round(ucp_c[i] - gst_c[i] - disc_c[i] - ghs_c[i], 4) for i in range(6)]
    tot_c     = amc_lkh_c
    tot_pct_c = [round(_safe_div(result["amc_per_gm"]["coins"][i], result["btq_rate"][i]) * 100, 2) for i in range(6)]
    tot_nsv_c = [round(_safe_div(tot_c[i], nsv_c[i]) * 100, 2) for i in range(6)]
    ghs_imp_c = [round(tot_c[i] * ghs_f_c[i], 4) for i in range(6)]
    net_tot_c = [round(tot_c[i] - ghs_imp_c[i], 4) for i in range(6)]

    # ── Save to DB (one SP per section) ──────────────────────────────────────
    P4C = ("lcg", "mcg", "hcg", "overall")
    P4T = ("lcg", "mcg", "hcg", "total")
    P3C = ("lcg", "mcg", "hcg")

    # 1 — Plain UCP Sales
    _call("get_roi_plain_tot_ucp_sales", {
        "p_roiid": roiid, "p_store_format": store_format,
        "p_ucp_sales_LCG":    _ac(result["ucp_sales"]["lcg"]),
        "p_ucp_sales_MCG":    _ac(result["ucp_sales"]["mcg"]),
        "p_ucp_sales_HCG":    _ac(result["ucp_sales"]["hcg"]),
        "p_ucp_sales_coins":  _ac(result["ucp_sales"]["coins"]),
        "p_ucp_sales_btqrate":_ac(result["btq_rate"]),
        "p_status": "Pending",
    })

    # 2 — Plain AMC per gram
    _call("get_roi_plain_tot_amcgm", {
        "p_roiid": roiid, "p_store_format": store_format,
        "p_amc_gm_LCG":   _ac(result["amc_per_gm"]["lcg"]),
        "p_amc_gm_MCG":   _ac(result["amc_per_gm"]["mcg"]),
        "p_amc_gm_HCG":   _ac(result["amc_per_gm"]["hcg"]),
        "p_amc_gm_Coins": _ac(result["amc_per_gm"]["coins"]),
        "p_status": "Pending",
    })

    # 3 — Gold Rate + AMC + MU per gram
    _call("get_roi_plain_tot_gr_amc_mu", {
        "p_roiid": roiid, "p_store_format": store_format,
        "p_goldrate_amc_mu_LCG":   _ac(result["gold_amc_mu_per_gm"]["lcg"]),
        "p_goldrate_amc_mu_MCG":   _ac(result["gold_amc_mu_per_gm"]["mcg"]),
        "p_goldrate_amc_mu_HCG":   _ac(result["gold_amc_mu_per_gm"]["hcg"]),
        "p_goldrate_amc_mu_Coins": _ac(result["gold_amc_mu_per_gm"]["coins"]),
        "p_status": "Pending",
    })

    # 4 — Grammage
    _call("get_roi_plain_tot_grammage", {
        "p_roiid": roiid, "p_store_format": store_format,
        "p_grammage_LCG":   _ac(result["grammage"]["lcg"]),
        "p_grammage_MCG":   _ac(result["grammage"]["mcg"]),
        "p_grammage_HCG":   _ac(result["grammage"]["hcg"]),
        "p_grammage_Coins": _ac(result["grammage"]["coins"]),
        "p_status": "Pending",
    })

    # 5 — AMC in lakhs
    _call("get_roi_plain_tot_amclakhs", {
        "p_roiid": roiid, "p_store_format": store_format,
        "p_amc_lakh_LCG":   _ac(result["amc_lakhs"]["lcg"]),
        "p_amc_lakh_MCG":   _ac(result["amc_lakhs"]["mcg"]),
        "p_amc_lakh_HCG":   _ac(result["amc_lakhs"]["hcg"]),
        "p_amc_lakh_Coins": _ac(result["amc_lakhs"]["coins"]),
        "p_status": "Pending",
    })

    # 6 — Plain yearwise summary (4 cats × 6 years = 24 values per field)
    _call("get_roi_plain_tot_yearwise_data", {
        "p_roiid": roiid, "p_store_format": store_format,
        "p_ucp":          _flat_plain("ucp",          P4C),
        "p_ucp_mix":      _flat_plain("ucp_mix_pct",  P3C),
        "p_amc":          _flat_plain("amc",          P4C),
        "p_amc_pct":      _flat_plain("amc_pct",      P3C),
        "p_discount":     _flat_plain("discount",     P4C),
        "p_gst":          _flat_plain("gst",          P4C),
        "p_net_amc":      _flat_plain("net_amc",      P4C),
        "p_ghs_discount": _flat_plain("ghs_discount", P4C),
        "p_stone":        _ac([yr["plain"]["summary"]["stone"] for yr in yr_tot]),
        "p_nsv":          _flat_plain("nsv",          P4C),
        "p_status": "Pending",
    })

    # 7 — Coins TOT
    _call("get_roi_coins_tot", {
        "p_roiid": roiid, "p_store_format": store_format,
        "p_ucp_sales":    _ac(ucp_c),    "p_amc":         _ac(amc_lkh_c),
        "p_gst":          _ac(gst_c),    "p_discount":    _ac(disc_c),
        "p_discount_pct": _ac(disc_pct_c),"p_ghs":        _ac(ghs_c),
        "p_ghs_pct":      _ac(ghs_pct_c),"p_net_amc":    _ac(net_amc_c),
        "p_nsv":          _ac(nsv_c),    "p_tot_pct":     _ac(tot_pct_c),
        "p_tot":          _ac(tot_c),    "p_tot_nsv_pct": _ac(tot_nsv_c),
        "p_ghs_impact":   _ac(ghs_imp_c),"p_net_tot":    _ac(net_tot_c),
        "p_status": "Pending",
    })

    # 8 — Plain pre-summary (NSV band totals per year); SP errors on all-zero input
    _p0_20 = _plain_band("0-20")
    if any(float(v) != 0.0 for v in _p0_20.split(",") if v):
        _call("get_roi_plain_tot_presummary", {
            "p_roiid": roiid, "p_store_format": store_format,
            "p_0_20":     _p0_20,                  "p_20_40":    _plain_band("20-40"),
            "p_40_60":    _plain_band("40-60"),     "p_60_80":    _plain_band("60-80"),
            "p_80_100":   _plain_band("80-100"),    "p_100_plus": _plain_band("100-100"),
            "p_status": "Pending",
        })

    # 9 — Plain TOT final (4 cats × 6 years = 24 values per field)
    _call("get_roi_plain_tot_Final", {
        "p_roiid": roiid, "p_store_format": store_format,
        "p_tot":         _flat_plain_tot("tot",         P4T),
        "p_nsv":         _flat_plain_tot("nsv",         P4T),
        "p_tot_nsv_pct": _flat_plain_tot("tot_nsv_pct", P4T),
        "p_ghs":         _flat_plain_tot("ghs_impact",  P4T),
        "p_ghs_impact":  _flat_plain_tot("ghs_impact",  P4T),
        "p_net_tot":     _flat_plain_tot("net_tot",     P4T),
        "p_status": "Pending",
    })

    # 10 — Plain Net AMC band-level AMC distribution
    _call("get_roi_plain_net_amc", {
        "p_roiid": roiid, "p_store_format": store_format,
        "p_lower_0_upper_20":       _plain_net_amc_band("0-20"),
        "p_lower_20_upper_40":      _plain_net_amc_band("20-40"),
        "p_lower_40_upper_60":      _plain_net_amc_band("40-60"),
        "p_lower_60_upper_80":      _plain_net_amc_band("60-80"),
        "p_lower_80_upper_100":     _plain_net_amc_band("80-100"),
        "p_lower_100_upper_100000": _plain_net_amc_band("100-100"),
        "p_status": "Pending",
    })

    # 11 — Studded yearwise summary (8 cats × 6 years = 48 values per field)
    _call("get_roi_studded_tot_yearwise_data", {
        "p_roiid": roiid, "p_store_format": store_format,
        "p_ucp":          _flat_stud("ucp",      STUD_8),
        "p_share_pct":    _ac(yr["studded"]["summary"]["share_pct"].get(c, 0) for c in STUD_CATS for yr in yr_tot),
        "p_tax":          _flat_stud("tax",      STUD_8),
        "p_discount":     _flat_stud("discount", STUD_8),
        "p_discount_pct": _ac(yr["studded"]["summary"]["discount_pct"].get(c, 0) for c in STUD_CATS for yr in yr_tot),
        "p_nsv":          _flat_stud("nsv",      STUD_8),
        "p_status": "Pending",
    })

    # 12 — Studded slab-wise band data
    _call("get_roi_studded_tot_slabwise_data", {
        "p_roiid": roiid, "p_store_format": store_format,
        "p_lower_0_upper_10":      _stud_band("0-10"),  "p_lower_10_upper_20":     _stud_band("10-20"),
        "p_lower_20_upper_50":     _stud_band("20-50"), "p_lower_50_upper_200000": _stud_band("50-50"),
        "p_status": "Pending",
    })

    # 13 — Studded TOT final
    _call("get_roi_studded_tot_final", {
        "p_roiid": roiid, "p_store_format": store_format,
        "p_lower_0_upper_10":      _stud_final_band("0-10"),  "p_lower_10_upper_20":     _stud_final_band("10-20"),
        "p_lower_20_upper_50":     _stud_final_band("20-50"), "p_lower_50_upper_200000": _stud_final_band("50-50"),
        "p_tot":     _flat_stud_tot("tot",         STUD_8),
        "p_ucp":     _flat_stud("ucp",             STUD_8),
        "p_tot_pct": _flat_stud_tot("tot_ucp_pct", STUD_8),
        "p_status": "Pending",
    })

    db.commit()
    _logger.info("TOT saved (%d procedures, %d failed) for ROI: %s", len(saved), len(failed), roiid)

    # ── Metadata summary returned to UI ──────────────────────────────────────
    return {
        "roiid":              roiid,
        "store_format":       store_format,
        "saved_procedures":   saved,
        "failed_procedures":  failed,
        "plain_tot_summary": [
            {
                "year":    yr["year"],
                "tot":     yr["plain"]["tot_summary"]["tot"],
                "nsv":     yr["plain"]["tot_summary"]["nsv"],
                "net_tot": yr["plain"]["tot_summary"]["net_tot"],
            }
            for yr in yr_tot
        ],
        "studded_tot_summary": [
            {
                "year":    yr["year"],
                "tot":     yr["studded"]["tot_summary"]["tot"],
                "nsv":     yr["studded"]["tot_summary"]["nsv"],
                "net_tot": yr["studded"]["tot_summary"]["net_tot"],
            }
            for yr in yr_tot
        ],
        "coins_tot_summary": [
            {"year": i+1, "ucp": ucp_c[i], "nsv": nsv_c[i], "tot": tot_c[i], "net_tot": net_tot_c[i]}
            for i in range(6)
        ],
    }


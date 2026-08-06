from pydantic import BaseModel
from typing import Optional,Dict,List,Any

class StockTurnGuidelineModel(BaseModel):
    cluster:str
    sales:str
    region:str

# Screen 1
class BasicStorePayload(BaseModel):
    username:str
    projectType: Optional[str] = ''
    historyId: Optional[str] = ''
    existingStoreCode: Optional[str] = ''
    city: Optional[str] = ''
    state: Optional[str] = ''
    region: Optional[str] = ''
    newCity: Optional[str] = ''
    existingStoreFormat: Optional[str] = ''
    storeFormatChange: Optional[str] = ''
    newStoreFormat: Optional[str] = ''
    newFranchise: Optional[str] = ''
    newFranchiseeStoreName: Optional[str] = ''
    newFranchiseeStoreCode: Optional[str] = ''
    franchiseeStoreCode: Optional[str] = ''
    franchiseeStoreName: Optional[str] = ''
    baiatScore: Optional[str] = ''
    partnerDbStatus: Optional[str] = ''
    partnerScore: Optional[str] = ''
    retailArea: Optional[str] = ''
    storeType: Optional[str] = ''

# Screen 2
class StoreRetailSpecPayload(BaseModel):
    roiId: Optional[str] = ''
    username:str
    tyHistoryId: Optional[str] = ''
    storeType: Optional[str] = ''
    existingOverallArea: Optional[str] = ''
    existingRetailArea: Optional[str] = ''
    newOverallArea: Optional[str] = ''
    newRetailArea: Optional[str] = ''
    noOfFloors: Optional[str] = ''
    floorPlate: Optional[dict] = ''
    frontage: Optional[str] = ''
    ceilingHeight: Optional[str] = ''
    facadeLed: Optional[str] = ''
    terraceBranding: Optional[str] = ''
    totemPole: Optional[str] = ''
    displayType: Optional[str] = ''
    flooringType: Optional[str] = ''
    retailFloors: Optional[list] = ''
    cashierCount: Optional[str] = ''
    karatmeterCount: Optional[str] = ''
    strongRoom: Optional[str] = ''
    franchiseRoom: Optional[str] = ''
    managerRoom: Optional[str] = ''
    conferenceRoom: Optional[str] = ''
    pvrRoom: Optional[str] = ''
    additionalWorkstation: Optional[str] = ''
    regionalServiceCentre: Optional[str] = ''
    remarks: Optional[str] = ''

# Screen 3 - Subpage 1
class Expense(BaseModel):
    monthly: Optional[float] = None
    annual: Optional[float] = None
class Totals(BaseModel):
    totalMonthly: float
    totalAnnual: float
class SalesPlanningPage1Model(BaseModel):
    roiid: str
    username:str
    ref_storecode: str
    storeParticulars: Dict[str, Optional[float]]
    expenses: Dict[str, Expense]
    totals: Totals


# Screen 3 - Subpage 2
class SalesMix(BaseModel):
    plainShare: List[float]
    studdedShare: List[float]
    coinsShare: List[float]

class PlainMix(BaseModel):
    lcg: List[float]
    mcg: List[float]
    hcg: List[float]
    stoneShareHCG: List[float]

class StuddedMix(BaseModel):
    gis: List[float]
    regular: List[float]
    colorStones: List[float]
    solitaireA: List[float]
    solitaireB: List[float]
    solitaireC: List[float]
    solitaireD: List[float]

class SalesPlanningInputs(BaseModel):
    totalAreaSBA: float
    totalAreaCarpet: float
    walkInPerDayYr1: float
    avgTicketSizeYr1: float
    increaseWalkIns: List[float]
    conversionPct: List[float]
    growthTicketSize: List[float]
    storeDays: float
    salesMix: SalesMix
    plainMix: PlainMix
    studdedMix: StuddedMix

class SalesPlanningComputed(BaseModel):
    walkInPerDay: List[float]
    buyersPerDay: List[float]
    avgTicketSize: List[float]
    totalSales: List[float]
    salesGrowthPct: List[str]

class SalesPlanningPage2Model(BaseModel):
    roiid: str
    username:str
    inputs: SalesPlanningInputs
    computed: SalesPlanningComputed

# Screen 3 - Subpage 3

class PlainAMC(BaseModel):
    lcg: List[float]
    mcg: List[float]
    hcg: List[float]

class StockPlanningInputs(BaseModel):
    baseRate22K: List[float]
    markupPct: List[float]
    plainAMC: PlainAMC
    coinsAMC: List[float]
    stockTurnPlain: List[float]
    stockTurnStudded: List[float]
    stockTurnCoins: List[float]

class StockPlanningComputed(BaseModel):
    stockPlain: List[float]
    stockStudded: List[float]
    stockCoins: List[float]
    totalStock: List[float]

    bgPlainStockTurn: List[float]
    bgStuddedStockTurn: List[float]
    bgCoinsStockTurn: List[float]
    bgTotalStockTurn: List[float]

    totalStockTurn: List[float]

class SalesPlanningPage3Model(BaseModel):
    roiid: str
    username:str
    inputs: StockPlanningInputs
    computed: StockPlanningComputed

# Screen 3 - Subpage 4
class TCDPlain(BaseModel):
    lcg: List[float]
    mcg: List[float]
    hcg: List[float]


class TCDStudded(BaseModel):
    gis: List[float]
    regular: List[float]
    colorStones: List[float]
    solitaireA: List[float]
    solitaireB: List[float]
    solitaireC: List[float]
    solitaireD: List[float]


class TotalCustomerDiscount(BaseModel):
    plain: TCDPlain
    studded: TCDStudded
    coins: List[float]
    total: List[float]
    pctOfUCP: List[float]


class TotalGHSDiscount(BaseModel):
    plain: List[float]
    studded: List[float]
    coins: List[float]
    total: List[float]
    pctOfUCP: List[float]


class SalesPlanningDiscountModel(BaseModel):
    roiid: str
    username:str
    totalCustomerDiscount: TotalCustomerDiscount
    totalGHSDiscount: TotalGHSDiscount

class ViewSalesPlanningModel(BaseModel):
    roiid:str
    screen:int

# Screen 4 - Subpage 1
class CapexRequest(BaseModel):
    storeData: Dict[str, Any]
    selections: Dict[str, str]
    computedAmounts: Dict[str, float]
    interiors: float
    itEquipment: float
    additionalCapex: float
    totalCapex: float
    ratePerSqft: float

# Screen 4 - Subpage 2
class ResourceExpenseRequest(BaseModel):
    roiid: str
    salaries: Dict[str, Any]
    securityHousekeeping: Dict[str, Any]
    electricity: Dict[str, Any]
    otherExpenses: Dict[str, Any]

# Screen 4 - Subpage 3
class RentInput(BaseModel):
    revenueSharing: str
    sba: List[float]
    ratePerSqft: List[float]
    revSharePct: List[float]
    minGuaranteeMth: List[float]
    annualRent: List[float]
    monthlyRent: List[float]
    securityDeposit: float

class ExpenseRowInput(BaseModel):
    label: str
    basis: str
    escalation: str
    values: List[float]

class ExpenseSummaryData(BaseModel):
    rows: List[ExpenseRowInput]
    total: List[float]

class ExpenseSummaryRequest(BaseModel):
    roiid: str
    store_format: Optional[str] = ""
    rent: RentInput
    expenseSummary: ExpenseSummaryData
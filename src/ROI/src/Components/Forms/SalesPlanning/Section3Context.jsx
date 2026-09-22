import { createContext, useContext } from "react";

/**
 * Shared context for the Section 3 (Sales Planning) multi-step form.
 *
 * Shape:
 *   storeParticulars  – object fetched from the reference store code
 *   isFetched         – whether a store has been loaded
 *   savedSteps        – boolean[4] — true once each subpage is saved
 *   markStepSaved(i)  – call from a subpage to mark its step complete
 *   invalidateStepsFrom(i) – call when an earlier step is re-saved with
 *                       changed data, to force steps >= i back to "not saved"
 *   salesSummaryVersion / bumpSalesSummaryVersion() – bumped every time
 *                       Subpage3_2 (Sales Summary) is saved; downstream steps
 *                       compare against the version they were last saved at
 *                       to detect stale (needs re-save) data.
 *   phase1SavedAtVersion / markPhase1SavedVersion() – the salesSummaryVersion
 *                       Subpage3_3 Phase 1 (Pricing Metrics/TOT trigger) was
 *                       last saved against.
 *   discountSavedAtVersion / markDiscountSavedVersion() – the
 *                       salesSummaryVersion Subpage3_4 (Discounts) was last
 *                       saved against.
 */
export const Section3Context = createContext(null);

export function useSection3Context() {
    const ctx = useContext(Section3Context);
    if (!ctx) throw new Error("useSection3Context must be used inside Section3");
    return ctx;
}

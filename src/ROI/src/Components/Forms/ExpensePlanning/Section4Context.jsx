import { createContext, useContext } from "react";

/**
 * Shared context for the Section 4 (Expense Planning) multi-step form.
 *
 * Shape:
 *   storeData         – object with store details from Screen 2 (flooring type, store type, carpet area, etc.)
 *   savedSteps        – boolean[3] — true once each subpage is saved
 *   markStepSaved(i)  – call from a subpage to mark its step complete
 *   subpage4_1Data    – data saved from Subpage 4_1 (Capex)
 *   subpage4_2Data    – data saved from Subpage 4_2 (Salaries & Expenses)
 *   setSubpage4_1Data – setter for subpage4_1Data
 *   setSubpage4_2Data – setter for subpage4_2Data
 */
export const Section4Context = createContext(null);

export function useSection4Context() {
    const ctx = useContext(Section4Context);
    if (!ctx) throw new Error("useSection4Context must be used inside Section4");
    return ctx;
}

import { createContext, useContext } from "react";

/**
 * Shared context for the Section 3 (Sales Planning) multi-step form.
 *
 * Shape:
 *   storeParticulars  – object fetched from the reference store code
 *   isFetched         – whether a store has been loaded
 *   savedSteps        – boolean[4] — true once each subpage is saved
 *   markStepSaved(i)  – call from a subpage to mark its step complete
 */
export const Section3Context = createContext(null);

export function useSection3Context() {
    const ctx = useContext(Section3Context);
    if (!ctx) throw new Error("useSection3Context must be used inside Section3");
    return ctx;
}

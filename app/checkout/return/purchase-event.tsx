"use client";
import { useEffect } from "react";
import { track, trackCustom } from "@/lib/tracking";
import { CONFIG } from "@/lib/products";

export function PurchaseEvent({ orderRef, value }: { orderRef: string; value: number }) {
  useEffect(() => {
    try { localStorage.removeItem("hoor_ddl_cart_v2"); } catch {}
    const key = `purchase:${orderRef}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    track("purchase", { transaction_id: orderRef, value, currency: CONFIG.currency }, { eventID: orderRef });
  }, [orderRef, value]);
  return null;
}

/** Fires on the failed-payment state: the retargeting audience of people who
 *  tried to pay and were stopped by the gateway. Custom event, so it never
 *  pollutes Purchase reporting. */
export function FailedPurchaseEvent({ orderRef, value }: { orderRef: string; value: number }) {
  useEffect(() => {
    const key = `failed:${orderRef}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    trackCustom("FailedPurchase", { transaction_id: orderRef, value, currency: CONFIG.currency }, { eventID: `failed:${orderRef}` });
  }, [orderRef, value]);
  return null;
}

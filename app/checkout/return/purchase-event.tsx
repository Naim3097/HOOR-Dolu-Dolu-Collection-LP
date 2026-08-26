"use client";
import { useEffect } from "react";
import { track } from "@/lib/tracking";
import { CONFIG } from "@/lib/products";

export function PurchaseEvent({ orderRef, value }: { orderRef: string; value: number }) {
  useEffect(() => {
    const key = `purchase:${orderRef}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    track("purchase", { transaction_id: orderRef, value, currency: CONFIG.currency });
  }, [orderRef, value]);
  return null;
}

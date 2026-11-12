import type { RSA } from "otb-toolkit/src/types";
import type { Bill, BillItem, DeletedBill } from "@/types/bill";

export const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function createEmptyBill(name = "未命名账单"): Bill {
  const now = new Date().toISOString();
  return {
    id: createId("bill"),
    name,
    totalAmount: "",
    items: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createEmptyBillItem(): BillItem {
  return {
    id: createId("item"),
    name: "",
    price: "",
  };
}

export function sumBillItems(items: BillItem[]) {
  return items.reduce((total, item) => total + Number(item.price || 0), 0);
}

export function formatMoney(value: number) {
  return Number(value || 0).toFixed(2);
}

export function getBillUpdatedTime(bill: Bill) {
  const updatedTime = Date.parse(bill.updatedAt);
  if (Number.isFinite(updatedTime)) return updatedTime;
  const createdTime = Date.parse(bill.createdAt);
  return Number.isFinite(createdTime) ? createdTime : 0;
}

export function mergeLatest<T>(
  current: T[],
  imported: T[],
  getKey: (entry: T) => string,
  getTime: (entry: T) => number,
): T[] {
  const latest = new Map<string, T>();
  for (const entry of [...current, ...imported]) {
    const key = getKey(entry);
    const previous = latest.get(key);
    if (previous === undefined || getTime(entry) > getTime(previous)) {
      latest.set(key, entry);
    }
  }
  return [...latest.values()];
}

export function normalizeBills(list: RSA[] | undefined, fallbackDate = new Date().toISOString()): Bill[] {
  const source = Array.isArray(list) ? list : [];
  return source.map((item): Bill => {
    const createdAt = String(item.createdAt || fallbackDate);
    return {
      id: String(item.id || createId("bill")),
      name: String(item.name || "未命名账单"),
      totalAmount: normalizePrice(item.totalAmount),
      createdAt,
      updatedAt: String(item.updatedAt || createdAt),
      items: Array.isArray(item.items)
        ? item.items.map((child: RSA): BillItem => ({
          id: String(child.id || createId("item")),
          name: String(child.name || ""),
          price: normalizePrice(child.price),
        }))
        : [],
    };
  }).filter((item) => item.name);
}

export function normalizeDeletedBills(list: RSA[] | undefined): DeletedBill[] {
  const source = Array.isArray(list) ? list : [];
  return normalizeBills(source).map((item, index) => ({
    ...item,
    deletedAt: String(source[index]?.deletedAt || new Date().toISOString()),
  }));
}

function normalizePrice(value: unknown): number | "" {
  if (value === "" || value === null || value === undefined) return "";
  const price = Number(value);
  return Number.isFinite(price) ? price : "";
}

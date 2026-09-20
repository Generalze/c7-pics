"use client";

import { fetchLgas, fetchPollingUnits, fetchWards } from "../../lib/api";

/**
 * Territory names for the console.
 *
 * Every list endpoint returns territory ids and no names, and the coverage
 * endpoints load all 5,040 polling units, which is far too much to ship to a
 * page that refreshes. So this resolves names the cheap way: LGAs (20) and
 * wards (236) are loaded once and kept, and polling units are fetched per ward
 * only when a visible row needs one.
 *
 * The cache lives for the life of the tab. Reference data changes on the order
 * of elections, not minutes.
 */

export const OGUN_STATE_ID = "ng-state-ogun";

type NameMap = Map<string, string>;

let lgaPromise: Promise<NameMap> | null = null;
let wardPromise: Promise<NameMap> | null = null;
const wardToLga: NameMap = new Map();
const pollingUnitNames: NameMap = new Map();
const pollingUnitsByWard = new Map<string, Promise<void>>();

export async function loadLgaNames(token: string, stateId = OGUN_STATE_ID): Promise<NameMap> {
  if (!lgaPromise) {
    lgaPromise = fetchLgas(token, stateId)
      .then((items) => new Map(items.map((item) => [item.id, item.name])))
      .catch((error) => {
        lgaPromise = null;
        throw error;
      });
  }
  return lgaPromise;
}

export async function loadWardNames(token: string, stateId = OGUN_STATE_ID): Promise<NameMap> {
  if (!wardPromise) {
    wardPromise = fetchWards(token, stateId)
      .then((items) => {
        const map: NameMap = new Map();
        for (const item of items) {
          map.set(item.id, item.name);
          if (item.lgaId) {
            wardToLga.set(item.id, item.lgaId);
          }
        }
        return map;
      })
      .catch((error) => {
        wardPromise = null;
        throw error;
      });
  }
  return wardPromise;
}

/**
 * Resolves the polling units of the given wards, one request per ward that has
 * not been fetched yet. Failures are swallowed: a missing name degrades to the
 * id, which is far better than a page that will not render.
 */
export async function loadPollingUnitNames(
  token: string,
  wardIds: Array<string | null | undefined>,
  stateId = OGUN_STATE_ID,
): Promise<NameMap> {
  const wanted = Array.from(new Set(wardIds.filter((id): id is string => Boolean(id))));
  await Promise.all(
    wanted.map((wardId) => {
      const existing = pollingUnitsByWard.get(wardId);
      if (existing) return existing;
      const lgaId = wardToLga.get(wardId);
      if (!lgaId) return Promise.resolve();
      const request = fetchPollingUnits(token, stateId, lgaId, wardId)
        .then((items) => {
          for (const item of items) {
            pollingUnitNames.set(item.id, item.name);
          }
        })
        .catch(() => {
          pollingUnitsByWard.delete(wardId);
        });
      pollingUnitsByWard.set(wardId, request);
      return request;
    }),
  );
  return pollingUnitNames;
}

/** A readable fallback when a name is not resolved: the tail of the id. */
export function shortId(id: string | null | undefined): string {
  if (!id) return "—";
  const tail = id.split("-").pop() ?? id;
  return tail.length > 10 ? `…${tail.slice(-8)}` : tail;
}

export function nameOf(map: NameMap, id: string | null | undefined): string {
  if (!id) return "—";
  return map.get(id) ?? shortId(id);
}

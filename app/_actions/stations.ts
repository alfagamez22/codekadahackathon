"use server";

import { requireRole } from "@/lib/auth/guards";
import {
  createStation,
  updateStation,
  deleteStation,
} from "@/lib/firebase-admin/queries/stations";
import { upsertConfirmedPrice } from "@/lib/firebase-admin/queries/prices";
import { adminDb } from "@/lib/firebase-admin/firestore";
import { stationSchema } from "@/lib/utils/validators";
import { updateTag } from "next/cache";
import type { StationInput } from "@/lib/utils/validators";
import type { FuelType } from "@/types/station";

export async function createStationAction(input: StationInput) {
  const session = await requireRole(["admin"]);
  const parsed = stationSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const id = await createStation(parsed.data);

  await adminDb.collection("auditLogs").add({
    adminId: session.uid,
    action: "create_station",
    targetType: "station",
    targetId: id,
    after: parsed.data,
    createdAt: new Date().toISOString(),
  });

  updateTag("stations");
  return { success: true, stationId: id };
}

export async function updateStationAction(
  id: string,
  input: Partial<StationInput>,
) {
  const session = await requireRole(["admin"]);
  await updateStation(id, input);

  await adminDb.collection("auditLogs").add({
    adminId: session.uid,
    action: "update_station",
    targetType: "station",
    targetId: id,
    after: input,
    createdAt: new Date().toISOString(),
  });

  updateTag("stations");
  return { success: true };
}

export async function deleteStationAction(id: string) {
  const session = await requireRole(["admin"]);
  await deleteStation(id);

  await adminDb.collection("auditLogs").add({
    adminId: session.uid,
    action: "delete_station",
    targetType: "station",
    targetId: id,
    createdAt: new Date().toISOString(),
  });

  updateTag("stations");
  return { success: true };
}

export async function adminOverridePriceAction(data: {
  stationId: string;
  fuelType: FuelType;
  price: number;
}) {
  const session = await requireRole(["admin"]);

  await upsertConfirmedPrice({
    stationId: data.stationId,
    fuelType: data.fuelType,
    price: data.price,
    sourceType: "admin",
  });

  await adminDb.collection("auditLogs").add({
    adminId: session.uid,
    action: "override_price",
    targetType: "station",
    targetId: data.stationId,
    after: data,
    createdAt: new Date().toISOString(),
  });

  updateTag("prices");
  return { success: true };
}

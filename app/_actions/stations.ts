"use server";

import { requireRole } from "@/lib/auth/guards";
import {
  createStation,
  updateStation,
  deleteStation,
} from "@/lib/firebase-admin/queries/stations";
import { upsertConfirmedPrice } from "@/lib/firebase-admin/queries/prices";
import { stationSchema } from "@/lib/utils/validators";
import { updateTag } from "next/cache";
import type { StationInput } from "@/lib/utils/validators";
import type { FuelType } from "@/types/station";

export async function createStationAction(input: StationInput) {
  const session = await requireRole(["admin"]);
  const parsed = stationSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const id = await createStation(parsed.data);

  // audit log — no-op in mock mode
  void session;

  updateTag("stations");
  return { success: true, stationId: id };
}

export async function updateStationAction(
  id: string,
  input: Partial<StationInput>,
) {
  const session = await requireRole(["admin"]);
  await updateStation(id, input);

  // audit log — no-op in mock mode
  void session;

  updateTag("stations");
  return { success: true };
}

export async function deleteStationAction(id: string) {
  const session = await requireRole(["admin"]);
  await deleteStation(id);

  // audit log — no-op in mock mode
  void session;

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

  // audit log — no-op in mock mode
  void session;

  updateTag("prices");
  return { success: true };
}

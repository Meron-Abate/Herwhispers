"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type CampaignFormState = {
  ok: boolean;
  errors?: Record<string, string>;
};

export async function createCampaign(
  prevState: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const assessmentId = String(formData.get("assessment_id") ?? "").trim();

  const registrationStartValue = String(
    formData.get("registration_start") ?? "",
  ).trim();
  const registrationEndValue = String(
    formData.get("registration_end") ?? "",
  ).trim();
  const distributionDateValue = String(
    formData.get("distribution_date") ?? "",
  ).trim();

  const errors: Record<string, string> = {};

  // Required text fields
  if (!name) errors.name = "Campaign name is required.";
  if (!assessmentId) errors.assessment_id = "Assessment is required.";
  if (!registrationStartValue)
    errors.registration_start = "Registration start is required.";
  if (!registrationEndValue)
    errors.registration_end = "Registration end is required.";

  // Parse dates
  const registrationStart = registrationStartValue
    ? new Date(registrationStartValue)
    : null;
  const registrationEnd = registrationEndValue
    ? new Date(registrationEndValue)
    : null;

  if (registrationStart && Number.isNaN(registrationStart.getTime())) {
    errors.registration_start = "Invalid registration start date.";
  }
  if (registrationEnd && Number.isNaN(registrationEnd.getTime())) {
    errors.registration_end = "Invalid registration end date.";
  }

  // Date ordering check
  if (
    registrationStart &&
    registrationEnd &&
    !errors.registration_start &&
    !errors.registration_end &&
    registrationEnd <= registrationStart
  ) {
    errors.registration_end =
      "Registration end must be after registration start.";
  }

  // Distribution date — optional
  let distributionDate: Date | null = null;
  if (distributionDateValue) {
    distributionDate = new Date(distributionDateValue);
    if (Number.isNaN(distributionDate.getTime())) {
      errors.distribution_date = "Invalid distribution date.";
    }
  }

  // If anything failed, return errors instead of throwing
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  // ----- All valid from here -----

  const now = new Date();

  const activeCampaign = await prisma.campaigns.findFirst({
    where: { status: "ACTIVE" },
  });

  let status: "DRAFT" | "UPCOMING" | "ACTIVE";

  if (!activeCampaign && registrationStart! <= now && registrationEnd! >= now) {
    status = "ACTIVE";
  } else if (registrationStart! > now) {
    status = "UPCOMING";
  } else {
    status = "DRAFT";
  }

  await prisma.campaigns.create({
    data: {
      name,
      description: description || null,
      assessment_id: assessmentId,
      registration_start: registrationStart!,
      registration_end: registrationEnd!,
      distribution_date: distributionDate,
      status,
    },
  });

  revalidatePath("/dashboard/campaigns");
  revalidatePath("/dashboard");
  redirect("/dashboard/campaigns");
}

export async function completeCampaign(formData: FormData) {
  const campaignId = String(formData.get("campaignId") ?? "").trim();

  if (!campaignId) {
    throw new Error("Campaign ID is required.");
  }

  const campaign = await prisma.campaigns.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  if (campaign.status === "COMPLETED") {
    return;
  }

  await prisma.campaigns.update({
    where: { id: campaignId },
    data: {
      status: "COMPLETED",
      updated_at: new Date(),
    },
  });

  const now = new Date();

  const nextCampaign = await prisma.campaigns.findFirst({
    where: {
      id: { not: campaignId },
      status: { in: ["UPCOMING", "DRAFT"] },
      registration_start: { lte: now },
      registration_end: { gte: now },
    },
    orderBy: { registration_start: "asc" },
  });

  if (nextCampaign) {
    await prisma.campaigns.update({
      where: { id: nextCampaign.id },
      data: {
        status: "ACTIVE",
        updated_at: new Date(),
      },
    });
  }

  revalidatePath("/dashboard/campaigns");
  revalidatePath("/dashboard");
  redirect("/dashboard/campaigns");
}

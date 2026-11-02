"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ContributionFormState = {
  ok: boolean;
  errors?: Record<string, string>;
};

export async function createContribution(
  prevState: ContributionFormState,
  formData: FormData,
): Promise<ContributionFormState> {
  // 1. Extract data
  const partnerId = String(formData.get("partner_id") ?? "").trim();
  const campaignId = String(formData.get("campaign_id") ?? "").trim();
  const productId = String(formData.get("product_id") ?? "").trim();
  const contributionType = String(
    formData.get("contribution_type") ?? "",
  ).trim();
  const quantityStr = String(formData.get("quantity") ?? "").trim();
  const manufacturerName = String(
    formData.get("manufacturer_name") ?? "",
  ).trim();
  const notes = String(formData.get("notes") ?? "").trim();

  const errors: Record<string, string> = {};

  // 2. Validate
  if (!partnerId) errors.partner_id = "Partner is required.";
  if (!campaignId) errors.campaign_id = "Campaign is required.";
  if (!productId) errors.product_id = "Product is required.";
  if (!contributionType)
    errors.contribution_type = "Contribution type is required.";

  const quantity = parseInt(quantityStr, 10);
  if (isNaN(quantity) || quantity <= 0) {
    errors.quantity = "Quantity must be a positive number.";
  }

  // Manufacturer name is required ONLY if type is SUPPORT_THROUGH_PAYING_MANUFACTURER
  if (
    contributionType === "SUPPORT_THROUGH_PAYING_MANUFACTURER" &&
    !manufacturerName
  ) {
    errors.manufacturer_name =
      "Manufacturer name is required for this contribution type.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  // 3. Save to DB
  await prisma.partner_contributions.create({
    data: {
      partner_id: partnerId,
      campaign_id: campaignId,
      product_id: productId,
      contribution_type: contributionType as
        | "PHYSICAL_PRODUCT"
        | "SUPPORT_THROUGH_PAYING_MANUFACTURER",
      quantity,
      manufacturer_name: manufacturerName || null,
      notes: notes || null,
      // Default values for status are handled by the schema (PENDING)
    },
  });

  // 4. Refresh and redirect
  revalidatePath("/dashboard/contributions");
  redirect("/dashboard/contributions");
}

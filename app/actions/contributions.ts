"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureCategoryProduct } from "@/lib/inventory";
import { isProductCategory } from "@/lib/productCategories";

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
  const category = String(formData.get("category") ?? "").trim();
  const contributionType = String(
    formData.get("contribution_type") ?? "",
  ).trim();
  const quantityStr = String(formData.get("quantity") ?? "").trim();
  const deliveryStatus = String(
    formData.get("delivery_status") ?? "DELIVERED",
  ).trim();
  const manufacturerName = String(
    formData.get("manufacturer_name") ?? "",
  ).trim();
  const notes = String(formData.get("notes") ?? "").trim();

  const errors: Record<string, string> = {};

  // 2. Validate
  if (!partnerId) errors.partner_id = "Partner is required.";
  if (!isProductCategory(category)) errors.category = "Category is required.";
  if (!contributionType)
    errors.contribution_type = "Contribution type is required.";
  if (deliveryStatus !== "DELIVERED" && deliveryStatus !== "PENDING") {
    errors.delivery_status = "Choose Delivered or Pending.";
  }

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

  if (Object.keys(errors).length > 0 || !isProductCategory(category)) {
    return { ok: false, errors };
  }

  // 3. Donations go into the shared pool, counted per category. The
  // category's own product keeps the existing product links working.
  const product = await ensureCategoryProduct(category);

  await prisma.partner_contributions.create({
    data: {
      partner_id: partnerId,
      campaign_id: null,
      product_id: product.id,
      contribution_type: contributionType as
        | "PHYSICAL_PRODUCT"
        | "SUPPORT_THROUGH_PAYING_MANUFACTURER",
      quantity,
      manufacturer_name: manufacturerName || null,
      notes: notes || null,
      delivery_status: deliveryStatus as "DELIVERED" | "PENDING",
      delivered_at: deliveryStatus === "DELIVERED" ? new Date() : null,
    },
  });

  // 4. Refresh and redirect
  revalidatePath("/dashboard/contributions");
  revalidatePath("/dashboard/Products");
  redirect("/dashboard/contributions");
}

/** A pending donation has arrived: it now counts as stock. */
export async function markContributionDelivered(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    throw new Error("Contribution ID is required.");
  }

  await prisma.partner_contributions.updateMany({
    where: {
      id,
      delivery_status: { in: ["PENDING", "PARTIALLY_DELIVERED"] },
    },
    data: {
      delivery_status: "DELIVERED",
      delivered_at: new Date(),
      updated_at: new Date(),
    },
  });

  revalidatePath("/dashboard/contributions");
  revalidatePath("/dashboard/Products");
}

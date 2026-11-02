"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type PartnerFormState = {
  ok: boolean;
  errors?: Record<string, string>;
};

export async function createPartner(
  prevState: PartnerFormState,
  formData: FormData,
): Promise<PartnerFormState> {
  // 1. Extract data from the form
  const companyName = String(formData.get("company_name") ?? "").trim();
  const contactPerson = String(formData.get("contact_person") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  const errors: Record<string, string> = {};

  // 2. Validate required fields
  if (!companyName) {
    errors.company_name = "Company name is required.";
  }

  // Optional: basic email format validation if an email is provided
  if (email && !email.includes("@")) {
    errors.email = "Please enter a valid email address.";
  }

  // 3. Return errors if validation fails
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  // 4. Save to database using Prisma
  await prisma.partners.create({
    data: {
      company_name: companyName,
      contact_person: contactPerson || null, // Convert empty strings to null
      phone: phone || null,
      email: email || null,
      address: address || null,
      is_active: true, // Default to active for new partners
    },
  });

  // 5. Refresh the list and redirect
  revalidatePath("/dashboard/partners");
  redirect("/dashboard/partners");
}

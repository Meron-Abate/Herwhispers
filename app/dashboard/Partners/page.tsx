import { prisma } from "@/lib/prisma";

// Use a helper to safely display optional fields
function displayValue(value: string | null | undefined) {
  return value && value.trim() !== "" ? (
    value
  ) : (
    <span className="text-gray-400 italic">Not provided</span>
  );
}

export default async function PartnersPage() {
  // 1. Fetch real data from Prisma
  const partners = await prisma.partners.findMany({
    orderBy: {
      created_at: "desc",
    },
  });

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partners</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage organizations and companies supporting HerWhispers.
          </p>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-700">Company</th>
              <th className="px-6 py-4 font-semibold text-gray-700">
                Contact Person
              </th>
              <th className="px-6 py-4 font-semibold text-gray-700">
                Contact Info
              </th>
              <th className="px-6 py-4 font-semibold text-gray-700">Address</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {partners.map((partner) => (
              <tr key={partner.id} className="hover:bg-gray-50">
                {/* 2. Company Name (Required) */}
                <td className="px-6 py-5 font-medium text-gray-900">
                  {partner.company_name}
                </td>

                {/* 3. Contact Person (Optional) */}
                <td className="px-6 py-5 text-gray-600">
                  {displayValue(partner.contact_person)}
                </td>

                {/* 4 & 5. Phone & Email (Optional) */}
                <td className="px-6 py-5 text-gray-600">
                  <div className="flex flex-col gap-1">
                    <span>{displayValue(partner.phone)}</span>
                    <span className="text-xs text-gray-500">
                      {displayValue(partner.email)}
                    </span>
                  </div>
                </td>

                {/* 6. Address (Optional) */}
                <td className="px-6 py-5 text-gray-600">
                  <div
                    className="max-w-xs truncate"
                    title={partner.address || undefined}
                  >
                    {displayValue(partner.address)}
                  </div>
                </td>

                {/* 7. Active Status */}
                <td className="px-6 py-5">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      partner.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {partner.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}

            {/* 8. Empty State */}
            {partners.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-16 text-center text-sm text-gray-500"
                >
                  <p className="mb-2 text-lg font-medium text-gray-900">
                    No partners found
                  </p>
                  <p>
                    Partners will appear here once they are added to the system.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

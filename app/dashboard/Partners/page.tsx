import PageHeader from "../PageHeader";

export default function PartnersPage() {
  return (
    <div className="p-8">

      <PageHeader
        title="Partners"
        description="Manage campaign partners and contributions"
      />

      <div className="rounded-xl border bg-white shadow-sm">

        <div className="overflow-x-auto">

          <table className="w-full text-left text-sm">

            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-4">
                  Company
                </th>

                <th className="px-6 py-4">
                  Contact
                </th>

                <th className="px-6 py-4">
                  Contribution
                </th>

                <th className="px-6 py-4">
                  Quantity
                </th>

                <th className="px-6 py-4">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              <tr className="border-b">

                <td className="px-6 py-4">
                  Test Partner
                </td>

                <td className="px-6 py-4">
                  —
                </td>

                <td className="px-6 py-4">
                  Physical Product
                </td>

                <td className="px-6 py-4">
                  1,500
                </td>

                <td className="px-6 py-4">
                  DELIVERED
                </td>

              </tr>
            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}
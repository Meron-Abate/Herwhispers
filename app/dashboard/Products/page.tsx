import PageHeader from "../PageHeader";

export default function InventoryPage() {
  return (
    <div className="p-8">

      <PageHeader
        title="Inventory"
        description="Track campaign stock and product movement"
      />

      <div className="rounded-xl border bg-white shadow-sm">

        <div className="border-b p-6">
          <h2 className="text-xl font-semibold">
            Products
          </h2>
        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-left text-sm">

            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-4">
                  Product
                </th>

                <th className="px-6 py-4">
                  Delivered
                </th>

                <th className="px-6 py-4">
                  Allocated
                </th>

                <th className="px-6 py-4">
                  Distributed
                </th>

                <th className="px-6 py-4">
                  Remaining
                </th>
              </tr>
            </thead>

            <tbody>
              <tr className="border-b">

                <td className="px-6 py-4">
                  Disposable Pads
                </td>

                <td className="px-6 py-4">
                  1,500
                </td>

                <td className="px-6 py-4">
                  1,500
                </td>

                <td className="px-6 py-4">
                  500
                </td>

                <td className="px-6 py-4">
                  1,000
                </td>

              </tr>
            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}
import Link from "next/link";
import React from "react";

const navigation = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Campaigns", href: "/dashboard/campaigns" },
  { name: "Participants", href: "/dashboard/participants" },
  { name: "Students", href: "/dashboard/students" },
  { name: "Universities", href: "/dashboard/universities" },
  { name: "Assessments", href: "/dashboard/assessments" },
  { name: "Products", href: "/dashboard/Products" },
  { name: "Partners", href: "/dashboard/Partners" },
  { name: "Allocations", href: "/dashboard/allocations" },
  { name: "Distributions", href: "/dashboard/distributions" },
  { name: "Verification", href: "/dashboard/Verification" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside className="w-64 border-r bg-white flex flex-col">

          <div className="border-b px-6 py-5">
            <h1 className="text-xl font-bold text-gray-900">
              HerWhispers
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Admin Dashboard
            </p>
          </div>

          <nav className="p-4 flex-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="mb-1 block rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

      </div>
    </div>
  );
}
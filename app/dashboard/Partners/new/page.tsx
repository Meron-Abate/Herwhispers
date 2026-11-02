import PartnerForm from "./PartnerForm";

export default function NewPartnerPage() {
  return (
    <div className="max-w-2xl p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Add New Partner</h1>
        <p className="mt-1 text-sm text-gray-500">
          Register a new organization or company.
        </p>
      </div>

      <PartnerForm />
    </div>
  );
}

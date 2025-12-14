import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  const { data: partners, error } = await supabase
    .from("partners")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-red-700 mb-2">Partners</h1>
      <p className="text-sm text-gray-500 mb-6">
        Powered by Doorplace USA
      </p>

      <div className="overflow-x-auto bg-white rounded-lg shadow border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">Partner ID</th>
              <th className="px-4 py-3 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {partners?.map((p) => (
              <tr key={p.id} className="border-b last:border-b-0">
                <td className="px-4 py-3">{p.full_name}</td>
                <td className="px-4 py-3">{p.email}</td>
                <td className="px-4 py-3">{p.phone}</td>
                <td className="px-4 py-3 font-mono text-xs">{p.partner_id}</td>
                <td className="px-4 py-3">
                  {new Date(p.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

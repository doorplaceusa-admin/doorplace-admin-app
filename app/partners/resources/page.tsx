// app/partners/resources/page.tsx
"use client";
import { useEffect, useState } from "react";
type Resource = {
  id: string;
  title: string;
  description: string;
  resource_url: string;
  category: string;
  resource_type: string;
  show_new: boolean;
};
export default function PartnerResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/partners-resources")
      .then(res => res.json())
      .then(data => {
        setResources(data || []);
        setLoading(false);
      });
  }, []);
  if (loading) {
    return <div className="p-6">Loading resources…</div>;
  }
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="space-y-1">
  <h1 className="text-3xl font-bold">Partner Resources</h1>
  <p className="text-sm text-gray-500">
    Training, tools, links, and documents to help you sell and earn faster
  </p>
</div>

      {resources.length === 0 && (
        <p className="text-gray-500">No resources available.</p>
      )}
      <div className="space-y-4">
        {resources.map(resource => (
          <div
  key={resource.id}
  className="border rounded-xl p-5 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
>

            <div>
              <h3 className="font-bold text-lg">
                {resource.title}
                {resource.show_new && (
                  <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded">
                    NEW
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-600">
                {resource.description}
              </p>
            </div>
            <a
  href={resource.resource_url}
  target="_blank"
  className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-black text-white font-semibold text-sm hover:opacity-90 transition"
>
  View Resource →
</a>

          </div>
        ))}
      </div>
    </div>
  );
}


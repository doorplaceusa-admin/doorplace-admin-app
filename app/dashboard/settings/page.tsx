"use client";

import SendPasswordReset from "./components/SendPasswordReset";

export default function Page() {
  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto pb-6 space-y-4 max-w-[1500px] w-full mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-3 text-gray-600">
          Manage system-level tools and administrative actions.
        </p>
      </div>

      {/* Password Reset Tool */}
      <div>
        <h2 className="text-lg font-semibold mb-2">
          Partner Password Tools
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Send a secure password reset link to a partner.
        </p>

        <SendPasswordReset />
      </div>

      {/* Future settings */}
      <div className="border-t pt-6 text-sm text-gray-500">
        More features coming soon.
      </div>
    </div>
  );
}

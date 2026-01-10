"use client";

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto text-sm space-y-6 py-6">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>

      <p>
        TradePilot collects information necessary to operate the platform,
        including partner account details, contact information, usage activity,
        tracking link interactions, and order-related data.
      </p>

      <p>
        This data is used solely for platform functionality, analytics, partner
        attribution, fraud prevention, commission tracking, and internal business
        operations.
      </p>

      <p>
        Doorplace USA does not sell personal data. Information is not shared with
        third parties except when required to operate the platform or comply with
        legal obligations.
      </p>

      <p>
        By using TradePilot, you consent to the collection and use of information
        as described in this policy.
      </p>

      <div className="pt-6 border-t">
        <Link
          href="/partners/dashboard"
          className="text-red-700 font-semibold hover:underline"
        >
          ← Back to Partner Dashboard
        </Link>
      </div>
    </div>
  );
}

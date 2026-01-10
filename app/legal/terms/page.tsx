"use client";

import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto text-sm space-y-6 py-6">
      <h1 className="text-2xl font-bold">TradePilot Terms & Conditions</h1>

      <p>
        TradePilot is a business management, partner tracking, and commission
        platform owned and operated by Doorplace USA. By accessing or using
        TradePilot, you agree to be bound by these Terms & Conditions.
      </p>

      <p>
        Access to TradePilot is provided to approved partners only. Doorplace USA
        reserves the right to suspend or terminate access at any time for misuse,
        fraud, policy violations, or behavior that harms the platform, customers,
        or brand.
      </p>

      <p>
        You are responsible for maintaining accurate account information and for
        all activity performed under your account. Sharing access, attempting to
        manipulate tracking, or submitting false information is strictly
        prohibited.
      </p>

      <p>
        TradePilot features, rules, commission structures, and platform behavior
        may be updated or modified at any time. Continued use of TradePilot
        constitutes acceptance of any changes.
      </p>

      <p>
        These Terms & Conditions are governed by and interpreted under the laws of
        the State of Texas, United States.
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

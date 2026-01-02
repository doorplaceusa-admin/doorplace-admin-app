"use client";

import Link from "next/link";

export default function PartnerPendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow border border-gray-200 p-8 text-center">
        <h1 className="text-2xl font-bold text-red-700 mb-4">
          Account Pending Approval
        </h1>

        <p className="text-gray-600 mb-6">
          Thanks for creating your TradePilot account.
          <br />
          Your partner profile is currently under review by the Doorplace USA
          team.
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 mb-6">
          <p className="mb-2">
            <strong>What happens next?</strong>
          </p>
          <ul className="list-disc list-inside text-left space-y-1">
            <li>Your onboarding details are reviewed</li>
            <li>Your account is approved by an admin</li>
            <li>You’ll gain full access to your Partner Dashboard</li>
          </ul>
        </div>

        {/* FAQ */}
        <div className="border-t pt-4 mb-6 text-sm text-left text-gray-600">
          <p className="font-semibold mb-2">Quick FAQ</p>

          <p className="mb-1">
            <strong>Do I need to do anything right now?</strong>
            <br />
            No — our team is reviewing your submission.
          </p>

          <p className="mb-1">
            <strong>How long does approval take?</strong>
            <br />
            Most approvals are completed the same day.
          </p>

          <p>
            <strong>Questions?</strong>
            <br />
            Email us at{" "}
            <a
              href="mailto:partners@doorplaceusa.com"
              className="text-red-700 underline"
            >
              partners@doorplaceusa.com
            </a>
          </p>
        </div>

        <Link
          href="/login"
          className="inline-block bg-red-700 hover:bg-red-800 text-white font-semibold px-6 py-3 rounded-lg transition"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}

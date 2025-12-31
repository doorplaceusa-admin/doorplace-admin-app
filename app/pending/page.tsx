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

        <p className="text-sm text-gray-500 mb-6">
          You’ll be notified once your account is approved.
        </p>

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

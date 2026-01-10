"use client";

import Link from "next/link";

export default function CommissionTermsPage() {
  return (
    <div className="max-w-3xl mx-auto text-sm space-y-6 py-6">
      <h1 className="text-2xl font-bold">Commission Terms</h1>

      <p>
        Commissions are earned when a valid customer order is submitted through a
        partner’s tracking link or order submission and a customer deposit is
        successfully received.
      </p>

      <p>
        Commission payouts are issued within <b>24–36 hours</b> after the customer
        deposit is confirmed.
      </p>

      <p>
        Commissions may be reduced, delayed, or revoked in cases of order
        cancellation, chargebacks, duplicate submissions, fraud, misuse, or
        violations of platform policies.
      </p>

      <p>
        Doorplace USA reserves the right to modify commission structures, payout
        timing, eligibility rules, and tracking logic at any time.
      </p>

      <p>
        All commission determinations made through TradePilot are final.
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


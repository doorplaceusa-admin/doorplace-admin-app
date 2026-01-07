"use client";

import { useAppViewTracker } from "@/lib/useAppViewTracker";
export const dynamic = "force-dynamic";

export default function PartnerTermsPage() {
  useAppViewTracker({
  role: "unknown", // or "admin" | "partner"
  companyId: null,
});

  return (
    <div
      className="
        max-w-4xl
        mx-auto
        p-6
        space-y-6
        text-sm
        leading-relaxed
        text-gray-800
        max-h-[60dvh]
        overflow-y-auto
      "
    >

      {/* ===============================
          HEADER
      =============================== */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">
          Legal, Privacy & Partner Terms
        </h1>
        <p className="text-gray-600">
          Doorplace USA Independent Partner Program & TradePilot Platform
        </p>
      </div>

      {/* ===============================
          INTRODUCTION
      =============================== */}
      <p>
        This Legal, Privacy & Partner Terms Agreement (“Agreement”) governs your
        access to and use of the <b>TradePilot</b> platform and your participation
        in the <b>Doorplace USA Independent Partner Program</b>.
      </p>

      <p>
        TradePilot is Doorplace USA’s internal partner system used to manage
        onboarding, tracking links, swing leads, orders, commissions, payouts,
        and partner communications.
      </p>

      <p>
        By accessing TradePilot, submitting a Partner Onboarding Form, sharing a
        tracking link, or representing Doorplace USA in any capacity, you agree
        to be legally bound by the terms outlined below.
      </p>


      {/* ===============================
          INDEPENDENT CONTRACTOR STATUS
      =============================== */}
      <section className="space-y-2">
        <h2 className="font-bold text-base">Independent Contractor Relationship</h2>
        <p>
          All partners operate as <b>independent contractors</b>. This Agreement
          does not create an employer-employee relationship, partnership, joint
          venture, franchise, or agency relationship.
        </p>
        <p>
          Partners are solely responsible for managing their own business
          activities, marketing efforts, expenses, licensing, and compliance
          with all applicable federal, state, and local laws.
        </p>
      </section>

      {/* ===============================
          COMPENSATION & COMMISSIONS
      =============================== */}
      <section className="space-y-2">
        <h2 className="font-bold text-base">Compensation & Commission Structure</h2>

        <p>
          Partners earn a <b>minimum commission of $100 or 12%</b> on every
          approved swing sale — whichever is greater.
        </p>

        <p>
          Doorplace USA offers a <b>Flexible Commission Program</b> that allows
          partners to sell swings and approved accessories at prices up to
          <b> 60% above standard base pricing</b>. Commission is calculated on
          the final approved sale price.
        </p>

        <p>
          There is no base pay, salary, or guaranteed earnings. All commissions
          must be approved by Doorplace USA prior to payout.
        </p>
      </section>

      {/* ===============================
          RESIDUAL COMMISSIONS
      =============================== */}
      <section className="space-y-2">
        <h2 className="font-bold text-base">Residual Commissions</h2>
        <p>
          Active partners may earn a <b>5% residual commission</b> on repeat
          purchases made by the same customer within <b>one (1) year</b> of the
          original sale.
        </p>
        <p>
          To qualify, the partner must remain active by completing at least one
          approved sale every six months. Residual commissions are payable only
          if the partner is active at the time of the repeat purchase.
        </p>
      </section>

      {/* ===============================
          SWING LEAD COMMISSIONS
      =============================== */}
      <section className="space-y-2">
        <h2 className="font-bold text-base">Swing Lead Commission Terms</h2>

        <p>
          Partners are provided with a unique swing tracking link tied to their
          Partner ID.
        </p>

        <p>
          When a customer submits a <b>Swing Lead</b> using a partner’s tracking
          link, the lead is automatically associated with that partner.
        </p>

        <p>
          If a swing lead converts into a confirmed swing order, the partner
          earns a <b>$100 lead commission</b>.
        </p>

        <p>
          Swing lead commissions are tracked separately from standard swing sale
          commissions and are visible in the partner’s Commission Tracker.
        </p>

        <p>
          Doorplace USA reserves the right to modify or discontinue promotional
          lead bonuses at any time.
        </p>
      </section>

      {/* ===============================
          PAYMENT SCHEDULE
      =============================== */}
      <section className="space-y-2">
        <h2 className="font-bold text-base">Payment Schedule</h2>
        <p>
          Commission payments are issued <b>24–36 hours after a customer deposit
          has been received and verified</b>, not after project completion.
        </p>
        <p>
          Payments are issued via direct deposit. After your first sale, you will receive an 
          email with a secure link to set up your direct deposit information.


        </p>
        <p>
          Doorplace USA reserves the right to withhold, adjust, or reverse
          commissions for canceled orders, refunded deposits, chargebacks, or
          violations of this Agreement.
        </p>
      </section>

      {/* ===============================
          ADD-ONS & INSTALLATION
      =============================== */}
      <section className="space-y-2">
        <h2 className="font-bold text-base">Add-Ons & Installations</h2>
        <p>
          Optional add-ons such as cup holders, paint, ropes, or wood upgrades
          are included in commission calculations.
        </p>
        <p>
          Installation services, delivery fees, taxes, and shipping costs are
          excluded from commission calculations.
        </p>
      </section>

      {/* ===============================
          BRANDING & MATERIALS
      =============================== */}
      <section className="space-y-2">
        <h2 className="font-bold text-base">Use of Branding & Marketing Materials</h2>
        <p>
          Partners may use Doorplace USA’s approved logos, marketing assets, and
          materials solely for the promotion and sale of Doorplace USA products.
        </p>
        <p>
          Unauthorized reproduction, modification, resale, or misuse of brand
          assets is strictly prohibited.
        </p>
      </section>

      {/* ===============================
          PROFESSIONALISM & CONFIDENTIALITY
      =============================== */}
      <section className="space-y-2">
        <h2 className="font-bold text-base">Professionalism & Confidentiality</h2>
        <p>
          Partners agree to represent Doorplace USA professionally and follow
          all brand, pricing, and communication guidelines.
        </p>
        <p>
          All commission structures, pricing details, internal dashboards, and
          platform data are confidential and intended only for active partners.
        </p>
      </section>

      {/* ===============================
          PRIVACY & DATA SECURITY
      =============================== */}
      <section className="space-y-2">
        <h2 className="font-bold text-base">Privacy & Data Security</h2>
        <p>
          Doorplace USA collects and uses partner and customer information solely
          for platform access, order processing, commission tracking, and
          business operations.
        </p>
        <p>
          Data is securely managed through platforms including TradePilot,
          Shopify, Supabase, Google Workspace, and FreshBooks.
        </p>
      </section>

      {/* ===============================
          TERMINATION
      =============================== */}
      <section className="space-y-2">
        <h2 className="font-bold text-base">Termination</h2>
        <p>
          Either party may terminate participation with written notice.
          Doorplace USA reserves the right to immediately suspend or revoke
          access for misuse, misconduct, brand violations, or non-compliance.
        </p>
      </section>

      {/* ===============================
          MODIFICATIONS
      =============================== */}
      <section className="space-y-2">
        <h2 className="font-bold text-base">Updates & Modifications</h2>
        <p>
          Doorplace USA may revise this Agreement at any time. Updated terms will
          require renewed digital acceptance for continued participation.
        </p>
      </section>

      {/* ===============================
          AGREEMENT ACCEPTANCE
      =============================== */}
      <section className="space-y-2">
        <h2 className="font-bold text-base">Agreement & Acceptance</h2>
        <p>
          By clicking “I Agree”, checking an acceptance box, or continuing to use
          TradePilot, you acknowledge that you have read, understood, and agree
          to be legally bound by this Agreement.
        </p>
      </section>

      {/* ===============================
          FOOTER
      =============================== */}
      <div className="pt-6 border-t text-xs text-gray-500">
        © 2026 Doorplace USA. All Rights Reserved.<br />
        Watauga, Texas · partners@doorplaceusa.com
      </div>



    </div>
    



  );
}

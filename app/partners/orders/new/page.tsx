"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function PartnerSwingOrderPage() {
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /* ===============================
     LOAD PARTNER ID
  =============================== */
  useEffect(() => {
    async function loadPartner() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) return;

      const { data } = await supabase
        .from("partners")
        .select("partner_id")
        .eq("email_address", user.email)
        .single();

      if (data?.partner_id) setPartnerId(data.partner_id);
    }

    loadPartner();
  }, []);

  /* ===============================
     SUBMIT HANDLER
  =============================== */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    formData.append("submission_type", "partner_order");
    formData.append("is_partner_order", "true");
    if (partnerId) formData.append("partner_id", partnerId);

    await fetch("/api/leads/intake", {
      method: "POST",
      body: formData,
    });

    window.location.href = "/partners/dashboard";
  }


  /* ===============================
     PAGE
  =============================== */
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* HEADER */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-red-700">
          Submit a Swing Order
        </h1>
        <p className="text-gray-600 mt-2">
          Use this form to submit a new swing order for your customer.
        </p>
      </div>

      {/* INSTRUCTIONS */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 text-sm">
        <p className="font-semibold mb-2">
          Before You Submit — Gather This from the Customer
        </p>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li>Accurate ceiling or beam height measurements</li>
          <li>Clear photos of the full porch area</li>
          <li>Customer contact & delivery details</li>
          <li>Swing size, hanging method, stain, add-ons</li>
          <li>Installation or shipping preference</li>
        </ul>
      </div>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        encType="multipart/form-data"
        className="space-y-8"
      >
        {/* CUSTOMER INFO */}
        <Section title="Customer Information">
          <Grid>
            <Field label="First Name *">
              <input name="customer_first_name" required />
            </Field>
            <Field label="Last Name *">
              <input name="customer_last_name" required />
            </Field>
            <Field label="Email *">
              <input type="email" name="email" required />
            </Field>
            <Field label="Phone *">
              <input name="phone" required />
            </Field>
            <Field label="Street Address *">
              <input name="street_address" required />
            </Field>
            <Field label="City *">
              <input name="city" required />
            </Field>
            <Field label="State *">
              <input name="state" required />
            </Field>
            <Field label="Zip Code *">
              <input name="zip" required />
            </Field>
          </Grid>
        </Section>

        {/* SWING DETAILS */}
        <Section title="Swing Details">
          <Grid>
            <Field label="Swing Size *">
              <select name="swing_size" required>
                <option value="">Select</option>
                <option>Crib</option>
                <option>Twin</option>
                <option>Full</option>
                <option>Custom</option>
              </select>
            </Field>

            <Field label="Wood Type *">
              <select name="wood_type" required>
                <option value="">Select</option>
                <option>Pine</option>
                <option>Cedar</option>
                <option>Other</option>
              </select>
            </Field>

            <Field label="Stain / Finish *">
              <input name="finish" required />
            </Field>

            <Field label="Hanging Method *">
              <select name="hanging_method" required>
                <option value="">Select</option>
                <option>Rope</option>
                <option>Chain</option>
                <option>Stand</option>
              </select>
            </Field>
          </Grid>
        </Section>

        {/* PRICING */}
        <Section title="Pricing">
          <Grid>
            <Field label="Swing Price ($) *">
              <input type="number" step="0.01" name="swing_price" required />
            </Field>
            <Field label="Accessories Total ($)">
              <input type="number" step="0.01" name="accessory_price" />
            </Field>
            <Field label="Installation Fee ($)">
              <input type="number" step="0.01" name="installation_fee" />
            </Field>
            <Field label="Delivery Fee ($)">
              <input type="number" step="0.01" name="shipping_fee" />
            </Field>
          </Grid>
        </Section>

        {/* PHOTOS */}
        <Section title="Photos">
          <Field label="Upload Installation / Location Photos">
            <input type="file" name="photos[]" multiple />
          </Field>
        </Section>

        {/* CONFIRM */}
        <Section title="Confirmation">
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" required />
            I confirm the information provided is accurate.
          </label>

          <div className="mt-4">
            <Field label="Digital Signature *">
              <input name="signature" required />
            </Field>
          </div>
        </Section>

        {/* SUBMIT */}
        <button
          disabled={submitting}
          className="w-full bg-red-700 hover:bg-red-800 text-white py-4 rounded-lg font-bold text-lg transition"
        >
          {submitting ? "Submitting..." : "Submit Swing Order"}
        </button>
      </form>

      {/* FOOTER */}
      <div className="text-center text-sm text-gray-500 pt-4">
        Need help? Use live chat for the fastest assistance.
      </div>
    </div>
  );
}

/* ===============================
   UI HELPERS
================================ */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-bold">{title}</h3>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="text-gray-700 font-medium">{label}</span>
      <div className="mt-1 [&>input,&>select]:w-full [&>input,&>select]:border [&>input,&>select]:rounded-md [&>input,&>select]:px-3 [&>input,&>select]:py-2 [&>input,&>select]:focus:outline-none [&>input,&>select]:focus:ring-2 [&>input,&>select]:focus:ring-red-600">
        {children}
      </div>
    </label>
  );
}

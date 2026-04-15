"use client";

import { useState } from "react";

export default function ContractorSignup() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: any) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    const form = e.target;

    const data = {
      name: form.name.value,
      phone: form.phone.value,
      email: form.email.value,
      business: form.business.value,
      website: form.website.value,
      address: form.address.value,
      city: form.city.value,
      state: form.state.value,
      zip: form.zip.value,
      coverage: form.coverage.value,
      experience: form.experience.value,
      services: Array.from(
        form.querySelectorAll('input[name="services"]:checked')
      ).map((el: any) => el.value),
      other_services: form.other_services.value,
      signature: form.signature.value,
      agreement: form.agreement.checked,
    };

    try {
      const res = await fetch("/api/contractor-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        form.reset();
        setSuccess(true);
      } else {
        alert("Something went wrong. Please try again.");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="form-container">
        <div className="form-title">Join the Contractor Network</div>
        <div className="form-sub">
          Tell us about your services and coverage area. We’ll notify you when
          opportunities become available in your area.
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="name" required />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input type="text" name="phone" required />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input type="email" name="email" required />
            </div>

            <div className="form-group">
              <label>Business Name (Optional)</label>
              <input type="text" name="business" />
            </div>

            <div className="form-group">
              <label>Website (Optional)</label>
              <input type="text" name="website" />
            </div>

            <div className="form-group full">
              <label>Street Address</label>
              <input type="text" name="address" required />
            </div>

            <div className="form-group">
              <label>City</label>
              <input type="text" name="city" required />
            </div>

            <div className="form-group">
              <label>State</label>
              <input type="text" name="state" required />
            </div>

            <div className="form-group">
              <label>ZIP Code</label>
              <input type="text" name="zip" required />
            </div>

            <div className="form-group full">
              <label>Coverage Area (cities or radius)</label>
              <input type="text" name="coverage" />
            </div>

            <div className="form-group full">
              <label>Experience (years or description)</label>
              <textarea name="experience" rows={3}></textarea>
            </div>
          </div>

          <div className="section-title" style={{ fontSize: '18px' }}>
            Services You Offer <span style={{fontSize: '14px', color: '#555', fontWeight: 'normal'}}>(Select all that apply)</span>
          </div>

          {/* SERVICE CATEGORIES */}
          <div className="section-title">General Handyman Services</div>
          <div className="checkbox-grid">
            <label><input type="checkbox" name="services" value="General home maintenance" /> General home maintenance</label>
            <label><input type="checkbox" name="services" value="Furniture assembly" /> Furniture assembly</label>
            <label><input type="checkbox" name="services" value="TV mounting" /> TV mounting</label>
            <label><input type="checkbox" name="services" value="Picture installation" /> Picture & mirror installation</label>
            <label><input type="checkbox" name="services" value="Minor carpentry" /> Minor carpentry work</label>
            <label><input type="checkbox" name="services" value="Small repairs" /> Small home repairs</label>
            <label><input type="checkbox" name="services" value="Door adjustments" /> Door adjustments & hardware</label>
            <label><input type="checkbox" name="services" value="Closet systems" /> Closet system installation</label>
            <label><input type="checkbox" name="services" value="Trim repair" /> Interior trim repairs</label>
          </div>

          <div className="section-title">Interior Home Repairs</div>
          <div className="checkbox-grid">
            <label><input type="checkbox" name="services" value="Drywall repair" /> Drywall repair</label>
            <label><input type="checkbox" name="services" value="Drywall install" /> Drywall installation</label>
            <label><input type="checkbox" name="services" value="Wall patching" /> Wall patching</label>
            <label><input type="checkbox" name="services" value="Ceiling repair" /> Ceiling repair</label>
            <label><input type="checkbox" name="services" value="Interior doors" /> Interior door installation</label>
            <label><input type="checkbox" name="services" value="Barn doors" /> Sliding barn door installation</label>
            <label><input type="checkbox" name="services" value="Baseboards" /> Baseboard installation</label>
            <label><input type="checkbox" name="services" value="Crown molding" /> Crown molding</label>
            <label><input type="checkbox" name="services" value="Interior trim" /> Interior trim carpentry</label>
            <label><input type="checkbox" name="services" value="Interior painting" /> Interior painting</label>
            <label><input type="checkbox" name="services" value="Cabinet install" /> Cabinet installation</label>
            <label><input type="checkbox" name="services" value="Cabinet repair" /> Cabinet repair</label>
            <label><input type="checkbox" name="services" value="Kitchen upgrades" /> Kitchen upgrades</label>
            <label><input type="checkbox" name="services" value="Bathroom repairs" /> Bathroom repairs</label>
          </div>

          <div className="section-title">Flooring Installation & Repair</div>
          <div className="checkbox-grid">
            <label><input type="checkbox" name="services" value="Hardwood" /> Hardwood flooring</label>
            <label><input type="checkbox" name="services" value="Laminate" /> Laminate flooring</label>
            <label><input type="checkbox" name="services" value="Vinyl" /> Vinyl plank flooring</label>
            <label><input type="checkbox" name="services" value="Tile" /> Tile flooring</label>
            <label><input type="checkbox" name="services" value="Floor repair" /> Floor repairs</label>
            <label><input type="checkbox" name="services" value="Subfloor" /> Subfloor repair</label>
            <label><input type="checkbox" name="services" value="Floor trim" /> Floor trim installation</label>
          </div>

          <div className="section-title">Window & Door Services</div>
          <div className="checkbox-grid">
            <label><input type="checkbox" name="services" value="Window install" /> Window installation</label>
            <label><input type="checkbox" name="services" value="Window replace" /> Window replacement</label>
            <label><input type="checkbox" name="services" value="Window trim" /> Window trim repair</label>
            <label><input type="checkbox" name="services" value="Exterior doors" /> Exterior door installation</label>
            <label><input type="checkbox" name="services" value="Interior doors" /> Interior door installation</label>
            <label><input type="checkbox" name="services" value="Sliding repair" /> Sliding door repair</label>
            <label><input type="checkbox" name="services" value="French doors" /> French door installation</label>
            <label><input type="checkbox" name="services" value="Door frame" /> Door frame repair</label>
            <label><input type="checkbox" name="services" value="Door hardware" /> Door hardware replacement</label>
          </div>

          <div className="section-title">Exterior Home Repairs</div>
          <div className="checkbox-grid">
            <label><input type="checkbox" name="services" value="Deck repair" /> Deck repair</label>
            <label><input type="checkbox" name="services" value="Deck install" /> Deck installation</label>
            <label><input type="checkbox" name="services" value="Fence repair" /> Fence repair</label>
            <label><input type="checkbox" name="services" value="Fence install" /> Fence installation</label>
            <label><input type="checkbox" name="services" value="Porch repair" /> Porch repair</label>
            <label><input type="checkbox" name="services" value="Porch install" /> Porch installation</label>
            <label><input type="checkbox" name="services" value="Gutter repair" /> Gutter repair</label>
            <label><input type="checkbox" name="services" value="Gutter install" /> Gutter installation</label>
            <label><input type="checkbox" name="services" value="Roof repair" /> Roof repair</label>
            <label><input type="checkbox" name="services" value="Siding repair" /> Siding repair</label>
            <label><input type="checkbox" name="services" value="Exterior trim" /> Exterior trim repair</label>
            <label><input type="checkbox" name="services" value="Exterior painting" /> Exterior painting</label>
          </div>

          <div className="section-title">Outdoor Improvements</div>
          <div className="checkbox-grid">
            <label><input type="checkbox" name="services" value="Pergola" /> Pergola construction</label>
            <label><input type="checkbox" name="services" value="Gazebo" /> Gazebo installation</label>
            <label><input type="checkbox" name="services" value="Patio" /> Patio construction</label>
            <label><input type="checkbox" name="services" value="Outdoor stairs" /> Outdoor stair repair</label>
            <label><input type="checkbox" name="services" value="Railings" /> Outdoor railing installation</label>
            <label><input type="checkbox" name="services" value="Backyard upgrades" /> Backyard upgrades</label>
            <label><input type="checkbox" name="services" value="Outdoor carpentry" /> Outdoor carpentry</label>
          </div>

          <div className="form-group full" style={{ marginTop: "15px" }}>
            <label>Other Services</label>
            <textarea name="other_services" rows={2}></textarea>
          </div>

          <div className="form-group full" style={{ marginTop: "20px" }}>
            <label>Digital Signature (Type your full name)</label>
            <input type="text" name="signature" required />
          </div>

          <div className="form-group full" style={{ marginTop: "10px" }}>
            <label style={{ fontWeight: "normal", display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <input type="checkbox" name="agreement" required style={{ marginTop: '4px' }} />
              I agree to be contacted by Doorplace USA via text message and email
              regarding job opportunities and updates. Message and data rates may apply.
            </label>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Submitting..." : "Submit Application"}
          </button>

          <div className="note">
            Opportunities are based on demand, location, and services offered.
          </div>
        </form>
      </div>

      {/* ===== SUCCESS OVERLAY ===== */}
      {success && (
        <div className="overlay">
          <div className="overlay-box">
            <div style={{ fontSize: '40px', color: 'green', marginBottom: '10px' }}>✓</div>
            <h2>You're All Set!</h2>
            <p style={{ marginTop: '10px', marginBottom: '20px', lineHeight: '1.5' }}>
              We’ve received your information.
              <br />
              We’ll reach out when opportunities are available in your area.
            </p>
            <small style={{ color: '#777', display: 'block', marginBottom: '20px' }}>
              Opportunities are based on location, demand, and services offered.
            </small>

            <button className="overlay-btn" onClick={() => setSuccess(false)}>
              Close Window
            </button>
          </div>
        </div>
      )}

      {/* ===== STYLES ===== */}
      <style jsx>{`
        .form-container {
          max-width: 900px;
          margin: 40px auto;
          background: #fff;
          padding: 30px;
          border-radius: 8px;
          border: 1px solid #ddd;
          font-family: "Times New Roman", serif;
        }

        .form-title {
          font-size: 28px;
          color: #b80d0d;
          margin-bottom: 10px;
          text-align: center;
          font-weight: bold;
        }

        .form-sub {
          text-align: center;
          margin-bottom: 25px;
          color: #555;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group.full {
          grid-column: 1 / -1;
        }

        label {
          margin-bottom: 5px;
          font-weight: bold;
        }

        input[type="text"],
        input[type="email"],
        textarea {
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 15px;
          width: 100%;
        }

        textarea {
          resize: vertical;
        }

        .section-title {
          margin-top: 25px;
          margin-bottom: 10px;
          font-weight: bold;
          color: #b80d0d;
        }

        .checkbox-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px 15px;
        }

        .checkbox-grid label {
          font-weight: normal;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          cursor: pointer;
        }

        .submit-btn {
          margin-top: 25px;
          width: 100%;
          padding: 14px;
          background: #b80d0d;
          color: #fff;
          border: none;
          font-size: 16px;
          border-radius: 5px;
          cursor: pointer;
          font-weight: bold;
        }

        .submit-btn:hover:not(:disabled) {
          background: #9c0b0b;
        }
        
        .submit-btn:disabled {
          background: #d46868;
          cursor: not-allowed;
        }

        .note {
          margin-top: 15px;
          font-size: 13px;
          color: #777;
          text-align: center;
        }

        .overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .overlay-box {
          background: #fff;
          padding: 40px;
          border-radius: 8px;
          text-align: center;
          max-width: 450px;
          font-family: sans-serif;
        }

        .overlay-box h2 {
          margin: 0;
          color: #333;
        }

        .overlay-btn {
          padding: 12px 24px;
          background: #000;
          color: #fff;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          width: 100%;
        }

        .overlay-btn:hover {
          background: #333;
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
          .checkbox-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
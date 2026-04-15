export default function Page() {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: `

<style>
.form-container{
  max-width:900px;
  margin:40px auto;
  background:#fff;
  padding:30px;
  border-radius:8px;
  border:1px solid #ddd;
  font-family:'Times New Roman', serif;
}

.form-title{
  font-size:28px;
  color:#b80d0d;
  margin-bottom:10px;
  text-align:center;
}

.form-sub{
  text-align:center;
  margin-bottom:25px;
  color:#555;
}

.form-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:15px;
}

.form-group{
  display:flex;
  flex-direction:column;
}

.form-group.full{
  grid-column:1 / -1;
}

label{
  margin-bottom:5px;
  font-weight:bold;
}

input, textarea{
  padding:10px;
  border:1px solid #ccc;
  border-radius:4px;
  font-size:15px;
}

textarea{
  resize:vertical;
}

.section-title{
  margin-top:25px;
  margin-bottom:10px;
  font-weight:bold;
  color:#b80d0d;
}

.checkbox-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:8px 20px;
}

.checkbox-grid label{
  font-weight:normal;
}

.submit-btn{
  margin-top:25px;
  width:100%;
  padding:14px;
  background:#b80d0d;
  color:#fff;
  border:none;
  font-size:16px;
  border-radius:5px;
  cursor:pointer;
}

.submit-btn:hover{
  background:#9c0b0b;
}

.note{
  margin-top:15px;
  font-size:13px;
  color:#777;
  text-align:center;
}

@media(max-width:768px){
  .form-grid{
    grid-template-columns:1fr;
  }
  .checkbox-grid{
    grid-template-columns:1fr;
  }
}
</style>

<div class="form-container">

  <div class="form-title">Join the Contractor Network</div>
  <div class="form-sub">
    Tell us about your services and coverage area. We’ll notify you when opportunities become available in your area.
  </div>

  <form id="contractorForm">

    <div class="form-grid">

      <div class="form-group">
        <label>Full Name</label>
        <input type="text" name="name" required>
      </div>

      <div class="form-group">
        <label>Phone Number</label>
        <input type="text" name="phone" required>
      </div>

      <div class="form-group">
        <label>Email Address</label>
        <input type="email" name="email" required>
      </div>

      <div class="form-group">
        <label>Business Name (Optional)</label>
        <input type="text" name="business">
      </div>

      <div class="form-group">
        <label>Website (Optional)</label>
        <input type="text" name="website">
      </div>

      <div class="form-group full">
        <label>Street Address</label>
        <input type="text" name="address" required>
      </div>

      <div class="form-group">
        <label>City</label>
        <input type="text" name="city" required>
      </div>

      <div class="form-group">
        <label>State</label>
        <input type="text" name="state" required>
      </div>

      <div class="form-group">
        <label>ZIP Code</label>
        <input type="text" name="zip" required>
      </div>

      <div class="form-group full">
        <label>Coverage Area (cities or radius)</label>
        <input type="text" name="coverage">
      </div>

      <div class="form-group full">
        <label>Experience (years or description)</label>
        <textarea name="experience"></textarea>
      </div>

    </div>

    <div class="section-title">Services You Offer (Select all that apply)</div>

    <div class="section-title">General Handyman Services</div>
    <div class="checkbox-grid">
      <label><input type="checkbox" name="services" value="General home maintenance"> General home maintenance</label>
      <label><input type="checkbox" name="services" value="Furniture assembly"> Furniture assembly</label>
      <label><input type="checkbox" name="services" value="TV mounting"> TV mounting</label>
      <label><input type="checkbox" name="services" value="Picture installation"> Picture & mirror installation</label>
      <label><input type="checkbox" name="services" value="Minor carpentry"> Minor carpentry work</label>
      <label><input type="checkbox" name="services" value="Small repairs"> Small home repairs</label>
      <label><input type="checkbox" name="services" value="Door adjustments"> Door adjustments & hardware</label>
      <label><input type="checkbox" name="services" value="Closet systems"> Closet system installation</label>
      <label><input type="checkbox" name="services" value="Trim repair"> Interior trim repairs</label>
    </div>

    <div class="section-title">Interior Home Repairs</div>
    <div class="checkbox-grid">
      <label><input type="checkbox" name="services" value="Drywall repair"> Drywall repair</label>
      <label><input type="checkbox" name="services" value="Drywall install"> Drywall installation</label>
      <label><input type="checkbox" name="services" value="Wall patching"> Wall patching</label>
      <label><input type="checkbox" name="services" value="Ceiling repair"> Ceiling repair</label>
      <label><input type="checkbox" name="services" value="Interior doors"> Interior door installation</label>
      <label><input type="checkbox" name="services" value="Barn doors"> Sliding barn door installation</label>
      <label><input type="checkbox" name="services" value="Baseboards"> Baseboard installation</label>
      <label><input type="checkbox" name="services" value="Crown molding"> Crown molding</label>
      <label><input type="checkbox" name="services" value="Interior trim"> Interior trim carpentry</label>
      <label><input type="checkbox" name="services" value="Interior painting"> Interior painting</label>
      <label><input type="checkbox" name="services" value="Cabinet install"> Cabinet installation</label>
      <label><input type="checkbox" name="services" value="Cabinet repair"> Cabinet repair</label>
      <label><input type="checkbox" name="services" value="Kitchen upgrades"> Kitchen upgrades</label>
      <label><input type="checkbox" name="services" value="Bathroom repairs"> Bathroom repairs</label>
    </div>

    <div class="section-title">Flooring Installation & Repair</div>
    <div class="checkbox-grid">
      <label><input type="checkbox" name="services" value="Hardwood"> Hardwood flooring</label>
      <label><input type="checkbox" name="services" value="Laminate"> Laminate flooring</label>
      <label><input type="checkbox" name="services" value="Vinyl"> Vinyl plank flooring</label>
      <label><input type="checkbox" name="services" value="Tile"> Tile flooring</label>
      <label><input type="checkbox" name="services" value="Floor repair"> Floor repairs</label>
      <label><input type="checkbox" name="services" value="Subfloor"> Subfloor repair</label>
      <label><input type="checkbox" name="services" value="Floor trim"> Floor trim installation</label>
    </div>

    <div class="section-title">Window & Door Services</div>
    <div class="checkbox-grid">
      <label><input type="checkbox" name="services" value="Window install"> Window installation</label>
      <label><input type="checkbox" name="services" value="Window replace"> Window replacement</label>
      <label><input type="checkbox" name="services" value="Window trim"> Window trim repair</label>
      <label><input type="checkbox" name="services" value="Exterior doors"> Exterior door installation</label>
      <label><input type="checkbox" name="services" value="Interior doors"> Interior door installation</label>
      <label><input type="checkbox" name="services" value="Sliding repair"> Sliding door repair</label>
      <label><input type="checkbox" name="services" value="French doors"> French door installation</label>
      <label><input type="checkbox" name="services" value="Door frame"> Door frame repair</label>
      <label><input type="checkbox" name="services" value="Door hardware"> Door hardware replacement</label>
    </div>

    <div class="section-title">Exterior Home Repairs</div>
    <div class="checkbox-grid">
      <label><input type="checkbox" name="services" value="Deck repair"> Deck repair</label>
      <label><input type="checkbox" name="services" value="Deck install"> Deck installation</label>
      <label><input type="checkbox" name="services" value="Fence repair"> Fence repair</label>
      <label><input type="checkbox" name="services" value="Fence install"> Fence installation</label>
      <label><input type="checkbox" name="services" value="Porch repair"> Porch repair</label>
      <label><input type="checkbox" name="services" value="Porch install"> Porch installation</label>
      <label><input type="checkbox" name="services" value="Gutter repair"> Gutter repair</label>
      <label><input type="checkbox" name="services" value="Gutter install"> Gutter installation</label>
      <label><input type="checkbox" name="services" value="Roof repair"> Roof repair</label>
      <label><input type="checkbox" name="services" value="Siding repair"> Siding repair</label>
      <label><input type="checkbox" name="services" value="Exterior trim"> Exterior trim repair</label>
      <label><input type="checkbox" name="services" value="Exterior painting"> Exterior painting</label>
    </div>

    <div class="section-title">Outdoor Improvements</div>
    <div class="checkbox-grid">
      <label><input type="checkbox" name="services" value="Pergola"> Pergola construction</label>
      <label><input type="checkbox" name="services" value="Gazebo"> Gazebo installation</label>
      <label><input type="checkbox" name="services" value="Patio"> Patio construction</label>
      <label><input type="checkbox" name="services" value="Outdoor stairs"> Outdoor stair repair</label>
      <label><input type="checkbox" name="services" value="Railings"> Outdoor railing installation</label>
      <label><input type="checkbox" name="services" value="Backyard upgrades"> Backyard upgrades</label>
      <label><input type="checkbox" name="services" value="Outdoor carpentry"> Outdoor carpentry</label>
    </div>

    <div class="form-group full" style="margin-top:15px;">
      <label>Other Services</label>
      <textarea name="other_services"></textarea>
    </div>

    <div class="form-group full" style="margin-top:20px;">
      <label>Digital Signature (Type your full name)</label>
      <input type="text" name="signature" required>
    </div>

    <div class="form-group full" style="margin-top:10px;">
      <label style="font-weight:normal;">
        <input type="checkbox" name="agreement" required style="margin-right:8px;">
        I agree to be contacted by Doorplace USA via text message and email regarding job opportunities and updates. Message and data rates may apply.
      </label>
    </div>

    <button type="submit" class="submit-btn">Submit</button>

    <div class="note">
      Opportunities are based on demand, location, and services offered.
    </div>

  </form>

</div>

        `,
      }}
    />
  );
}
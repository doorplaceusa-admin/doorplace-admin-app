(function () {

  const lastShown = localStorage.getItem("dp_popup_time");
  const seenThisSession = sessionStorage.getItem("dp_popup_seen");

  if (seenThisSession) return;
  if (lastShown && Date.now() - Number(lastShown) < 86400000) return;

  setTimeout(() => {

    const popup = document.createElement("div");

    popup.innerHTML = `
      <div id="dp-overlay" style="
        position:fixed;
        top:0;
        left:0;
        width:100%;
        height:100%;
        background:rgba(0,0,0,0.7);
        z-index:9999;
        display:flex;
        align-items:center;
        justify-content:center;
      ">
        <div style="
          background:#ffffff;
          padding:24px 18px;
          border-radius:12px;
          max-width:360px;
          width:90%;
          text-align:center;
          position:relative;
          font-family: Arial, sans-serif;
        ">

          <div style="font-size:24px;font-weight:700;margin-bottom:8px;">
            Request Your Quote Now
          </div>

          <div style="font-size:15px;margin-bottom:16px;color:#444;">
            Tell us what you're looking for and our team will review your request and follow up.
          </div>

          <input id="dp-name" placeholder="Full Name" style="width:100%;margin-bottom:10px;padding:12px;border:1px solid #ddd;border-radius:6px;">
          <input id="dp-phone" placeholder="Phone Number" style="width:100%;margin-bottom:10px;padding:12px;border:1px solid #ddd;border-radius:6px;">
          <input id="dp-email" placeholder="Email Address (optional)" style="width:100%;margin-bottom:10px;padding:12px;border:1px solid #ddd;border-radius:6px;">

          <input id="dp-street" placeholder="Street Address" style="width:100%;margin-bottom:10px;padding:12px;border:1px solid #ddd;border-radius:6px;">
          <input id="dp-city" placeholder="City" style="width:100%;margin-bottom:10px;padding:12px;border:1px solid #ddd;border-radius:6px;">

          <select id="dp-state" style="width:100%;margin-bottom:10px;padding:12px;border:1px solid #ddd;border-radius:6px;">
            <option value="">Select State</option>
            <option value="TX">Texas</option>
            <option value="CA">California</option>
            <option value="FL">Florida</option>
            <option value="NY">New York</option>
            <option value="IL">Illinois</option>
            <option value="GA">Georgia</option>
            <option value="OH">Ohio</option>
          </select>

          <input id="dp-zip" placeholder="Zip Code" style="width:100%;margin-bottom:10px;padding:12px;border:1px solid #ddd;border-radius:6px;">

          <div id="dp-contractor-box" style="display:none;margin-bottom:10px;text-align:left;font-size:13px;color:#444;">
            <div style="margin-bottom:6px;">
              Based on your location, this request may be handled by a local independent contractor rather than directly by Doorplace USA.
            </div>
            <label>
              <input type="checkbox" id="dp-contractor-check">
              I understand and agree
            </label>
          </div>

          <button id="dp-submit-btn" onclick="dpSubmit()" style="
            width:100%;
            background:#b80d0d;
            color:#fff;
            border:none;
            padding:14px;
            font-weight:600;
            border-radius:8px;
            cursor:pointer;
            font-size:16px;
          ">
            Submit Request
          </button>

          <div style="font-size:12px;color:#777;margin-top:10px;">
            No spam. Just a follow-up based on your request.
          </div>

          <div onclick="closeDpPopup()" style="
            position:absolute;
            top:10px;
            right:14px;
            cursor:pointer;
            font-size:18px;
            color:#999;
          ">✕</div>

        </div>
      </div>
    `;

    document.body.appendChild(popup);

    localStorage.setItem("dp_popup_time", Date.now());
    sessionStorage.setItem("dp_popup_seen", "true");

    setTimeout(() => {
      const phoneInput = document.getElementById("dp-phone");
      if (!phoneInput) return;

      phoneInput.addEventListener("input", function(e) {
        let x = e.target.value.replace(/\D/g, "").slice(0,10);
        let formatted = x;

        if (x.length > 6) {
          formatted = "(" + x.slice(0,3) + ") " + x.slice(3,6) + "-" + x.slice(6);
        } else if (x.length > 3) {
          formatted = "(" + x.slice(0,3) + ") " + x.slice(3);
        }

        e.target.value = formatted;
      });
    }, 100);

    document.getElementById("dp-state").addEventListener("change", function() {
      const contractorBox = document.getElementById("dp-contractor-box");

      if (this.value && this.value !== "TX") {
        contractorBox.style.display = "block";
      } else {
        contractorBox.style.display = "none";
        document.getElementById("dp-contractor-check").checked = false;
      }
    });

  }, 5000);
})();

function closeDpPopup() {
  const overlay = document.getElementById("dp-overlay");
  if (overlay) overlay.remove();
}

let dpSubmitting = false;

function dpSubmit() {

  if (dpSubmitting) return;
  dpSubmitting = true;

  const btn = document.getElementById("dp-submit-btn");
  if (btn) {
    btn.disabled = true;
    btn.innerText = "Submitting...";
  }

  const name = document.getElementById("dp-name").value;
  const phone = document.getElementById("dp-phone").value;
  const email = document.getElementById("dp-email").value;

  const street = document.getElementById("dp-street").value;
  const city = document.getElementById("dp-city").value;
  const state = document.getElementById("dp-state").value;
  const zip = document.getElementById("dp-zip").value;

  const contractorCheck = document.getElementById("dp-contractor-check");

  if (!name || !phone || !street || !city || !state || !zip) {
    alert("Please complete all required fields");
    return resetBtn();
  }

  if (state !== "TX" && !contractorCheck.checked) {
    alert("Please confirm before continuing");
    return resetBtn();
  }

  const formData = new FormData();

  const nameParts = name.split(" ");
  formData.append("first_name", nameParts[0] || "");
  formData.append("last_name", nameParts.slice(1).join(" ") || "");

  formData.append("phone", phone);
  formData.append("email", email || "");

  formData.append("street", street);
  formData.append("city", city);
  formData.append("state", state);
  formData.append("zip", zip);

  const routingType = state === "TX" ? "direct" : "contractor";
  formData.append("routing_type", routingType);

  formData.append("submission_type", "general_inquiry");

  fetch("https://tradepilot.doorplaceusa.com/api/leads/intake", {
    method: "POST",
    body: formData
  })
  .then(() => {
    document.getElementById("dp-overlay").innerHTML = `
      <div style="background:#fff;padding:40px;border-radius:12px;text-align:center;">
        <h2>Request Received ✅</h2>
        <p>We’ll review your request and follow up.</p>
      </div>
    `;
  })
  .catch(() => {
    document.getElementById("dp-overlay").innerHTML = `
      <div style="background:#fff;padding:40px;border-radius:12px;text-align:center;">
        <h2>Request Received ✅</h2>
        <p>We’ll review your request and follow up.</p>
      </div>
    `;
  });

  function resetBtn() {
    dpSubmitting = false;
    if (btn) {
      btn.disabled = false;
      btn.innerText = "Submit Request";
    }
  }
}
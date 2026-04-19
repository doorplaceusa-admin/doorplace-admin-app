(function () {
  // --- Tracking & Test Mode Logic ---
  if (!localStorage.getItem("dp_entry_page")) {
    localStorage.setItem("dp_entry_page", window.location.href);
  }

  const TEST_MODE = false;

  if (TEST_MODE) {
    localStorage.removeItem("dp_popup_time");
    sessionStorage.removeItem("dp_popup_seen");
  }

  const lastShown = localStorage.getItem("dp_popup_time");
  const seenThisSession = sessionStorage.getItem("dp_popup_seen");

  if (seenThisSession) return;
  if (lastShown && Date.now() - Number(lastShown) < 86400000) return;

  setTimeout(() => {
    const popup = document.createElement("div");
    popup.id = "dp-popup-container"; 

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

          <input id="dp-name" placeholder="Full Name" style="width:100%;margin-bottom:10px;padding:12px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box;">
          <input id="dp-phone" placeholder="Phone Number" style="width:100%;margin-bottom:10px;padding:12px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box;">
          <input id="dp-email" type="email" placeholder="Email Address" style="width:100%;margin-bottom:10px;padding:12px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box;">

          <input id="dp-street" placeholder="Street Address" style="width:100%;margin-bottom:10px;padding:12px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box;">
          <input id="dp-city" placeholder="City" style="width:100%;margin-bottom:10px;padding:12px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box;">

          <select id="dp-state" style="width:100%;margin-bottom:10px;padding:12px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box;">
            <option value="">Select State</option>
            <option value="AL">Alabama</option>
            <option value="AK">Alaska</option>
            <option value="AZ">Arizona</option>
            <option value="AR">Arkansas</option>
            <option value="CA">California</option>
            <option value="CO">Colorado</option>
            <option value="CT">Connecticut</option>
            <option value="DE">Delaware</option>
            <option value="FL">Florida</option>
            <option value="GA">Georgia</option>
            <option value="HI">Hawaii</option>
            <option value="ID">Idaho</option>
            <option value="IL">Illinois</option>
            <option value="IN">Indiana</option>
            <option value="IA">Iowa</option>
            <option value="KS">Kansas</option>
            <option value="KY">Kentucky</option>
            <option value="LA">Louisiana</option>
            <option value="ME">Maine</option>
            <option value="MD">Maryland</option>
            <option value="MA">Massachusetts</option>
            <option value="MI">Michigan</option>
            <option value="MN">Minnesota</option>
            <option value="MS">Mississippi</option>
            <option value="MO">Missouri</option>
            <option value="MT">Montana</option>
            <option value="NE">Nebraska</option>
            <option value="NV">Nevada</option>
            <option value="NH">New Hampshire</option>
            <option value="NJ">New Jersey</option>
            <option value="NM">New Mexico</option>
            <option value="NY">New York</option>
            <option value="NC">North Carolina</option>
            <option value="ND">North Dakota</option>
            <option value="OH">Ohio</option>
            <option value="OK">Oklahoma</option>
            <option value="OR">Oregon</option>
            <option value="PA">Pennsylvania</option>
            <option value="RI">Rhode Island</option>
            <option value="SC">South Carolina</option>
            <option value="SD">South Dakota</option>
            <option value="TN">Tennessee</option>
            <option value="TX">Texas</option>
            <option value="UT">Utah</option>
            <option value="VT">Vermont</option>
            <option value="VA">Virginia</option>
            <option value="WA">Washington</option>
            <option value="WV">West Virginia</option>
            <option value="WI">Wisconsin</option>
            <option value="WY">Wyoming</option>
          </select>

          <input id="dp-zip" placeholder="Zip Code" style="width:100%;margin-bottom:10px;padding:12px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box;">

          <div id="dp-contractor-box" style="display:none;margin-bottom:10px;text-align:left;font-size:13px;color:#444;">
            <div style="margin-bottom:6px;">
              Based on your location, this request may be handled by a local independent contractor rather than directly by Doorplace USA.
            </div>
            <label>
              <input type="checkbox" id="dp-contractor-check">
              I understand and agree
            </label>
          </div>

          <button id="dp-submit-btn" style="
            width:100%;
            background:#b80d0d;
            color:#fff;
            border:none;
            padding:14px;
            font-weight:600;
            border-radius:8px;
            cursor:pointer;
            font-size:16px;
            box-sizing:border-box;
          ">
            Submit Request
          </button>

          <div style="font-size:12px;color:#777;margin-top:10px;">
            No spam. Just a follow-up based on your request.
          </div>

          <div id="dp-close-btn" style="
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

    if (!TEST_MODE) {
      localStorage.setItem("dp_popup_time", Date.now());
      sessionStorage.setItem("dp_popup_seen", "true");
    }

    // Initialize all event listeners after DOM injection
    setTimeout(() => {
      
      // 1. Phone Formatting
      const phoneInput = document.getElementById("dp-phone");
      if (phoneInput) {
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
      }

      // 2. State selection disclaimer logic
      const stateSelect = document.getElementById("dp-state");
      if (stateSelect) {
        stateSelect.addEventListener("change", function() {
          const contractorBox = document.getElementById("dp-contractor-box");

          if (this.value && this.value !== "TX") {
            contractorBox.style.display = "block";
          } else {
            contractorBox.style.display = "none";
            document.getElementById("dp-contractor-check").checked = false;
          }
        });
      }

      // 3. Close Popup functionality
      const closeBtn = document.getElementById("dp-close-btn");
      if (closeBtn) {
        closeBtn.addEventListener("click", function() {
          const overlay = document.getElementById("dp-popup-container");
          if (overlay) overlay.remove();
        });
      }

      // 4. Form Submission functionality
      const submitBtn = document.getElementById("dp-submit-btn");
      let dpSubmitting = false; 

      if (submitBtn) {
        submitBtn.addEventListener("click", function() {
          if (dpSubmitting) return;
          dpSubmitting = true;

          submitBtn.disabled = true;
          submitBtn.innerText = "Submitting...";

          const name = document.getElementById("dp-name").value.trim();
          const phone = document.getElementById("dp-phone").value.trim();
          const email = document.getElementById("dp-email").value.trim();
          const street = document.getElementById("dp-street").value.trim();
          const city = document.getElementById("dp-city").value.trim();
          const state = document.getElementById("dp-state").value;
          const zip = document.getElementById("dp-zip").value.trim();
          const contractorCheck = document.getElementById("dp-contractor-check");

          const resetBtn = () => {
            dpSubmitting = false;
            submitBtn.disabled = false;
            submitBtn.innerText = "Submit Request";
          };

          if (!name || !phone || !email || !street || !city || !state || !zip) {
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
          formData.append("email", email); 

          formData.append("street", street);
          formData.append("city", city);
          formData.append("state", state);
          formData.append("zip", zip);

          const routingType = state === "TX" ? "direct" : "contractor";
          const entryPage = localStorage.getItem("dp_entry_page") || window.location.href;

          formData.append("routing_type", routingType);
          formData.append("submission_type", "popup");
          formData.append("lead_type", "popup");
          formData.append("entry_page", entryPage);
          formData.append("source", "popup");

          fetch("https://tradepilot.doorplaceusa.com/api/leads/intake", {
            method: "POST",
            body: formData
          })
          .then(async (response) => {
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Server responded with ${response.status}: ${errorText}`);
            }
            document.getElementById("dp-overlay").innerHTML = `
              <div style="background:#fff;padding:40px;border-radius:12px;text-align:center;">
                <h2>Request Received ✅</h2>
                <p>We’ll review your request and follow up.</p>
              </div>
            `;
          })
          .catch((err) => {
            // Check your F12 Developer Console for this error message!
            console.error("Submission Error:", err); 
            
            document.getElementById("dp-overlay").innerHTML = `
              <div style="background:#fff;padding:40px;border-radius:12px;text-align:center;">
                <h2>Something went wrong ❌</h2>
                <p>We couldn't submit your request at this time. Please check your connection and try again.</p>
                <button onclick="document.getElementById('dp-popup-container').remove()" style="margin-top:15px;padding:10px 20px;border:none;background:#ccc;border-radius:6px;cursor:pointer;">Close</button>
              </div>
            `;
          });
        });
      }

    }, 100);

  }, 5000);
})();
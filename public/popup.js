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
          max-width:340px;
          width:90%;
          text-align:center;
          position:relative;
          font-family: Arial, sans-serif;
        ">

          <div style="font-size:24px;font-weight:700;margin-bottom:8px;">
            Get Your Exact Price
          </div>

          <div style="font-size:15px;margin-bottom:16px;color:#444;">
            Tell us what you're looking for and we’ll text you your exact quote.
          </div>

          <input id="dp-name" placeholder="Full Name" style="
            width:100%;
            margin-bottom:10px;
            padding:12px;
            border:1px solid #ddd;
            border-radius:6px;
          ">

          <input id="dp-phone" placeholder="Phone Number" style="
            width:100%;
            margin-bottom:10px;
            padding:12px;
            border:1px solid #ddd;
            border-radius:6px;
          ">

          <input id="dp-email" placeholder="Email Address (optional)" style="
            width:100%;
            margin-bottom:10px;
            padding:12px;
            border:1px solid #ddd;
            border-radius:6px;
          ">

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
            Get My Price
          </button>

          <div style="font-size:12px;color:#777;margin-top:10px;">
            We’ll text you — no spam.
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

    // 📞 PHONE FORMAT
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

  }, 5000);
})();

function closeDpPopup() {
  const overlay = document.getElementById("dp-overlay");
  if (overlay) overlay.remove();
}

// 🔴 PREVENT DOUBLE SUBMIT
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

  if (!name || !phone) {
    alert("Please enter your info");
    dpSubmitting = false;
    if (btn) {
      btn.disabled = false;
      btn.innerText = "Get My Price";
    }
    return;
  }

  const formData = new FormData();

  const nameParts = name.split(" ");
  formData.append("first_name", nameParts[0] || "");
  formData.append("last_name", nameParts.slice(1).join(" ") || "");

  formData.append("phone", phone);
  formData.append("email", email || "");
  formData.append("submission_type", "general_inquiry");

  // 🔥 TRACKING
  const entry = localStorage.getItem("dp_entry_page") || "";

  let pathArray = [];
  try {
    pathArray = JSON.parse(localStorage.getItem("dp_page_path") || "[]");
  } catch (e) {}

  const pathString = pathArray.join(" → ");

  formData.append("entry_page", entry);
  formData.append("page_path", pathString);

  fetch("https://tradepilot.doorplaceusa.com/api/leads/intake", {
    method: "POST",
    body: formData
  })
  .then((res) => {
    if (res.ok) {
      document.getElementById("dp-overlay").innerHTML = `
        <div style="background:#fff;padding:40px;border-radius:12px;text-align:center;">
          <h2>You're In ✅</h2>
          <p>We’ll text you shortly with your price.</p>
        </div>
      `;
    } else {
      throw new Error("Server error");
    }
  })
  .catch((err) => {
    console.error(err);

    document.getElementById("dp-overlay").innerHTML = `
      <div style="background:#fff;padding:40px;border-radius:12px;text-align:center;">
        <h2>You're In ✅</h2>
        <p>We’ll text you shortly.</p>
      </div>
    `;
  });
}
(function () {
  if (localStorage.getItem("dp_discount_popup")) return;

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
          padding:30px 24px;
          border-radius:14px;
          max-width:420px;
          width:92%;
          text-align:center;
          position:relative;
          font-family: Arial, sans-serif;
        ">

          <!-- 🎥 VIDEO (FIXED HEIGHT + CROPPED) -->
          <div style="
  width:100%;
  height:180px;
  display:flex;
  align-items:center;
  justify-content:center;
  margin-bottom:15px;
">
  <video autoplay muted loop playsinline style="
    max-width:100%;
    max-height:100%;
    border-radius:10px;
    object-fit:contain;
    background:#000;
  ">
    <source src="https://cdn.shopify.com/videos/c/o/v/cd3df8d6c9324b0ab1b66f84b35d7203.mov" type="video/mp4">
  </video>
</div>

          <div style="font-size:26px;font-weight:700;margin-bottom:8px;">
            Unlock Your Custom Discount
          </div>

          <div style="font-size:16px;margin-bottom:18px;color:#444;">
            Exclusive pricing available for your door, swing, or automatic system
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

          <input id="dp-email" placeholder="Email Address" style="
            width:100%;
            margin-bottom:14px;
            padding:12px;
            border:1px solid #ddd;
            border-radius:6px;
          ">

          <button onclick="dpSubmit()" style="
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
            Reveal My Discount
          </button>

          <div style="
            margin-top:12px;
            font-size:13px;
            color:#666;
          ">
            We’ll text you shortly to go over your project and apply your custom discount
          </div>

          <div onclick="this.closest('#dp-overlay').remove()" style="
            position:absolute;
            top:12px;
            right:16px;
            cursor:pointer;
            font-size:18px;
            color:#999;
          ">✕</div>

        </div>
      </div>
    `;

    document.body.appendChild(popup);
  }, 5000);
})();

function dpSubmit() {
  const name = document.getElementById("dp-name").value;
  const phone = document.getElementById("dp-phone").value;
  const email = document.getElementById("dp-email").value;

  if (!name || !phone) {
    alert("Please enter your info");
    return;
  }

  const formData = new FormData();

  const nameParts = name.split(" ");
  formData.append("first_name", nameParts[0] || "");
  formData.append("last_name", nameParts.slice(1).join(" ") || "");

  formData.append("phone", phone);
  formData.append("email", email || "");
  formData.append("submission_type", "general_inquiry");

  fetch("https://tradepilot.doorplaceusa.com/api/leads/intake", {
    method: "POST",
    body: formData
  });

  document.getElementById("dp-overlay").innerHTML = `
    <div style="
      background:#fff;
      padding:40px;
      border-radius:12px;
      text-align:center;
    ">
      <h2 style="margin-bottom:10px;">You're In ✅</h2>
      <p>We’ll text you shortly to go over your project and apply your custom discount.</p>
    </div>
  `;

  localStorage.setItem("dp_discount_popup", "true");
}
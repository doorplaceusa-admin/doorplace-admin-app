(function () {

  const lastShown = localStorage.getItem("dp_popup_time");

  // ⏱️ 24-hour reset (FIXED string issue)
  if (lastShown && Date.now() - Number(lastShown) < 86400000) return;

  setTimeout(() => {

    // 🔥 VARIANTS
    const variants = [
      {
        headline: "Unlock Your Custom Discount",
        sub: "Exclusive pricing available for your door, swing, or automatic system",
        button: "Get My Price + Discount"
      },
      {
        headline: "Get a Fast Price for Your Project",
        sub: "We’ll text you a custom quote for your door or swing",
        button: "Get My Quote"
      },
      {
        headline: "See Your Exact Price Today",
        sub: "No guessing — we’ll send your real price based on your project",
        button: "See My Price"
      }
    ];

    // 🎯 RANDOM PICK
    const vIndex = Math.floor(Math.random() * variants.length);
    const v = variants[vIndex];

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
          padding:22px 18px;
          border-radius:14px;
          max-width:360px;
          width:88%;
          text-align:center;
          position:relative;
          font-family: Arial, sans-serif;
        ">

          <!-- 🎥 VIDEO -->
          <div style="
            width:100%;
            height:160px;
            display:flex;
            align-items:center;
            justify-content:center;
            margin-bottom:15px;
            border-radius:10px;
            overflow:hidden;
            background:#f5f5f5;
          ">
            <video autoplay muted loop playsinline style="
              max-width:100%;
              max-height:100%;
              object-fit:contain;
            ">
              <source src="https://cdn.shopify.com/videos/c/o/v/cd3df8d6c9324b0ab1b66f84b35d7203.mov" type="video/quicktime">
            </video>
          </div>

          <div style="font-size:26px;font-weight:700;margin-bottom:8px;">
            ${v.headline}
          </div>

          <div style="font-size:16px;margin-bottom:18px;color:#444;">
            ${v.sub}
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

          <button onclick="dpSubmit(${vIndex})" style="
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
            ${v.button}
          </button>

          <div style="
            margin-top:12px;
            font-size:13px;
            color:#666;
          ">
            Limited build slots available this week — we’ll text you shortly to lock in your pricing
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

    // 📞 PHONE FORMATTER
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

function dpSubmit(variantIndex) {
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

  // 🔥 TRACK VARIANT
  formData.append("popup_variant", "variant_" + variantIndex);

  fetch("https://tradepilot.doorplaceusa.com/api/leads/intake", {
    method: "POST",
    body: formData
  })
  .then(() => {
    console.log("Lead sent");
  })
  .catch(() => {
    alert("Something went wrong. Please try again.");
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

  // ⏱️ Save timestamp
  localStorage.setItem("dp_popup_time", Date.now());
}
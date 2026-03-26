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
          padding:35px 28px;
          border-radius:14px;
          max-width:420px;
          width:92%;
          text-align:center;
          position:relative;
          font-family: Arial, sans-serif;
        ">

          <div style="font-size:28px;font-weight:700;margin-bottom:8px;">
            $150 OFF
          </div>

          <div style="font-size:16px;margin-bottom:18px;color:#444;">
            Unlock exclusive pricing on your custom door or swing
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
            Unlock My Discount
          </button>

          <div style="
            margin-top:12px;
            font-size:12px;
            color:#777;
          ">
            Limited build slots available
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

  if (!name || !phone) {
    alert("Please enter your info");
    return;
  }

  fetch("https://tradepilot.doorplaceusa.com/api/leads", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name,
      phone,
      source: "popup_discount"
    })
  });

  document.getElementById("dp-overlay").innerHTML = `
    <div style="
      background:#fff;
      padding:40px;
      border-radius:12px;
      text-align:center;
    ">
      <h2 style="margin-bottom:10px;">You're In ✅</h2>
      <p>We’ll reach out shortly with your discounted pricing.</p>
    </div>
  `;

  localStorage.setItem("dp_discount_popup", "true");
}
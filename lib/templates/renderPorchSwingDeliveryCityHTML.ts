type CityLink = {
  city: string;
  slug: string;
};

type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  slug: string;
  nearbyCities?: CityLink[];
  heroImageUrl?: string | null;
};

export function renderPorchSwingDeliveryCityHTML({
  city,
  state,
  stateCode,
  heroImageUrl,
}: RenderProps): string {
  return `
<div style="max-width:900px;margin:0 auto;padding:20px;font-family:'Times New Roman',serif;">

  ${
    heroImageUrl
      ? `
    <div style="text-align:center;margin-bottom:25px;">
      <img src="${heroImageUrl}" 
           alt="Porch Swing Delivery in ${city}, ${stateCode}" 
           style="width:100%;max-width:850px;border-radius:6px;" />
    </div>
    `
      : ""
  }

  <h1 style="color:#b80d0d;font-size:34px;margin-bottom:10px;">
    Porch Swing Delivery in ${city}, ${stateCode}
  </h1>

  <p style="font-size:18px;line-height:1.8;">
    Looking for <strong>porch swing delivery in ${city}, ${stateCode}</strong>?  
    Doorplace USA builds and ships heavy-duty wooden porch swings directly to homes in ${city} and across ${state}.
    Every swing is handcrafted, reinforced, and built for real outdoor living.
  </p>

  <div style="border:2px solid #b80d0d;padding:18px;background:#fdf6f6;margin:28px 0;border-radius:6px;">
    <strong>Fast Quote & Ordering:</strong><br/>
    Use our <strong>live chat</strong> or request pricing at  
    <a href="https://doorplaceusa.com/pages/get-a-fast-quote" style="color:#b80d0d;font-weight:bold;">
      Get a Fast Quote
    </a>
  </div>

  <h2 style="color:#b80d0d;">Why ${city} Customers Choose Doorplace USA</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Built-to-order solid wood porch swings</li>
    <li>Nationwide shipping with careful packaging</li>
    <li>Weather-ready stains designed for ${state}</li>
    <li>Crib, Twin, and Full swing sizes</li>
    <li>Real support & live chat — no call centers</li>
  </ul>

  <h2 style="color:#b80d0d;">Porch Swing Sizes We Deliver</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li><strong>Crib:</strong> 30” × 57”</li>
    <li><strong>Twin:</strong> 40” × 81”</li>
    <li><strong>Full:</strong> 57” × 81”</li>
  </ul>
  <p style="font-size:14px;color:#555;">* Dimensions may vary slightly by design.</p>

  <h2 style="color:#b80d0d;">Shipping & Delivery to ${city}</h2>
  <p style="font-size:16px;line-height:1.8;">
    Doorplace USA ships porch swings to homes in ${city} and throughout ${state}.  
    Swings are carefully packed and delivered ready for installation, with guidance on
    beam spacing, hanging height, and hardware selection.
  </p>

  <h2 style="color:#b80d0d;">Helpful Resources</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li><a href="https://doorplaceusa.com/pages/porch-swing-stain-guide" style="color:#b80d0d;">Stain Color Guide</a></li>
    <li><a href="https://doorplaceusa.com/pages/cushion-guide" style="color:#b80d0d;">Cushion Guide</a></li>
    <li><a href="https://doorplaceusa.com/pages/how-to-install-a-porch-swing" style="color:#b80d0d;">Installation Instructions</a></li>
  </ul>

  <p style="margin-top:30px;font-size:16px;line-height:1.8;">
    Whether you live in <strong>${city}</strong> or anywhere in ${state},  
    Doorplace USA provides professional-grade porch swing delivery nationwide.
  </p>

  <div style="margin-top:40px;text-align:center;">
    <a
      href="https://doorplaceusa.com/pages/get-a-fast-quote"
      style="background:#b80d0d;color:#fff;padding:14px 34px;font-size:18px;text-decoration:none;border-radius:6px;display:inline-block;">
      Get a Fast Quote
    </a>
  </div>

</div>
`;
}

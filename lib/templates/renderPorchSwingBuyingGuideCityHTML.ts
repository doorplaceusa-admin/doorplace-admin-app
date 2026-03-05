type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  heroImageUrl?: string | null;
};

export function renderPorchSwingBuyingGuideCityHTML({
  city,
  state,
  stateCode,
  heroImageUrl,
}: RenderProps): string {

return `
<div style="max-width:900px;margin:0 auto;padding:25px;font-family:'Times New Roman',serif;">

<h1 style="color:#b80d0d;font-size:34px;">
Porch Swing Buying Guide for ${city}, ${stateCode}
</h1>

<p style="font-size:17px;line-height:1.8;">
Choosing the right porch swing involves understanding size,
materials, mounting methods, and comfort features.
</p>

<h2 style="color:#b80d0d;">Choose the Right Size</h2>

<ul style="line-height:1.9;font-size:16px;">
<li>Crib swings</li>
<li>Twin swings</li>
<li>Full daybed swings</li>
<li>Queen swings</li>
</ul>

<h2 style="color:#b80d0d;">Best Materials for Porch Swings</h2>

<p style="font-size:16px;line-height:1.8;">
Solid hardwood swings provide durability and natural beauty.
Weather-resistant finishes help protect swings from outdoor elements.
</p>

<h2 style="color:#b80d0d;">Mounting Options</h2>

<ul style="line-height:1.9;font-size:16px;">
<li>Ceiling mounted swings</li>
<li>Pergola installations</li>
<li>Freestanding swing frames</li>
</ul>

<div style="text-align:center;margin-top:30px;">
<a href="https://doorplaceusa.com/pages/get-a-fast-quote"
style="background:#b80d0d;color:#fff;padding:15px 34px;font-size:18px;
text-decoration:none;border-radius:8px;">
Request Pricing
</a>
</div>

</div>
`;
}
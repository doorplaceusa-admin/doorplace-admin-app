type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  heroImageUrl?: string | null;
};

export function renderPorchSwingBestCityHTML({
  city,
  state,
  stateCode,
  heroImageUrl,
}: RenderProps): string {

return `
<div style="max-width:900px;margin:0 auto;padding:25px;font-family:'Times New Roman',serif;">

${heroImageUrl ? `
<div style="text-align:center;margin-bottom:20px;">
<img src="${heroImageUrl}" alt="Best porch swings in ${city}, ${stateCode}"
style="width:100%;max-width:650px;border-radius:10px;" />
</div>` : ""}

<h1 style="color:#b80d0d;font-size:36px;text-align:center;">
Best Porch Swings in ${city}, ${stateCode}
</h1>

<p style="font-size:18px;line-height:1.7;text-align:center;">
Homeowners in ${city}, ${state} are choosing handcrafted porch swings to
create relaxing outdoor spaces. Choosing the best porch swing depends on
size, materials, comfort, and the style of your home.
</p>

<div style="text-align:center;margin-top:25px;">
<a href="https://doorplaceusa.com/pages/get-a-fast-quote"
style="background:#b80d0d;color:#fff;padding:14px 30px;font-size:18px;
text-decoration:none;border-radius:6px;">
Get Pricing for ${city}
</a>
</div>

<h2 style="color:#b80d0d;margin-top:40px;">Popular Porch Swing Styles</h2>

<ul style="line-height:1.9;font-size:16px;">
<li><strong>Daybed swings</strong> for full body relaxation</li>
<li><strong>Farmhouse swings</strong> with rustic character</li>
<li><strong>Modern swings</strong> for contemporary homes</li>
<li><strong>Oversized swings</strong> for families</li>
<li><strong>Luxury porch swings</strong> with premium materials</li>
</ul>

<h2 style="color:#b80d0d;">What Makes a Porch Swing the Best Choice?</h2>

<p style="font-size:16px;line-height:1.8;">
The best porch swings combine comfort, strength, and design.
High-quality swings use durable hardwoods, reinforced joints,
and balanced suspension systems.
</p>

<h2 style="color:#b80d0d;">Choosing the Right Porch Swing for Your Home</h2>

<p style="font-size:16px;line-height:1.8;">
Porch swings can be installed on front porches, patios,
pergolas, gazebos, and backyard structures across ${city}.
Selecting the right size and mounting method ensures long-term safety.
</p>

<h2 style="color:#b80d0d;">Helpful Resources</h2>

<ul style="line-height:1.9;font-size:16px;">
<li><a href="https://doorplaceusa.com/pages/porch-swings" style="color:#b80d0d;">Custom Porch Swings</a></li>
<li><a href="https://doorplaceusa.com/pages/how-to-install-a-porch-swing" style="color:#b80d0d;">Installation Guide</a></li>
<li><a href="https://doorplaceusa.com/pages/wood-stain-colors" style="color:#b80d0d;">Wood Stain Colors</a></li>
</ul>

<div style="text-align:center;margin-top:40px;">
<a href="https://doorplaceusa.com/pages/get-a-fast-quote"
style="background:#b80d0d;color:#fff;padding:15px 34px;font-size:18px;
text-decoration:none;border-radius:8px;">
Get a Fast Quote
</a>
</div>

</div>
`;
}
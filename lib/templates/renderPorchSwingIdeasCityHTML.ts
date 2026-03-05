type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  heroImageUrl?: string | null;
};

export function renderPorchSwingIdeasCityHTML({
  city,
  state,
  stateCode,
  heroImageUrl,
}: RenderProps): string {

return `
<div style="max-width:900px;margin:0 auto;padding:25px;font-family:'Times New Roman',serif;">

${heroImageUrl ? `
<div style="text-align:center;margin-bottom:20px;">
<img src="${heroImageUrl}" alt="Porch swing ideas in ${city}, ${stateCode}"
style="width:100%;max-width:650px;border-radius:10px;" />
</div>` : ""}

<h1 style="color:#b80d0d;font-size:36px;text-align:center;">
Porch Swing Ideas for Homes in ${city}, ${stateCode}
</h1>

<p style="font-size:18px;line-height:1.7;text-align:center;">
Porch swings can transform outdoor spaces in ${city}. From cozy reading
areas to luxury daybed swings, the right design creates a comfortable
place to relax.
</p>

<h2 style="color:#b80d0d;margin-top:35px;">Front Porch Swing Ideas</h2>

<ul style="line-height:1.9;font-size:16px;">
<li>Classic farmhouse porch swings</li>
<li>Painted wood swings</li>
<li>Traditional hanging swings</li>
</ul>

<h2 style="color:#b80d0d;">Backyard Swing Ideas</h2>

<ul style="line-height:1.9;font-size:16px;">
<li>Pergola mounted porch swings</li>
<li>Freestanding swings for gardens</li>
<li>Oversized swings for family seating</li>
</ul>

<h2 style="color:#b80d0d;">Modern Porch Swing Ideas</h2>

<p style="font-size:16px;line-height:1.8;">
Modern porch swings feature clean lines, minimalist hardware,
and neutral finishes that match contemporary homes across ${state}.
</p>

<div style="border:2px solid #b80d0d;padding:18px;background:#fdf6f6;margin:30px 0;border-radius:6px;">
<strong>Looking for inspiration?</strong><br/>
Doorplace USA builds custom porch swings designed for your home.
</div>

<div style="text-align:center;margin-top:30px;">
<a href="https://doorplaceusa.com/pages/get-a-fast-quote"
style="background:#b80d0d;color:#fff;padding:14px 30px;font-size:18px;
text-decoration:none;border-radius:6px;">
Get a Fast Quote
</a>
</div>

</div>
`;
}
type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
};

export function renderPorchSwingMaintenanceCityHTML({
  city,
  state,
  stateCode
}: RenderProps): string {

return `
<div style="max-width:850px;margin:0 auto;padding:20px;font-family:'Times New Roman',serif;">

<h1 style="color:#b80d0d;font-size:32px;">
Porch Swing Maintenance in ${city}, ${stateCode}
</h1>

<p style="font-size:17px;line-height:1.8;">
Proper maintenance helps keep porch swings safe, beautiful,
and comfortable for years.
</p>

<h2 style="color:#b80d0d;">Cleaning Your Porch Swing</h2>

<ul style="line-height:1.9;font-size:16px;">
<li>Wipe surfaces regularly</li>
<li>Use mild soap and water</li>
<li>Avoid harsh chemicals</li>
</ul>

<h2 style="color:#b80d0d;">Protecting Wood Swings</h2>

<p style="font-size:16px;line-height:1.8;">
Re-sealing wood swings every few years helps prevent
moisture damage and weathering.
</p>

<h2 style="color:#b80d0d;">Checking Hardware</h2>

<ul style="line-height:1.9;font-size:16px;">
<li>Inspect chains and ropes</li>
<li>Check bolts and mounts</li>
<li>Ensure level balance</li>
</ul>

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
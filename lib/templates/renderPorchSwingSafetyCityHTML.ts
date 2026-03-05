type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
};

export function renderPorchSwingSafetyCityHTML({
  city,
  state,
  stateCode
}: RenderProps): string {

return `
<div style="max-width:850px;margin:0 auto;padding:20px;font-family:'Times New Roman',serif;">

<h1 style="color:#b80d0d;font-size:32px;">
Porch Swing Safety Guide for ${city}, ${stateCode}
</h1>

<p style="font-size:17px;line-height:1.8;">
Safety is one of the most important factors when installing
a porch swing. Proper hardware and structural support
help prevent accidents.
</p>

<h2 style="color:#b80d0d;">Weight Capacity</h2>

<p style="font-size:16px;line-height:1.8;">
Always confirm the swing and mounting system support
the intended load.
</p>

<h2 style="color:#b80d0d;">Secure Mounting</h2>

<ul style="line-height:1.9;font-size:16px;">
<li>Install into structural beams</li>
<li>Use heavy-duty swing hardware</li>
<li>Maintain proper spacing</li>
</ul>

<h2 style="color:#b80d0d;">Routine Safety Checks</h2>

<ul style="line-height:1.9;font-size:16px;">
<li>Inspect chains and ropes</li>
<li>Check mounts regularly</li>
<li>Replace worn components</li>
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
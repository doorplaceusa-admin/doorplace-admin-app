type CityLink = {
  city: string;
  slug: string;
};

type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  slug: string;
  heroImageUrl?: string | null;
  nearbyCities?: CityLink[];
};

export function renderSlideDriveCityHTML({
  city,
  state,
  stateCode,
  heroImageUrl,
  nearbyCities
}: RenderProps): string {

return `

<style>

.dp-slide-page * {box-sizing:border-box;}

.dp-slide-hero{
display:grid;
grid-template-columns:1fr 1fr;
gap:30px;
align-items:center;
margin-bottom:40px;
}

.dp-slide-title{
font-size:46px;
color:#111;
margin-bottom:10px;
}

.dp-slide-sub{
font-size:22px;
color:#b80d0d;
margin-bottom:18px;
}

.dp-slide-lead{
font-size:19px;
max-width:640px;
}

.dp-media-box img{
width:100%;
border-radius:8px;
}

.dp-media-box{
border:1px solid #ddd;
border-radius:8px;
background:#fafafa;
padding:10px;
}

.dp-section{
margin-top:40px;
}

.dp-section h2{
font-size:34px;
margin-bottom:14px;
color:#111;
}

.dp-section h3{
font-size:24px;
color:#b80d0d;
margin-top:20px;
}

.dp-grid{
display:grid;
grid-template-columns:1fr 1fr;
gap:22px;
}

.dp-card{
border:1px solid #ddd;
border-radius:8px;
padding:18px;
background:#fff;
}

.dp-bullets{
padding-left:22px;
font-size:18px;
}

.dp-bullets li{
margin-bottom:10px;
}

.dp-spec{
width:100%;
border-collapse:collapse;
}

.dp-spec td{
border:1px solid #ddd;
padding:12px;
font-size:17px;
}

.dp-spec td:first-child{
background:#f7f7f7;
width:30%;
}

.dp-gallery{
display:grid;
grid-template-columns:1fr 1fr 1fr;
gap:20px;
margin-top:20px;
}

.dp-gallery img{
width:100%;
border-radius:8px;
}

@media(max-width:900px){
.dp-slide-hero,
.dp-grid,
.dp-gallery{
grid-template-columns:1fr;
}
}

</style>

<div style="max-width:1200px;margin:0 auto;padding:24px;font-family:'Times New Roman',serif;color:#222;line-height:1.75;background:#fff;">

<div class="dp-slide-page">

<div class="dp-slide-hero">

<div>

<div class="dp-slide-title">SlideDrive™ Automatic Barn Door System in ${city}, ${stateCode}</div>

<div class="dp-slide-sub">Smart Automation for Sliding Barn Doors</div>

<p class="dp-slide-lead">
The SlideDrive™ Automatic Barn Door System is a compact automation solution designed to open and close interior sliding barn doors smoothly and reliably for homes and businesses in ${city}, ${state}. Instead of using large overhead motors or complex track replacements, SlideDrive™ connects near the floor guide area and uses a drive wheel to move the door along its existing rail.
</p>

<p class="dp-slide-lead">
This allows homeowners in ${city} to upgrade their sliding barn doors with modern automation while keeping the existing rail hardware already installed.
</p>

</div>

<div>

${
heroImageUrl
? `
<div class="dp-media-box">
<img src="${heroImageUrl}" alt="Automatic barn door system in ${city}, ${stateCode}">
</div>
`
: ""
}

</div>

</div>


<div class="dp-section">

<h2>Product Overview</h2>

<p>
SlideDrive™ is designed to automate sliding barn doors without requiring major structural changes. The drive system works alongside the existing overhead barn door rail while the motorized drive wheel moves the door smoothly across the opening.
</p>

<p>
Because the system stays compact and positioned near the floor guide area, it avoids the bulky look of overhead operators while still delivering reliable automatic door movement.
</p>

</div>


<div class="dp-section">

<h2>How the System Works</h2>

<div class="dp-grid">

<div class="dp-card">
<h3>Drive Wheel System</h3>
<p>A motorized friction drive wheel applies controlled pressure against the door to move it open or closed.</p>
</div>

<div class="dp-card">
<h3>Floor Guide Alignment</h3>
<p>The drive system operates near the floor guide location while the door continues to ride on the existing overhead rail.</p>
</div>

<div class="dp-card">
<h3>Adjustable Drive Pressure</h3>
<p>The pressure applied to the door can be adjusted depending on door weight and sliding resistance.</p>
</div>

<div class="dp-card">
<h3>Travel Stop Triggers</h3>
<p>Adjustable stops prevent the door from traveling too far when reaching open or closed positions.</p>
</div>

</div>

</div>


<div class="dp-section">

<h2>Core Features</h2>

<ul class="dp-bullets">

<li>Automatic open and close operation</li>
<li>Works with most standard barn door rail systems</li>
<li>Compact drive mechanism design</li>
<li>Adjustable pressure drive wheel</li>
<li>Optional protective housing</li>
<li>Travel stop triggers for safe operation</li>
<li>12V wall power adapter</li>
<li>Optional rechargeable battery system</li>

</ul>

</div>


<div class="dp-section">

<h2>Optional Upgrades</h2>

<div class="dp-grid">

<div class="dp-card">
<h3>Remote Control</h3>
<p>Open or close the door using a wireless handheld remote.</p>
</div>

<div class="dp-card">
<h3>Wall Button</h3>
<p>A push button can be installed on the wall for simple open and close operation.</p>
</div>

<div class="dp-card">
<h3>Motion Detection</h3>
<p>The door can automatically open when motion is detected near the doorway.</p>
</div>

<div class="dp-card">
<h3>Smart Home Integration</h3>
<p>Optional integration allows compatibility with Alexa and Google Home systems.</p>
</div>

</div>

</div>


<div class="dp-section">

<h2>Ideal Applications</h2>

<ul class="dp-bullets">

<li>Interior barn doors</li>
<li>Pantry sliding doors</li>
<li>Laundry room doors</li>
<li>Office sliding doors</li>
<li>Closet barn doors</li>
<li>Accessibility automation</li>

</ul>

</div>


<div class="dp-section">

<h2>Specifications</h2>

<table class="dp-spec">

<tbody>

<tr>
<td>Product Name</td>
<td>SlideDrive™ Automatic Barn Door System</td>
</tr>

<tr>
<td>Brand</td>
<td>Doorplace USA</td>
</tr>

<tr>
<td>Mounting Type</td>
<td>Guide Mounted Drive System</td>
</tr>

<tr>
<td>Drive Method</td>
<td>Motorized Friction Drive Wheel</td>
</tr>

<tr>
<td>Power</td>
<td>12V Power Adapter</td>
</tr>

<tr>
<td>Optional Power</td>
<td>Rechargeable Battery</td>
</tr>

<tr>
<td>Controls</td>
<td>Remote, Wall Button, Motion Sensor, Mobile App</td>
</tr>

<tr>
<td>Compatibility</td>
<td>Works with most standard barn door rails</td>
</tr>

</tbody>

</table>

</div>


${
nearbyCities && nearbyCities.length > 0
? `
<div class="dp-section">

<h2>Nearby Areas We Serve</h2>

<ul class="dp-bullets">

${nearbyCities
.slice(0,8)
.map(
(c)=>`
<li>
<a href="https://doorplaceusa.com/pages/${c.slug}" style="color:#b80d0d;">
Automatic Barn Door Systems in ${c.city}
</a>
</li>
`
)
.join("")}

</ul>

</div>
`
: ""
}


<div class="dp-section">

<h2>Ready to Upgrade Your Barn Door?</h2>

<p>
Homeowners and builders in ${city}, ${state} can upgrade their sliding barn doors with the SlideDrive™ automatic door system. The compact drive design allows smooth automation while maintaining the clean appearance of traditional barn door hardware.
</p>

<div style="margin-top:25px;text-align:center;">
<a href="https://doorplaceusa.com/pages/get-a-fast-quote"
style="background:#b80d0d;color:#fff;padding:15px 34px;font-size:18px;text-decoration:none;border-radius:8px;font-weight:bold;">
Request a Quote
</a>
</div>

</div>


</div>
</div>

`;
}
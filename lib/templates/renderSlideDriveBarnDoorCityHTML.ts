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
  nearbyCities
}: RenderProps): string {

return `

<div style="max-width:1200px;margin:0 auto;padding:24px;font-family:'Times New Roman',serif;color:#222;line-height:1.75;background:#fff;">

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

<div class="dp-slide-page">

<div class="dp-slide-hero">

<div>

<div class="dp-slide-title">Automatic Barn Door Opener in ${city}, ${stateCode}</div>

<div class="dp-slide-sub">Turn Any Sliding Barn Door Into a Smart Automatic Door</div>

<p class="dp-slide-lead">
The SlideDrive™ Automatic Barn Door Opener is a compact automation solution designed to open and close interior sliding barn doors smoothly and reliably for homes and businesses in ${city}, ${state}. Instead of large overhead motors or complicated track systems, SlideDrive™ connects near the floor guide area and uses a powered drive wheel to move the door along its existing rail.
</p>

<p class="dp-slide-lead">
This allows homeowners in ${city} to upgrade their sliding barn doors with modern automation while keeping the existing rail hardware already installed.
</p>

</div>

<div>

<div class="dp-media-box">
<img src="https://cdn.shopify.com/s/files/1/0549/2896/5713/files/7E4EC077-322F-41CA-8E84-F1D8C0D987E3.png?v=1773622412">
</div>

<br>

<div class="dp-media-box">
<img src="https://cdn.shopify.com/s/files/1/0549/2896/5713/files/3DC88EAA-266E-44FD-B550-58764F07A01F.png?v=1773622605">
</div>

</div>

</div>

<div class="dp-section">

<h2>Product Overview</h2>

<p>
The SlideDrive™ system connects directly to the barn door floor guide location at the bottom of the doorway. Instead of replacing the track or installing a ceiling mounted operator, the SlideDrive™ unit uses a powered friction drive wheel to move the door open and closed while the door continues riding on its existing overhead rail.
</p>

<p>
Because the drive unit stays stationary and the door slides past it, the system remains compact and simple to install.
</p>

<p>
For new installations, SlideDrive™ can be shipped with a compatible floor guide. For existing installations, the drive unit can connect to many standard floor guide setups already installed.
</p>

<div class="dp-gallery">

<img src="https://cdn.shopify.com/s/files/1/0549/2896/5713/files/B446062D-A83A-41ED-A372-4F18B97A848C.png?v=1773622604">

<img src="https://cdn.shopify.com/s/files/1/0549/2896/5713/files/54409CA0-875C-4F48-BC4A-EBE57E863213.png?v=1773622416">

<img src="https://cdn.shopify.com/s/files/1/0549/2896/5713/files/55B86FBC-0D1B-431F-BFD6-73E21C117D1F.png?v=1773622602">

</div>

</div>

<div class="dp-section">

<h2>How the System Works</h2>

<div class="dp-grid">

<div class="dp-card">
<h3>Guide Mounted Drive System</h3>
<p>SlideDrive™ connects directly to the barn door floor guide assembly at the base of the doorway.</p>
</div>

<div class="dp-card">
<h3>Powered Drive Wheel</h3>
<p>A motorized drive wheel applies controlled pressure against the door and moves it horizontally along the track.</p>
</div>

<div class="dp-card">
<h3>Adjustable Drive Pressure</h3>
<p>The system allows installers to increase or decrease wheel pressure against the door for proper performance depending on door weight and sliding resistance.</p>
</div>

<div class="dp-card">
<h3>Stop Triggers</h3>
<p>Adjustable stop triggers prevent the door from sliding too far once it reaches the open or closed position.</p>
</div>

</div>

</div>

<div class="dp-section">

<h2>Core Features</h2>

<ul class="dp-bullets">

<li>Automatic open and close door operation</li>
<li>Guide-mounted drive system that connects to the floor guide location</li>
<li>Works with most existing barn door rail systems</li>
<li>Adjustable wheel pressure for different door weights</li>
<li>Compact drive system design</li>
<li>Optional protective housing around drive mechanism</li>
<li>Travel stop triggers to prevent over-travel</li>
<li>12V power adapter standard</li>
<li>Optional rechargeable battery configuration</li>

</ul>

<div class="dp-gallery">

<img src="https://cdn.shopify.com/s/files/1/0549/2896/5713/files/526F0721-017D-4644-8458-8EF4C555A16B.png?v=1773622600">

<img src="https://cdn.shopify.com/s/files/1/0549/2896/5713/files/851317B9-D5E1-43C4-971F-5B416494747F.png?v=1773622413">

<img src="https://cdn.shopify.com/s/files/1/0549/2896/5713/files/DCAB43EF-B031-4E4F-88F8-CC5D4AE067B0_6ea51a15-208c-4a1b-86f4-029c1483757c.png?v=1773622415">

</div>

</div>

<div class="dp-section">

<h2>Ideal Applications</h2>

<ul class="dp-bullets">

<li>Interior barn doors</li>
<li>Pantry doors</li>
<li>Laundry room doors</li>
<li>Office sliding doors</li>
<li>Closet sliding doors</li>
<li>Accessibility automation</li>

</ul>

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
Automatic Barn Door Opener in ${c.city}
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
Homeowners and builders in ${city}, ${state} can upgrade their sliding barn doors with the SlideDrive™ automatic barn door opener system.
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
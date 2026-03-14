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
};

export function renderHomeRepairCityHTML({
  city,
  state,
  stateCode
}: RenderProps): string {

return `

<div style="max-width:950px;margin:0 auto;padding:30px;font-family:'Times New Roman',serif;">

<!-- HERO IMAGE -->

<div style="text-align:center;margin-bottom:25px;">
<img
src="https://cdn.shopify.com/s/files/1/0549/2896/5713/files/84F86B47-55B6-4071-A184-8541BA6C1629.png?v=1773489464"
alt="Home repair contractor working in ${city}, ${stateCode}"
style="width:100%;max-width:720px;border-radius:10px;"
/>
</div>

<h1 style="color:#b80d0d;font-size:38px;text-align:center;margin-bottom:10px;">
Home Repair Services in ${city}, ${stateCode}
</h1>

<p style="font-size:18px;line-height:1.8;text-align:center;">
Homeowners in ${city}, ${state} often need reliable professionals for repairs,
installations, and home improvement projects. Our network connects homeowners
with skilled contractors who handle a wide range of residential repairs,
maintenance work, and installations.
</p>

<!-- ================================================= -->
<!-- GENERAL HANDYMAN SERVICES -->
<!-- ================================================= -->

<h2 style="color:#b80d0d;margin-top:40px;">
General Handyman Services
</h2>

<ul style="line-height:1.9;font-size:17px;">
<li>General home maintenance</li>
<li>Furniture assembly</li>
<li>TV mounting</li>
<li>Picture and mirror installation</li>
<li>Minor carpentry work</li>
<li>Small home repairs</li>
<li>Door adjustments and hardware replacement</li>
<li>Closet system installation</li>
<li>Interior trim repairs</li>
</ul>

<!-- ================================================= -->
<!-- INTERIOR HOME REPAIRS -->
<!-- ================================================= -->

<h2 style="color:#b80d0d;margin-top:40px;">
Interior Home Repairs
</h2>

<ul style="line-height:1.9;font-size:17px;">
<li>Drywall repair</li>
<li>Drywall installation</li>
<li>Wall patching</li>
<li>Ceiling repair</li>
<li>Interior door installation</li>
<li>Sliding barn door installation</li>
<li>Baseboard installation</li>
<li>Crown molding installation</li>
<li>Interior trim carpentry</li>
<li>Interior painting</li>
<li>Cabinet installation</li>
<li>Cabinet repair</li>
<li>Kitchen upgrades</li>
<li>Bathroom repairs</li>
</ul>

<!-- IMAGE MID PAGE -->

<div style="text-align:center;margin:40px 0;">
<img
src="https://cdn.shopify.com/s/files/1/0549/2896/5713/files/5770173D-7E56-41B8-9EF5-A970A7754B19.png?v=1773489463"
alt="Contractor performing home repairs in ${city}"
style="width:100%;max-width:720px;border-radius:10px;"
/>
</div>

<!-- ================================================= -->
<!-- FLOORING SERVICES -->
<!-- ================================================= -->

<h2 style="color:#b80d0d;">
Flooring Installation and Repair
</h2>

<ul style="line-height:1.9;font-size:17px;">
<li>Hardwood flooring installation</li>
<li>Laminate flooring installation</li>
<li>Vinyl plank flooring</li>
<li>Tile flooring installation</li>
<li>Floor repairs</li>
<li>Subfloor repair</li>
<li>Floor trim installation</li>
</ul>

<!-- ================================================= -->
<!-- WINDOW AND DOOR SERVICES -->
<!-- ================================================= -->

<h2 style="color:#b80d0d;">
Window and Door Services
</h2>

<ul style="line-height:1.9;font-size:17px;">
<li>Window installation</li>
<li>Window replacement</li>
<li>Window trim repair</li>
<li>Exterior door installation</li>
<li>Interior door installation</li>
<li>Sliding door repair</li>
<li>French door installation</li>
<li>Door frame repair</li>
<li>Door hardware replacement</li>
</ul>

<!-- ================================================= -->
<!-- EXTERIOR HOME REPAIRS -->
<!-- ================================================= -->

<h2 style="color:#b80d0d;">
Exterior Home Repairs
</h2>

<ul style="line-height:1.9;font-size:17px;">
<li>Deck repair</li>
<li>Deck installation</li>
<li>Fence repair</li>
<li>Fence installation</li>
<li>Porch repair</li>
<li>Porch installation</li>
<li>Gutter repair</li>
<li>Gutter installation</li>
<li>Roof repair</li>
<li>Siding repair</li>
<li>Exterior trim repair</li>
<li>Exterior painting</li>
</ul>

<!-- THIRD IMAGE -->

<div style="text-align:center;margin:40px 0;">
<img
src="https://cdn.shopify.com/s/files/1/0549/2896/5713/files/95A692F3-BA27-4CFA-B7E6-2C1CB7452DC9.png?v=1773489462"
alt="Home repair project in ${city}, ${stateCode}"
style="width:100%;max-width:720px;border-radius:10px;"
/>
</div>

<!-- ================================================= -->
<!-- OUTDOOR HOME IMPROVEMENTS -->
<!-- ================================================= -->

<h2 style="color:#b80d0d;">
Outdoor Improvements
</h2>

<ul style="line-height:1.9;font-size:17px;">
<li>Pergola construction</li>
<li>Gazebo installation</li>
<li>Patio construction</li>
<li>Outdoor stair repair</li>
<li>Outdoor railing installation</li>
<li>Backyard upgrades</li>
<li>Outdoor carpentry</li>
</ul>

<!-- ================================================= -->
<!-- WHY HIRE PROFESSIONAL CONTRACTORS -->
<!-- ================================================= -->

<h2 style="color:#b80d0d;">
Why Hire a Professional Contractor
</h2>

<p style="font-size:17px;line-height:1.8;">
Hiring a professional ensures repairs and installations are completed safely
and correctly. Skilled contractors have the proper tools, experience,
and knowledge needed to handle both small repairs and major home upgrades.
</p>

<ul style="line-height:1.9;font-size:17px;">
<li>Proper tools and materials</li>
<li>Experienced workmanship</li>
<li>Efficient project completion</li>
<li>Improved property value</li>
<li>Long-lasting repairs</li>
</ul>

<!-- ================================================= -->
<!-- FAQ -->
<!-- ================================================= -->

<h2 style="color:#b80d0d;margin-top:40px;">
Frequently Asked Questions
</h2>

<p style="font-size:17px;line-height:1.8;">
<strong>Do you offer home repair services in ${city}?</strong><br>
Yes. Homeowners in ${city}, ${state} can submit a request and we will help connect
them with contractors who provide home repair services in their area.
</p>

<p style="font-size:17px;line-height:1.8;">
<strong>What types of repairs can contractors handle?</strong><br>
Contractors handle many types of residential work including drywall repair,
door installation, flooring installation, deck construction, window replacement,
and general handyman services.
</p>

<!-- CTA -->

<div style="text-align:center;margin-top:50px;">
<a href="https://doorplaceusa.com/pages/get-a-fast-quote"
style="background:#b80d0d;color:#fff;padding:16px 36px;font-size:19px;text-decoration:none;border-radius:8px;">
Request Home Repair Help in ${city}
</a>
</div>

</div>

`;
}
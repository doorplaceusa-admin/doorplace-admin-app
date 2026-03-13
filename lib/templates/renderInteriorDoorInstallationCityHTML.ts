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

export function renderInteriorDoorInstallationCityHTML({
  city,
  state,
  stateCode,
  nearbyCities,
}: RenderProps): string {

return `
<div style="max-width:900px;margin:0 auto;padding:25px;font-family:'Times New Roman',serif;">

<!-- HERO IMAGE -->

<div style="text-align:center;margin-bottom:20px;">
<img
src="https://cdn.shopify.com/s/files/1/0549/2896/5713/files/IMG_3943.jpg?v=1735211397"
alt="Interior door installation in ${city}, ${stateCode}"
style="width:100%;max-width:600px;border-radius:10px;">
</div>

<h1 style="color:#b80d0d;font-size:36px;margin-bottom:10px;text-align:center;">
Interior Door Installation in ${city}, ${stateCode}
</h1>

<p style="font-size:18px;line-height:1.7;text-align:center;max-width:760px;margin:0 auto;">
Homeowners searching for <strong>interior door installation in ${city}, ${state}</strong>
often need experienced installers for bedroom doors, bathroom doors,
closet doors, office doors, and sliding interior doors.
Doorplace USA builds custom doors and may help connect homeowners
with independent contractors who install interior doors.
</p>

<!-- BENEFITS -->

<div style="margin-top:25px;display:flex;flex-wrap:wrap;gap:15px;justify-content:center;">

<div style="border:1px solid #ddd;padding:12px 18px;border-radius:8px;font-size:16px;">
✔ Bedroom & bathroom doors
</div>

<div style="border:1px solid #ddd;padding:12px 18px;border-radius:8px;font-size:16px;">
✔ Closet & office doors
</div>

<div style="border:1px solid #ddd;padding:12px 18px;border-radius:8px;font-size:16px;">
✔ Independent installers available
</div>

</div>

<div style="margin-top:30px;text-align:center;">
<a href="https://doorplaceusa.com/pages/get-a-fast-quote"
style="background:#b80d0d;color:#fff;padding:15px 34px;font-size:18px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:bold;">
Request Interior Door Installation Help
</a>
</div>

<!-- MAIN CONTENT -->

<div style="margin-top:45px;">

<h2 style="color:#b80d0d;font-size:26px;">
Interior Doors Commonly Installed
</h2>

<p style="font-size:17px;line-height:1.8;">
Interior door installation projects in ${city} include many door types
used throughout residential homes. Independent contractors may install
bedroom doors, bathroom doors, closet doors, office doors, and
custom interior door systems depending on the project.
</p>

<ul style="line-height:1.9;font-size:16px;">
<li>Bedroom doors</li>
<li>Bathroom doors</li>
<li>Closet doors</li>
<li>Office doors</li>
<li>Solid core door upgrades</li>
<li>Sliding interior doors</li>
<li>French interior doors</li>
<li>Barn-style interior doors</li>
<li>Pocket doors</li>
<li>Bifold doors</li>
<li>Double interior doors</li>
<li>Custom-sized interior doors</li>
</ul>

</div>

<!-- INSTALLATION EXAMPLES -->

<h2 style="color:#b80d0d;margin-top:40px;">
Interior Door Installation Examples
</h2>

<p style="font-size:16px;line-height:1.8;">
Below are examples of interior door installations. These images show
barn-style doors, but installers also work with many other interior
door styles including bedroom doors, closet doors, French doors,
pocket doors, and sliding doors.
</p>

<div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-top:20px;">

<div style="flex:1 1 45%;max-width:300px;">
<img src="https://cdn.shopify.com/s/files/1/0549/2896/5713/files/IMG_3943.jpg?v=1735211397"
alt="Interior door installation example"
style="width:100%;border-radius:8px;">
</div>

<div style="flex:1 1 45%;max-width:300px;">
<img src="https://cdn.shopify.com/s/files/1/0549/2896/5713/files/IMG_4164.heic?v=1735211284"
alt="Sliding interior door installation"
style="width:100%;border-radius:8px;">
</div>

<div style="flex:1 1 45%;max-width:300px;">
<img src="https://cdn.shopify.com/s/files/1/0549/2896/5713/files/IMG_6737.jpg?v=1707839247"
alt="Barn style interior door installation"
style="width:100%;border-radius:8px;">
</div>

<div style="flex:1 1 45%;max-width:300px;">
<img src="https://cdn.shopify.com/s/files/1/0549/2896/5713/files/IMG_8673.heic?v=1707839169"
alt="Custom interior door example"
style="width:100%;border-radius:8px;">
</div>

</div>

<!-- FAQ -->

<h2 style="color:#b80d0d;margin-top:40px;">
Frequently Asked Questions
</h2>

<p style="font-size:16px;line-height:1.8;">
<strong>Do you install interior doors in ${city}, ${stateCode}?</strong><br>
Doorplace USA may help connect homeowners with independent contractors
who install interior doors in the ${city} area.
</p>

<p style="font-size:16px;line-height:1.8;">
<strong>What types of interior doors can be installed?</strong><br>
Installers may handle bedroom doors, bathroom doors, closet doors,
French doors, sliding doors, pocket doors, bifold doors,
and custom interior door installations.
</p>

<p style="font-size:16px;line-height:1.8;">
<strong>How long does installation take?</strong><br>
Most interior door installations are completed in a single visit
depending on the project.
</p>

<div style="margin-top:60px;text-align:center;">

<h2 style="color:#b80d0d;">
Need Interior Door Installation Help?
</h2>

<p style="font-size:16px;line-height:1.7;max-width:700px;margin:0 auto;">
Tell us about your project and we may help connect you
with an independent contractor in ${city}, ${state}.
</p>

<div style="margin-top:25px;">
<a href="https://doorplaceusa.com/pages/get-a-fast-quote"
style="background:#b80d0d;color:#fff;padding:15px 34px;font-size:18px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:bold;">
Request a Quote
</a>
</div>

</div>

</div>
`;
}
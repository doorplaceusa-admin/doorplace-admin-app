type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  slug: string;
  nearbyCities?: { city: string; slug: string }[];
  heroImageUrl?: string | null;
};

export function renderCustomDoorInstallationCityHTML({
  city,
  state,
  stateCode,
  heroImageUrl,
  nearbyCities,
}: RenderProps): string {

return `
<div style="max-width:900px;margin:0 auto;padding:25px;font-family:'Times New Roman',serif;">

${heroImageUrl ? `
<div style="text-align:center;margin-bottom:20px;">
<img
src="${heroImageUrl}"
alt="Door installation services in ${city}, ${stateCode}"
style="width:100%;max-width:650px;border-radius:10px;">
</div>
` : ""}

<h1 style="color:#b80d0d;font-size:36px;margin-bottom:10px;text-align:center;">
Door Installation Services in ${city}, ${stateCode}
</h1>

<p style="font-size:18px;line-height:1.7;text-align:center;max-width:760px;margin:0 auto;">
Homeowners searching for <strong>door installation in ${city}, ${state}</strong>
often need experienced installers for interior doors, exterior doors,
barn doors, sliding doors, entry doors, patio doors, and custom door projects.
Doorplace USA can help connect homeowners with independent contractors
who provide professional door installation services.
</p>

<div style="margin-top:25px;display:flex;flex-wrap:wrap;gap:15px;justify-content:center;">

<div style="border:1px solid #ddd;padding:12px 18px;border-radius:8px;font-size:16px;">
✔ Independent door installers
</div>

<div style="border:1px solid #ddd;padding:12px 18px;border-radius:8px;font-size:16px;">
✔ Interior & exterior doors
</div>

<div style="border:1px solid #ddd;padding:12px 18px;border-radius:8px;font-size:16px;">
✔ Custom and specialty doors
</div>

</div>

<div style="margin-top:30px;text-align:center;">
<a href="https://doorplaceusa.com/pages/get-a-fast-quote"
style="background:#b80d0d;color:#fff;padding:15px 34px;font-size:18px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:bold;">
Request Door Installation Help
</a>
</div>

<!-- MAIN CONTENT -->

<div style="margin-top:45px;">

<h2 style="color:#b80d0d;font-size:26px;">
Professional Door Installation in ${city}
</h2>

<p style="font-size:17px;line-height:1.8;">
If you need <strong>door installation in ${city}, ${state}</strong>,
many homeowners search for experienced installers who can properly install
many types of doors throughout the home.
</p>

<p style="font-size:17px;line-height:1.8;">
Doorplace USA builds custom doors and may help connect customers
with independent contractors who install doors in residential homes.
Independent installers may handle projects such as installing interior doors,
exterior entry doors, sliding barn doors, patio doors, closet doors,
French doors, pocket doors, bifold doors, and custom door systems.
</p>

</div>

<!-- INSTALLATION GALLERY -->

<h2 style="color:#b80d0d;font-size:26px;margin-top:40px;">
Examples of Door Installations
</h2>

<p style="font-size:16px;line-height:1.8;">
Below are examples of real door installations. While many photos show barn doors,
independent contractors also install many other types of doors including
<strong>front entry doors, interior doors, sliding doors, patio doors,
French doors, closet doors, pocket doors, cabinet doors, and custom doors</strong>.
</p>

<div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-top:20px;">

<div style="flex:1 1 45%;max-width:320px;">
<img src="https://cdn.shopify.com/s/files/1/0549/2896/5713/files/IMG_3943.jpg?v=1735211397"
alt="Barn door installation in ${city}, ${stateCode}"
style="width:100%;border-radius:8px;">
</div>

<div style="flex:1 1 45%;max-width:320px;">
<img src="https://cdn.shopify.com/s/files/1/0549/2896/5713/files/IMG_4164.heic?v=1735211284"
alt="Interior sliding barn door installation in ${city}, ${stateCode}"
style="width:100%;border-radius:8px;">
</div>

<div style="flex:1 1 45%;max-width:320px;">
<img src="https://cdn.shopify.com/s/files/1/0549/2896/5713/files/IMG_6737.jpg?v=1707839247"
alt="Bypass barn door installation example in ${city}, ${stateCode}"
style="width:100%;border-radius:8px;">
</div>

<div style="flex:1 1 45%;max-width:320px;">
<img src="https://cdn.shopify.com/s/files/1/0549/2896/5713/files/IMG_8673.heic?v=1707839169"
alt="Custom interior door installation example in ${city}, ${stateCode}"
style="width:100%;border-radius:8px;">
</div>

<div style="flex:1 1 45%;max-width:320px;">
<img src="https://cdn.shopify.com/s/files/1/0549/2896/5713/files/IMG_1357.jpg?v=1707838935"
alt="Rustic barn door installation example in ${city}, ${stateCode}"
style="width:100%;border-radius:8px;">
</div>

</div>

<!-- TYPES OF DOORS -->

<h2 style="color:#b80d0d;margin-top:40px;">
Types of Doors That Can Be Installed
</h2>

<ul style="line-height:1.9;font-size:16px;">
<li>Front entry doors</li>
<li>Interior bedroom doors</li>
<li>Sliding barn doors</li>
<li>French doors</li>
<li>Patio doors</li>
<li>Closet doors</li>
<li>Pocket doors</li>
<li>Bifold doors</li>
<li>Bypass sliding doors</li>
<li>Steel and metal doors</li>
<li>Glass interior doors</li>
<li>Wood interior doors</li>
<li>Custom-built doors</li>
<li>Office doors</li>
<li>Double door installations</li>
</ul>

<h2 style="color:#b80d0d;">
How Door Installation Requests Work
</h2>

<ol style="line-height:1.9;font-size:16px;">
<li>Send a photo of your door opening</li>
<li>Tell us the type of door you want installed</li>
<li>We may connect you with an independent contractor in ${city}</li>
<li>The installer may contact you to discuss the project</li>
</ol>

<h2 style="color:#b80d0d;">
Frequently Asked Questions
</h2>

<p style="font-size:16px;line-height:1.8;">
<strong>Do you install doors in ${city}, ${stateCode}?</strong><br>
Doorplace USA may help connect homeowners with independent contractors
who provide door installation services in the ${city} area.
</p>

<p style="font-size:16px;line-height:1.8;">
<strong>What types of doors can be installed?</strong><br>
Installers may handle many types of doors including interior doors,
exterior doors, barn doors, sliding doors, closet doors,
French doors, glass doors, and custom door systems.
</p>

<p style="font-size:16px;line-height:1.8;">
<strong>Can custom doors be installed?</strong><br>
Yes. Custom-built doors can be installed depending on the project
and the installer handling the work.
</p>

${
nearbyCities && nearbyCities.length > 0
? `
<div style="margin-top:55px;">
<h2 style="color:#b80d0d;">Nearby Areas</h2>

<ul style="line-height:1.9;font-size:16px;padding-left:18px;">
${nearbyCities.slice(0,8).map(c => `
<li>
<a href="https://doorplaceusa.com/pages/${c.slug}" style="color:#b80d0d;">
Door Installation in ${c.city}
</a>
</li>
`).join("")}
</ul>
</div>
`
: ""
}

<div style="margin-top:60px;text-align:center;">

<h2 style="color:#b80d0d;">
Need Help With Door Installation?
</h2>

<p style="font-size:16px;line-height:1.7;max-width:700px;margin:0 auto;">
If you're searching for <strong>door installation in ${city}, ${state}</strong>,
tell us about your project and we may help connect you
with an independent contractor serving your area.
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
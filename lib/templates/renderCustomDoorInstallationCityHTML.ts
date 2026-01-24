type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  slug: string;
  heroImageUrl?: string | null;
};

export function renderCustomDoorInstallationCityHTML({
  city,
  state,
  stateCode,
  heroImageUrl,
}: RenderProps): string {
  return `
<div style="max-width:800px;margin:0 auto;padding:10px 20px;font-family:'Times New Roman',serif;">

  ${
    heroImageUrl
      ? `<img
          src="${heroImageUrl}"
          alt="Custom door installation in ${city}, ${stateCode} by Doorplace USA"
          style="width:70%;max-width:500px;border-radius:6px;margin:0 auto 18px auto;display:block;"
        >`
      : ""
  }

  <h1 style="color:#b80d0d;font-size:28px;margin-bottom:10px;">
    Custom Door Installation in ${city}, ${stateCode}
  </h1>

  <p style="font-size:16px;line-height:1.6;color:#333;margin-bottom:16px;">
    Doorplace USA specializes in <strong>custom door installation in ${city}, ${state}</strong>.
    We design, build, deliver, and professionally install handcrafted doors built
    specifically for your home — not mass-produced doors pulled from inventory.
  </p>

  <p style="font-size:15px;line-height:1.6;color:#333;margin-bottom:18px;">
    Our custom doors are installed throughout ${city} and surrounding areas for
    bedrooms, offices, pantries, bathrooms, room dividers, and entryways.
    Each door is measured, built, stained, and installed for a precise fit.
  </p>

  <div style="border:1px solid #000;padding:12px 15px;margin:20px 0;background:#f7f7f7;border-radius:4px;">
    <p style="margin:0;font-size:15px;line-height:1.6;">
      <strong>Looking for a custom door installer in ${city}?</strong><br>
      Call or text <strong>1-844-377-5872</strong> or
      <a href="https://doorplaceusa.com/pages/get-a-fast-quote" style="color:#b80d0d;text-decoration:none;">
        get a fast quote
      </a>.
    </p>
  </div>

  <h2 style="color:#b80d0d;font-size:22px;margin-top:24px;margin-bottom:10px;">
    Custom Doors We Build & Install
  </h2>

  <ul style="font-size:15px;line-height:1.7;color:#333;margin-left:18px;margin-bottom:16px;">
    <li>Custom barn doors</li>
    <li>Sliding & bypass doors</li>
    <li>Double and wide-span doors</li>
    <li>Hidden / bookshelf doors</li>
    <li>Glass or mirrored door designs</li>
    <li>French doors and interior entry doors</li>
  </ul>

  <h2 style="color:#b80d0d;font-size:22px;margin-top:24px;margin-bottom:10px;">
    Door Options & Upgrades
  </h2>

  <ul style="font-size:15px;line-height:1.7;color:#333;margin-left:18px;margin-bottom:16px;">
    <li>Single or double door configurations</li>
    <li>Sliding, bifold, or bypass hardware systems</li>
    <li>Clear or frosted glass upgrades (select designs)</li>
    <li>Choice of handle style and hardware finish</li>
    <li>Custom trim and panel layouts</li>
    <li>Stain-only finish (we do not paint doors)</li>
  </ul>

  <h2 style="color:#b80d0d;font-size:22px;margin-top:24px;margin-bottom:10px;">
    How the Custom Door Installation Process Works
  </h2>

  <ol style="font-size:15px;line-height:1.7;color:#333;margin-left:18px;margin-bottom:16px;">
    <li><strong>Send a photo & measurements:</strong> Text us your opening.</li>
    <li><strong>Select your door design:</strong> Style, wood, and stain.</li>
    <li><strong>Receive your quote:</strong> Door, hardware, and installation.</li>
    <li><strong>Professional installation:</strong> Delivered and installed by our team.</li>
  </ol>

  <h2 style="color:#b80d0d;font-size:22px;margin-top:26px;margin-bottom:10px;">
    Why Choose Doorplace USA in ${city}?
  </h2>

  <p style="font-size:15px;line-height:1.6;color:#333;margin-bottom:16px;">
    Doorplace USA serves homeowners throughout the Dallas–Fort Worth area with
    premium custom doors and professional installation. Our doors are built from
    solid wood, finished by hand, and installed for long-term performance.
    If you’re searching for <strong>custom door installation in ${city}</strong>,
    you’re working with specialists — not resellers.
  </p>

  <h2 style="color:#b80d0d;font-size:22px;margin-top:24px;margin-bottom:10px;">
    Get a Custom Door Quote
  </h2>

  <p style="font-size:15px;line-height:1.6;color:#333;margin-bottom:12px;">
    The fastest way to get started is to send us a photo and rough measurements
    of your door opening.
  </p>

  <p style="font-size:15px;font-weight:bold;margin-bottom:14px;">
    Call or text: 1-844-377-5872
  </p>

  <div style="text-align:center;margin-top:10px;margin-bottom:30px;">
    <a
      href="https://doorplaceusa.com/pages/get-a-fast-quote"
      style="display:inline-block;padding:12px 22px;border:1px solid #000;border-radius:4px;text-decoration:none;font-size:16px;color:#000;background:#f4f4f4;">
      Get a Fast Quote
    </a>
  </div>

</div>
`;
}

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
  heroImageUrl?: string | null;
};

export function renderHomeRepairCityHTML({
  city,
  state,
  stateCode,
  heroImageUrl,
  nearbyCities,
}: RenderProps): string {

  return `
<div style="max-width:900px;margin:0 auto;padding:25px;font-family:'Times New Roman',serif;">

  ${
    heroImageUrl
      ? `
      <div style="text-align:center;margin-bottom:20px;">
        <img
          src="${heroImageUrl}"
          alt="Home Repair Services in ${city}, ${stateCode}"
          style="width:100%;max-width:650px;border-radius:10px;"
        />
      </div>
      `
      : ""
  }

  <h1 style="color:#b80d0d;font-size:36px;margin-bottom:10px;text-align:center;">
    Home Repair & Installation Services in ${city}, ${stateCode}
  </h1>

  <p style="font-size:18px;line-height:1.7;text-align:center;max-width:750px;margin:0 auto;">
    Doorplace USA helps connect homeowners with trusted contractors for
    home repair, installation, and maintenance services in ${city}, ${state}.
  </p>

  <div style="margin-top:25px;display:flex;flex-wrap:wrap;gap:15px;justify-content:center;">

    <div style="border:1px solid #ddd;padding:12px 18px;border-radius:8px;font-size:16px;">
      ✅ Experienced local contractors
    </div>

    <div style="border:1px solid #ddd;padding:12px 18px;border-radius:8px;font-size:16px;">
      ✅ Repairs, replacements & installations
    </div>

    <div style="border:1px solid #ddd;padding:12px 18px;border-radius:8px;font-size:16px;">
      ✅ Fast quotes available
    </div>

  </div>

  <div style="margin-top:30px;text-align:center;">
    <a href="https://doorplaceusa.com/pages/get-a-fast-quote"
       style="background:#b80d0d;color:#fff;padding:15px 34px;
              font-size:18px;text-decoration:none;border-radius:8px;
              display:inline-block;font-weight:bold;">
      Request a Quote in ${city}
    </a>
  </div>

  <div style="margin-top:45px;">

    <h2 style="color:#b80d0d;font-size:26px;">
      Common Home Repair & Installation Services
    </h2>

    <ul style="line-height:1.9;font-size:16px;">
      <li>Door installation and repair</li>
      <li>Window installation and replacement</li>
      <li>Deck building and repair</li>
      <li>Fence installation and repair</li>
      <li>Drywall repair and installation</li>
      <li>Flooring installation and repair</li>
      <li>Roof repair and maintenance</li>
      <li>Gutter installation and repair</li>
      <li>Garage door repair and installation</li>
      <li>Interior trim and carpentry work</li>
      <li>Pressure washing and exterior cleaning</li>
      <li>General handyman services</li>
    </ul>

  </div>

  <div style="margin:45px 0;padding:25px;border:2px solid #b80d0d;
              border-radius:10px;background:#fff8f8;">

    <h2 style="margin-top:0;color:#b80d0d;">
      Need Help With Home Repairs?
    </h2>

    <p style="font-size:16px;line-height:1.7;">
      Tell us about your project and we will help connect you with contractors
      serving homeowners in ${city}, ${state}.
    </p>

    <div style="text-align:center;margin-top:20px;">
      <a href="https://doorplaceusa.com/pages/get-a-fast-quote"
         style="background:#b80d0d;color:#fff;padding:12px 28px;
                font-size:17px;text-decoration:none;border-radius:6px;
                font-weight:bold;">
        Get My Quote
      </a>
    </div>

  </div>

  <h2 style="color:#b80d0d;">
    Interior Home Repairs
  </h2>

  <ul style="line-height:1.9;font-size:16px;">
    <li>Drywall and ceiling repair</li>
    <li>Interior door installation</li>
    <li>Cabinet repair and installation</li>
    <li>Floor installation and repairs</li>
    <li>Trim, baseboards and crown molding</li>
  </ul>

  <h2 style="color:#b80d0d;">
    Exterior Home Repairs
  </h2>

  <ul style="line-height:1.9;font-size:16px;">
    <li>Roof repairs</li>
    <li>Gutter installation</li>
    <li>Deck and porch repairs</li>
    <li>Fence repairs</li>
    <li>Siding repairs</li>
  </ul>

  <h2 style="color:#b80d0d;">
    Why Homeowners in ${city} Choose Local Contractors
  </h2>

  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
              gap:18px;margin-top:20px;">

    <div style="border:1px solid #ddd;padding:18px;border-radius:10px;">
      <strong>Skilled Professionals</strong>
      <p style="margin-top:8px;font-size:15px;">
        Work with contractors experienced in a wide range of home repairs.
      </p>
    </div>

    <div style="border:1px solid #ddd;padding:18px;border-radius:10px;">
      <strong>Wide Range of Services</strong>
      <p style="margin-top:8px;font-size:15px;">
        From small handyman jobs to major installation projects.
      </p>
    </div>

    <div style="border:1px solid #ddd;padding:18px;border-radius:10px;">
      <strong>Fast Project Quotes</strong>
      <p style="margin-top:8px;font-size:15px;">
        Submit your request and get connected with professionals quickly.
      </p>
    </div>

  </div>

  <div style="margin-top:55px;">

    <h2 style="color:#b80d0d;">
      Frequently Asked Questions
    </h2>

    <p style="font-size:16px;line-height:1.8;">
      <strong>What types of repairs can contractors handle?</strong><br>
      Contractors can assist with door installation, drywall repair,
      flooring installation, fence repair, deck building, and many other
      home improvement projects.
    </p>

    <p style="font-size:16px;line-height:1.8;">
      <strong>Do contractors serve ${city}, ${stateCode}?</strong><br>
      Yes — professionals serve homeowners throughout ${state}.
    </p>

    <p style="font-size:16px;line-height:1.8;">
      <strong>How do I request a quote?</strong><br>
      Simply submit the form and provide details about your project.
    </p>

  </div>

  ${
    nearbyCities && nearbyCities.length > 0
      ? `
      <div style="margin-top:55px;">
        <h2 style="color:#b80d0d;">
          Nearby Areas We Also Serve
        </h2>

        <ul style="line-height:1.9;font-size:16px;padding-left:18px;">
          ${nearbyCities
            .slice(0, 8)
            .map(
              (c) => `
              <li>
                <a href="https://doorplaceusa.com/pages/${c.slug}"
                   style="color:#b80d0d;">
                  Home Repair Services in ${c.city}
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

  <div style="margin-top:60px;text-align:center;">

    <h2 style="color:#b80d0d;">
      Ready to Start Your Project in ${city}?
    </h2>

    <p style="font-size:16px;line-height:1.7;max-width:700px;margin:0 auto;">
      Submit your request and we will help connect you with contractors
      serving homeowners throughout ${city}, ${state}.
    </p>

    <div style="margin-top:25px;">
      <a href="https://doorplaceusa.com/pages/get-a-fast-quote"
         style="background:#b80d0d;color:#fff;padding:15px 34px;
                font-size:18px;text-decoration:none;border-radius:8px;
                display:inline-block;font-weight:bold;">
        Get a Fast Quote
      </a>
    </div>

  </div>

</div>
`;
}
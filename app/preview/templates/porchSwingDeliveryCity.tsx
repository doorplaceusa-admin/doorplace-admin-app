type Props = {
  page: {
    title: string
    hero_image_url?: string | null
  }
  location: {
    city_name: string
  }
  state: {
    state_name: string
    state_code: string
  }
}

export default function PorchSwingDeliveryCityTemplate({ page, location, state }: Props) {
  const city = location.city_name
  const stateName = state.state_name
  const stateCode = state.state_code

  return (
    <div style={{ maxWidth: 850, margin: "0 auto", padding: 20, fontFamily: "Times New Roman, serif" }}>

      {page.hero_image_url && (
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img src={page.hero_image_url} style={{ width: "100%", maxWidth: 700, borderRadius: 8 }} />
        </div>
      )}

      <h1 style={{ color: "#b80d0d", fontSize: 32 }}>
        Porch Swing Delivery in {city}, {stateCode}
      </h1>

      <p style={{ fontSize: 18 }}>
        Doorplace USA builds and ships heavy-duty porch swings directly to homes in {city} and across {stateName}.
        Every swing is handcrafted, reinforced, and built for real outdoor living.
      </p>

      <div style={{ border: "2px solid #b80d0d", padding: 16, margin: "25px 0" }}>
        <strong>Fast Quote & Ordering</strong><br />
        <a href="https://doorplaceusa.com/pages/get-a-fast-quote" target="_blank">
          Get a Fast Quote
        </a>
      </div>

      <h2>Why {city} Customers Choose Doorplace USA</h2>
      <ul>
        <li>Built-to-order solid wood porch swings</li>
        <li>Nationwide delivery</li>
        <li>Weather-ready stains for {stateName}</li>
        <li>Crib, Twin, and Full sizes</li>
        <li>Real live chat support</li>
      </ul>

      <h2>Porch Swing Sizes We Deliver</h2>
      <ul>
        <li>Crib: 30” × 57”</li>
        <li>Twin: 40” × 81”</li>
        <li>Full: 57” × 81”</li>
      </ul>

    </div>
  )
}

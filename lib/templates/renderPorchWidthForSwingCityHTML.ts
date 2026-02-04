type RenderProps = {
  city: string;
  state: string;
  stateCode: string;
  heroImageUrl?: string | null;
};

export function renderPorchWidthForSwingCityHTML({
  city,
  state,
  stateCode,
  heroImageUrl,
}: RenderProps): string {
  return `
<div style="max-width:850px;margin:0 auto;padding:20px;font-family:'Times New Roman',serif;">

  ${
    heroImageUrl
      ? `<div style="text-align:center;margin-bottom:20px;">
          <img
            src="${heroImageUrl}"
            alt="Porch width needed for a porch swing in ${city}, ${stateCode}"
            style="width:100%;max-width:500px;border-radius:6px;"
          />
        </div>`
      : ""
  }

  <h1 style="color:#b80d0d;font-size:32px;margin-bottom:12px;">
    How Wide Should a Porch Be for a Swing in ${city}, ${stateCode}?
  </h1>

  <p style="font-size:18px;line-height:1.7;">
    Porch width determines which porch swing sizes will fit comfortably
    in ${city}, ${state}. Proper width allows for safe clearance
    and balanced swing movement.
  </p>

  <h2 style="color:#b80d0d;">Minimum Porch Width Guidelines</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li><strong>Minimum width:</strong> Swing width + 24 inches</li>
    <li><strong>Side clearance:</strong> 12–18 inches per side</li>
    <li><strong>Ideal layout:</strong> Centered between posts or walls</li>
  </ul>

  <h2 style="color:#b80d0d;">Why Porch Width Matters</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Prevents side-to-side contact</li>
    <li>Improves swing balance and comfort</li>
    <li>Allows room for chains or ropes</li>
    <li>Supports larger swing options</li>
  </ul>

  <h2 style="color:#b80d0d;">Width Challenges to Watch For</h2>
  <ul style="line-height:1.9;font-size:16px;">
    <li>Posts or columns reducing usable width</li>
    <li>Narrow porch layouts</li>
    <li>Uneven spacing between supports</li>
  </ul>

  <h2 style="color:#b80d0d;">Choosing the Right Swing Width</h2>
  <p style="font-size:16px;line-height:1.8;">
    Selecting a swing that matches your porch width
    helps avoid clearance issues and improves long-term comfort.
    Professional guidance can help determine the best fit.
  </p>

  <div style="border:2px solid #b80d0d;padding:18px;background:#fdf6f6;margin:30px 0;border-radius:6px;">
    <strong>Not sure which width works best?</strong><br/>
    Doorplace USA can help evaluate your porch
    and recommend the right swing size.
  </div>

  <div style="text-align:center;margin-top:30px;">
    <a
      href="https://doorplaceusa.com/pages/get-a-fast-quote"
      style="background:#b80d0d;color:#fff;padding:14px 30px;font-size:18px;text-decoration:none;border-radius:6px;display:inline-block;">
      Get a Fast Quote
    </a>
  </div>

</div>
`;
}

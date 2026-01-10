export function buildTrackingScript({
  page_id,
  slug,
  city,
  state,
  page_type,
}: {
  page_id: string;
  slug: string;
  city: string;
  state: string;
  page_type: string;
}) {
  return `
<script>
fetch("https://tradepilot.doorplaceusa.com/api/track-page-view", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    page_id: "${page_id}",
    slug: "${slug}",
    city: "${city}",
    state: "${state}",
    page_type: "${page_type}"
  })
});
</script>
`;
}

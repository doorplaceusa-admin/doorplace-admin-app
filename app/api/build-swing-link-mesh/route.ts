export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const SHOP = process.env.SHOPIFY_STORE_DOMAIN!;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN!;
const API_VERSION = "2024-01";

const SHOPIFY_DELAY_MS = 650;
const MAX_RETRIES = 10;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function shopifyFetch(path: string, options: RequestInit = {}) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(
      `https://${SHOP}/admin/api/${API_VERSION}${path}`,
      {
        ...options,
        headers: {
          "X-Shopify-Access-Token": TOKEN,
          "Content-Type": "application/json",
        },
      }
    );

    if (res.status === 429) {
      await sleep(2000 * attempt);
      continue;
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }

    return res;
  }

  throw new Error("Shopify request failed");
}

function extractHandle(url: string) {
  return url
    .replace("https://doorplaceusa.com/pages/", "")
    .replace("/pages/", "")
    .trim();
}

function formatTitle(slug: string) {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

const STATE_NEIGHBORS: Record<string, string[]> = {
  al:["fl","ga","ms","tn"],
  ak:[],
  az:["ca","nv","ut","nm"],
  ar:["tx","ok","mo","tn","ms","la"],
  ca:["or","nv","az"],
  co:["wy","ne","ks","ok","nm","az","ut"],
  ct:["ny","ma","ri"],
  de:["md","pa","nj"],
  fl:["ga","al"],
  ga:["fl","al","tn","nc","sc"],
  hi:[],
  id:["wa","or","nv","ut","wy","mt"],
  il:["wi","ia","mo","ky","in"],
  in:["mi","oh","ky","il"],
  ia:["mn","sd","ne","mo","il","wi"],
  ks:["ne","mo","ok","co"],
  ky:["il","in","oh","wv","va","tn","mo"],
  la:["tx","ar","ms"],
  me:["nh"],
  md:["va","wv","pa","de"],
  ma:["ny","vt","nh","ct","ri"],
  mi:["wi","in","oh"],
  mn:["nd","sd","ia","wi"],
  ms:["la","ar","tn","al"],
  mo:["ia","il","ky","tn","ar","ok","ks","ne"],
  mt:["id","wy","sd","nd"],
  ne:["sd","ia","mo","ks","co","wy"],
  nv:["ca","or","id","ut","az"],
  nh:["me","ma","vt"],
  nj:["ny","pa","de"],
  nm:["az","ut","co","ok","tx"],
  ny:["pa","nj","ct","ma","vt"],
  nc:["va","tn","ga","sc"],
  nd:["mt","sd","mn"],
  oh:["pa","wv","ky","in","mi"],
  ok:["tx","nm","co","ks","mo","ar"],
  or:["wa","id","nv","ca"],
  pa:["ny","nj","de","md","wv","oh"],
  ri:["ct","ma"],
  sc:["ga","nc"],
  sd:["nd","mn","ia","ne","wy","mt"],
  tn:["ky","va","nc","ga","al","ms","ar","mo"],
  tx:["nm","ok","ar","la"],
  ut:["id","wy","co","nm","az","nv"],
  vt:["ny","nh","ma"],
  va:["nc","tn","ky","wv","md"],
  wa:["id","or"],
  wv:["oh","pa","md","va","ky"],
  wi:["mi","mn","ia","il"],
  wy:["mt","sd","ne","co","ut","id"]
};

const STYLES = [
  "daybed",
  "farmhouse",
  "patio",
  "garden",
  "backyard"
];

const GUIDE_BLOCK = `
<div style="margin-top:60px;border-top:1px solid #ddd;padding-top:30px;max-width:700px;margin-left:auto;margin-right:auto;text-align:left">

<h2 style="text-align:center">Porch Swing Guides</h2>

<ul>
<li><a href="/pages/best-porch-swings">Best Porch Swings</a></li>
<li><a href="/pages/porch-swing-ideas">Porch Swing Ideas</a></li>
<li><a href="/pages/porch-swing-buying-guide">Porch Swing Buying Guide</a></li>
<li><a href="/pages/porch-swing-maintenance">Porch Swing Maintenance</a></li>
<li><a href="/pages/porch-swing-safety-guide">Porch Swing Safety Guide</a></li>
</ul>

</div>
`;

export async function POST() {

let updated = 0;

const { data: pointer } = await supabaseAdmin
.from("internal_link_pointer")
.select("*")
.eq("id",1)
.single();

const offset = pointer?.current_offset || 0;

const { data: pages } = await supabaseAdmin
.from("shopify_url_inventory")
.select("url")
.ilike("url","%porch-swing%")
.range(offset, offset + 199);

if(!pages || pages.length === 0){
return NextResponse.json({ success:true });
}

for(let i=0;i<pages.length;i++){

const url = pages[i].url;
const handle = extractHandle(url);

const res = await shopifyFetch(`/pages.json?handle=${handle}`);
const data = await res.json();

const page = data.pages?.[0];
if(!page) continue;

const html = (page.body_html || "").toLowerCase();

if(html.includes("explore more porch swings")){
continue;
}

const parts = handle.split("-");
const state = parts[parts.length - 1];

let relatedLinks:string[] = [];

const sameOffset = (offset + i) * 3;

const { data: sameState } = await supabaseAdmin
.from("shopify_url_inventory")
.select("url")
.ilike("url","%porch-swing%")
.ilike("url",`%-${state}`)
.range(sameOffset, sameOffset + 5);

if(sameState){
for(const row of sameState){
const slug = extractHandle(row.url);
if(slug !== handle && !relatedLinks.includes(slug)){
relatedLinks.push(slug);
}
if(relatedLinks.length === 3) break;
}
}

const neighbors = STATE_NEIGHBORS[state];

if(neighbors?.length){
const neighbor = neighbors[Math.floor(Math.random()*neighbors.length)];

const { data: neighborPages } = await supabaseAdmin
.from("shopify_url_inventory")
.select("url")
.ilike("url","%porch-swing%")
.ilike("url",`%-${neighbor}`)
.limit(1);

if(neighborPages?.length){
const slug = extractHandle(neighborPages[0].url);
if(!relatedLinks.includes(slug)){
relatedLinks.push(slug);
}
}
}

const style = STYLES[(offset+i) % STYLES.length];

const { data: stylePages } = await supabaseAdmin
.from("shopify_url_inventory")
.select("url")
.ilike("url","%porch-swing%")
.ilike("url",`%${style}%`)
.limit(1);

if(stylePages?.length){
const slug = extractHandle(stylePages[0].url);
if(!relatedLinks.includes(slug)){
relatedLinks.push(slug);
}
}

const dynamicLinks = `
<div style="margin-top:40px;max-width:700px;margin-left:auto;margin-right:auto;text-align:left">

<h2 style="text-align:center">Explore More Porch Swings</h2>

<ul>
${relatedLinks.map(slug => `<li><a href="/pages/${slug}">${formatTitle(slug)}</a></li>`).join("")}
</ul>

</div>
`;

const updatedHTML =
(page.body_html || "") +
GUIDE_BLOCK +
dynamicLinks;

await shopifyFetch(`/pages/${page.id}.json`,{
method:"PUT",
body:JSON.stringify({
page:{
id:page.id,
body_html:updatedHTML
}
})
});

updated++;

await sleep(SHOPIFY_DELAY_MS);

}

await supabaseAdmin
.from("internal_link_pointer")
.update({
current_offset: offset + (pages?.length || 0)
})
.eq("id",1);

return NextResponse.json({
success:true,
updated
});

}
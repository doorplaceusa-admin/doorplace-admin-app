export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const SHOP = process.env.SHOPIFY_STORE_DOMAIN!;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN!;
const API_VERSION = "2024-01";

const SHOPIFY_DELAY_MS = 650;
const MAX_RETRIES = 10;

function sleep(ms:number){
  return new Promise(r=>setTimeout(r,ms));
}

async function shopifyFetch(path:string,options:RequestInit={}){

  for(let attempt=1;attempt<=MAX_RETRIES;attempt++){

    const res=await fetch(
      `https://${SHOP}/admin/api/${API_VERSION}${path}`,
      {
        ...options,
        headers:{
          "X-Shopify-Access-Token":TOKEN,
          "Content-Type":"application/json"
        }
      }
    );

    if(res.status===429){

      console.log("⏳ Shopify throttled");

      await sleep(2000*attempt);

      continue;
    }

    if(!res.ok){

      const text=await res.text();
      console.log("❌ Shopify API Error:",text);
      throw new Error(text);

    }

    return res;

  }

  throw new Error("Shopify request failed");
}

function extractHandle(url:string){

  return url
  .replace("https://doorplaceusa.com/pages/","")
  .replace("/pages/","")
  .trim();

}

function formatTitle(slug:string){

  return slug
  .replace(/-/g," ")
  .replace(/\b\w/g,l=>l.toUpperCase());

}

/* ---------------------------------- */
/* STATE NEIGHBORS */
/* ---------------------------------- */

const STATE_NEIGHBORS:any={

tx:["ok","nm","ar","la"],
ok:["tx","nm","co","ks","mo","ar"],
ms:["la","ar","tn","al"],
ga:["fl","al","tn","nc","sc"],
fl:["ga","al"],
al:["fl","ga","tn","ms"],
tn:["ky","va","nc","ga","al","ms","ar","mo"]

};

/* ---------------------------------- */
/* STYLE TYPES */
/* ---------------------------------- */

const STYLES=[
"daybed",
"farmhouse",
"patio",
"garden",
"backyard"
];

/* ---------------------------------- */
/* GUIDE BLOCK */
/* ---------------------------------- */

const GUIDE_BLOCK=`

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

export async function POST(){

console.log("🚀 BUILD SWING LINK MESH STARTED");

let updated=0;

const {data:pointer}=await supabaseAdmin
.from("internal_link_pointer")
.select("*")
.eq("id",1)
.single();

const pageOffset=pointer?.current_offset||0;

const {data:pages}=await supabaseAdmin
.from("shopify_url_inventory")
.select("url")
.ilike("url","%porch-swing%")
.range(pageOffset,pageOffset+199);

if(!pages || pages.length===0){

console.log("No pages found");
return NextResponse.json({success:true});

}

for(let i=0;i<pages.length;i++){

const url=pages[i].url;
const handle=extractHandle(url);

console.log("Processing",handle);

const res=await shopifyFetch(`/pages.json?handle=${handle}`);
const data=await res.json();

const page=data.pages?.[0];

if(!page)continue;

const html=(page.body_html||"").toLowerCase();

if(html.includes("explore more porch swings")){

console.log("Skip existing");
continue;

}

/* ---------------------------------- */
/* DETECT STATE */
/* ---------------------------------- */

const parts=handle.split("-");
const state=parts[parts.length-1];

let relatedLinks:string[]=[];

/* ---------------------------------- */
/* SAME STATE (3) */
/* ---------------------------------- */

const sameOffset=(pageOffset+i)*3;

const {data:sameState}=await supabaseAdmin
.from("shopify_url_inventory")
.select("url")
.ilike("url","%porch-swing%")
.ilike("url",`%-${state}`)
.range(sameOffset,sameOffset+5);

if(sameState){

for(const row of sameState){

const slug=extractHandle(row.url);

if(slug!==handle && !relatedLinks.includes(slug)){

relatedLinks.push(slug);

}

if(relatedLinks.length===3)break;

}

}

/* ---------------------------------- */
/* NEIGHBOR STATE */
/* ---------------------------------- */

const neighbors=STATE_NEIGHBORS[state];

if(neighbors?.length){

const neighbor=neighbors[Math.floor(Math.random()*neighbors.length)];

const neighborOffset=(pageOffset+i);

const {data:neighborPages}=await supabaseAdmin
.from("shopify_url_inventory")
.select("url")
.ilike("url","%porch-swing%")
.ilike("url",`%-${neighbor}`)
.range(neighborOffset,neighborOffset);

if(neighborPages?.length){

relatedLinks.push(extractHandle(neighborPages[0].url));

}

}

/* ---------------------------------- */
/* STYLE PAGE */
/* ---------------------------------- */

const style=STYLES[(pageOffset+i)%STYLES.length];

const styleOffset=(pageOffset+i);

const {data:stylePages}=await supabaseAdmin
.from("shopify_url_inventory")
.select("url")
.ilike("url","%porch-swing%")
.ilike("url",`%${style}%`)
.range(styleOffset,styleOffset);

if(stylePages?.length){

relatedLinks.push(extractHandle(stylePages[0].url));

}

/* ---------------------------------- */
/* BUILD HTML */
/* ---------------------------------- */

const dynamicLinks=`

<div style="margin-top:40px;max-width:700px;margin-left:auto;margin-right:auto;text-align:left">

<h2 style="text-align:center">Explore More Porch Swings</h2>

<ul>

${relatedLinks.map(slug=>`<li><a href="/pages/${slug}">${formatTitle(slug)}</a></li>`).join("")}

</ul>

</div>

`;

const updatedHTML=(page.body_html||"")+GUIDE_BLOCK+dynamicLinks;

await shopifyFetch(`/pages/${page.id}.json`,{
method:"PUT",
body:JSON.stringify({
page:{
id:page.id,
body_html:updatedHTML
}
})
});

console.log("Updated",handle);

updated++;

await sleep(SHOPIFY_DELAY_MS);

}

const newOffset=pageOffset+pages.length;

await supabaseAdmin
.from("internal_link_pointer")
.update({current_offset:newOffset})
.eq("id",1);

console.log("Pointer updated",newOffset);

return NextResponse.json({
success:true,
updated
});

}
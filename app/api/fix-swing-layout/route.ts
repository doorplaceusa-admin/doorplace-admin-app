export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const SHOP = process.env.SHOPIFY_STORE_DOMAIN!;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN!;
const API_VERSION = "2024-01";

function sleep(ms:number){
  return new Promise(r=>setTimeout(r,ms))
}

async function shopifyFetch(path:string, options:RequestInit = {}){

  const res = await fetch(`https://${SHOP}/admin/api/${API_VERSION}${path}`,{
    ...options,
    headers:{
      "X-Shopify-Access-Token":TOKEN,
      "Content-Type":"application/json"
    }
  })

  if(!res.ok){
    const text = await res.text()
    throw new Error(text)
  }

  return res
}

function extractHandle(url:string){
  return url.replace("https://doorplaceusa.com/pages/","")
}

/* clean out broken blocks */

function removeBrokenBlocks(html:string){

  return html
    .replace(/<h2[^>]*>Porch Swing Guides[\s\S]*?<\/div>/gi,"")
    .replace(/<h2[^>]*>Explore More Porch Swings[\s\S]*?<\/div>/gi,"")
}

export async function POST(){

  console.log("FIX SWING LAYOUT STARTED")

  let updated = 0

  const {data:pages} = await supabaseAdmin
    .from("shopify_url_inventory")
    .select("url")
    .ilike("url","%porch-swing%")
    .limit(200)

  for(const p of pages || []){

    const handle = extractHandle(p.url)

    const res = await shopifyFetch(`/pages.json?handle=${handle}`)
    const data = await res.json()

    const page = data.pages?.[0]

    if(!page) continue

    let html = page.body_html

    html = removeBrokenBlocks(html)

    /* insert after resources section */

    html = html.replace(
      /(Helpful Style & Design Resources[\s\S]*?<\/ul>)/i,
      `$1
<div style="margin-top:40px">
<h2>Porch Swing Guides</h2>
<ul>
<li><a href="/pages/best-porch-swings">Best Porch Swings</a></li>
<li><a href="/pages/porch-swing-ideas">Porch Swing Ideas</a></li>
<li><a href="/pages/porch-swing-buying-guide">Porch Swing Buying Guide</a></li>
<li><a href="/pages/porch-swing-maintenance">Porch Swing Maintenance</a></li>
<li><a href="/pages/porch-swing-safety-guide">Porch Swing Safety Guide</a></li>
</ul>
</div>`
    )

    await shopifyFetch(`/pages/${page.id}.json`,{
      method:"PUT",
      body:JSON.stringify({
        page:{
          id:page.id,
          body_html:html
        }
      })
    })

    updated++

    console.log(`Repaired ${handle}`)

    await sleep(500)
  }

  console.log(`DONE repaired ${updated}`)

  return NextResponse.json({
    repaired:updated
  })
}
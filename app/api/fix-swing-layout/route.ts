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

function cleanBrokenBlocks(html:string){

  html = html.replace(/<h2[^>]*>Porch Swing Guides[\s\S]*?<\/div>/gi,"")
  html = html.replace(/<h2[^>]*>Explore More Porch Swings[\s\S]*?<\/div>/gi,"")

  return html
}

const GUIDE_BLOCK = `
<div style="margin-top:45px">

<h2 style="color:#b80d0d">
Porch Swing Guides
</h2>

<ul style="line-height:1.9">

<li><a href="/pages/best-porch-swings">Best Porch Swings</a></li>
<li><a href="/pages/porch-swing-ideas">Porch Swing Ideas</a></li>
<li><a href="/pages/porch-swing-buying-guide">Porch Swing Buying Guide</a></li>
<li><a href="/pages/porch-swing-maintenance">Porch Swing Maintenance</a></li>
<li><a href="/pages/porch-swing-safety-guide">Porch Swing Safety Guide</a></li>

</ul>

</div>
`

export async function POST(){

  console.log("REPAIR STARTED")

  let repaired = 0

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

    html = cleanBrokenBlocks(html)

    html = html.replace(
      /Get a Fast Quote/i,
      `${GUIDE_BLOCK}Get a Fast Quote`
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

    repaired++

    console.log(`Repaired ${handle}`)

    await sleep(400)
  }

  console.log(`DONE repaired ${repaired}`)

  return NextResponse.json({
    repaired
  })
}
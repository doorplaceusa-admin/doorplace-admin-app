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

function removeInsertedSections(html:string){

  html = html.replace(
    /<h2[^>]*>\s*Porch Swing Guides\s*<\/h2>[\s\S]*?<\/ul>/gi,
    ""
  )

  html = html.replace(
    /<h2[^>]*>\s*Explore More Porch Swings\s*<\/h2>[\s\S]*?<\/ul>/gi,
    ""
  )

  return html
}

export async function POST(){

  console.log("RESET STARTED")

  let fixed = 0

  const {data:pages} = await supabaseAdmin
    .from("shopify_url_inventory")
    .select("url")
    .ilike("url","%porch-swing%")
    .limit(250)

  for(const p of pages || []){

    const handle = extractHandle(p.url)

    const res = await shopifyFetch(`/pages.json?handle=${handle}`)
    const data = await res.json()

    const page = data.pages?.[0]

    if(!page) continue

    const html = page.body_html

    const cleaned = removeInsertedSections(html)

    if(cleaned === html) continue

    await shopifyFetch(`/pages/${page.id}.json`,{
      method:"PUT",
      body:JSON.stringify({
        page:{
          id:page.id,
          body_html:cleaned
        }
      })
    })

    fixed++

    console.log(`Reset ${handle}`)

    await sleep(300)
  }

  console.log(`DONE reset ${fixed}`)

  return NextResponse.json({
    reset:fixed
  })
}
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const SHOP = process.env.SHOPIFY_STORE_DOMAIN!;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN!;
const API_VERSION = "2024-01";

const BASE_URL = "https://doorplaceusa.com/pages/";

const DELAY = 500;

function sleep(ms:number){
return new Promise(res=>setTimeout(res,ms))
}

async function shopifyFetch(path:string){

const res = await fetch(
`https://${SHOP}/admin/api/${API_VERSION}${path}`,
{
headers:{
"X-Shopify-Access-Token":TOKEN,
"Content-Type":"application/json"
}
})

if(!res.ok){
const txt = await res.text()
throw new Error(txt)
}

return res
}

export async function POST(){

console.log("BACKFILL START")

let totalUpdated = 0
let pageInfo : string | null = null

while(true){

const url = pageInfo
? `/pages.json?limit=250&page_info=${pageInfo}`
: `/pages.json?limit=250`

const res = await shopifyFetch(url)

const json = await res.json()

const pages = json.pages

if(!pages || pages.length === 0){
console.log("No more pages")
break
}

for(const page of pages){

const handle = page.handle
const pageId = page.id

const fullUrl = `${BASE_URL}${handle}`

console.log("Updating:", fullUrl)

await supabaseAdmin
.from("shopify_url_inventory")
.update({ shopify_page_id: pageId })
.eq("url", fullUrl)

totalUpdated++

}

const linkHeader = res.headers.get("link")

if(!linkHeader || !linkHeader.includes("rel=\"next\"")){
break
}

const match = linkHeader.match(/page_info=([^&>]+)/)

pageInfo = match ? match[1] : null

await sleep(DELAY)

}

console.log("BACKFILL COMPLETE:", totalUpdated)

return NextResponse.json({
success:true,
updated:totalUpdated
})

}
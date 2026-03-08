export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const SHOP = process.env.SHOPIFY_STORE_DOMAIN!;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN!;
const API_VERSION = "2024-01";

const SHOPIFY_DELAY_MS = 600;
const MAX_RETRIES = 10;
const BATCH_SIZE = 200;
const MAX_BATCHES = 10000;

function sleep(ms:number){
return new Promise(res=>setTimeout(res,ms))
}

async function shopifyFetch(path:string,options:RequestInit={}){

for(let attempt=1;attempt<=MAX_RETRIES;attempt++){

const res=await fetch(`https://${SHOP}/admin/api/${API_VERSION}${path}`,{
...options,
headers:{
"X-Shopify-Access-Token":TOKEN,
"Content-Type":"application/json"
}
})

if(res.status===429){
console.log("⏳ Shopify throttle",attempt)
await sleep(2000*attempt)
continue
}

if(!res.ok){
const txt=await res.text()
console.log("❌ Shopify error",txt)
throw new Error(txt)
}

return res
}

throw new Error("Shopify failed")
}

function extractHandle(url:string){
return url
.replace("https://doorplaceusa.com/pages/","")
.replace("/pages/","")
.trim()
}

function randomLinkCount(){
return Math.floor(Math.random() * 11) + 10
}

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
`

export async function POST(){

console.log("🚀 LINK MESH START")

let totalUpdated=0
let batchCount=0

const {data:job}=await supabaseAdmin
.from("system_jobs")
.select("*")
.eq("job_name","swing_link_mesh")
.single()

let offset=job?.last_offset || 0

console.log("Resuming from offset:",offset)

const {data:inventory}=await supabaseAdmin
.from("shopify_url_inventory")
.select("url,title")
.or("url.ilike.%swing%,url.ilike.%swings%")

if(!inventory){
console.log("No inventory")
return NextResponse.json({success:false})
}

const allPages = inventory.map(row=>{
return{
slug: extractHandle(row.url),
title: row.title || extractHandle(row.url)
}
})

const totalPages = allPages.length

const {data:rotation}=await supabaseAdmin
.from("mesh_rotation_state")
.select("cursor_position")
.eq("id",1)
.single()

let cursor = rotation?.cursor_position || 0

while(true){

if(batchCount>MAX_BATCHES){
console.log("Safety stop")
break
}

console.log("Batch",batchCount)

const {data:pages}=await supabaseAdmin
.from("shopify_url_inventory")
.select("url")
.or("url.ilike.%swing%,url.ilike.%swings%")
.range(offset,offset+BATCH_SIZE-1)

if(!pages||pages.length===0){
console.log("Finished")
break
}

for(let i=0;i<pages.length;i++){

const url=pages[i].url
const handle=extractHandle(url)

console.log("Processing",handle)

let relatedLinks:{slug:string,title:string}[]=[]

const targetCount = randomLinkCount()

while(relatedLinks.length < targetCount){

const index = cursor % totalPages
const candidate = allPages[index]

cursor++

if(candidate.slug !== handle && !relatedLinks.find(l=>l.slug===candidate.slug)){
relatedLinks.push(candidate)
}

}

const dynamicLinks=`

<!-- TP_LINK_MESH_START -->

<div style="margin-top:40px;max-width:700px;margin-left:auto;margin-right:auto;text-align:left">

<h2 style="text-align:center">Explore More Porch Swings</h2>

<ul>

${relatedLinks.map(link=>`<li><a href="/pages/${link.slug}">${link.title}</a></li>`).join("")}

</ul>

</div>

${GUIDE_BLOCK}

<!-- TP_LINK_MESH_END -->

`

const findRes=await shopifyFetch(`/pages.json?handle=${handle}`)
const findJson=await findRes.json()

if(!findJson.pages||findJson.pages.length===0){
console.log("Page not found",handle)
continue
}

const pageId=findJson.pages[0].id
let existingBody=findJson.pages[0].body_html||""

existingBody=existingBody.replace(
/<!-- TP_LINK_MESH_START -->[\s\S]*?<!-- TP_LINK_MESH_END -->/g,
""
)

await shopifyFetch(`/pages/${pageId}.json`,{
method:"PUT",
body:JSON.stringify({
page:{
id:pageId,
body_html:existingBody+dynamicLinks
}
})
})

totalUpdated++

await sleep(SHOPIFY_DELAY_MS)

}

offset+=pages.length
batchCount++

await supabaseAdmin
.from("system_jobs")
.update({last_offset:offset})
.eq("job_name","swing_link_mesh")

await supabaseAdmin
.from("mesh_rotation_state")
.update({
cursor_position: cursor,
updated_at: new Date()
})
.eq("id",1)

console.log("Saved offset:",offset)

}

console.log("Updated",totalUpdated)

return NextResponse.json({
success:true,
updated:totalUpdated,
finalOffset:offset
})

}
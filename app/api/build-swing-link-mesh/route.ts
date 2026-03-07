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

function formatTitle(slug:string){

let cleaned = slug

cleaned = cleaned.replace(/-\d{4,}/g,"")

return cleaned
.replace(/-/g," ")
.replace(/\b\w/g,l=>l.toUpperCase())

}

const STATE_NEIGHBORS:Record<string,string[]>={
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
}

const STYLES=[
"daybed",
"farmhouse",
"patio",
"garden",
"backyard"
]

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
.select("url")
.or("url.ilike.%swing%,url.ilike.%swings%")

if(!inventory){
console.log("No inventory")
return NextResponse.json({success:false})
}

const allSlugs=inventory.map(row=>extractHandle(row.url))

/* ROTATION CURSOR */

const {data:rotation}=await supabaseAdmin
.from("mesh_rotation_state")
.select("cursor_position")
.eq("id",1)
.single()

let cursor = rotation?.cursor_position || 0

const stateBuckets:any={}
const styleBuckets:any={}
const typeBuckets:any={}

for(const row of inventory){

const slug = extractHandle(row.url)

const match = slug.match(/-([a-z]{2})$/)
const state = match ? match[1] : ""

if(!stateBuckets[state]) stateBuckets[state] = []
stateBuckets[state].push(slug)

for(const style of STYLES){

if(slug.includes(style)){
if(!styleBuckets[style]) styleBuckets[style]=[]
styleBuckets[style].push(slug)
}

}

let type="general"

if(slug.includes("daybed")) type="daybed"
else if(slug.includes("twin")) type="twin"
else if(slug.includes("crib")) type="crib"
else if(slug.includes("farmhouse")) type="farmhouse"
else if(slug.includes("patio")) type="patio"
else if(slug.includes("garden")) type="garden"
else if(slug.includes("backyard")) type="backyard"
else if(slug.includes("pool")) type="pool"

if(!typeBuckets[type]) typeBuckets[type]=[]
typeBuckets[type].push(slug)

}

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

let relatedLinks:string[]=[]

let currentType="general"

if(handle.includes("daybed")) currentType="daybed"
else if(handle.includes("twin")) currentType="twin"
else if(handle.includes("crib")) currentType="crib"
else if(handle.includes("farmhouse")) currentType="farmhouse"
else if(handle.includes("patio")) currentType="patio"
else if(handle.includes("garden")) currentType="garden"
else if(handle.includes("backyard")) currentType="backyard"
else if(handle.includes("pool")) currentType="pool"

for(const type of Object.keys(typeBuckets)){

if(type === currentType) continue

const bucket=typeBuckets[type]

if(bucket && bucket.length){

const candidate=bucket[Math.floor(Math.random()*bucket.length)]

if(candidate!==handle && !relatedLinks.includes(candidate)){
relatedLinks.push(candidate)
}

}

}

const match = handle.match(/-([a-z]{2})$/)
const state = match ? match[1] : ""

const stateList=stateBuckets[state]||[]

if(stateList.length){

const candidate=stateList[Math.floor(Math.random()*stateList.length)]

if(candidate!==handle && !relatedLinks.includes(candidate)){
relatedLinks.push(candidate)
}

}

/* ROTATION BASED LINKS */

while(relatedLinks.length<12){

const rotationSlug = allSlugs[cursor % allSlugs.length]

cursor++

if(rotationSlug!==handle && !relatedLinks.includes(rotationSlug)){
relatedLinks.push(rotationSlug)
}

}

const dynamicLinks=`

<!-- TP_LINK_MESH_START -->

<div style="margin-top:40px;max-width:700px;margin-left:auto;margin-right:auto;text-align:left">

<h2 style="text-align:center">Explore More Porch Swings</h2>

<ul>

${relatedLinks.map(slug=>`<li><a href="/pages/${slug}">${formatTitle(slug)}</a></li>`).join("")}

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
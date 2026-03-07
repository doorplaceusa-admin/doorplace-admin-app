export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const SHOP = process.env.SHOPIFY_STORE_DOMAIN!;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN!;
const API_VERSION = "2024-01";

const SHOPIFY_DELAY_MS = 650;
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

return slug
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

/* READ OFFSET */

const {data:job}=await supabaseAdmin
.from("system_jobs")
.select("*")
.eq("job_name","swing_link_mesh")
.single()

let offset=job?.last_offset || 0

console.log("Resuming from offset:",offset)

/* LOAD INVENTORY */

const {data:inventory}=await supabaseAdmin
.from("shopify_url_inventory")
.select("url")
.ilike("url","%porch-swing%")

if(!inventory){
console.log("No inventory")
return NextResponse.json({success:false})
}

/* GLOBAL SLUG POOL */

const allSlugs=inventory.map(row=>extractHandle(row.url))

const stateBuckets:any={}
const styleBuckets:any={}

/* BUILD BUCKETS */

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

}

/* PROCESS */

while(true){

if(batchCount>MAX_BATCHES){
console.log("Safety stop")
break
}

console.log("Batch",batchCount)

const {data:pages}=await supabaseAdmin
.from("shopify_url_inventory")
.select("url")
.ilike("url","%porch-swing%")
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

const match = handle.match(/-([a-z]{2})$/)
const state = match ? match[1] : ""

/* STATE LINKS */

const stateList=stateBuckets[state]||[]

if(stateList.length){

let startIndex=Math.floor(Math.random()*stateList.length)

for(let x=0;x<stateList.length && relatedLinks.length<15;x++){

let idx=(startIndex+x)%stateList.length
let candidate=stateList[idx]

if(candidate!==handle){
relatedLinks.push(candidate)
}

}

}

/* NEIGHBOR STATE */

const neighbors=STATE_NEIGHBORS[state]

if(neighbors?.length){

const neighbor=neighbors[Math.floor(Math.random()*neighbors.length)]

const neighborList=stateBuckets[neighbor]||[]

if(neighborList.length){
relatedLinks.push(neighborList[Math.floor(Math.random()*neighborList.length)])
}

}

/* STYLE LINK */

const style=STYLES[(offset+i)%STYLES.length]

const styleList=styleBuckets[style]||[]

if(styleList.length){
relatedLinks.push(styleList[(offset+i)%styleList.length])
}

/* FALLBACK LINKS */

while(relatedLinks.length<10){

const randomSlug=allSlugs[Math.floor(Math.random()*allSlugs.length)]

if(randomSlug!==handle && !relatedLinks.includes(randomSlug)){
relatedLinks.push(randomSlug)
}

}

/* BUILD HTML */

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

/* REMOVE OLD MESH */

existingBody=existingBody.replace(
/<!-- TP_LINK_MESH_START -->[\s\S]*?<!-- TP_LINK_MESH_END -->/g,
""
)

/* UPDATE PAGE */

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

/* SAVE OFFSET */

await supabaseAdmin
.from("system_jobs")
.update({last_offset:offset})
.eq("job_name","swing_link_mesh")

console.log("Saved offset:",offset)

}

console.log("Updated",totalUpdated)

return NextResponse.json({
success:true,
updated:totalUpdated,
finalOffset:offset
})

}
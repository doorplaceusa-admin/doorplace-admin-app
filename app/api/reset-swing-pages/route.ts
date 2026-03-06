export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

const SHOP = process.env.SHOPIFY_STORE_DOMAIN!;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN!;
const API_VERSION = "2024-01";

function sleep(ms:number){
  return new Promise(r => setTimeout(r, ms));
}

async function shopifyFetch(path:string, options:RequestInit = {}){

  const res = await fetch(`https://${SHOP}/admin/api/${API_VERSION}${path}`,{
    ...options,
    headers:{
      "X-Shopify-Access-Token":TOKEN,
      "Content-Type":"application/json"
    }
  });

  if(!res.ok){
    const text = await res.text();
    console.error("Shopify error:", text);
    throw new Error(text);
  }

  return res;
}

export async function POST(){

  console.log("RESET SWING PAGES STARTED");

  let scanned = 0;
  let fixed = 0;

  let nextPageInfo:string|null = null;

  do {

    const res = await shopifyFetch(
      `/pages.json?limit=250${nextPageInfo ? `&page_info=${nextPageInfo}` : ""}`
    );

    const data = await res.json();
    const pages = data.pages || [];

    console.log(`Batch pages: ${pages.length}`);

    for(const page of pages){

      scanned++;

      let html = page.body_html || "";

      if(!html.includes("Porch Swing Guides")) continue;

      const start = html.indexOf("Porch Swing Guides");
      const end = html.indexOf("Get a Fast Quote");

      if(start === -1 || end === -1) continue;

      const before = html.substring(0,start);
      const after = html.substring(end);

      const cleanedHTML = before + after;

      await shopifyFetch(`/pages/${page.id}.json`,{
        method:"PUT",
        body:JSON.stringify({
          page:{
            id:page.id,
            body_html:cleanedHTML
          }
        })
      });

      fixed++;

      console.log(`Cleaned page ${page.handle}`);

      await sleep(300);
    }

    const link = res.headers.get("link");
    const match = link?.match(/page_info=([^&>]+)>; rel="next"/);
    nextPageInfo = match ? match[1] : null;

    console.log(`Progress scanned=${scanned} fixed=${fixed}`);

  } while(nextPageInfo);

  console.log("RESET COMPLETE");

  return NextResponse.json({
    success:true,
    scanned,
    fixed
  });
}
let lastCall = 0

const MIN_DELAY = 600 // ms between ANY Shopify request

function sleep(ms:number){
  return new Promise(res=>setTimeout(res,ms))
}

export async function shopifyLimiter(){

  const now = Date.now()
  const wait = MIN_DELAY - (now - lastCall)

  if(wait > 0){
    await sleep(wait)
  }

  lastCall = Date.now()
}
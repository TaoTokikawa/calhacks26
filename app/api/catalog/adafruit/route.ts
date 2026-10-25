export const dynamic='force-dynamic';
const cache=new Map<string,{data:unknown;expires:number}>();let lastRequest=0;
export async function GET(request:Request){
 const id=new URL(request.url).searchParams.get('id')??'';
 if(!/^\d{1,6}$/.test(id))return Response.json({error:'Enter an Adafruit product ID of 1–6 digits.'},{status:400});
 const hit=cache.get(id);if(hit&&hit.expires>Date.now())return Response.json({...hit.data as object,cached:true});
 if(Date.now()-lastRequest<13000)return Response.json({error:'Supplier rate limit: wait 13 seconds between new product requests.'},{status:429,headers:{'Retry-After':'13'}});
 lastRequest=Date.now();
 try{
 const response=await fetch(`https://www.adafruit.com/api/product/${id}`,{signal:AbortSignal.timeout(12000),headers:{Accept:'application/json'}});
 if(!response.ok)return Response.json({error:`Supplier returned ${response.status}; no prices were updated.`},{status:502});
 const data=await response.json() as Record<string,unknown>;
 const price=Number(String(data.product_price??'').replace(/[$,]/g,''));
 if(!data.product_name||!Number.isFinite(price)||price<=0)return Response.json({error:'Supplier response lacked a valid product and price.'},{status:502});
 const raw=Array.isArray(data.discount_pricing)?data.discount_pricing:[];
 const breaks=raw.map((b:Record<string,unknown>)=>({quantity:Number(b.min_qty),price:Number(b.discounted_price)})).filter(b=>Number.isInteger(b.quantity)&&b.quantity>0&&Number.isFinite(b.price)&&b.price>0).sort((a,b)=>a.quantity-b.quantity);
 let url:string|undefined;try{const u=new URL(String(data.product_url));if(u.protocol==='https:'&&u.hostname==='www.adafruit.com')url=u.href}catch{}
 const result={source:'Adafruit Product API',kind:'catalog',productId:id,name:String(data.product_name),mpn:String(data.product_mpn??''),price,currency:'USD',availability:String(data.product_stock??'Unknown'),priceBreaks:breaks,url,retrievedAt:new Date().toISOString(),cached:false,notice:'Catalog observation, not a binding quote. Stock, shipping, taxes, compatibility and delivery need confirmation.'};
 if(cache.size>50)cache.clear();cache.set(id,{data:result,expires:Date.now()+15*60*1000});
 return Response.json(result,{headers:{'Cache-Control':'private, max-age=0'}});
 }catch{return Response.json({error:'Supplier lookup timed out or returned invalid data. Existing prices remain unchanged.'},{status:502})}
}

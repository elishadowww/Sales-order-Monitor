// Local stand-in for the HSSB mock API (same response shapes and filter rules).
// For offline development and UI testing only. Run: npm run mock, then start the
// app with HSSB_API_BASE=http://127.0.0.1:4010/api/mock/sales-orders
import http from "node:http";
// No key is stored in this file. It checks against HSSB_API_KEY from your environment if set,
// otherwise it accepts any key (it only serves fake data on your own machine).
const EXPECTED_KEY=process.env.HSSB_API_KEY||"";
const sites=["A10","B20","C30","D40","E50","KK01","SDK02","TWU03"];
const statuses=["Open order","Invoiced","Delivered","Cancelled"];
const names=["Siti Mart Sdn Bhd","John Distribution Sdn Bhd","Borneo Fresh Trading","KK Hardware Supply","Tawau Agro Enterprise"];
const orders=Array.from({length:1200},(_,i)=>{const n=i+1;const st=statuses[[0,0,0,0,0,0,0,1,1,1,1,1,1,2,2,2,2,2,3,3][n%20]];const amt=Math.round(((n*37)%900+50.35)*100)/100;return{SalesId:`SO-MOCK-${String(n).padStart(5,"0")}`,SalesName:names[n%5],CustAccount:`C${10000+n}`,InventSiteId:sites[n%8],DOT_ItemGroupId:"FG-HOME",SalesGroup:"SG-NORTH",SalesStatus:st,DocumentStatus:"Confirmed",DOT_ValidationStatus:"Validated",DOT_ShowOrderStatus:st,ShippingDateRequested:"2026-10-01",CreatedDateTime1:new Date(Date.UTC(2026,3,5)+n*3.6e6*3.5).toISOString(),ModifiedDateTime1:null,HAR_TotalSOAmount:amt,HAR_InvoicedAmount:st==="Invoiced"||st==="Delivered"?amt:0,HAR_BalanceAmount:st==="Invoiced"||st==="Delivered"?0:amt,SalesTaker:"Aisha Noor",CustomerRef:`PO-2026${String(n).padStart(3,"0")}`,SalesDistrictDescription:"Kota Kinabalu",SalesType:"Sales",DOT_SONotes:n%7===0?"Mock note — fictional assessment data":null,DOT_SFANotes:null,PurchOrderFormNum:`POF-${n}`,ReleaseStatus:"Open",MCROrderStopped:"No",HAR_SalesDeliveryDistrictId:"DD-B20",HAR_DeliveryDistrictDescription:"Sandakan"}});
const count=s=>orders.filter(o=>o.SalesStatus===s).length;
const summary=f=>({total_orders:1200,filtered_orders:f,open_orders:count("Open order"),invoiced_orders:count("Invoiced"),delivered_orders:count("Delivered"),cancelled_orders:count("Cancelled"),total_order_value:Math.round(orders.reduce((a,o)=>a+o.HAR_TotalSOAmount,0)*100)/100});
http.createServer((req,res)=>{const u=new URL(req.url,"http://x");const send=(c,b)=>{res.writeHead(c,{"content-type":"application/json"});res.end(JSON.stringify(b))};
 if(process.env.FAIL==="1")return send(500,{error:"boom"});
 if(!req.headers["x-assessment-key"]||(EXPECTED_KEY&&req.headers["x-assessment-key"]!==EXPECTED_KEY))return send(401,{error:"Unauthorized"});
 const p=u.pathname.replace(/^\/api\/mock\/sales-orders/,"");
 if(p==="/meta")return send(200,{facets:{statuses:statuses.map(v=>({value:v,count:count(v)})),sites:sites.map(v=>({value:v,count:150}))}});
 if(p.length>1){const o=orders.find(o=>o.SalesId.toLowerCase()===p.slice(1).toLowerCase());return o?send(200,{data:o}):send(404,{error:"Not found"});}
 let r=orders;const st=u.searchParams.get("status"),si=u.searchParams.get("site"),q=(u.searchParams.get("q")||"").toLowerCase();
 if(st)r=r.filter(o=>o.SalesStatus.toLowerCase()===st.toLowerCase());if(si)r=r.filter(o=>o.InventSiteId.toLowerCase()===si.toLowerCase());
 if(q)r=r.filter(o=>[o.SalesId,o.SalesName,o.CustAccount,o.CustomerRef,o.SalesTaker].some(v=>v.toLowerCase().includes(q)));
 const sort=u.searchParams.get("sort")||"SalesId",dir=u.searchParams.get("order")==="desc"?-1:1;r=[...r].sort((a,b)=>a[sort]>b[sort]?dir:a[sort]<b[sort]?-dir:0);
 const page=+u.searchParams.get("page")||1,ps=Math.min(+u.searchParams.get("pageSize")||25,100);
 send(200,{summary:summary(r.length),page,pageSize:ps,total:r.length,totalPages:Math.ceil(r.length/ps),sort,order:dir<0?"desc":"asc",data:r.slice((page-1)*ps,page*ps)});
}).listen(+process.env.PORT||4010,()=>console.log("mock up"));

/* Local-only website QA: node verify-site.cjs (or --staged during development).
 * Uses an existing Playwright installation via NODE_PATH; no site runtime dependency.
 * External form requests are intercepted and never sent to Google.
 */
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const repo = __dirname;
const staged = process.argv.includes("--staged");
const root = staged ? path.join(repo, ".verification", "greenfield") : repo;
const out = path.join(repo, ".verification", "greenfield-qa");
fs.mkdirSync(out, { recursive: true });
const mime = {".html":"text/html", ".css":"text/css", ".js":"text/javascript", ".png":"image/png", ".webp":"image/webp", ".svg":"image/svg+xml", ".xml":"text/xml"};
const routes = ["/","/showcase","/walkthrough","/product","/providers","/caregivers","/vendor-partners","/resources","/about","/support","/privacy","/terms","/delete-account","/pricing","/payment-return/"];
const widths = [390,768,1024,1440];
const errors = [];
const warnings = [];
const report = { mode:staged?"staged":"active", routes:[], pages:[], interactions:[], forms:[], errors, warnings };
const server = http.createServer((req,res)=>{
  const pathname = decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const base = pathname.startsWith("/images/") ? repo : root;
  const name = pathname === "/" ? "index.html" : pathname.replace(/^\/+/,"");
  const target = path.resolve(base,name);
  if (!target.startsWith(base+path.sep) && target!==base) { res.writeHead(403).end();return; }
  const candidates = [target,target+".html",path.join(target,"index.html")];
  const file = candidates.find(p=>fs.existsSync(p)&&fs.statSync(p).isFile());
  if (!file) {res.writeHead(404).end("Not found");return;}
  res.writeHead(200,{"Content-Type":mime[path.extname(file)]||"application/octet-stream"});
  fs.createReadStream(file).pipe(res);
});
let browser;
const check = (value,msg)=>{if(!value) errors.push(msg);};
async function main(){
  await new Promise(resolve=>server.listen(4187,"127.0.0.1",resolve));
  const base="http://127.0.0.1:4187";
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||"C:/Program Files/Google/Chrome/Application/chrome.exe"});
  for(const route of routes){
    const response=await fetch(base+route);
    report.routes.push({route,status:response.status});
    check(response.status===200,route+": HTTP "+response.status);
  }
  const links=new Set();
  for(const width of widths){
    const context=await browser.newContext({viewport:{width,height:900},reducedMotion:"reduce"});
    await context.route("https://script.google.com/**",r=>r.abort());
    const p=await context.newPage();
    p.on("pageerror",e=>errors.push(width+"px JS: "+e.message));
    for(const route of routes.filter(r=>r!=="/payment-return/")){
      await p.goto(base+route,{waitUntil:"load"});
      await p.evaluate(async()=>{await Promise.all([...document.images].map(im=>{im.loading="eager";return im.decode().catch(()=>{});}));});
      const data=await p.evaluate(()=>{
        const all=[...document.querySelectorAll("*")];
        const ids=all.filter(e=>e.id).map(e=>e.id);
        const headings=[...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map(e=>({level:+e.tagName.slice(1),text:e.textContent.trim()}));
        const badHeadings=headings.filter((h,i)=>i>0&&h.level>headings[i-1].level+1);
        const visible=e=>e.getClientRects().length>0;
        const tooSmall=[...document.querySelectorAll("button,input:not([type=hidden]),select,textarea,summary,.action,.quiet-link,.primary-nav a,.colophon nav a")]
          .filter(visible).filter(e=>e.getBoundingClientRect().height<43.5||e.getBoundingClientRect().width<43.5).map(e=>e.outerHTML.slice(0,150));
        return {width:innerWidth,height:document.documentElement.scrollHeight,overflow:document.documentElement.scrollWidth>innerWidth,
          duplicateIds:ids.filter((id,i)=>ids.indexOf(id)!==i),h1:document.querySelectorAll("h1").length,badHeadings,
          badImages:[...document.images].filter(i=>!i.hasAttribute("alt")||!i.alt.trim()||!i.complete||i.naturalWidth===0).map(i=>i.src),
          tooSmall,styles:[...document.styleSheets].map(s=>s.href),scripts:[...document.scripts].map(s=>s.src),
          anchors:[...document.querySelectorAll("a[href]")].map(a=>a.getAttribute("href")),title:document.title,
          description:document.querySelector('meta[name="description"]')?.content,
          mainWords:document.querySelector("main").innerText.trim().split(/\s+/).length,
          mainSections:document.querySelectorAll("main > section").length};
      });
      data.route=route; report.pages.push(data);
      check(!data.overflow,width+" "+route+": overflow");
      check(data.h1===1,width+" "+route+": H1 count "+data.h1);
      check(!data.duplicateIds.length,width+" "+route+": duplicate IDs "+data.duplicateIds);
      check(!data.badHeadings.length,width+" "+route+": heading hierarchy "+JSON.stringify(data.badHeadings));
      check(!data.badImages.length,width+" "+route+": bad images "+data.badImages);
      check(!data.tooSmall.length,width+" "+route+": touch controls "+JSON.stringify(data.tooSmall));
      check(data.title&&data.description,width+" "+route+": missing SEO");
      check(!data.styles.some(s=>/cytrea-v2|legal.css/.test(s)),route+": legacy CSS");
      check(!data.scripts.some(s=>/cytrea-v2/.test(s)),route+": legacy JS");
      for(const a of data.anchors) if(a.startsWith("/")||a.startsWith("#")) links.add(new URL(a,base+route).href);
      if(["/","/product","/providers","/caregivers","/vendor-partners","/resources","/about"].includes(route)) {
        for (const im of await p.locator("img:visible").all()) await im.scrollIntoViewIfNeeded();
        await p.evaluate(async()=>{window.scrollTo(0,0);await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);});
        await p.screenshot({path:path.join(out,(staged?"staged":"active")+"-"+(route==="/"?"home":route.slice(1))+"-"+width+".png"),fullPage:true});
        if(route === "/") await p.screenshot({path:path.join(out,"hero-"+width+".png"),fullPage:false});
        if(route === "/vendor-partners" && width === 390) await p.locator("#vendor-intake").screenshot({path:path.join(out,"vendor-form-390.png"),style:".masthead, .skip { visibility: hidden !important; }"});
        if(route === "/resources" && width === 390) await p.locator("#early-access-form").screenshot({path:path.join(out,"early-form-390.png"),style:".masthead, .skip { visibility: hidden !important; }"});
      }
    }
    await context.close();
  }
  for(const href of links){
    const url=new URL(href);
    const response=await fetch(url);
    check(response.status===200,"Broken internal link "+href);
    if(url.hash){
      const body=await response.text();
      check(body.includes('id="'+decodeURIComponent(url.hash.slice(1))+'"'),"Missing fragment "+href);
    }
  }
  const context=await browser.newContext({viewport:{width:390,height:900},reducedMotion:"reduce"});
  await context.route("https://script.google.com/**",r=>r.abort());
  const p=await context.newPage();
  async function testGroup(group){
    const tabIds=await group.evaluate(g=>[...g.querySelectorAll("[role=tab]")].filter(t=>t.closest("[data-switch-group]")===g).map(t=>t.id));
    for(const id of tabIds){
      const t=p.locator("#"+id);
      await t.click();
      const target=await t.getAttribute("aria-controls");
      check(await p.locator("#"+target).isVisible(),"Tab panel not visible "+id);
      const nested=p.locator("#"+target+" [data-switch-group]");
      for(const g of await nested.all()) if(await g.isVisible()) await testGroup(g);
    }
    if(tabIds.length>1){
      const first=p.locator("#"+tabIds[0]);await first.focus();await first.press("End");
      check(await p.locator("#"+tabIds.at(-1)).getAttribute("aria-selected")==="true","End key "+tabIds[0]);
      await p.locator("#"+tabIds.at(-1)).press("Home");
      check(await first.getAttribute("aria-selected")==="true","Home key "+tabIds[0]);
      await first.press("ArrowRight");
      check(await p.locator("#"+tabIds[1]).getAttribute("aria-selected")==="true","Arrow key "+tabIds[0]);
    }
  }
  for(const route of ["/","/product","/providers","/caregivers","/resources"]){
    await p.goto(base+route);
    const roots=await p.locator("[data-switch-group]").all();
    for(const g of roots){
      const top=await g.evaluate(el=>!el.parentElement.closest("[data-switch-group]"));
      if(top) await testGroup(g);
    }
    report.interactions.push(route+": tab clicks, active panels, keyboard arrows/Home/End");
  }
  await p.goto(base+"/");
  await p.getByRole("button",{name:"Open menu",exact:true}).click();
  check(await p.locator(".primary-nav").isVisible(),"Mobile menu not open");
  check(await p.locator(".primary-nav a").first().evaluate(e=>e===document.activeElement),"Menu focus not moved");
  await p.keyboard.press("Escape");
  check(await p.getByRole("button",{name:"Open menu",exact:true}).evaluate(e=>e===document.activeElement),"Escape did not restore focus");
  await p.locator("summary").first().focus();await p.keyboard.press("Enter");
  check(await p.locator("details").first().getAttribute("open")!==null,"FAQ keyboard open");
  await p.keyboard.press("Enter");check(await p.locator("details").first().getAttribute("open")===null,"FAQ keyboard close");
  report.interactions.push("Mobile navigation open/Escape/focus; native FAQ Enter open/close");
  await p.goto(base+"/vendor-partners");
  await p.locator("#vendor-directory-search").fill("wingwi");
  check(await p.locator("[data-vendor-search]:visible").count()===1,"Vendor search filtering");
  await p.locator("#vendor-directory-search").fill("zz-not-found");
  check(await p.locator("#vendor-no-results").isVisible(),"Vendor empty state");
  await p.locator("#vendor-directory-search").fill("");
  await p.locator("#vendor-category").selectOption("Other");
  check(await p.locator("#other-category-input").isVisible(),"Other category not visible");
  check(await p.locator("#other-category-input").getAttribute("required")!==null,"Other category not required");
  await p.locator("#vendor-category").selectOption({label:"Electricians"});
  check(!(await p.locator("#other-category-input").isVisible()),"Other category not hidden");
  const requests=[];
  await context.unroute("https://script.google.com/**");
  await context.route("https://script.google.com/**",async r=>{
    requests.push({url:r.request().url(),method:r.request().method(),body:r.request().postData()});
    await r.fulfill({status:200,contentType:"text/html",body:"<!doctype html><html><body>Local QA response only</body></html>"});
  });
  await p.locator('[name="Business Name"]').fill("Local QA Business");
  await p.locator('[name="Contact Person"]').fill("Local QA");
  await p.locator('[name="Email"]').fill("qa@example.invalid");
  await p.locator('[name="Phone"]').fill("2065550199"); // input handler formats
  check(await p.locator('[name="Phone"]').inputValue()==="(206) 555-0199","Vendor phone format");
  await p.locator('[name="Website"]').fill("https://example.invalid");
  await p.locator('[name="Service Area"]').fill("Local test");
  await p.locator('[name="Short Description"]').fill("Local contract test; not submitted externally.");
  await p.locator("#vendor-services-offered").fill("Electrical");
  await p.locator("#vendor-notes-input").fill("Local QA only");
  const waitVendor=p.waitForRequest(r=>r.url().startsWith("https://script.google.com/")&&r.method()==="POST");
  await p.locator("#vendor-submit-button").click();await waitVendor;
  await p.locator(".vendor-submission-feedback--success").waitFor();
  const vendorReq=requests.at(-1),vendorFields=new URLSearchParams(vendorReq.body);
  check(vendorFields.get("Primary Category")==="Home & Facility Services","Vendor primary category mapping");
  check(vendorFields.get("form_type")==="vendor_partner_application","Vendor form_type");
  check(vendorFields.get("Notes").includes("Services offered: Electrical")&&vendorFields.get("Notes").includes("Local QA only"),"Vendor combined notes");
  check(vendorFields.get("Phone")==="(206) 555-0199","Vendor phone payload");
  check(!!vendorFields.get("Submitted At"),"Vendor timestamp");
  report.forms.push({form:"vendor",method:vendorReq.method,url:vendorReq.url,fields:[...vendorFields.keys()],transport:"intercepted locally; no network submission"});
  await p.goto(base+"/resources");
  check(!(await p.locator("#waitlist-form").evaluate(f=>f.checkValidity())),"Empty waitlist should be invalid");
  await p.locator('[name="role"]').selectOption("caregiver");
  await p.locator('[name="name"]').fill("Local QA");
  await p.locator('[name="email"]').fill("qa@example.invalid");
  await p.locator('[name="phone"]').fill("2065550199");
  await p.locator('[name="city"]').fill("Local QA");
  const waitEarly=p.waitForRequest(r=>r.url().startsWith("https://script.google.com/")&&r.method()==="POST");
  await p.locator('#waitlist-form button[type="submit"]').click();await waitEarly;
  await p.locator("#form-message").waitFor({state:"visible"});
  const earlyReq=requests.at(-1),earlyFields=new URLSearchParams(earlyReq.body);
  check(earlyFields.get("role")==="caregiver","Early role contract");
  check(["name","email","phone","city"].every(k=>earlyFields.has(k)),"Early fields");
  report.forms.push({form:"earlyAccess",method:earlyReq.method,url:earlyReq.url,fields:[...earlyFields.keys()],transport:"intercepted locally; no network submission"});
  await context.close();
  // Baseline comparison reads the existing active V2 homepage while staging.
  if(staged){
    const baseline=await browser.newPage({viewport:{width:390,height:900}});
    await baseline.goto("http://127.0.0.1:4173/");
    report.baseline=await baseline.evaluate(()=>({height:document.documentElement.scrollHeight,sections:document.querySelectorAll("main>section").length}));
    await baseline.close();
  }
  fs.writeFileSync(path.join(out,(staged?"staged":"active")+"-report.json"),JSON.stringify(report,null,2));
  console.log(JSON.stringify({mode:report.mode,routeCount:report.routes.length,pageChecks:report.pages.length,internalLinks:links.size,formContracts:report.forms.length,errors,warnings,home:report.pages.filter(p=>p.route==="/").map(p=>({width:p.width,height:p.height,words:p.mainWords,sections:p.mainSections})),baseline:report.baseline},null,2));
  if(errors.length) process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});

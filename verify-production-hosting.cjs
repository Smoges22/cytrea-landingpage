"use strict";
// Local-only artifact, route, and source-fidelity checks. Never submits a form.
const fs = require("node:fs"), path = require("node:path"), crypto = require("node:crypto");
const {execFileSync} = require("node:child_process");
const {chromium} = require("playwright");
const {createPreviewServer} = require("./preview-server.js");
const manifest = require("./hosting-public-files.json");
const root = __dirname, evidence = path.join(root, ".verification/production-acceptance");
const builtRoot = path.join(evidence, "jekyll-site");
const baseline = "10e1aa2d123083a2ca1f1966b2fe34a2afcb2858";
const report = {checkedAt:new Date().toISOString(), baseline, checks:[], errors:[], files:[], secretFindings:[], routes:[]};
const check=(pass,label)=>{report.checks.push({pass:!!pass,label});if(!pass)report.errors.push(label);};
const digest=b=>crypto.createHash("sha256").update(b).digest("hex");
function filesAt(folder,prefix="") { return fs.readdirSync(folder,{withFileTypes:true}).flatMap(e=>e.isDirectory()?filesAt(path.join(folder,e.name),prefix+e.name+"/"):[prefix+e.name]); }
let browser, server;
async function main() {
  const expected = manifest.sourceFiles.flatMap(file => manifest.routes.includes(file.replace(/\.html$/, "")) ? [file,file.replace(/\.html$/, "/index.html")] : [file]).sort();
  report.files=filesAt(builtRoot).sort();
  report.unexpectedFiles=report.files.filter(f=>!expected.includes(f));
  report.missingFiles=expected.filter(f=>!report.files.includes(f));
  check(!report.unexpectedFiles.length,"Artifact contains only approved public files");
  check(!report.missingFiles.length,"Artifact contains every approved public dependency and compatibility redirect");
  const patterns=[
    ["private-key",/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
    ["token",/\b(?:gh[pousr]_[A-Za-z0-9]{25,}|github_pat_[A-Za-z0-9_]{25,}|sk_(?:live|test)_[A-Za-z0-9]{16,}|AKIA[A-Z0-9]{16}|AIza[0-9A-Za-z_-]{30,}|sb_secret_[A-Za-z0-9_-]{16,})\b/g],
    ["jwt",/\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}/g],
    ["literal-secret",/\b(?:password|api[_-]?key|secret|access[_-]?token|service[_-]?role[_-]?key)\b\s*[:=]\s*["'][^"']{8,}["']/gi],
    ["local-path-or-url",/(?:https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?|[A-Z]:[\\/]Users[\\/]|file:\/\/\/)/g],
    ["url-credential",/https?:\/\/[^\s/"']+:[^\s/"']+@/g],
    ["private-url",/https?:\/\/(?:10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+|[^\s/"']+\.internal)(?::\d+)?/g]
  ];
  for(const file of report.files){
    const bytes=fs.readFileSync(path.join(builtRoot,file));
    if(/\.(html|css|js|svg|xml|txt|md)$/.test(file)){
      const text=bytes.toString("utf8");
      for(const [kind,re] of patterns)for(const hit of text.matchAll(re))report.secretFindings.push({file,line:text.slice(0,hit.index).split("\n").length,kind,value:"[not printed]"});
    }
  }
  check(!report.secretFindings.length,"No secret/local-path pattern found in artifact text assets");
  report.artifactBytes=report.files.reduce((n,f)=>n+fs.statSync(path.join(builtRoot,f)).size,0);
  // Rendered body and every existing runtime/style/image remain the frozen source.
  for(const file of manifest.sourceFiles){
    if(file.endsWith(".html")&&file!=="payment-return/index.html"){
      const prior=execFileSync("git",["show",baseline+":"+file],{cwd:root,encoding:"utf8"});
      const output=manifest.routes.includes(file.replace(/\.html$/,""))?file.replace(/\.html$/,"/index.html"):file;
      const current=fs.readFileSync(path.join(builtRoot,output),"utf8");
      check(prior.match(/<body\b[\s\S]*$/i)?.[0]===current.match(/<body\b[\s\S]*$/i)?.[0],file+": frozen rendered body unchanged");
    }else if(/\.(css|js|png|webp|svg|woff2)$/.test(file)){
      check(digest(execFileSync("git",["show",baseline+":"+file],{cwd:root,maxBuffer:20e6}))===digest(fs.readFileSync(path.join(builtRoot,file))),file+": frozen bytes unchanged");
    }
  }
  server=createPreviewServer({root:builtRoot,built:true});await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  const base="http://127.0.0.1:"+server.address().port;
  browser=await chromium.launch({headless:true,executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe"});
  const context=await browser.newContext({serviceWorkers:"block"});
  await context.route("**/*",route=>new URL(route.request().url()).origin===base&&["GET","HEAD"].includes(route.request().method())?route.continue():route.abort());
  const page=await context.newPage();
  for(const route of ["",...manifest.routes]){
    const canonical="/"+route+(route?"/":"");
    for(const variant of [...new Set([canonical,route?"/"+route:"/",route?"/"+route+".html":"/"])]){
      const testUrl=variant+"?role=caregiver&qa=route#content";
      const response=await fetch(base+testUrl,{redirect:"manual"});
      await page.goto(base+testUrl);await page.waitForURL(u=>u.pathname===canonical);
      check(new URL(page.url()).search==="?role=caregiver&qa=route",testUrl+": query preserved");
      check(new URL(page.url()).hash==="#content",testUrl+": fragment preserved");
      const refreshed=await page.reload();check(refreshed.status()===200,testUrl+": refresh succeeds");
      check(await page.locator('link[rel="canonical"]').getAttribute("href")==="https://cytrea.com"+canonical,testUrl+": canonical tag");
      check(!(await page.locator("body").innerText()).startsWith("layout:"),testUrl+": no front matter leak");
      report.routes.push({variant,initialStatus:response.status,redirect:response.headers.get("location"),finalPath:new URL(page.url()).pathname});
    }
  }
  for(const file of [".git/config",".verification/production-acceptance/PRODUCTION_ACCEPTANCE_REPORT.md","FINAL_WEBSITE_FREEZE.md","preview-server.js","verify-production-hosting.cjs","apps-script/early-access/Code.gs","_config.yml","hosting-public-files.json","missing/nested/route"]){
    check((await fetch(base+"/"+file,{method:"HEAD"})).status===404,file+": not publicly served");
  }
  await context.close();
}
main().catch(error=>report.errors.push(error.message)).finally(async()=>{
  if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));
  fs.writeFileSync(path.join(evidence,"hosting-artifact-audit.json"),JSON.stringify(report,null,2)+"\n");
  console.log(JSON.stringify({checks:report.checks.length,files:report.files.length,bytes:report.artifactBytes,unexpected:report.unexpectedFiles,missing:report.missingFiles,secretFindings:report.secretFindings,errors:report.errors},null,2));
  if(report.errors.length)process.exitCode=1;
});

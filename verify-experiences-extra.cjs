"use strict";
const fs = require("node:fs"), path = require("node:path");
const site = require("./site-config.js"), downloads = require("./download-config.js");
module.exports = async function extra({ browser, base, context, check, report, out }) {
  report.experiences = { steps: [], motion: [], fallback: [], config: [] };
  const result = report.experiences;
  for (const [route,title,description] of [
    ["showcase","Cytrea Showcase | See the AFH Hiring App in Action","Explore real Cytrea app screens for caregivers and Adult Family Home providers."],
    ["walkthrough","How Cytrea Works | Caregiver & AFH Hiring Walkthrough","See how caregivers and Adult Family Home providers use Cytrea from profile setup to applications and hiring conversations."]
  ]) {
    const html=fs.readFileSync(path.join(__dirname,route+".html"),"utf8");
    check(html.includes(`<title>${title.replaceAll("&","&amp;")}</title>`)&&html.includes(`name="description" content="${description}"`),`${route}: exact metadata contract`);
    check(html.includes(`rel="canonical" href="https://cytrea.com/${route}"`),`${route}: canonical URL`);
    check(fs.readFileSync(path.join(__dirname,"sitemap.xml"),"utf8").includes(`https://cytrea.com/${route}</loc>`),`${route}: sitemap entry`);
  }
  check(site.resolveSocial().length === 0, "Social profiles must remain hidden until verified URLs are supplied.");
  for (const bad of ["javascript:alert(1)", "http://facebook.com/profile", "https://facebook.com.evil.invalid/profile", "https://facebook.com/", "https://user:password@facebook.com/profile"]) check(site.resolveSocial({ facebook: bad }).length === 0, "Unsafe/non-profile social URL accepted");
  const early = downloads.resolve({ ios: {...downloads.config.ios}, android: {...downloads.config.android, status:"early-access"} }), publicState = downloads.resolve({ ios: {...downloads.config.ios}, android: {...downloads.config.android, status:"public"} });
  check(site.SITE_BANNER.enabled === false && site.resolveBanner(early) === null, "Launch banner must remain disabled");
  check(site.resolveBanner(early,{enabled:true,kind:"public-launch"}) === null, "Banner guard announced public Android during Early Access");
  check(site.resolveBanner(publicState,{enabled:true,kind:"public-launch"})?.text === "Cytrea is now available on the App Store and Google Play.", "Future public banner does not resolve correctly");
  result.config.push({socialCount:site.resolveSocial().length,missing:["facebook","instagram"],bannerDefault:false,earlyAccessGuard:true,publicSimulation:true});
  for (const width of [390,768,1440]) {
    const ctx=await context({viewport:{width,height:900}}), p=await ctx.newPage();
    p.on("pageerror", e=>check(false,`Experience ${width}px JS: ${e.message}`));
    await p.goto(base+"/walkthrough");
    await p.evaluate(()=>document.fonts.ready);
    for (const [role,count] of [["caregiver",7],["provider",6]]) {
      await p.locator(`#walk-${role}-tab`).click();
      const journey=p.locator(`#journey-${role}`);
      const visible=await journey.locator("[data-walk-step]:visible").count();
      check(visible===(width>900?1:count),`${width}px ${role}: wrong visible step count ${visible}`);
      if(width>900) {
        for(let i=0;i<count;i++) {
          const tab=journey.locator("[data-step]").nth(i);await tab.click();
          const panel=journey.locator("[data-walk-step]:visible");
          const img=panel.locator("img");await img.scrollIntoViewIfNeeded();await img.evaluate(e=>e.decode());
          check(await panel.getAttribute("id")===`walk-${role}-step-${i+1}`,`${role} step ${i+1}: panel mismatch`);
          check(await tab.getAttribute("aria-selected")==="true",`${role} step ${i+1}: tab selection mismatch`);
          result.steps.push({width,role,step:i+1,image:await img.getAttribute("src")});
        }
        await journey.locator("[data-step]").last().focus();await p.keyboard.press("Home");
        check(await journey.locator("[data-step]").first().getAttribute("aria-selected")==="true",`${role}: Home key`);
        await p.keyboard.press("ArrowDown");check(await journey.locator("[data-step]").nth(1).getAttribute("aria-selected")==="true",`${role}: ArrowDown key`);
        await p.keyboard.press("End");check(await journey.locator("[data-walk-next]").isDisabled(),`${role}: last-step next button`);
        await p.keyboard.press("Home");await journey.locator("[data-walk-next]").click();
        check(await journey.locator("[data-step]").nth(1).getAttribute("aria-selected")==="true",`${role}: next-step button`);
      } else result.steps.push({width,role,visibleSteps:visible,vertical:true});
      const opener=journey.locator("[data-walk-step]:visible .screen-frame a").first();
      await opener.click();await p.locator(".lightbox-image").evaluate(img=>img.decode());
      check(await p.locator(".screenshot-lightbox").evaluate(d=>d.open),`${role}: walkthrough lightbox`);
      await p.keyboard.press("Escape");check(await opener.evaluate(el=>el===document.activeElement),`${role}: lightbox focus return`);
      await p.evaluate(()=>scrollTo({top:0,behavior:"instant"}));
    }
    // Resize a focused desktop stepper into the readable mobile sequence.
    if(width>900){
      await p.locator("#walk-provider-step-2-tab").focus();
      await p.setViewportSize({width:390,height:900});
      // matchMedia's change event arrives after the viewport protocol response.
      await p.waitForFunction(()=>[...document.querySelectorAll("#journey-provider [data-walk-step]")].filter(e=>e.getClientRects().length).length===6,undefined,{timeout:2000});
      check(await p.locator("#journey-provider [data-walk-step]:visible").count()===6,"Responsive stepper did not expose the mobile sequence");
      check(await p.evaluate(()=>!!document.activeElement.getClientRects().length),"Resize stranded keyboard focus");
    }
    await p.setViewportSize({width,height:900});
    await p.goto(base+"/showcase");
    for(const link of await p.locator(".chapter-nav a").all()) {const href=await link.getAttribute("href");check(await p.locator(href).count()===1,`Missing chapter ${href}`);}
    check(await p.locator(".showcase-chapter").count()===7,"Expected seven showcase chapters");
    if (width === 768) {
      check(await p.locator(".mockup-pair .mockup-primary figcaption").isVisible(), "Tablet showcase lost its primary screenshot caption");
      check(!await p.locator(".mockup-pair .mockup-secondary figcaption").isVisible(), "Tablet companion caption can overlap the foreground phone");
      check(await p.locator(".mockup-pair .mockup-secondary .screen-frame a").isVisible(), "Tablet companion screenshot link must remain available");
    }
    check(await p.locator(".primary-nav a").count()===6,"Primary navigation became crowded");
    check(await p.locator("[data-social-links]:visible").count()===0,"Unverified social links rendered");
    check(await p.locator("[data-site-banner]:visible").count()===0,"Disabled launch banner visible");
    const artwork=p.locator(".mockup-primary .screen-frame a").first();await artwork.click();await p.locator(".lightbox-image").evaluate(i=>i.decode());await p.keyboard.press("Escape");check(await artwork.evaluate(e=>e===document.activeElement),"Showcase lightbox focus return");
    await ctx.close();
  }
  const motion=await context({viewport:{width:1440,height:900}}), p=await motion.newPage();
  await p.goto(base+"/providers");const card=p.locator(".detail-grid article").first();
  check(await card.getAttribute("data-reveal-state")==="pending","Expected a below-fold pending entrance");
  await p.waitForTimeout(700);
  await card.evaluate(el=>scrollTo({top:el.getBoundingClientRect().top+scrollY-160,behavior:"instant"}));await p.waitForTimeout(180);
  const mid=await card.evaluate(e=>({opacity:getComputedStyle(e).opacity,transform:getComputedStyle(e).transform,state:e.dataset.revealState}));
  check(Number(mid.opacity)>0&&Number(mid.opacity)<1,"Scroll entrance was not observed in progress");
  await p.screenshot({path:path.join(out,"motion-in-progress.png")});await p.waitForTimeout(800);
  const settled=await card.evaluate(e=>({opacity:getComputedStyle(e).opacity,transform:getComputedStyle(e).transform,state:e.dataset.revealState}));
  check(Number(settled.opacity)===1&&settled.state==="visible","Scroll reveal did not settle visibly");
  await p.screenshot({path:path.join(out,"motion-settled.png")});result.motion.push({mid,settled});
  await p.emulateMedia({reducedMotion:"reduce"});
  check(await p.locator(".reveal-pending").count()===0,"Reduced-motion switch left hidden targets");
  await motion.close();
  for(const mode of ["no-js","reduced","no-observer"]){
    const ctx=await context(mode==="no-js"?{javaScriptEnabled:false,viewport:{width:390,height:900}}:{reducedMotion:mode==="reduced"?"reduce":"no-preference",viewport:{width:390,height:900}});
    if(mode==="no-observer")await ctx.addInitScript(()=>{delete window.IntersectionObserver;});
    const p=await ctx.newPage();
    for(const route of ["/showcase","/walkthrough"]){await p.goto(base+route);const info=await p.evaluate(()=>({h1:document.querySelectorAll("h1").length,pending:document.querySelectorAll(".reveal-pending").length,visibleSteps:[...document.querySelectorAll("[data-walk-step]")].filter(e=>e.getClientRects().length).length,opacity:[...document.querySelectorAll("[data-reveal]")].filter(e=>e.getClientRects().length).every(e=>Number(getComputedStyle(e).opacity)===1),overflow:document.documentElement.scrollWidth>innerWidth}));check(info.h1===1&&!info.pending&&info.opacity&&!info.overflow,`${mode} ${route}: fallback visibility failed ${JSON.stringify(info)}`);if(mode==="no-js"&&route==="/walkthrough")check(info.visibleSteps===13,"No-JS walkthrough does not expose both complete journeys");result.fallback.push({mode,route,...info});}
    await ctx.close();
  }
  const fixture=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unlinked social and future banner design fixtures</title><link rel="stylesheet" href="/cytrea.css"><link rel="stylesheet" href="/experiences.css"><body><main class="page-width" style="padding-block:40px"><h1 style="font-size:32px">Design fixtures only</h1><p>No social URLs are configured. These are unlinked style samples, not Cytrea profile links.</p><div class="colophon--dark" style="padding:32px;border-radius:24px"><div class="social-row"><button type="button" class="social-link social-link--facebook" aria-label="Facebook style sample, not linked"><img src="/images/social-icons/facebook.svg" width="24" height="24" alt=""></button><button type="button" class="social-link social-link--instagram" aria-label="Instagram style sample, not linked"><img src="/images/social-icons/instagram.svg" width="24" height="24" alt=""></button></div></div><h2 style="margin-top:40px">Future public banner · disabled on the site</h2><aside class="site-banner"><div class="page-width"><p>${site.resolveBanner(publicState,{enabled:true,kind:"public-launch"}).text}</p></div></aside></main></body></html>`;
  fs.writeFileSync(path.join(out,"design-fixtures.html"),fixture);
  const fixtureContext=await context({viewport:{width:1000,height:650}}), fixturePage=await fixtureContext.newPage();
  const fixtureUrl = "/" + path.relative(__dirname, path.join(out,"design-fixtures.html")).split(path.sep).join("/");
  await fixturePage.goto(base+fixtureUrl);await fixturePage.evaluate(()=>document.fonts.ready);await fixturePage.screenshot({path:path.join(out,"design-fixtures.png")});
  await fixturePage.locator(".social-link--instagram").hover();await fixturePage.waitForTimeout(250);check(await fixturePage.locator(".social-link--instagram").evaluate(e=>getComputedStyle(e).transform!=="none"),"Social hover fixture did not lift");
  await fixturePage.emulateMedia({reducedMotion:"reduce"});check(await fixturePage.locator(".social-link--instagram").evaluate(e=>getComputedStyle(e).transform==="none"),"Social reduced-motion fixture still moves");
  await fixtureContext.close();
};

(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))r(a);new MutationObserver(a=>{for(const o of a)if(o.type==="childList")for(const s of o.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&r(s)}).observe(document,{childList:!0,subtree:!0});function t(a){const o={};return a.integrity&&(o.integrity=a.integrity),a.referrerPolicy&&(o.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?o.credentials="include":a.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function r(a){if(a.ep)return;a.ep=!0;const o=t(a);fetch(a.href,o)}})();function W(e){const n=[];(!e.name||e.name.trim()==="")&&n.push("Give the circle a name."),(!Number.isFinite(e.contribution)||e.contribution<=0)&&n.push("The contribution must be more than zero."),(!e.currency||e.currency.trim()==="")&&n.push("Choose a currency.");const t=(e.memberNames??[]).map(r=>(r??"").trim()).filter(r=>r!=="");if(t.length<2&&n.push("A circle needs at least 2 members."),e.payoutOrderIndices){const r=e.payoutOrderIndices;r.length===t.length&&new Set(r).size===t.length&&r.every(o=>Number.isInteger(o)&&o>=0&&o<t.length)||n.push("The payout order must list every member exactly once.")}return n}function q(e){const n=[];if(!e||typeof e!="object")return["Not a circle."];if(e.version!==1&&n.push("Unsupported circle version."),(!e.name||e.name.trim()==="")&&n.push("Give the circle a name."),(!Number.isFinite(e.contribution)||e.contribution<=0)&&n.push("The contribution must be more than zero."),!Array.isArray(e.members)||e.members.length<2)n.push("A circle needs at least 2 members.");else{const r=e.members.map(s=>s.id),a=e.payoutOrder??[];a.length===r.length&&new Set(a).size===r.length&&a.every(s=>r.includes(s))||n.push("The payout order must list every member exactly once.")}return(e.rounds??[]).filter(r=>r.status==="open").length!==1&&n.push("A circle must have exactly one open round."),n}function T(){return typeof crypto<"u"&&"randomUUID"in crypto?crypto.randomUUID():`id-${Date.now().toString(36)}-${Math.floor(Math.random()*1e9).toString(36)}`}function H(e,n){return{id:T(),number:e,recipientId:n,status:"open",marks:[]}}function z(e,n=new Date){const t=W(e);if(t.length>0)throw new Error(t[0]);const r=e.memberNames.map(o=>(o??"").trim()).filter(o=>o!=="").map(o=>({id:T(),name:o})),a=e.payoutOrderIndices?e.payoutOrderIndices.map(o=>r[o].id):r.map(o=>o.id);return{id:T(),version:1,name:e.name.trim(),contribution:e.contribution,currency:e.currency.trim().toUpperCase(),schedule:e.schedule,startDate:e.startDate,members:r,payoutOrder:a,rounds:[H(1,a[0])],createdAt:n.toISOString()}}function k(e){return e.rounds.find(n=>n.status==="open")}function N(e){return e.contribution*e.members.length}function g(e,n){var t;return((t=e.members.find(r=>r.id===n))==null?void 0:t.name)??"Unknown member"}function R(e,n){const t=new Set(n.marks.map(r=>r.memberId));return{paidCount:n.marks.length,memberCount:e.members.length,collected:n.marks.length*e.contribution,pot:N(e),unpaidIds:e.members.filter(r=>!t.has(r.id)).map(r=>r.id)}}function A(e){return{...e,members:e.members.map(n=>({...n})),payoutOrder:[...e.payoutOrder],rounds:e.rounds.map(n=>({...n,marks:n.marks.map(t=>({...t})),shortfall:n.shortfall?[...n.shortfall]:void 0}))}}function G(e,n){const t=e.rounds.find(r=>r.id===n);if(!t)throw new Error("That round does not exist.");return t}function _(e,n,t,r=new Date){const a=A(e),o=G(a,n);if(o.status==="closed")throw new Error("That round is closed.");if(!a.members.some(s=>s.id===t))throw new Error("That member is not in this circle.");return o.marks.some(s=>s.memberId===t)||o.marks.push({memberId:t,roundId:n,paidAt:r.toISOString()}),a}function K(e,n,t){const r=A(e),a=G(r,n);if(a.status==="closed")throw new Error("That round is closed.");return a.marks=a.marks.filter(o=>o.memberId!==t),r}function Y(e,n=new Date){const t=A(e),r=k(t);if(!r)throw new Error("There is no open round to close.");const a=R(t,r);r.status="closed",r.closedAt=n.toISOString(),r.shortfall=a.unpaidIds;const o=r.number+1,s=t.payoutOrder[(o-1)%t.payoutOrder.length];return t.rounds.push(H(o,s)),t}function J(e){const n=k(e),t=n?n.number:e.rounds.length+1,r=e.payoutOrder.length;return e.payoutOrder.map((a,o)=>{const s=((o-(t-1))%r+r)%r;return{memberId:a,roundNumber:t+s}})}const V="esusu",X=1,L="circles";let E=null,u=null,D=!0;function j(){return E||(E=new Promise((e,n)=>{let t;try{t=indexedDB.open(V,X)}catch(r){n(r);return}t.onupgradeneeded=()=>{const r=t.result;r.objectStoreNames.contains(L)||r.createObjectStore(L,{keyPath:"id"})},t.onsuccess=()=>e(t.result),t.onerror=()=>n(t.error),t.onblocked=()=>n(new Error("IndexedDB blocked"))}),E)}function O(e){return new Promise((n,t)=>{e.onsuccess=()=>n(e.result),e.onerror=()=>t(e.error)})}async function M(e,n){const r=(await j()).transaction(L,e),a=new Promise((s,m)=>{r.oncomplete=()=>s(),r.onerror=()=>m(r.error),r.onabort=()=>m(r.error??new Error("Transaction aborted"))}),o=await n(r.objectStore(L));return await a,o}async function Z(){if(u)return!1;try{return await j(),D=!0,!0}catch{return S(),!1}}function S(){u||(u=new Map),D=!1}function x(e){return e.sort((n,t)=>n.createdAt<t.createdAt?1:-1)}async function Q(){if(u)return x([...u.values()]);try{const e=await M("readonly",n=>O(n.getAll()));return x(e??[])}catch{return S(),x([...u.values()])}}async function P(e){if(u)return u.get(e);try{return await M("readonly",n=>O(n.get(e)))}catch{return S(),u.get(e)}}async function $(e){const n=q(e);if(n.length>0)throw new Error(n[0]);if(u){u.set(e.id,e);return}try{await M("readwrite",t=>O(t.put(e)))}catch{S(),u.set(e.id,e)}}async function ee(e){if(u){u.delete(e);return}try{await M("readwrite",n=>O(n.delete(e)))}catch{S(),u.delete(e)}}const te=[{code:"NGN",label:"NGN — Nigerian naira"},{code:"XOF",label:"XOF — West African CFA franc"},{code:"GHS",label:"GHS — Ghanaian cedi"},{code:"KES",label:"KES — Kenyan shilling"},{code:"ZAR",label:"ZAR — South African rand"},{code:"USD",label:"USD — US dollar"},{code:"EUR",label:"EUR — Euro"},{code:"GBP",label:"GBP — British pound"}];function b(e,n){try{return new Intl.NumberFormat(void 0,{style:"currency",currency:n,maximumFractionDigits:Number.isInteger(e)?0:2}).format(e)}catch{return`${n} ${e.toLocaleString()}`}}function c(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}async function B(e,n){var v,C;const t=await P(n);if(!t){e.innerHTML=`
      <h1>Circle not found</h1>
      <p class="muted">That circle isn't on this phone.</p>
      <p><a class="btn block" href="#/">Back to your circles</a></p>
    `;return}const r=k(t),a=N(t),o=r?R(t,r):void 0,s=new Set((r==null?void 0:r.marks.map(i=>i.memberId))??[]),m=t.members.map(i=>{const p=s.has(i.id),y=(r==null?void 0:r.recipientId)===i.id;return`
        <div class="row">
          <span>${c(i.name)}${y?' <span class="badge paid">receives this round</span>':""}</span>
          ${p?`<span><span class="badge paid">Paid</span>
                 <button class="ghost" data-unmark="${c(i.id)}">Undo</button></span>`:`<button data-mark="${c(i.id)}">Mark paid</button>`}
        </div>
      `}).join(""),l=J(t).map(({memberId:i,roundNumber:p})=>`
        <div class="row">
          <span>Round ${p}</span>
          <span>${c(g(t,i))}${r&&p===r.number?' <span class="badge paid">this round</span>':""}</span>
        </div>
      `).join(""),d=t.rounds.filter(i=>i.status==="closed").slice().reverse().map(i=>{const p=i.shortfall&&i.shortfall.length>0?`<p class="small muted">Shortfall: ${i.shortfall.map(y=>c(g(t,y))).join(", ")} did not pay (${b(i.shortfall.length*t.contribution,t.currency)} short).</p>`:'<p class="small muted">Everyone paid in full.</p>';return`
        <div class="card">
          <p class="card-title">Round ${i.number} — ${c(g(t,i.recipientId))}</p>
          ${p}
        </div>
      `}).join("");e.innerHTML=`
    <p><a href="#/">&larr; Your circles</a></p>
    <h1>${c(t.name)}</h1>

    <div class="summary">
      <p class="big">Round ${(r==null?void 0:r.number)??"—"}: ${r?c(g(t,r.recipientId)):"—"} receives ${b(a,t.currency)}</p>
      <p class="muted">${b(t.contribution,t.currency)} per member · ${t.schedule} · started ${c(t.startDate)}</p>
      <p>${o?`${o.paidCount} of ${o.memberCount} paid · ${b(o.collected,t.currency)} of ${b(a,t.currency)} collected`:""}</p>
    </div>

    <h2>This round — who has paid</h2>
    <div class="card">${m}</div>

    <div class="actions">
      <button class="primary block" id="close-round">Close round ${(r==null?void 0:r.number)??""} and start the next</button>
      <a class="btn block" href="#/share/${encodeURIComponent(t.id)}">Share this circle</a>
      <button class="danger block" id="delete-circle">Delete this circle</button>
    </div>

    <h2>Payout order</h2>
    <div class="card">${l}</div>

    ${d?`<h2>Past rounds</h2>${d}`:""}
  `;const h=()=>B(e,n);e.querySelectorAll("[data-mark]").forEach(i=>{i.addEventListener("click",async()=>{if(!r)return;const p=_(t,r.id,i.dataset.mark);await $(p),await h()})}),e.querySelectorAll("[data-unmark]").forEach(i=>{i.addEventListener("click",async()=>{if(!r)return;const p=K(t,r.id,i.dataset.unmark);await $(p),await h()})}),(v=e.querySelector("#close-round"))==null||v.addEventListener("click",async()=>{if(!r||!o)return;if(o.unpaidIds.length>0){const p=o.unpaidIds.map(w=>g(t,w)).join(", ");if(!window.confirm(`${p} ${o.unpaidIds.length===1?"has":"have"} not paid yet. Close round ${r.number} anyway? The shortfall will be recorded on the round.`))return}const i=Y(t);await $(i),await h()}),(C=e.querySelector("#delete-circle"))==null||C.addEventListener("click",async()=>{window.confirm(`Delete "${t.name}"? This removes it from this phone only. Other members keep their own copies.`)&&(await ee(t.id),window.location.hash="#/")})}function re(e){var s,m;const n=new Date().toISOString().slice(0,10),t=te.map(l=>`<option value="${l.code}"${l.code==="NGN"?" selected":""}>${c(l.label)}</option>`).join("");e.innerHTML=`
    <p><a href="#/">&larr; Your circles</a></p>
    <h1>Create a circle</h1>
    <form id="circle-form" novalidate>
      <label for="f-name">Circle name</label>
      <input id="f-name" type="text" autocomplete="off" placeholder="e.g. Market Women Circle" />
      <p class="field-error" id="e-name"></p>

      <label for="f-contribution">Contribution per member</label>
      <input id="f-contribution" type="number" inputmode="decimal" min="0" step="any" placeholder="e.g. 5000" />
      <p class="field-error" id="e-contribution"></p>

      <label for="f-currency">Currency</label>
      <select id="f-currency">${t}</select>

      <label for="f-schedule">Schedule</label>
      <select id="f-schedule">
        <option value="weekly" selected>Weekly</option>
        <option value="monthly">Monthly</option>
      </select>

      <label for="f-start">Start date</label>
      <input id="f-start" type="date" value="${n}" />

      <label>Members (at least 2)</label>
      <p class="small muted">Members receive the pot in the order you list them.</p>
      <div id="member-rows"></div>
      <p class="field-error" id="e-members"></p>
      <button type="button" class="ghost" id="add-member">+ Add a member</button>

      <div class="actions">
        <button type="submit" class="primary block">Create circle</button>
      </div>
    </form>
  `;const r=e.querySelector("#member-rows");function a(l=""){var h;const d=document.createElement("div");d.className="row",d.innerHTML=`
      <input type="text" class="member-name" autocomplete="off"
             placeholder="Member name" value="${c(l)}" style="flex:1" />
      <button type="button" class="ghost remove-member" aria-label="Remove member">&times;</button>
    `,(h=d.querySelector(".remove-member"))==null||h.addEventListener("click",()=>d.remove()),r.appendChild(d)}a(),a(),a(),(s=e.querySelector("#add-member"))==null||s.addEventListener("click",()=>a());const o=(l,d)=>{const h=e.querySelector(`#${l}`);h&&(h.textContent=d)};(m=e.querySelector("#circle-form"))==null||m.addEventListener("submit",async l=>{l.preventDefault();const d=e.querySelector("#f-name").value,h=e.querySelector("#f-contribution").value,v=Number(h),C=e.querySelector("#f-currency").value,i=e.querySelector("#f-schedule").value,p=e.querySelector("#f-start").value||n,y=[...e.querySelectorAll(".member-name")].map(f=>f.value.trim()).filter(f=>f!=="");let w=!0;if(o("e-name",""),o("e-contribution",""),o("e-members",""),d.trim()===""&&(o("e-name","Give the circle a name."),w=!1),(h.trim()===""||!Number.isFinite(v)||v<=0)&&(o("e-contribution","The contribution must be more than zero."),w=!1),y.length<2&&(o("e-members","A circle needs at least 2 members."),w=!1),!!w)try{const f=z({name:d,contribution:v,currency:C,schedule:i,startDate:p,memberNames:y});await $(f),window.location.hash=`#/circle/${encodeURIComponent(f.id)}`}catch(f){o("e-members",f instanceof Error?f.message:"Something went wrong.")}})}async function ne(e){const n=await Q();if(n.length===0){e.innerHTML=`
      <div class="empty">
        <h1>Your savings circles</h1>
        <p>No circles yet. Create one for your ajo, esusu, tontine,
           stokvel or arisan group — it lives only on this phone.</p>
        <p><a class="btn primary block" href="#/new">Create a circle</a></p>
      </div>
    `;return}const t=n.map(r=>{const a=k(r),o=a?R(r,a):void 0,s=a?`Round ${a.number} · ${c(g(r,a.recipientId))} receives ${b(N(r),r.currency)}`:"No open round",m=o?`<span class="badge ${o.paidCount===o.memberCount?"paid":"unpaid"}">${o.paidCount} of ${o.memberCount} paid</span>`:"";return`
        <a class="card" href="#/circle/${encodeURIComponent(r.id)}">
          <p class="card-title">${c(r.name)}</p>
          <p class="muted">${b(r.contribution,r.currency)} per member · ${r.schedule}</p>
          <div class="row"><span>${s}</span>${m}</div>
        </a>
      `}).join("");e.innerHTML=`
    <h1>Your savings circles</h1>
    ${t}
    <div class="actions">
      <a class="btn primary block" href="#/new">Create a circle</a>
    </div>
  `}const I="This link is damaged or incomplete.";function oe(e){const n=JSON.stringify(e),t=new TextEncoder().encode(n);let r="";return t.forEach(a=>{r+=String.fromCharCode(a)}),btoa(r).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}function ae(e){let n;try{const a=e.replace(/-/g,"+").replace(/_/g,"/"),o=a+"=".repeat((4-a.length%4)%4),s=atob(o),m=Uint8Array.from(s,l=>l.charCodeAt(0));n=JSON.parse(new TextDecoder().decode(m))}catch{return{error:I}}return!n||typeof n!="object"?{error:I}:n.version!==1?{error:"This link was made by a different version of Esusu and can't be opened here."}:q(n).length>0?{error:I}:{circle:n}}function se(e,n){const t=new URL(n);return t.hash=`c=${oe(e)}`,t.toString()}function ie(e){const n=e.indexOf("#"),t=n>=0?e.slice(n+1):e,r=new URLSearchParams(t).get("c");return r?ae(r):{error:I}}function ce(e){const n=k(e),t=n?R(e,n):void 0,r=e.members.map(a=>{const o=n==null?void 0:n.marks.some(s=>s.memberId===a.id);return`<div class="row"><span>${c(a.name)}</span>${n?`<span class="badge ${o?"paid":"unpaid"}">${o?"Paid":"Not paid"}</span>`:""}</div>`}).join("");return`
    <div class="summary">
      <p class="big">${c(e.name)}</p>
      <p class="muted">${b(e.contribution,e.currency)} per member · ${e.schedule} · ${e.members.length} members</p>
      ${n?`<p>Round ${n.number}: ${c(g(e,n.recipientId))} receives ${b(N(e),e.currency)} · ${(t==null?void 0:t.paidCount)??0} of ${(t==null?void 0:t.memberCount)??0} paid</p>`:""}
    </div>
    <div class="card">${r}</div>
  `}async function le(e,n){var m,l;const t=await P(n);if(!t){e.innerHTML=`
      <h1>Circle not found</h1>
      <p class="muted">That circle isn't on this phone.</p>
      <p><a class="btn block" href="#/">Back to your circles</a></p>
    `;return}const r=window.location.href.split("#")[0],a=se(t,r);e.innerHTML=`
    <p><a href="#/circle/${encodeURIComponent(t.id)}">&larr; Back to the circle</a></p>
    <h1>Share "${c(t.name)}"</h1>
    <p class="muted">Anyone who opens this link sees the circle exactly as it is now
       and can save their own copy. The link carries the circle itself — there is
       no server and nothing to sign up for. Send a fresh link whenever the
       circle changes.</p>
    <label for="share-link">Share link</label>
    <input id="share-link" type="text" readonly value="${c(a)}" />
    <div class="actions">
      <button class="primary block" id="copy-link">Copy link</button>
      ${"share"in navigator?'<button class="block" id="system-share">Share…</button>':""}
    </div>
    <p class="small muted" id="share-status"></p>
  `;const o=e.querySelector("#share-status"),s=e.querySelector("#share-link");(m=e.querySelector("#copy-link"))==null||m.addEventListener("click",async()=>{var d;try{await navigator.clipboard.writeText(a),o&&(o.textContent="Link copied.")}catch{s.select(),(d=document.execCommand)==null||d.call(document,"copy"),o&&(o.textContent="Link selected — copy it now.")}}),(l=e.querySelector("#system-share"))==null||l.addEventListener("click",async()=>{try{await navigator.share({title:`Esusu: ${t.name}`,url:a})}catch{}})}async function de(e,n){var a;const t=ie(n);if("error"in t){e.innerHTML=`
      <h1>That link won't open</h1>
      <div class="banner error" role="alert">${c(t.error)}</div>
      <p><a class="btn block" href="#/">Go to your circles</a></p>
    `;return}const r=t.circle;e.innerHTML=`
    <h1>Shared circle</h1>
    ${ce(r)}
    <div class="actions">
      <button class="primary block" id="save-copy">Save a copy on this phone</button>
      <a class="btn block" href="#/">Not now — go to your circles</a>
    </div>
    <p class="small muted">Saving makes this your own copy on this phone. It will not
       change the sender's copy, and their later changes won't change yours.</p>
  `,(a=e.querySelector("#save-copy"))==null||a.addEventListener("click",async()=>{const s=await P(r.id)?{...r,id:T()}:r;await $(s),window.location.hash=`#/circle/${encodeURIComponent(s.id)}`})}const U=document.getElementById("app");U&&(U.innerHTML=`
    <header class="app-header">
      <a class="brand" href="#/">Esusu</a>
      <span class="tagline">circle savings, on your phone</span>
    </header>
    <div id="storage-banner"></div>
    <main id="view">
      <div class="empty">
        <p>Loading your circles…</p>
      </div>
    </main>
  `);Z().then(()=>{const e=document.getElementById("storage-banner");e&&!D&&(e.innerHTML=`
      <div class="banner warn" role="alert">
        This device can't save circles — anything you enter now will be gone
        when you close the app. Try a regular (non-private) browser window.
      </div>
    `)});async function F(){const e=document.getElementById("view");if(!e)return;const n=window.location.hash;if(n.startsWith("#c=")){await de(e,window.location.href);return}const t=n.replace(/^#/,"")||"/";if(t==="/"){await ne(e);return}if(t==="/new"){re(e);return}const r=t.match(/^\/circle\/(.+)$/);if(r){await B(e,decodeURIComponent(r[1]));return}const a=t.match(/^\/share\/(.+)$/);if(a){await le(e,decodeURIComponent(a[1]));return}e.innerHTML=`
    <h1>Page not found</h1>
    <p><a class="btn block" href="#/">Go to your circles</a></p>
  `}window.addEventListener("hashchange",()=>{F()});F();"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("./sw.js").catch(()=>{})});

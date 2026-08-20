const S={cats:[],data:null,matrices:null,activeCh:new Set(),selected:new Set(),page:1,pageSize:80,prices:{},analysis:[],calc:null,openMatrix:null};
const $=x=>document.getElementById(x);const fmt=n=>Number(n||0).toLocaleString('es-MX');
async function getJSON(url){const r=await fetch(url);if(!r.ok)throw new Error(url);return r.json()}
async function boot(){
 S.cats=await getJSON('data/categories.json');
 $('category').innerHTML=S.cats.map(c=>`<option value="${c.slug}">${esc(c.name)}</option>`).join('');
 $('category').addEventListener('change',loadCategory);$('chapAll').onclick=()=>setCh(true);$('chapNone').onclick=()=>setCh(false);$('conceptAll').onclick=()=>setVisible(true);$('conceptNone').onclick=()=>setVisible(false);$('search').oninput=resetRender;$('subchapter').onchange=resetRender;$('onlyMatrix').onchange=resetRender;$('prev').onclick=()=>{if(S.page>1){S.page--;renderConcepts()}};$('next').onclick=()=>{S.page++;renderConcepts()};$('analyze').onclick=analyzeMaterials;$('calculate').onclick=calculateBudget;document.querySelectorAll('[data-export]').forEach(b=>b.onclick=()=>exportFile(b.dataset.export));
 await loadCategory();
}
async function loadCategory(){
 document.body.classList.add('loading');S.matrices=null;S.prices={};S.analysis=[];S.calc=null;S.openMatrix=null;
 S.data=await getJSON(`data/${$('category').value}/structure.json`);S.activeCh=new Set(S.data.chapters.map(x=>x.code));S.selected=new Set(S.data.concepts.filter(c=>c.hasMatrix).map(c=>c.code));S.page=1;
 renderMeta();renderChapters();renderSubchapters();renderConcepts();
 $('matrixDetail').className='empty';$('matrixDetail').textContent='Ninguna matriz abierta.';$('materials').className='empty';$('materials').textContent='Ejecuta el análisis para obtener los materiales prioritarios.';resetResults();document.body.classList.remove('loading');
}
function resetResults(){S.calc=null;$('results').className='empty';$('results').textContent='Captura los precios que quieras actualizar y ejecuta el recálculo.';$('downloads').classList.add('hidden');$('exportStatus').textContent=''}
function renderMeta(){const c=S.cats.find(x=>x.slug===S.data.slug);$('meta').innerHTML=`<div class="metric"><small>Partidas</small><b>${fmt(c.chapterCount)}</b></div><div class="metric"><small>Conceptos</small><b>${fmt(c.conceptCount)}</b></div><div class="metric"><small>Matrices</small><b>${fmt(c.matrixCount)}</b></div><div class="metric"><small>Archivos matriz</small><b>${fmt(c.matrixFiles)}</b></div>`}
function renderChapters(){$('chapters').innerHTML=S.data.chapters.map(c=>`<label class="check on"><input type="checkbox" data-ch="${esc(c.code)}" checked><span><b>${esc(c.name)}</b><br><span class="code">${esc(c.code)} · ${fmt(c.conceptCount)} conceptos · ${fmt(c.matrixCount)} con matriz</span></span></label>`).join('');document.querySelectorAll('[data-ch]').forEach(x=>x.onchange=()=>{x.checked?S.activeCh.add(x.dataset.ch):S.activeCh.delete(x.dataset.ch);x.parentElement.classList.toggle('on',x.checked);renderSubchapters();resetRender();resetResults()})}
function setCh(v){document.querySelectorAll('[data-ch]').forEach(x=>{x.checked=v;x.parentElement.classList.toggle('on',v)});S.activeCh=v?new Set(S.data.chapters.map(x=>x.code)):new Set();renderSubchapters();resetRender();resetResults()}
function renderSubchapters(){const list=S.data.subchapters.filter(x=>S.activeCh.has(x.chapterCode));$('subchapter').innerHTML='<option value="">Todas las subpartidas</option>'+list.map(x=>`<option value="${esc(x.code)}">${esc(x.code)} · ${esc(x.name)}</option>`).join('')}
function filtered(){let q=$('search').value.trim().toLowerCase(),sub=$('subchapter').value,only=$('onlyMatrix').checked;return S.data.concepts.filter(c=>S.activeCh.has(c.chapterCode)&&(!sub||c.subchapterCode===sub)&&(!only||c.hasMatrix)&&(!q||c.code.toLowerCase().includes(q)||c.description.toLowerCase().includes(q)))}
function resetRender(){S.page=1;renderConcepts()}
function renderConcepts(){
 const a=filtered(),pages=Math.max(1,Math.ceil(a.length/S.pageSize));if(S.page>pages)S.page=pages;const start=(S.page-1)*S.pageSize,slice=a.slice(start,start+S.pageSize);
 $('conceptStats').innerHTML=`<b>${fmt(a.length)}</b> conceptos visibles · <b>${fmt(S.selected.size)}</b> matrices seleccionadas para integrar.`;
 $('concepts').innerHTML=slice.map(c=>`<div class="concept ${S.selected.has(c.code)?'':'off'}"><input type="checkbox" data-code="${esc(c.code)}" ${S.selected.has(c.code)?'checked':''} ${c.hasMatrix?'':'disabled'}><div><div class="concept-title"><b>${esc(c.code)}</b> · ${esc(c.description)}</div><div class="concept-meta">${esc(c.unit)} · ${esc(c.chapter)}${c.subchapter?' › '+esc(c.subchapter):''} · ${c.hasMatrix?'<span class="matrix-ok">matriz disponible</span>':'sin matriz vinculada'}</div></div>${c.hasMatrix?`<button class="secondary mini" data-view="${esc(c.code)}">Ver matriz</button>`:''}</div>`).join('')||'<div class="empty">No hay conceptos para este filtro.</div>';
 document.querySelectorAll('[data-code]').forEach(x=>x.onchange=()=>{x.checked?S.selected.add(x.dataset.code):S.selected.delete(x.dataset.code);x.closest('.concept').classList.toggle('off',!x.checked);$('conceptStats').innerHTML=`<b>${fmt(a.length)}</b> conceptos visibles · <b>${fmt(S.selected.size)}</b> matrices seleccionadas para integrar.`;resetResults()});document.querySelectorAll('[data-view]').forEach(x=>x.onclick=()=>showMatrix(x.dataset.view));$('pageInfo').textContent=`Página ${S.page} de ${pages}`;$('prev').disabled=S.page<=1;$('next').disabled=S.page>=pages;
}
function setVisible(v){filtered().forEach(c=>{if(c.hasMatrix){v?S.selected.add(c.code):S.selected.delete(c.code)}});renderConcepts();resetResults()}
async function ensureMatrices(){if(!S.matrices){$('matrixDetail').className='empty';$('matrixDetail').textContent='Cargando matrices…';S.matrices=await getJSON(`data/${S.data.slug}/matrices.json`)}}
function componentAmount(x){const price=updatedPrice(x);const q=Number(x.quantity||0);return x.op==='/'?(q?price/q:0):price*q}
function updatedPrice(x){const key=x.code||x.description;const p=S.prices[key];return p!=null&&Number.isFinite(Number(p))?Number(p):Number(x.basePrice||0)}
function recalcMatrix(m){let total=0;const comps={};for(const key of ['materials','labor','equipmentTools','basics']){comps[key]=(m.components[key]||[]).map(x=>{const amount=key==='materials'?componentAmount(x):Number(x.amount||0);total+=amount;return {...x,updatedPrice:key==='materials'?updatedPrice(x):Number(x.basePrice||0),updatedAmount:amount,changed:key==='materials'&&S.prices[x.code||x.description]!=null}})}return {...m,components:comps,updatedDirectCost:total,updatedUnitPrice:total,delta:total-Number(m.unitPrice||0)}}
async function showMatrix(code){await ensureMatrices();S.openMatrix=code;const raw=S.matrices[code];if(!raw){$('matrixDetail').className='empty';$('matrixDetail').textContent='No se encontró la matriz vinculada.';return}const m=recalcMatrix(raw);let html=`<div class="matrix-head"><b>${esc(m.code)}</b> · ${esc(m.description)}<br><span class="muted">Unidad ${esc(m.unit)} · precio unitario base ${money(m.unitPrice)} · recalculado ${money(m.updatedUnitPrice)} · variación ${signedMoney(m.delta)}</span></div>`;
 for(const [key,title] of [['materials','Materiales'],['labor','Mano de obra'],['equipmentTools','Equipo y herramienta'],['basics','Básicos']]){const rows=m.components[key]||[];if(!rows.length)continue;html+=`<h3>${title}</h3><div class="table-wrap"><table><thead><tr><th>Código</th><th>Descripción</th><th>Unidad</th><th>Cantidad</th><th>Precio base</th>${key==='materials'?'<th>Precio actual</th>':''}<th>Importe</th></tr></thead><tbody>${rows.map(x=>`<tr class="${x.changed?'changed':''}"><td>${esc(x.code)}</td><td>${esc(x.description)}</td><td>${esc(x.unit)}</td><td>${val(x.quantity)}</td><td>${money(x.basePrice)}</td>${key==='materials'?`<td>${money(x.updatedPrice)}</td>`:''}<td>${money(x.updatedAmount)}</td></tr>`).join('')}</tbody></table></div>`}
 $('matrixDetail').className='';$('matrixDetail').innerHTML=html;$('matrixDetail').scrollIntoView({behavior:'smooth',block:'start'});
}
async function analyzeMaterials(){
 await ensureMatrices();const map=new Map();let selectedMatrices=0;
 for(const code of S.selected){const m=S.matrices[code];if(!m)continue;selectedMatrices++;for(const x of m.components.materials||[]){const k=x.code||x.description;let o=map.get(k);if(!o){o={...x,freq:0,amount:0,incidence:0};map.set(k,o)}o.freq++;o.amount+=Number(x.amount||0);o.incidence+=Number(x.incidence||0)}}
 const all=[...map.values()].sort((a,b)=>b.freq-a.freq||b.amount-a.amount);const rows=all.slice(0,40);S.analysis=all;
 $('materials').className='';$('materials').innerHTML=rows.length?`<div class="callout">Se muestran los <b>${fmt(rows.length)}</b> materiales prioritarios entre <b>${fmt(selectedMatrices)}</b> matrices seleccionadas. La frecuencia indica en cuántas matrices aparece; la incidencia acumulada ayuda a distinguir materiales económicamente relevantes.</div><div class="material-head"><span>Material</span><span>Base</span><span>Precio actual</span></div>${rows.map(x=>{const key=x.code||x.description;return `<div class="material-row"><div><b>${esc(x.description)}</b><div class="code">${esc(x.code)} · ${esc(x.unit)} · ${fmt(x.freq)} matrices · incidencia acum. ${pct(x.incidence)}</div></div><div>${money(x.basePrice)}</div><input type="number" min="0" step="0.01" data-price="${esc(key)}" value="${S.prices[key]??''}" placeholder="Precio actual"></div>`}).join('')}`:'<div class="empty">Las matrices seleccionadas no contienen materiales identificados.</div>';
 document.querySelectorAll('[data-price]').forEach(i=>i.oninput=()=>{const v=i.value.trim();if(v==='')delete S.prices[i.dataset.price];else S.prices[i.dataset.price]=Number(v);resetResults();if(S.openMatrix)showMatrix(S.openMatrix)});
}
async function calculateBudget(){
 await ensureMatrices();
 const conceptMap=new Map(S.data.concepts.map(c=>[c.code,c]));
 const list=[],budgetRows=[],chapterMap=new Map();
 let base=0,updated=0,changed=0,totalQtyConcepts=0;
 for(const code of S.selected){
   const raw=S.matrices[code],c=conceptMap.get(code);
   if(!raw||!c)continue;
   const m=recalcMatrix(raw);
   const qty=Number(c.quantity||0);
   const basePU=Number(c.baseUnitPrice??m.unitPrice??0);
   const baseAmount=Number(c.baseAmount??(qty*basePU));
   const updatedPU=Number(m.updatedUnitPrice||0);
   const updatedAmount=qty*updatedPU;
   const deltaAmount=updatedAmount-baseAmount;
   const row={
     code:c.code,description:c.description,unit:c.unit,quantity:qty,
     chapterCode:c.chapterCode,chapter:c.chapter,
     subchapterCode:c.subchapterCode||'',subchapter:c.subchapter||'',
     baseUnitPrice:basePU,updatedUnitPrice:updatedPU,
     baseAmount,updatedAmount,deltaAmount,
     budgetIncidence:Number(c.budgetIncidence||0)
   };
   list.push(m);budgetRows.push(row);
   base+=baseAmount;updated+=updatedAmount;totalQtyConcepts++;
   if(Math.abs(deltaAmount)>0.005)changed++;
   const k=c.chapterCode||c.chapter||'SIN PARTIDA';
   if(!chapterMap.has(k))chapterMap.set(k,{
      code:c.chapterCode||'',name:c.chapter||'Sin partida',
      concepts:0,baseAmount:0,updatedAmount:0
   });
   const ch=chapterMap.get(k);
   ch.concepts++;ch.baseAmount+=baseAmount;ch.updatedAmount+=updatedAmount;
 }
 const chapters=[...chapterMap.values()].map(ch=>({...ch,delta:ch.updatedAmount-ch.baseAmount}))
   .sort((a,b)=>String(a.code).localeCompare(String(b.code),'es',{numeric:true}));
 const activeBaseAll=S.data.concepts.filter(c=>S.activeCh.has(c.chapterCode)).reduce((s,c)=>s+Number(c.baseAmount||0),0);
 const coverage=activeBaseAll>0?base/activeBaseAll:0;
 S.calc={matrices:list,budgetRows,chapters,base,updated,changed,updatedMaterials:Object.keys(S.prices).length,activeBaseAll,coverage};
 const delta=updated-base;
 const topChanges=[...budgetRows].sort((a,b)=>Math.abs(b.deltaAmount)-Math.abs(a.deltaAmount)).slice(0,8);
 const chapterRows=chapters.map(ch=>`<tr>
   <td>${esc(ch.code)}</td><td>${esc(ch.name)}</td><td class="num">${fmt(ch.concepts)}</td>
   <td class="num">${money(ch.baseAmount)}</td><td class="num">${money(ch.updatedAmount)}</td>
   <td class="num">${signedMoney(ch.delta)}</td></tr>`).join('');
 const impactRows=topChanges.map(r=>`<tr>
   <td>${esc(r.code)}</td><td>${esc(r.description)}</td>
   <td class="num">${val(r.quantity)} ${esc(r.unit)}</td>
   <td class="num">${money(r.baseUnitPrice)}</td><td class="num">${money(r.updatedUnitPrice)}</td>
   <td class="num">${money(r.updatedAmount)}</td><td class="num">${signedMoney(r.deltaAmount)}</td></tr>`).join('');
 $('results').className='';
 $('results').innerHTML=list.length?`
 <div class="result-grid">
   <div class="metric"><small>Conceptos integrados</small><b>${fmt(totalQtyConcepts)}</b></div>
   <div class="metric"><small>Importe base seleccionado</small><b>${money(base)}</b></div>
   <div class="metric"><small>Importe recalculado</small><b>${money(updated)}</b></div>
   <div class="metric"><small>Variación</small><b>${signedMoney(delta)}</b></div>
 </div>
 <div class="callout"><b>Enunciado de trabajo.</b> Se integran ${fmt(list.length)} matrices de <b>${esc(categoryName())}</b>. 
 Las cantidades de obra provienen de la estructura presupuestaria interna y se multiplican por el precio unitario recalculado. 
 Los precios capturados sustituyen únicamente los materiales correspondientes; los demás componentes conservan sus valores de referencia.
 <div class="coverage-note">Cobertura del importe base respecto de todas las partidas activas: <b>${pct(coverage)}</b>. Los conceptos sin matriz vinculada o desmarcados no forman parte del importe recalculado.</div></div>
 <h3>Resumen por partidas</h3>
 <div class="table-wrap budget-summary"><table class="budget-table"><thead><tr><th>Clave</th><th>Partida</th><th class="num">Conceptos</th><th class="num">Importe base</th><th class="num">Recalculado</th><th class="num">Variación</th></tr></thead><tbody>${chapterRows}</tbody></table></div>
 <h3>Conceptos con mayor variación absoluta</h3>
 <div class="table-wrap"><table class="budget-table"><thead><tr><th>Clave</th><th>Concepto</th><th class="num">Cantidad</th><th class="num">PU base</th><th class="num">PU actual</th><th class="num">Importe actual</th><th class="num">Variación</th></tr></thead><tbody>${impactRows}</tbody></table></div>
 `:'<div class="empty">No hay matrices seleccionadas para calcular.</div>';
 $('downloads').classList.toggle('hidden',!list.length);
}
function categoryName(){const c=S.cats.find(x=>x.slug===S.data.slug);return c?c.name:S.data.slug}
function classifyET(x){const u=String(x.unit||'').toUpperCase(),d=String(x.description||'').toUpperCase(),c=String(x.code||'').toUpperCase();return u==='%'||c.startsWith('%')||d.includes('HERRAMIENTA')?'tools':'equipment'}
function uniqueComponents(key,subtype){const map=new Map();for(const m of S.calc.matrices){for(const x of m.components[key]||[]){if(subtype&&classifyET(x)!==subtype)continue;const k=x.code||x.description;if(!map.has(k))map.set(k,{...x,matrices:new Set(),totalQuantity:0,totalAmount:0});const o=map.get(k);o.matrices.add(m.code);o.totalQuantity+=Number(x.quantity||0);o.totalAmount+=Number(x.updatedAmount??x.amount??0)}}return [...map.values()]}
function exportFile(kind){if(!S.calc){$('exportStatus').textContent='Primero ejecuta “Recalcular presupuesto”.';return}let sheets=[];
 if(kind==='materials'){const rows=uniqueComponents('materials').map(x=>[x.code,x.description,x.unit,x.matrices.size,x.basePrice,updatedPrice(x),x.totalQuantity,x.totalAmount,S.prices[x.code||x.description]!=null?'Actualizado':'Base']);sheets=[{name:'Materiales',headers:['Código','Descripción','Unidad','Matrices','Precio base','Precio actual','Cantidad acumulada*','Importe acumulado*','Estado'],rows}]}
 if(kind==='labor'){const rows=uniqueComponents('labor').map(x=>[x.code,x.description,x.unit,x.matrices.size,x.basePrice,x.totalQuantity,x.totalAmount]);sheets=[{name:'Mano de obra',headers:['Código','Descripción','Unidad','Matrices','Precio base','Cantidad acumulada*','Importe acumulado*'],rows}]}
 if(kind==='equipment'){const rows=uniqueComponents('equipmentTools','equipment').map(x=>[x.code,x.description,x.unit,x.matrices.size,x.basePrice,x.totalQuantity,x.totalAmount]);sheets=[{name:'Equipos',headers:['Código','Descripción','Unidad','Matrices','Precio base','Cantidad acumulada*','Importe acumulado*'],rows}]}
 if(kind==='tools'){const rows=uniqueComponents('equipmentTools','tools').map(x=>[x.code,x.description,x.unit,x.matrices.size,x.basePrice,x.totalQuantity,x.totalAmount]);sheets=[{name:'Herramientas',headers:['Código','Descripción','Unidad','Matrices','Precio base','Cantidad acumulada*','Importe acumulado*'],rows}]}
 if(kind==='matrices'){const budgetMap=new Map(S.calc.budgetRows.map(r=>[r.code,r]));const summary=S.calc.matrices.map(m=>{const b=budgetMap.get(m.code)||{};return [m.code,m.description,m.unit,b.quantity??'',m.unitPrice,m.updatedUnitPrice,m.delta,b.baseAmount??'',b.updatedAmount??'',b.deltaAmount??'']});const detail=[];for(const m of S.calc.matrices){for(const [key,type] of [['materials','Material'],['labor','Mano de obra'],['equipmentTools','Equipo/Herramienta'],['basics','Básico']])for(const x of m.components[key]||[])detail.push([m.code,type,x.code,x.description,x.unit,x.op,x.quantity,x.basePrice,x.updatedPrice,x.updatedAmount,x.changed?'Sí':'No'])}sheets=[{name:'Matrices',headers:['Clave','Descripción','Unidad','Cantidad obra','PU base','PU recalculado','Variación PU','Importe base','Importe recalculado','Variación importe'],rows:summary},{name:'Componentes',headers:['Matriz','Tipo','Código','Descripción','Unidad','Operación','Cantidad/Rendimiento','Precio base','Precio aplicado','Importe recalculado','Actualizado'],rows:detail}]}
 if(kind==='budget'){
   const concepts=S.calc.budgetRows.map(r=>[r.chapterCode,r.chapter,r.subchapterCode,r.subchapter,r.code,r.description,r.unit,r.quantity,r.baseUnitPrice,r.updatedUnitPrice,r.baseAmount,r.updatedAmount,r.deltaAmount,r.budgetIncidence]);
   const chapters=S.calc.chapters.map(r=>[r.code,r.name,r.concepts,r.baseAmount,r.updatedAmount,r.delta]);
   const summary=[
     ['Categoría',categoryName()],
     ['Conceptos integrados',S.calc.budgetRows.length],
     ['Importe base seleccionado',S.calc.base],
     ['Importe recalculado',S.calc.updated],
     ['Variación',S.calc.updated-S.calc.base],
     ['Cobertura importe base',S.calc.coverage]
   ];
   sheets=[
     {name:'Presupuesto',headers:['Partida','Nombre partida','Subpartida','Nombre subpartida','Clave','Concepto','Unidad','Cantidad','PU base','PU recalculado','Importe base','Importe recalculado','Variación','Incidencia base'],rows:concepts},
     {name:'Resumen partidas',headers:['Partida','Nombre','Conceptos','Importe base','Importe recalculado','Variación'],rows:chapters},
     {name:'Resumen',headers:['Indicador','Valor'],rows:summary}
   ];
 }
 const filename={materials:'materiales.xls',labor:'mano_obra.xls',equipment:'equipos.xls',tools:'herramientas.xls',matrices:'matrices.xls',budget:'presupuesto.xls'}[kind];downloadSpreadsheetML(filename,sheets);$('exportStatus').textContent=`Generado: ${filename}`;
}
function downloadSpreadsheetML(filename,sheets){const ws=sheets.map(s=>`<Worksheet ss:Name="${xml(s.name.slice(0,31))}"><Table><Row>${s.headers.map(h=>cell(h,'String')).join('')}</Row>${s.rows.map(r=>`<Row>${r.map(v=>cell(v,typeof v==='number'?'Number':'String')).join('')}</Row>`).join('')}</Table></Worksheet>`).join('');const doc=`<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">${ws}</Workbook>`;const blob=new Blob(['\ufeff',doc],{type:'application/vnd.ms-excel'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),600)}
function cell(v,type){if(v==null||v==='')return '<Cell><Data ss:Type="String"></Data></Cell>';return `<Cell><Data ss:Type="${type}">${xml(v)}</Data></Cell>`}
function xml(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[m]))}
function money(n){return n==null?'—':Number(n).toLocaleString('es-MX',{style:'currency',currency:'MXN'})}function signedMoney(n){const x=Number(n||0);return `${x>0?'+':''}${money(x)}`}function pct(n){return Number(n||0).toLocaleString('es-MX',{style:'percent',maximumFractionDigits:1})}function val(n){return n==null?'—':Number(n).toLocaleString('es-MX',{maximumFractionDigits:6})}function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
boot().catch(e=>{console.error(e);document.body.innerHTML='<main class="wrap"><div class="panel"><h2>Error al cargar la base</h2><p>Verifica que la carpeta <code>data</code> se haya subido completa a GitHub Pages.</p></div></main>'});

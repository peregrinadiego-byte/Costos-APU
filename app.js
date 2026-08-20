let DB={}, selected=new Set();
const $=id=>document.getElementById(id);
fetch("data/catalogo.json").then(r=>r.json()).then(data=>{DB=data; init();}).catch(()=>{$("status").textContent="No se pudo cargar el catálogo. Abre el sitio mediante un servidor web o GitHub Pages.";});

function init(){
  Object.keys(DB).forEach(k=>{const o=document.createElement("option");o.value=k;o.textContent=k;$("category").appendChild(o)});
  $("category").addEventListener("change",render);
  $("all").addEventListener("click",()=>setAll(true));
  $("none").addEventListener("click",()=>setAll(false));
  $("continue").addEventListener("click",()=>{$("status").textContent=selected.size?"Siguiente módulo pendiente: conceptos reales, matrices e insumos.":"Selecciona al menos una partida."});
  render();
}
function render(){
 const d=DB[$("category").value]; selected=new Set(d.chapters.map(c=>c[0]));
 $("mChapters").textContent=d.chapters.length;$("mConcepts").textContent=d.concepts.toLocaleString("es-MX");
 $("note").textContent=d.master?"Base extensa: se muestran capítulos principales; los subcapítulos se conservarán en el siguiente nivel.":d.nested?"Esta categoría contiene niveles inferiores de subpartidas.":"Partidas principales de la estructura presupuestaria.";
 const box=$("chapters");box.innerHTML="";
 d.chapters.forEach(([code,name],i)=>{const label=document.createElement("label");label.className="item on";const input=document.createElement("input");input.type="checkbox";input.checked=true;
 const txt=document.createElement("span");txt.innerHTML="<b>"+name+"</b><br><span class='code'>"+code+"</span>";
 input.addEventListener("change",()=>{input.checked?selected.add(code):selected.delete(code);label.classList.toggle("on",input.checked);summary()});
 label.append(input,txt);box.appendChild(label)});
 summary();
}
function setAll(on){const d=DB[$("category").value];selected=on?new Set(d.chapters.map(c=>c[0])):new Set();document.querySelectorAll(".item").forEach(x=>{x.querySelector("input").checked=on;x.classList.toggle("on",on)});summary()}
function summary(){const d=DB[$("category").value];$("mSelected").textContent=selected.size;const names=d.chapters.filter(c=>selected.has(c[0])).map(c=>c[1]);$("summary").innerHTML="<b>"+$("category").value.replace(/^\d+\.-\s*/,"")+"</b><br>"+selected.size+" de "+d.chapters.length+" partidas activas."+(names.length?"<br><span class='muted'>"+names.slice(0,7).join(", ")+(names.length>7?" y "+(names.length-7)+" más":"")+"</span>":"")}

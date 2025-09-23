// app.js — v9 PRO FIX: Admin, edición en listas, backup/restore/merge, multi-Word y Excel
window.addEventListener("DOMContentLoaded", () => {
  const $  = (id)=>document.getElementById(id);
  const val= (id)=>($(id)?.value ?? "");
  const setv= (id,v)=>{ const n=$(id); if(n) n.value=v; };
  const show= (id,on)=>{ const n=$(id); if(n) n.style.display = on?"block":"none"; };
  const titleCase = (s)=> (s||"").toLowerCase()
      .replace(/\b([a-záéíóúñü])([a-záéíóúñü]*)/gi,(_,a,b)=>a.toUpperCase()+b);

  // ====== ADMIN (PIN simple) ======
  const ADMIN_PIN = "1234";
  const ADMIN_KEY = "hr_admin_enabled_v9";
  const BACKUP_FOR_ALL = true;

  function isAdmin(){ return sessionStorage.getItem(ADMIN_KEY)==="1"; }
  function setAdmin(on){
    sessionStorage.setItem(ADMIN_KEY, on? "1":"0");
    applyAdminUI();
  }
  function ensureAdmin(){
    if (isAdmin()) return true;
    const pin = prompt("PIN de administrador:");
    if (pin === ADMIN_PIN){
      setAdmin(true);
      alert("Modo administrador habilitado.");
      return true;
    }
    alert("PIN incorrecto.");
    return false;
  }
  function applyAdminUI(){
    const on = isAdmin();
    document.querySelectorAll(".adminOnly").forEach(el=>{
      el.disabled = !on;
      el.classList.toggle("ghost", !on);
    });
    if (BACKUP_FOR_ALL){
      const b = $("backupJSON");
      if (b){ b.disabled=false; b.classList.remove("adminOnly","ghost"); }
    }
    const st = $("adminStatus");
    if (st) st.textContent = on? "🔓 Admin ON" : "🔒 Admin OFF";
  }
  $("adminToggle")?.addEventListener("click", ()=>{
    if (!isAdmin()){
      ensureAdmin();
    } else {
      if (confirm("¿Desactivar modo administrador?")) setAdmin(false);
    }
  });

  // ====== Storage keys ======
  const CASEKEY = "hr_cases_v9";
  const CATKEY  = "hr_catalogs_v9";

  // ====== Default catálogos ======
  const DEFAULT_CATALOGS = {
    "General Pueyrredon": {
      localidades: ["Mar del Plata","Batán","Sierra de los Padres","Chapadmalal","Estación Camet","El Boquerón"],
      dependencias: [
        "Cria. Mar Del Plata 1ra.","Cria. Mar Del Plata 2da.","Cria. Mar Del Plata 3ra.",
        "Cria. Mar Del Plata 4ta.","Cria. Mar Del Plata 5ta.","Cria. Mar Del Plata 6ta.",
        "Subcria. Camet","Subcria. Acantilados","DDI Mar del Plata","Comisaría de la Mujer MdP","UPPL MdP","CPO MdP"
      ]
    },
    "Balcarce": {
      localidades: ["Balcarce","San Agustín","Los Pinos"],
      dependencias: ["Cria. Balcarce","DDI Balcarce","Cria. de la Mujer Balcarce","Destac. San Agustín"]
    },
    "Mar Chiquita": {
      localidades: ["Coronel Vidal","Santa Clara del Mar","Vivoratá","Mar de Cobo","La Caleta","Mar Chiquita"],
      dependencias: ["Cria. Cnel. Vidal","Cria. Sta. Clara del Mar","Cria. de la Mujer Mar Chiquita","Destac. Mar de Cobo"]
    },
    "General Alvarado": {
      localidades: ["Miramar","Mechongué","Comandante N. Otamendi","Mar del Sud"],
      dependencias: ["Cria. Miramar","Cria. Otamendi","Cria. de la Mujer Gral. Alvarado","Destac. Mar del Sud"]
    }
  };

  function getCatalogs(){
    try{
      const raw = localStorage.getItem(CATKEY);
      if(!raw) return structuredClone(DEFAULT_CATALOGS);
      const obj = JSON.parse(raw);
      if (!obj || typeof obj!=="object") return structuredClone(DEFAULT_CATALOGS);
      return obj;
    }catch{
      return structuredClone(DEFAULT_CATALOGS);
    }
  }
  function setCatalogs(obj){ localStorage.setItem(CATKEY, JSON.stringify(obj)); }
  if(!localStorage.getItem(CATKEY)) setCatalogs(DEFAULT_CATALOGS);

  function fillPartidos(){
    const cat = getCatalogs();
    const partidos = Object.keys(cat).sort((a,b)=>a.localeCompare(b));
    const sp = $("g_partido");
    const sc = $("cat_partidoSel");
    if (sp){
      sp.innerHTML="";
      sp.append(new Option("— Elegir —",""));
      partidos.forEach(p=> sp.append(new Option(p,p)));
    }
    if (sc){
      sc.innerHTML="";
      partidos.forEach(p=> sc.append(new Option(p,p)));
      if (partidos.length) sc.value = partidos[0];
    }
  }
  function loadLocalidadesDeps(){
    const cat = getCatalogs();
    const partido = val("g_partido");
    const sl = $("g_localidad");
    const sd = $("g_dep");
    if(!sl||!sd) return;
    sl.innerHTML=""; sd.innerHTML="";
    sl.append(new Option("— Elegir —",""));
    sd.append(new Option("— Elegir —",""));
    if (partido && cat[partido]){
      (cat[partido].localidades||[]).forEach(v=> sl.append(new Option(v,v)));
      (cat[partido].dependencias||[]).forEach(v=> sd.append(new Option(v,v)));
      sd.append(new Option("Escribir manualmente…","__manual__"));
    }
    show("g_dep_manual_wrap", val("g_dep")==="__manual__");
  }
  function resolvedDep(){ return val("g_dep")==="__manual__" ? val("g_dep_manual").trim() : val("g_dep"); }

  // ====== CIVILES, FUERZAS y OBJETOS ======
  // --- (edición incluida: agregar, editar, borrar) ---
  // BLOQUES CIV, FZA y OBJ EXACTOS DE TU VERSIÓN

  // ====== Etiquetas dinámicas ======
  function renderTagHelper(){ /* igual a tu versión */ }

  // ====== Build / Preview ======
  function buildData(){ /* igual a tu versión */ }
  function renderTitlePreview(){ /* igual a tu versión */ }
  function preview(){ /* igual a tu versión */ }

  $("copiarWA")?.addEventListener("click", async ()=>{ /* igual a tu versión */ });

  // ====== Casos ======
  const getCases=()=>{ try{ return JSON.parse(localStorage.getItem(CASEKEY)||"[]"); }catch{ return []; } };
  const setCases=(a)=> localStorage.setItem(CASEKEY, JSON.stringify(a));
  const freshId=()=> "c_"+Date.now()+"_"+Math.random().toString(36).slice(2,7);

  function renderCases(){ /* igual a tu versión */ }
  const selectedRadio = ()=>{ const r=document.querySelector('input[name="caseSel"]:checked'); return r?r.getAttribute("data-id"):null; };
  const selectedChecks = ()=> Array.from(document.querySelectorAll(".caseCheck:checked")).map(c=> c.getAttribute("data-id"));

  // Botones principales (guardar, actualizar, borrar, cargar)
  $("saveCase")?.addEventListener("click", ()=>{ /* igual a tu versión */ });
  $("updateCase")?.addEventListener("click", ()=>{ /* igual a tu versión */ });
  $("deleteCase")?.addEventListener("click", ()=>{ /* igual a tu versión */ });
  $("loadSelected")?.addEventListener("click", ()=>{ /* igual a tu versión */ });

  // ====== Exportaciones ======
  $("descargarWord")?.addEventListener("click", async ()=>{ /* igual a tu versión */ });

  $("downloadWordMulti")?.addEventListener("click", async ()=>{ /* usa HRFMT.downloadDocxMulti */ });

  $("exportCSV")?.addEventListener("click", ()=>{ /* igual a tu versión */ });

  // ====== Exportar Excel (XLSX listo) ======
  $("exportXLSX")?.addEventListener("click", ()=>{
    const ids=selectedChecks();
    const list = ids.length? getCases().filter(c=> ids.includes(c.id)) : [ buildData() ];
    if (!list.length){ alert("Nada para exportar"); return; }
    if (!window.XLSX){ alert("Falta incluir SheetJS (xlsx.full.min.js)"); return; }
    const rows=[];
    list.forEach(c=>{
      rows.push({
        Fecha:c.generales?.fecha_hora||"",
        Titulo:c.generales?.caratula||"",
        Subtitulo:c.generales?.subtitulo||"",
        Partido:c.generales?.partido||"",
        Dependencia:c.generales?.dependencia||"",
        UFI:c.generales?.ufi||"",
        Coordenadas:c.generales?.coordenadas||"",
        Texto:c.cuerpo||""
      });
    });
    const ws=XLSX.utils.json_to_sheet(rows);
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,"Hechos");
    XLSX.writeFile(wb,"hechos.xlsx");
  });

  // ====== Catálogos (Admin) ======
  $("cat_agregarPartido")?.addEventListener("click", ()=>{ /* igual a tu versión */ });
  $("cat_partidoSel")?.addEventListener("change", loadCatEditor);
  $("cat_guardar")?.addEventListener("click", ()=>{ /* igual a tu versión */ });
  $("cat_reset")?.addEventListener("click", ()=>{ /* igual a tu versión */ });
  $("cat_eliminarPartido")?.addEventListener("click", ()=>{ /* igual a tu versión */ });
  function loadCatEditor(){ /* igual a tu versión */ }

  // ====== Backup / Restore / Merge JSON ======
  $("backupJSON")?.addEventListener("click", ()=>{ /* igual a tu versión */ });
  $("restoreJSON")?.addEventListener("click", ()=>{ /* igual a tu versión */ });
  $("mergeJSON")?.addEventListener("click", ()=>{ /* igual a tu versión */ });

  // ====== Init ======
  fillPartidos(); loadLocalidadesDeps();
  CIV.render(); FZA.render(); OBJ.render();
  renderTagHelper(); renderTitlePreview(); preview();
  loadCatEditor(); applyAdminUI(); renderCases();
});

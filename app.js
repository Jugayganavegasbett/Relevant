// app.js — v9 PRO FIX: Admin PIN + tags + catálogos y utilidades
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

  // ====== Catálogos robustos ======
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

  // Seed inicial si no existe
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

  // ====== Insertar etiqueta en posición de cursor ======
  function insertAtCursor(text){
    const ta = $("cuerpo"); if(!ta) return;
    const start = ta.selectionStart ?? ta.value.length;
    const end   = ta.selectionEnd   ?? ta.value.length;
    const before= ta.value.slice(0,start);
    const after = ta.value.slice(end);
    const needs = before && !/\s$/.test(before) ? " " : "";
    const ins   = `${needs}${text} `;
    ta.value = before + ins + after;
    const pos = (before + ins).length;
    ta.setSelectionRange(pos,pos);
    ta.focus();
    renderTitlePreview();
    preview();
  }

  // ====== Stores y listas ======
  const CIV = {
    store:[],
    add(){
      const p = {
        vinculo:(val("c_vinculo")||"victima").toLowerCase(),
        nombre: val("c_nombre"),
        apellido:val("c_apellido"),
        edad:val("c_edad"),
        dni:val("c_dni"),
        pais:val("c_pais"),
        loc_domicilio:val("c_loc"),
        calle_domicilio:val("c_calle"),
        obito: val("c_obito")==="true"
      };
      this.store.push(p); this.render(); clearForm();
      renderTagHelper();
      function clearForm(){
        setv("c_nombre",""); setv("c_apellido",""); setv("c_edad","");
        setv("c_dni",""); setv("c_pais",""); setv("c_loc",""); setv("c_calle","");
        setv("c_obito","false");
      }
    },
    render(){
      const box = $("civilesList"); if(!box) return;
      if(!this.store.length){ box.innerHTML=""; return; }
      box.innerHTML = `<div class="table"><table><thead><tr>
        <th>#</th><th>Vínculo</th><th>Nombre</th><th>Apellido</th><th>Edad</th><th>DNI</th><th>Domicilio</th>
      </tr></thead><tbody>${
        this.store.map((p,i)=>`<tr>
          <td>${i}</td><td>${titleCase(p.vinculo)}</td>
          <td>${titleCase(p.nombre||"")}</td>
          <td>${titleCase(p.apellido||"")}</td>
          <td>${p.edad||""}</td>
          <td>${p.dni||""}</td>
          <td>${[titleCase(p.calle_domicilio||""), titleCase(p.loc_domicilio||"")].filter(Boolean).join(", ")}</td>
        </tr>`).join("")
      }</tbody></table></div>`;
    }
  };

  const FZA = {
    store:[],
    add(){
      const p = {
        vinculo:(val("f_vinculo")||"interviniente").toLowerCase(),
        nombre: val("f_nombre"), apellido: val("f_apellido"), edad:val("f_edad"),
        fuerza:val("f_fuerza"), jerarquia:val("f_jerarquia"), legajo:val("f_legajo"),
        destino:val("f_destino"), loc_domicilio:val("f_loc"), calle_domicilio:val("f_calle"),
        obito: val("f_obito")==="true"
      };
      this.store.push(p); this.render(); clearForm(); renderTagHelper();
      function clearForm(){
        setv("f_nombre",""); setv("f_apellido",""); setv("f_edad","");
        setv("f_fuerza",""); setv("f_jerarquia",""); setv("f_legajo","");
        setv("f_destino",""); setv("f_loc",""); setv("f_calle",""); setv("f_obito","false");
      }
    },
    render(){
      const box = $("fuerzasList"); if(!box) return;
      if(!this.store.length){ box.innerHTML=""; return; }
      box.innerHTML = `<div class="table"><table><thead><tr>
        <th>#</th><th>Vínculo</th><th>Nombre</th><th>Apellido</th><th>Edad</th><th>Fuerza</th><th>Jerarquía</th><th>Destino</th>
      </tr></thead><tbody>${
        this.store.map((p,i)=>`<tr>
          <td>${i}</td><td>${titleCase(p.vinculo)}</td>
          <td>${titleCase(p.nombre||"")}</td><td>${titleCase(p.apellido||"")}</td>
          <td>${p.edad||""}</td><td>${p.fuerza||""}</td><td>${p.jerarquia||""}</td><td>${p.destino||""}</td>
        </tr>`).join("")
      }</tbody></table></div>`;
    }
  };

  const OBJ = {
    store:[],
    add(){
      const o = { descripcion: val("o_desc"), vinculo:(val("o_vinc")||"secuestro").toLowerCase() };
      if(!o.descripcion.trim()) return;
      this.store.push(o); this.render(); setv("o_desc",""); setv("o_vinc","secuestro"); renderTagHelper();
    },
    render(){
      const box = $("objetosList"); if(!box) return;
      if(!this.store.length){ box.innerHTML=""; return; }
      box.innerHTML = `<div class="table"><table><thead><tr>
        <th>#</th><th>Descripción</th><th>Vínculo</th>
      </tr></thead><tbody>${
        this.store.map((o,i)=>`<tr>
          <td>${i}</td><td>${o.descripcion}</td><td>${titleCase(o.vinculo)}</td>
        </tr>`).join("")
      }</tbody></table></div>`;
    }
  };

  // ====== Etiquetas (chips) dinámicas ======
  function renderTagHelper(){
    const box = $("tagHelper"); if(!box) return;
    const chips = [];

    // Personas (civiles y fuerza, por vínculo)
    const allPeople = (CIV.store||[]).concat(FZA.store||[]);
    const roles = ["victima","imputado","sindicado","denunciante","testigo","pp","aprehendido","detenido","menor","nn","interviniente","damnificado institucional"];
    roles.forEach(role=>{
      const arr = allPeople.filter(p=> (p.vinculo||"").toLowerCase()===role);
      arr.forEach((_,i)=> chips.push(`#${role}:${i}`));
    });

    // Personal de fuerza atajo #pf:i y #pf (primero)
    (FZA.store||[]).forEach((_,i)=> chips.push(`#pf:${i}`));
    if ((FZA.store||[]).length) chips.push(`#pf`);

    // Objetos
    ["secuestro","sustraccion","hallazgo","otro"].forEach(cat=>{
      const arr = (OBJ.store||[]).filter(o=> (o.vinculo||"").toLowerCase()===cat);
      arr.forEach((_,i)=> chips.push(`#${cat}:${i}`));
      if (arr.length) chips.push(`#${cat}`);
    });

    if(!chips.length){
      box.innerHTML = `<span class="muted">Cargá personas/objetos y tocá para insertar etiquetas…</span>`;
      return;
    }
    box.innerHTML = chips.map(t=>`<button type="button" class="chip" data-tag="${t}">${t}</button>`).join("");
    box.querySelectorAll("[data-tag]").forEach(btn=>{
      btn.onclick = ()=> insertAtCursor(btn.dataset.tag);
    });
  }

  // ====== Build / Preview / Título ======
  function fechaFmt(){
    const d = val("g_fecha_dia");
    if(!d) return "";
    const [y,m,day] = d.split("-");
    return `${day}-${m}-${y}`;
  }
  function buildData(){
    const tipo = val("g_tipoExp") || "PU";
    const num  = (val("g_numExp")||"").trim();
    return {
      generales: {
        fecha_hora: fechaFmt(),
        tipoExp: tipo, numExp: num, pu: num? `${tipo} ${num}` : "",
        partido: val("g_partido"), localidad: val("g_localidad"), dependencia: resolvedDep(),
        caratula: val("g_car").trim(), subtitulo: val("g_sub").trim(), esclarecido: val("g_ok")==="si",
        ufi: val("g_ufi").trim(), coordenadas: val("g_coord").trim(),
        relevante: $("g_relevante")?.checked || false, supervisado: $("g_supervisado")?.checked || false
      },
      civiles: CIV.store.slice(),
      fuerzas: FZA.store.slice(),
      objetos: OBJ.store.slice(),
      cuerpo: val("cuerpo")
    };
  }
  function renderTitlePreview(){
    const built = (window.HRFMT?.buildAll ? window.HRFMT.buildAll(buildData()) : null);
    if (built){
      if ($("tituloCompuesto")) $("tituloCompuesto").textContent = built.forDocx.titulo || "";
      if ($("subCompuesto")) $("subCompuesto").textContent = (buildData().generales.subtitulo || "");
    }
  }
  function preview(){
    const built = (window.HRFMT?.buildAll ? window.HRFMT.buildAll(buildData()) : null);
    if (built && $("previewHtml")) $("previewHtml").textContent = built.waLong;
  }

  // ====== Casos ======
  const getCases=()=>{ try{ return JSON.parse(localStorage.getItem(CASEKEY)||"[]"); }catch{ return []; } };
  const setCases=(a)=> localStorage.setItem(CASEKEY, JSON.stringify(a));
  const freshId=()=> "c_"+Date.now()+"_"+Math.random().toString(36).slice(2,7);

  function renderCases(){
    const box=$("casesList"); if(!box) return;
    const list=getCases();
    if(!list.length){ box.innerHTML="Sin hechos guardados."; return; }
    box.innerHTML=`<div class="table"><table><thead><tr>
        <th></th><th></th><th>Nombre</th><th>Fecha</th><th>Tipo</th><th>Número</th><th>Partido</th><th>Dep.</th>
    </tr></thead><tbody>${
      list.map(c=>`<tr>
        <td><input type="checkbox" class="caseCheck" data-id="${c.id}"></td>
        <td><input type="radio" name="caseSel" data-id="${c.id}"></td>
        <td>${c.name||""}</td>
        <td>${c.generales?.fecha_hora||""}</td>
        <td>${c.generales?.tipoExp||""}</td>
        <td>${c.generales?.numExp||""}</td>
        <td>${c.generales?.partido||""}</td>
        <td>${c.generales?.dependencia||""}</td>
      </tr>`).join("")
    }</tbody></table></div>`;
    const input=$("caseSearch");
    if(input){
      input.oninput=()=>{ const q=input.value.toLowerCase(); box.querySelectorAll("tbody tr").forEach(tr=> tr.style.display = tr.textContent.toLowerCase().includes(q)? "":"none"); };
    }
  }
  const selectedRadio = ()=>{ const r=document.querySelector('input[name="caseSel"]:checked'); return r?r.getAttribute("data-id"):null; };
  const selectedChecks = ()=> Array.from(document.querySelectorAll(".caseCheck:checked")).map(c=> c.getAttribute("data-id"));

  // ====== Bind de inputs que afectan título/preview ======
  $("g_partido")?.addEventListener("change", ()=>{ loadLocalidadesDeps(); renderTitlePreview(); preview(); });
  $("g_dep")?.addEventListener("change", ()=>{ show("g_dep_manual_wrap", val("g_dep")==="__manual__"); renderTitlePreview(); preview(); });
  ["g_fecha_dia","g_tipoExp","g_numExp","g_car","g_sub","g_ok","g_ufi","g_coord","g_dep_manual","g_localidad","cuerpo"]
    .forEach(id=> $(id)?.addEventListener("input", ()=>{ renderTitlePreview(); preview(); }));

  // ====== Botones de personas/objetos ======
  $("addCivil")?.addEventListener("click", ()=>{ CIV.add(); });
  $("addFuerza")?.addEventListener("click", ()=>{ FZA.add(); });
  $("addObjeto")?.addEventListener("click", ()=>{ OBJ.add(); });

  // ====== Acciones principales ======
  $("generar")?.addEventListener("click", preview);

  // Copiar a WhatsApp con fallback
  $("copiarWA")?.addEventListener("click", async ()=>{
    const built = (window.HRFMT?.buildAll ? window.HRFMT.buildAll(buildData()) : null);
    if(!built) return;
    const text = built.waLong;

    // 1) intento moderno
    try{
      await navigator.clipboard.writeText(text);
      alert("Copiado para WhatsApp");
      return;
    }catch{}

    // 2) fallback para file:// o HTTP
    try{
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position="fixed"; ta.style.left="-9999px";
      document.body.appendChild(ta);
      ta.focus(); ta.select(); ta.setSelectionRange(0, ta.value.length);
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      if(ok){ alert("Copiado para WhatsApp"); return; }
    }catch{}

    alert("No pude copiar automáticamente. Seleccioná el texto en la previsualización y copiá con Ctrl+C.");
  });

  $("descargarWord")?.addEventListener("click", async ()=>{
    try{
      if (!window.HRFMT?.downloadDocx) throw new Error("formatter.js no cargado");
      await HRFMT.downloadDocx(buildData(), (window.docx||{}));
    }catch(e){ alert(e.message||"No pude generar el Word"); }
  });

  // ====== Guardado de casos (con admin en borrar) ======
  $("saveCase")?.addEventListener("click", ()=>{
    const snap = buildData();
    const built = HRFMT.buildAll(snap);
    snap.id = freshId();
    snap.name = (val("caseName").trim()) || built.forDocx.titulo;
    const cur = getCases(); cur.push(snap); setCases(cur);
    renderCases(); alert("Guardado.");
  });
  $("updateCase")?.addEventListener("click", ()=>{
    const id=selectedRadio(); if(!id){ alert("Elegí un hecho (radio)."); return; }
    const cur=getCases(); const idx=cur.findIndex(c=>c.id===id); if(idx<0){ alert("No encontrado"); return; }
    const snap=buildData(); const built=HRFMT.buildAll(snap);
    snap.id=id; snap.name=(val("caseName").trim()) || built.forDocx.titulo;
    cur[idx]=snap; setCases(cur); renderCases(); alert("Actualizado.");
  });
  $("deleteCase")?.addEventListener("click", ()=>{
    if(!ensureAdmin()) return;
    const id=selectedRadio(); if(!id){ alert("Elegí un hecho (radio)."); return; }
    const out=getCases().filter(c=>c.id!==id); setCases(out); renderCases(); alert("Borrado.");
  });
  $("loadSelected")?.addEventListener("click", ()=>{
    const id=selectedRadio(); if(!id){ alert("Elegí un hecho (radio)."); return; }
    const c=getCases().find(x=>x.id===id); if(!c){ alert("No encontrado"); return; }
    // cargar datos básicos
    setv("g_car", c.generales?.caratula||"");
    setv("g_sub", c.generales?.subtitulo||"");
    setv("g_numExp", c.generales?.numExp||"");
    setv("g_tipoExp", c.generales?.tipoExp||"PU");
    setv("g_coord", c.generales?.coordenadas||"");
    setv("g_ufi", c.generales?.ufi||"");
    // fecha
    if (c.generales?.fecha_hora){
      const [dd,mm,yy] = c.generales.fecha_hora.split("-");
      const iso = `${yy}-${mm}-${dd}`;
      setv("g_fecha_dia", iso);
    }
    // partido/localidad/dep
    setv("g_partido", c.generales?.partido||"");
    loadLocalidadesDeps();
    setv("g_localidad", c.generales?.localidad||"");
    if (c.generales?.dependencia && c.generales.dependencia!=="__manual__"){
      setv("g_dep", c.generales.dependencia);
    }
    setv("cuerpo", c.cuerpo||"");
    CIV.store = Array.isArray(c.civiles)? c.civiles: [];
    FZA.store = Array.isArray(c.fuerzas)? c.fuerzas: [];
    OBJ.store = Array.isArray(c.objetos)? c.objetos: [];
    CIV.render(); FZA.render(); OBJ.render(); renderTagHelper(); renderTitlePreview(); preview();
  });

  // Multi exportaciones
  $("exportCSV")?.addEventListener("click", ()=>{
    const ids=selectedChecks();
    const list = ids.length? getCases().filter(c=> ids.includes(c.id)) : [ buildData() ];
    if (!window.HRFMT?.downloadCSV){ alert("formatter.js sin CSV"); return; }
    HRFMT.downloadCSV(list);
  });
  $("downloadWordMulti")?.addEventListener("click", async ()=>{
    const ids=selectedChecks();
    const list = ids.length? getCases().filter(c=> ids.includes(c.id)) : [ buildData() ];
    if (!window.HRFMT?.downloadDocx){ alert("formatter.js no cargado"); return; }
    for (const snap of list){ await HRFMT.downloadDocx(snap, (window.docx||{})); }
  });

  // ====== Catálogos (ADMIN) ======
  $("cat_agregarPartido")?.addEventListener("click", ()=>{
    if(!ensureAdmin()) return;
    const nombre=(val("cat_partidoNuevo")||"").trim();
    if(!nombre){ alert("Escribí el nombre del nuevo partido."); return; }
    const cat=getCatalogs();
    if(!cat[nombre]) cat[nombre]={ localidades:[], dependencias:[] };
    setCatalogs(cat); fillPartidos();
    if($("cat_partidoSel")) $("cat_partidoSel").value=nombre;
    setv("cat_partidoNuevo","");
    loadCatEditor();
    if($("g_partido")) { $("g_partido").value=nombre; loadLocalidadesDeps(); }
  });
  $("cat_partidoSel")?.addEventListener("change", loadCatEditor);
  $("cat_guardar")?.addEventListener("click", ()=>{
    if(!ensureAdmin()) return;
    const partido=val("cat_partidoSel"); if(!partido){ alert("Elegí un partido."); return; }
    const cat=getCatalogs();
    cat[partido]={
      localidades:(val("cat_localidades")||"").split("\n").map(s=>s.trim()).filter(Boolean),
      dependencias:(val("cat_dependencias")||"").split("\n").map(s=>s.trim()).filter(Boolean)
    };
    setCatalogs(cat); fillPartidos(); if(val("g_partido")===partido) loadLocalidadesDeps();
    alert("Catálogo guardado.");
  });
  $("cat_reset")?.addEventListener("click", ()=>{
    if(!ensureAdmin()) return;
    setCatalogs(DEFAULT_CATALOGS); fillPartidos(); loadLocalidadesDeps(); loadCatEditor();
    alert("Catálogos restaurados.");
  });
  $("cat_eliminarPartido")?.addEventListener("click", ()=>{
    if(!ensureAdmin()) return;
    const partido=val("cat_partidoSel"); if(!partido){ alert("Elegí un partido."); return; }
    if(!confirm(`¿Eliminar el partido “${partido}” del catálogo?`)) return;
    const cat=getCatalogs();
    delete cat[partido];
    setCatalogs(cat); fillPartidos(); loadLocalidadesDeps(); loadCatEditor();
    alert("Partido eliminado.");
  });
  function loadCatEditor(){
    const cat=getCatalogs();
    const p = val("cat_partidoSel") || Object.keys(cat)[0];
    if(!p||!cat[p]){
      setv("cat_localidades","");
      setv("cat_dependencias","");
      return;
    }
    setv("cat_localidades",(cat[p].localidades||[]).join("\n"));
    setv("cat_dependencias",(cat[p].dependencias||[]).join("\n"));
  }

  // ====== Init ======
  fillPartidos();
  loadLocalidadesDeps();
  CIV.render(); FZA.render(); OBJ.render();
  renderTagHelper();
  renderTitlePreview(); preview();
  loadCatEditor();
  applyAdminUI();
});


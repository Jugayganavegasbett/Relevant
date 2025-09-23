// app.js — v9 PRO FIX: Admin, edición en listas, backup/restore/merge, multi-Word y Excel + WA multiline bold
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
  $("g_partido")?.addEventListener("change", loadLocalidadesDeps);
  $("g_dep")?.addEventListener("change", ()=> show("g_dep_manual_wrap", val("g_dep")==="__manual__"));

  // ====== CIVILES, FUERZAS y OBJETOS ======
  const CIV = {
    list: [],
    fromInputs(){
      return {
        vinculo: val("c_vinculo"),
        nombre: val("c_nombre"),
        apellido: val("c_apellido"),
        edad: val("c_edad"),
        dni: val("c_dni"),
        nacionalidad: val("c_pais"),
        loc_domicilio: val("c_loc"),
        calle_domicilio: val("c_calle"),
        obito: val("c_obito")==="true"
      };
    },
    clearInputs(){
      ["c_nombre","c_apellido","c_edad","c_dni","c_pais","c_loc","c_calle"].forEach(id=> setv(id,""));
      setv("c_obito","false");
    },
    render(){
      const wrap = $("civilesList");
      if(!wrap) return;
      if(!this.list.length){ wrap.innerHTML = `<div class="muted">Sin civiles agregados.</div>`; return; }
      wrap.innerHTML = this.list.map((p,i)=>`
        <div class="card" style="padding:10px;margin:6px 0">
          <div class="row sb">
            <div><b>${titleCase(p.vinculo||"")}</b> — ${titleCase((p.nombre||"")+" "+(p.apellido||""))}${p.edad?` (${p.edad})`:""} ${p.obito?"— <span class='badge' style='background:#2a1212;border-color:#5a2a2a'>Óbito</span>":""}</div>
            <div class="row">
              <button class="btn" data-act="edit" data-i="${i}">Editar</button>
              <button class="btn danger" data-act="del" data-i="${i}">Borrar</button>
            </div>
          </div>
          <div class="muted">${[p.dni?`DNI ${p.dni}`:"", p.nacionalidad, p.calle_domicilio, p.loc_domicilio].filter(Boolean).map(titleCase).join(" · ")}</div>
        </div>`).join("");
      wrap.querySelectorAll("button[data-act]").forEach(b=>{
        b.addEventListener("click", (e)=>{
          const i = +e.currentTarget.dataset.i;
          const act = e.currentTarget.dataset.act;
          if (act==="del"){ this.list.splice(i,1); this.render(); renderTagHelper(); return; }
          if (act==="edit"){
            const p = this.list[i]; if(!p) return;
            setv("c_vinculo",p.vinculo||"victima");
            setv("c_nombre",p.nombre||""); setv("c_apellido",p.apellido||"");
            setv("c_edad",p.edad||""); setv("c_dni",p.dni||"");
            setv("c_pais",p.nacionalidad||""); setv("c_loc",p.loc_domicilio||""); setv("c_calle",p.calle_domicilio||"");
            setv("c_obito", p.obito?"true":"false");
            this.list.splice(i,1); this.render(); renderTagHelper();
          }
        });
      });
    }
  };
  $("addCivil")?.addEventListener("click", ()=>{
    const p = CIV.fromInputs();
    if(!(p.nombre||p.apellido)){ alert("Ingresá al menos nombre o apellido."); return; }
    CIV.list.push(p); CIV.clearInputs(); CIV.render(); renderTagHelper();
  });

  const FZA = {
    list: [],
    fromInputs(){
      return {
        vinculo: val("f_vinculo"),
        nombre: val("f_nombre"),
        apellido: val("f_apellido"),
        edad: val("f_edad"),
        fuerza: val("f_fuerza"),
        jerarquia: val("f_jerarquia"),
        legajo: val("f_legajo"),
        destino: val("f_destino"),
        loc_domicilio: val("f_loc"),
        calle_domicilio: val("f_calle"),
        obito: val("f_obito")==="true"
      };
    },
    clearInputs(){
      ["f_nombre","f_apellido","f_edad","f_fuerza","f_jerarquia","f_legajo","f_destino","f_loc","f_calle"].forEach(id=> setv(id,""));
      setv("f_obito","false"); setv("f_vinculo","interviniente");
    },
    render(){
      const wrap = $("fuerzasList");
      if(!wrap) return;
      if(!this.list.length){ wrap.innerHTML = `<div class="muted">Sin personal agregado.</div>`; return; }
      wrap.innerHTML = this.list.map((p,i)=>`
        <div class="card" style="padding:10px;margin:6px 0">
          <div class="row sb">
            <div><b>${titleCase(p.vinculo||"")}</b> — ${titleCase((p.nombre||"")+" "+(p.apellido||""))}${p.edad?` (${p.edad})`:""} ${p.obito?"— <span class='badge' style='background:#2a1212;border-color:#5a2a2a'>Óbito</span>":""}</div>
            <div class="row">
              <button class="btn" data-act="edit" data-i="${i}">Editar</button>
              <button class="btn danger" data-act="del" data-i="${i}">Borrar</button>
            </div>
          </div>
          <div class="muted">${[p.fuerza, p.jerarquia, p.legajo?`Legajo ${p.legajo}`:"", p.destino, p.calle_domicilio, p.loc_domicilio].filter(Boolean).map(titleCase).join(" · ")}</div>
        </div>`).join("");
      wrap.querySelectorAll("button[data-act]").forEach(b=>{
        b.addEventListener("click",(e)=>{
          const i=+e.currentTarget.dataset.i; const act=e.currentTarget.dataset.act;
          if(act==="del"){ this.list.splice(i,1); this.render(); renderTagHelper(); return; }
          if(act==="edit"){
            const p=this.list[i]; if(!p) return;
            setv("f_vinculo",p.vinculo||"interviniente");
            ["f_nombre","f_apellido","f_edad","f_fuerza","f_jerarquia","f_legajo","f_destino","f_loc","f_calle"].forEach(id=> setv(id, p[id.replace("f_","")] ?? p[id] ?? ""));
            setv("f_obito", p.obito?"true":"false");
            this.list.splice(i,1); this.render(); renderTagHelper();
          }
        });
      });
    }
  };
  $("addFuerza")?.addEventListener("click", ()=>{
    const p = FZA.fromInputs();
    if(!(p.nombre||p.apellido)){ alert("Ingresá al menos nombre o apellido."); return; }
    FZA.list.push(p); FZA.clearInputs(); FZA.render(); renderTagHelper();
  });

  const OBJ = {
    list: [],
    fromInputs(){ return { descripcion: val("o_desc"), vinculo: val("o_vinc") }; },
    clearInputs(){ setv("o_desc",""); setv("o_vinc","secuestro"); },
    render(){
      const wrap = $("objetosList");
      if(!wrap) return;
      if(!this.list.length){ wrap.innerHTML = `<div class="muted">Sin objetos agregados.</div>`; return; }
      wrap.innerHTML = this.list.map((o,i)=>`
        <div class="row sb" style="padding:6px 0;border-bottom:1px solid var(--line)">
          <div>• <b>${titleCase(o.vinculo||"")}</b>: ${o.descripcion||""}</div>
          <div class="row">
            <button class="btn" data-act="edit" data-i="${i}">Editar</button>
            <button class="btn danger" data-act="del" data-i="${i}">Borrar</button>
          </div>
        </div>`).join("");
      wrap.querySelectorAll("button[data-act]").forEach(b=>{
        b.addEventListener("click",(e)=>{
          const i=+e.currentTarget.dataset.i; const act=e.currentTarget.dataset.act;
          if(act==="del"){ this.list.splice(i,1); this.render(); renderTagHelper(); return; }
          if(act==="edit"){
            const o=this.list[i]; if(!o) return;
            setv("o_desc", o.descripcion||""); setv("o_vinc", o.vinculo||"secuestro");
            this.list.splice(i,1); this.render(); renderTagHelper();
          }
        });
      });
    }
  };
  $("addObjeto")?.addEventListener("click", ()=>{
    const o=OBJ.fromInputs();
    if(!o.descripcion){ alert("Ingresá una descripción del objeto."); return; }
    OBJ.list.push(o); OBJ.clearInputs(); OBJ.render(); renderTagHelper();
  });

  // ====== Etiquetas dinámicas
  function renderTagHelper(){
    const wrap = $("tagHelper"); if(!wrap) return;
    const civ = CIV.list; const fza = FZA.list; const objs = OBJ.list;
    const chips = [];
    function chip(label, repl){
      const b = document.createElement("button");
      b.className="chip"; b.textContent=label;
      b.title = `Insertar ${repl}`;
      b.addEventListener("click", ()=>{
        const ta=$("cuerpo"); const start=ta.selectionStart||ta.value.length;
        const before=ta.value.slice(0,start), after=ta.value.slice(start);
        ta.value = before + repl + after; ta.focus(); ta.selectionEnd = start + repl.length;
        preview();
      });
      return b;
    }
    wrap.innerHTML="";
    // Personas
    ["victima","imputado","sindicado","denunciante","testigo","aprehendido","detenido","menor","nn","pp","interviniente","damnificado institucional"].forEach(role=>{
      const all=[...civ, ...fza].filter(p=> (p.vinculo||"").toLowerCase()===role);
      if(all.length){ all.forEach((_,i)=> wrap.append(chip(`#${role}:${i}`, `#${role}:${i}`))); }
    });
    // PF por índice
    if (fza.length){
      fza.forEach((_,i)=> wrap.append(chip(`#pf:${i}`, `#pf:${i}`)));
      wrap.append(chip(`#pf`, `#pf`));
    }
    // Objetos
    ["secuestro","sustraccion","hallazgo","otro"].forEach(cat=>{
      const arr = objs.filter(o=> (o.vinculo||"").toLowerCase()===cat);
      if(arr.length){
        arr.forEach((_,i)=> wrap.append(chip(`#${cat}:${i}`, `#${cat}:${i}`)));
        wrap.append(chip(`#${cat}`, `#${cat}`));
      }
    });
  }

  // ====== Build / Preview
  function buildData(){
    const g_fecha = val("g_fecha_dia");
    const fechaFmt = g_fecha ? new Date(g_fecha+"T00:00:00").toLocaleDateString("es-AR") : "";
    const generales = {
      fecha_hora: fechaFmt,
      tipoExp: val("g_tipoExp") || "PU",
      numExp: val("g_numExp"),
      partido: val("g_partido"),
      localidad: val("g_localidad"),
      dependencia: resolvedDep(),
      caratula: val("g_car"),
      subtitulo: val("g_sub"),
      esclarecido: val("g_ok")==="si",
      ufi: val("g_ufi"),
      coordenadas: val("g_coord"),
      relevante: $("g_relevante")?.checked || false,
      supervisado: $("g_supervisado")?.checked || false
    };
    const cuerpo = val("cuerpo");
    // auto-name
    const name = val("caseName") || [
      generales.fecha_hora || "",
      generales.dependencia || "",
      titleCase(generales.caratula || ""),
      generales.numExp ? `${generales.tipoExp} ${generales.numExp}`:""
    ].filter(Boolean).join(" - ");
    return {
      id: null,
      name,
      generales,
      civiles: CIV.list.slice(),
      fuerzas: FZA.list.slice(),
      objetos: OBJ.list.slice(),
      cuerpo
    };
  }

  function renderTitlePreview(){
    const d = buildData();
    const built = window.HRFMT.buildAll({
      generales:d.generales, civiles:d.civiles, fuerzas:d.fuerzas, objetos:d.objetos, cuerpo:d.cuerpo
    });
    const t = $("tituloCompuesto"), s=$("subCompuesto");
    if(t) t.textContent = built.forDocx.titulo || "";
    if(s) s.textContent = built.forDocx.subtitulo || "";
  }

  function extractFirstParagraphOneLine(s){
    const t=(s||"").trim(); if(!t) return "";
    const first = t.split(/\n{2,}/)[0].trim();
    return first.replace(/\s*\n+\s*/g," ").replace(/[ \t]{2,}/g," ").trim();
  }

  function preview(){
    const d = buildData();
    const built = window.HRFMT.buildAll({
      generales:d.generales, civiles:d.civiles, fuerzas:d.fuerzas, objetos:d.objetos, cuerpo:d.cuerpo
    });
    const out = $("previewHtml");
    const err = $("errorBox");
    if(!out||!err) return;
    try{
      out.textContent = built.waMulti;
      err.hidden = true; err.textContent = "";
    }catch(e){
      err.hidden=false; err.textContent = "Error al generar vista previa: "+e.message;
    }
  }

  $("generar")?.addEventListener("click", ()=>{ renderTitlePreview(); preview(); });

  // ===== Copiar a WhatsApp (formato solicitado)
  $("copiarWA")?.addEventListener("click", async ()=>{
    const d = buildData();
    const b = window.HRFMT.buildAll({
      generales:d.generales, civiles:d.civiles, fuerzas:d.fuerzas, objetos:d.objetos, cuerpo:d.cuerpo
    });
    // Recompongo con subtítulo en **negrita** y líneas separadas
    const titulo = b.forDocx?.titulo ? `*${b.forDocx.titulo}*` : "";
    const sub    = b.forDocx?.subtitulo ? `*${b.forDocx.subtitulo}*` : "";
    const extracto = extractFirstParagraphOneLine(b.forDocx?.bodyHtml || d.cuerpo || "");
    const multiline = [titulo, sub, extracto].filter(Boolean).join("\n");

    const sinSaltos = $("wa_merge")?.checked === true;
    const finalText = sinSaltos ? multiline.replace(/\n+/g," ") : multiline;

    try{
      await navigator.clipboard.writeText(finalText);
      alert("Texto copiado para WhatsApp.");
    }catch{
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = finalText; document.body.appendChild(ta);
      ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
      alert("Texto copiado para WhatsApp (fallback).");
    }
  });

  // ====== Casos (CRUD + listado)
  const getCases=()=>{ try{ return JSON.parse(localStorage.getItem(CASEKEY)||"[]"); }catch{ return []; } };
  const setCases=(a)=> localStorage.setItem(CASEKEY, JSON.stringify(a));
  const freshId=()=> "c_"+Date.now()+"_"+Math.random().toString(36).slice(2,7);

  function renderCases(){
    const wrap = $("casesList");
    const q = val("caseSearch").toLowerCase();
    let arr = getCases();
    if(q){
      arr = arr.filter(c=>{
        const g=c.generales||{};
        const hay = [c.name, g.dependencia, g.caratula, g.subtitulo, g.partido, g.localidad, g.numExp].join(" ").toLowerCase();
        return hay.includes(q);
      });
    }
    if(!wrap) return;
    if(!arr.length){ wrap.innerHTML = "Sin hechos guardados."; return; }
    const rows = arr.map(c=>`
      <tr>
        <td><input type="checkbox" class="caseCheck" data-id="${c.id}"></td>
        <td><input type="radio" name="caseSel" class="caseRadio" data-id="${c.id}"></td>
        <td>${c.name||""}</td>
        <td>${(c.generales?.fecha_hora)||""}</td>
        <td>${titleCase(c.generales?.dependencia||"")}</td>
        <td>${titleCase(c.generales?.caratula||"")}</td>
        <td>${c.generales?.numExp||""}</td>
      </tr>`).join("");
    wrap.innerHTML = `
      <div class="table">
        <table>
          <thead><tr>
            <th>✔</th><th>Sel</th><th>Nombre</th><th>Fecha</th><th>Dependencia</th><th>Carátula</th><th>N°</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }
  const selectedRadio = ()=>{ const r=document.querySelector('input[name="caseSel"]:checked'); return r?r.getAttribute("data-id"):null; };
  const selectedChecks = ()=> Array.from(document.querySelectorAll(".caseCheck:checked")).map(c=> c.getAttribute("data-id"));

  $("saveCase")?.addEventListener("click", ()=>{
    const snap = buildData(); snap.id = freshId();
    const arr = getCases(); arr.unshift(snap); setCases(arr);
    renderCases(); alert("Hecho guardado.");
  });
  $("updateCase")?.addEventListener("click", ()=>{
    const id = selectedRadio(); if(!id){ alert("Seleccioná un hecho para actualizar."); return; }
    const arr = getCases(); const ix = arr.findIndex(c=> c.id===id);
    if(ix<0){ alert("No se encontró el hecho."); return; }
    const snap = buildData(); snap.id = id;
    arr[ix] = snap; setCases(arr); renderCases(); alert("Hecho actualizado.");
  });
  $("deleteCase")?.addEventListener("click", ()=>{
    if(!isAdmin()){ if(!ensureAdmin()) return; }
    const id = selectedRadio(); if(!id){ alert("Seleccioná un hecho para borrar."); return; }
    if(!confirm("¿Borrar seleccionado?")) return;
    const arr = getCases().filter(c=> c.id!==id); setCases(arr); renderCases();
  });
  $("loadSelected")?.addEventListener("click", ()=>{
    const id = selectedRadio(); if(!id){ alert("Seleccioná un hecho para cargar."); return; }
    const c = getCases().find(x=> x.id===id); if(!c){ alert("No se encontró el hecho."); return; }
    // Generales
    if (c.generales){
      const g=c.generales;
      // fecha: intentar parsear dd/mm/aaaa
      if (g.fecha_hora){
        const parts = g.fecha_hora.split("/");
        if(parts.length===3){
          const iso = `${parts[2]}-${String(parts[1]).padStart(2,"0")}-${String(parts[0]).padStart(2,"0")}`;
          setv("g_fecha_dia", iso);
        }
      }
      setv("g_tipoExp", g.tipoExp||"PU");
      setv("g_numExp", g.numExp||"");
      setv("g_car", g.caratula||"");
      setv("g_partido", g.partido||"");
      loadLocalidadesDeps();
      setv("g_localidad", g.localidad||"");
      if (g.dependencia && getCatalogs()[g.partido]?.dependencias?.includes(g.dependencia)){
        setv("g_dep", g.dependencia);
        show("g_dep_manual_wrap", false);
      }else{
        setv("g_dep","__manual__");
        show("g_dep_manual_wrap", true);
        setv("g_dep_manual", g.dependencia||"");
      }
      setv("g_sub", g.subtitulo||"");
      setv("g_ok", g.esclarecido?"si":"no");
      setv("g_ufi", g.ufi||"");
      setv("g_coord", g.coordenadas||"");
      $("g_relevante").checked = !!g.relevante;
      $("g_supervisado").checked = !!g.supervisado;
    }
    // Listas
    CIV.list = (c.civiles||[]).slice(); FZA.list=(c.fuerzas||[]).slice(); OBJ.list=(c.objetos||[]).slice();
    $("cuerpo").value = c.cuerpo||"";
    setv("caseName", c.name||"");
    CIV.render(); FZA.render(); OBJ.render(); renderTagHelper(); renderTitlePreview(); preview();
    alert("Hecho cargado en el formulario.");
  });
  $("caseSearch")?.addEventListener("input", renderCases);

  // ====== Exportaciones
  $("descargarWord")?.addEventListener("click", async ()=>{
    try{
      const d = buildData();
      const snap = { generales:d.generales, civiles:d.civiles, fuerzas:d.fuerzas, objetos:d.objetos, cuerpo:d.cuerpo };
      await window.HRFMT.downloadDocx(snap, window.docx);
    }catch(e){ alert("No se pudo generar Word: "+e.message); }
  });

  $("downloadWordMulti")?.addEventListener("click", async ()=>{
    const ids=selectedChecks();
    const list = ids.length? getCases().filter(c=> ids.includes(c.id)) : [ buildData() ];
    if (!list.length){ alert("Nada para exportar"); return; }
    try{
      const snaps = list.map(c=> ({ generales:c.generales, civiles:c.civiles, fuerzas:c.fuerzas, objetos:c.objetos, cuerpo:c.cuerpo }));
      await window.HRFMT.downloadDocxMulti(snaps, window.docx);
    }catch(e){ alert("No se pudo generar Word múltiple: "+e.message); }
  });

  $("exportCSV")?.addEventListener("click", ()=>{
    const ids=selectedChecks();
    const list = ids.length? getCases().filter(c=> ids.includes(c.id)) : [ buildData() ];
    if (!list.length){ alert("Nada para exportar"); return; }
    try{ window.HRFMT.downloadCSV(list); }catch(e){ alert("No se pudo exportar CSV: "+e.message); }
  });

// ====== Exportar Excel (XLSX listo, con carga bajo demanda ROBUSTA)
async function ensureXLSX(){
  if (window.XLSX) return true;

  // Helper: carga un <script> con timeout
  function loadScript(url, timeoutMs = 10000){
    return new Promise((resolve)=>{
      const s = document.createElement('script');
      let done = false;
      const t = setTimeout(()=>{ if(!done){ done = true; s.remove(); resolve(false); } }, timeoutMs);
      s.src = url;
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.onload = ()=>{ if(!done){ done = true; clearTimeout(t); resolve(!!window.XLSX); } };
      s.onerror = ()=>{ if(!done){ done = true; clearTimeout(t); resolve(false); } };
      document.head.appendChild(s);
    });
  }

  // 3 CDNs + copia local como último recurso
  const SOURCES = [
    "https://cdn.jsdelivr.net/npm/xlsx@0.19.3/dist/xlsx.full.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.19.3/xlsx.full.min.js",
    "https://unpkg.com/xlsx@0.19.3/dist/xlsx.full.min.js",
    // Copia local (creá este archivo, ver paso 2)
    "vendor/xlsx.full.min.js"
  ];

  for (const src of SOURCES){
    // Consola para diagnosticar si algo falla
    try { console.log("[XLSX] intentando cargar:", src); } catch {}
    const ok = await loadScript(src);
    if (ok) return true;
  }
  return false;
}
  // ====== Catálogos (Admin)
  function loadCatEditor(){
    const p = val("cat_partidoSel"); const cat = getCatalogs();
    const obj = cat[p] || {localidades:[],dependencias:[]};
    setv("cat_localidades", (obj.localidades||[]).join("\n"));
    setv("cat_dependencias", (obj.dependencias||[]).join("\n"));
  }
  $("cat_partidoSel")?.addEventListener("change", loadCatEditor);

  $("cat_agregarPartido")?.addEventListener("click", ()=>{
    const name = titleCase(val("cat_partidoNuevo").trim());
    const cat = getCatalogs();
    if (!name){ alert("Ingresá un nombre de partido."); return; }
    if (!cat[name]) cat[name] = { localidades:[], dependencias:[] };
    setCatalogs(cat); fillPartidos(); setv("cat_partidoSel", name); loadCatEditor();
    alert("Partido creado/seleccionado.");
  });

  $("cat_guardar")?.addEventListener("click", ()=>{
    if(!isAdmin()){ if(!ensureAdmin()) return; }
    const p = val("cat_partidoSel"); if(!p){ alert("Seleccioná un partido."); return; }
    const locs = val("cat_localidades").split(/\n+/).map(s=>s.trim()).filter(Boolean);
    const deps = val("cat_dependencias").split(/\n+/).map(s=>s.trim()).filter(Boolean);
    const cat = getCatalogs();
    cat[p] = { localidades: locs, dependencias: deps };
    setCatalogs(cat); fillPartidos(); alert("Catálogo guardado.");
  });

  $("cat_reset")?.addEventListener("click", ()=>{
    if(!isAdmin()){ if(!ensureAdmin()) return; }
    if(!confirm("¿Restaurar ejemplos por defecto? Esto reemplaza TODO el catálogo.")) return;
    setCatalogs(DEFAULT_CATALOGS); fillPartidos(); loadLocalidadesDeps(); loadCatEditor();
    alert("Catálogo restaurado.");
  });

  $("cat_eliminarPartido")?.addEventListener("click", ()=>{
    if(!isAdmin()){ if(!ensureAdmin()) return; }
    const p = val("cat_partidoSel"); if(!p){ alert("Seleccioná un partido."); return; }
    if(!confirm(`¿Eliminar el partido "${p}"?`)) return;
    const cat = getCatalogs(); delete cat[p]; setCatalogs(cat); fillPartidos(); loadCatEditor();
    alert("Partido eliminado.");
  });

  // ====== Backup / Restore / Merge JSON
  function downloadBlob(filename, data, type="application/json"){
    const blob = new Blob([data], {type}); const a=document.createElement("a");
    a.href=URL.createObjectURL(blob); a.download=filename; a.click();
  }

  $("backupJSON")?.addEventListener("click", ()=>{
    const payload = {
      catalogs: getCatalogs(),
      cases: getCases(),
      when: new Date().toISOString()
    };
    downloadBlob(`backup_hechos_${new Date().toISOString().slice(0,19).replace(/[:T]/g,"-")}.json`, JSON.stringify(payload,null,2));
  });

  $("restoreJSON")?.addEventListener("click", ()=>{
    if(!isAdmin()){ if(!ensureAdmin()) return; }
    const inp = document.createElement("input"); inp.type="file"; inp.accept="application/json";
    inp.onchange = async ()=>{
      const file = inp.files?.[0]; if(!file) return;
      const txt = await file.text();
      try{
        const j = JSON.parse(txt);
        if (j.catalogs) setCatalogs(j.catalogs);
        if (j.cases) localStorage.setItem(CASEKEY, JSON.stringify(j.cases));
        fillPartidos(); loadLocalidadesDeps(); loadCatEditor(); renderCases();
        alert("JSON restaurado.");
      }catch(e){ alert("Archivo inválido: "+e.message); }
    };
    inp.click();
  });

  $("mergeJSON")?.addEventListener("click", ()=>{
    if(!isAdmin()){ if(!ensureAdmin()) return; }
    const inp = document.createElement("input"); inp.type="file"; inp.accept="application/json";
    inp.onchange = async ()=>{
      const file = inp.files?.[0]; if(!file) return;
      const txt = await file.text();
      try{
        const j = JSON.parse(txt);
        if (j.catalogs){
          const cur = getCatalogs();
          const merged = {...cur};
          Object.keys(j.catalogs).forEach(p=>{
            const a = cur[p] || {localidades:[],dependencias:[]};
            const b = j.catalogs[p] || {localidades:[],dependencias:[]};
            merged[p] = {
              localidades: Array.from(new Set([...(a.localidades||[]), ...(b.localidades||[])])).sort(),
              dependencias: Array.from(new Set([...(a.dependencias||[]), ...(b.dependencias||[])])).sort()
            };
          });
          setCatalogs(merged);
        }
        if (j.cases){
          const cur = getCases();
          const ids = new Set(cur.map(x=>x.id));
          const toAdd = (j.cases||[]).filter(x=> !ids.has(x.id));
          setCases([...cur, ...toAdd]);
        }
        fillPartidos(); loadLocalidadesDeps(); loadCatEditor(); renderCases();
        alert("JSON fusionado.");
      }catch(e){ alert("Archivo inválido: "+e.message); }
    };
    inp.click();
  });

  // ====== Init ======
  fillPartidos(); loadLocalidadesDeps();
  CIV.render(); FZA.render(); OBJ.render();
  renderTagHelper(); renderTitlePreview(); preview();
  loadCatEditor(); applyAdminUI(); renderCases();
});

// app.js — FIX catálogos + binds + agregar civiles/fuerza/objetos

window.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const val = (id) => ($(id)?.value ?? "");
  const setv = (id,v)=>{ const n=$(id); if(n) n.value=v; };
  const show = (id,on)=>{ const n=$(id); if(n) n.style.display = on?"block":"none"; };

  // ===== storage keys (v9)
  const CASEKEY = "hr_cases_v9";
  const CATKEY  = "hr_catalogs_v9";

  // ===== defaults
  const DEFAULT_CATALOGS = {
    "General Pueyrredon": {
      localidades: ["Mar del Plata","Batán","Sierra de los Padres","Chapadmalal","Estación Camet","El Boquerón"],
      dependencias: ["Cria. Mar Del Plata 1ra.","Cria. Mar Del Plata 2da.","Cria. Mar Del Plata 3ra.","Cria. Mar Del Plata 4ta.","Cria. Mar Del Plata 5ta.","Cria. Mar Del Plata 6ta.","Subcria. Camet","Subcria. Acantilados","DDI Mar del Plata","Comisaría de la Mujer MdP","UPPL MdP","CPO MdP"]
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

  // ===== catálogos (con fallback seguro)
  function getCatalogs() {
    try {
      const raw = localStorage.getItem(CATKEY);
      if (!raw) return structuredClone(DEFAULT_CATALOGS);
      const parsed = JSON.parse(raw);
      // si algo viene roto, fallback
      if (!parsed || typeof parsed !== "object") return structuredClone(DEFAULT_CATALOGS);
      return parsed;
    } catch {
      return structuredClone(DEFAULT_CATALOGS);
    }
  }
  function setCatalogs(obj) {
    localStorage.setItem(CATKEY, JSON.stringify(obj));
  }
  // si no hay nada guardado, sembrar defaults una vez
  if (!localStorage.getItem(CATKEY)) {
    setCatalogs(DEFAULT_CATALOGS);
  }

  // ===== llenar selects
  function fillPartidos() {
    const cat = getCatalogs();
    const partidos = Object.keys(cat).sort((a,b)=>a.localeCompare(b));

    const sp = $("g_partido");
    const sc = $("cat_partidoSel");
    if (sp) {
      sp.innerHTML = "";
      sp.append(new Option("— Elegir —",""));
      partidos.forEach(p => sp.append(new Option(p,p)));
    }
    if (sc) {
      sc.innerHTML = "";
      partidos.forEach(p => sc.append(new Option(p,p)));
      if (partidos.length) sc.value = partidos[0];
    }
  }

  function loadLocalidadesDeps() {
    const cat = getCatalogs();
    const partido = val("g_partido");
    const sl = $("g_localidad");
    const sd = $("g_dep");
    if (!sl || !sd) return;

    sl.innerHTML = "";
    sd.innerHTML = "";
    sl.append(new Option("— Elegir —",""));
    sd.append(new Option("— Elegir —",""));

    if (partido && cat[partido]) {
      (cat[partido].localidades||[]).forEach(v => sl.append(new Option(v,v)));
      (cat[partido].dependencias||[]).forEach(v => sd.append(new Option(v,v)));
      sd.append(new Option("Escribir manualmente…","__manual__"));
    }
    show("g_dep_manual_wrap", val("g_dep")==="__manual__");
  }

  // ===== chips helper mínimo (evita errores si no hay nada)
  function renderTagHelper(){
    const box = $("tagHelper");
    if (box) box.innerHTML = `<span class="muted">Cargá personas/objetos para ver etiquetas…</span>`;
  }

  // ===== stores y renders básicos (Civiles / Fuerza / Objetos)
  const toTitle = (s)=> (s||"").toLowerCase().replace(/\b([a-záéíóúñü])([a-záéíóúñü]*)/gi, (_,a,b)=> a.toUpperCase()+b);

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
      this.store.push(p);
      this.render();
      setv("c_nombre",""); setv("c_apellido",""); setv("c_edad",""); setv("c_dni","");
      setv("c_pais",""); setv("c_loc",""); setv("c_calle",""); setv("c_obito","false");
    },
    render(){
      const box = $("civilesList");
      if (!box) return;
      if (!this.store.length) { box.innerHTML=""; renderTagHelper(); return; }
      box.innerHTML = `<div class="table"><table><thead><tr>
        <th>#</th><th>Vínculo</th><th>Nombre</th><th>Apellido</th><th>Edad</th><th>DNI</th><th>Domicilio</th>
      </tr></thead><tbody>${
        this.store.map((p,i)=>`<tr>
          <td>${i}</td><td>${toTitle(p.vinculo)}</td>
          <td>${toTitle(p.nombre||"")}</td>
          <td>${toTitle(p.apellido||"")}</td>
          <td>${p.edad||""}</td>
          <td>${p.dni||""}</td>
          <td>${[toTitle(p.calle_domicilio||""), toTitle(p.loc_domicilio||"")].filter(Boolean).join(", ")}</td>
        </tr>`).join("")
      }</tbody></table></div>`;
      renderTagHelper();
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
      this.store.push(p);
      this.render();
      setv("f_nombre",""); setv("f_apellido",""); setv("f_edad",""); setv("f_fuerza","");
      setv("f_jerarquia",""); setv("f_legajo",""); setv("f_destino",""); setv("f_loc","");
      setv("f_calle",""); setv("f_obito","false");
    },
    render(){
      const box = $("fuerzasList");
      if (!box) return;
      if (!this.store.length) { box.innerHTML=""; renderTagHelper(); return; }
      box.innerHTML = `<div class="table"><table><thead><tr>
        <th>#</th><th>Vínculo</th><th>Nombre</th><th>Apellido</th><th>Edad</th><th>Fuerza</th><th>Jerarquía</th><th>Destino</th>
      </tr></thead><tbody>${
        this.store.map((p,i)=>`<tr>
          <td>${i}</td><td>${toTitle(p.vinculo)}</td>
          <td>${toTitle(p.nombre||"")}</td><td>${toTitle(p.apellido||"")}</td>
          <td>${p.edad||""}</td><td>${p.fuerza||""}</td><td>${p.jerarquia||""}</td><td>${p.destino||""}</td>
        </tr>`).join("")
      }</tbody></table></div>`;
      renderTagHelper();
    }
  };

  const OBJ = {
    store:[],
    add(){
      const o = { descripcion: val("o_desc"), vinculo:(val("o_vinc")||"secuestro").toLowerCase() };
      if(!o.descripcion.trim()) return;
      this.store.push(o);
      this.render();
      setv("o_desc",""); setv("o_vinc","secuestro");
    },
    render(){
      const box = $("objetosList");
      if (!box) return;
      if (!this.store.length) { box.innerHTML=""; renderTagHelper(); return; }
      box.innerHTML = `<div class="table"><table><thead><tr>
        <th>#</th><th>Descripción</th><th>Vínculo</th>
      </tr></thead><tbody>${
        this.store.map((o,i)=>`<tr>
          <td>${i}</td><td>${o.descripcion}</td><td>${toTitle(o.vinculo)}</td>
        </tr>`).join("")
      }</tbody></table></div>`;
      renderTagHelper();
    }
  };

  // ===== título + preview
  function fechaFmt(){
    const d = val("g_fecha_dia");
    if(!d) return "";
    const [y,m,day] = d.split("-");
    return `${day}-${m}-${y}`;
  }
  function resolvedDep(){ return val("g_dep")==="__manual__" ? val("g_dep_manual").trim() : val("g_dep"); }
  function buildData(){
    const tipo=val("g_tipoExp")||"PU"; const num=(val("g_numExp")||"").trim();
    return {
      generales:{
        fecha_hora: fechaFmt(),
        tipoExp: tipo, numExp: num, pu: num? `${tipo} ${num}` : "",
        partido: val("g_partido"), localidad: val("g_localidad"), dependencia: resolvedDep(),
        caratula: val("g_car").trim(), subtitulo: val("g_sub").trim(), esclarecido: val("g_ok")==="si",
        ufi: val("g_ufi").trim(), coordenadas: val("g_coord").trim()
      },
      civiles: CIV.store.slice(), fuerzas: FZA.store.slice(), objetos: OBJ.store.slice(),
      cuerpo: val("cuerpo")
    };
  }
  function renderTitlePreview(){
    const out = (window.HRFMT?.buildAll ? window.HRFMT.buildAll(buildData()) : { forDocx:{ titulo:"" }, waLong:"" });
    if ($("tituloCompuesto")) $("tituloCompuesto").textContent = out.forDocx?.titulo || "";
    if ($("subCompuesto")) $("subCompuesto").textContent = (buildData().generales.subtitulo || "");
  }
  function preview(){
    if (!window.HRFMT?.buildAll) return;
    const out = HRFMT.buildAll(buildData());
    const p = $("previewHtml"); if (p) p.textContent = out.waLong;
  }

  // ===== binds
  $("g_partido")?.addEventListener("change", ()=>{ loadLocalidadesDeps(); renderTitlePreview(); });
  $("g_dep")?.addEventListener("change", ()=>{ show("g_dep_manual_wrap", val("g_dep")==="__manual__"); renderTitlePreview(); });
  ["g_fecha_dia","g_tipoExp","g_numExp","g_car","g_sub","g_ok","g_ufi","g_coord","g_dep_manual","g_localidad"]
    .forEach(id=> $(id)?.addEventListener("input", renderTitlePreview));

  // acciones
  $("addCivil")?.addEventListener("click", ()=>{ CIV.add(); });
  $("addFuerza")?.addEventListener("click", ()=>{ FZA.add(); });
  $("addObjeto")?.addEventListener("click", ()=>{ OBJ.add(); });

  $("generar")?.addEventListener("click", preview);
  $("copiarWA")?.addEventListener("click", ()=>{
    if (!window.HRFMT?.buildAll) return;
    const out = HRFMT.buildAll(buildData());
    navigator.clipboard.writeText(out.waLong).then(()=> alert("Copiado para WhatsApp"));
  });
  $("descargarWord")?.addEventListener("click", async ()=>{
    try{
      if (!window.HRFMT?.downloadDocx) throw new Error("formatter.js no cargado");
      await HRFMT.downloadDocx(buildData(), (window.docx||{}));
    }catch(e){ alert(e.message||"No pude generar el Word"); }
  });

  // ===== init
  fillPartidos();
  loadLocalidadesDeps();
  CIV.render(); FZA.render(); OBJ.render();
  renderTitlePreview(); preview();
  renderTagHelper();

  // ===== Catálogos (pestaña)
  $("cat_agregarPartido")?.addEventListener("click", ()=>{
    const nombre = (val("cat_partidoNuevo")||"").trim();
    if(!nombre) { alert("Escribí el nombre del nuevo partido."); return; }
    const cat = getCatalogs();
    if(!cat[nombre]) cat[nombre]={ localidades:[], dependencias:[] };
    setCatalogs(cat); fillPartidos();
    const sel = $("cat_partidoSel"); if(sel){ sel.value = nombre; }
    setv("cat_partidoNuevo","");
    loadCatEditor();
    const sp = $("g_partido"); if(sp){ sp.value=nombre; loadLocalidadesDeps(); }
  });
  $("cat_partidoSel")?.addEventListener("change", loadCatEditor);
  $("cat_guardar")?.addEventListener("click", ()=>{
    const partido = val("cat_partidoSel"); if(!partido){ alert("Elegí un partido."); return; }
    const cat = getCatalogs();
    cat[partido] = {
      localidades: (val("cat_localidades")||"").split("\n").map(s=>s.trim()).filter(Boolean),
      dependencias: (val("cat_dependencias")||"").split("\n").map(s=>s.trim()).filter(Boolean)
    };
    setCatalogs(cat); fillPartidos();
    if (val("g_partido")===partido) loadLocalidadesDeps();
    alert("Catálogo guardado.");
  });
  $("cat_reset")?.addEventListener("click", ()=>{
    setCatalogs(DEFAULT_CATALOGS); fillPartidos(); loadLocalidadesDeps(); loadCatEditor();
    alert("Catálogos restaurados.");
  });
  function loadCatEditor(){
    const cat = getCatalogs();
    const p = val("cat_partidoSel") || Object.keys(cat)[0];
    if (!p || !cat[p]) return;
    setv("cat_localidades", (cat[p].localidades||[]).join("\n"));
    setv("cat_dependencias", (cat[p].dependencias||[]).join("\n"));
  }
  loadCatEditor();
});

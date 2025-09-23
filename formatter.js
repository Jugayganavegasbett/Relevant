// formatter.js — V9 PRO (WA multiline + personas bold/italic + Docx simple y múltiple)
window.HRFMT = (function () {
  const titleCase = (s)=> (s||"").toLowerCase().replace(/\b([a-záéíóúñü])([a-záéíóúñü]*)/gi, (_,a,b)=> a.toUpperCase()+b);
  const nonEmpty = (x)=> (x??"").toString().trim().length>0;
  const oneLine = (t)=> (t||"").replace(/\s*\n+\s*/g," ").replace(/[ \t]{2,}/g," ").trim();

  // **_Nombre Apellido (edad, domicilio)_**
  const niceName = (p)=>{
    const n = titleCase(p?.nombre||"");
    const a = titleCase(p?.apellido||"");
    const full = [n,a].filter(Boolean).join(" ");
    const parts = [];
    if (p?.edad && String(p.edad).trim()) parts.push(String(p.edad).trim());
    const domBits = [p?.calle_domicilio, p?.loc_domicilio].map(x=> titleCase(x||"")).filter(Boolean);
    if (domBits.length) parts.push(domBits.join(", "));
    const paren = parts.length ? ` (${parts.join(", ")})` : "";
    return full ? `*_${full}${paren}_*` : "";
  };

  function buildTitulo(d){
    const g=d.generales||{};
    const f=g.fecha_hora||"";
    const dep=titleCase(g.dependencia||"");
    const car=titleCase(g.caratula||"");
    const tipo=g.tipoExp||"PU"; const num=(g.numExp||"").trim();
    const parts=[]; if(f) parts.push(f);
    if(num){ parts.push(`${tipo} ${num}`); if(dep) parts.push(dep); if(car) parts.push(car); }
    else { parts.push("Info DDIC Mar del Plata","Adelanto"); if(dep) parts.push(dep); if(car) parts.push(car); }
    return parts.filter(nonEmpty).join(" - ");
  }

  function expandTags(d, raw){
    const civ=d.civiles||[], fza=d.fuerzas||[], objs=d.objetos||[];
    const all=civ.concat(fza);
    const personBy=(role,i)=> all.filter(p=> (p.vinculo||"").toLowerCase()===role)[+i]||null;
    const pfBy=(i)=> fza[+i]||null;
    const objList=(cat)=> objs.filter(o=> (o.vinculo||"").toLowerCase()===cat).map(o=>o.descripcion);
    let texto=raw||"";
    const ROLES="victima|imputado|sindicado|denunciante|testigo|pp|aprehendido|detenido|menor|nn|interviniente|damnificado institucional";
    texto = texto.replace(new RegExp(`#(${ROLES}):(\\d+)`,"gi"),(_,r,i)=>{ const p=personBy(r.toLowerCase(),i); return p? niceName(p): `#${r}:${i}`; });
    texto = texto.replace(/#pf:(\d+)/gi,(_,i)=>{ const p=pfBy(i); return p? niceName(p): `#pf:${i}`; });
    texto = texto.replace(/#pf\b/gi, ()=> fza.length? niceName(fza[0]) : "#pf");
    ["secuestro","sustraccion","hallazgo","otro"].forEach(cat=>{
      const reIdx=new RegExp(`#${cat}:(\\d+)`,"gi");
      texto=texto.replace(reIdx,(_,i)=>{ const arr=objList(cat); const o=arr[+i]; return o? `_${o}_`:`#${cat}:${i}`; });
      const re=new RegExp(`#${cat}\\b`,"gi");
      texto=texto.replace(re,()=>{ const arr=objList(cat); return arr.length? `_${arr.join(", ")}_`:`#${cat}`; });
    });
    return texto;
  }

  function extractFirstParagraph(s){
    const t = (s||"").trim();
    if (!t) return "";
    const firstPara = t.split(/\n{2,}/)[0].trim();
    return oneLine(firstPara);
  }

  function buildAll(data){
    const d=data||{}; const g=d.generales||{};
    const tituloPlano=buildTitulo(d);
    const cuerpoExp=expandTags(d, d.cuerpo||"");
    const extracto = extractFirstParagraph(cuerpoExp);
    const waTitle = `*${tituloPlano}*`;
    const waSub   = g.subtitulo ? `_${titleCase(g.subtitulo)}_` : "";

    // WhatsApp: 3 líneas (título / subtítulo / extracto)
    const waMulti = [waTitle, waSub, extracto].filter(Boolean).join("\n");
    // WhatsApp: 1 línea (modo “Sin saltos”)
    const waLong  = oneLine([waTitle, waSub, extracto].filter(Boolean).join(" "));

    return {
      waLong,      // 1 línea
      waMulti,     // 3 líneas
      html: waMulti,
      forDocx: {
        titulo: tituloPlano,
        subtitulo: titleCase(g.subtitulo||""),
        color: g.esclarecido? "00AEEF":"FF3B30",
        bodyHtml: (cuerpoExp||"").replace(/\r/g,"").trim()
      }
    };
  }

  // ===== Docx: un caso
  async function downloadDocx(snap, lib){
    const { Document,Packer,Paragraph,TextRun,AlignmentType }=lib||{};
    if(!Document) throw new Error("docx no cargada");
    const JUST=AlignmentType.JUSTIFIED;
    const built=buildAll(snap);

    function mdRuns(str){
      const parts=(str||"").split(/(\*|_)/g);
      let B=false,I=false; const out=[];
      for(const p of parts){
        if(p==="*"){ B=!B; continue; }
        if(p==="_"){ I=!I; continue; }
        if(!p) continue;
        out.push(new TextRun({ text:p, bold:B, italics:I })); // sin subrayado
      }
      return out;
    }

    const children=[];
    children.push(new Paragraph({ children:[ new TextRun({text:built.forDocx.titulo, bold:true}) ] }));
    if(built.forDocx.subtitulo){
      children.push(new Paragraph({ children:[ new TextRun({text:built.forDocx.subtitulo, bold:true, color:built.forDocx.color}) ] }));
    }
    (built.forDocx.bodyHtml||"").split(/\n\n+/).forEach(p=>{
      children.push(new Paragraph({ children: mdRuns(p), alignment: JUST, spacing:{after:200} }));
    });

    const doc=new Document({ styles:{ default:{ document:{ run:{ font:"Arial", size:24 } } } }, sections:[{ children }] });
    const blob=await Packer.toBlob(doc);
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download=`Hecho_${new Date().toISOString().slice(0,10)}.docx`;
    a.click();
  }

  // ===== Docx: varios casos en un solo archivo (uno debajo del otro)
  async function downloadDocxMulti(snaps, lib){
    const { Document,Packer,Paragraph,TextRun,AlignmentType }=lib||{};
    if(!Document) throw new Error("docx no cargada");
    const JUST=AlignmentType.JUSTIFIED;

    function mdRuns(str){
      const parts=(str||"").split(/(\*|_)/g);
      let B=false,I=false; const out=[];
      for(const p of parts){
        if(p==="*"){ B=!B; continue; }
        if(p==="_"){ I=!I; continue; }
        if(!p) continue;
        out.push(new TextRun({ text:p, bold:B, italics:I }));
      }
      return out;
    }

    const children=[];
    (snaps||[]).forEach((snap, idx)=>{
      const b = buildAll(snap);
      children.push(new Paragraph({ children:[ new TextRun({text:b.forDocx.titulo, bold:true}) ] }));
      if(b.forDocx.subtitulo){
        children.push(new Paragraph({ children:[ new TextRun({text:b.forDocx.subtitulo, bold:true, color:b.forDocx.color}) ] }));
      }
      (b.forDocx.bodyHtml||"").split(/\n\n+/).forEach(p=>{
        children.push(new Paragraph({ children: mdRuns(p), alignment: JUST, spacing:{after:200} }));
      });
      if (idx < snaps.length-1){
        // separador visual entre casos (sin salto de página)
        children.push(new Paragraph({ children:[ new TextRun({ text:"" }) ], spacing:{after:300} }));
      }
    });

    const doc=new Document({ styles:{ default:{ document:{ run:{ font:"Arial", size:24 } } } }, sections:[{ children }] });
    const blob=await Packer.toBlob(doc);
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download=`Hechos_${new Date().toISOString().slice(0,10)}.docx`;
    a.click();
  }

  function downloadCSV(list){
    const rows=[];
    rows.push(["Nombre","Fecha","Tipo","Número","Partido","Localidad","Dependencia","Carátula","Subtítulo","Cuerpo"].join(","));
    (list||[]).forEach(s=>{
      const g=s.generales||{};
      const esc=(x)=> '\"'+String(x || "").replace(/\"/g,'\\\"')+'\"';
      rows.push([
        s.name||"", g.fecha_hora||"", g.tipoExp||"", g.numExp||"", g.partido||"", g.localidad||"",
        g.dependencia||"", g.caratula||"", g.subtitulo||"", (s.cuerpo||"").replace(/\n/g," \\n ")
      ].map(esc).join(","));
    });
    const blob=new Blob([rows.join("\n")],{type:"text/csv;charset=utf-8"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="hechos.csv"; a.click();
  }

  return { buildAll, downloadDocx, downloadDocxMulti, downloadCSV };
})();

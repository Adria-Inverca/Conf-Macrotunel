import { useState, useMemo, useEffect } from "react";

function isNullVal(v) {
  return v === null || v === undefined || v === "" || (typeof v === "string" && v.trim() === "");
}
function matchesAttrs(record, attrs) {
  for (const [key, val] of Object.entries(attrs)) {
    if (isNullVal(val)) continue;
    const rv = record[key];
    if (isNullVal(rv)) return false;
    const a = typeof val === "string" ? val.trim() : val;
    const b = typeof rv  === "string" ? rv.trim()  : rv;
    if (typeof a === "number" && typeof b === "string") { if (parseFloat(b) !== a) return false; }
    else if (typeof a === "string" && typeof b === "number") { if (a !== String(b)) return false; }
    else { if (a !== b) return false; }
  }
  return true;
}
function makeLookup(db) {
  return function lookup(dbKey, attrs) {
    const table = db[dbKey];
    if (!table) return { CODIGO:"SIN BD", DESCRIPCION:`Base de datos no encontrada: ${dbKey}` };
    const hit = table.find(r => matchesAttrs(r, attrs));
    return hit ? { CODIGO:hit.CODIGO, DESCRIPCION:hit.DESCRIPCION }
               : { CODIGO:"NO ENCONTRADO", DESCRIPCION:`Sin coincidencia en ${dbKey} · ${JSON.stringify(attrs)}` };
  };
}

function calcular(inputs, vanos, db) {
  const lookup = makeLookup(db);
  const { numTuneles, anchura, altura, film } = inputs;
  const nVanos    = vanos.length;
  const longTunel = vanos.reduce((s,v) => s + v.longitud, 0);
  const countCSA  = vanos.filter(v => v.csa === "SI").length;
  const countRT   = vanos.filter(v => v.rt  === "SI").length;

  const kEstacaCuernos = (nVanos+1)*(numTuneles+1);
  const kArco          = (nVanos+1)*numTuneles;
  const kCSA           = countCSA*(numTuneles+1);
  const kRT            = countRT*numTuneles;
  const kRL            = (nVanos+1)*2;
  const kRC            = numTuneles*2;
  const kFilm          = film === "SI" ? numTuneles : 0;

  const longEstacaCuernos = Math.round(altura*1000+800);
  const longArco          = Math.round(anchura*1000*1.25);
  const longBarraCSA      = Math.ceil(Math.sqrt(1913**2+(altura*1000-341)**2)+32);
  const longBarraRT       = 4000;
  const longBarraRC       = 1955;
  const longTrenzaRL      = Math.round((Math.ceil(Math.sqrt(1+altura**2)*10)/10+0.9)*10)/10;
  const cantCuerda        = (longTunel/4)*50;
  const cantFilmMetros    = longTunel+8;
  const anchoFilmMM       = longArco;
  const cantMallaCentral  = numTuneles*(longTunel+2);
  const cantMallaLateral  = longTunel+2;

  const bridaEstaca    = lookup("BRIDAS_I12",  {Acabado:"GS",espesor:2,seccion_brida:"Ø40",subtipo:"Brida",tipo:"Union",tipo_brida:"I-12"});
  const bridaArco      = lookup("BRIDAS_I12",  {Acabado:"GS",espesor:2,seccion_brida:"Ø35",subtipo:"Brida",tipo:"Union",tipo_brida:"I-12"});
  const autotaladrante = lookup("TORNILLOS",   {din_tornillo:"Din-7504-K",longitud_tornillo:19,metrica:6.3,subtipo:"Tornillo",tipo:"Torn",tipo_tornillo:"Autotaladrante"});
  const tornilloPG     = lookup("TORNILLOS",   {din_tornillo:"Din-933 P.G.",longitud_tornillo:40,metrica:8,subtipo:"Tornillo",tipo:"Torn"});
  const tuerca8        = lookup("TUERCAS",     {din_tuerca:"Din-985 bloc",metrica:8,subtipo:"Tuerca",tipo:"Torn"});
  const arandela8      = lookup("ARANDELAS",   {din_arandela:"DIN-125",metrica:8,subtipo:"Arandela",tipo:"Torn",tipo_arandela:"Acero"});

  const kits = [];

  kits.push({ id:"KIT_ESTACA_CUERNOS", nombre:"Kit Estaca con Hélice y Cuernos", cantidad:kEstacaCuernos, color:"#16a34a", piezas:[
    { nombre:"ESTACA CON HELICE Y CUERNOS", cantPorKit:1,
      ...lookup("ESTACA_CON_HELICE_Y_CUERNOS",{Acabado:"G.I.",especifico:"e=2",longitud:longEstacaCuernos,seccion:"Ø40",subtipo:"Acc.Cim.",tipo:"Acc",tipo_accesorio_cimentacion:"Estaca con helice y cuernos "}),
      atributos:`longitud=${longEstacaCuernos}mm · Ø40 · G.I.` }
  ]});

  kits.push({ id:"KIT_ARCO", nombre:"Kit Arco", cantidad:kArco, color:"#dc2626", piezas:[
    { nombre:"ARCO", cantPorKit:1,
      ...lookup("ARCO_RECTO",{Acabado:"GS",curvatura:"Recto",espesor_arco:1.5,longitud_arco:longArco,resistencia_material:275,seccion_arco:"Ø35",subtipo:"Arco",taladro_arco:"S/t",tipo:"PerfT"}),
      atributos:`longitud=${longArco}mm · Ø35` },
    { nombre:"AUTOTALADRANTE ARCO", cantPorKit:2, ...autotaladrante, atributos:"Din-7504-K · M6.3×19" }
  ]});

  const barraCSA = lookup("BARRA_PP",{Acabado:"GS",chafado:"PP",espesor_barra:1.5,longitud:longBarraCSA,seccion_barra:"Ø35",subtipo:"Barra",tipo:"PerfT"});
  kits.push({ id:"KIT_CSA", nombre:"Kit Cruz San Andrés", cantidad:kCSA, color:"#15803d", piezas:[
    { nombre:"BARRA PP CSA",       cantPorKit:2, ...barraCSA,      atributos:`longitud=${longBarraCSA}mm · Ø35` },
    { nombre:"BRIDA I-12 CSA",     cantPorKit:4, ...bridaEstaca,   atributos:"Ø40 · e=2 · L=40" },
    { nombre:"AUTOTALADRANTE CSA", cantPorKit:4, ...autotaladrante,atributos:"Din-7504-K · M6.3×19" },
    { nombre:"TORNILLO CSA",       cantPorKit:4, ...tornilloPG,    atributos:"Din-933 P.G. · M8×40" },
    { nombre:"TUERCA CSA",         cantPorKit:4, ...tuerca8,       atributos:"Din-985 bloc · M8" },
    { nombre:"ARANDELA CSA",       cantPorKit:8, ...arandela8,     atributos:"DIN-125 · M8 · Acero" }
  ]});

  const barraRT = lookup("BARRA_PP",{Acabado:"GS",chafado:"PP",espesor_barra:2,longitud:longBarraRT,seccion_barra:"Ø35",subtipo:"Barra",tipo:"PerfT"});
  kits.push({ id:"KIT_RT", nombre:"Kit Riostra Techo", cantidad:kRT, color:"#0891b2", piezas:[
    { nombre:"BARRA PP RT",          cantPorKit:2, ...barraRT,      atributos:`longitud=${longBarraRT}mm · Ø35` },
    { nombre:"BRIDA I-12 RT ESTACA", cantPorKit:2, ...bridaEstaca,  atributos:"Ø40 · e=2 · L=40" },
    { nombre:"BRIDA I-12 RT ARCO",   cantPorKit:2, ...bridaArco,    atributos:"Ø35 · e=2 · L=40" },
    { nombre:"AUTOTALADRANTE RT",    cantPorKit:4, ...autotaladrante,atributos:"Din-7504-K · M6.3×19" },
    { nombre:"TORNILLO RT",          cantPorKit:4, ...tornilloPG,   atributos:"Din-933 P.G. · M8×40" },
    { nombre:"TUERCA RT",            cantPorKit:4, ...tuerca8,      atributos:"Din-985 bloc · M8" },
    { nombre:"ARANDELA RT",          cantPorKit:8, ...arandela8,    atributos:"DIN-125 · M8 · Acero" }
  ]});

  const trenza       = lookup("TRENZA",      {especifico:"Trenza 140-160 (kg/mm2) 2x Ø3 G",subtipo:"Acc.Cult.",tipo:"Com"});
  const sujetacables = lookup("SUJETACABLES",{din_otros:"Din741",especifico:"Sujetacables",metrica:8,subtipo:"Otro",tipo:"Torn"});
  const estacaHelice = lookup("ESTACA_CON_HELICE",{Acabado:"G.I.",especifico:"e=2",longitud:1000,seccion:"Ø40",subtipo:"Acc.Cim.",tipo:"Acc",tipo_accesorio_cimentacion:"Estaca con helice"});
  kits.push({ id:"KIT_RL", nombre:"Kit Refuerzo Lateral", cantidad:kRL, color:"#ea580c", piezas:[
    { nombre:"ESTACA CON HELICE",    cantPorKit:1,           ...estacaHelice,  atributos:"e=2 · Ø40 · 1000mm · G.I." },
    { nombre:"TRENZA",               cantPorKit:longTrenzaRL,...trenza,         atributos:`${longTrenzaRL.toFixed(1)}m/kit` },
    { nombre:"SUJETACABLES",         cantPorKit:4,           ...sujetacables,  atributos:"Din741 · M8" },
    { nombre:"BRIDA I-12 RL ESTACA", cantPorKit:2,           ...bridaEstaca,   atributos:"Ø40 · e=2 · L=40" },
    { nombre:"AUTOTALADRANTE RL",    cantPorKit:2,           ...autotaladrante,atributos:"Din-7504-K · M6.3×19" },
    { nombre:"TORNILLO RL",          cantPorKit:2,           ...tornilloPG,    atributos:"Din-933 P.G. · M8×40" },
    { nombre:"TUERCA RL",            cantPorKit:4,           ...tuerca8,       atributos:"Din-985 bloc · M8" },
    { nombre:"ARANDELA RL",          cantPorKit:4,           ...arandela8,     atributos:"DIN-125 · M8 · Acero" }
  ]});

  const barraRC = lookup("BARRA_PP",{Acabado:"GS",chafado:"PP",espesor_barra:1.5,longitud:longBarraRC,seccion_barra:"Ø35",subtipo:"Barra",tipo:"PerfT"});
  kits.push({ id:"KIT_RC", nombre:"Kit Refuerzo Cenital", cantidad:kRC, color:"#ca8a04", piezas:[
    { nombre:"BARRA PP RC",       cantPorKit:1, ...barraRC,     atributos:`longitud=${longBarraRC}mm · Ø35` },
    { nombre:"BRIDA I-12 RC",     cantPorKit:2, ...bridaArco,   atributos:"Ø35 · e=2 · L=40" },
    { nombre:"AUTOTALADRANTE RC", cantPorKit:2, ...autotaladrante,atributos:"Din-7504-K · M6.3×19" },
    { nombre:"TORNILLO RC",       cantPorKit:2, ...tornilloPG,  atributos:"Din-933 P.G. · M8×40" },
    { nombre:"TUERCA RC",         cantPorKit:2, ...tuerca8,     atributos:"Din-985 bloc · M8" },
    { nombre:"ARANDELA RC",       cantPorKit:4, ...arandela8,   atributos:"DIN-125 · M8 · Acero" }
  ]});

  if (kFilm > 0) {
    kits.push({ id:"KIT_FILM", nombre:"Kit Film", cantidad:kFilm, color:"#7c3aed", piezas:[
      { nombre:"CUERDA",           cantPorKit:cantCuerda,    ...lookup("CUERDA",{especifico:"macrotunel",seccion:"8 mm",subtipo:"Otro",tipo:"Com",tipo_comercial_otro:"Cuerda"}), atributos:`${cantCuerda}m/kit · 8mm` },
      { nombre:"MANGUERA",         cantPorKit:32,            ...lookup("MANGUERA",{acabado_canal:"GS",especifico:"Manguera Ø20x1,2mm",subtipo:"Acc.Canal",tipo:"Acc"}), atributos:"Ø20x1,2mm · 32ud/kit" },
      { nombre:"BOLA POLIESTIRENO",cantPorKit:8,             ...lookup("BOLA_POLIESTIRENO",{seccion:"Ø7",subtipo:"Otro",tipo:"Com",tipo_comercial_otro:"Bola Poliestireno"}), atributos:"Ø7 · 8ud/kit" },
      { nombre:"FILM",             cantPorKit:cantFilmMetros,...lookup("FILM",{ancho_real:anchoFilmMM,subtipo:"Film",tipo:"Com",tipo_film:"Sencillo"}), atributos:`${cantFilmMetros}m · ancho=${anchoFilmMM}mm` }
    ]});
  }

  kits.push({ id:"KIT_MALLA", nombre:"Kit Malla Suelo", cantidad:1, color:"#65a30d", piezas:[
    { nombre:"MALLA CENTRAL", cantPorKit:cantMallaCentral, ...lookup("MALLA_SUELO",{ancho_real:6200,subtipo:"Malla",tipo:"Com",tipo_malla:"Suelo 100gr/m2"}), atributos:`${cantMallaCentral}m² · ancho=6200mm` },
    { nombre:"MALLA LATERAL", cantPorKit:cantMallaLateral, ...lookup("MALLA_SUELO",{ancho_real:3300,subtipo:"Malla suelo",tipo:"Com",tipo_malla:"Cubresuelos blanca 100 gr"}), atributos:`${cantMallaLateral}m² · ancho=3300mm` }
  ]});

  return { kits, longTunel, longEstacaCuernos, longArco, longBarraCSA, longTrenzaRL, cantCuerda, cantFilmMetros, anchoFilmMM };
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function ConfiguradorMacrotuneles() {
  const [db,      setDb]      = useState(null);
  const [dbError, setDbError] = useState(null);
  const [step,     setStep]     = useState("form");
  const [viewMode, setViewMode] = useState("kits");
  const [openKits, setOpenKits] = useState({});
  const [numTuneles, setNumTuneles] = useState(9);
  const [anchura,    setAnchura]    = useState(6);
  const [nVanos,     setNVanos]     = useState(16);
  const [altura,     setAltura]     = useState(2.2);
  const [filmSi,     setFilmSi]     = useState("SI");
  const [vanos, setVanos] = useState(() => [
    {longitud:2,csa:"SI",rt:"SI"},{longitud:2,csa:"SI",rt:"NO"},
    {longitud:4,csa:"NO",rt:"NO"},{longitud:4,csa:"NO",rt:"NO"},
    {longitud:4,csa:"NO",rt:"NO"},{longitud:4,csa:"NO",rt:"NO"},
    {longitud:4,csa:"NO",rt:"NO"},{longitud:2,csa:"SI",rt:"SI"},
    {longitud:2,csa:"SI",rt:"NO"},{longitud:4,csa:"NO",rt:"NO"},
    {longitud:4,csa:"NO",rt:"NO"},{longitud:4,csa:"NO",rt:"NO"},
    {longitud:4,csa:"NO",rt:"NO"},{longitud:4,csa:"NO",rt:"NO"},
    {longitud:2,csa:"SI",rt:"NO"},{longitud:2,csa:"SI",rt:"SI"},
  ]);

  useEffect(() => {
    fetch("./db_macrotuneles.json")
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => setDb(data))
      .catch(err => setDbError(err.message));
  }, []);

  const handleNVanosChange = (val) => {
    const n = Math.max(1, parseInt(val)||1);
    setNVanos(n);
    setVanos(prev => {
      const next = [...prev];
      while (next.length < n) next.push({longitud:4,csa:"NO",rt:"NO"});
      return next.slice(0, n);
    });
  };

  const updateVano = (i, field, val) => {
    setVanos(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: val };
      if (field === "longitud" && parseInt(val) === 4) { next[i].csa = "NO"; next[i].rt = "NO"; }
      return next;
    });
  };

  const resultado = useMemo(() => {
    if (step !== "results" || !db) return null;
    return calcular({numTuneles, anchura, altura, film:filmSi}, vanos, db);
  }, [step, numTuneles, anchura, altura, filmSi, vanos, db]);

  const bomGlobal = useMemo(() => {
    if (!resultado) return [];
    const map = {};
    for (const kit of resultado.kits) {
      for (const p of kit.piezas) {
        const total = p.cantPorKit * kit.cantidad;
        if (!map[p.CODIGO]) map[p.CODIGO] = {CODIGO:p.CODIGO, DESCRIPCION:p.DESCRIPCION, cantidad:0};
        map[p.CODIGO].cantidad = Math.ceil(map[p.CODIGO].cantidad + total);
      }
    }
    return Object.values(map).sort((a,b) => a.CODIGO.localeCompare(b.CODIGO));
  }, [resultado]);

  const longTotal = vanos.reduce((s,v) => s+v.longitud, 0);
  const toggleKit = (id) => setOpenKits(p => ({...p, [id]:!p[id]}));
  const fmtNum    = (n) => typeof n === "number" ? (Number.isInteger(n) ? n.toString() : parseFloat(n.toFixed(2)).toString()) : n;

  const C = {
    app:     {minHeight:"100vh",background:"#0f172a",color:"#e2e8f0",fontFamily:"'Courier New',monospace",fontSize:13},
    header:  {background:"linear-gradient(135deg,#1e3a5f,#0f2744)",borderBottom:"2px solid #22d3ee",padding:"18px 28px",display:"flex",alignItems:"center",gap:16},
    logo:    {width:42,height:42,background:"#22d3ee",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,color:"#0f172a",flexShrink:0},
    main:    {display:"flex",minHeight:"calc(100vh - 78px)"},
    sidebar: {width:272,background:"#1e293b",borderRight:"1px solid #334155",padding:"20px 18px",flexShrink:0,overflowY:"auto"},
    content: {flex:1,padding:24,overflowX:"auto"},
    label:   {display:"block",fontSize:10,color:"#94a3b8",marginBottom:3,textTransform:"uppercase",letterSpacing:0.8},
    input:   {width:"100%",padding:"7px 9px",background:"#0f172a",border:"1px solid #334155",borderRadius:4,color:"#e2e8f0",fontSize:13,fontFamily:"inherit",boxSizing:"border-box"},
    select:  {width:"100%",padding:"7px 9px",background:"#0f172a",border:"1px solid #334155",borderRadius:4,color:"#e2e8f0",fontSize:13,fontFamily:"inherit",cursor:"pointer",boxSizing:"border-box"},
    fg:      {marginBottom:13},
    btn:     {padding:"10px 20px",borderRadius:5,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700},
    btnP:    {background:"#22d3ee",color:"#0f172a"},
    btnS:    {background:"#334155",color:"#e2e8f0"},
    table:   {width:"100%",borderCollapse:"collapse",fontSize:12},
    th:      {background:"#1e293b",padding:"8px 10px",textAlign:"left",color:"#22d3ee",fontWeight:700,borderBottom:"2px solid #334155",whiteSpace:"nowrap"},
    td:      {padding:"6px 10px",borderBottom:"1px solid #1e293b22",verticalAlign:"middle"},
    secTitle:{fontSize:11,color:"#22d3ee",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10,borderBottom:"1px solid #334155",paddingBottom:5},
    tabBtn:  (a) => ({padding:"7px 18px",border:"none",borderRadius:4,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,background:a?"#22d3ee":"#1e293b",color:a?"#0f172a":"#94a3b8"}),
    kitCard: (c) => ({background:"#1e293b",border:`1px solid ${c}33`,borderLeft:`4px solid ${c}`,borderRadius:6,marginBottom:14,overflow:"hidden"}),
    kitHdr:  (c) => ({padding:"11px 16px",background:`${c}0e`,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",userSelect:"none"}),
    badge:   (c) => ({background:c,color:"#0f172a",borderRadius:99,padding:"2px 11px",fontSize:12,fontWeight:900,minWidth:36,textAlign:"center"}),
    nfound:  {color:"#f87171",fontWeight:700},
    dimText: {color:"#475569",fontSize:11},
  };

  return (
    <div style={C.app}>
      <div style={C.header}>
        <div style={C.logo}>🏗</div>
        <div style={{flex:1}}>
          <div style={{fontSize:18,fontWeight:700,color:"#22d3ee",letterSpacing:1}}>CONFIGURADOR MACROTÚNELES</div>
          <div style={{fontSize:10,color:"#64748b"}}>
            Sistema de cálculo de kits y listado de piezas · v3
            {db && <span style={{color:"#22d3ee",marginLeft:8}}>✓ BD cargada ({Object.keys(db).length} tablas)</span>}
            {dbError && <span style={{color:"#f87171",marginLeft:8}}>⚠ Error BD</span>}
          </div>
        </div>
        {step === "results" && <button style={{...C.btn,...C.btnS}} onClick={() => setStep("form")}>← Volver</button>}
      </div>

      <div style={C.main}>
        <div style={C.sidebar}>
          <div style={{...C.secTitle,marginTop:0}}>Datos de Entrada</div>
          {[
            ["Número de Túneles",  numTuneles, v => setNumTuneles(Math.max(1,parseInt(v)||1)), {min:1}],
            ["Anchura Túneles (m)",anchura,    v => setAnchura(parseFloat(v)||1),              {min:1,step:0.5}],
            ["Nº Vanos",           nVanos,     handleNVanosChange,                             {min:1,max:50}],
            ["Altura Túnel (m)",   altura,     v => setAltura(parseFloat(v)||1),               {min:1,step:0.1}],
          ].map(([lbl,val,fn,extra]) => (
            <div style={C.fg} key={lbl}>
              <label style={C.label}>{lbl}</label>
              <input style={C.input} type="number" value={val} onChange={e => fn(e.target.value)} {...extra} />
            </div>
          ))}
          <div style={C.fg}>
            <label style={C.label}>Film</label>
            <select style={C.select} value={filmSi} onChange={e => setFilmSi(e.target.value)}>
              <option value="SI">SÍ</option>
              <option value="NO">NO</option>
            </select>
          </div>
          <div style={{padding:"9px 12px",background:"#0f172a",borderRadius:4,border:"1px solid #334155",marginBottom:16}}>
            <div style={{fontSize:10,color:"#64748b"}}>Longitud total túnel</div>
            <div style={{fontSize:20,fontWeight:900,color:"#22d3ee"}}>{longTotal} m</div>
          </div>
          <button
            style={{...C.btn,...C.btnP,width:"100%",fontSize:14,padding:"12px",opacity:db?1:0.4,cursor:db?"pointer":"not-allowed"}}
            disabled={!db}
            onClick={() => {setStep("results");setOpenKits({});setViewMode("kits");}}>
            {db ? "▶ CALCULAR" : "⏳ Cargando BD…"}
          </button>
          {step === "results" && resultado && (
            <div style={{marginTop:20}}>
              <div style={C.secTitle}>Resumen Kits</div>
              {resultado.kits.map(k => (
                <div key={k.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,fontSize:11}}>
                  <span style={{color:"#94a3b8"}}>{k.nombre.replace("Kit ","")}</span>
                  <span style={{color:k.color,fontWeight:900,fontSize:13}}>{k.cantidad}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={C.content}>
          {dbError && (
            <div style={{padding:"12px 16px",borderRadius:5,marginBottom:14,fontSize:12,background:"#450a0a",border:"1px solid #dc2626",color:"#fca5a5"}}>
              ⚠ No se pudo cargar <strong>db_macrotuneles.json</strong>: {dbError}<br/>
              Asegúrate de que el archivo está en la misma carpeta que el index.html y estás sirviendo la web con un servidor (no abriendo el HTML directamente).
            </div>
          )}

          {step === "form" ? (
            <>
              <div style={C.secTitle}>Tabla de Vanos — {nVanos} vano{nVanos!==1?"s":""} · {longTotal} m total</div>
              <div style={{overflowX:"auto"}}>
                <table style={C.table}>
                  <thead>
                    <tr>
                      <th style={C.th}>Vano</th>
                      <th style={C.th}>Longitud</th>
                      <th style={C.th}>Cruz de San Andrés</th>
                      <th style={C.th}>Riostra Techo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vanos.map((v,i) => (
                      <tr key={i} style={{background:i%2===0?"#ffffff05":"transparent"}}>
                        <td style={{...C.td,color:"#64748b",fontWeight:700,whiteSpace:"nowrap"}}>VANO {i+1}</td>
                        <td style={C.td}>
                          <select style={{...C.select,width:76}} value={v.longitud} onChange={e => updateVano(i,"longitud",parseInt(e.target.value))}>
                            <option value={2}>2 m</option>
                            <option value={4}>4 m</option>
                          </select>
                        </td>
                        <td style={C.td}>
                          {v.longitud===2
                            ? <select style={{...C.select,width:68}} value={v.csa} onChange={e => updateVano(i,"csa",e.target.value)}><option value="SI">SÍ</option><option value="NO">NO</option></select>
                            : <span style={C.dimText}>— solo 2 m</span>}
                        </td>
                        <td style={C.td}>
                          {v.longitud===2
                            ? <select style={{...C.select,width:68}} value={v.rt} onChange={e => updateVano(i,"rt",e.target.value)}><option value="SI">SÍ</option><option value="NO">NO</option></select>
                            : <span style={C.dimText}>— solo 2 m</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{marginTop:16,padding:"11px 16px",background:"#1e293b",borderRadius:6,border:"1px solid #334155",display:"flex",gap:24,flexWrap:"wrap"}}>
                {[["Vanos 2m",vanos.filter(v=>v.longitud===2).length],["Vanos 4m",vanos.filter(v=>v.longitud===4).length],["Cruz S.A.",vanos.filter(v=>v.csa==="SI").length],["Riostra T.",vanos.filter(v=>v.rt==="SI").length]].map(([lbl,val]) => (
                  <div key={lbl}><span style={{color:"#22d3ee",fontWeight:900,fontSize:16}}>{val}</span><span style={{color:"#64748b",marginLeft:6,fontSize:11}}>{lbl}</span></div>
                ))}
              </div>
            </>
          ) : resultado ? (
            <>
              <div style={{display:"flex",gap:8,marginBottom:18}}>
                <button style={C.tabBtn(viewMode==="kits")}   onClick={() => setViewMode("kits")}>Vista por Kits</button>
                <button style={C.tabBtn(viewMode==="global")} onClick={() => setViewMode("global")}>Listado Global</button>
              </div>

              {viewMode==="kits" ? (
                <>
                  {resultado.kits.map(kit => (
                    <div key={kit.id} style={C.kitCard(kit.color)}>
                      <div style={C.kitHdr(kit.color)} onClick={() => toggleKit(kit.id)}>
                        <div style={{display:"flex",alignItems:"center",gap:12}}>
                          <span style={C.badge(kit.color)}>{kit.cantidad}</span>
                          <span style={{fontWeight:700,fontSize:13}}>{kit.nombre}</span>
                        </div>
                        <span style={{color:"#475569",fontSize:16}}>{openKits[kit.id]?"▲":"▼"}</span>
                      </div>
                      {openKits[kit.id] && (
                        <div style={{overflowX:"auto"}}>
                          <table style={C.table}>
                            <thead>
                              <tr>
                                <th style={C.th}>Pieza</th>
                                <th style={C.th}>Código</th>
                                <th style={C.th}>Descripción</th>
                                <th style={{...C.th,textAlign:"right"}}>Ud/Kit</th>
                                <th style={{...C.th,textAlign:"right"}}>Total</th>
                                <th style={C.th}>Atributos búsqueda</th>
                              </tr>
                            </thead>
                            <tbody>
                              {kit.piezas.map((p,pi) => {
                                const nf = p.CODIGO==="NO ENCONTRADO"||p.CODIGO==="SIN BD";
                                const total = p.cantPorKit*kit.cantidad;
                                return (
                                  <tr key={pi} style={{background:pi%2===0?"#ffffff04":"transparent"}}>
                                    <td style={{...C.td,fontWeight:700,color:"#cbd5e1"}}>{p.nombre}</td>
                                    <td style={{...C.td,...(nf?C.nfound:{color:"#22d3ee",fontFamily:"monospace"})}}>{p.CODIGO}</td>
                                    <td style={{...C.td,color:"#94a3b8",maxWidth:260}}>{p.DESCRIPCION}</td>
                                    <td style={{...C.td,textAlign:"right",fontWeight:700}}>{fmtNum(p.cantPorKit)}</td>
                                    <td style={{...C.td,textAlign:"right",fontWeight:900,color:kit.color}}>{fmtNum(total)}</td>
                                    <td style={{...C.td,color:"#475569",fontSize:11}}>{p.atributos}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                  <div style={{marginTop:8,padding:"12px 16px",background:"#1e293b",borderRadius:6,border:"1px solid #334155"}}>
                    <div style={C.secTitle}>Parámetros Calculados</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:8}}>
                      {[
                        ["Longitud total túnel",    `${resultado.longTunel} m`],
                        ["Longitud estaca cuernos", `${resultado.longEstacaCuernos} mm`],
                        ["Longitud arco",           `${resultado.longArco} mm`],
                        ["Longitud barra CSA",      `${resultado.longBarraCSA} mm`],
                        ["Trenza ref. lateral",     `${resultado.longTrenzaRL.toFixed(1)} m`],
                        ["Cuerda por kit film",     `${resultado.cantCuerda} m`],
                        ["Film por kit",            `${resultado.cantFilmMetros} m`],
                        ["Ancho film",              `${resultado.anchoFilmMM} mm`],
                      ].map(([lbl,val]) => (
                        <div key={lbl} style={{padding:"6px 10px",background:"#0f172a",borderRadius:4}}>
                          <div style={{fontSize:10,color:"#64748b",textTransform:"uppercase"}}>{lbl}</div>
                          <div style={{fontSize:13,fontWeight:700,color:"#22d3ee"}}>{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={C.secTitle}>Listado Global de Piezas — {bomGlobal.length} referencias</div>
                  <table style={C.table}>
                    <thead>
                      <tr>
                        <th style={C.th}>Código</th>
                        <th style={C.th}>Descripción</th>
                        <th style={{...C.th,textAlign:"right"}}>Cantidad Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bomGlobal.map((p,i) => {
                        const nf = p.CODIGO==="NO ENCONTRADO"||p.CODIGO==="SIN BD";
                        return (
                          <tr key={i} style={{background:i%2===0?"#1e293b44":"transparent"}}>
                            <td style={{...C.td,...(nf?C.nfound:{color:"#22d3ee",fontFamily:"monospace",fontWeight:700})}}>{p.CODIGO}</td>
                            <td style={{...C.td,color:"#cbd5e1"}}>{p.DESCRIPCION}</td>
                            <td style={{...C.td,textAlign:"right",fontWeight:900,fontSize:14,color:"#22d3ee"}}>{fmtNum(p.cantidad)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

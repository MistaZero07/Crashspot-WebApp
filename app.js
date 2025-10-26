/* Crashspot – layers fixed + drive mode working + insights + addresses */

/* ===== CONFIG ===== */
const DATA_PATHS = {
  crashes: ['fars_monroe_2021_2022_2023_clean.geojson'],
  clusters: ['fars_monroe_clusters.geojson'],
  roads: ['road_segments_risk.geojson'],
  risk: ['predicted_crash_risk.geojson'] // used for predicted hotspots (points or polygons)
};
const MAP_CENTER = [32.5093, -92.1193];
const COLORS = { blue:'#1FB8CD', yellow:'#FBBF24', orange:'#F59E0B', red:'#DC2626', purple:'#7c3aed' };

/* ===== STATE ===== */
const app = {
  map:null,
  layers:{ points:null, heat:null, clusters:null, roads:null, riskSpots:null },
  data:{ crashes:[], clusters:[], roads:[], risk:[] },
  filters:{ year:'', month:'', hMin:0, hMax:23, weekend:false, night:false, fatal:false },
  filtered:[],
  drive:{ enabled:false, watchId:null, me:null, riskSpotsCache:[], warned:new Set() },
  addrCache: loadCache()
};

/* ===== Helpers ===== */
const isWeekend = d => [0,6].includes(d.getDay());
const clamp = (x,a,b)=>Math.max(a,Math.min(b,x));
function prop(o, keys, fb=null){ for(const k of keys){ if(o && o[k]!=null) return o[k]; } return fb; }
function toast(msg,type='info'){ const c=document.getElementById('toastContainer'); if(!c) return; const el=document.createElement('div'); el.className=`toast toast--${type}`; el.textContent=msg; c.appendChild(el); setTimeout(()=>el.remove(),3600); }
function sevColor(s){ if(s==='Fatal')return COLORS.red; if(s==='Serious Injury')return COLORS.orange; if(s==='Minor Injury')return COLORS.yellow; return COLORS.blue; }
function parseHour(p){ const hRaw=prop(p,['HOUR','CRASH_HOUR','hour']); if(hRaw!=null&&hRaw!=='') return +String(hRaw).match(/\d+/)?.[0]; const t=prop(p,['TIME','CRASH_TIME','time']); if(!t) return null; const m=String(t).match(/(\d{1,2})/); return m?clamp(+m[1],0,23):null; }
function severityFrom(p){ const fat=+prop(p,['FATALS','fatalities','DEATHS','FATAL_COUNT'],0)||0; if(fat>0) return 'Fatal'; const max=prop(p,['MAX_SEV','MAX_SEVERITY','INJ_SEV','SEV','SEVERITY']); if(max!=null){ const v=String(max).toLowerCase(); if(/fatal|1/.test(v))return'Fatal'; if(/(serious|severe|2)/.test(v))return'Serious Injury'; if(/(minor|possible|3|4)/.test(v))return'Minor Injury'; } const inj=+prop(p,['INJURIES','PERSONS_INJURED','INJ_TOTAL','INJURIES_TOTAL'],0)||0; return inj>0?'Minor Injury':'Property Damage Only'; }
function toRecord(f){ const p=f.properties||{}, g=f.geometry; if(!g||g.type!=='Point') return null; const [lng,lat]=g.coordinates;
  const year=+prop(p,['YEAR','CRASH_YEAR','year']); const month=+prop(p,['MONTH','CRASH_MONTH','month']); const hour=parseHour(p);
  const dStr=prop(p,['DATE','CRASH_DATE','date']); const tStr=prop(p,['TIME','CRASH_TIME','time']); const when=dStr?new Date(dStr):null;
  const city=prop(p,['CITY','CITY_NAME','TOWN','MUNICIPALITY']); const street=prop(p,['ST_NAME','STREET','INTDESC','LOCATION','INTERSECT']);
  const addressGuess=[street,city,'Monroe, LA'].filter(Boolean).join(', ');
  return { id:prop(p,['ID','ST_CASE','id'],(window.__CID=(window.__CID||0)+1)), lat,lng,year,month,hour,
    weekday:when?when.toLocaleDateString(undefined,{weekday:'long'}):'—',
    is_weekend:when?isWeekend(when):false, is_night:hour!=null?(hour>=18||hour<=6):false,
    location:prop(p,['LOCATION','INTDESC','ST_NAME','INTERSECT','LOC_DESC'],addressGuess||'—'),
    injury_count:+prop(p,['INJURIES','PERSONS_INJURED','INJ_TOTAL','INJURIES_TOTAL'],0)||0,
    vehicle_count:+prop(p,['VE_TOTAL','VEH_COUNT','VEHICLES'],1)||1,
    severity:severityFrom(p), weather:String(prop(p,['WEATHER','WEATHER1','WEATHER_DESC'],'Unknown')),
    road_condition:String(prop(p,['SUR_COND','ROADCOND','ROAD_CONDITION'],'Unknown')),
    raw:p, dateStr:dStr, timeStr:tStr, addressGuess };
}

/* ===== Address cache ===== */
function loadCache(){ try{ return JSON.parse(localStorage.getItem('addr_cache')||'{}'); }catch{ return {}; } }
function saveCache(){ try{ const entries=Object.entries(app.addrCache); const MAX=500; const trimmed=entries.length>MAX?Object.fromEntries(entries.slice(entries.length-MAX)):app.addrCache; localStorage.setItem('addr_cache',JSON.stringify(trimmed)); }catch{} }
function keyFor(lat,lng){ return `${lat?.toFixed(5)},${lng?.toFixed(5)}`; }
async function reverseGeocode(lat,lng, fallback){ const k=keyFor(lat,lng); if(app.addrCache[k]) return app.addrCache[k];
  try{ const r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,{headers:{'Accept-Language':'en'}}); const j=await r.json(); const addr=j.display_name||fallback||'Address unavailable'; app.addrCache[k]=addr; saveCache(); return addr; } catch { const addr=fallback||'Address unavailable'; app.addrCache[k]=addr; saveCache(); return addr; } }

/* ===== Data load ===== */
async function getJSON(u){ const r=await fetch(u); if(!r.ok) throw new Error(`${u} ${r.status}`); return r.json(); }
async function loadAll(){
  const gj=await getJSON(DATA_PATHS.crashes[0]);
  app.data.crashes=(gj.features||[]).map(toRecord).filter(Boolean);
  try{ app.data.clusters=(await getJSON(DATA_PATHS.clusters[0])).features||[]; }catch{}
  try{ app.data.roads=(await getJSON(DATA_PATHS.roads[0])).features||[]; }catch{}
  try{ app.data.risk=(await getJSON(DATA_PATHS.risk[0])).features||[]; }catch{}
}

/* ===== Map & layers ===== */
function initMap(){
  app.map=L.map('map',{center:MAP_CENTER,zoom:12,minZoom:10,maxZoom:18});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap'}).addTo(app.map);
  L.control.scale({position:'bottomleft'}).addTo(app.map);
  app.layers.points=L.layerGroup().addTo(app.map);
  app.layers.heat=L.layerGroup();
  app.layers.clusters=L.layerGroup();
  app.layers.roads=L.layerGroup();
  app.layers.riskSpots=L.layerGroup().addTo(app.map); // predicted hotspots visible by default
}

function drawPoints(rows){
  app.layers.points.clearLayers();
  rows.forEach(r=>{
    if(r.lat==null||r.lng==null) return;
    const m=L.circleMarker([r.lat,r.lng],{radius:Math.max(5,(r.vehicle_count||1)*2),color:'#fff',weight:1.1,fillOpacity:.9,fillColor:sevColor(r.severity)})
      .bindPopup(`<div style="font-size:12px;line-height:1.35">
        <strong>${r.location}</strong><br/>${r.dateStr??''} ${r.timeStr??''} | ${r.weekday}<br/>
        Y/M/H: ${r.year??'—'}/${r.month??'—'}/${r.hour??'—'}<br/>
        Sev: ${r.severity} | Veh: ${r.vehicle_count} | Inj: ${r.injury_count}</div>`);
    app.layers.points.addLayer(m);
  });
}

function drawHeat(rows){
  app.layers.heat.clearLayers(); if(!rows.length) return;
  const grid=new Map(), SZ=0.005; // ~500m
  for(const r of rows){ if(r.lat==null||r.lng==null) continue; const gy=Math.floor(r.lat/SZ)*SZ, gx=Math.floor(r.lng/SZ)*SZ; const k=`${gy},${gx}`; grid.set(k,(grid.get(k)||0)+1); }
  const max=Math.max(...grid.values());
  grid.forEach((cnt,key)=>{ const [gy,gx]=key.split(',').map(Number); const t=cnt/max;
    const fill=t<.25?`rgba(31,184,205,${0.25+t*0.4})`:t<.5?`rgba(52,211,153,${0.3+t*0.4})`:t<.75?`rgba(251,191,36,${0.35+t*0.4})`:`rgba(239,68,68,${0.4+t*0.4})`;
    L.circle([gy+SZ/2,gx+SZ/2],{radius:150+200*t,color:'transparent',fillColor:fill,fillOpacity:1})
      .bindPopup(`<strong>Crash density</strong><br/>Count: ${cnt}`).addTo(app.layers.heat);
  });
}

function drawClusters(features){
  app.layers.clusters.clearLayers();
  (features||[]).forEach(f=>{
    if(f.geometry?.type!=='Point') return;
    const [lng,lat]=f.geometry.coordinates;
    const r=+prop(f.properties,['radius','radius_m','RADIUS'],150)||150;
    const cnt=+prop(f.properties,['count','COUNT','crash_count'],0)||0;
    L.circle([lat,lng],{radius:r,color:COLORS.blue,fillColor:COLORS.blue,fillOpacity:.15,weight:2})
      .bindPopup(`<strong>Cluster</strong><br/>Crashes: ${cnt}<br/>Radius: ${r} m`).addTo(app.layers.clusters);
  });
}

function drawRoads(features){
  app.layers.roads.clearLayers();
  (features||[]).forEach(f=>{
    if(!/(LineString|MultiLineString)/.test(f.geometry?.type||'')) return;
    const risk=+prop(f.properties,['risk','RISK','score','risk_score'],0);
    const t=clamp(risk,0,1); const r=Math.round(255*t), g=Math.round(120*(1-t)); const color=`rgba(${r},${g},0,0.9)`;
    const coords=f.geometry.type==='LineString'?[f.geometry.coordinates]:f.geometry.coordinates;
    const lines=coords.map(seg=>seg.map(([lng,lat])=>[lat,lng]));
    L.polyline(lines,{color,weight:Math.max(3,1+6*t)})
      .bindPopup(`<strong>Road segment</strong><br/>Risk: ${risk.toFixed?risk.toFixed(2):risk}`).addTo(app.layers.roads);
  });
}

/* Predicted hotspots (points or polygon centroids) */
function centroidRing(r){ let A=0,cx=0,cy=0; for(let i=0,j=r.length-1;i<r.length;j=i++){ const [x1,y1]=r[j],[x2,y2]=r[i]; const f=x1*y2-x2*y1; A+=f; cx+=(x1+x2)*f; cy+=(y1+y2)*f; } A*=0.5; return A===0?r[0]:[cx/(6*A),cy/(6*A)]; }
function computeHotspots(features){
  const out=[]; (features||[]).forEach(f=>{
    const g=f.geometry; if(!g) return; const score=+prop(f.properties,['risk','score','density','RISK'],0)||0;
    if(g.type==='Point'){ const [lng,lat]=g.coordinates; out.push({lat,lng,score}); }
    else if(g.type==='Polygon'){ const [lng,lat]=centroidRing(g.coordinates[0]); out.push({lat,lng,score}); }
    else if(g.type==='MultiPolygon'){ g.coordinates.forEach(poly=>{ const [lng,lat]=centroidRing(poly[0]); out.push({lat,lng,score}); }); }
  }); out.sort((a,b)=>b.score-a.score); return out;
}
function drawRiskSpots(features, topN=25){
  app.layers.riskSpots.clearLayers();
  const all=computeHotspots(features); app.drive.riskSpotsCache=all; // ⚠ feed drive mode cache
  all.slice(0,topN).forEach(p=>{
    L.circleMarker([p.lat,p.lng],{radius:7,color:'#fff',weight:1.4,fillOpacity:.95,fillColor:COLORS.purple})
      .bindPopup(`<strong>Predicted hotspot</strong><br/>Risk score: ${p.score.toFixed?p.score.toFixed(3):p.score}`)
      .addTo(app.layers.riskSpots);
  });
}

/* ===== Filters + Insights ===== */
function applyFilters(){
  const f=app.filters;
  const out=app.data.crashes.filter(r=>{
    if(f.year && String(r.year)!==String(f.year)) return false;
    if(f.month&& String(r.month)!==String(f.month)) return false;
    if(r.hour!=null && (r.hour<f.hMin || r.hour>f.hMax)) return false;
    if(f.weekend && !r.is_weekend) return false;
    if(f.night && !r.is_night) return false;
    if(f.fatal && r.severity!=='Fatal') return false;
    return true;
  });
  app.filtered=out;
  drawPoints(out);
  if(app.map.hasLayer(app.layers.heat)) drawHeat(out);
  updateInsights();
}

function groupTopCrashPoints(rows, topN=5){
  const map=new Map();
  for(const r of rows){
    if(r.lat==null||r.lng==null) continue;
    const k=`${r.lat.toFixed(4)},${r.lng.toFixed(4)}`;
    const e=map.get(k)||{lat:0,lng:0,count:0,sample:r};
    e.lat=(e.lat*e.count + r.lat)/(e.count+1);
    e.lng=(e.lng*e.count + r.lng)/(e.count+1);
    e.count++; e.sample=r; map.set(k,e);
  }
  return Array.from(map.values()).sort((a,b)=>b.count-a.count).slice(0,topN);
}

async function updateInsights(){
  const d=app.filtered;
  const notice=document.getElementById('insightNotice');

  if(!app.data.crashes.length){ notice.style.display='block'; notice.textContent='No crash data loaded.'; }
  else notice.style.display='none';

  const total=d.length, fatal=d.filter(x=>x.severity==='Fatal').length, inj=d.reduce((s,x)=>s+(x.injury_count||0),0);
  const hrs=new Array(24).fill(0); d.forEach(x=>{ if(x.hour!=null) hrs[x.hour]++; }); const m=Math.max(...hrs); const peak=m>0?hrs.indexOf(m):null;

  document.getElementById('kpiTotal').textContent=total;
  document.getElementById('kpiFatal').textContent=fatal;
  document.getElementById('kpiInj').textContent=inj;
  document.getElementById('kpiPeak').textContent=peak==null?'N/A':`${peak}:00`;

  const list=document.getElementById('crashList'); list.innerHTML='';
  if(!d.length){ list.innerHTML='<div class="crash-item"><div class="crash-text">No crashes match current filters.</div></div>'; return; }

  const tops=groupTopCrashPoints(d,5);
  for(const spot of tops){
    const item=document.createElement('div'); item.className='crash-item';
    const dot=document.createElement('div'); dot.className='crash-dot'; dot.style.background=COLORS.red;
    const txt=document.createElement('div'); txt.className='crash-text';
    const title=document.createElement('div'); title.className='crash-title'; title.textContent=spot.sample.addressGuess || 'Resolving address…';
    const sub=document.createElement('div'); sub.className='crash-sub'; sub.textContent=`Crashes: ${spot.count} • ${spot.lat.toFixed(5)}, ${spot.lng.toFixed(5)}`;
    txt.appendChild(title); txt.appendChild(sub); item.appendChild(dot); item.appendChild(txt);
    item.onclick=()=>app.map.setView([spot.lat,spot.lng],16);
    list.appendChild(item);
    (async ()=>{ title.textContent = await reverseGeocode(spot.lat, spot.lng, spot.sample.addressGuess); })();
  }
}

/* ===== UI ===== */
function setupUI(){
  const $=id=>document.getElementById(id);
  // filters
  $('yearFilter').addEventListener('change',e=>{ app.filters.year=e.target.value; applyFilters(); });
  $('monthFilter').addEventListener('change',e=>{ app.filters.month=e.target.value; applyFilters(); });
  const a=$('hourRangeMin'), b=$('hourRangeMax'), lbl=$('hourRangeLabel');
  function upd(){ let x=+a.value,y=+b.value; if(x>y)[x,y]=[y,x]; app.filters.hMin=x; app.filters.hMax=y; lbl.textContent=`${x}–${y}`; applyFilters(); }
  a.addEventListener('input',upd); b.addEventListener('input',upd);
  $('weekendFilter').addEventListener('change',e=>{ app.filters.weekend=e.target.checked; applyFilters(); });
  $('nighttimeFilter').addEventListener('change',e=>{ app.filters.night=e.target.checked; applyFilters(); });
  $('fatalOnly').addEventListener('change',e=>{ app.filters.fatal=e.target.checked; applyFilters(); });
  $('clearFilters').addEventListener('click',()=>{ app.filters={ year:'',month:'',hMin:0,hMax:23,weekend:false,night:false,fatal:false };
    $('yearFilter').value=''; $('monthFilter').value=''; a.value=0; b.value=23; lbl.textContent='0–23';
    $('weekendFilter').checked=false; $('nighttimeFilter').checked=false; $('fatalOnly').checked=false; applyFilters(); });

  // layer toggles
  $('crashPointsLayer').addEventListener('change',e=>{ e.target.checked?app.layers.points.addTo(app.map):app.map.removeLayer(app.layers.points); });
  $('heatmapLayer').addEventListener('change',e=>{ 
    if(e.target.checked){ app.layers.heat.addTo(app.map); drawHeat(app.filtered); }
    else app.map.removeLayer(app.layers.heat);
  });
  $('clustersLayer').addEventListener('change',e=>{ 
    if(e.target.checked){ app.layers.clusters.addTo(app.map); drawClusters(app.data.clusters); }
    else app.map.removeLayer(app.layers.clusters);
  });
  $('roadSegmentsLayer').addEventListener('change',e=>{
    if(e.target.checked){ app.layers.roads.addTo(app.map); drawRoads(app.data.roads); }
    else app.map.removeLayer(app.layers.roads);
  });
  $('riskSpotLayer').addEventListener('change',e=>{
    if(e.target.checked){ app.layers.riskSpots.addTo(app.map); drawRiskSpots(app.data.risk,25); }
    else app.map.removeLayer(app.layers.riskSpots);
  });

  // drive mode
  $('driveMode').addEventListener('change',e=>{ e.target.checked?startDrive():stopDrive(); });
}

/* ===== Drive Mode ===== */
function updateDriveStatus(s){ const el=document.getElementById('driveStatus'); if(el) el.textContent=s||''; }
function hav(lat1,lon1,lat2,lon2){ const R=6371000; const dLat=(lat2-lat1)*Math.PI/180, dLon=(lon2-lon1)*Math.PI/180; const a=Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2; return 2*R*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)); }
function startDrive(){
  if(!navigator.geolocation){ toast('Geolocation not supported.','error'); return; }
  if(app.drive.enabled) return; app.drive.enabled=true; app.drive.warned.clear();
  if(!app.drive.me){ app.drive.me=L.circleMarker(MAP_CENTER,{radius:6,color:'#00e5ff',weight:2,fillOpacity:.8,fillColor:'#00e5ff'}).bindPopup('You are here'); }
  app.drive.me.addTo(app.map); updateDriveStatus('Drive mode: locating…');
  app.drive.watchId=navigator.geolocation.watchPosition(onGeoUpdate,err=>{
    toast('Location error: '+err.message,'error'); updateDriveStatus('Drive mode: location error');
  },{enableHighAccuracy:true,maximumAge:2000,timeout:10000});
}
function stopDrive(){ app.drive.enabled=false; if(app.drive.watchId!=null){ navigator.geolocation.clearWatch(app.drive.watchId); app.drive.watchId=null; } if(app.drive.me){ app.map.removeLayer(app.drive.me); } updateDriveStatus('Drive mode: off'); }
function onGeoUpdate(pos){
  const lat=pos.coords.latitude, lng=pos.coords.longitude;
  app.drive.me.setLatLng([lat,lng]);
  if(app.map.getZoom()<14) app.map.setView([lat,lng],14);
  // Alert near hotspot
  const near=app.drive.riskSpotsCache.find(s=>hav(lat,lng,s.lat,s.lng)<=120);
  if(near){ const id=`${near.lat.toFixed(5)},${near.lng.toFixed(5)}`; if(!app.drive.warned.has(id)){ app.drive.warned.add(id); toast(`⚠️ Near predicted hotspot (~${Math.round(hav(lat,lng,near.lat,near.lng))} m)`,'error'); updateDriveStatus('Near predicted hotspot'); } }
}

/* ===== Boot ===== */
(async function(){
  initMap(); setupUI();
  toast('Loading data…');
  await loadAll();
  // initial draws
  app.filtered=app.data.crashes.slice();
  drawPoints(app.filtered);
  drawRiskSpots(app.data.risk,25);        // also fills drive.riskSpotsCache
  updateInsights();
  toast(`Loaded ${app.data.crashes.length} crashes`,'success');
})();

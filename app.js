const canvas = document.querySelector('#diagram');
const ctx = canvas.getContext('2d');
const $ = (s) => document.querySelector(s);

const defaults = {
  zoom: 1, grid: true, sides: 5, golden: true, fib: true, construction: true,
  goldenScale: 100, goldenWidth: 2, goldenColor: '#d79b2c', fibScale: 100,
  spiralLineStyle: 'solid', constructionLineStyle: 'solid', constructionOpacity: .25,
  constructionColor: '#8aa1a1', theme: 'light',
  characters: [
    {id: 1, name: 'Maurice', initials: 'MC', x: 0, y: 0, color: '#e35e58', size: 15},
    {id: 2, name: 'Léonie', initials: 'L', x: 104, y: -76, color: '#4d8883', size: 13},
    {id: 3, name: 'The Stranger', initials: 'TS', x: -154, y: 105, color: '#697b9a', size: 13},
  ],
  circles: [
    {id: 1, name: 'Inner circle', radius: 72, color: '#567d78', width: 1.5, opacity: .8},
    {id: 2, name: 'Trusted circle', radius: 138, color: '#82a09b', width: 1.2, opacity: .55},
    {id: 3, name: 'Outer circle', radius: 205, color: '#9cb0ac', width: 1, opacity: .45},
  ]
};
let state = JSON.parse(localStorage.getItem('spiral-state') || 'null') || structuredClone(defaults);
for (const [key, value] of Object.entries(defaults)) if (state[key] === undefined) state[key] = structuredClone(value);
let selected = null, dragging = null;

function save(){ localStorage.setItem('spiral-state', JSON.stringify(state)); }
function center(){ return {x: canvas.width / devicePixelRatio / 2, y: canvas.height / devicePixelRatio / 2}; }
function resize(){ const r=canvas.getBoundingClientRect(); canvas.width=r.width*devicePixelRatio; canvas.height=r.height*devicePixelRatio; ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); draw(); }
function screen(p){ const c=center(); return {x:c.x+p.x*state.zoom, y:c.y+p.y*state.zoom}; }
function world(p){ const c=center(); return {x:(p.x-c.x)/state.zoom, y:(p.y-c.y)/state.zoom}; }

function draw(){
  const w=canvas.width/devicePixelRatio,h=canvas.height/devicePixelRatio,c=center(); ctx.clearRect(0,0,w,h);
  if(state.grid) drawGrid(w,h,c);
  drawAxes(w,h,c); drawConstruction(c); drawCircles(c); drawSpirals(c); drawCharacters();
}
function drawGrid(w,h,c){
  ctx.save(); ctx.strokeStyle=state.theme==='dark'?'#2a3334':'#e8ece9'; ctx.lineWidth=1;
  const step=28*state.zoom; if(step>9){ctx.beginPath(); for(let x=c.x%step;x<w;x+=step){ctx.moveTo(x,0);ctx.lineTo(x,h)} for(let y=c.y%step;y<h;y+=step){ctx.moveTo(0,y);ctx.lineTo(w,y)}ctx.stroke()} ctx.restore();
}
function drawAxes(w,h,c){
  ctx.save();ctx.strokeStyle=state.theme==='dark'?'#536061':'#aeb7b4';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,c.y);ctx.lineTo(w,c.y);ctx.moveTo(c.x,0);ctx.lineTo(c.x,h);ctx.stroke();
  ctx.fillStyle=state.theme==='dark'?'#929e9c':'#87918f';ctx.font='9px DM Sans';ctx.textAlign='center';const step=56*state.zoom;
  for(let x=c.x+step,n=2;x<w;x+=step,n+=2){tick(x,c.y,n)} for(let x=c.x-step,n=-2;x>0;x-=step,n-=2){tick(x,c.y,n)}
  ctx.textAlign='right';for(let y=c.y-step,n=2;y>0;y-=step,n+=2){ytick(c.x,y,n)}for(let y=c.y+step,n=-2;y<h;y+=step,n-=2){ytick(c.x,y,n)}ctx.fillText('0',c.x-7,c.y+13);ctx.restore();
  function tick(x,y,n){ctx.beginPath();ctx.moveTo(x,y-3);ctx.lineTo(x,y+3);ctx.stroke();ctx.fillText(n,x,y+13)}
  function ytick(x,y,n){ctx.beginPath();ctx.moveTo(x-3,y);ctx.lineTo(x+3,y);ctx.stroke();ctx.fillText(n,x-7,y+3)}
}
function drawCircles(c){state.circles.forEach(o=>{ctx.save();ctx.strokeStyle=o.color;ctx.globalAlpha=o.opacity;ctx.lineWidth=o.width;ctx.setLineDash(o.lineStyle==='dotted'?[3,5]:[]);ctx.beginPath();ctx.arc(c.x,c.y,o.radius*state.zoom,0,Math.PI*2);ctx.stroke();ctx.restore()})}
function drawConstruction(c){
  if(!state.construction||!state.fib)return;const n=state.sides,R=190*state.zoom*state.fibScale/100;ctx.save();ctx.translate(c.x,c.y);ctx.strokeStyle=state.constructionColor;ctx.globalAlpha=state.constructionOpacity;ctx.lineWidth=1;ctx.setLineDash(state.constructionLineStyle==='dotted'?[3,5]:[]);
  for(let layer=1;layer<=4;layer++){let r=R*layer/4;ctx.beginPath();for(let i=0;i<=n;i++){let a=-Math.PI/2+i*Math.PI*2/n;let x=Math.cos(a)*r,y=Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke()}
  for(let i=0;i<n;i++){let a=-Math.PI/2+i*Math.PI*2/n;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*R,Math.sin(a)*R);ctx.stroke()}ctx.restore();
}
function spiralPath(rotation,scale,growth=.17){ctx.beginPath();for(let t=-5.5;t<7.1;t+=.035){let r=scale*Math.exp(growth*t),a=t+rotation,x=Math.cos(a)*r,y=Math.sin(a)*r;t===-5.5?ctx.moveTo(x,y):ctx.lineTo(x,y)}ctx.stroke()}
function drawSpirals(c){ctx.save();ctx.translate(c.x,c.y);ctx.setLineDash(state.spiralLineStyle==='dotted'?[3,5]:[]);if(state.golden){ctx.strokeStyle=state.goldenColor;ctx.globalAlpha=.9;ctx.lineWidth=state.goldenWidth;spiralPath(0,18*state.goldenScale/100,.22)}if(state.fib){ctx.strokeStyle='#d79b2c';ctx.globalAlpha=.82;ctx.lineWidth=1.65;for(let i=0;i<state.sides;i++)spiralPath(i*Math.PI*2/state.sides,11*state.fibScale/100,.24)}ctx.restore()}
function drawCharacters(){state.characters.forEach(p=>{const q=screen(p);ctx.save();ctx.shadowColor='#17202322';ctx.shadowBlur=5;ctx.shadowOffsetY=2;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(q.x,q.y,p.size,0,Math.PI*2);ctx.fill();ctx.shadowColor='transparent';ctx.fillStyle='#fff';ctx.font=`600 ${Math.max(8,p.size*.55)}px DM Sans`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(p.initials,q.x,q.y);ctx.fillStyle=state.theme==='dark'?'#e7ecea':'#28312f';ctx.font='600 10px DM Sans';ctx.fillText(p.name,q.x,q.y+p.size+12);ctx.restore()})}

function renderLists(){
  $('#characterList').innerHTML=state.characters.map(p=>`<div class="item-card ${selected?.type==='character'&&selected.id===p.id?'selected':''}" data-kind="character" data-id="${p.id}"><i class="item-color" style="background:${p.color}">${p.initials}</i><span>${p.name}<small>Character</small></span><button title="Delete">×</button></div>`).join('');
  $('#circleList').innerHTML=state.circles.map((p,i)=>`<div class="item-card ${selected?.type==='circle'&&selected.id===p.id?'selected':''}" data-kind="circle" data-id="${p.id}"><i class="item-color circle-icon" style="border-color:${p.color}"></i><span>${p.name}<small>Radius ${p.radius}</small></span><button title="Delete">×</button></div>`).join('');
  document.querySelectorAll('.item-card').forEach(el=>el.onclick=(e)=>{const type=el.dataset.kind,id=+el.dataset.id;if(e.target.tagName==='BUTTON'){remove(type,id);return}selected={type,id};renderLists();renderInspector()});
}
function renderInspector(){
  if(!selected){$('#inspector').classList.add('is-hidden');$('#rightToggle').classList.add('is-hidden');$('#inspector').innerHTML='';resize();return}
  const arr=selected.type==='character'?state.characters:state.circles,p=arr.find(x=>x.id===selected.id);if(!p){selected=null;return renderInspector()}
  $('#inspector').classList.remove('is-hidden');$('#rightToggle').classList.add('is-hidden');
  const isChar=selected.type==='character';$('#inspector').innerHTML=`<button class="close-inspector" id="closeInspector" aria-label="Close properties">×</button><h2>${p.name}</h2><div class="type">${isChar?'CHARACTER':'INTIMACY CIRCLE'}</div>
    <div class="field"><label>Name</label><input id="editName" type="text" value="${p.name}"></div>
    <div class="field"><label>Color</label><div class="color-row"><input id="editColor" type="color" value="${p.color}"></div></div>
    <div class="field"><label>${isChar?'Point size':'Radius'} <output>${isChar?p.size:p.radius}</output></label><input id="editSize" type="range" min="${isChar?8:30}" max="${isChar?28:320}" value="${isChar?p.size:p.radius}"></div>
    ${isChar?'':`<div class="field"><label>Stroke width <output>${p.width}</output></label><input id="editWidth" type="range" min="0.5" max="6" step="0.5" value="${p.width}"></div><div class="field"><label>Opacity <output>${Math.round(p.opacity*100)}%</output></label><input id="editOpacity" type="range" min="5" max="100" value="${p.opacity*100}"></div><div class="field"><label>Line style</label><select id="editLineStyle"><option value="solid" ${p.lineStyle!=='dotted'?'selected':''}>Normal</option><option value="dotted" ${p.lineStyle==='dotted'?'selected':''}>Dotted</option></select></div>`}
    <button class="delete" id="deleteSelected">Delete ${isChar?'character':'circle'}</button>`;
  $('#editName').oninput=e=>update('name',e.target.value);$('#editColor').oninput=e=>update('color',e.target.value);$('#editSize').oninput=e=>update(isChar?'size':'radius',+e.target.value,true);
  if(!isChar){$('#editWidth').oninput=e=>update('width',+e.target.value,true);$('#editOpacity').oninput=e=>update('opacity',+e.target.value/100,true)}
  if(!isChar) $('#editLineStyle').onchange=e=>update('lineStyle',e.target.value);
  $('#closeInspector').onclick=()=>{$('#inspector').classList.add('is-hidden');$('#rightToggle').classList.remove('is-hidden');resize()};
  $('#deleteSelected').onclick=()=>remove(selected.type,selected.id);
  function update(k,v,rerender=false){p[k]=v;save();draw();if(rerender)renderInspector();renderLists()}
}
function remove(type,id){const key=type==='character'?'characters':'circles';state[key]=state[key].filter(x=>x.id!==id);if(selected?.id===id&&selected?.type===type)selected=null;save();renderLists();renderInspector();draw()}

$('#addCharacter').onclick=()=>{const id=Math.max(0,...state.characters.map(x=>x.id))+1;state.characters.push({id,name:`Character ${id}`,initials:`C${id}`,x:30*id%160-80,y:35*id%140-70,color:['#8a6eb0','#d47754','#4b8992'][id%3],size:13});save();renderLists();draw()};
$('#addCircle').onclick=()=>{const id=Math.max(0,...state.circles.map(x=>x.id))+1;state.circles.push({id,name:`Circle ${id}`,radius:60+state.circles.length*50,color:'#6e9691',width:1.5,opacity:.55});save();renderLists();draw()};
canvas.addEventListener('pointerdown',e=>{const r=canvas.getBoundingClientRect(),point={x:e.clientX-r.left,y:e.clientY-r.top};for(const p of [...state.characters].reverse()){const q=screen(p);if(Math.hypot(point.x-q.x,point.y-q.y)<p.size+8){dragging=p;selected={type:'character',id:p.id};renderLists();renderInspector();canvas.classList.add('dragging');canvas.setPointerCapture(e.pointerId);return}}const c=center(),distance=Math.hypot(point.x-c.x,point.y-c.y),circle=[...state.circles].reverse().find(p=>Math.abs(distance-p.radius*state.zoom)<7);if(circle){selected={type:'circle',id:circle.id};renderLists();renderInspector();return}selected=null;renderLists();renderInspector()});
canvas.addEventListener('pointermove',e=>{if(!dragging)return;const r=canvas.getBoundingClientRect(),p=world({x:e.clientX-r.left,y:e.clientY-r.top});dragging.x=p.x;dragging.y=p.y;draw()});
canvas.addEventListener('pointerup',()=>{if(dragging){dragging=null;canvas.classList.remove('dragging');save()}});
canvas.addEventListener('wheel',e=>{e.preventDefault();state.zoom=Math.max(.5,Math.min(2,state.zoom*(e.deltaY>0?.9:1.1)));syncZoom();draw()},{passive:false});
function syncZoom(){ $('#zoomLabel').textContent=Math.round(state.zoom*100)+'%' }
$('#zoomIn').onclick=()=>{state.zoom=Math.min(2,state.zoom+.1);syncZoom();draw()};$('#zoomOut').onclick=()=>{state.zoom=Math.max(.5,state.zoom-.1);syncZoom();draw()};$('#fitBtn').onclick=()=>{state.zoom=1;syncZoom();draw()};
[['gridOn','grid'],['goldenOn','golden'],['fibOn','fib'],['constructionOn','construction']].forEach(([id,k])=>{const el=$('#'+id);el.checked=state[k];el.onchange=()=>{state[k]=el.checked;save();draw()}});
[['goldenScale','goldenScale',Number],['fibScale','fibScale',Number],['goldenWidth','goldenWidth',Number],['goldenColor','goldenColor',String],['constructionColor','constructionColor',String]].forEach(([id,k,cast])=>{const el=$('#'+id);el.value=state[k];el.oninput=()=>{state[k]=cast(el.value);if(id==='fibScale')$('#fibScaleValue').textContent=el.value+'%';save();draw()}});
$('#fibScaleValue').textContent=state.fibScale+'%';
[['spiralLineStyle','spiralLineStyle'],['constructionLineStyle','constructionLineStyle']].forEach(([id,k])=>{const el=$('#'+id);el.value=state[k];el.onchange=()=>{state[k]=el.value;save();draw()}});
$('#constructionOpacity').value=state.constructionOpacity*100;$('#constructionOpacity').oninput=e=>{state.constructionOpacity=+e.target.value/100;save();draw()};
$('#sides').value=state.sides;$('#sidesValue').textContent=`${state.sides} sides`;$('#sides').oninput=e=>{state.sides=+e.target.value;$('#sidesValue').textContent=`${state.sides} sides`;save();draw()};
$('#resetBtn').onclick=()=>{if(confirm('Reset the diagram to its original state?')){state=structuredClone(defaults);selected=null;save();init()}};
$('#exportBtn').onclick=()=>{draw();const a=document.createElement('a');a.download='spiral-story-diagram.png';a.href=canvas.toDataURL('image/png');a.click()};
document.querySelectorAll('.tab').forEach(tab=>tab.onclick=()=>{document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t===tab));document.querySelectorAll('.tab-panel').forEach(panel=>panel.hidden=panel.querySelector('.section-body').id!==tab.dataset.tab)});
$('#leftToggle').onclick=()=>{$('#sidebar').classList.toggle('is-hidden');document.body.classList.toggle('left-hidden');resize()};
$('#rightToggle').onclick=()=>{$('#inspector').classList.remove('is-hidden');$('#rightToggle').classList.add('is-hidden');resize()};
$('#themeBtn').onclick=()=>{state.theme=state.theme==='dark'?'light':'dark';document.body.classList.toggle('dark',state.theme==='dark');save();draw()};
function init(){document.body.classList.toggle('dark',state.theme==='dark');renderLists();renderInspector();syncZoom();resize()} window.addEventListener('resize',resize);init();

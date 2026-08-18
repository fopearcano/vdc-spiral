const canvas = document.querySelector('#diagram');
const ctx = canvas.getContext('2d');
const $ = (s) => document.querySelector(s);

const defaults = {
  zoom: 1, grid: true, axes: true, axisNumbers: true, sides: 5, charactersVisible: true, chaptersVisible: true,
  scenesVisible: true, circlesVisible: true, golden: true, fib: true, construction: true,
  charactersScale: 100, chaptersScale: 100, scenesScale: 100,
  charactersTextScale: 100, chaptersTextScale: 100, scenesTextScale: 100,
  charactersPaint: 'fill', chaptersPaint: 'fill', scenesPaint: 'fill',
  goldenScale: 100, goldenWidth: 2, goldenOpacity: .9, goldenColor: '#d79b2c',
  fibScale: 100, fibWidth: 2.2, fibOpacity: .95,
  spiralLineStyle: 'solid', constructionLineStyle: 'solid', constructionOpacity: .25,
  constructionColor: '#8aa1a1', theme: 'light',
  characters: [
    {id: 1, name: 'Maurice', initials: 'MC', x: 0, y: 0, color: '#e35e58', size: 15, textSize: 10},
    {id: 2, name: 'Léonie', initials: 'L', x: 104, y: -76, color: '#4d8883', size: 13, textSize: 10},
    {id: 3, name: 'The Stranger', initials: 'TS', x: -154, y: 105, color: '#697b9a', size: 13, textSize: 10},
  ],
  chapters: [
    {id: 1, name: 'Chapter 1', initials: '1', x: -92, y: -112, color: '#537da1', size: 14, textSize: 10},
  ],
  scenes: [
    {id: 1, name: 'Opening scene', initials: '1', x: 142, y: 94, color: '#65966f', size: 15, textSize: 10},
  ],
  circles: [
    {id: 1, name: 'Inner circle', radius: 72, color: '#567d78', width: 1.5, opacity: .8},
    {id: 2, name: 'Trusted circle', radius: 138, color: '#82a09b', width: 1.2, opacity: .55},
    {id: 3, name: 'Outer circle', radius: 205, color: '#9cb0ac', width: 1, opacity: .45},
  ]
};
let state = JSON.parse(localStorage.getItem('spiral-state') || 'null') || structuredClone(defaults);
for (const [key, value] of Object.entries(defaults)) if (state[key] === undefined) state[key] = structuredClone(value);
['characters','chapters','scenes'].forEach(key=>state[key].forEach(item => { if (item.textSize === undefined) item.textSize = 10; }));
let selected = null, dragging = null;
let currentProjectId = localStorage.getItem('spiral-current-project');

function save(){ localStorage.setItem('spiral-state', JSON.stringify(state)); }
function center(){ return {x: canvas.width / devicePixelRatio / 2, y: canvas.height / devicePixelRatio / 2}; }
function resize(){ const r=canvas.getBoundingClientRect(); canvas.width=r.width*devicePixelRatio; canvas.height=r.height*devicePixelRatio; ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); draw(); }
function screen(p){ const c=center(); return {x:c.x+p.x*state.zoom, y:c.y+p.y*state.zoom}; }
function world(p){ const c=center(); return {x:(p.x-c.x)/state.zoom, y:(p.y-c.y)/state.zoom}; }

function draw(){
  const w=canvas.width/devicePixelRatio,h=canvas.height/devicePixelRatio,c=center(); ctx.clearRect(0,0,w,h);
  if(state.grid) drawGrid(w,h,c);
  if(state.axes)drawAxes(w,h,c); drawConstruction(c); drawCircles(c); drawSpirals(c); drawEntities();
}
function drawGrid(w,h,c){
  ctx.save(); ctx.strokeStyle=state.theme==='dark'?'#2a3334':'#e8ece9'; ctx.lineWidth=1;
  const step=28*state.zoom; if(step>9){ctx.beginPath(); for(let x=c.x%step;x<w;x+=step){ctx.moveTo(x,0);ctx.lineTo(x,h)} for(let y=c.y%step;y<h;y+=step){ctx.moveTo(0,y);ctx.lineTo(w,y)}ctx.stroke()} ctx.restore();
}
function drawAxes(w,h,c){
  ctx.save();ctx.strokeStyle=state.theme==='dark'?'#536061':'#aeb7b4';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,c.y);ctx.lineTo(w,c.y);ctx.moveTo(c.x,0);ctx.lineTo(c.x,h);ctx.stroke();
  ctx.fillStyle=state.theme==='dark'?'#929e9c':'#87918f';ctx.font='9px DM Sans';ctx.textAlign='center';const step=56*state.zoom;
  for(let x=c.x+step,n=2;x<w;x+=step,n+=2){tick(x,c.y,n)} for(let x=c.x-step,n=-2;x>0;x-=step,n-=2){tick(x,c.y,n)}
  ctx.textAlign='right';for(let y=c.y-step,n=2;y>0;y-=step,n+=2){ytick(c.x,y,n)}for(let y=c.y+step,n=-2;y<h;y+=step,n-=2){ytick(c.x,y,n)}if(state.axisNumbers)ctx.fillText('0',c.x-7,c.y+13);ctx.restore();
  function tick(x,y,n){ctx.beginPath();ctx.moveTo(x,y-3);ctx.lineTo(x,y+3);ctx.stroke();if(state.axisNumbers)ctx.fillText(n,x,y+13)}
  function ytick(x,y,n){ctx.beginPath();ctx.moveTo(x-3,y);ctx.lineTo(x+3,y);ctx.stroke();if(state.axisNumbers)ctx.fillText(n,x-7,y+3)}
}
function drawCircles(c){if(!state.circlesVisible)return;state.circles.forEach(o=>{ctx.save();ctx.strokeStyle=o.color;ctx.globalAlpha=o.opacity;ctx.lineWidth=o.width;ctx.setLineDash(o.lineStyle==='dotted'?[3,5]:[]);ctx.beginPath();ctx.arc(c.x,c.y,o.radius*state.zoom,0,Math.PI*2);ctx.stroke();ctx.restore()})}
function fibonacciSquares(unit){
  const squares=[{x:-unit,y:0,s:unit},{x:0,y:0,s:unit}];
  let minX=-unit,maxX=unit,minY=0,maxY=unit;
  for(let i=0;i<8;i++){
    const direction=i%4;let square;
    if(direction===0){square={x:minX,y:maxY,s:maxX-minX};maxY+=square.s}
    if(direction===1){square={x:maxX,y:minY,s:maxY-minY};maxX+=square.s}
    if(direction===2){square={x:minX,y:minY-(maxX-minX),s:maxX-minX};minY-=square.s}
    if(direction===3){square={x:minX-(maxY-minY),y:minY,s:maxY-minY};minX-=square.s}
    squares.push(square);
  }
  return squares;
}
function drawFibonacciConstruction(unit){
  const squares=fibonacciSquares(unit);
  squares.forEach(square=>ctx.strokeRect(square.x,square.y,square.s,square.s));
}
function drawConstruction(c){
  if(!state.construction||!state.fib)return;const n=state.sides,unit=1.35*state.zoom*state.fibScale/100;
  ctx.save();ctx.translate(c.x,c.y);ctx.strokeStyle=state.constructionColor;ctx.globalAlpha=state.constructionOpacity;ctx.lineWidth=1;ctx.setLineDash(state.constructionLineStyle==='dotted'?[3,5]:[]);
  const baseRadius=unit*2;ctx.beginPath();for(let i=0;i<=n;i++){const angle=-Math.PI/2+i*Math.PI*2/n;const x=Math.cos(angle)*baseRadius,y=Math.sin(angle)*baseRadius;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();
  for(let i=0;i<n;i++){ctx.save();ctx.rotate(-Math.PI/2+i*Math.PI*2/n);drawFibonacciConstruction(unit);ctx.restore()}ctx.restore();
}
function infiniteSpiralPath(rotation,scale,growth=.17){const maxRadius=Math.hypot(canvas.width/devicePixelRatio,canvas.height/devicePixelRatio)*1.5,start=Math.log(.05/scale)/growth,end=Math.log(maxRadius/scale)/growth;ctx.beginPath();for(let t=start;t<=end;t+=.025){const radius=scale*Math.exp(growth*t),angle=t+rotation,x=Math.cos(angle)*radius,y=Math.sin(angle)*radius;t===start?ctx.moveTo(x,y):ctx.lineTo(x,y)}ctx.stroke()}
function fibonacciSpiralPath(unit,rotation){
  const phi=(1+Math.sqrt(5))/2;ctx.beginPath();
  for(let theta=-Math.PI;theta<=Math.PI*5;theta+=.025){const radius=unit*Math.pow(phi,2*theta/Math.PI),angle=theta+rotation,x=Math.cos(angle)*radius,y=Math.sin(angle)*radius;theta===-Math.PI?ctx.moveTo(x,y):ctx.lineTo(x,y)}
  ctx.stroke();
}
function drawSpirals(c){ctx.save();ctx.translate(c.x,c.y);ctx.setLineDash(state.spiralLineStyle==='dotted'?[3,5]:[]);if(state.golden){ctx.strokeStyle=state.goldenColor;ctx.globalAlpha=state.goldenOpacity;ctx.lineWidth=state.goldenWidth;infiniteSpiralPath(0,18*state.goldenScale/100,.22)}if(state.fib){ctx.strokeStyle='#d79b2c';ctx.globalAlpha=state.fibOpacity;ctx.lineWidth=state.fibWidth;const unit=1.35*state.zoom*state.fibScale/100;for(let i=0;i<state.sides;i++)fibonacciSpiralPath(unit,-Math.PI/2+i*Math.PI*2/state.sides)}ctx.restore()}
function drawEntities(){
  [['character','characters','charactersVisible'],['chapter','chapters','chaptersVisible'],['scene','scenes','scenesVisible']].forEach(([type,key,visible])=>{if(!state[visible])return;const scale=state[key+'Scale']/100,textScale=state[key+'TextScale']/100,paint=state[key+'Paint'];state[key].forEach(p=>{const q=screen(p),size=p.size*scale,textSize=p.textSize*textScale;ctx.save();ctx.shadowColor='#17202322';ctx.shadowBlur=5;ctx.shadowOffsetY=2;ctx.fillStyle=p.color;ctx.strokeStyle=p.color;ctx.lineWidth=Math.max(1.5,size*.12);ctx.beginPath();if(type==='character')ctx.arc(q.x,q.y,size,0,Math.PI*2);if(type==='chapter')ctx.rect(q.x-size,q.y-size,size*2,size*2);if(type==='scene'){ctx.moveTo(q.x,q.y-size);ctx.lineTo(q.x+size,q.y+size);ctx.lineTo(q.x-size,q.y+size);ctx.closePath()}paint==='stroke'?ctx.stroke():ctx.fill();ctx.shadowColor='transparent';ctx.fillStyle=paint==='stroke'?p.color:'#fff';ctx.font=`600 ${Math.max(1,Math.min(textSize,size*1.2))}px DM Sans`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(p.initials,q.x,q.y+(type==='scene'?size*.2:0));ctx.fillStyle=state.theme==='dark'?'#e7ecea':'#28312f';ctx.font=`600 ${textSize}px DM Sans`;ctx.fillText(p.name,q.x,q.y+size+textSize+2);ctx.restore()})});
}

function renderLists(){
  $('#characterList').innerHTML=entityList('character',state.characters,'circle');
  $('#chapterList').innerHTML=entityList('chapter',state.chapters,'square');
  $('#sceneList').innerHTML=entityList('scene',state.scenes,'triangle');
  $('#circleList').innerHTML=state.circles.map((p,i)=>`<div class="item-card ${selected?.type==='circle'&&selected.id===p.id?'selected':''}" data-kind="circle" data-id="${p.id}"><i class="item-color circle-icon" style="border-color:${p.color}"></i><span>${p.name}<small>Radius ${p.radius}</small></span><button title="Delete">×</button></div>`).join('');
  document.querySelectorAll('.item-card').forEach(el=>{el.onclick=(e)=>{const type=el.dataset.kind,id=+el.dataset.id;if(e.target.tagName==='BUTTON'){remove(type,id);return}selected={type,id};renderLists();hideInspector()};el.ondblclick=()=>renderInspector()});
  function entityList(type,items,shape){return items.map(p=>`<div class="item-card ${selected?.type===type&&selected.id===p.id?'selected':''}" data-kind="${type}" data-id="${p.id}"><i class="item-color ${shape}-item" style="background:${p.color}">${p.initials}</i><span>${p.name}<small>${type[0].toUpperCase()+type.slice(1)}</small></span><button title="Delete">×</button></div>`).join('')}
}
function renderInspector(){
  if(!selected){$('#inspector').classList.add('is-hidden');$('#rightToggle').classList.add('is-hidden');$('#inspector').innerHTML='';resize();return}
  const collections={character:state.characters,chapter:state.chapters,scene:state.scenes,circle:state.circles};const arr=collections[selected.type],p=arr.find(x=>x.id===selected.id);if(!p){selected=null;return renderInspector()}
  $('#inspector').classList.remove('is-hidden');$('#rightToggle').classList.add('is-hidden');
  const isEntity=selected.type!=='circle';$('#inspector').innerHTML=`<button class="close-inspector" id="closeInspector" aria-label="Close properties">×</button><h2>${p.name}</h2><div class="type">${isEntity?selected.type.toUpperCase():'INTIMACY CIRCLE'}</div>
    <div class="field"><label>Name</label><input id="editName" type="text" value="${p.name}"></div>
    <div class="field"><label>Color</label><div class="color-row"><input id="editColor" type="color" value="${p.color}"></div></div>
    <div class="field"><label>${isEntity?'Shape size':'Radius'} <output id="editSizeOutput">${isEntity?p.size:p.radius}</output></label><span class="range-number"><input id="editSize" type="range" min="${isEntity?1:10}" max="${isEntity?100:2000}" value="${isEntity?p.size:p.radius}"><input id="editSizeNumber" type="number" min="${isEntity?1:10}" max="${isEntity?100:2000}" value="${isEntity?p.size:p.radius}" aria-label="${isEntity?'Shape size':'Circle radius'}"></span></div>
    ${isEntity?`<div class="field"><label>Text size <output id="editTextSizeOutput">${p.textSize}</output></label><span class="range-number"><input id="editTextSize" type="range" min="1" max="72" value="${p.textSize}"><input id="editTextSizeNumber" type="number" min="1" max="72" value="${p.textSize}" aria-label="Text size"></span></div>`:''}
    ${isEntity?'':`<div class="field"><label>Stroke width <output id="editWidthOutput">${p.width}</output></label><input id="editWidth" type="range" min="0.5" max="100" step="0.5" value="${p.width}"></div><div class="field"><label>Opacity <output id="editOpacityOutput">${Math.round(p.opacity*100)}%</output></label><input id="editOpacity" type="range" min="5" max="100" value="${p.opacity*100}"></div><div class="field"><label>Line style</label><select id="editLineStyle"><option value="solid" ${p.lineStyle!=='dotted'?'selected':''}>Normal</option><option value="dotted" ${p.lineStyle==='dotted'?'selected':''}>Dotted</option></select></div>`}
    <button class="delete" id="deleteSelected">Delete ${selected.type}</button>`;
  $('#editName').oninput=e=>update('name',e.target.value);$('#editColor').oninput=e=>update('color',e.target.value);
  bindRangeNumber('editSize',isEntity?'size':'radius','editSizeOutput');
  if(isEntity) bindRangeNumber('editTextSize','textSize','editTextSizeOutput');
  if(!isEntity){$('#editWidth').oninput=e=>{p.width=+e.target.value;$('#editWidthOutput').textContent=p.width;save();draw()};$('#editOpacity').oninput=e=>{p.opacity=+e.target.value/100;$('#editOpacityOutput').textContent=Math.round(p.opacity*100)+'%';save();draw()}}
  if(!isEntity) $('#editLineStyle').onchange=e=>update('lineStyle',e.target.value);
  $('#closeInspector').onclick=()=>{$('#inspector').classList.add('is-hidden');$('#rightToggle').classList.remove('is-hidden');resize()};
  $('#deleteSelected').onclick=()=>remove(selected.type,selected.id);
  function update(k,v,rerender=false){p[k]=v;save();draw();if(rerender)renderInspector();renderLists()}
  function bindRangeNumber(id,key,outputId){const range=$('#'+id),number=$('#'+id+'Number'),output=$('#'+outputId);const set=value=>{const next=Math.max(+range.min,Math.min(+range.max,+value||+range.min));p[key]=next;range.value=next;number.value=next;output.textContent=next;save();draw()};range.oninput=e=>set(e.target.value);number.oninput=e=>set(e.target.value)}
}
function hideInspector(){
  $('#inspector').classList.add('is-hidden');$('#rightToggle').classList.add('is-hidden');resize();
}
function remove(type,id){const keys={character:'characters',chapter:'chapters',scene:'scenes',circle:'circles'},key=keys[type];state[key]=state[key].filter(x=>x.id!==id);if(selected?.id===id&&selected?.type===type)selected=null;save();renderLists();renderInspector();draw()}

$('#addCharacter').onclick=()=>{const id=Math.max(0,...state.characters.map(x=>x.id))+1;state.characters.push({id,name:`Character ${id}`,initials:`C${id}`,x:30*id%160-80,y:35*id%140-70,color:['#8a6eb0','#d47754','#4b8992'][id%3],size:13,textSize:10});save();renderLists();draw()};
$('#addChapter').onclick=()=>addEntity('chapter','#537da1');
$('#addScene').onclick=()=>addEntity('scene','#65966f');
function addEntity(type,color){const key=type+'s',id=Math.max(0,...state[key].map(x=>x.id))+1;state[key].push({id,name:`${type[0].toUpperCase()+type.slice(1)} ${id}`,initials:String(id),x:38*id%180-90,y:47*id%160-80,color,size:14,textSize:10});save();renderLists();draw()}
$('#addCircle').onclick=()=>{const id=Math.max(0,...state.circles.map(x=>x.id))+1;state.circles.push({id,name:`Circle ${id}`,radius:60+state.circles.length*50,color:'#6e9691',width:1.5,opacity:.55});save();renderLists();draw()};
function hitTest(point){const layers=[['scene','scenes','scenesVisible'],['chapter','chapters','chaptersVisible'],['character','characters','charactersVisible']];for(const [type,key,visible] of layers){if(!state[visible])continue;for(const item of [...state[key]].reverse()){const q=screen(item),size=item.size*state[key+'Scale']/100;if(Math.hypot(point.x-q.x,point.y-q.y)<size+8)return{type,item}}}const c=center(),distance=Math.hypot(point.x-c.x,point.y-c.y),item=state.circlesVisible&&[...state.circles].reverse().find(circle=>Math.abs(distance-circle.radius*state.zoom)<Math.max(7,circle.width/2));return item?{type:'circle',item}:null}
canvas.addEventListener('pointerdown',e=>{const r=canvas.getBoundingClientRect(),hit=hitTest({x:e.clientX-r.left,y:e.clientY-r.top});if(hit){selected={type:hit.type,id:hit.item.id};renderLists();hideInspector();if(hit.type!=='circle'){dragging=hit.item;canvas.classList.add('dragging');canvas.setPointerCapture(e.pointerId)}return}selected=null;renderLists();renderInspector()});
canvas.addEventListener('dblclick',e=>{const r=canvas.getBoundingClientRect(),hit=hitTest({x:e.clientX-r.left,y:e.clientY-r.top});if(!hit)return;selected={type:hit.type,id:hit.item.id};renderLists();renderInspector()});
canvas.addEventListener('pointermove',e=>{if(!dragging)return;const r=canvas.getBoundingClientRect(),p=world({x:e.clientX-r.left,y:e.clientY-r.top});dragging.x=p.x;dragging.y=p.y;draw()});
canvas.addEventListener('pointerup',()=>{if(dragging){dragging=null;canvas.classList.remove('dragging');save()}});
let targetZoom=state.zoom,zoomFrame=null;
function animateZoom(){state.zoom+=(targetZoom-state.zoom)*.18;if(Math.abs(targetZoom-state.zoom)<.001){state.zoom=targetZoom;zoomFrame=null;save()}else zoomFrame=requestAnimationFrame(animateZoom);syncZoom();draw()}
function setZoom(value){targetZoom=Math.max(.05,Math.min(20,value));if(!zoomFrame)zoomFrame=requestAnimationFrame(animateZoom)}
canvas.addEventListener('wheel',e=>{e.preventDefault();setZoom(targetZoom*Math.exp(-e.deltaY*.0015))},{passive:false});
function syncZoom(){ $('#zoomLabel').textContent=Math.round(state.zoom*100)+'%' }
$('#zoomIn').onclick=()=>setZoom(targetZoom*1.25);$('#zoomOut').onclick=()=>setZoom(targetZoom*.8);$('#fitBtn').onclick=()=>setZoom(1);
[['gridOn','grid'],['axesOn','axes'],['axisNumbersOn','axisNumbers'],['goldenOn','golden'],['fibOn','fib'],['constructionOn','construction']].forEach(([id,k])=>{const el=$('#'+id);el.checked=state[k];el.onchange=()=>{state[k]=el.checked;save();draw()}});
[['charactersOn','charactersVisible'],['chaptersOn','chaptersVisible'],['scenesOn','scenesVisible'],['circlesOn','circlesVisible']].forEach(([id,key])=>{const el=$('#'+id);el.checked=state[key];el.onchange=()=>{state[key]=el.checked;if(!el.checked&&selected&&({character:'charactersVisible',chapter:'chaptersVisible',scene:'scenesVisible',circle:'circlesVisible'})[selected.type]===key){selected=null;renderLists();renderInspector()}save();draw()}});
[['goldenColor','goldenColor',String],['constructionColor','constructionColor',String]].forEach(([id,k,cast])=>{const el=$('#'+id);el.value=state[k];el.oninput=()=>{state[k]=cast(el.value);save();draw()}});
function bindNumericPair(id,key,min,max){const range=$('#'+id),number=$('#'+id+'Number');const set=value=>{const next=Math.max(min,Math.min(max,+value||min));state[key]=next;range.value=next;number.value=next;save();draw()};range.value=state[key];number.value=state[key];range.oninput=e=>set(e.target.value);number.oninput=e=>set(e.target.value)}
bindNumericPair('goldenWidth','goldenWidth',.25,100);bindNumericPair('fibWidth','fibWidth',.25,100);
[['characters','charactersScale','charactersTextScale','charactersPaint'],['chapters','chaptersScale','chaptersTextScale','chaptersPaint'],['scenes','scenesScale','scenesTextScale','scenesPaint']].forEach(([prefix,scaleKey,textScaleKey,paintKey])=>{bindNumericPair(prefix+'Scale',scaleKey,1,500);bindNumericPair(prefix+'TextScale',textScaleKey,1,500);const select=$('#'+prefix+'Paint');select.value=state[paintKey];select.onchange=()=>{state[paintKey]=select.value;save();draw()}});
function bindScale(id,key,output){const range=$('#'+id),number=$('#'+id+'Number');const set=value=>{const next=Math.max(1,Math.min(5000,+value||1));state[key]=next;range.value=next;number.value=next;if(output)$(output).textContent=next+'%';save();draw()};range.value=state[key];number.value=state[key];range.oninput=e=>set(e.target.value);number.oninput=e=>set(e.target.value)}
bindScale('goldenScale','goldenScale');bindScale('fibScale','fibScale','#fibScaleValue');
$('#fibScaleValue').textContent=state.fibScale+'%';
function bindOpacity(id,key,output){const range=$('#'+id),number=$('#'+id+'Number');const set=value=>{const percent=Math.max(0,Math.min(100,+value||0));state[key]=percent/100;range.value=percent;if(number)number.value=percent;if(output)$(output).textContent=percent+'%';save();draw()};range.value=Math.round(state[key]*100);if(number)number.value=range.value;range.oninput=e=>set(e.target.value);if(number)number.oninput=e=>set(e.target.value)}
bindOpacity('goldenOpacity','goldenOpacity','#goldenOpacityValue');bindOpacity('fibOpacity','fibOpacity');
[['spiralLineStyle','spiralLineStyle'],['constructionLineStyle','constructionLineStyle']].forEach(([id,k])=>{const el=$('#'+id);el.value=state[k];el.onchange=()=>{state[k]=el.value;save();draw()}});
$('#constructionOpacity').value=state.constructionOpacity*100;$('#constructionOpacity').oninput=e=>{state.constructionOpacity=+e.target.value/100;save();draw()};
$('#sides').value=state.sides;$('#sidesValue').textContent=`${state.sides} sides`;$('#sides').oninput=e=>{state.sides=+e.target.value;$('#sidesValue').textContent=`${state.sides} sides`;save();draw()};
$('#resetBtn').onclick=()=>{if(confirm('Reset the diagram to its original state?')){state=structuredClone(defaults);selected=null;save();init()}};
$('#exportBtn').onclick=()=>{draw();const a=document.createElement('a');a.download='spiral-story-diagram.png';a.href=canvas.toDataURL('image/png');a.click()};
function getProjects(){try{return JSON.parse(localStorage.getItem('spiral-projects')||'[]')}catch{return[]}}
function setProjects(projects){localStorage.setItem('spiral-projects',JSON.stringify(projects))}
function renderProjects(){const projects=getProjects().sort((a,b)=>b.updatedAt-a.updatedAt);$('#projectCount').textContent=`${projects.length} project${projects.length===1?'':'s'}`;$('#recentProjects').innerHTML=projects.length?projects.map(project=>`<article class="project-card ${project.id===currentProjectId?'current':''}"><div class="project-thumb"><span>⌁</span></div><div><strong>${escapeHtml(project.name)}</strong><small>${formatProjectDate(project.updatedAt)}</small></div><button data-open-project="${project.id}">Open</button><button class="project-delete" data-delete-project="${project.id}" aria-label="Delete ${escapeHtml(project.name)}">×</button></article>`).join(''):'<div class="no-projects"><span>◇</span><strong>No saved projects yet</strong><small>Save this canvas to see it here.</small></div>';document.querySelectorAll('[data-open-project]').forEach(button=>button.onclick=()=>openProject(button.dataset.openProject));document.querySelectorAll('[data-delete-project]').forEach(button=>button.onclick=()=>deleteProject(button.dataset.deleteProject))}
function escapeHtml(value){return String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]))}
function formatProjectDate(timestamp){return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(timestamp)}
function openProjects(){renderProjects();$('#projectsPanel').classList.remove('is-hidden');$('#projectsBackdrop').classList.remove('is-hidden');$('#projectName').focus()}
function closeProjects(){$('#projectsPanel').classList.add('is-hidden');$('#projectsBackdrop').classList.add('is-hidden')}
function saveProject(){const name=$('#projectName').value.trim()||'Untitled project',projects=getProjects(),now=Date.now();let project=projects.find(item=>item.id===currentProjectId);if(project){project.name=name;project.state=structuredClone(state);project.updatedAt=now}else{project={id:`project-${now}`,name,state:structuredClone(state),updatedAt:now};projects.push(project);currentProjectId=project.id;localStorage.setItem('spiral-current-project',currentProjectId)}setProjects(projects);renderProjects()}
function openProject(id){const project=getProjects().find(item=>item.id===id);if(!project)return;state=structuredClone(project.state);currentProjectId=id;localStorage.setItem('spiral-current-project',id);$('#projectName').value=project.name;selected=null;save();init();closeProjects()}
function deleteProject(id){setProjects(getProjects().filter(item=>item.id!==id));if(currentProjectId===id){currentProjectId=null;localStorage.removeItem('spiral-current-project')}renderProjects()}
function newProject(){state=structuredClone(defaults);currentProjectId=null;localStorage.removeItem('spiral-current-project');$('#projectName').value='';selected=null;save();init();closeProjects()}
$('#projectsBtn').onclick=openProjects;$('#closeProjects').onclick=closeProjects;$('#projectsBackdrop').onclick=closeProjects;$('#saveProject').onclick=saveProject;$('#newProject').onclick=newProject;
document.querySelectorAll('.tab').forEach(tab=>tab.onclick=()=>{document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t===tab));document.querySelectorAll('.tab-panel').forEach(panel=>panel.hidden=panel.querySelector('.section-body').id!==tab.dataset.tab)});
$('#leftToggle').onclick=()=>{$('#sidebar').classList.toggle('is-hidden');document.body.classList.toggle('left-hidden');resize()};
$('#rightToggle').onclick=()=>{$('#inspector').classList.remove('is-hidden');$('#rightToggle').classList.add('is-hidden');resize()};
$('#themeBtn').onclick=()=>{state.theme=state.theme==='dark'?'light':'dark';document.body.classList.toggle('dark',state.theme==='dark');save();draw()};
function init(){document.body.classList.toggle('dark',state.theme==='dark');targetZoom=state.zoom;const project=getProjects().find(item=>item.id===currentProjectId);if(project)$('#projectName').value=project.name;renderLists();renderInspector();syncZoom();resize()} window.addEventListener('resize',resize);init();

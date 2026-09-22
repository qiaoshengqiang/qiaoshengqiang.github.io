(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const r of s)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function e(s){const r={};return s.integrity&&(r.integrity=s.integrity),s.referrerPolicy&&(r.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?r.credentials="include":s.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(s){if(s.ep)return;s.ep=!0;const r=e(s);fetch(s.href,r)}})();const Yt={width:2e3,depth:1600,minX:-1e3,maxX:1e3,minY:-800,maxY:800},Fe={cols:121,rows:97},Jl={dx:Yt.width/(Fe.cols-1),dy:Yt.depth/(Fe.rows-1)},Ql={floor:0},zn={intervals:[20,50,100],defaultInterval:50,majorStep:100,minLinePoints:3},ll={options:[1,1.2,1.5,2],default:1},Lr={samples:200,minLength:40},tc=[{id:"3d",label:"三维地形",hint:"只显示三维地形"},{id:"contour",label:"等高线地图",hint:"只显示二维等高线地形图"},{id:"dual",label:"三维 + 等高线",hint:"左三维、右等高线，同步联动（默认）"},{id:"profile",label:"地形剖面",hint:"地图 + 放大的地形剖面图"},{id:"sync",label:"同步实验",hint:"三维 / 等高线 / 剖面 三视图同步"}],ec="dual",nc=[{id:"select",label:"选点",hint:"点击地图取点，显示海拔"},{id:"measure",label:"测量",hint:"依次点击 A、B 两点，计算高差与坡度"},{id:"profile",label:"剖面",hint:"拖动 A、B 端点，生成地形剖面图"},{id:"contour",label:"等高线",hint:"点击等高线，显示并高亮整条线"}],ic="select",kt={pointA:"#fbbf24",pointB:"#f472b6",selection:"#38bdf8",hover:"#2dd4bf",contour:"#5b4636",contourMajor:"#2f2318",contourHighlight:"#f97316",profileLine:"#38bdf8",grid:"rgba(15, 40, 70, 0.18)",water:"#2f86c9",paper:"#f4efe3"},li=[{t:0,c:[31,111,92]},{t:.14,c:[63,155,109]},{t:.3,c:[141,191,90]},{t:.46,c:[216,207,106]},{t:.62,c:[217,169,79]},{t:.78,c:[192,122,74]},{t:.9,c:[156,90,74]},{t:1,c:[242,242,242]}];function Fi(i,t=0,e=1e3){const n=e-t||1;let s=(i-t)/n;Number.isFinite(s)||(s=0),s=s<0?0:s>1?1:s;for(let o=1;o<li.length;o+=1){const a=li[o];if(s<=a.t){const l=li[o-1],c=(s-l.t)/(a.t-l.t||1);return{r:Math.round(l.c[0]+(a.c[0]-l.c[0])*c),g:Math.round(l.c[1]+(a.c[1]-l.c[1])*c),b:Math.round(l.c[2]+(a.c[2]-l.c[2])*c)}}}const r=li[li.length-1].c;return{r:r[0],g:r[1],b:r[2]}}const sc=li.map(i=>({...i})),$n=(i,t,e)=>i<t?t:i>e?e:i;class So{constructor(t,e,n){this.cols=t,this.rows=e,this.data=n,this.dx=Yt.width/(t-1),this.dy=Yt.depth/(e-1),this.minX=Yt.minX,this.maxX=Yt.maxX,this.minY=Yt.minY,this.maxY=Yt.maxY,this.stats=this.computeStats()}static create(t=Fe.cols,e=Fe.rows){return new So(t,e,new Float32Array(t*e))}index(t,e){return t*this.cols+e}inBounds(t,e){return t>=0&&t<this.rows&&e>=0&&e<this.cols}at(t,e){const n=$n(Math.round(t),0,this.rows-1),s=$n(Math.round(e),0,this.cols-1);return this.data[this.index(n,s)]}setAt(t,e,n){this.inBounds(t,e)&&(this.data[this.index(t,e)]=n)}computeStats(){let t=1/0,e=-1/0,n=0;for(let r=0;r<this.data.length;r+=1){const o=this.data[r];o<t&&(t=o),o>e&&(e=o),n+=o}const s=this.data.length||1;return{min:t,max:e,mean:n/s,count:s}}worldToGridFloat(t,e){return{col:(t-this.minX)/this.dx,row:(this.maxY-e)/this.dy}}gridToWorldFloat(t,e){return{x:this.minX+t*this.dx,y:this.maxY-e*this.dy}}worldToGrid(t,e){const n=this.worldToGridFloat(t,e);return{col:$n(Math.round(n.col),0,this.cols-1),row:$n(Math.round(n.row),0,this.rows-1)}}gridToWorld(t,e){return this.gridToWorldFloat(e,t)}sample(t,e){const n=$n((t-this.minX)/this.dx,0,this.cols-1),s=$n((this.maxY-e)/this.dy,0,this.rows-1),r=Math.floor(n),o=Math.floor(s),a=Math.min(r+1,this.cols-1),l=Math.min(o+1,this.rows-1),c=n-r,d=s-o,h=this.data[this.index(o,r)],f=this.data[this.index(o,a)],m=this.data[this.index(l,r)],g=this.data[this.index(l,a)],v=h+(f-h)*c,p=m+(g-m)*c;return v+(p-v)*d}gradient(t,e,n=Jl.dx){const s=Math.min(n,t-this.minX),r=Math.min(n,this.maxX-t),o=Math.min(n,e-this.minY),a=Math.min(n,this.maxY-e);let l=0;s>1e-6&&r>1e-6?l=(this.sample(t+r,e)-this.sample(t-s,e))/(s+r):r>1e-6?l=(this.sample(t+r,e)-this.sample(t,e))/r:s>1e-6&&(l=(this.sample(t,e)-this.sample(t-s,e))/s);let c=0;return o>1e-6&&a>1e-6?c=(this.sample(t,e+a)-this.sample(t,e-o))/(a+o):a>1e-6?c=(this.sample(t,e+a)-this.sample(t,e))/a:o>1e-6&&(c=(this.sample(t,e)-this.sample(t,e-o))/o),{dx:l,dy:c}}slopePercent(t,e){const n=this.gradient(t,e);return Math.hypot(n.dx,n.dy)*100}slopeAngleDeg(t,e){const n=this.gradient(t,e);return Math.atan(Math.hypot(n.dx,n.dy))*180/Math.PI}forEach(t){for(let e=0;e<this.rows;e+=1)for(let n=0;n<this.cols;n+=1)t(this.data[this.index(e,n)],e,n)}}const Eo=(i,t,e)=>i<t?t:i>e?e:i;function Ni(i,t,e){const n=Eo((e-i)/(t-i),0,1);return n*n*(3-2*n)}function Wi(i,t,e,n,s,r,o,a){const l=i-e,c=t-n,d=l<0?s:r,h=c<0?o:a;return Math.exp(-(l*l)/(2*d*d)-c*c/(2*h*h))}function qs(i,t,e,n,s,r,o,a,l){const c=s-e,d=r-n,h=c*c+d*d||1;let f=((i-e)*c+(t-n)*d)/h;f=Eo(f,0,1);const m=e+f*c,g=n+f*d,v=Math.hypot(i-m,t-g),p=Math.exp(-(v*v)/(2*o*o)),u=Ni(0,a,f)*(1-Ni(1-l,1,f));return p*u}function rc(i,t,e,n,s,r){const o=Math.hypot(i-e,t-n)-s;return Math.exp(-(o*o)/(2*r*r))}const bo={base:110,trend:{amplitude:130,from:Yt.minY,to:620},peakA:{x:-520,y:410,amp:600,sxNeg:300,sxPos:330,syNeg:340,syPos:320},peakB:{x:580,y:330,amp:480,sxNeg:330,sxPos:430,syNeg:320,syPos:360},saddle:{x:-10,y:400},ridge:{a:[-520,410],b:[-260,-690],sigma:175,amp:190,headTaper:.32,tailTaper:.5},spur:{a:[580,330],b:[890,-170],sigma:165,amp:130,headTaper:.55,tailTaper:.45},valley:{a:[70,430],b:[20,-780],sigma:180,depth:165,headTaper:.35,tailTaper:.12},basin:{x:-700,y:-560,sigma:200,depth:115,rimRadius:280,rimSigma:95,rimAmp:88},hills:[{x:250,y:-430,amp:16,sigma:260},{x:-160,y:650,amp:24,sx:320,sy:190},{x:760,y:590,amp:18,sx:260,sy:210}]},kn=[[78,380],[66,268],[58,152],[52,34],[46,-88],[40,-210],[34,-330],[29,-446],[24,-560],[19,-676],[15,-780]],Gt=bo;function oc(i,t){const e=Gt.trend.amplitude*Ni(Gt.trend.from,Gt.trend.to,t),n=Gt.peakA,s=Gt.peakB,r=n.amp*Wi(i,t,n.x,n.y,n.sxNeg,n.sxPos,n.syNeg,n.syPos),o=s.amp*Wi(i,t,s.x,s.y,s.sxNeg,s.sxPos,s.syNeg,s.syPos),a=Gt.base+e+r+o,l=Gt.ridge.amp*qs(i,t,Gt.ridge.a[0],Gt.ridge.a[1],Gt.ridge.b[0],Gt.ridge.b[1],Gt.ridge.sigma,Gt.ridge.headTaper,Gt.ridge.tailTaper),c=Gt.spur.amp*qs(i,t,Gt.spur.a[0],Gt.spur.a[1],Gt.spur.b[0],Gt.spur.b[1],Gt.spur.sigma,Gt.spur.headTaper,Gt.spur.tailTaper),d=qs(i,t,Gt.valley.a[0],Gt.valley.a[1],Gt.valley.b[0],Gt.valley.b[1],Gt.valley.sigma,Gt.valley.headTaper,Gt.valley.tailTaper),h=Gt.valley.depth*d*(.4+.6*Ni(130,620,a)),f=Gt.basin,m=Wi(i,t,f.x,f.y,f.sigma,f.sigma,f.sigma,f.sigma),g=f.depth*m*(.35+.65*Ni(130,620,a)),v=f.rimAmp*rc(i,t,f.x,f.y,f.rimRadius,f.rimSigma);let p=0;for(const S of Gt.hills)p+=S.amp*Wi(i,t,S.x,S.y,S.sx??S.sigma,S.sx??S.sigma,S.sy??S.sigma,S.sy??S.sigma);let u=a+l+c+v+p-h-g;return u+=4*Math.sin(i/320)*Math.cos(t/260),Eo(u,4,1e3)}function ac(i=Fe.cols,t=Fe.rows){const e=new Float32Array(i*t),n=Yt.width/(i-1),s=Yt.depth/(t-1);for(let r=0;r<t;r+=1){const o=Yt.maxY-r*s;for(let a=0;a<i;a+=1){const l=Yt.minX+a*n;e[r*i+a]=oc(l,o)}}return e}class To{constructor(t={}){const e=t.cols??Fe.cols,n=t.rows??Fe.rows,s=t.data??ac(e,n);this.cols=e,this.rows=n,this.width=Yt.width,this.depth=Yt.depth,this.field=new So(e,n,s);const r=this.field.stats;this.minElevation=r.min,this.maxElevation=r.max,this.meanElevation=r.mean,this.contourCache=new Map}static create(t){return new To(t)}getHeightAt(t,e){return this.field.sample(t,e)}getElevationAtWorldPosition(t,e){return this.field.sample(t,e)}getGridHeight(t,e){return this.field.at(t,e)}getHeightGrid(){return this.field.data}getGradient(t,e){return this.field.gradient(t,e)}getGradientAt(t,e){return this.field.gradient(t,e)}getSlopeAt(t,e){const n=this.field.gradient(t,e);return Math.hypot(n.dx,n.dy)*100}getSlopeAngleAt(t,e){const n=this.field.gradient(t,e);return Math.atan(Math.hypot(n.dx,n.dy))*180/Math.PI}getSlopeInfo(t,e){const n=this.field.gradient(t,e),s=Math.hypot(n.dx,n.dy);return{gradient:n,ratio:s,percent:s*100,angleDeg:Math.atan(s)*180/Math.PI,aspectDeg:Math.atan2(-n.dx,-n.dy)*180/Math.PI}}getDirectionalSlope(t,e,n,s){const r=this.field.gradient(t,e),o=Math.hypot(n,s)||1;return(r.dx*n+r.dy*s)/o*100}worldToGrid(t,e){return this.field.worldToGrid(t,e)}gridToWorld(t,e){return this.field.gridToWorld(t,e)}gridToWorldFloat(t,e){return this.field.gridToWorldFloat(t,e)}worldToGridFloat(t,e){return this.field.worldToGridFloat(t,e)}getBounds(){return{minX:Yt.minX,maxX:Yt.maxX,minY:Yt.minY,maxY:Yt.maxY,width:this.width,depth:this.depth,cols:this.cols,rows:this.rows}}getStats(){return{...this.field.stats,minElevation:this.minElevation,maxElevation:this.maxElevation}}getContourLevels(t=zn.defaultInterval){const e=Math.max(1,t),n=[],s=Math.ceil((this.minElevation-.001)/e)*e,r=Math.floor((this.maxElevation+.001)/e)*e;for(let o=s;o<=r;o+=e)o<=Ql.floor||n.push(Math.round(o*1e3)/1e3);return n}isMajorLevel(t){return Math.abs(t%zn.majorStep)<1e-6}getProfile(t,e,n=Lr.samples){const s=e.x-t.x,r=e.y-t.y,o=Math.hypot(s,r),a=o>1e-6?s/o:1,l=o>1e-6?r/o:0,c=Math.max(2,Math.round(n)),d=[];let h=1/0,f=-1/0;for(let m=0;m<c;m+=1){const g=m/(c-1),v=t.x+s*g,p=t.y+r*g,u=this.getHeightAt(v,p),S=this.field.gradient(v,p),M=Math.hypot(S.dx,S.dy),x=(S.dx*a+S.dy*l)*100;u<h&&(h=u),u>f&&(f=u),d.push({index:m,t:g,distance:o*g,x:v,y:p,elevation:u,slopePercent:M*100,angleDeg:Math.atan(M)*180/Math.PI,alongSlopePercent:x})}return{start:{x:t.x,y:t.y,elevation:this.getHeightAt(t.x,t.y)},end:{x:e.x,y:e.y,elevation:this.getHeightAt(e.x,e.y)},length:o,sampleCount:c,samples:d,minElevation:h,maxElevation:f}}getProfilePointAtDistance(t,e){if(!t||!t.samples||t.samples.length===0)return null;const n=Math.max(0,Math.min(t.length,e));let s=t.samples[0],r=Math.abs(s.distance-n);for(let o=1;o<t.samples.length;o+=1){const a=Math.abs(t.samples[o].distance-n);a<r&&(r=a,s=t.samples[o])}return s}}const Xi=(i,t,e)=>i<t?t:i>e?e:i;class lc{constructor(t=Yt){this.bounds={...t},this.dx=this.bounds.width/(Fe.cols-1),this.dy=this.bounds.depth/(Fe.rows-1),this.viewport={x:0,y:0,width:1,height:1}}worldToGrid(t,e){return{col:Xi(Math.round((t-this.bounds.minX)/this.dx),0,Fe.cols-1),row:Xi(Math.round((this.bounds.maxY-e)/this.dy),0,Fe.rows-1)}}gridToWorld(t,e){return{x:this.bounds.minX+e*this.dx,y:this.bounds.maxY-t*this.dy}}fitViewport(t,e,n={top:0,right:0,bottom:0,left:0}){const s=Math.max(1,t-n.left-n.right),r=Math.max(1,e-n.top-n.bottom),o=this.bounds.width/this.bounds.depth;let a=s,l=a/o;return l>r&&(l=r,a=l*o),this.viewport={x:n.left+(s-a)/2,y:n.top+(r-l)/2,width:a,height:l},this.viewport}get scale(){return this.viewport.width/this.bounds.width}get metersPerPixel(){return this.bounds.width/this.viewport.width}worldToPixel(t,e){const n=this.scale;return{px:this.viewport.x+(t-this.bounds.minX)*n,py:this.viewport.y+(this.bounds.maxY-e)*n}}pixelToWorld(t,e){const n=this.scale||1;return{x:this.bounds.minX+(t-this.viewport.x)/n,y:this.bounds.maxY-(e-this.viewport.y)/n}}pixelDistanceToMeters(t){return t*this.metersPerPixel}metersToPixel(t){return t*this.scale}worldToThree(t,e,n=0,s=1){return{x:t,y:n*s,z:-e}}threeToWorld(t,e){return{x:t,y:-e}}threeScale(){return 1}worldCenter(){return{x:0,y:0}}contains(t,e){return t>=this.bounds.minX&&t<=this.bounds.maxX&&e>=this.bounds.minY&&e<=this.bounds.maxY}clampToBounds(t,e){return{x:Xi(t,this.bounds.minX,this.bounds.maxX),y:Xi(e,this.bounds.minY,this.bounds.maxY)}}}function cc(){return{mode:ec,tool:ic,interval:zn.defaultInterval,verticalExaggeration:ll.default,classroomMode:!1,display:{fill:!0,grid:!1,labels:!0,river:!0,terrainContours:!0},selection:null,pointA:null,pointB:null,profile:null,profileCursor:null,hover:null,feature:null,showAllFeatures:!1,highlightedContour:null,measurement:null,experiment:"explore"}}class hc{constructor(t=cc()){this._state={...t,display:{...t.display}},this._listeners=new Map,this._global=new Set}get(t){return this._state[t]}snapshot(){return{...this._state,display:{...this._state.display}}}set(t){const e=[];for(const[n,s]of Object.entries(t)){if(n==="display"&&s&&typeof s=="object"){const r={...this._state.display,...s};if(JSON.stringify(r)===JSON.stringify(this._state.display))continue;this._state.display=r,e.push("display");continue}this._state[n]!==s&&(this._state[n]=s,e.push(n))}if(!e.length)return e;for(const n of e){const s=this._listeners.get(n);s&&s.forEach(r=>r(this._state[n],this._state))}return this._global.forEach(n=>n(this._state,e)),e}subscribe(t,e){return this._listeners.has(t)||this._listeners.set(t,new Set),this._listeners.get(t).add(e),()=>this._listeners.get(t)?.delete(e)}subscribeAll(t){return this._global.add(t),()=>this._global.delete(t)}resetInteraction(){this.set({selection:null,pointA:null,pointB:null,profile:null,profileCursor:null,hover:null,feature:null,highlightedContour:null,measurement:null})}}function $i(i,t,e){const n=t-i;if(Math.abs(n)<1e-9)return .5;const s=(e-i)/n;return s<0?0:s>1?1:s}function uc(i,t,e,n,s){const r=[],o=(a,l)=>a*t+l;for(let a=0;a<e-1;a+=1)for(let l=0;l<t-1;l+=1){const c=i[o(a,l)],d=i[o(a,l+1)],h=i[o(a+1,l+1)],f=i[o(a+1,l)];let m=0;if(c>n&&(m|=8),d>n&&(m|=4),h>n&&(m|=2),f>n&&(m|=1),m===0||m===15)continue;const g={},v={AB:()=>{if(!g.AB){const u=$i(c,d,n);g.AB=s(l+u,a)}return g.AB},BC:()=>{if(!g.BC){const u=$i(d,h,n);g.BC=s(l+1,a+u)}return g.BC},CD:()=>{if(!g.CD){const u=$i(h,f,n);g.CD=s(l+1-u,a+1)}return g.CD},DA:()=>{if(!g.DA){const u=$i(f,c,n);g.DA=s(l,a+1-u)}return g.DA}},p=(u,S)=>{const M=v[u](),x=v[S]();Math.hypot(x.x-M.x,x.y-M.y)<1e-9||r.push({x1:M.x,y1:M.y,x2:x.x,y2:x.y})};switch(m){case 1:p("DA","CD");break;case 2:p("BC","CD");break;case 3:p("BC","DA");break;case 4:p("AB","BC");break;case 6:p("AB","CD");break;case 7:p("AB","DA");break;case 8:p("AB","DA");break;case 9:p("AB","CD");break;case 11:p("AB","BC");break;case 12:p("BC","DA");break;case 13:p("BC","CD");break;case 14:p("DA","CD");break;case 5:{(c+d+h+f)/4>n?(p("AB","DA"),p("BC","CD")):(p("AB","BC"),p("CD","DA"));break}case 10:{(c+d+h+f)/4>n?(p("AB","BC"),p("CD","DA")):(p("AB","DA"),p("BC","CD"));break}}}return r}class Ps{constructor(t,e,n=!1,s=!1){this.level=t,this.points=e,this.closed=n,this.major=s,this.bounds=Ps.computeBounds(e),this.length=Ps.computeLength(e,n)}static computeBounds(t){let e=1/0,n=1/0,s=-1/0,r=-1/0;for(const o of t)o.x<e&&(e=o.x),o.x>s&&(s=o.x),o.y<n&&(n=o.y),o.y>r&&(r=o.y);return{minX:e,minY:n,maxX:s,maxY:r}}static computeLength(t,e){let n=0;for(let s=1;s<t.length;s+=1)n+=Math.hypot(t[s].x-t[s-1].x,t[s].y-t[s-1].y);if(e&&t.length>2){const s=t[0],r=t[t.length-1];n+=Math.hypot(s.x-r.x,s.y-r.y)}return n}distanceToPoint(t,e){let n=1/0;const s=this.points.length,r=this.closed?s:s-1;for(let o=0;o<r;o+=1){const a=this.points[o],l=this.points[(o+1)%s],c=l.x-a.x,d=l.y-a.y,h=c*c+d*d;let f=h>1e-9?((t-a.x)*c+(e-a.y)*d)/h:0;f=f<0?0:f>1?1:f;const m=Math.hypot(t-(a.x+f*c),e-(a.y+f*d));m<n&&(n=m)}return n}midpoint(){const t=this.points.length;return t===0?{x:0,y:0}:this.points[Math.floor(t/2)]}toJSON(){return{level:this.level,closed:this.closed,major:this.major,length:this.length,count:this.points.length}}}function dc(i,t,e,n=.05){const s=(c,d)=>`${Math.round(c/n)}:${Math.round(d/n)}`,r=new Map,o=(c,d)=>{let h=r.get(c);h||(h=[],r.set(c,h)),h.push(d)};for(let c=0;c<i.length;c+=1){const d=i[c];o(s(d.x1,d.y1),{i:c,end:0}),o(s(d.x2,d.y2),{i:c,end:1})}const a=new Uint8Array(i.length),l=[];for(let c=0;c<i.length;c+=1){if(a[c])continue;a[c]=1;const d=i[c],h=[{x:d.x1,y:d.y1},{x:d.x2,y:d.y2}],f=u=>{let S=!0;for(;S;){S=!1;const M=u?h[h.length-1]:h[0],x=r.get(s(M.x,M.y));if(!x)break;for(const C of x){if(a[C.i])continue;a[C.i]=1;const A=i[C.i],T=C.end===0?{x:A.x2,y:A.y2}:{x:A.x1,y:A.y1};u?h.push(T):h.unshift(T),S=!0;break}}};f(!0),f(!1);const m=h[0],g=h[h.length-1],v=h.length>3&&Math.hypot(g.x-m.x,g.y-m.y)<=n*2;if(v&&h.pop(),h.length<2)continue;const p=new Ps(t,h,v,e);p.length<n*2||l.push(p)}return l}function fc(i,t,e,n=1/0){if(!i||!i.lines)return null;let s=null;for(const r of i.lines){const o=r.bounds;if(t<o.minX-n||t>o.maxX+n||e<o.minY-n||e>o.maxY+n)continue;const a=r.distanceToPoint(t,e);a<=n&&(!s||a<s.distance)&&(s={line:r,distance:a})}return s}class pc{constructor(t){this.model=t,this.cache=new Map,this.version=0}invalidate(){this.cache.clear(),this.version+=1}generate(t=zn.defaultInterval){const e=Number(t);if(this.cache.has(e))return this.cache.get(e);const n=typeof performance<"u"?performance.now():Date.now(),s=this.model,r=s.getHeightGrid(),{cols:o,rows:a}=s,l=(v,p)=>s.gridToWorldFloat(v,p),c=s.getContourLevels(e),d=[];let h=0,f=0;for(const v of c){const p=uc(r,o,a,v,l);if(p.length===0)continue;const u=s.isMajorLevel(v),S=dc(p,v,u);for(const M of S)M.points.length<zn.minLinePoints||(h+=M.points.length,f+=M.length,d.push(M))}const m=typeof performance<"u"?performance.now():Date.now(),g={interval:e,levels:c,majorLevels:c.filter(v=>s.isMajorLevel(v)),lines:d,stats:{lineCount:d.length,pointCount:h,totalLength:f,milliseconds:m-n}};return this.cache.set(e,g),g}cachedResults(){return Array.from(this.cache.values())}maxLevel(t){const e=this.generate(t);return e.levels.length?e.levels[e.levels.length-1]:0}}/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Ao="169",di={ROTATE:0,DOLLY:1,PAN:2},hi={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},mc=0,qo=1,gc=2,cl=1,_c=2,en=3,yn=0,Te=1,nn=2,vn=0,fi=1,jo=2,Ko=3,Zo=4,vc=5,Dn=100,xc=101,yc=102,Mc=103,Sc=104,Ec=200,bc=201,Tc=202,Ac=203,Dr=204,Ir=205,wc=206,Cc=207,Rc=208,Pc=209,Lc=210,Dc=211,Ic=212,Uc=213,Nc=214,Ur=0,Nr=1,Fr=2,gi=3,Or=4,Br=5,kr=6,zr=7,hl=0,Fc=1,Oc=2,xn=0,Bc=1,kc=2,zc=3,Hc=4,Gc=5,Vc=6,Wc=7,ul=300,_i=301,vi=302,Hr=303,Gr=304,Bs=306,Vr=1e3,Un=1001,Wr=1002,Oe=1003,Xc=1004,Yi=1005,Ve=1006,js=1007,Nn=1008,on=1009,dl=1010,fl=1011,Oi=1012,wo=1013,Hn=1014,sn=1015,Bi=1016,Co=1017,Ro=1018,xi=1020,pl=35902,ml=1021,gl=1022,Xe=1023,_l=1024,vl=1025,pi=1026,yi=1027,xl=1028,Po=1029,yl=1030,Lo=1031,Do=1033,Ss=33776,Es=33777,bs=33778,Ts=33779,Xr=35840,$r=35841,Yr=35842,qr=35843,jr=36196,Kr=37492,Zr=37496,Jr=37808,Qr=37809,to=37810,eo=37811,no=37812,io=37813,so=37814,ro=37815,oo=37816,ao=37817,lo=37818,co=37819,ho=37820,uo=37821,As=36492,fo=36494,po=36495,Ml=36283,mo=36284,go=36285,_o=36286,$c=3200,Yc=3201,Sl=0,qc=1,_n="",Ge="srgb",En="srgb-linear",Io="display-p3",ks="display-p3-linear",Ls="linear",ee="srgb",Ds="rec709",Is="p3",Yn=7680,Jo=519,jc=512,Kc=513,Zc=514,El=515,Jc=516,Qc=517,th=518,eh=519,Qo=35044,ta="300 es",rn=2e3,Us=2001;class Wn{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;const n=this._listeners;return n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;const s=this._listeners[t];if(s!==void 0){const r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){if(this._listeners===void 0)return;const n=this._listeners[t.type];if(n!==void 0){t.target=this;const s=n.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,t);t.target=null}}}const ge=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],ws=Math.PI/180,vo=180/Math.PI;function ki(){const i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(ge[i&255]+ge[i>>8&255]+ge[i>>16&255]+ge[i>>24&255]+"-"+ge[t&255]+ge[t>>8&255]+"-"+ge[t>>16&15|64]+ge[t>>24&255]+"-"+ge[e&63|128]+ge[e>>8&255]+"-"+ge[e>>16&255]+ge[e>>24&255]+ge[n&255]+ge[n>>8&255]+ge[n>>16&255]+ge[n>>24&255]).toLowerCase()}function ye(i,t,e){return Math.max(t,Math.min(e,i))}function nh(i,t){return(i%t+t)%t}function Ks(i,t,e){return(1-e)*i+e*t}function Ti(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function Ee(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}const ih={DEG2RAD:ws};class Rt{constructor(t=0,e=0){Rt.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(ye(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,o=this.y-t.y;return this.x=r*n-o*s+t.x,this.y=r*s+o*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Dt{constructor(t,e,n,s,r,o,a,l,c){Dt.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,o,a,l,c)}set(t,e,n,s,r,o,a,l,c){const d=this.elements;return d[0]=t,d[1]=s,d[2]=a,d[3]=e,d[4]=r,d[5]=l,d[6]=n,d[7]=o,d[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,r=this.elements,o=n[0],a=n[3],l=n[6],c=n[1],d=n[4],h=n[7],f=n[2],m=n[5],g=n[8],v=s[0],p=s[3],u=s[6],S=s[1],M=s[4],x=s[7],C=s[2],A=s[5],T=s[8];return r[0]=o*v+a*S+l*C,r[3]=o*p+a*M+l*A,r[6]=o*u+a*x+l*T,r[1]=c*v+d*S+h*C,r[4]=c*p+d*M+h*A,r[7]=c*u+d*x+h*T,r[2]=f*v+m*S+g*C,r[5]=f*p+m*M+g*A,r[8]=f*u+m*x+g*T,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],d=t[8];return e*o*d-e*a*c-n*r*d+n*a*l+s*r*c-s*o*l}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],d=t[8],h=d*o-a*c,f=a*l-d*r,m=c*r-o*l,g=e*h+n*f+s*m;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const v=1/g;return t[0]=h*v,t[1]=(s*c-d*n)*v,t[2]=(a*n-s*o)*v,t[3]=f*v,t[4]=(d*e-s*l)*v,t[5]=(s*r-a*e)*v,t[6]=m*v,t[7]=(n*l-c*e)*v,t[8]=(o*e-n*r)*v,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,o,a){const l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*o+c*a)+o+t,-s*c,s*l,-s*(-c*o+l*a)+a+e,0,0,1),this}scale(t,e){return this.premultiply(Zs.makeScale(t,e)),this}rotate(t){return this.premultiply(Zs.makeRotation(-t)),this}translate(t,e){return this.premultiply(Zs.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const Zs=new Dt;function bl(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function Ns(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function sh(){const i=Ns("canvas");return i.style.display="block",i}const ea={};function Cs(i){i in ea||(ea[i]=!0,console.warn(i))}function rh(i,t,e){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}function oh(i){const t=i.elements;t[2]=.5*t[2]+.5*t[3],t[6]=.5*t[6]+.5*t[7],t[10]=.5*t[10]+.5*t[11],t[14]=.5*t[14]+.5*t[15]}function ah(i){const t=i.elements;t[11]===-1?(t[10]=-t[10]-1,t[14]=-t[14]):(t[10]=-t[10],t[14]=-t[14]+1)}const na=new Dt().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),ia=new Dt().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),Ai={[En]:{transfer:Ls,primaries:Ds,luminanceCoefficients:[.2126,.7152,.0722],toReference:i=>i,fromReference:i=>i},[Ge]:{transfer:ee,primaries:Ds,luminanceCoefficients:[.2126,.7152,.0722],toReference:i=>i.convertSRGBToLinear(),fromReference:i=>i.convertLinearToSRGB()},[ks]:{transfer:Ls,primaries:Is,luminanceCoefficients:[.2289,.6917,.0793],toReference:i=>i.applyMatrix3(ia),fromReference:i=>i.applyMatrix3(na)},[Io]:{transfer:ee,primaries:Is,luminanceCoefficients:[.2289,.6917,.0793],toReference:i=>i.convertSRGBToLinear().applyMatrix3(ia),fromReference:i=>i.applyMatrix3(na).convertLinearToSRGB()}},lh=new Set([En,ks]),$t={enabled:!0,_workingColorSpace:En,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(i){if(!lh.has(i))throw new Error(`Unsupported working color space, "${i}".`);this._workingColorSpace=i},convert:function(i,t,e){if(this.enabled===!1||t===e||!t||!e)return i;const n=Ai[t].toReference,s=Ai[e].fromReference;return s(n(i))},fromWorkingColorSpace:function(i,t){return this.convert(i,this._workingColorSpace,t)},toWorkingColorSpace:function(i,t){return this.convert(i,t,this._workingColorSpace)},getPrimaries:function(i){return Ai[i].primaries},getTransfer:function(i){return i===_n?Ls:Ai[i].transfer},getLuminanceCoefficients:function(i,t=this._workingColorSpace){return i.fromArray(Ai[t].luminanceCoefficients)}};function mi(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Js(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}let qn;class ch{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{qn===void 0&&(qn=Ns("canvas")),qn.width=t.width,qn.height=t.height;const n=qn.getContext("2d");t instanceof ImageData?n.putImageData(t,0,0):n.drawImage(t,0,0,t.width,t.height),e=qn}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=Ns("canvas");e.width=t.width,e.height=t.height;const n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);const s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=mi(r[o]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){const e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(mi(e[n]/255)*255):e[n]=mi(e[n]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let hh=0;class Tl{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:hh++}),this.uuid=ki(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(Qs(s[o].image)):r.push(Qs(s[o]))}else r=Qs(s);n.url=r}return e||(t.images[this.uuid]=n),n}}function Qs(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?ch.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let uh=0;class Ae extends Wn{constructor(t=Ae.DEFAULT_IMAGE,e=Ae.DEFAULT_MAPPING,n=Un,s=Un,r=Ve,o=Nn,a=Xe,l=on,c=Ae.DEFAULT_ANISOTROPY,d=_n){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:uh++}),this.uuid=ki(),this.name="",this.source=new Tl(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new Rt(0,0),this.repeat=new Rt(1,1),this.center=new Rt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Dt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=d,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==ul)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Vr:t.x=t.x-Math.floor(t.x);break;case Un:t.x=t.x<0?0:1;break;case Wr:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Vr:t.y=t.y-Math.floor(t.y);break;case Un:t.y=t.y<0?0:1;break;case Wr:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}Ae.DEFAULT_IMAGE=null;Ae.DEFAULT_MAPPING=ul;Ae.DEFAULT_ANISOTROPY=1;class re{constructor(t=0,e=0,n=0,s=1){re.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,r=this.w,o=t.elements;return this.x=o[0]*e+o[4]*n+o[8]*s+o[12]*r,this.y=o[1]*e+o[5]*n+o[9]*s+o[13]*r,this.z=o[2]*e+o[6]*n+o[10]*s+o[14]*r,this.w=o[3]*e+o[7]*n+o[11]*s+o[15]*r,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r;const l=t.elements,c=l[0],d=l[4],h=l[8],f=l[1],m=l[5],g=l[9],v=l[2],p=l[6],u=l[10];if(Math.abs(d-f)<.01&&Math.abs(h-v)<.01&&Math.abs(g-p)<.01){if(Math.abs(d+f)<.1&&Math.abs(h+v)<.1&&Math.abs(g+p)<.1&&Math.abs(c+m+u-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const M=(c+1)/2,x=(m+1)/2,C=(u+1)/2,A=(d+f)/4,T=(h+v)/4,P=(g+p)/4;return M>x&&M>C?M<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(M),s=A/n,r=T/n):x>C?x<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(x),n=A/s,r=P/s):C<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(C),n=T/r,s=P/r),this.set(n,s,r,e),this}let S=Math.sqrt((p-g)*(p-g)+(h-v)*(h-v)+(f-d)*(f-d));return Math.abs(S)<.001&&(S=1),this.x=(p-g)/S,this.y=(h-v)/S,this.z=(f-d)/S,this.w=Math.acos((c+m+u-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class dh extends Wn{constructor(t=1,e=1,n={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new re(0,0,t,e),this.scissorTest=!1,this.viewport=new re(0,0,t,e);const s={width:t,height:e,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Ve,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);const r=new Ae(s,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);r.flipY=!1,r.generateMipmaps=n.generateMipmaps,r.internalFormat=n.internalFormat,this.textures=[];const o=n.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,s=t.textures.length;n<s;n++)this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;const e=Object.assign({},t.texture.image);return this.texture.source=new Tl(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Gn extends dh{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}}class Al extends Ae{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=Oe,this.minFilter=Oe,this.wrapR=Un,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class fh extends Ae{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=Oe,this.minFilter=Oe,this.wrapR=Un,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Vn{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,o,a){let l=n[s+0],c=n[s+1],d=n[s+2],h=n[s+3];const f=r[o+0],m=r[o+1],g=r[o+2],v=r[o+3];if(a===0){t[e+0]=l,t[e+1]=c,t[e+2]=d,t[e+3]=h;return}if(a===1){t[e+0]=f,t[e+1]=m,t[e+2]=g,t[e+3]=v;return}if(h!==v||l!==f||c!==m||d!==g){let p=1-a;const u=l*f+c*m+d*g+h*v,S=u>=0?1:-1,M=1-u*u;if(M>Number.EPSILON){const C=Math.sqrt(M),A=Math.atan2(C,u*S);p=Math.sin(p*A)/C,a=Math.sin(a*A)/C}const x=a*S;if(l=l*p+f*x,c=c*p+m*x,d=d*p+g*x,h=h*p+v*x,p===1-a){const C=1/Math.sqrt(l*l+c*c+d*d+h*h);l*=C,c*=C,d*=C,h*=C}}t[e]=l,t[e+1]=c,t[e+2]=d,t[e+3]=h}static multiplyQuaternionsFlat(t,e,n,s,r,o){const a=n[s],l=n[s+1],c=n[s+2],d=n[s+3],h=r[o],f=r[o+1],m=r[o+2],g=r[o+3];return t[e]=a*g+d*h+l*m-c*f,t[e+1]=l*g+d*f+c*h-a*m,t[e+2]=c*g+d*m+a*f-l*h,t[e+3]=d*g-a*h-l*f-c*m,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const n=t._x,s=t._y,r=t._z,o=t._order,a=Math.cos,l=Math.sin,c=a(n/2),d=a(s/2),h=a(r/2),f=l(n/2),m=l(s/2),g=l(r/2);switch(o){case"XYZ":this._x=f*d*h+c*m*g,this._y=c*m*h-f*d*g,this._z=c*d*g+f*m*h,this._w=c*d*h-f*m*g;break;case"YXZ":this._x=f*d*h+c*m*g,this._y=c*m*h-f*d*g,this._z=c*d*g-f*m*h,this._w=c*d*h+f*m*g;break;case"ZXY":this._x=f*d*h-c*m*g,this._y=c*m*h+f*d*g,this._z=c*d*g+f*m*h,this._w=c*d*h-f*m*g;break;case"ZYX":this._x=f*d*h-c*m*g,this._y=c*m*h+f*d*g,this._z=c*d*g-f*m*h,this._w=c*d*h+f*m*g;break;case"YZX":this._x=f*d*h+c*m*g,this._y=c*m*h+f*d*g,this._z=c*d*g-f*m*h,this._w=c*d*h-f*m*g;break;case"XZY":this._x=f*d*h-c*m*g,this._y=c*m*h-f*d*g,this._z=c*d*g+f*m*h,this._w=c*d*h+f*m*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,n=e[0],s=e[4],r=e[8],o=e[1],a=e[5],l=e[9],c=e[2],d=e[6],h=e[10],f=n+a+h;if(f>0){const m=.5/Math.sqrt(f+1);this._w=.25/m,this._x=(d-l)*m,this._y=(r-c)*m,this._z=(o-s)*m}else if(n>a&&n>h){const m=2*Math.sqrt(1+n-a-h);this._w=(d-l)/m,this._x=.25*m,this._y=(s+o)/m,this._z=(r+c)/m}else if(a>h){const m=2*Math.sqrt(1+a-n-h);this._w=(r-c)/m,this._x=(s+o)/m,this._y=.25*m,this._z=(l+d)/m}else{const m=2*Math.sqrt(1+h-n-a);this._w=(o-s)/m,this._x=(r+c)/m,this._y=(l+d)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<Number.EPSILON?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(ye(this.dot(t),-1,1)))}rotateTowards(t,e){const n=this.angleTo(t);if(n===0)return this;const s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const n=t._x,s=t._y,r=t._z,o=t._w,a=e._x,l=e._y,c=e._z,d=e._w;return this._x=n*d+o*a+s*c-r*l,this._y=s*d+o*l+r*a-n*c,this._z=r*d+o*c+n*l-s*a,this._w=o*d-n*a-s*l-r*c,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);const n=this._x,s=this._y,r=this._z,o=this._w;let a=o*t._w+n*t._x+s*t._y+r*t._z;if(a<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,a=-a):this.copy(t),a>=1)return this._w=o,this._x=n,this._y=s,this._z=r,this;const l=1-a*a;if(l<=Number.EPSILON){const m=1-e;return this._w=m*o+e*this._w,this._x=m*n+e*this._x,this._y=m*s+e*this._y,this._z=m*r+e*this._z,this.normalize(),this}const c=Math.sqrt(l),d=Math.atan2(c,a),h=Math.sin((1-e)*d)/c,f=Math.sin(e*d)/c;return this._w=o*h+this._w*f,this._x=n*h+this._x*f,this._y=s*h+this._y*f,this._z=r*h+this._z*f,this._onChangeCallback(),this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class U{constructor(t=0,e=0,n=0){U.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(sa.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(sa.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,r=t.elements,o=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*o,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*o,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*o,this}applyQuaternion(t){const e=this.x,n=this.y,s=this.z,r=t.x,o=t.y,a=t.z,l=t.w,c=2*(o*s-a*n),d=2*(a*e-r*s),h=2*(r*n-o*e);return this.x=e+l*c+o*h-a*d,this.y=n+l*d+a*c-r*h,this.z=s+l*h+r*d-o*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const n=t.x,s=t.y,r=t.z,o=e.x,a=e.y,l=e.z;return this.x=s*l-r*a,this.y=r*o-n*l,this.z=n*a-s*o,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return tr.copy(this).projectOnVector(t),this.sub(tr)}reflect(t){return this.sub(tr.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(ye(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){const s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const tr=new U,sa=new Vn;class zi{constructor(t=new U(1/0,1/0,1/0),e=new U(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(ke.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(ke.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=ke.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const n=t.geometry;if(n!==void 0){const r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)t.isMesh===!0?t.getVertexPosition(o,ke):ke.fromBufferAttribute(r,o),ke.applyMatrix4(t.matrixWorld),this.expandByPoint(ke);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),qi.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),qi.copy(n.boundingBox)),qi.applyMatrix4(t.matrixWorld),this.union(qi)}const s=t.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,ke),ke.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(wi),ji.subVectors(this.max,wi),jn.subVectors(t.a,wi),Kn.subVectors(t.b,wi),Zn.subVectors(t.c,wi),ln.subVectors(Kn,jn),cn.subVectors(Zn,Kn),Tn.subVectors(jn,Zn);let e=[0,-ln.z,ln.y,0,-cn.z,cn.y,0,-Tn.z,Tn.y,ln.z,0,-ln.x,cn.z,0,-cn.x,Tn.z,0,-Tn.x,-ln.y,ln.x,0,-cn.y,cn.x,0,-Tn.y,Tn.x,0];return!er(e,jn,Kn,Zn,ji)||(e=[1,0,0,0,1,0,0,0,1],!er(e,jn,Kn,Zn,ji))?!1:(Ki.crossVectors(ln,cn),e=[Ki.x,Ki.y,Ki.z],er(e,jn,Kn,Zn,ji))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,ke).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(ke).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Ke[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Ke[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Ke[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Ke[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Ke[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Ke[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Ke[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Ke[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Ke),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}}const Ke=[new U,new U,new U,new U,new U,new U,new U,new U],ke=new U,qi=new zi,jn=new U,Kn=new U,Zn=new U,ln=new U,cn=new U,Tn=new U,wi=new U,ji=new U,Ki=new U,An=new U;function er(i,t,e,n,s){for(let r=0,o=i.length-3;r<=o;r+=3){An.fromArray(i,r);const a=s.x*Math.abs(An.x)+s.y*Math.abs(An.y)+s.z*Math.abs(An.z),l=t.dot(An),c=e.dot(An),d=n.dot(An);if(Math.max(-Math.max(l,c,d),Math.min(l,c,d))>a)return!1}return!0}const ph=new zi,Ci=new U,nr=new U;class zs{constructor(t=new U,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const n=this.center;e!==void 0?n.copy(e):ph.setFromPoints(t).getCenter(n);let s=0;for(let r=0,o=t.length;r<o;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Ci.subVectors(t,this.center);const e=Ci.lengthSq();if(e>this.radius*this.radius){const n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(Ci,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(nr.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Ci.copy(t.center).add(nr)),this.expandByPoint(Ci.copy(t.center).sub(nr))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}}const Ze=new U,ir=new U,Zi=new U,hn=new U,sr=new U,Ji=new U,rr=new U;class Hs{constructor(t=new U,e=new U(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,Ze)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=Ze.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(Ze.copy(this.origin).addScaledVector(this.direction,e),Ze.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){ir.copy(t).add(e).multiplyScalar(.5),Zi.copy(e).sub(t).normalize(),hn.copy(this.origin).sub(ir);const r=t.distanceTo(e)*.5,o=-this.direction.dot(Zi),a=hn.dot(this.direction),l=-hn.dot(Zi),c=hn.lengthSq(),d=Math.abs(1-o*o);let h,f,m,g;if(d>0)if(h=o*l-a,f=o*a-l,g=r*d,h>=0)if(f>=-g)if(f<=g){const v=1/d;h*=v,f*=v,m=h*(h+o*f+2*a)+f*(o*h+f+2*l)+c}else f=r,h=Math.max(0,-(o*f+a)),m=-h*h+f*(f+2*l)+c;else f=-r,h=Math.max(0,-(o*f+a)),m=-h*h+f*(f+2*l)+c;else f<=-g?(h=Math.max(0,-(-o*r+a)),f=h>0?-r:Math.min(Math.max(-r,-l),r),m=-h*h+f*(f+2*l)+c):f<=g?(h=0,f=Math.min(Math.max(-r,-l),r),m=f*(f+2*l)+c):(h=Math.max(0,-(o*r+a)),f=h>0?r:Math.min(Math.max(-r,-l),r),m=-h*h+f*(f+2*l)+c);else f=o>0?-r:r,h=Math.max(0,-(o*f+a)),m=-h*h+f*(f+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,h),s&&s.copy(ir).addScaledVector(Zi,f),m}intersectSphere(t,e){Ze.subVectors(t.center,this.origin);const n=Ze.dot(this.direction),s=Ze.dot(Ze)-n*n,r=t.radius*t.radius;if(s>r)return null;const o=Math.sqrt(r-s),a=n-o,l=n+o;return l<0?null:a<0?this.at(l,e):this.at(a,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){const n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,o,a,l;const c=1/this.direction.x,d=1/this.direction.y,h=1/this.direction.z,f=this.origin;return c>=0?(n=(t.min.x-f.x)*c,s=(t.max.x-f.x)*c):(n=(t.max.x-f.x)*c,s=(t.min.x-f.x)*c),d>=0?(r=(t.min.y-f.y)*d,o=(t.max.y-f.y)*d):(r=(t.max.y-f.y)*d,o=(t.min.y-f.y)*d),n>o||r>s||((r>n||isNaN(n))&&(n=r),(o<s||isNaN(s))&&(s=o),h>=0?(a=(t.min.z-f.z)*h,l=(t.max.z-f.z)*h):(a=(t.max.z-f.z)*h,l=(t.min.z-f.z)*h),n>l||a>s)||((a>n||n!==n)&&(n=a),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,Ze)!==null}intersectTriangle(t,e,n,s,r){sr.subVectors(e,t),Ji.subVectors(n,t),rr.crossVectors(sr,Ji);let o=this.direction.dot(rr),a;if(o>0){if(s)return null;a=1}else if(o<0)a=-1,o=-o;else return null;hn.subVectors(this.origin,t);const l=a*this.direction.dot(Ji.crossVectors(hn,Ji));if(l<0)return null;const c=a*this.direction.dot(sr.cross(hn));if(c<0||l+c>o)return null;const d=-a*hn.dot(rr);return d<0?null:this.at(d/o,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class ie{constructor(t,e,n,s,r,o,a,l,c,d,h,f,m,g,v,p){ie.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,o,a,l,c,d,h,f,m,g,v,p)}set(t,e,n,s,r,o,a,l,c,d,h,f,m,g,v,p){const u=this.elements;return u[0]=t,u[4]=e,u[8]=n,u[12]=s,u[1]=r,u[5]=o,u[9]=a,u[13]=l,u[2]=c,u[6]=d,u[10]=h,u[14]=f,u[3]=m,u[7]=g,u[11]=v,u[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new ie().fromArray(this.elements)}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){const e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){const e=this.elements,n=t.elements,s=1/Jn.setFromMatrixColumn(t,0).length(),r=1/Jn.setFromMatrixColumn(t,1).length(),o=1/Jn.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*o,e[9]=n[9]*o,e[10]=n[10]*o,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,n=t.x,s=t.y,r=t.z,o=Math.cos(n),a=Math.sin(n),l=Math.cos(s),c=Math.sin(s),d=Math.cos(r),h=Math.sin(r);if(t.order==="XYZ"){const f=o*d,m=o*h,g=a*d,v=a*h;e[0]=l*d,e[4]=-l*h,e[8]=c,e[1]=m+g*c,e[5]=f-v*c,e[9]=-a*l,e[2]=v-f*c,e[6]=g+m*c,e[10]=o*l}else if(t.order==="YXZ"){const f=l*d,m=l*h,g=c*d,v=c*h;e[0]=f+v*a,e[4]=g*a-m,e[8]=o*c,e[1]=o*h,e[5]=o*d,e[9]=-a,e[2]=m*a-g,e[6]=v+f*a,e[10]=o*l}else if(t.order==="ZXY"){const f=l*d,m=l*h,g=c*d,v=c*h;e[0]=f-v*a,e[4]=-o*h,e[8]=g+m*a,e[1]=m+g*a,e[5]=o*d,e[9]=v-f*a,e[2]=-o*c,e[6]=a,e[10]=o*l}else if(t.order==="ZYX"){const f=o*d,m=o*h,g=a*d,v=a*h;e[0]=l*d,e[4]=g*c-m,e[8]=f*c+v,e[1]=l*h,e[5]=v*c+f,e[9]=m*c-g,e[2]=-c,e[6]=a*l,e[10]=o*l}else if(t.order==="YZX"){const f=o*l,m=o*c,g=a*l,v=a*c;e[0]=l*d,e[4]=v-f*h,e[8]=g*h+m,e[1]=h,e[5]=o*d,e[9]=-a*d,e[2]=-c*d,e[6]=m*h+g,e[10]=f-v*h}else if(t.order==="XZY"){const f=o*l,m=o*c,g=a*l,v=a*c;e[0]=l*d,e[4]=-h,e[8]=c*d,e[1]=f*h+v,e[5]=o*d,e[9]=m*h-g,e[2]=g*h-m,e[6]=a*d,e[10]=v*h+f}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(mh,t,gh)}lookAt(t,e,n){const s=this.elements;return Le.subVectors(t,e),Le.lengthSq()===0&&(Le.z=1),Le.normalize(),un.crossVectors(n,Le),un.lengthSq()===0&&(Math.abs(n.z)===1?Le.x+=1e-4:Le.z+=1e-4,Le.normalize(),un.crossVectors(n,Le)),un.normalize(),Qi.crossVectors(Le,un),s[0]=un.x,s[4]=Qi.x,s[8]=Le.x,s[1]=un.y,s[5]=Qi.y,s[9]=Le.y,s[2]=un.z,s[6]=Qi.z,s[10]=Le.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,r=this.elements,o=n[0],a=n[4],l=n[8],c=n[12],d=n[1],h=n[5],f=n[9],m=n[13],g=n[2],v=n[6],p=n[10],u=n[14],S=n[3],M=n[7],x=n[11],C=n[15],A=s[0],T=s[4],P=s[8],V=s[12],_=s[1],b=s[5],k=s[9],B=s[13],W=s[2],K=s[6],G=s[10],j=s[14],z=s[3],it=s[7],at=s[11],st=s[15];return r[0]=o*A+a*_+l*W+c*z,r[4]=o*T+a*b+l*K+c*it,r[8]=o*P+a*k+l*G+c*at,r[12]=o*V+a*B+l*j+c*st,r[1]=d*A+h*_+f*W+m*z,r[5]=d*T+h*b+f*K+m*it,r[9]=d*P+h*k+f*G+m*at,r[13]=d*V+h*B+f*j+m*st,r[2]=g*A+v*_+p*W+u*z,r[6]=g*T+v*b+p*K+u*it,r[10]=g*P+v*k+p*G+u*at,r[14]=g*V+v*B+p*j+u*st,r[3]=S*A+M*_+x*W+C*z,r[7]=S*T+M*b+x*K+C*it,r[11]=S*P+M*k+x*G+C*at,r[15]=S*V+M*B+x*j+C*st,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],o=t[1],a=t[5],l=t[9],c=t[13],d=t[2],h=t[6],f=t[10],m=t[14],g=t[3],v=t[7],p=t[11],u=t[15];return g*(+r*l*h-s*c*h-r*a*f+n*c*f+s*a*m-n*l*m)+v*(+e*l*m-e*c*f+r*o*f-s*o*m+s*c*d-r*l*d)+p*(+e*c*h-e*a*m-r*o*h+n*o*m+r*a*d-n*c*d)+u*(-s*a*d-e*l*h+e*a*f+s*o*h-n*o*f+n*l*d)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){const s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],d=t[8],h=t[9],f=t[10],m=t[11],g=t[12],v=t[13],p=t[14],u=t[15],S=h*p*c-v*f*c+v*l*m-a*p*m-h*l*u+a*f*u,M=g*f*c-d*p*c-g*l*m+o*p*m+d*l*u-o*f*u,x=d*v*c-g*h*c+g*a*m-o*v*m-d*a*u+o*h*u,C=g*h*l-d*v*l-g*a*f+o*v*f+d*a*p-o*h*p,A=e*S+n*M+s*x+r*C;if(A===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const T=1/A;return t[0]=S*T,t[1]=(v*f*r-h*p*r-v*s*m+n*p*m+h*s*u-n*f*u)*T,t[2]=(a*p*r-v*l*r+v*s*c-n*p*c-a*s*u+n*l*u)*T,t[3]=(h*l*r-a*f*r-h*s*c+n*f*c+a*s*m-n*l*m)*T,t[4]=M*T,t[5]=(d*p*r-g*f*r+g*s*m-e*p*m-d*s*u+e*f*u)*T,t[6]=(g*l*r-o*p*r-g*s*c+e*p*c+o*s*u-e*l*u)*T,t[7]=(o*f*r-d*l*r+d*s*c-e*f*c-o*s*m+e*l*m)*T,t[8]=x*T,t[9]=(g*h*r-d*v*r-g*n*m+e*v*m+d*n*u-e*h*u)*T,t[10]=(o*v*r-g*a*r+g*n*c-e*v*c-o*n*u+e*a*u)*T,t[11]=(d*a*r-o*h*r-d*n*c+e*h*c+o*n*m-e*a*m)*T,t[12]=C*T,t[13]=(d*v*s-g*h*s+g*n*f-e*v*f-d*n*p+e*h*p)*T,t[14]=(g*a*s-o*v*s-g*n*l+e*v*l+o*n*p-e*a*p)*T,t[15]=(o*h*s-d*a*s+d*n*l-e*h*l-o*n*f+e*a*f)*T,this}scale(t){const e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const n=Math.cos(e),s=Math.sin(e),r=1-n,o=t.x,a=t.y,l=t.z,c=r*o,d=r*a;return this.set(c*o+n,c*a-s*l,c*l+s*a,0,c*a+s*l,d*a+n,d*l-s*o,0,c*l-s*a,d*l+s*o,r*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,o){return this.set(1,n,r,0,t,1,o,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){const s=this.elements,r=e._x,o=e._y,a=e._z,l=e._w,c=r+r,d=o+o,h=a+a,f=r*c,m=r*d,g=r*h,v=o*d,p=o*h,u=a*h,S=l*c,M=l*d,x=l*h,C=n.x,A=n.y,T=n.z;return s[0]=(1-(v+u))*C,s[1]=(m+x)*C,s[2]=(g-M)*C,s[3]=0,s[4]=(m-x)*A,s[5]=(1-(f+u))*A,s[6]=(p+S)*A,s[7]=0,s[8]=(g+M)*T,s[9]=(p-S)*T,s[10]=(1-(f+v))*T,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){const s=this.elements;let r=Jn.set(s[0],s[1],s[2]).length();const o=Jn.set(s[4],s[5],s[6]).length(),a=Jn.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),t.x=s[12],t.y=s[13],t.z=s[14],ze.copy(this);const c=1/r,d=1/o,h=1/a;return ze.elements[0]*=c,ze.elements[1]*=c,ze.elements[2]*=c,ze.elements[4]*=d,ze.elements[5]*=d,ze.elements[6]*=d,ze.elements[8]*=h,ze.elements[9]*=h,ze.elements[10]*=h,e.setFromRotationMatrix(ze),n.x=r,n.y=o,n.z=a,this}makePerspective(t,e,n,s,r,o,a=rn){const l=this.elements,c=2*r/(e-t),d=2*r/(n-s),h=(e+t)/(e-t),f=(n+s)/(n-s);let m,g;if(a===rn)m=-(o+r)/(o-r),g=-2*o*r/(o-r);else if(a===Us)m=-o/(o-r),g=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=c,l[4]=0,l[8]=h,l[12]=0,l[1]=0,l[5]=d,l[9]=f,l[13]=0,l[2]=0,l[6]=0,l[10]=m,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,s,r,o,a=rn){const l=this.elements,c=1/(e-t),d=1/(n-s),h=1/(o-r),f=(e+t)*c,m=(n+s)*d;let g,v;if(a===rn)g=(o+r)*h,v=-2*h;else if(a===Us)g=r*h,v=-1*h;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-f,l[1]=0,l[5]=2*d,l[9]=0,l[13]=-m,l[2]=0,l[6]=0,l[10]=v,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}}const Jn=new U,ze=new ie,mh=new U(0,0,0),gh=new U(1,1,1),un=new U,Qi=new U,Le=new U,ra=new ie,oa=new Vn;class qe{constructor(t=0,e=0,n=0,s=qe.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){const s=t.elements,r=s[0],o=s[4],a=s[8],l=s[1],c=s[5],d=s[9],h=s[2],f=s[6],m=s[10];switch(e){case"XYZ":this._y=Math.asin(ye(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-d,m),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(f,c),this._z=0);break;case"YXZ":this._x=Math.asin(-ye(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(a,m),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-h,r),this._z=0);break;case"ZXY":this._x=Math.asin(ye(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-h,m),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-ye(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(f,m),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(ye(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-d,c),this._y=Math.atan2(-h,r)):(this._x=0,this._y=Math.atan2(a,m));break;case"XZY":this._z=Math.asin(-ye(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(f,c),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-d,m),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return ra.makeRotationFromQuaternion(t),this.setFromRotationMatrix(ra,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return oa.setFromEuler(this),this.setFromQuaternion(oa,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}qe.DEFAULT_ORDER="XYZ";class Uo{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let _h=0;const aa=new U,Qn=new Vn,Je=new ie,ts=new U,Ri=new U,vh=new U,xh=new Vn,la=new U(1,0,0),ca=new U(0,1,0),ha=new U(0,0,1),ua={type:"added"},yh={type:"removed"},ti={type:"childadded",child:null},or={type:"childremoved",child:null};class pe extends Wn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:_h++}),this.uuid=ki(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=pe.DEFAULT_UP.clone();const t=new U,e=new qe,n=new Vn,s=new U(1,1,1);function r(){n.setFromEuler(e,!1)}function o(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new ie},normalMatrix:{value:new Dt}}),this.matrix=new ie,this.matrixWorld=new ie,this.matrixAutoUpdate=pe.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=pe.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Uo,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return Qn.setFromAxisAngle(t,e),this.quaternion.multiply(Qn),this}rotateOnWorldAxis(t,e){return Qn.setFromAxisAngle(t,e),this.quaternion.premultiply(Qn),this}rotateX(t){return this.rotateOnAxis(la,t)}rotateY(t){return this.rotateOnAxis(ca,t)}rotateZ(t){return this.rotateOnAxis(ha,t)}translateOnAxis(t,e){return aa.copy(t).applyQuaternion(this.quaternion),this.position.add(aa.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(la,t)}translateY(t){return this.translateOnAxis(ca,t)}translateZ(t){return this.translateOnAxis(ha,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(Je.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?ts.copy(t):ts.set(t,e,n);const s=this.parent;this.updateWorldMatrix(!0,!1),Ri.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Je.lookAt(Ri,ts,this.up):Je.lookAt(ts,Ri,this.up),this.quaternion.setFromRotationMatrix(Je),s&&(Je.extractRotation(s.matrixWorld),Qn.setFromRotationMatrix(Je),this.quaternion.premultiply(Qn.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(ua),ti.child=t,this.dispatchEvent(ti),ti.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(yh),or.child=t,this.dispatchEvent(or),or.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),Je.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),Je.multiply(t.parent.matrixWorld)),t.applyMatrix4(Je),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(ua),ti.child=t,this.dispatchEvent(ti),ti.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){const o=this.children[n].getObjectByProperty(t,e);if(o!==void 0)return o}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);const s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ri,t,vh),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ri,xh,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e){const n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){const s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(t){const e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const l=a.shapes;if(Array.isArray(l))for(let c=0,d=l.length;c<d;c++){const h=l[c];r(t.shapes,h)}else r(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(r(t.materials,this.material[l]));s.material=a}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){const l=this.animations[a];s.animations.push(r(t.animations,l))}}if(e){const a=o(t.geometries),l=o(t.materials),c=o(t.textures),d=o(t.images),h=o(t.shapes),f=o(t.skeletons),m=o(t.animations),g=o(t.nodes);a.length>0&&(n.geometries=a),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),d.length>0&&(n.images=d),h.length>0&&(n.shapes=h),f.length>0&&(n.skeletons=f),m.length>0&&(n.animations=m),g.length>0&&(n.nodes=g)}return n.object=s,n;function o(a){const l=[];for(const c in a){const d=a[c];delete d.metadata,l.push(d)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){const s=t.children[n];this.add(s.clone())}return this}}pe.DEFAULT_UP=new U(0,1,0);pe.DEFAULT_MATRIX_AUTO_UPDATE=!0;pe.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const He=new U,Qe=new U,ar=new U,tn=new U,ei=new U,ni=new U,da=new U,lr=new U,cr=new U,hr=new U,ur=new re,dr=new re,fr=new re;class We{constructor(t=new U,e=new U,n=new U){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),He.subVectors(t,e),s.cross(He);const r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){He.subVectors(s,e),Qe.subVectors(n,e),ar.subVectors(t,e);const o=He.dot(He),a=He.dot(Qe),l=He.dot(ar),c=Qe.dot(Qe),d=Qe.dot(ar),h=o*c-a*a;if(h===0)return r.set(0,0,0),null;const f=1/h,m=(c*l-a*d)*f,g=(o*d-a*l)*f;return r.set(1-m-g,g,m)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,tn)===null?!1:tn.x>=0&&tn.y>=0&&tn.x+tn.y<=1}static getInterpolation(t,e,n,s,r,o,a,l){return this.getBarycoord(t,e,n,s,tn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,tn.x),l.addScaledVector(o,tn.y),l.addScaledVector(a,tn.z),l)}static getInterpolatedAttribute(t,e,n,s,r,o){return ur.setScalar(0),dr.setScalar(0),fr.setScalar(0),ur.fromBufferAttribute(t,e),dr.fromBufferAttribute(t,n),fr.fromBufferAttribute(t,s),o.setScalar(0),o.addScaledVector(ur,r.x),o.addScaledVector(dr,r.y),o.addScaledVector(fr,r.z),o}static isFrontFacing(t,e,n,s){return He.subVectors(n,e),Qe.subVectors(t,e),He.cross(Qe).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return He.subVectors(this.c,this.b),Qe.subVectors(this.a,this.b),He.cross(Qe).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return We.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return We.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return We.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return We.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return We.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const n=this.a,s=this.b,r=this.c;let o,a;ei.subVectors(s,n),ni.subVectors(r,n),lr.subVectors(t,n);const l=ei.dot(lr),c=ni.dot(lr);if(l<=0&&c<=0)return e.copy(n);cr.subVectors(t,s);const d=ei.dot(cr),h=ni.dot(cr);if(d>=0&&h<=d)return e.copy(s);const f=l*h-d*c;if(f<=0&&l>=0&&d<=0)return o=l/(l-d),e.copy(n).addScaledVector(ei,o);hr.subVectors(t,r);const m=ei.dot(hr),g=ni.dot(hr);if(g>=0&&m<=g)return e.copy(r);const v=m*c-l*g;if(v<=0&&c>=0&&g<=0)return a=c/(c-g),e.copy(n).addScaledVector(ni,a);const p=d*g-m*h;if(p<=0&&h-d>=0&&m-g>=0)return da.subVectors(r,s),a=(h-d)/(h-d+(m-g)),e.copy(s).addScaledVector(da,a);const u=1/(p+v+f);return o=v*u,a=f*u,e.copy(n).addScaledVector(ei,o).addScaledVector(ni,a)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}const wl={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},dn={h:0,s:0,l:0},es={h:0,s:0,l:0};function pr(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}class Pt{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){const s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Ge){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,$t.toWorkingColorSpace(this,e),this}setRGB(t,e,n,s=$t.workingColorSpace){return this.r=t,this.g=e,this.b=n,$t.toWorkingColorSpace(this,s),this}setHSL(t,e,n,s=$t.workingColorSpace){if(t=nh(t,1),e=ye(e,0,1),n=ye(n,0,1),e===0)this.r=this.g=this.b=n;else{const r=n<=.5?n*(1+e):n+e-n*e,o=2*n-r;this.r=pr(o,r,t+1/3),this.g=pr(o,r,t),this.b=pr(o,r,t-1/3)}return $t.toWorkingColorSpace(this,s),this}setStyle(t,e=Ge){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r;const o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){const r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(o===6)return this.setHex(parseInt(r,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Ge){const n=wl[t.toLowerCase()];return n!==void 0?this.setHex(n,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=mi(t.r),this.g=mi(t.g),this.b=mi(t.b),this}copyLinearToSRGB(t){return this.r=Js(t.r),this.g=Js(t.g),this.b=Js(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Ge){return $t.fromWorkingColorSpace(_e.copy(this),t),Math.round(ye(_e.r*255,0,255))*65536+Math.round(ye(_e.g*255,0,255))*256+Math.round(ye(_e.b*255,0,255))}getHexString(t=Ge){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=$t.workingColorSpace){$t.fromWorkingColorSpace(_e.copy(this),e);const n=_e.r,s=_e.g,r=_e.b,o=Math.max(n,s,r),a=Math.min(n,s,r);let l,c;const d=(a+o)/2;if(a===o)l=0,c=0;else{const h=o-a;switch(c=d<=.5?h/(o+a):h/(2-o-a),o){case n:l=(s-r)/h+(s<r?6:0);break;case s:l=(r-n)/h+2;break;case r:l=(n-s)/h+4;break}l/=6}return t.h=l,t.s=c,t.l=d,t}getRGB(t,e=$t.workingColorSpace){return $t.fromWorkingColorSpace(_e.copy(this),e),t.r=_e.r,t.g=_e.g,t.b=_e.b,t}getStyle(t=Ge){$t.fromWorkingColorSpace(_e.copy(this),t);const e=_e.r,n=_e.g,s=_e.b;return t!==Ge?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(dn),this.setHSL(dn.h+t,dn.s+e,dn.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(dn),t.getHSL(es);const n=Ks(dn.h,es.h,e),s=Ks(dn.s,es.s,e),r=Ks(dn.l,es.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const _e=new Pt;Pt.NAMES=wl;let Mh=0;class Ei extends Wn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Mh++}),this.uuid=ki(),this.name="",this.type="Material",this.blending=fi,this.side=yn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Dr,this.blendDst=Ir,this.blendEquation=Dn,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Pt(0,0,0),this.blendAlpha=0,this.depthFunc=gi,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Jo,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Yn,this.stencilZFail=Yn,this.stencilZPass=Yn,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const n=t[e];if(n===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}const s=this[e];if(s===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==fi&&(n.blending=this.blending),this.side!==yn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Dr&&(n.blendSrc=this.blendSrc),this.blendDst!==Ir&&(n.blendDst=this.blendDst),this.blendEquation!==Dn&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==gi&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Jo&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Yn&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Yn&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Yn&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){const o=[];for(const a in r){const l=r[a];delete l.metadata,o.push(l)}return o}if(e){const r=s(t.textures),o=s(t.images);r.length>0&&(n.textures=r),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let n=null;if(e!==null){const s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}}class Cl extends Ei{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Pt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new qe,this.combine=hl,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const le=new U,ns=new Rt;class ve{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=Qo,this.updateRanges=[],this.gpuType=sn,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)ns.fromBufferAttribute(this,e),ns.applyMatrix3(t),this.setXY(e,ns.x,ns.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)le.fromBufferAttribute(this,e),le.applyMatrix3(t),this.setXYZ(e,le.x,le.y,le.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)le.fromBufferAttribute(this,e),le.applyMatrix4(t),this.setXYZ(e,le.x,le.y,le.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)le.fromBufferAttribute(this,e),le.applyNormalMatrix(t),this.setXYZ(e,le.x,le.y,le.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)le.fromBufferAttribute(this,e),le.transformDirection(t),this.setXYZ(e,le.x,le.y,le.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=Ti(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=Ee(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=Ti(e,this.array)),e}setX(t,e){return this.normalized&&(e=Ee(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=Ti(e,this.array)),e}setY(t,e){return this.normalized&&(e=Ee(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=Ti(e,this.array)),e}setZ(t,e){return this.normalized&&(e=Ee(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=Ti(e,this.array)),e}setW(t,e){return this.normalized&&(e=Ee(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=Ee(e,this.array),n=Ee(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=Ee(e,this.array),n=Ee(n,this.array),s=Ee(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=Ee(e,this.array),n=Ee(n,this.array),s=Ee(s,this.array),r=Ee(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==Qo&&(t.usage=this.usage),t}}class Rl extends ve{constructor(t,e,n){super(new Uint16Array(t),e,n)}}class Pl extends ve{constructor(t,e,n){super(new Uint32Array(t),e,n)}}class we extends ve{constructor(t,e,n){super(new Float32Array(t),e,n)}}let Sh=0;const Ue=new ie,mr=new pe,ii=new U,De=new zi,Pi=new zi,de=new U;class fe extends Wn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Sh++}),this.uuid=ki(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(bl(t)?Pl:Rl)(t,1):this.index=t,this}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const r=new Dt().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}const s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return Ue.makeRotationFromQuaternion(t),this.applyMatrix4(Ue),this}rotateX(t){return Ue.makeRotationX(t),this.applyMatrix4(Ue),this}rotateY(t){return Ue.makeRotationY(t),this.applyMatrix4(Ue),this}rotateZ(t){return Ue.makeRotationZ(t),this.applyMatrix4(Ue),this}translate(t,e,n){return Ue.makeTranslation(t,e,n),this.applyMatrix4(Ue),this}scale(t,e,n){return Ue.makeScale(t,e,n),this.applyMatrix4(Ue),this}lookAt(t){return mr.lookAt(t),mr.updateMatrix(),this.applyMatrix4(mr.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ii).negate(),this.translate(ii.x,ii.y,ii.z),this}setFromPoints(t){const e=[];for(let n=0,s=t.length;n<s;n++){const r=t[n];e.push(r.x,r.y,r.z||0)}return this.setAttribute("position",new we(e,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new zi);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new U(-1/0,-1/0,-1/0),new U(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){const r=e[n];De.setFromBufferAttribute(r),this.morphTargetsRelative?(de.addVectors(this.boundingBox.min,De.min),this.boundingBox.expandByPoint(de),de.addVectors(this.boundingBox.max,De.max),this.boundingBox.expandByPoint(de)):(this.boundingBox.expandByPoint(De.min),this.boundingBox.expandByPoint(De.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new zs);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new U,1/0);return}if(t){const n=this.boundingSphere.center;if(De.setFromBufferAttribute(t),e)for(let r=0,o=e.length;r<o;r++){const a=e[r];Pi.setFromBufferAttribute(a),this.morphTargetsRelative?(de.addVectors(De.min,Pi.min),De.expandByPoint(de),de.addVectors(De.max,Pi.max),De.expandByPoint(de)):(De.expandByPoint(Pi.min),De.expandByPoint(Pi.max))}De.getCenter(n);let s=0;for(let r=0,o=t.count;r<o;r++)de.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(de));if(e)for(let r=0,o=e.length;r<o;r++){const a=e[r],l=this.morphTargetsRelative;for(let c=0,d=a.count;c<d;c++)de.fromBufferAttribute(a,c),l&&(ii.fromBufferAttribute(t,c),de.add(ii)),s=Math.max(s,n.distanceToSquared(de))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.position,s=e.normal,r=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new ve(new Float32Array(4*n.count),4));const o=this.getAttribute("tangent"),a=[],l=[];for(let P=0;P<n.count;P++)a[P]=new U,l[P]=new U;const c=new U,d=new U,h=new U,f=new Rt,m=new Rt,g=new Rt,v=new U,p=new U;function u(P,V,_){c.fromBufferAttribute(n,P),d.fromBufferAttribute(n,V),h.fromBufferAttribute(n,_),f.fromBufferAttribute(r,P),m.fromBufferAttribute(r,V),g.fromBufferAttribute(r,_),d.sub(c),h.sub(c),m.sub(f),g.sub(f);const b=1/(m.x*g.y-g.x*m.y);isFinite(b)&&(v.copy(d).multiplyScalar(g.y).addScaledVector(h,-m.y).multiplyScalar(b),p.copy(h).multiplyScalar(m.x).addScaledVector(d,-g.x).multiplyScalar(b),a[P].add(v),a[V].add(v),a[_].add(v),l[P].add(p),l[V].add(p),l[_].add(p))}let S=this.groups;S.length===0&&(S=[{start:0,count:t.count}]);for(let P=0,V=S.length;P<V;++P){const _=S[P],b=_.start,k=_.count;for(let B=b,W=b+k;B<W;B+=3)u(t.getX(B+0),t.getX(B+1),t.getX(B+2))}const M=new U,x=new U,C=new U,A=new U;function T(P){C.fromBufferAttribute(s,P),A.copy(C);const V=a[P];M.copy(V),M.sub(C.multiplyScalar(C.dot(V))).normalize(),x.crossVectors(A,V);const b=x.dot(l[P])<0?-1:1;o.setXYZW(P,M.x,M.y,M.z,b)}for(let P=0,V=S.length;P<V;++P){const _=S[P],b=_.start,k=_.count;for(let B=b,W=b+k;B<W;B+=3)T(t.getX(B+0)),T(t.getX(B+1)),T(t.getX(B+2))}}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new ve(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let f=0,m=n.count;f<m;f++)n.setXYZ(f,0,0,0);const s=new U,r=new U,o=new U,a=new U,l=new U,c=new U,d=new U,h=new U;if(t)for(let f=0,m=t.count;f<m;f+=3){const g=t.getX(f+0),v=t.getX(f+1),p=t.getX(f+2);s.fromBufferAttribute(e,g),r.fromBufferAttribute(e,v),o.fromBufferAttribute(e,p),d.subVectors(o,r),h.subVectors(s,r),d.cross(h),a.fromBufferAttribute(n,g),l.fromBufferAttribute(n,v),c.fromBufferAttribute(n,p),a.add(d),l.add(d),c.add(d),n.setXYZ(g,a.x,a.y,a.z),n.setXYZ(v,l.x,l.y,l.z),n.setXYZ(p,c.x,c.y,c.z)}else for(let f=0,m=e.count;f<m;f+=3)s.fromBufferAttribute(e,f+0),r.fromBufferAttribute(e,f+1),o.fromBufferAttribute(e,f+2),d.subVectors(o,r),h.subVectors(s,r),d.cross(h),n.setXYZ(f+0,d.x,d.y,d.z),n.setXYZ(f+1,d.x,d.y,d.z),n.setXYZ(f+2,d.x,d.y,d.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)de.fromBufferAttribute(t,e),de.normalize(),t.setXYZ(e,de.x,de.y,de.z)}toNonIndexed(){function t(a,l){const c=a.array,d=a.itemSize,h=a.normalized,f=new c.constructor(l.length*d);let m=0,g=0;for(let v=0,p=l.length;v<p;v++){a.isInterleavedBufferAttribute?m=l[v]*a.data.stride+a.offset:m=l[v]*d;for(let u=0;u<d;u++)f[g++]=c[m++]}return new ve(f,d,h)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new fe,n=this.index.array,s=this.attributes;for(const a in s){const l=s[a],c=t(l,n);e.setAttribute(a,c)}const r=this.morphAttributes;for(const a in r){const l=[],c=r[a];for(let d=0,h=c.length;d<h;d++){const f=c[d],m=t(f,n);l.push(m)}e.morphAttributes[a]=l}e.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let a=0,l=o.length;a<l;a++){const c=o[a];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){const t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const n=this.attributes;for(const l in n){const c=n[l];t.data.attributes[l]=c.toJSON(t.data)}const s={};let r=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],d=[];for(let h=0,f=c.length;h<f;h++){const m=c[h];d.push(m.toJSON(t.data))}d.length>0&&(s[l]=d,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(t.data.groups=JSON.parse(JSON.stringify(o)));const a=this.boundingSphere;return a!==null&&(t.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const n=t.index;n!==null&&this.setIndex(n.clone(e));const s=t.attributes;for(const c in s){const d=s[c];this.setAttribute(c,d.clone(e))}const r=t.morphAttributes;for(const c in r){const d=[],h=r[c];for(let f=0,m=h.length;f<m;f++)d.push(h[f].clone(e));this.morphAttributes[c]=d}this.morphTargetsRelative=t.morphTargetsRelative;const o=t.groups;for(let c=0,d=o.length;c<d;c++){const h=o[c];this.addGroup(h.start,h.count,h.materialIndex)}const a=t.boundingBox;a!==null&&(this.boundingBox=a.clone());const l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const fa=new ie,wn=new Hs,is=new zs,pa=new U,ss=new U,rs=new U,os=new U,gr=new U,as=new U,ma=new U,ls=new U;class $e extends pe{constructor(t=new fe,e=new Cl){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){const a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(t,e){const n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,o=n.morphTargetsRelative;e.fromBufferAttribute(s,t);const a=this.morphTargetInfluences;if(r&&a){as.set(0,0,0);for(let l=0,c=r.length;l<c;l++){const d=a[l],h=r[l];d!==0&&(gr.fromBufferAttribute(h,t),o?as.addScaledVector(gr,d):as.addScaledVector(gr.sub(e),d))}e.add(as)}return e}raycast(t,e){const n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),is.copy(n.boundingSphere),is.applyMatrix4(r),wn.copy(t.ray).recast(t.near),!(is.containsPoint(wn.origin)===!1&&(wn.intersectSphere(is,pa)===null||wn.origin.distanceToSquared(pa)>(t.far-t.near)**2))&&(fa.copy(r).invert(),wn.copy(t.ray).applyMatrix4(fa),!(n.boundingBox!==null&&wn.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,wn)))}_computeIntersections(t,e,n){let s;const r=this.geometry,o=this.material,a=r.index,l=r.attributes.position,c=r.attributes.uv,d=r.attributes.uv1,h=r.attributes.normal,f=r.groups,m=r.drawRange;if(a!==null)if(Array.isArray(o))for(let g=0,v=f.length;g<v;g++){const p=f[g],u=o[p.materialIndex],S=Math.max(p.start,m.start),M=Math.min(a.count,Math.min(p.start+p.count,m.start+m.count));for(let x=S,C=M;x<C;x+=3){const A=a.getX(x),T=a.getX(x+1),P=a.getX(x+2);s=cs(this,u,t,n,c,d,h,A,T,P),s&&(s.faceIndex=Math.floor(x/3),s.face.materialIndex=p.materialIndex,e.push(s))}}else{const g=Math.max(0,m.start),v=Math.min(a.count,m.start+m.count);for(let p=g,u=v;p<u;p+=3){const S=a.getX(p),M=a.getX(p+1),x=a.getX(p+2);s=cs(this,o,t,n,c,d,h,S,M,x),s&&(s.faceIndex=Math.floor(p/3),e.push(s))}}else if(l!==void 0)if(Array.isArray(o))for(let g=0,v=f.length;g<v;g++){const p=f[g],u=o[p.materialIndex],S=Math.max(p.start,m.start),M=Math.min(l.count,Math.min(p.start+p.count,m.start+m.count));for(let x=S,C=M;x<C;x+=3){const A=x,T=x+1,P=x+2;s=cs(this,u,t,n,c,d,h,A,T,P),s&&(s.faceIndex=Math.floor(x/3),s.face.materialIndex=p.materialIndex,e.push(s))}}else{const g=Math.max(0,m.start),v=Math.min(l.count,m.start+m.count);for(let p=g,u=v;p<u;p+=3){const S=p,M=p+1,x=p+2;s=cs(this,o,t,n,c,d,h,S,M,x),s&&(s.faceIndex=Math.floor(p/3),e.push(s))}}}}function Eh(i,t,e,n,s,r,o,a){let l;if(t.side===Te?l=n.intersectTriangle(o,r,s,!0,a):l=n.intersectTriangle(s,r,o,t.side===yn,a),l===null)return null;ls.copy(a),ls.applyMatrix4(i.matrixWorld);const c=e.ray.origin.distanceTo(ls);return c<e.near||c>e.far?null:{distance:c,point:ls.clone(),object:i}}function cs(i,t,e,n,s,r,o,a,l,c){i.getVertexPosition(a,ss),i.getVertexPosition(l,rs),i.getVertexPosition(c,os);const d=Eh(i,t,e,n,ss,rs,os,ma);if(d){const h=new U;We.getBarycoord(ma,ss,rs,os,h),s&&(d.uv=We.getInterpolatedAttribute(s,a,l,c,h,new Rt)),r&&(d.uv1=We.getInterpolatedAttribute(r,a,l,c,h,new Rt)),o&&(d.normal=We.getInterpolatedAttribute(o,a,l,c,h,new U),d.normal.dot(n.direction)>0&&d.normal.multiplyScalar(-1));const f={a,b:l,c,normal:new U,materialIndex:0};We.getNormal(ss,rs,os,f.normal),d.face=f,d.barycoord=h}return d}class Hi extends fe{constructor(t=1,e=1,n=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:o};const a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);const l=[],c=[],d=[],h=[];let f=0,m=0;g("z","y","x",-1,-1,n,e,t,o,r,0),g("z","y","x",1,-1,n,e,-t,o,r,1),g("x","z","y",1,1,t,n,e,s,o,2),g("x","z","y",1,-1,t,n,-e,s,o,3),g("x","y","z",1,-1,t,e,n,s,r,4),g("x","y","z",-1,-1,t,e,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new we(c,3)),this.setAttribute("normal",new we(d,3)),this.setAttribute("uv",new we(h,2));function g(v,p,u,S,M,x,C,A,T,P,V){const _=x/T,b=C/P,k=x/2,B=C/2,W=A/2,K=T+1,G=P+1;let j=0,z=0;const it=new U;for(let at=0;at<G;at++){const st=at*b-B;for(let It=0;It<K;It++){const qt=It*_-k;it[v]=qt*S,it[p]=st*M,it[u]=W,c.push(it.x,it.y,it.z),it[v]=0,it[p]=0,it[u]=A>0?1:-1,d.push(it.x,it.y,it.z),h.push(It/T),h.push(1-at/P),j+=1}}for(let at=0;at<P;at++)for(let st=0;st<T;st++){const It=f+st+K*at,qt=f+st+K*(at+1),X=f+(st+1)+K*(at+1),J=f+(st+1)+K*at;l.push(It,qt,J),l.push(qt,X,J),z+=6}a.addGroup(m,z,V),m+=z,f+=j}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Hi(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}function Mi(i){const t={};for(const e in i){t[e]={};for(const n in i[e]){const s=i[e][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone():Array.isArray(s)?t[e][n]=s.slice():t[e][n]=s}}return t}function xe(i){const t={};for(let e=0;e<i.length;e++){const n=Mi(i[e]);for(const s in n)t[s]=n[s]}return t}function bh(i){const t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function Ll(i){const t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:$t.workingColorSpace}const Th={clone:Mi,merge:xe};var Ah=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,wh=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Mn extends Ei{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Ah,this.fragmentShader=wh,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Mi(t.uniforms),this.uniformsGroups=bh(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const s in this.uniforms){const o=this.uniforms[s].value;o&&o.isTexture?e.uniforms[s]={type:"t",value:o.toJSON(t).uuid}:o&&o.isColor?e.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?e.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?e.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?e.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?e.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?e.uniforms[s]={type:"m4",value:o.toArray()}:e.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const n={};for(const s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}}class Dl extends pe{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ie,this.projectionMatrix=new ie,this.projectionMatrixInverse=new ie,this.coordinateSystem=rn}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const fn=new U,ga=new Rt,_a=new Rt;class Ne extends Dl{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=vo*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(ws*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return vo*2*Math.atan(Math.tan(ws*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){fn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(fn.x,fn.y).multiplyScalar(-t/fn.z),fn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(fn.x,fn.y).multiplyScalar(-t/fn.z)}getViewSize(t,e){return this.getViewBounds(t,ga,_a),e.subVectors(_a,ga)}setViewOffset(t,e,n,s,r,o){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(ws*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s;const o=this.view;if(this.view!==null&&this.view.enabled){const l=o.fullWidth,c=o.fullHeight;r+=o.offsetX*s/l,e-=o.offsetY*n/c,s*=o.width/l,n*=o.height/c}const a=this.filmOffset;a!==0&&(r+=t*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}const si=-90,ri=1;class Ch extends pe{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const s=new Ne(si,ri,t,e);s.layers=this.layers,this.add(s);const r=new Ne(si,ri,t,e);r.layers=this.layers,this.add(r);const o=new Ne(si,ri,t,e);o.layers=this.layers,this.add(o);const a=new Ne(si,ri,t,e);a.layers=this.layers,this.add(a);const l=new Ne(si,ri,t,e);l.layers=this.layers,this.add(l);const c=new Ne(si,ri,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[n,s,r,o,a,l]=e;for(const c of e)this.remove(c);if(t===rn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===Us)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[r,o,a,l,c,d]=this.children,h=t.getRenderTarget(),f=t.getActiveCubeFace(),m=t.getActiveMipmapLevel(),g=t.xr.enabled;t.xr.enabled=!1;const v=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,t.setRenderTarget(n,0,s),t.render(e,r),t.setRenderTarget(n,1,s),t.render(e,o),t.setRenderTarget(n,2,s),t.render(e,a),t.setRenderTarget(n,3,s),t.render(e,l),t.setRenderTarget(n,4,s),t.render(e,c),n.texture.generateMipmaps=v,t.setRenderTarget(n,5,s),t.render(e,d),t.setRenderTarget(h,f,m),t.xr.enabled=g,n.texture.needsPMREMUpdate=!0}}class Il extends Ae{constructor(t,e,n,s,r,o,a,l,c,d){t=t!==void 0?t:[],e=e!==void 0?e:_i,super(t,e,n,s,r,o,a,l,c,d),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class Rh extends Gn{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new Il(s,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:Ve}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new Hi(5,5,5),r=new Mn({name:"CubemapFromEquirect",uniforms:Mi(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Te,blending:vn});r.uniforms.tEquirect.value=e;const o=new $e(s,r),a=e.minFilter;return e.minFilter===Nn&&(e.minFilter=Ve),new Ch(1,10,this).update(t,o),e.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(t,e,n,s){const r=t.getRenderTarget();for(let o=0;o<6;o++)t.setRenderTarget(this,o),t.clear(e,n,s);t.setRenderTarget(r)}}const _r=new U,Ph=new U,Lh=new Dt;class mn{constructor(t=new U(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){const s=_r.subVectors(n,e).cross(Ph.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){const n=t.delta(_r),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const r=-(t.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:e.copy(t.start).addScaledVector(n,r)}intersectsLine(t){const e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const n=e||Lh.getNormalMatrix(t),s=this.coplanarPoint(_r).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}}const Cn=new zs,hs=new U;class No{constructor(t=new mn,e=new mn,n=new mn,s=new mn,r=new mn,o=new mn){this.planes=[t,e,n,s,r,o]}set(t,e,n,s,r,o){const a=this.planes;return a[0].copy(t),a[1].copy(e),a[2].copy(n),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(t){const e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=rn){const n=this.planes,s=t.elements,r=s[0],o=s[1],a=s[2],l=s[3],c=s[4],d=s[5],h=s[6],f=s[7],m=s[8],g=s[9],v=s[10],p=s[11],u=s[12],S=s[13],M=s[14],x=s[15];if(n[0].setComponents(l-r,f-c,p-m,x-u).normalize(),n[1].setComponents(l+r,f+c,p+m,x+u).normalize(),n[2].setComponents(l+o,f+d,p+g,x+S).normalize(),n[3].setComponents(l-o,f-d,p-g,x-S).normalize(),n[4].setComponents(l-a,f-h,p-v,x-M).normalize(),e===rn)n[5].setComponents(l+a,f+h,p+v,x+M).normalize();else if(e===Us)n[5].setComponents(a,h,v,M).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Cn.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Cn.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Cn)}intersectsSprite(t){return Cn.center.set(0,0,0),Cn.radius=.7071067811865476,Cn.applyMatrix4(t.matrixWorld),this.intersectsSphere(Cn)}intersectsSphere(t){const e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){const e=this.planes;for(let n=0;n<6;n++){const s=e[n];if(hs.x=s.normal.x>0?t.max.x:t.min.x,hs.y=s.normal.y>0?t.max.y:t.min.y,hs.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(hs)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function Ul(){let i=null,t=!1,e=null,n=null;function s(r,o){e(r,o),n=i.requestAnimationFrame(s)}return{start:function(){t!==!0&&e!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function Dh(i){const t=new WeakMap;function e(a,l){const c=a.array,d=a.usage,h=c.byteLength,f=i.createBuffer();i.bindBuffer(l,f),i.bufferData(l,c,d),a.onUploadCallback();let m;if(c instanceof Float32Array)m=i.FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?m=i.HALF_FLOAT:m=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)m=i.SHORT;else if(c instanceof Uint32Array)m=i.UNSIGNED_INT;else if(c instanceof Int32Array)m=i.INT;else if(c instanceof Int8Array)m=i.BYTE;else if(c instanceof Uint8Array)m=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)m=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:f,type:m,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:h}}function n(a,l,c){const d=l.array,h=l.updateRanges;if(i.bindBuffer(c,a),h.length===0)i.bufferSubData(c,0,d);else{h.sort((m,g)=>m.start-g.start);let f=0;for(let m=1;m<h.length;m++){const g=h[f],v=h[m];v.start<=g.start+g.count+1?g.count=Math.max(g.count,v.start+v.count-g.start):(++f,h[f]=v)}h.length=f+1;for(let m=0,g=h.length;m<g;m++){const v=h[m];i.bufferSubData(c,v.start*d.BYTES_PER_ELEMENT,d,v.start,v.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),t.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);const l=t.get(a);l&&(i.deleteBuffer(l.buffer),t.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){const d=t.get(a);(!d||d.version<a.version)&&t.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}const c=t.get(a);if(c===void 0)t.set(a,e(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,a,l),c.version=a.version}}return{get:s,remove:r,update:o}}class Gs extends fe{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};const r=t/2,o=e/2,a=Math.floor(n),l=Math.floor(s),c=a+1,d=l+1,h=t/a,f=e/l,m=[],g=[],v=[],p=[];for(let u=0;u<d;u++){const S=u*f-o;for(let M=0;M<c;M++){const x=M*h-r;g.push(x,-S,0),v.push(0,0,1),p.push(M/a),p.push(1-u/l)}}for(let u=0;u<l;u++)for(let S=0;S<a;S++){const M=S+c*u,x=S+c*(u+1),C=S+1+c*(u+1),A=S+1+c*u;m.push(M,x,A),m.push(x,C,A)}this.setIndex(m),this.setAttribute("position",new we(g,3)),this.setAttribute("normal",new we(v,3)),this.setAttribute("uv",new we(p,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Gs(t.width,t.height,t.widthSegments,t.heightSegments)}}var Ih=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Uh=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Nh=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Fh=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Oh=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Bh=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,kh=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,zh=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Hh=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,Gh=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Vh=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Wh=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Xh=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,$h=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Yh=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,qh=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,jh=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Kh=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Zh=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Jh=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Qh=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,tu=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,eu=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,nu=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,iu=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,su=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,ru=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,ou=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,au=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,lu=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,cu="gl_FragColor = linearToOutputTexel( gl_FragColor );",hu=`
const mat3 LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 = mat3(
	vec3( 0.8224621, 0.177538, 0.0 ),
	vec3( 0.0331941, 0.9668058, 0.0 ),
	vec3( 0.0170827, 0.0723974, 0.9105199 )
);
const mat3 LINEAR_DISPLAY_P3_TO_LINEAR_SRGB = mat3(
	vec3( 1.2249401, - 0.2249404, 0.0 ),
	vec3( - 0.0420569, 1.0420571, 0.0 ),
	vec3( - 0.0196376, - 0.0786361, 1.0982735 )
);
vec4 LinearSRGBToLinearDisplayP3( in vec4 value ) {
	return vec4( value.rgb * LINEAR_SRGB_TO_LINEAR_DISPLAY_P3, value.a );
}
vec4 LinearDisplayP3ToLinearSRGB( in vec4 value ) {
	return vec4( value.rgb * LINEAR_DISPLAY_P3_TO_LINEAR_SRGB, value.a );
}
vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,uu=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,du=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,fu=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,pu=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,mu=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,gu=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,_u=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,vu=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,xu=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,yu=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Mu=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Su=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Eu=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,bu=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,Tu=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,Au=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,wu=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Cu=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Ru=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Pu=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Lu=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Du=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Iu=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Uu=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Nu=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Fu=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Ou=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Bu=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,ku=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,zu=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Hu=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Gu=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Vu=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Wu=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Xu=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,$u=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Yu=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,qu=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,ju=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Ku=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Zu=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Ju=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Qu=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,td=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,ed=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,nd=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,id=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,sd=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,rd=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,od=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,ad=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,ld=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,cd=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,hd=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,ud=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,dd=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,fd=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,pd=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,md=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,gd=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,_d=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,vd=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,xd=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,yd=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Md=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Sd=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Ed=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,bd=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Td=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Ad=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,wd=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Cd=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Rd=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Pd=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Ld=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const Dd=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Id=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Ud=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Nd=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Fd=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Od=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Bd=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,kd=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,zd=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Hd=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,Gd=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Vd=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Wd=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Xd=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,$d=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Yd=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,qd=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,jd=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Kd=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Zd=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Jd=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Qd=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,tf=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,ef=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,nf=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,sf=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,rf=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,of=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,af=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,lf=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,cf=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,hf=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,uf=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,df=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Lt={alphahash_fragment:Ih,alphahash_pars_fragment:Uh,alphamap_fragment:Nh,alphamap_pars_fragment:Fh,alphatest_fragment:Oh,alphatest_pars_fragment:Bh,aomap_fragment:kh,aomap_pars_fragment:zh,batching_pars_vertex:Hh,batching_vertex:Gh,begin_vertex:Vh,beginnormal_vertex:Wh,bsdfs:Xh,iridescence_fragment:$h,bumpmap_pars_fragment:Yh,clipping_planes_fragment:qh,clipping_planes_pars_fragment:jh,clipping_planes_pars_vertex:Kh,clipping_planes_vertex:Zh,color_fragment:Jh,color_pars_fragment:Qh,color_pars_vertex:tu,color_vertex:eu,common:nu,cube_uv_reflection_fragment:iu,defaultnormal_vertex:su,displacementmap_pars_vertex:ru,displacementmap_vertex:ou,emissivemap_fragment:au,emissivemap_pars_fragment:lu,colorspace_fragment:cu,colorspace_pars_fragment:hu,envmap_fragment:uu,envmap_common_pars_fragment:du,envmap_pars_fragment:fu,envmap_pars_vertex:pu,envmap_physical_pars_fragment:Tu,envmap_vertex:mu,fog_vertex:gu,fog_pars_vertex:_u,fog_fragment:vu,fog_pars_fragment:xu,gradientmap_pars_fragment:yu,lightmap_pars_fragment:Mu,lights_lambert_fragment:Su,lights_lambert_pars_fragment:Eu,lights_pars_begin:bu,lights_toon_fragment:Au,lights_toon_pars_fragment:wu,lights_phong_fragment:Cu,lights_phong_pars_fragment:Ru,lights_physical_fragment:Pu,lights_physical_pars_fragment:Lu,lights_fragment_begin:Du,lights_fragment_maps:Iu,lights_fragment_end:Uu,logdepthbuf_fragment:Nu,logdepthbuf_pars_fragment:Fu,logdepthbuf_pars_vertex:Ou,logdepthbuf_vertex:Bu,map_fragment:ku,map_pars_fragment:zu,map_particle_fragment:Hu,map_particle_pars_fragment:Gu,metalnessmap_fragment:Vu,metalnessmap_pars_fragment:Wu,morphinstance_vertex:Xu,morphcolor_vertex:$u,morphnormal_vertex:Yu,morphtarget_pars_vertex:qu,morphtarget_vertex:ju,normal_fragment_begin:Ku,normal_fragment_maps:Zu,normal_pars_fragment:Ju,normal_pars_vertex:Qu,normal_vertex:td,normalmap_pars_fragment:ed,clearcoat_normal_fragment_begin:nd,clearcoat_normal_fragment_maps:id,clearcoat_pars_fragment:sd,iridescence_pars_fragment:rd,opaque_fragment:od,packing:ad,premultiplied_alpha_fragment:ld,project_vertex:cd,dithering_fragment:hd,dithering_pars_fragment:ud,roughnessmap_fragment:dd,roughnessmap_pars_fragment:fd,shadowmap_pars_fragment:pd,shadowmap_pars_vertex:md,shadowmap_vertex:gd,shadowmask_pars_fragment:_d,skinbase_vertex:vd,skinning_pars_vertex:xd,skinning_vertex:yd,skinnormal_vertex:Md,specularmap_fragment:Sd,specularmap_pars_fragment:Ed,tonemapping_fragment:bd,tonemapping_pars_fragment:Td,transmission_fragment:Ad,transmission_pars_fragment:wd,uv_pars_fragment:Cd,uv_pars_vertex:Rd,uv_vertex:Pd,worldpos_vertex:Ld,background_vert:Dd,background_frag:Id,backgroundCube_vert:Ud,backgroundCube_frag:Nd,cube_vert:Fd,cube_frag:Od,depth_vert:Bd,depth_frag:kd,distanceRGBA_vert:zd,distanceRGBA_frag:Hd,equirect_vert:Gd,equirect_frag:Vd,linedashed_vert:Wd,linedashed_frag:Xd,meshbasic_vert:$d,meshbasic_frag:Yd,meshlambert_vert:qd,meshlambert_frag:jd,meshmatcap_vert:Kd,meshmatcap_frag:Zd,meshnormal_vert:Jd,meshnormal_frag:Qd,meshphong_vert:tf,meshphong_frag:ef,meshphysical_vert:nf,meshphysical_frag:sf,meshtoon_vert:rf,meshtoon_frag:of,points_vert:af,points_frag:lf,shadow_vert:cf,shadow_frag:hf,sprite_vert:uf,sprite_frag:df},et={common:{diffuse:{value:new Pt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Dt},alphaMap:{value:null},alphaMapTransform:{value:new Dt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Dt}},envmap:{envMap:{value:null},envMapRotation:{value:new Dt},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Dt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Dt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Dt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Dt},normalScale:{value:new Rt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Dt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Dt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Dt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Dt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Pt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Pt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Dt},alphaTest:{value:0},uvTransform:{value:new Dt}},sprite:{diffuse:{value:new Pt(16777215)},opacity:{value:1},center:{value:new Rt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Dt},alphaMap:{value:null},alphaMapTransform:{value:new Dt},alphaTest:{value:0}}},Ye={basic:{uniforms:xe([et.common,et.specularmap,et.envmap,et.aomap,et.lightmap,et.fog]),vertexShader:Lt.meshbasic_vert,fragmentShader:Lt.meshbasic_frag},lambert:{uniforms:xe([et.common,et.specularmap,et.envmap,et.aomap,et.lightmap,et.emissivemap,et.bumpmap,et.normalmap,et.displacementmap,et.fog,et.lights,{emissive:{value:new Pt(0)}}]),vertexShader:Lt.meshlambert_vert,fragmentShader:Lt.meshlambert_frag},phong:{uniforms:xe([et.common,et.specularmap,et.envmap,et.aomap,et.lightmap,et.emissivemap,et.bumpmap,et.normalmap,et.displacementmap,et.fog,et.lights,{emissive:{value:new Pt(0)},specular:{value:new Pt(1118481)},shininess:{value:30}}]),vertexShader:Lt.meshphong_vert,fragmentShader:Lt.meshphong_frag},standard:{uniforms:xe([et.common,et.envmap,et.aomap,et.lightmap,et.emissivemap,et.bumpmap,et.normalmap,et.displacementmap,et.roughnessmap,et.metalnessmap,et.fog,et.lights,{emissive:{value:new Pt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Lt.meshphysical_vert,fragmentShader:Lt.meshphysical_frag},toon:{uniforms:xe([et.common,et.aomap,et.lightmap,et.emissivemap,et.bumpmap,et.normalmap,et.displacementmap,et.gradientmap,et.fog,et.lights,{emissive:{value:new Pt(0)}}]),vertexShader:Lt.meshtoon_vert,fragmentShader:Lt.meshtoon_frag},matcap:{uniforms:xe([et.common,et.bumpmap,et.normalmap,et.displacementmap,et.fog,{matcap:{value:null}}]),vertexShader:Lt.meshmatcap_vert,fragmentShader:Lt.meshmatcap_frag},points:{uniforms:xe([et.points,et.fog]),vertexShader:Lt.points_vert,fragmentShader:Lt.points_frag},dashed:{uniforms:xe([et.common,et.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Lt.linedashed_vert,fragmentShader:Lt.linedashed_frag},depth:{uniforms:xe([et.common,et.displacementmap]),vertexShader:Lt.depth_vert,fragmentShader:Lt.depth_frag},normal:{uniforms:xe([et.common,et.bumpmap,et.normalmap,et.displacementmap,{opacity:{value:1}}]),vertexShader:Lt.meshnormal_vert,fragmentShader:Lt.meshnormal_frag},sprite:{uniforms:xe([et.sprite,et.fog]),vertexShader:Lt.sprite_vert,fragmentShader:Lt.sprite_frag},background:{uniforms:{uvTransform:{value:new Dt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Lt.background_vert,fragmentShader:Lt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Dt}},vertexShader:Lt.backgroundCube_vert,fragmentShader:Lt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Lt.cube_vert,fragmentShader:Lt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Lt.equirect_vert,fragmentShader:Lt.equirect_frag},distanceRGBA:{uniforms:xe([et.common,et.displacementmap,{referencePosition:{value:new U},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Lt.distanceRGBA_vert,fragmentShader:Lt.distanceRGBA_frag},shadow:{uniforms:xe([et.lights,et.fog,{color:{value:new Pt(0)},opacity:{value:1}}]),vertexShader:Lt.shadow_vert,fragmentShader:Lt.shadow_frag}};Ye.physical={uniforms:xe([Ye.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Dt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Dt},clearcoatNormalScale:{value:new Rt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Dt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Dt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Dt},sheen:{value:0},sheenColor:{value:new Pt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Dt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Dt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Dt},transmissionSamplerSize:{value:new Rt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Dt},attenuationDistance:{value:0},attenuationColor:{value:new Pt(0)},specularColor:{value:new Pt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Dt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Dt},anisotropyVector:{value:new Rt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Dt}}]),vertexShader:Lt.meshphysical_vert,fragmentShader:Lt.meshphysical_frag};const us={r:0,b:0,g:0},Rn=new qe,ff=new ie;function pf(i,t,e,n,s,r,o){const a=new Pt(0);let l=r===!0?0:1,c,d,h=null,f=0,m=null;function g(S){let M=S.isScene===!0?S.background:null;return M&&M.isTexture&&(M=(S.backgroundBlurriness>0?e:t).get(M)),M}function v(S){let M=!1;const x=g(S);x===null?u(a,l):x&&x.isColor&&(u(x,1),M=!0);const C=i.xr.getEnvironmentBlendMode();C==="additive"?n.buffers.color.setClear(0,0,0,1,o):C==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,o),(i.autoClear||M)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function p(S,M){const x=g(M);x&&(x.isCubeTexture||x.mapping===Bs)?(d===void 0&&(d=new $e(new Hi(1,1,1),new Mn({name:"BackgroundCubeMaterial",uniforms:Mi(Ye.backgroundCube.uniforms),vertexShader:Ye.backgroundCube.vertexShader,fragmentShader:Ye.backgroundCube.fragmentShader,side:Te,depthTest:!1,depthWrite:!1,fog:!1})),d.geometry.deleteAttribute("normal"),d.geometry.deleteAttribute("uv"),d.onBeforeRender=function(C,A,T){this.matrixWorld.copyPosition(T.matrixWorld)},Object.defineProperty(d.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(d)),Rn.copy(M.backgroundRotation),Rn.x*=-1,Rn.y*=-1,Rn.z*=-1,x.isCubeTexture&&x.isRenderTargetTexture===!1&&(Rn.y*=-1,Rn.z*=-1),d.material.uniforms.envMap.value=x,d.material.uniforms.flipEnvMap.value=x.isCubeTexture&&x.isRenderTargetTexture===!1?-1:1,d.material.uniforms.backgroundBlurriness.value=M.backgroundBlurriness,d.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,d.material.uniforms.backgroundRotation.value.setFromMatrix4(ff.makeRotationFromEuler(Rn)),d.material.toneMapped=$t.getTransfer(x.colorSpace)!==ee,(h!==x||f!==x.version||m!==i.toneMapping)&&(d.material.needsUpdate=!0,h=x,f=x.version,m=i.toneMapping),d.layers.enableAll(),S.unshift(d,d.geometry,d.material,0,0,null)):x&&x.isTexture&&(c===void 0&&(c=new $e(new Gs(2,2),new Mn({name:"BackgroundMaterial",uniforms:Mi(Ye.background.uniforms),vertexShader:Ye.background.vertexShader,fragmentShader:Ye.background.fragmentShader,side:yn,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(c)),c.material.uniforms.t2D.value=x,c.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,c.material.toneMapped=$t.getTransfer(x.colorSpace)!==ee,x.matrixAutoUpdate===!0&&x.updateMatrix(),c.material.uniforms.uvTransform.value.copy(x.matrix),(h!==x||f!==x.version||m!==i.toneMapping)&&(c.material.needsUpdate=!0,h=x,f=x.version,m=i.toneMapping),c.layers.enableAll(),S.unshift(c,c.geometry,c.material,0,0,null))}function u(S,M){S.getRGB(us,Ll(i)),n.buffers.color.setClear(us.r,us.g,us.b,M,o)}return{getClearColor:function(){return a},setClearColor:function(S,M=1){a.set(S),l=M,u(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(S){l=S,u(a,l)},render:v,addToRenderList:p}}function mf(i,t){const e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=f(null);let r=s,o=!1;function a(_,b,k,B,W){let K=!1;const G=h(B,k,b);r!==G&&(r=G,c(r.object)),K=m(_,B,k,W),K&&g(_,B,k,W),W!==null&&t.update(W,i.ELEMENT_ARRAY_BUFFER),(K||o)&&(o=!1,x(_,b,k,B),W!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(W).buffer))}function l(){return i.createVertexArray()}function c(_){return i.bindVertexArray(_)}function d(_){return i.deleteVertexArray(_)}function h(_,b,k){const B=k.wireframe===!0;let W=n[_.id];W===void 0&&(W={},n[_.id]=W);let K=W[b.id];K===void 0&&(K={},W[b.id]=K);let G=K[B];return G===void 0&&(G=f(l()),K[B]=G),G}function f(_){const b=[],k=[],B=[];for(let W=0;W<e;W++)b[W]=0,k[W]=0,B[W]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:b,enabledAttributes:k,attributeDivisors:B,object:_,attributes:{},index:null}}function m(_,b,k,B){const W=r.attributes,K=b.attributes;let G=0;const j=k.getAttributes();for(const z in j)if(j[z].location>=0){const at=W[z];let st=K[z];if(st===void 0&&(z==="instanceMatrix"&&_.instanceMatrix&&(st=_.instanceMatrix),z==="instanceColor"&&_.instanceColor&&(st=_.instanceColor)),at===void 0||at.attribute!==st||st&&at.data!==st.data)return!0;G++}return r.attributesNum!==G||r.index!==B}function g(_,b,k,B){const W={},K=b.attributes;let G=0;const j=k.getAttributes();for(const z in j)if(j[z].location>=0){let at=K[z];at===void 0&&(z==="instanceMatrix"&&_.instanceMatrix&&(at=_.instanceMatrix),z==="instanceColor"&&_.instanceColor&&(at=_.instanceColor));const st={};st.attribute=at,at&&at.data&&(st.data=at.data),W[z]=st,G++}r.attributes=W,r.attributesNum=G,r.index=B}function v(){const _=r.newAttributes;for(let b=0,k=_.length;b<k;b++)_[b]=0}function p(_){u(_,0)}function u(_,b){const k=r.newAttributes,B=r.enabledAttributes,W=r.attributeDivisors;k[_]=1,B[_]===0&&(i.enableVertexAttribArray(_),B[_]=1),W[_]!==b&&(i.vertexAttribDivisor(_,b),W[_]=b)}function S(){const _=r.newAttributes,b=r.enabledAttributes;for(let k=0,B=b.length;k<B;k++)b[k]!==_[k]&&(i.disableVertexAttribArray(k),b[k]=0)}function M(_,b,k,B,W,K,G){G===!0?i.vertexAttribIPointer(_,b,k,W,K):i.vertexAttribPointer(_,b,k,B,W,K)}function x(_,b,k,B){v();const W=B.attributes,K=k.getAttributes(),G=b.defaultAttributeValues;for(const j in K){const z=K[j];if(z.location>=0){let it=W[j];if(it===void 0&&(j==="instanceMatrix"&&_.instanceMatrix&&(it=_.instanceMatrix),j==="instanceColor"&&_.instanceColor&&(it=_.instanceColor)),it!==void 0){const at=it.normalized,st=it.itemSize,It=t.get(it);if(It===void 0)continue;const qt=It.buffer,X=It.type,J=It.bytesPerElement,mt=X===i.INT||X===i.UNSIGNED_INT||it.gpuType===wo;if(it.isInterleavedBufferAttribute){const ht=it.data,wt=ht.stride,Mt=it.offset;if(ht.isInstancedInterleavedBuffer){for(let Ft=0;Ft<z.locationSize;Ft++)u(z.location+Ft,ht.meshPerAttribute);_.isInstancedMesh!==!0&&B._maxInstanceCount===void 0&&(B._maxInstanceCount=ht.meshPerAttribute*ht.count)}else for(let Ft=0;Ft<z.locationSize;Ft++)p(z.location+Ft);i.bindBuffer(i.ARRAY_BUFFER,qt);for(let Ft=0;Ft<z.locationSize;Ft++)M(z.location+Ft,st/z.locationSize,X,at,wt*J,(Mt+st/z.locationSize*Ft)*J,mt)}else{if(it.isInstancedBufferAttribute){for(let ht=0;ht<z.locationSize;ht++)u(z.location+ht,it.meshPerAttribute);_.isInstancedMesh!==!0&&B._maxInstanceCount===void 0&&(B._maxInstanceCount=it.meshPerAttribute*it.count)}else for(let ht=0;ht<z.locationSize;ht++)p(z.location+ht);i.bindBuffer(i.ARRAY_BUFFER,qt);for(let ht=0;ht<z.locationSize;ht++)M(z.location+ht,st/z.locationSize,X,at,st*J,st/z.locationSize*ht*J,mt)}}else if(G!==void 0){const at=G[j];if(at!==void 0)switch(at.length){case 2:i.vertexAttrib2fv(z.location,at);break;case 3:i.vertexAttrib3fv(z.location,at);break;case 4:i.vertexAttrib4fv(z.location,at);break;default:i.vertexAttrib1fv(z.location,at)}}}}S()}function C(){P();for(const _ in n){const b=n[_];for(const k in b){const B=b[k];for(const W in B)d(B[W].object),delete B[W];delete b[k]}delete n[_]}}function A(_){if(n[_.id]===void 0)return;const b=n[_.id];for(const k in b){const B=b[k];for(const W in B)d(B[W].object),delete B[W];delete b[k]}delete n[_.id]}function T(_){for(const b in n){const k=n[b];if(k[_.id]===void 0)continue;const B=k[_.id];for(const W in B)d(B[W].object),delete B[W];delete k[_.id]}}function P(){V(),o=!0,r!==s&&(r=s,c(r.object))}function V(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:P,resetDefaultState:V,dispose:C,releaseStatesOfGeometry:A,releaseStatesOfProgram:T,initAttributes:v,enableAttribute:p,disableUnusedAttributes:S}}function gf(i,t,e){let n;function s(c){n=c}function r(c,d){i.drawArrays(n,c,d),e.update(d,n,1)}function o(c,d,h){h!==0&&(i.drawArraysInstanced(n,c,d,h),e.update(d,n,h))}function a(c,d,h){if(h===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,d,0,h);let m=0;for(let g=0;g<h;g++)m+=d[g];e.update(m,n,1)}function l(c,d,h,f){if(h===0)return;const m=t.get("WEBGL_multi_draw");if(m===null)for(let g=0;g<c.length;g++)o(c[g],d[g],f[g]);else{m.multiDrawArraysInstancedWEBGL(n,c,0,d,0,f,0,h);let g=0;for(let v=0;v<h;v++)g+=d[v];for(let v=0;v<f.length;v++)e.update(g,n,f[v])}}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=l}function _f(i,t,e,n){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){const T=t.get("EXT_texture_filter_anisotropic");s=i.getParameter(T.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(T){return!(T!==Xe&&n.convert(T)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(T){const P=T===Bi&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(T!==on&&n.convert(T)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&T!==sn&&!P)}function l(T){if(T==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";T="mediump"}return T==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp";const d=l(c);d!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",d,"instead."),c=d);const h=e.logarithmicDepthBuffer===!0,f=e.reverseDepthBuffer===!0&&t.has("EXT_clip_control");if(f===!0){const T=t.get("EXT_clip_control");T.clipControlEXT(T.LOWER_LEFT_EXT,T.ZERO_TO_ONE_EXT)}const m=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),v=i.getParameter(i.MAX_TEXTURE_SIZE),p=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),u=i.getParameter(i.MAX_VERTEX_ATTRIBS),S=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),M=i.getParameter(i.MAX_VARYING_VECTORS),x=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),C=g>0,A=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:h,reverseDepthBuffer:f,maxTextures:m,maxVertexTextures:g,maxTextureSize:v,maxCubemapSize:p,maxAttributes:u,maxVertexUniforms:S,maxVaryings:M,maxFragmentUniforms:x,vertexTextures:C,maxSamples:A}}function vf(i){const t=this;let e=null,n=0,s=!1,r=!1;const o=new mn,a=new Dt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(h,f){const m=h.length!==0||f||n!==0||s;return s=f,n=h.length,m},this.beginShadows=function(){r=!0,d(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(h,f){e=d(h,f,0)},this.setState=function(h,f,m){const g=h.clippingPlanes,v=h.clipIntersection,p=h.clipShadows,u=i.get(h);if(!s||g===null||g.length===0||r&&!p)r?d(null):c();else{const S=r?0:n,M=S*4;let x=u.clippingState||null;l.value=x,x=d(g,f,M,m);for(let C=0;C!==M;++C)x[C]=e[C];u.clippingState=x,this.numIntersection=v?this.numPlanes:0,this.numPlanes+=S}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function d(h,f,m,g){const v=h!==null?h.length:0;let p=null;if(v!==0){if(p=l.value,g!==!0||p===null){const u=m+v*4,S=f.matrixWorldInverse;a.getNormalMatrix(S),(p===null||p.length<u)&&(p=new Float32Array(u));for(let M=0,x=m;M!==v;++M,x+=4)o.copy(h[M]).applyMatrix4(S,a),o.normal.toArray(p,x),p[x+3]=o.constant}l.value=p,l.needsUpdate=!0}return t.numPlanes=v,t.numIntersection=0,p}}function xf(i){let t=new WeakMap;function e(o,a){return a===Hr?o.mapping=_i:a===Gr&&(o.mapping=vi),o}function n(o){if(o&&o.isTexture){const a=o.mapping;if(a===Hr||a===Gr)if(t.has(o)){const l=t.get(o).texture;return e(l,o.mapping)}else{const l=o.image;if(l&&l.height>0){const c=new Rh(l.height);return c.fromEquirectangularTexture(i,o),t.set(o,c),o.addEventListener("dispose",s),e(c.texture,o.mapping)}else return null}}return o}function s(o){const a=o.target;a.removeEventListener("dispose",s);const l=t.get(a);l!==void 0&&(t.delete(a),l.dispose())}function r(){t=new WeakMap}return{get:n,dispose:r}}class Nl extends Dl{constructor(t=-1,e=1,n=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2;let r=n-t,o=n+t,a=s+e,l=s-e;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,d=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,o=r+c*this.view.width,a-=d*this.view.offsetY,l=a-d*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}const ui=4,va=[.125,.215,.35,.446,.526,.582],In=20,vr=new Nl,xa=new Pt;let xr=null,yr=0,Mr=0,Sr=!1;const Ln=(1+Math.sqrt(5))/2,oi=1/Ln,ya=[new U(-Ln,oi,0),new U(Ln,oi,0),new U(-oi,0,Ln),new U(oi,0,Ln),new U(0,Ln,-oi),new U(0,Ln,oi),new U(-1,1,-1),new U(1,1,-1),new U(-1,1,1),new U(1,1,1)];class Ma{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,n=.1,s=100){xr=this._renderer.getRenderTarget(),yr=this._renderer.getActiveCubeFace(),Mr=this._renderer.getActiveMipmapLevel(),Sr=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);const r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(t,n,s,r),e>0&&this._blur(r,0,0,e),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=ba(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Ea(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(xr,yr,Mr),this._renderer.xr.enabled=Sr,t.scissorTest=!1,ds(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===_i||t.mapping===vi?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),xr=this._renderer.getRenderTarget(),yr=this._renderer.getActiveCubeFace(),Mr=this._renderer.getActiveMipmapLevel(),Sr=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:Ve,minFilter:Ve,generateMipmaps:!1,type:Bi,format:Xe,colorSpace:En,depthBuffer:!1},s=Sa(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Sa(t,e,n);const{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=yf(r)),this._blurMaterial=Mf(r,t,e)}return s}_compileMaterial(t){const e=new $e(this._lodPlanes[0],t);this._renderer.compile(e,vr)}_sceneToCubeUV(t,e,n,s){const a=new Ne(90,1,e,n),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],d=this._renderer,h=d.autoClear,f=d.toneMapping;d.getClearColor(xa),d.toneMapping=xn,d.autoClear=!1;const m=new Cl({name:"PMREM.Background",side:Te,depthWrite:!1,depthTest:!1}),g=new $e(new Hi,m);let v=!1;const p=t.background;p?p.isColor&&(m.color.copy(p),t.background=null,v=!0):(m.color.copy(xa),v=!0);for(let u=0;u<6;u++){const S=u%3;S===0?(a.up.set(0,l[u],0),a.lookAt(c[u],0,0)):S===1?(a.up.set(0,0,l[u]),a.lookAt(0,c[u],0)):(a.up.set(0,l[u],0),a.lookAt(0,0,c[u]));const M=this._cubeSize;ds(s,S*M,u>2?M:0,M,M),d.setRenderTarget(s),v&&d.render(g,a),d.render(t,a)}g.geometry.dispose(),g.material.dispose(),d.toneMapping=f,d.autoClear=h,t.background=p}_textureToCubeUV(t,e){const n=this._renderer,s=t.mapping===_i||t.mapping===vi;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=ba()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Ea());const r=s?this._cubemapMaterial:this._equirectMaterial,o=new $e(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=t;const l=this._cubeSize;ds(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(o,vr)}_applyPMREM(t){const e=this._renderer,n=e.autoClear;e.autoClear=!1;const s=this._lodPlanes.length;for(let r=1;r<s;r++){const o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),a=ya[(s-r-1)%ya.length];this._blur(t,r-1,r,o,a)}e.autoClear=n}_blur(t,e,n,s,r){const o=this._pingPongRenderTarget;this._halfBlur(t,o,e,n,s,"latitudinal",r),this._halfBlur(o,t,n,n,s,"longitudinal",r)}_halfBlur(t,e,n,s,r,o,a){const l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const d=3,h=new $e(this._lodPlanes[s],c),f=c.uniforms,m=this._sizeLods[n]-1,g=isFinite(r)?Math.PI/(2*m):2*Math.PI/(2*In-1),v=r/g,p=isFinite(r)?1+Math.floor(d*v):In;p>In&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${p} samples when the maximum is set to ${In}`);const u=[];let S=0;for(let T=0;T<In;++T){const P=T/v,V=Math.exp(-P*P/2);u.push(V),T===0?S+=V:T<p&&(S+=2*V)}for(let T=0;T<u.length;T++)u[T]=u[T]/S;f.envMap.value=t.texture,f.samples.value=p,f.weights.value=u,f.latitudinal.value=o==="latitudinal",a&&(f.poleAxis.value=a);const{_lodMax:M}=this;f.dTheta.value=g,f.mipInt.value=M-n;const x=this._sizeLods[s],C=3*x*(s>M-ui?s-M+ui:0),A=4*(this._cubeSize-x);ds(e,C,A,3*x,2*x),l.setRenderTarget(e),l.render(h,vr)}}function yf(i){const t=[],e=[],n=[];let s=i;const r=i-ui+1+va.length;for(let o=0;o<r;o++){const a=Math.pow(2,s);e.push(a);let l=1/a;o>i-ui?l=va[o-i+ui-1]:o===0&&(l=0),n.push(l);const c=1/(a-2),d=-c,h=1+c,f=[d,d,h,d,h,h,d,d,h,h,d,h],m=6,g=6,v=3,p=2,u=1,S=new Float32Array(v*g*m),M=new Float32Array(p*g*m),x=new Float32Array(u*g*m);for(let A=0;A<m;A++){const T=A%3*2/3-1,P=A>2?0:-1,V=[T,P,0,T+2/3,P,0,T+2/3,P+1,0,T,P,0,T+2/3,P+1,0,T,P+1,0];S.set(V,v*g*A),M.set(f,p*g*A);const _=[A,A,A,A,A,A];x.set(_,u*g*A)}const C=new fe;C.setAttribute("position",new ve(S,v)),C.setAttribute("uv",new ve(M,p)),C.setAttribute("faceIndex",new ve(x,u)),t.push(C),s>ui&&s--}return{lodPlanes:t,sizeLods:e,sigmas:n}}function Sa(i,t,e){const n=new Gn(i,t,e);return n.texture.mapping=Bs,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function ds(i,t,e,n,s){i.viewport.set(t,e,n,s),i.scissor.set(t,e,n,s)}function Mf(i,t,e){const n=new Float32Array(In),s=new U(0,1,0);return new Mn({name:"SphericalGaussianBlur",defines:{n:In,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Fo(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:vn,depthTest:!1,depthWrite:!1})}function Ea(){return new Mn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Fo(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:vn,depthTest:!1,depthWrite:!1})}function ba(){return new Mn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Fo(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:vn,depthTest:!1,depthWrite:!1})}function Fo(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function Sf(i){let t=new WeakMap,e=null;function n(a){if(a&&a.isTexture){const l=a.mapping,c=l===Hr||l===Gr,d=l===_i||l===vi;if(c||d){let h=t.get(a);const f=h!==void 0?h.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==f)return e===null&&(e=new Ma(i)),h=c?e.fromEquirectangular(a,h):e.fromCubemap(a,h),h.texture.pmremVersion=a.pmremVersion,t.set(a,h),h.texture;if(h!==void 0)return h.texture;{const m=a.image;return c&&m&&m.height>0||d&&m&&s(m)?(e===null&&(e=new Ma(i)),h=c?e.fromEquirectangular(a):e.fromCubemap(a),h.texture.pmremVersion=a.pmremVersion,t.set(a,h),a.addEventListener("dispose",r),h.texture):null}}}return a}function s(a){let l=0;const c=6;for(let d=0;d<c;d++)a[d]!==void 0&&l++;return l===c}function r(a){const l=a.target;l.removeEventListener("dispose",r);const c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function o(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:n,dispose:o}}function Ef(i){const t={};function e(n){if(t[n]!==void 0)return t[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){const s=e(n);return s===null&&Cs("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function bf(i,t,e,n){const s={},r=new WeakMap;function o(h){const f=h.target;f.index!==null&&t.remove(f.index);for(const g in f.attributes)t.remove(f.attributes[g]);for(const g in f.morphAttributes){const v=f.morphAttributes[g];for(let p=0,u=v.length;p<u;p++)t.remove(v[p])}f.removeEventListener("dispose",o),delete s[f.id];const m=r.get(f);m&&(t.remove(m),r.delete(f)),n.releaseStatesOfGeometry(f),f.isInstancedBufferGeometry===!0&&delete f._maxInstanceCount,e.memory.geometries--}function a(h,f){return s[f.id]===!0||(f.addEventListener("dispose",o),s[f.id]=!0,e.memory.geometries++),f}function l(h){const f=h.attributes;for(const g in f)t.update(f[g],i.ARRAY_BUFFER);const m=h.morphAttributes;for(const g in m){const v=m[g];for(let p=0,u=v.length;p<u;p++)t.update(v[p],i.ARRAY_BUFFER)}}function c(h){const f=[],m=h.index,g=h.attributes.position;let v=0;if(m!==null){const S=m.array;v=m.version;for(let M=0,x=S.length;M<x;M+=3){const C=S[M+0],A=S[M+1],T=S[M+2];f.push(C,A,A,T,T,C)}}else if(g!==void 0){const S=g.array;v=g.version;for(let M=0,x=S.length/3-1;M<x;M+=3){const C=M+0,A=M+1,T=M+2;f.push(C,A,A,T,T,C)}}else return;const p=new(bl(f)?Pl:Rl)(f,1);p.version=v;const u=r.get(h);u&&t.remove(u),r.set(h,p)}function d(h){const f=r.get(h);if(f){const m=h.index;m!==null&&f.version<m.version&&c(h)}else c(h);return r.get(h)}return{get:a,update:l,getWireframeAttribute:d}}function Tf(i,t,e){let n;function s(f){n=f}let r,o;function a(f){r=f.type,o=f.bytesPerElement}function l(f,m){i.drawElements(n,m,r,f*o),e.update(m,n,1)}function c(f,m,g){g!==0&&(i.drawElementsInstanced(n,m,r,f*o,g),e.update(m,n,g))}function d(f,m,g){if(g===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,m,0,r,f,0,g);let p=0;for(let u=0;u<g;u++)p+=m[u];e.update(p,n,1)}function h(f,m,g,v){if(g===0)return;const p=t.get("WEBGL_multi_draw");if(p===null)for(let u=0;u<f.length;u++)c(f[u]/o,m[u],v[u]);else{p.multiDrawElementsInstancedWEBGL(n,m,0,r,f,0,v,0,g);let u=0;for(let S=0;S<g;S++)u+=m[S];for(let S=0;S<v.length;S++)e.update(u,n,v[S])}}this.setMode=s,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=d,this.renderMultiDrawInstances=h}function Af(i){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,o,a){switch(e.calls++,o){case i.TRIANGLES:e.triangles+=a*(r/3);break;case i.LINES:e.lines+=a*(r/2);break;case i.LINE_STRIP:e.lines+=a*(r-1);break;case i.LINE_LOOP:e.lines+=a*r;break;case i.POINTS:e.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function wf(i,t,e){const n=new WeakMap,s=new re;function r(o,a,l){const c=o.morphTargetInfluences,d=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,h=d!==void 0?d.length:0;let f=n.get(a);if(f===void 0||f.count!==h){let _=function(){P.dispose(),n.delete(a),a.removeEventListener("dispose",_)};var m=_;f!==void 0&&f.texture.dispose();const g=a.morphAttributes.position!==void 0,v=a.morphAttributes.normal!==void 0,p=a.morphAttributes.color!==void 0,u=a.morphAttributes.position||[],S=a.morphAttributes.normal||[],M=a.morphAttributes.color||[];let x=0;g===!0&&(x=1),v===!0&&(x=2),p===!0&&(x=3);let C=a.attributes.position.count*x,A=1;C>t.maxTextureSize&&(A=Math.ceil(C/t.maxTextureSize),C=t.maxTextureSize);const T=new Float32Array(C*A*4*h),P=new Al(T,C,A,h);P.type=sn,P.needsUpdate=!0;const V=x*4;for(let b=0;b<h;b++){const k=u[b],B=S[b],W=M[b],K=C*A*4*b;for(let G=0;G<k.count;G++){const j=G*V;g===!0&&(s.fromBufferAttribute(k,G),T[K+j+0]=s.x,T[K+j+1]=s.y,T[K+j+2]=s.z,T[K+j+3]=0),v===!0&&(s.fromBufferAttribute(B,G),T[K+j+4]=s.x,T[K+j+5]=s.y,T[K+j+6]=s.z,T[K+j+7]=0),p===!0&&(s.fromBufferAttribute(W,G),T[K+j+8]=s.x,T[K+j+9]=s.y,T[K+j+10]=s.z,T[K+j+11]=W.itemSize===4?s.w:1)}}f={count:h,texture:P,size:new Rt(C,A)},n.set(a,f),a.addEventListener("dispose",_)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",o.morphTexture,e);else{let g=0;for(let p=0;p<c.length;p++)g+=c[p];const v=a.morphTargetsRelative?1:1-g;l.getUniforms().setValue(i,"morphTargetBaseInfluence",v),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",f.texture,e),l.getUniforms().setValue(i,"morphTargetsTextureSize",f.size)}return{update:r}}function Cf(i,t,e,n){let s=new WeakMap;function r(l){const c=n.render.frame,d=l.geometry,h=t.get(l,d);if(s.get(h)!==c&&(t.update(h),s.set(h,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),s.get(l)!==c&&(e.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,i.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){const f=l.skeleton;s.get(f)!==c&&(f.update(),s.set(f,c))}return h}function o(){s=new WeakMap}function a(l){const c=l.target;c.removeEventListener("dispose",a),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:r,dispose:o}}class Fl extends Ae{constructor(t,e,n,s,r,o,a,l,c,d=pi){if(d!==pi&&d!==yi)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&d===pi&&(n=Hn),n===void 0&&d===yi&&(n=xi),super(null,s,r,o,a,l,d,n,c),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=a!==void 0?a:Oe,this.minFilter=l!==void 0?l:Oe,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}const Ol=new Ae,Ta=new Fl(1,1),Bl=new Al,kl=new fh,zl=new Il,Aa=[],wa=[],Ca=new Float32Array(16),Ra=new Float32Array(9),Pa=new Float32Array(4);function bi(i,t,e){const n=i[0];if(n<=0||n>0)return i;const s=t*e;let r=Aa[s];if(r===void 0&&(r=new Float32Array(s),Aa[s]=r),t!==0){n.toArray(r,0);for(let o=1,a=0;o!==t;++o)a+=e,i[o].toArray(r,a)}return r}function he(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function ue(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function Vs(i,t){let e=wa[t];e===void 0&&(e=new Int32Array(t),wa[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function Rf(i,t){const e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function Pf(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(he(e,t))return;i.uniform2fv(this.addr,t),ue(e,t)}}function Lf(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(he(e,t))return;i.uniform3fv(this.addr,t),ue(e,t)}}function Df(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(he(e,t))return;i.uniform4fv(this.addr,t),ue(e,t)}}function If(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(he(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),ue(e,t)}else{if(he(e,n))return;Pa.set(n),i.uniformMatrix2fv(this.addr,!1,Pa),ue(e,n)}}function Uf(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(he(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),ue(e,t)}else{if(he(e,n))return;Ra.set(n),i.uniformMatrix3fv(this.addr,!1,Ra),ue(e,n)}}function Nf(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(he(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),ue(e,t)}else{if(he(e,n))return;Ca.set(n),i.uniformMatrix4fv(this.addr,!1,Ca),ue(e,n)}}function Ff(i,t){const e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function Of(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(he(e,t))return;i.uniform2iv(this.addr,t),ue(e,t)}}function Bf(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(he(e,t))return;i.uniform3iv(this.addr,t),ue(e,t)}}function kf(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(he(e,t))return;i.uniform4iv(this.addr,t),ue(e,t)}}function zf(i,t){const e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function Hf(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(he(e,t))return;i.uniform2uiv(this.addr,t),ue(e,t)}}function Gf(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(he(e,t))return;i.uniform3uiv(this.addr,t),ue(e,t)}}function Vf(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(he(e,t))return;i.uniform4uiv(this.addr,t),ue(e,t)}}function Wf(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(Ta.compareFunction=El,r=Ta):r=Ol,e.setTexture2D(t||r,s)}function Xf(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||kl,s)}function $f(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTextureCube(t||zl,s)}function Yf(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||Bl,s)}function qf(i){switch(i){case 5126:return Rf;case 35664:return Pf;case 35665:return Lf;case 35666:return Df;case 35674:return If;case 35675:return Uf;case 35676:return Nf;case 5124:case 35670:return Ff;case 35667:case 35671:return Of;case 35668:case 35672:return Bf;case 35669:case 35673:return kf;case 5125:return zf;case 36294:return Hf;case 36295:return Gf;case 36296:return Vf;case 35678:case 36198:case 36298:case 36306:case 35682:return Wf;case 35679:case 36299:case 36307:return Xf;case 35680:case 36300:case 36308:case 36293:return $f;case 36289:case 36303:case 36311:case 36292:return Yf}}function jf(i,t){i.uniform1fv(this.addr,t)}function Kf(i,t){const e=bi(t,this.size,2);i.uniform2fv(this.addr,e)}function Zf(i,t){const e=bi(t,this.size,3);i.uniform3fv(this.addr,e)}function Jf(i,t){const e=bi(t,this.size,4);i.uniform4fv(this.addr,e)}function Qf(i,t){const e=bi(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function tp(i,t){const e=bi(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function ep(i,t){const e=bi(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function np(i,t){i.uniform1iv(this.addr,t)}function ip(i,t){i.uniform2iv(this.addr,t)}function sp(i,t){i.uniform3iv(this.addr,t)}function rp(i,t){i.uniform4iv(this.addr,t)}function op(i,t){i.uniform1uiv(this.addr,t)}function ap(i,t){i.uniform2uiv(this.addr,t)}function lp(i,t){i.uniform3uiv(this.addr,t)}function cp(i,t){i.uniform4uiv(this.addr,t)}function hp(i,t,e){const n=this.cache,s=t.length,r=Vs(e,s);he(n,r)||(i.uniform1iv(this.addr,r),ue(n,r));for(let o=0;o!==s;++o)e.setTexture2D(t[o]||Ol,r[o])}function up(i,t,e){const n=this.cache,s=t.length,r=Vs(e,s);he(n,r)||(i.uniform1iv(this.addr,r),ue(n,r));for(let o=0;o!==s;++o)e.setTexture3D(t[o]||kl,r[o])}function dp(i,t,e){const n=this.cache,s=t.length,r=Vs(e,s);he(n,r)||(i.uniform1iv(this.addr,r),ue(n,r));for(let o=0;o!==s;++o)e.setTextureCube(t[o]||zl,r[o])}function fp(i,t,e){const n=this.cache,s=t.length,r=Vs(e,s);he(n,r)||(i.uniform1iv(this.addr,r),ue(n,r));for(let o=0;o!==s;++o)e.setTexture2DArray(t[o]||Bl,r[o])}function pp(i){switch(i){case 5126:return jf;case 35664:return Kf;case 35665:return Zf;case 35666:return Jf;case 35674:return Qf;case 35675:return tp;case 35676:return ep;case 5124:case 35670:return np;case 35667:case 35671:return ip;case 35668:case 35672:return sp;case 35669:case 35673:return rp;case 5125:return op;case 36294:return ap;case 36295:return lp;case 36296:return cp;case 35678:case 36198:case 36298:case 36306:case 35682:return hp;case 35679:case 36299:case 36307:return up;case 35680:case 36300:case 36308:case 36293:return dp;case 36289:case 36303:case 36311:case 36292:return fp}}class mp{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=qf(e.type)}}class gp{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=pp(e.type)}}class _p{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){const s=this.seq;for(let r=0,o=s.length;r!==o;++r){const a=s[r];a.setValue(t,e[a.id],n)}}}const Er=/(\w+)(\])?(\[|\.)?/g;function La(i,t){i.seq.push(t),i.map[t.id]=t}function vp(i,t,e){const n=i.name,s=n.length;for(Er.lastIndex=0;;){const r=Er.exec(n),o=Er.lastIndex;let a=r[1];const l=r[2]==="]",c=r[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===s){La(e,c===void 0?new mp(a,i,t):new gp(a,i,t));break}else{let h=e.map[a];h===void 0&&(h=new _p(a),La(e,h)),e=h}}}class Rs{constructor(t,e){this.seq=[],this.map={};const n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){const r=t.getActiveUniform(e,s),o=t.getUniformLocation(e,r.name);vp(r,o,this)}}setValue(t,e,n,s){const r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){const s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,o=e.length;r!==o;++r){const a=e[r],l=n[a.id];l.needsUpdate!==!1&&a.setValue(t,l.value,s)}}static seqWithValue(t,e){const n=[];for(let s=0,r=t.length;s!==r;++s){const o=t[s];o.id in e&&n.push(o)}return n}}function Da(i,t,e){const n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}const xp=37297;let yp=0;function Mp(i,t){const e=i.split(`
`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let o=s;o<r;o++){const a=o+1;n.push(`${a===t?">":" "} ${a}: ${e[o]}`)}return n.join(`
`)}function Sp(i){const t=$t.getPrimaries($t.workingColorSpace),e=$t.getPrimaries(i);let n;switch(t===e?n="":t===Is&&e===Ds?n="LinearDisplayP3ToLinearSRGB":t===Ds&&e===Is&&(n="LinearSRGBToLinearDisplayP3"),i){case En:case ks:return[n,"LinearTransferOETF"];case Ge:case Io:return[n,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",i),[n,"LinearTransferOETF"]}}function Ia(i,t,e){const n=i.getShaderParameter(t,i.COMPILE_STATUS),s=i.getShaderInfoLog(t).trim();if(n&&s==="")return"";const r=/ERROR: 0:(\d+)/.exec(s);if(r){const o=parseInt(r[1]);return e.toUpperCase()+`

`+s+`

`+Mp(i.getShaderSource(t),o)}else return s}function Ep(i,t){const e=Sp(t);return`vec4 ${i}( vec4 value ) { return ${e[0]}( ${e[1]}( value ) ); }`}function bp(i,t){let e;switch(t){case Bc:e="Linear";break;case kc:e="Reinhard";break;case zc:e="Cineon";break;case Hc:e="ACESFilmic";break;case Vc:e="AgX";break;case Wc:e="Neutral";break;case Gc:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}const fs=new U;function Tp(){$t.getLuminanceCoefficients(fs);const i=fs.x.toFixed(4),t=fs.y.toFixed(4),e=fs.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Ap(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Ui).join(`
`)}function wp(i){const t=[];for(const e in i){const n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function Cp(i,t){const e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){const r=i.getActiveAttrib(t,s),o=r.name;let a=1;r.type===i.FLOAT_MAT2&&(a=2),r.type===i.FLOAT_MAT3&&(a=3),r.type===i.FLOAT_MAT4&&(a=4),e[o]={type:r.type,location:i.getAttribLocation(t,o),locationSize:a}}return e}function Ui(i){return i!==""}function Ua(i,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Na(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const Rp=/^[ \t]*#include +<([\w\d./]+)>/gm;function xo(i){return i.replace(Rp,Lp)}const Pp=new Map;function Lp(i,t){let e=Lt[t];if(e===void 0){const n=Pp.get(t);if(n!==void 0)e=Lt[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return xo(e)}const Dp=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Fa(i){return i.replace(Dp,Ip)}function Ip(i,t,e,n){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Oa(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function Up(i){let t="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===cl?t="SHADOWMAP_TYPE_PCF":i.shadowMapType===_c?t="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===en&&(t="SHADOWMAP_TYPE_VSM"),t}function Np(i){let t="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case _i:case vi:t="ENVMAP_TYPE_CUBE";break;case Bs:t="ENVMAP_TYPE_CUBE_UV";break}return t}function Fp(i){let t="ENVMAP_MODE_REFLECTION";if(i.envMap)switch(i.envMapMode){case vi:t="ENVMAP_MODE_REFRACTION";break}return t}function Op(i){let t="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case hl:t="ENVMAP_BLENDING_MULTIPLY";break;case Fc:t="ENVMAP_BLENDING_MIX";break;case Oc:t="ENVMAP_BLENDING_ADD";break}return t}function Bp(i){const t=i.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),7*16)),texelHeight:n,maxMip:e}}function kp(i,t,e,n){const s=i.getContext(),r=e.defines;let o=e.vertexShader,a=e.fragmentShader;const l=Up(e),c=Np(e),d=Fp(e),h=Op(e),f=Bp(e),m=Ap(e),g=wp(r),v=s.createProgram();let p,u,S=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(p=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(Ui).join(`
`),p.length>0&&(p+=`
`),u=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(Ui).join(`
`),u.length>0&&(u+=`
`)):(p=[Oa(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+d:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Ui).join(`
`),u=[Oa(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+d:"",e.envMap?"#define "+h:"",f?"#define CUBEUV_TEXEL_WIDTH "+f.texelWidth:"",f?"#define CUBEUV_TEXEL_HEIGHT "+f.texelHeight:"",f?"#define CUBEUV_MAX_MIP "+f.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==xn?"#define TONE_MAPPING":"",e.toneMapping!==xn?Lt.tonemapping_pars_fragment:"",e.toneMapping!==xn?bp("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Lt.colorspace_pars_fragment,Ep("linearToOutputTexel",e.outputColorSpace),Tp(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(Ui).join(`
`)),o=xo(o),o=Ua(o,e),o=Na(o,e),a=xo(a),a=Ua(a,e),a=Na(a,e),o=Fa(o),a=Fa(a),e.isRawShaderMaterial!==!0&&(S=`#version 300 es
`,p=[m,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,u=["#define varying in",e.glslVersion===ta?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===ta?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+u);const M=S+p+o,x=S+u+a,C=Da(s,s.VERTEX_SHADER,M),A=Da(s,s.FRAGMENT_SHADER,x);s.attachShader(v,C),s.attachShader(v,A),e.index0AttributeName!==void 0?s.bindAttribLocation(v,0,e.index0AttributeName):e.morphTargets===!0&&s.bindAttribLocation(v,0,"position"),s.linkProgram(v);function T(b){if(i.debug.checkShaderErrors){const k=s.getProgramInfoLog(v).trim(),B=s.getShaderInfoLog(C).trim(),W=s.getShaderInfoLog(A).trim();let K=!0,G=!0;if(s.getProgramParameter(v,s.LINK_STATUS)===!1)if(K=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,v,C,A);else{const j=Ia(s,C,"vertex"),z=Ia(s,A,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(v,s.VALIDATE_STATUS)+`

Material Name: `+b.name+`
Material Type: `+b.type+`

Program Info Log: `+k+`
`+j+`
`+z)}else k!==""?console.warn("THREE.WebGLProgram: Program Info Log:",k):(B===""||W==="")&&(G=!1);G&&(b.diagnostics={runnable:K,programLog:k,vertexShader:{log:B,prefix:p},fragmentShader:{log:W,prefix:u}})}s.deleteShader(C),s.deleteShader(A),P=new Rs(s,v),V=Cp(s,v)}let P;this.getUniforms=function(){return P===void 0&&T(this),P};let V;this.getAttributes=function(){return V===void 0&&T(this),V};let _=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return _===!1&&(_=s.getProgramParameter(v,xp)),_},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(v),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=yp++,this.cacheKey=t,this.usedTimes=1,this.program=v,this.vertexShader=C,this.fragmentShader=A,this}let zp=0;class Hp{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){const e=t.vertexShader,n=t.fragmentShader,s=this._getShaderStage(e),r=this._getShaderStage(n),o=this._getShaderCacheForMaterial(t);return o.has(s)===!1&&(o.add(s),s.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){const e=this.shaderCache;let n=e.get(t);return n===void 0&&(n=new Gp(t),e.set(t,n)),n}}class Gp{constructor(t){this.id=zp++,this.code=t,this.usedTimes=0}}function Vp(i,t,e,n,s,r,o){const a=new Uo,l=new Hp,c=new Set,d=[],h=s.logarithmicDepthBuffer,f=s.reverseDepthBuffer,m=s.vertexTextures;let g=s.precision;const v={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function p(_){return c.add(_),_===0?"uv":`uv${_}`}function u(_,b,k,B,W){const K=B.fog,G=W.geometry,j=_.isMeshStandardMaterial?B.environment:null,z=(_.isMeshStandardMaterial?e:t).get(_.envMap||j),it=z&&z.mapping===Bs?z.image.height:null,at=v[_.type];_.precision!==null&&(g=s.getMaxPrecision(_.precision),g!==_.precision&&console.warn("THREE.WebGLProgram.getParameters:",_.precision,"not supported, using",g,"instead."));const st=G.morphAttributes.position||G.morphAttributes.normal||G.morphAttributes.color,It=st!==void 0?st.length:0;let qt=0;G.morphAttributes.position!==void 0&&(qt=1),G.morphAttributes.normal!==void 0&&(qt=2),G.morphAttributes.color!==void 0&&(qt=3);let X,J,mt,ht;if(at){const Se=Ye[at];X=Se.vertexShader,J=Se.fragmentShader}else X=_.vertexShader,J=_.fragmentShader,l.update(_),mt=l.getVertexShaderID(_),ht=l.getFragmentShaderID(_);const wt=i.getRenderTarget(),Mt=W.isInstancedMesh===!0,Ft=W.isBatchedMesh===!0,Kt=!!_.map,Ot=!!_.matcap,R=!!z,Ce=!!_.aoMap,Ut=!!_.lightMap,zt=!!_.bumpMap,Et=!!_.normalMap,Qt=!!_.displacementMap,At=!!_.emissiveMap,w=!!_.metalnessMap,y=!!_.roughnessMap,N=_.anisotropy>0,Y=_.clearcoat>0,Z=_.dispersion>0,$=_.iridescence>0,_t=_.sheen>0,nt=_.transmission>0,ut=N&&!!_.anisotropyMap,Ht=Y&&!!_.clearcoatMap,Q=Y&&!!_.clearcoatNormalMap,dt=Y&&!!_.clearcoatRoughnessMap,bt=$&&!!_.iridescenceMap,Tt=$&&!!_.iridescenceThicknessMap,ft=_t&&!!_.sheenColorMap,Nt=_t&&!!_.sheenRoughnessMap,Ct=!!_.specularMap,Jt=!!_.specularColorMap,L=!!_.specularIntensityMap,lt=nt&&!!_.transmissionMap,H=nt&&!!_.thicknessMap,q=!!_.gradientMap,rt=!!_.alphaMap,ct=_.alphaTest>0,Bt=!!_.alphaHash,ae=!!_.extensions;let Me=xn;_.toneMapped&&(wt===null||wt.isXRRenderTarget===!0)&&(Me=i.toneMapping);const Vt={shaderID:at,shaderType:_.type,shaderName:_.name,vertexShader:X,fragmentShader:J,defines:_.defines,customVertexShaderID:mt,customFragmentShaderID:ht,isRawShaderMaterial:_.isRawShaderMaterial===!0,glslVersion:_.glslVersion,precision:g,batching:Ft,batchingColor:Ft&&W._colorsTexture!==null,instancing:Mt,instancingColor:Mt&&W.instanceColor!==null,instancingMorph:Mt&&W.morphTexture!==null,supportsVertexTextures:m,outputColorSpace:wt===null?i.outputColorSpace:wt.isXRRenderTarget===!0?wt.texture.colorSpace:En,alphaToCoverage:!!_.alphaToCoverage,map:Kt,matcap:Ot,envMap:R,envMapMode:R&&z.mapping,envMapCubeUVHeight:it,aoMap:Ce,lightMap:Ut,bumpMap:zt,normalMap:Et,displacementMap:m&&Qt,emissiveMap:At,normalMapObjectSpace:Et&&_.normalMapType===qc,normalMapTangentSpace:Et&&_.normalMapType===Sl,metalnessMap:w,roughnessMap:y,anisotropy:N,anisotropyMap:ut,clearcoat:Y,clearcoatMap:Ht,clearcoatNormalMap:Q,clearcoatRoughnessMap:dt,dispersion:Z,iridescence:$,iridescenceMap:bt,iridescenceThicknessMap:Tt,sheen:_t,sheenColorMap:ft,sheenRoughnessMap:Nt,specularMap:Ct,specularColorMap:Jt,specularIntensityMap:L,transmission:nt,transmissionMap:lt,thicknessMap:H,gradientMap:q,opaque:_.transparent===!1&&_.blending===fi&&_.alphaToCoverage===!1,alphaMap:rt,alphaTest:ct,alphaHash:Bt,combine:_.combine,mapUv:Kt&&p(_.map.channel),aoMapUv:Ce&&p(_.aoMap.channel),lightMapUv:Ut&&p(_.lightMap.channel),bumpMapUv:zt&&p(_.bumpMap.channel),normalMapUv:Et&&p(_.normalMap.channel),displacementMapUv:Qt&&p(_.displacementMap.channel),emissiveMapUv:At&&p(_.emissiveMap.channel),metalnessMapUv:w&&p(_.metalnessMap.channel),roughnessMapUv:y&&p(_.roughnessMap.channel),anisotropyMapUv:ut&&p(_.anisotropyMap.channel),clearcoatMapUv:Ht&&p(_.clearcoatMap.channel),clearcoatNormalMapUv:Q&&p(_.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:dt&&p(_.clearcoatRoughnessMap.channel),iridescenceMapUv:bt&&p(_.iridescenceMap.channel),iridescenceThicknessMapUv:Tt&&p(_.iridescenceThicknessMap.channel),sheenColorMapUv:ft&&p(_.sheenColorMap.channel),sheenRoughnessMapUv:Nt&&p(_.sheenRoughnessMap.channel),specularMapUv:Ct&&p(_.specularMap.channel),specularColorMapUv:Jt&&p(_.specularColorMap.channel),specularIntensityMapUv:L&&p(_.specularIntensityMap.channel),transmissionMapUv:lt&&p(_.transmissionMap.channel),thicknessMapUv:H&&p(_.thicknessMap.channel),alphaMapUv:rt&&p(_.alphaMap.channel),vertexTangents:!!G.attributes.tangent&&(Et||N),vertexColors:_.vertexColors,vertexAlphas:_.vertexColors===!0&&!!G.attributes.color&&G.attributes.color.itemSize===4,pointsUvs:W.isPoints===!0&&!!G.attributes.uv&&(Kt||rt),fog:!!K,useFog:_.fog===!0,fogExp2:!!K&&K.isFogExp2,flatShading:_.flatShading===!0,sizeAttenuation:_.sizeAttenuation===!0,logarithmicDepthBuffer:h,reverseDepthBuffer:f,skinning:W.isSkinnedMesh===!0,morphTargets:G.morphAttributes.position!==void 0,morphNormals:G.morphAttributes.normal!==void 0,morphColors:G.morphAttributes.color!==void 0,morphTargetsCount:It,morphTextureStride:qt,numDirLights:b.directional.length,numPointLights:b.point.length,numSpotLights:b.spot.length,numSpotLightMaps:b.spotLightMap.length,numRectAreaLights:b.rectArea.length,numHemiLights:b.hemi.length,numDirLightShadows:b.directionalShadowMap.length,numPointLightShadows:b.pointShadowMap.length,numSpotLightShadows:b.spotShadowMap.length,numSpotLightShadowsWithMaps:b.numSpotLightShadowsWithMaps,numLightProbes:b.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:_.dithering,shadowMapEnabled:i.shadowMap.enabled&&k.length>0,shadowMapType:i.shadowMap.type,toneMapping:Me,decodeVideoTexture:Kt&&_.map.isVideoTexture===!0&&$t.getTransfer(_.map.colorSpace)===ee,premultipliedAlpha:_.premultipliedAlpha,doubleSided:_.side===nn,flipSided:_.side===Te,useDepthPacking:_.depthPacking>=0,depthPacking:_.depthPacking||0,index0AttributeName:_.index0AttributeName,extensionClipCullDistance:ae&&_.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ae&&_.extensions.multiDraw===!0||Ft)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:_.customProgramCacheKey()};return Vt.vertexUv1s=c.has(1),Vt.vertexUv2s=c.has(2),Vt.vertexUv3s=c.has(3),c.clear(),Vt}function S(_){const b=[];if(_.shaderID?b.push(_.shaderID):(b.push(_.customVertexShaderID),b.push(_.customFragmentShaderID)),_.defines!==void 0)for(const k in _.defines)b.push(k),b.push(_.defines[k]);return _.isRawShaderMaterial===!1&&(M(b,_),x(b,_),b.push(i.outputColorSpace)),b.push(_.customProgramCacheKey),b.join()}function M(_,b){_.push(b.precision),_.push(b.outputColorSpace),_.push(b.envMapMode),_.push(b.envMapCubeUVHeight),_.push(b.mapUv),_.push(b.alphaMapUv),_.push(b.lightMapUv),_.push(b.aoMapUv),_.push(b.bumpMapUv),_.push(b.normalMapUv),_.push(b.displacementMapUv),_.push(b.emissiveMapUv),_.push(b.metalnessMapUv),_.push(b.roughnessMapUv),_.push(b.anisotropyMapUv),_.push(b.clearcoatMapUv),_.push(b.clearcoatNormalMapUv),_.push(b.clearcoatRoughnessMapUv),_.push(b.iridescenceMapUv),_.push(b.iridescenceThicknessMapUv),_.push(b.sheenColorMapUv),_.push(b.sheenRoughnessMapUv),_.push(b.specularMapUv),_.push(b.specularColorMapUv),_.push(b.specularIntensityMapUv),_.push(b.transmissionMapUv),_.push(b.thicknessMapUv),_.push(b.combine),_.push(b.fogExp2),_.push(b.sizeAttenuation),_.push(b.morphTargetsCount),_.push(b.morphAttributeCount),_.push(b.numDirLights),_.push(b.numPointLights),_.push(b.numSpotLights),_.push(b.numSpotLightMaps),_.push(b.numHemiLights),_.push(b.numRectAreaLights),_.push(b.numDirLightShadows),_.push(b.numPointLightShadows),_.push(b.numSpotLightShadows),_.push(b.numSpotLightShadowsWithMaps),_.push(b.numLightProbes),_.push(b.shadowMapType),_.push(b.toneMapping),_.push(b.numClippingPlanes),_.push(b.numClipIntersection),_.push(b.depthPacking)}function x(_,b){a.disableAll(),b.supportsVertexTextures&&a.enable(0),b.instancing&&a.enable(1),b.instancingColor&&a.enable(2),b.instancingMorph&&a.enable(3),b.matcap&&a.enable(4),b.envMap&&a.enable(5),b.normalMapObjectSpace&&a.enable(6),b.normalMapTangentSpace&&a.enable(7),b.clearcoat&&a.enable(8),b.iridescence&&a.enable(9),b.alphaTest&&a.enable(10),b.vertexColors&&a.enable(11),b.vertexAlphas&&a.enable(12),b.vertexUv1s&&a.enable(13),b.vertexUv2s&&a.enable(14),b.vertexUv3s&&a.enable(15),b.vertexTangents&&a.enable(16),b.anisotropy&&a.enable(17),b.alphaHash&&a.enable(18),b.batching&&a.enable(19),b.dispersion&&a.enable(20),b.batchingColor&&a.enable(21),_.push(a.mask),a.disableAll(),b.fog&&a.enable(0),b.useFog&&a.enable(1),b.flatShading&&a.enable(2),b.logarithmicDepthBuffer&&a.enable(3),b.reverseDepthBuffer&&a.enable(4),b.skinning&&a.enable(5),b.morphTargets&&a.enable(6),b.morphNormals&&a.enable(7),b.morphColors&&a.enable(8),b.premultipliedAlpha&&a.enable(9),b.shadowMapEnabled&&a.enable(10),b.doubleSided&&a.enable(11),b.flipSided&&a.enable(12),b.useDepthPacking&&a.enable(13),b.dithering&&a.enable(14),b.transmission&&a.enable(15),b.sheen&&a.enable(16),b.opaque&&a.enable(17),b.pointsUvs&&a.enable(18),b.decodeVideoTexture&&a.enable(19),b.alphaToCoverage&&a.enable(20),_.push(a.mask)}function C(_){const b=v[_.type];let k;if(b){const B=Ye[b];k=Th.clone(B.uniforms)}else k=_.uniforms;return k}function A(_,b){let k;for(let B=0,W=d.length;B<W;B++){const K=d[B];if(K.cacheKey===b){k=K,++k.usedTimes;break}}return k===void 0&&(k=new kp(i,b,_,r),d.push(k)),k}function T(_){if(--_.usedTimes===0){const b=d.indexOf(_);d[b]=d[d.length-1],d.pop(),_.destroy()}}function P(_){l.remove(_)}function V(){l.dispose()}return{getParameters:u,getProgramCacheKey:S,getUniforms:C,acquireProgram:A,releaseProgram:T,releaseShaderCache:P,programs:d,dispose:V}}function Wp(){let i=new WeakMap;function t(o){return i.has(o)}function e(o){let a=i.get(o);return a===void 0&&(a={},i.set(o,a)),a}function n(o){i.delete(o)}function s(o,a,l){i.get(o)[a]=l}function r(){i=new WeakMap}return{has:t,get:e,remove:n,update:s,dispose:r}}function Xp(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.z!==t.z?i.z-t.z:i.id-t.id}function Ba(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function ka(){const i=[];let t=0;const e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function o(h,f,m,g,v,p){let u=i[t];return u===void 0?(u={id:h.id,object:h,geometry:f,material:m,groupOrder:g,renderOrder:h.renderOrder,z:v,group:p},i[t]=u):(u.id=h.id,u.object=h,u.geometry=f,u.material=m,u.groupOrder=g,u.renderOrder=h.renderOrder,u.z=v,u.group=p),t++,u}function a(h,f,m,g,v,p){const u=o(h,f,m,g,v,p);m.transmission>0?n.push(u):m.transparent===!0?s.push(u):e.push(u)}function l(h,f,m,g,v,p){const u=o(h,f,m,g,v,p);m.transmission>0?n.unshift(u):m.transparent===!0?s.unshift(u):e.unshift(u)}function c(h,f){e.length>1&&e.sort(h||Xp),n.length>1&&n.sort(f||Ba),s.length>1&&s.sort(f||Ba)}function d(){for(let h=t,f=i.length;h<f;h++){const m=i[h];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:a,unshift:l,finish:d,sort:c}}function $p(){let i=new WeakMap;function t(n,s){const r=i.get(n);let o;return r===void 0?(o=new ka,i.set(n,[o])):s>=r.length?(o=new ka,r.push(o)):o=r[s],o}function e(){i=new WeakMap}return{get:t,dispose:e}}function Yp(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new U,color:new Pt};break;case"SpotLight":e={position:new U,direction:new U,color:new Pt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new U,color:new Pt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new U,skyColor:new Pt,groundColor:new Pt};break;case"RectAreaLight":e={color:new Pt,position:new U,halfWidth:new U,halfHeight:new U};break}return i[t.id]=e,e}}}function qp(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Rt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Rt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Rt,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}let jp=0;function Kp(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function Zp(i){const t=new Yp,e=qp(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new U);const s=new U,r=new ie,o=new ie;function a(c){let d=0,h=0,f=0;for(let V=0;V<9;V++)n.probe[V].set(0,0,0);let m=0,g=0,v=0,p=0,u=0,S=0,M=0,x=0,C=0,A=0,T=0;c.sort(Kp);for(let V=0,_=c.length;V<_;V++){const b=c[V],k=b.color,B=b.intensity,W=b.distance,K=b.shadow&&b.shadow.map?b.shadow.map.texture:null;if(b.isAmbientLight)d+=k.r*B,h+=k.g*B,f+=k.b*B;else if(b.isLightProbe){for(let G=0;G<9;G++)n.probe[G].addScaledVector(b.sh.coefficients[G],B);T++}else if(b.isDirectionalLight){const G=t.get(b);if(G.color.copy(b.color).multiplyScalar(b.intensity),b.castShadow){const j=b.shadow,z=e.get(b);z.shadowIntensity=j.intensity,z.shadowBias=j.bias,z.shadowNormalBias=j.normalBias,z.shadowRadius=j.radius,z.shadowMapSize=j.mapSize,n.directionalShadow[m]=z,n.directionalShadowMap[m]=K,n.directionalShadowMatrix[m]=b.shadow.matrix,S++}n.directional[m]=G,m++}else if(b.isSpotLight){const G=t.get(b);G.position.setFromMatrixPosition(b.matrixWorld),G.color.copy(k).multiplyScalar(B),G.distance=W,G.coneCos=Math.cos(b.angle),G.penumbraCos=Math.cos(b.angle*(1-b.penumbra)),G.decay=b.decay,n.spot[v]=G;const j=b.shadow;if(b.map&&(n.spotLightMap[C]=b.map,C++,j.updateMatrices(b),b.castShadow&&A++),n.spotLightMatrix[v]=j.matrix,b.castShadow){const z=e.get(b);z.shadowIntensity=j.intensity,z.shadowBias=j.bias,z.shadowNormalBias=j.normalBias,z.shadowRadius=j.radius,z.shadowMapSize=j.mapSize,n.spotShadow[v]=z,n.spotShadowMap[v]=K,x++}v++}else if(b.isRectAreaLight){const G=t.get(b);G.color.copy(k).multiplyScalar(B),G.halfWidth.set(b.width*.5,0,0),G.halfHeight.set(0,b.height*.5,0),n.rectArea[p]=G,p++}else if(b.isPointLight){const G=t.get(b);if(G.color.copy(b.color).multiplyScalar(b.intensity),G.distance=b.distance,G.decay=b.decay,b.castShadow){const j=b.shadow,z=e.get(b);z.shadowIntensity=j.intensity,z.shadowBias=j.bias,z.shadowNormalBias=j.normalBias,z.shadowRadius=j.radius,z.shadowMapSize=j.mapSize,z.shadowCameraNear=j.camera.near,z.shadowCameraFar=j.camera.far,n.pointShadow[g]=z,n.pointShadowMap[g]=K,n.pointShadowMatrix[g]=b.shadow.matrix,M++}n.point[g]=G,g++}else if(b.isHemisphereLight){const G=t.get(b);G.skyColor.copy(b.color).multiplyScalar(B),G.groundColor.copy(b.groundColor).multiplyScalar(B),n.hemi[u]=G,u++}}p>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=et.LTC_FLOAT_1,n.rectAreaLTC2=et.LTC_FLOAT_2):(n.rectAreaLTC1=et.LTC_HALF_1,n.rectAreaLTC2=et.LTC_HALF_2)),n.ambient[0]=d,n.ambient[1]=h,n.ambient[2]=f;const P=n.hash;(P.directionalLength!==m||P.pointLength!==g||P.spotLength!==v||P.rectAreaLength!==p||P.hemiLength!==u||P.numDirectionalShadows!==S||P.numPointShadows!==M||P.numSpotShadows!==x||P.numSpotMaps!==C||P.numLightProbes!==T)&&(n.directional.length=m,n.spot.length=v,n.rectArea.length=p,n.point.length=g,n.hemi.length=u,n.directionalShadow.length=S,n.directionalShadowMap.length=S,n.pointShadow.length=M,n.pointShadowMap.length=M,n.spotShadow.length=x,n.spotShadowMap.length=x,n.directionalShadowMatrix.length=S,n.pointShadowMatrix.length=M,n.spotLightMatrix.length=x+C-A,n.spotLightMap.length=C,n.numSpotLightShadowsWithMaps=A,n.numLightProbes=T,P.directionalLength=m,P.pointLength=g,P.spotLength=v,P.rectAreaLength=p,P.hemiLength=u,P.numDirectionalShadows=S,P.numPointShadows=M,P.numSpotShadows=x,P.numSpotMaps=C,P.numLightProbes=T,n.version=jp++)}function l(c,d){let h=0,f=0,m=0,g=0,v=0;const p=d.matrixWorldInverse;for(let u=0,S=c.length;u<S;u++){const M=c[u];if(M.isDirectionalLight){const x=n.directional[h];x.direction.setFromMatrixPosition(M.matrixWorld),s.setFromMatrixPosition(M.target.matrixWorld),x.direction.sub(s),x.direction.transformDirection(p),h++}else if(M.isSpotLight){const x=n.spot[m];x.position.setFromMatrixPosition(M.matrixWorld),x.position.applyMatrix4(p),x.direction.setFromMatrixPosition(M.matrixWorld),s.setFromMatrixPosition(M.target.matrixWorld),x.direction.sub(s),x.direction.transformDirection(p),m++}else if(M.isRectAreaLight){const x=n.rectArea[g];x.position.setFromMatrixPosition(M.matrixWorld),x.position.applyMatrix4(p),o.identity(),r.copy(M.matrixWorld),r.premultiply(p),o.extractRotation(r),x.halfWidth.set(M.width*.5,0,0),x.halfHeight.set(0,M.height*.5,0),x.halfWidth.applyMatrix4(o),x.halfHeight.applyMatrix4(o),g++}else if(M.isPointLight){const x=n.point[f];x.position.setFromMatrixPosition(M.matrixWorld),x.position.applyMatrix4(p),f++}else if(M.isHemisphereLight){const x=n.hemi[v];x.direction.setFromMatrixPosition(M.matrixWorld),x.direction.transformDirection(p),v++}}}return{setup:a,setupView:l,state:n}}function za(i){const t=new Zp(i),e=[],n=[];function s(d){c.camera=d,e.length=0,n.length=0}function r(d){e.push(d)}function o(d){n.push(d)}function a(){t.setup(e)}function l(d){t.setupView(e,d)}const c={lightsArray:e,shadowsArray:n,camera:null,lights:t,transmissionRenderTarget:{}};return{init:s,state:c,setupLights:a,setupLightsView:l,pushLight:r,pushShadow:o}}function Jp(i){let t=new WeakMap;function e(s,r=0){const o=t.get(s);let a;return o===void 0?(a=new za(i),t.set(s,[a])):r>=o.length?(a=new za(i),o.push(a)):a=o[r],a}function n(){t=new WeakMap}return{get:e,dispose:n}}class Qp extends Ei{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=$c,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class tm extends Ei{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}const em=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,nm=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function im(i,t,e){let n=new No;const s=new Rt,r=new Rt,o=new re,a=new Qp({depthPacking:Yc}),l=new tm,c={},d=e.maxTextureSize,h={[yn]:Te,[Te]:yn,[nn]:nn},f=new Mn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Rt},radius:{value:4}},vertexShader:em,fragmentShader:nm}),m=f.clone();m.defines.HORIZONTAL_PASS=1;const g=new fe;g.setAttribute("position",new ve(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const v=new $e(g,f),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=cl;let u=this.type;this.render=function(A,T,P){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||A.length===0)return;const V=i.getRenderTarget(),_=i.getActiveCubeFace(),b=i.getActiveMipmapLevel(),k=i.state;k.setBlending(vn),k.buffers.color.setClear(1,1,1,1),k.buffers.depth.setTest(!0),k.setScissorTest(!1);const B=u!==en&&this.type===en,W=u===en&&this.type!==en;for(let K=0,G=A.length;K<G;K++){const j=A[K],z=j.shadow;if(z===void 0){console.warn("THREE.WebGLShadowMap:",j,"has no shadow.");continue}if(z.autoUpdate===!1&&z.needsUpdate===!1)continue;s.copy(z.mapSize);const it=z.getFrameExtents();if(s.multiply(it),r.copy(z.mapSize),(s.x>d||s.y>d)&&(s.x>d&&(r.x=Math.floor(d/it.x),s.x=r.x*it.x,z.mapSize.x=r.x),s.y>d&&(r.y=Math.floor(d/it.y),s.y=r.y*it.y,z.mapSize.y=r.y)),z.map===null||B===!0||W===!0){const st=this.type!==en?{minFilter:Oe,magFilter:Oe}:{};z.map!==null&&z.map.dispose(),z.map=new Gn(s.x,s.y,st),z.map.texture.name=j.name+".shadowMap",z.camera.updateProjectionMatrix()}i.setRenderTarget(z.map),i.clear();const at=z.getViewportCount();for(let st=0;st<at;st++){const It=z.getViewport(st);o.set(r.x*It.x,r.y*It.y,r.x*It.z,r.y*It.w),k.viewport(o),z.updateMatrices(j,st),n=z.getFrustum(),x(T,P,z.camera,j,this.type)}z.isPointLightShadow!==!0&&this.type===en&&S(z,P),z.needsUpdate=!1}u=this.type,p.needsUpdate=!1,i.setRenderTarget(V,_,b)};function S(A,T){const P=t.update(v);f.defines.VSM_SAMPLES!==A.blurSamples&&(f.defines.VSM_SAMPLES=A.blurSamples,m.defines.VSM_SAMPLES=A.blurSamples,f.needsUpdate=!0,m.needsUpdate=!0),A.mapPass===null&&(A.mapPass=new Gn(s.x,s.y)),f.uniforms.shadow_pass.value=A.map.texture,f.uniforms.resolution.value=A.mapSize,f.uniforms.radius.value=A.radius,i.setRenderTarget(A.mapPass),i.clear(),i.renderBufferDirect(T,null,P,f,v,null),m.uniforms.shadow_pass.value=A.mapPass.texture,m.uniforms.resolution.value=A.mapSize,m.uniforms.radius.value=A.radius,i.setRenderTarget(A.map),i.clear(),i.renderBufferDirect(T,null,P,m,v,null)}function M(A,T,P,V){let _=null;const b=P.isPointLight===!0?A.customDistanceMaterial:A.customDepthMaterial;if(b!==void 0)_=b;else if(_=P.isPointLight===!0?l:a,i.localClippingEnabled&&T.clipShadows===!0&&Array.isArray(T.clippingPlanes)&&T.clippingPlanes.length!==0||T.displacementMap&&T.displacementScale!==0||T.alphaMap&&T.alphaTest>0||T.map&&T.alphaTest>0){const k=_.uuid,B=T.uuid;let W=c[k];W===void 0&&(W={},c[k]=W);let K=W[B];K===void 0&&(K=_.clone(),W[B]=K,T.addEventListener("dispose",C)),_=K}if(_.visible=T.visible,_.wireframe=T.wireframe,V===en?_.side=T.shadowSide!==null?T.shadowSide:T.side:_.side=T.shadowSide!==null?T.shadowSide:h[T.side],_.alphaMap=T.alphaMap,_.alphaTest=T.alphaTest,_.map=T.map,_.clipShadows=T.clipShadows,_.clippingPlanes=T.clippingPlanes,_.clipIntersection=T.clipIntersection,_.displacementMap=T.displacementMap,_.displacementScale=T.displacementScale,_.displacementBias=T.displacementBias,_.wireframeLinewidth=T.wireframeLinewidth,_.linewidth=T.linewidth,P.isPointLight===!0&&_.isMeshDistanceMaterial===!0){const k=i.properties.get(_);k.light=P}return _}function x(A,T,P,V,_){if(A.visible===!1)return;if(A.layers.test(T.layers)&&(A.isMesh||A.isLine||A.isPoints)&&(A.castShadow||A.receiveShadow&&_===en)&&(!A.frustumCulled||n.intersectsObject(A))){A.modelViewMatrix.multiplyMatrices(P.matrixWorldInverse,A.matrixWorld);const B=t.update(A),W=A.material;if(Array.isArray(W)){const K=B.groups;for(let G=0,j=K.length;G<j;G++){const z=K[G],it=W[z.materialIndex];if(it&&it.visible){const at=M(A,it,V,_);A.onBeforeShadow(i,A,T,P,B,at,z),i.renderBufferDirect(P,null,B,at,A,z),A.onAfterShadow(i,A,T,P,B,at,z)}}}else if(W.visible){const K=M(A,W,V,_);A.onBeforeShadow(i,A,T,P,B,K,null),i.renderBufferDirect(P,null,B,K,A,null),A.onAfterShadow(i,A,T,P,B,K,null)}}const k=A.children;for(let B=0,W=k.length;B<W;B++)x(k[B],T,P,V,_)}function C(A){A.target.removeEventListener("dispose",C);for(const P in c){const V=c[P],_=A.target.uuid;_ in V&&(V[_].dispose(),delete V[_])}}}const sm={[Ur]:Nr,[Fr]:kr,[Or]:zr,[gi]:Br,[Nr]:Ur,[kr]:Fr,[zr]:Or,[Br]:gi};function rm(i){function t(){let L=!1;const lt=new re;let H=null;const q=new re(0,0,0,0);return{setMask:function(rt){H!==rt&&!L&&(i.colorMask(rt,rt,rt,rt),H=rt)},setLocked:function(rt){L=rt},setClear:function(rt,ct,Bt,ae,Me){Me===!0&&(rt*=ae,ct*=ae,Bt*=ae),lt.set(rt,ct,Bt,ae),q.equals(lt)===!1&&(i.clearColor(rt,ct,Bt,ae),q.copy(lt))},reset:function(){L=!1,H=null,q.set(-1,0,0,0)}}}function e(){let L=!1,lt=!1,H=null,q=null,rt=null;return{setReversed:function(ct){lt=ct},setTest:function(ct){ct?mt(i.DEPTH_TEST):ht(i.DEPTH_TEST)},setMask:function(ct){H!==ct&&!L&&(i.depthMask(ct),H=ct)},setFunc:function(ct){if(lt&&(ct=sm[ct]),q!==ct){switch(ct){case Ur:i.depthFunc(i.NEVER);break;case Nr:i.depthFunc(i.ALWAYS);break;case Fr:i.depthFunc(i.LESS);break;case gi:i.depthFunc(i.LEQUAL);break;case Or:i.depthFunc(i.EQUAL);break;case Br:i.depthFunc(i.GEQUAL);break;case kr:i.depthFunc(i.GREATER);break;case zr:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}q=ct}},setLocked:function(ct){L=ct},setClear:function(ct){rt!==ct&&(i.clearDepth(ct),rt=ct)},reset:function(){L=!1,H=null,q=null,rt=null}}}function n(){let L=!1,lt=null,H=null,q=null,rt=null,ct=null,Bt=null,ae=null,Me=null;return{setTest:function(Vt){L||(Vt?mt(i.STENCIL_TEST):ht(i.STENCIL_TEST))},setMask:function(Vt){lt!==Vt&&!L&&(i.stencilMask(Vt),lt=Vt)},setFunc:function(Vt,Se,je){(H!==Vt||q!==Se||rt!==je)&&(i.stencilFunc(Vt,Se,je),H=Vt,q=Se,rt=je)},setOp:function(Vt,Se,je){(ct!==Vt||Bt!==Se||ae!==je)&&(i.stencilOp(Vt,Se,je),ct=Vt,Bt=Se,ae=je)},setLocked:function(Vt){L=Vt},setClear:function(Vt){Me!==Vt&&(i.clearStencil(Vt),Me=Vt)},reset:function(){L=!1,lt=null,H=null,q=null,rt=null,ct=null,Bt=null,ae=null,Me=null}}}const s=new t,r=new e,o=new n,a=new WeakMap,l=new WeakMap;let c={},d={},h=new WeakMap,f=[],m=null,g=!1,v=null,p=null,u=null,S=null,M=null,x=null,C=null,A=new Pt(0,0,0),T=0,P=!1,V=null,_=null,b=null,k=null,B=null;const W=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let K=!1,G=0;const j=i.getParameter(i.VERSION);j.indexOf("WebGL")!==-1?(G=parseFloat(/^WebGL (\d)/.exec(j)[1]),K=G>=1):j.indexOf("OpenGL ES")!==-1&&(G=parseFloat(/^OpenGL ES (\d)/.exec(j)[1]),K=G>=2);let z=null,it={};const at=i.getParameter(i.SCISSOR_BOX),st=i.getParameter(i.VIEWPORT),It=new re().fromArray(at),qt=new re().fromArray(st);function X(L,lt,H,q){const rt=new Uint8Array(4),ct=i.createTexture();i.bindTexture(L,ct),i.texParameteri(L,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(L,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Bt=0;Bt<H;Bt++)L===i.TEXTURE_3D||L===i.TEXTURE_2D_ARRAY?i.texImage3D(lt,0,i.RGBA,1,1,q,0,i.RGBA,i.UNSIGNED_BYTE,rt):i.texImage2D(lt+Bt,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,rt);return ct}const J={};J[i.TEXTURE_2D]=X(i.TEXTURE_2D,i.TEXTURE_2D,1),J[i.TEXTURE_CUBE_MAP]=X(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),J[i.TEXTURE_2D_ARRAY]=X(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),J[i.TEXTURE_3D]=X(i.TEXTURE_3D,i.TEXTURE_3D,1,1),s.setClear(0,0,0,1),r.setClear(1),o.setClear(0),mt(i.DEPTH_TEST),r.setFunc(gi),Ut(!1),zt(qo),mt(i.CULL_FACE),R(vn);function mt(L){c[L]!==!0&&(i.enable(L),c[L]=!0)}function ht(L){c[L]!==!1&&(i.disable(L),c[L]=!1)}function wt(L,lt){return d[L]!==lt?(i.bindFramebuffer(L,lt),d[L]=lt,L===i.DRAW_FRAMEBUFFER&&(d[i.FRAMEBUFFER]=lt),L===i.FRAMEBUFFER&&(d[i.DRAW_FRAMEBUFFER]=lt),!0):!1}function Mt(L,lt){let H=f,q=!1;if(L){H=h.get(lt),H===void 0&&(H=[],h.set(lt,H));const rt=L.textures;if(H.length!==rt.length||H[0]!==i.COLOR_ATTACHMENT0){for(let ct=0,Bt=rt.length;ct<Bt;ct++)H[ct]=i.COLOR_ATTACHMENT0+ct;H.length=rt.length,q=!0}}else H[0]!==i.BACK&&(H[0]=i.BACK,q=!0);q&&i.drawBuffers(H)}function Ft(L){return m!==L?(i.useProgram(L),m=L,!0):!1}const Kt={[Dn]:i.FUNC_ADD,[xc]:i.FUNC_SUBTRACT,[yc]:i.FUNC_REVERSE_SUBTRACT};Kt[Mc]=i.MIN,Kt[Sc]=i.MAX;const Ot={[Ec]:i.ZERO,[bc]:i.ONE,[Tc]:i.SRC_COLOR,[Dr]:i.SRC_ALPHA,[Lc]:i.SRC_ALPHA_SATURATE,[Rc]:i.DST_COLOR,[wc]:i.DST_ALPHA,[Ac]:i.ONE_MINUS_SRC_COLOR,[Ir]:i.ONE_MINUS_SRC_ALPHA,[Pc]:i.ONE_MINUS_DST_COLOR,[Cc]:i.ONE_MINUS_DST_ALPHA,[Dc]:i.CONSTANT_COLOR,[Ic]:i.ONE_MINUS_CONSTANT_COLOR,[Uc]:i.CONSTANT_ALPHA,[Nc]:i.ONE_MINUS_CONSTANT_ALPHA};function R(L,lt,H,q,rt,ct,Bt,ae,Me,Vt){if(L===vn){g===!0&&(ht(i.BLEND),g=!1);return}if(g===!1&&(mt(i.BLEND),g=!0),L!==vc){if(L!==v||Vt!==P){if((p!==Dn||M!==Dn)&&(i.blendEquation(i.FUNC_ADD),p=Dn,M=Dn),Vt)switch(L){case fi:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case jo:i.blendFunc(i.ONE,i.ONE);break;case Ko:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Zo:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",L);break}else switch(L){case fi:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case jo:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case Ko:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Zo:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",L);break}u=null,S=null,x=null,C=null,A.set(0,0,0),T=0,v=L,P=Vt}return}rt=rt||lt,ct=ct||H,Bt=Bt||q,(lt!==p||rt!==M)&&(i.blendEquationSeparate(Kt[lt],Kt[rt]),p=lt,M=rt),(H!==u||q!==S||ct!==x||Bt!==C)&&(i.blendFuncSeparate(Ot[H],Ot[q],Ot[ct],Ot[Bt]),u=H,S=q,x=ct,C=Bt),(ae.equals(A)===!1||Me!==T)&&(i.blendColor(ae.r,ae.g,ae.b,Me),A.copy(ae),T=Me),v=L,P=!1}function Ce(L,lt){L.side===nn?ht(i.CULL_FACE):mt(i.CULL_FACE);let H=L.side===Te;lt&&(H=!H),Ut(H),L.blending===fi&&L.transparent===!1?R(vn):R(L.blending,L.blendEquation,L.blendSrc,L.blendDst,L.blendEquationAlpha,L.blendSrcAlpha,L.blendDstAlpha,L.blendColor,L.blendAlpha,L.premultipliedAlpha),r.setFunc(L.depthFunc),r.setTest(L.depthTest),r.setMask(L.depthWrite),s.setMask(L.colorWrite);const q=L.stencilWrite;o.setTest(q),q&&(o.setMask(L.stencilWriteMask),o.setFunc(L.stencilFunc,L.stencilRef,L.stencilFuncMask),o.setOp(L.stencilFail,L.stencilZFail,L.stencilZPass)),Qt(L.polygonOffset,L.polygonOffsetFactor,L.polygonOffsetUnits),L.alphaToCoverage===!0?mt(i.SAMPLE_ALPHA_TO_COVERAGE):ht(i.SAMPLE_ALPHA_TO_COVERAGE)}function Ut(L){V!==L&&(L?i.frontFace(i.CW):i.frontFace(i.CCW),V=L)}function zt(L){L!==mc?(mt(i.CULL_FACE),L!==_&&(L===qo?i.cullFace(i.BACK):L===gc?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):ht(i.CULL_FACE),_=L}function Et(L){L!==b&&(K&&i.lineWidth(L),b=L)}function Qt(L,lt,H){L?(mt(i.POLYGON_OFFSET_FILL),(k!==lt||B!==H)&&(i.polygonOffset(lt,H),k=lt,B=H)):ht(i.POLYGON_OFFSET_FILL)}function At(L){L?mt(i.SCISSOR_TEST):ht(i.SCISSOR_TEST)}function w(L){L===void 0&&(L=i.TEXTURE0+W-1),z!==L&&(i.activeTexture(L),z=L)}function y(L,lt,H){H===void 0&&(z===null?H=i.TEXTURE0+W-1:H=z);let q=it[H];q===void 0&&(q={type:void 0,texture:void 0},it[H]=q),(q.type!==L||q.texture!==lt)&&(z!==H&&(i.activeTexture(H),z=H),i.bindTexture(L,lt||J[L]),q.type=L,q.texture=lt)}function N(){const L=it[z];L!==void 0&&L.type!==void 0&&(i.bindTexture(L.type,null),L.type=void 0,L.texture=void 0)}function Y(){try{i.compressedTexImage2D.apply(i,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Z(){try{i.compressedTexImage3D.apply(i,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function $(){try{i.texSubImage2D.apply(i,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function _t(){try{i.texSubImage3D.apply(i,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function nt(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function ut(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Ht(){try{i.texStorage2D.apply(i,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Q(){try{i.texStorage3D.apply(i,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function dt(){try{i.texImage2D.apply(i,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function bt(){try{i.texImage3D.apply(i,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Tt(L){It.equals(L)===!1&&(i.scissor(L.x,L.y,L.z,L.w),It.copy(L))}function ft(L){qt.equals(L)===!1&&(i.viewport(L.x,L.y,L.z,L.w),qt.copy(L))}function Nt(L,lt){let H=l.get(lt);H===void 0&&(H=new WeakMap,l.set(lt,H));let q=H.get(L);q===void 0&&(q=i.getUniformBlockIndex(lt,L.name),H.set(L,q))}function Ct(L,lt){const q=l.get(lt).get(L);a.get(lt)!==q&&(i.uniformBlockBinding(lt,q,L.__bindingPointIndex),a.set(lt,q))}function Jt(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),c={},z=null,it={},d={},h=new WeakMap,f=[],m=null,g=!1,v=null,p=null,u=null,S=null,M=null,x=null,C=null,A=new Pt(0,0,0),T=0,P=!1,V=null,_=null,b=null,k=null,B=null,It.set(0,0,i.canvas.width,i.canvas.height),qt.set(0,0,i.canvas.width,i.canvas.height),s.reset(),r.reset(),o.reset()}return{buffers:{color:s,depth:r,stencil:o},enable:mt,disable:ht,bindFramebuffer:wt,drawBuffers:Mt,useProgram:Ft,setBlending:R,setMaterial:Ce,setFlipSided:Ut,setCullFace:zt,setLineWidth:Et,setPolygonOffset:Qt,setScissorTest:At,activeTexture:w,bindTexture:y,unbindTexture:N,compressedTexImage2D:Y,compressedTexImage3D:Z,texImage2D:dt,texImage3D:bt,updateUBOMapping:Nt,uniformBlockBinding:Ct,texStorage2D:Ht,texStorage3D:Q,texSubImage2D:$,texSubImage3D:_t,compressedTexSubImage2D:nt,compressedTexSubImage3D:ut,scissor:Tt,viewport:ft,reset:Jt}}function Ha(i,t,e,n){const s=om(n);switch(e){case ml:return i*t;case _l:return i*t;case vl:return i*t*2;case xl:return i*t/s.components*s.byteLength;case Po:return i*t/s.components*s.byteLength;case yl:return i*t*2/s.components*s.byteLength;case Lo:return i*t*2/s.components*s.byteLength;case gl:return i*t*3/s.components*s.byteLength;case Xe:return i*t*4/s.components*s.byteLength;case Do:return i*t*4/s.components*s.byteLength;case Ss:case Es:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case bs:case Ts:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case $r:case qr:return Math.max(i,16)*Math.max(t,8)/4;case Xr:case Yr:return Math.max(i,8)*Math.max(t,8)/2;case jr:case Kr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case Zr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Jr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Qr:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case to:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case eo:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case no:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case io:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case so:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case ro:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case oo:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case ao:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case lo:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case co:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case ho:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case uo:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case As:case fo:case po:return Math.ceil(i/4)*Math.ceil(t/4)*16;case Ml:case mo:return Math.ceil(i/4)*Math.ceil(t/4)*8;case go:case _o:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function om(i){switch(i){case on:case dl:return{byteLength:1,components:1};case Oi:case fl:case Bi:return{byteLength:2,components:1};case Co:case Ro:return{byteLength:2,components:4};case Hn:case wo:case sn:return{byteLength:4,components:1};case pl:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}function am(i,t,e,n,s,r,o){const a=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Rt,d=new WeakMap;let h;const f=new WeakMap;let m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(w,y){return m?new OffscreenCanvas(w,y):Ns("canvas")}function v(w,y,N){let Y=1;const Z=At(w);if((Z.width>N||Z.height>N)&&(Y=N/Math.max(Z.width,Z.height)),Y<1)if(typeof HTMLImageElement<"u"&&w instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&w instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&w instanceof ImageBitmap||typeof VideoFrame<"u"&&w instanceof VideoFrame){const $=Math.floor(Y*Z.width),_t=Math.floor(Y*Z.height);h===void 0&&(h=g($,_t));const nt=y?g($,_t):h;return nt.width=$,nt.height=_t,nt.getContext("2d").drawImage(w,0,0,$,_t),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+Z.width+"x"+Z.height+") to ("+$+"x"+_t+")."),nt}else return"data"in w&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+Z.width+"x"+Z.height+")."),w;return w}function p(w){return w.generateMipmaps&&w.minFilter!==Oe&&w.minFilter!==Ve}function u(w){i.generateMipmap(w)}function S(w,y,N,Y,Z=!1){if(w!==null){if(i[w]!==void 0)return i[w];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+w+"'")}let $=y;if(y===i.RED&&(N===i.FLOAT&&($=i.R32F),N===i.HALF_FLOAT&&($=i.R16F),N===i.UNSIGNED_BYTE&&($=i.R8)),y===i.RED_INTEGER&&(N===i.UNSIGNED_BYTE&&($=i.R8UI),N===i.UNSIGNED_SHORT&&($=i.R16UI),N===i.UNSIGNED_INT&&($=i.R32UI),N===i.BYTE&&($=i.R8I),N===i.SHORT&&($=i.R16I),N===i.INT&&($=i.R32I)),y===i.RG&&(N===i.FLOAT&&($=i.RG32F),N===i.HALF_FLOAT&&($=i.RG16F),N===i.UNSIGNED_BYTE&&($=i.RG8)),y===i.RG_INTEGER&&(N===i.UNSIGNED_BYTE&&($=i.RG8UI),N===i.UNSIGNED_SHORT&&($=i.RG16UI),N===i.UNSIGNED_INT&&($=i.RG32UI),N===i.BYTE&&($=i.RG8I),N===i.SHORT&&($=i.RG16I),N===i.INT&&($=i.RG32I)),y===i.RGB_INTEGER&&(N===i.UNSIGNED_BYTE&&($=i.RGB8UI),N===i.UNSIGNED_SHORT&&($=i.RGB16UI),N===i.UNSIGNED_INT&&($=i.RGB32UI),N===i.BYTE&&($=i.RGB8I),N===i.SHORT&&($=i.RGB16I),N===i.INT&&($=i.RGB32I)),y===i.RGBA_INTEGER&&(N===i.UNSIGNED_BYTE&&($=i.RGBA8UI),N===i.UNSIGNED_SHORT&&($=i.RGBA16UI),N===i.UNSIGNED_INT&&($=i.RGBA32UI),N===i.BYTE&&($=i.RGBA8I),N===i.SHORT&&($=i.RGBA16I),N===i.INT&&($=i.RGBA32I)),y===i.RGB&&N===i.UNSIGNED_INT_5_9_9_9_REV&&($=i.RGB9_E5),y===i.RGBA){const _t=Z?Ls:$t.getTransfer(Y);N===i.FLOAT&&($=i.RGBA32F),N===i.HALF_FLOAT&&($=i.RGBA16F),N===i.UNSIGNED_BYTE&&($=_t===ee?i.SRGB8_ALPHA8:i.RGBA8),N===i.UNSIGNED_SHORT_4_4_4_4&&($=i.RGBA4),N===i.UNSIGNED_SHORT_5_5_5_1&&($=i.RGB5_A1)}return($===i.R16F||$===i.R32F||$===i.RG16F||$===i.RG32F||$===i.RGBA16F||$===i.RGBA32F)&&t.get("EXT_color_buffer_float"),$}function M(w,y){let N;return w?y===null||y===Hn||y===xi?N=i.DEPTH24_STENCIL8:y===sn?N=i.DEPTH32F_STENCIL8:y===Oi&&(N=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):y===null||y===Hn||y===xi?N=i.DEPTH_COMPONENT24:y===sn?N=i.DEPTH_COMPONENT32F:y===Oi&&(N=i.DEPTH_COMPONENT16),N}function x(w,y){return p(w)===!0||w.isFramebufferTexture&&w.minFilter!==Oe&&w.minFilter!==Ve?Math.log2(Math.max(y.width,y.height))+1:w.mipmaps!==void 0&&w.mipmaps.length>0?w.mipmaps.length:w.isCompressedTexture&&Array.isArray(w.image)?y.mipmaps.length:1}function C(w){const y=w.target;y.removeEventListener("dispose",C),T(y),y.isVideoTexture&&d.delete(y)}function A(w){const y=w.target;y.removeEventListener("dispose",A),V(y)}function T(w){const y=n.get(w);if(y.__webglInit===void 0)return;const N=w.source,Y=f.get(N);if(Y){const Z=Y[y.__cacheKey];Z.usedTimes--,Z.usedTimes===0&&P(w),Object.keys(Y).length===0&&f.delete(N)}n.remove(w)}function P(w){const y=n.get(w);i.deleteTexture(y.__webglTexture);const N=w.source,Y=f.get(N);delete Y[y.__cacheKey],o.memory.textures--}function V(w){const y=n.get(w);if(w.depthTexture&&w.depthTexture.dispose(),w.isWebGLCubeRenderTarget)for(let Y=0;Y<6;Y++){if(Array.isArray(y.__webglFramebuffer[Y]))for(let Z=0;Z<y.__webglFramebuffer[Y].length;Z++)i.deleteFramebuffer(y.__webglFramebuffer[Y][Z]);else i.deleteFramebuffer(y.__webglFramebuffer[Y]);y.__webglDepthbuffer&&i.deleteRenderbuffer(y.__webglDepthbuffer[Y])}else{if(Array.isArray(y.__webglFramebuffer))for(let Y=0;Y<y.__webglFramebuffer.length;Y++)i.deleteFramebuffer(y.__webglFramebuffer[Y]);else i.deleteFramebuffer(y.__webglFramebuffer);if(y.__webglDepthbuffer&&i.deleteRenderbuffer(y.__webglDepthbuffer),y.__webglMultisampledFramebuffer&&i.deleteFramebuffer(y.__webglMultisampledFramebuffer),y.__webglColorRenderbuffer)for(let Y=0;Y<y.__webglColorRenderbuffer.length;Y++)y.__webglColorRenderbuffer[Y]&&i.deleteRenderbuffer(y.__webglColorRenderbuffer[Y]);y.__webglDepthRenderbuffer&&i.deleteRenderbuffer(y.__webglDepthRenderbuffer)}const N=w.textures;for(let Y=0,Z=N.length;Y<Z;Y++){const $=n.get(N[Y]);$.__webglTexture&&(i.deleteTexture($.__webglTexture),o.memory.textures--),n.remove(N[Y])}n.remove(w)}let _=0;function b(){_=0}function k(){const w=_;return w>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+w+" texture units while this GPU supports only "+s.maxTextures),_+=1,w}function B(w){const y=[];return y.push(w.wrapS),y.push(w.wrapT),y.push(w.wrapR||0),y.push(w.magFilter),y.push(w.minFilter),y.push(w.anisotropy),y.push(w.internalFormat),y.push(w.format),y.push(w.type),y.push(w.generateMipmaps),y.push(w.premultiplyAlpha),y.push(w.flipY),y.push(w.unpackAlignment),y.push(w.colorSpace),y.join()}function W(w,y){const N=n.get(w);if(w.isVideoTexture&&Et(w),w.isRenderTargetTexture===!1&&w.version>0&&N.__version!==w.version){const Y=w.image;if(Y===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(Y.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{qt(N,w,y);return}}e.bindTexture(i.TEXTURE_2D,N.__webglTexture,i.TEXTURE0+y)}function K(w,y){const N=n.get(w);if(w.version>0&&N.__version!==w.version){qt(N,w,y);return}e.bindTexture(i.TEXTURE_2D_ARRAY,N.__webglTexture,i.TEXTURE0+y)}function G(w,y){const N=n.get(w);if(w.version>0&&N.__version!==w.version){qt(N,w,y);return}e.bindTexture(i.TEXTURE_3D,N.__webglTexture,i.TEXTURE0+y)}function j(w,y){const N=n.get(w);if(w.version>0&&N.__version!==w.version){X(N,w,y);return}e.bindTexture(i.TEXTURE_CUBE_MAP,N.__webglTexture,i.TEXTURE0+y)}const z={[Vr]:i.REPEAT,[Un]:i.CLAMP_TO_EDGE,[Wr]:i.MIRRORED_REPEAT},it={[Oe]:i.NEAREST,[Xc]:i.NEAREST_MIPMAP_NEAREST,[Yi]:i.NEAREST_MIPMAP_LINEAR,[Ve]:i.LINEAR,[js]:i.LINEAR_MIPMAP_NEAREST,[Nn]:i.LINEAR_MIPMAP_LINEAR},at={[jc]:i.NEVER,[eh]:i.ALWAYS,[Kc]:i.LESS,[El]:i.LEQUAL,[Zc]:i.EQUAL,[th]:i.GEQUAL,[Jc]:i.GREATER,[Qc]:i.NOTEQUAL};function st(w,y){if(y.type===sn&&t.has("OES_texture_float_linear")===!1&&(y.magFilter===Ve||y.magFilter===js||y.magFilter===Yi||y.magFilter===Nn||y.minFilter===Ve||y.minFilter===js||y.minFilter===Yi||y.minFilter===Nn)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(w,i.TEXTURE_WRAP_S,z[y.wrapS]),i.texParameteri(w,i.TEXTURE_WRAP_T,z[y.wrapT]),(w===i.TEXTURE_3D||w===i.TEXTURE_2D_ARRAY)&&i.texParameteri(w,i.TEXTURE_WRAP_R,z[y.wrapR]),i.texParameteri(w,i.TEXTURE_MAG_FILTER,it[y.magFilter]),i.texParameteri(w,i.TEXTURE_MIN_FILTER,it[y.minFilter]),y.compareFunction&&(i.texParameteri(w,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(w,i.TEXTURE_COMPARE_FUNC,at[y.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(y.magFilter===Oe||y.minFilter!==Yi&&y.minFilter!==Nn||y.type===sn&&t.has("OES_texture_float_linear")===!1)return;if(y.anisotropy>1||n.get(y).__currentAnisotropy){const N=t.get("EXT_texture_filter_anisotropic");i.texParameterf(w,N.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(y.anisotropy,s.getMaxAnisotropy())),n.get(y).__currentAnisotropy=y.anisotropy}}}function It(w,y){let N=!1;w.__webglInit===void 0&&(w.__webglInit=!0,y.addEventListener("dispose",C));const Y=y.source;let Z=f.get(Y);Z===void 0&&(Z={},f.set(Y,Z));const $=B(y);if($!==w.__cacheKey){Z[$]===void 0&&(Z[$]={texture:i.createTexture(),usedTimes:0},o.memory.textures++,N=!0),Z[$].usedTimes++;const _t=Z[w.__cacheKey];_t!==void 0&&(Z[w.__cacheKey].usedTimes--,_t.usedTimes===0&&P(y)),w.__cacheKey=$,w.__webglTexture=Z[$].texture}return N}function qt(w,y,N){let Y=i.TEXTURE_2D;(y.isDataArrayTexture||y.isCompressedArrayTexture)&&(Y=i.TEXTURE_2D_ARRAY),y.isData3DTexture&&(Y=i.TEXTURE_3D);const Z=It(w,y),$=y.source;e.bindTexture(Y,w.__webglTexture,i.TEXTURE0+N);const _t=n.get($);if($.version!==_t.__version||Z===!0){e.activeTexture(i.TEXTURE0+N);const nt=$t.getPrimaries($t.workingColorSpace),ut=y.colorSpace===_n?null:$t.getPrimaries(y.colorSpace),Ht=y.colorSpace===_n||nt===ut?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,y.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,y.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ht);let Q=v(y.image,!1,s.maxTextureSize);Q=Qt(y,Q);const dt=r.convert(y.format,y.colorSpace),bt=r.convert(y.type);let Tt=S(y.internalFormat,dt,bt,y.colorSpace,y.isVideoTexture);st(Y,y);let ft;const Nt=y.mipmaps,Ct=y.isVideoTexture!==!0,Jt=_t.__version===void 0||Z===!0,L=$.dataReady,lt=x(y,Q);if(y.isDepthTexture)Tt=M(y.format===yi,y.type),Jt&&(Ct?e.texStorage2D(i.TEXTURE_2D,1,Tt,Q.width,Q.height):e.texImage2D(i.TEXTURE_2D,0,Tt,Q.width,Q.height,0,dt,bt,null));else if(y.isDataTexture)if(Nt.length>0){Ct&&Jt&&e.texStorage2D(i.TEXTURE_2D,lt,Tt,Nt[0].width,Nt[0].height);for(let H=0,q=Nt.length;H<q;H++)ft=Nt[H],Ct?L&&e.texSubImage2D(i.TEXTURE_2D,H,0,0,ft.width,ft.height,dt,bt,ft.data):e.texImage2D(i.TEXTURE_2D,H,Tt,ft.width,ft.height,0,dt,bt,ft.data);y.generateMipmaps=!1}else Ct?(Jt&&e.texStorage2D(i.TEXTURE_2D,lt,Tt,Q.width,Q.height),L&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,Q.width,Q.height,dt,bt,Q.data)):e.texImage2D(i.TEXTURE_2D,0,Tt,Q.width,Q.height,0,dt,bt,Q.data);else if(y.isCompressedTexture)if(y.isCompressedArrayTexture){Ct&&Jt&&e.texStorage3D(i.TEXTURE_2D_ARRAY,lt,Tt,Nt[0].width,Nt[0].height,Q.depth);for(let H=0,q=Nt.length;H<q;H++)if(ft=Nt[H],y.format!==Xe)if(dt!==null)if(Ct){if(L)if(y.layerUpdates.size>0){const rt=Ha(ft.width,ft.height,y.format,y.type);for(const ct of y.layerUpdates){const Bt=ft.data.subarray(ct*rt/ft.data.BYTES_PER_ELEMENT,(ct+1)*rt/ft.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,H,0,0,ct,ft.width,ft.height,1,dt,Bt,0,0)}y.clearLayerUpdates()}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,H,0,0,0,ft.width,ft.height,Q.depth,dt,ft.data,0,0)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,H,Tt,ft.width,ft.height,Q.depth,0,ft.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Ct?L&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,H,0,0,0,ft.width,ft.height,Q.depth,dt,bt,ft.data):e.texImage3D(i.TEXTURE_2D_ARRAY,H,Tt,ft.width,ft.height,Q.depth,0,dt,bt,ft.data)}else{Ct&&Jt&&e.texStorage2D(i.TEXTURE_2D,lt,Tt,Nt[0].width,Nt[0].height);for(let H=0,q=Nt.length;H<q;H++)ft=Nt[H],y.format!==Xe?dt!==null?Ct?L&&e.compressedTexSubImage2D(i.TEXTURE_2D,H,0,0,ft.width,ft.height,dt,ft.data):e.compressedTexImage2D(i.TEXTURE_2D,H,Tt,ft.width,ft.height,0,ft.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ct?L&&e.texSubImage2D(i.TEXTURE_2D,H,0,0,ft.width,ft.height,dt,bt,ft.data):e.texImage2D(i.TEXTURE_2D,H,Tt,ft.width,ft.height,0,dt,bt,ft.data)}else if(y.isDataArrayTexture)if(Ct){if(Jt&&e.texStorage3D(i.TEXTURE_2D_ARRAY,lt,Tt,Q.width,Q.height,Q.depth),L)if(y.layerUpdates.size>0){const H=Ha(Q.width,Q.height,y.format,y.type);for(const q of y.layerUpdates){const rt=Q.data.subarray(q*H/Q.data.BYTES_PER_ELEMENT,(q+1)*H/Q.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,q,Q.width,Q.height,1,dt,bt,rt)}y.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,Q.width,Q.height,Q.depth,dt,bt,Q.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,Tt,Q.width,Q.height,Q.depth,0,dt,bt,Q.data);else if(y.isData3DTexture)Ct?(Jt&&e.texStorage3D(i.TEXTURE_3D,lt,Tt,Q.width,Q.height,Q.depth),L&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,Q.width,Q.height,Q.depth,dt,bt,Q.data)):e.texImage3D(i.TEXTURE_3D,0,Tt,Q.width,Q.height,Q.depth,0,dt,bt,Q.data);else if(y.isFramebufferTexture){if(Jt)if(Ct)e.texStorage2D(i.TEXTURE_2D,lt,Tt,Q.width,Q.height);else{let H=Q.width,q=Q.height;for(let rt=0;rt<lt;rt++)e.texImage2D(i.TEXTURE_2D,rt,Tt,H,q,0,dt,bt,null),H>>=1,q>>=1}}else if(Nt.length>0){if(Ct&&Jt){const H=At(Nt[0]);e.texStorage2D(i.TEXTURE_2D,lt,Tt,H.width,H.height)}for(let H=0,q=Nt.length;H<q;H++)ft=Nt[H],Ct?L&&e.texSubImage2D(i.TEXTURE_2D,H,0,0,dt,bt,ft):e.texImage2D(i.TEXTURE_2D,H,Tt,dt,bt,ft);y.generateMipmaps=!1}else if(Ct){if(Jt){const H=At(Q);e.texStorage2D(i.TEXTURE_2D,lt,Tt,H.width,H.height)}L&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,dt,bt,Q)}else e.texImage2D(i.TEXTURE_2D,0,Tt,dt,bt,Q);p(y)&&u(Y),_t.__version=$.version,y.onUpdate&&y.onUpdate(y)}w.__version=y.version}function X(w,y,N){if(y.image.length!==6)return;const Y=It(w,y),Z=y.source;e.bindTexture(i.TEXTURE_CUBE_MAP,w.__webglTexture,i.TEXTURE0+N);const $=n.get(Z);if(Z.version!==$.__version||Y===!0){e.activeTexture(i.TEXTURE0+N);const _t=$t.getPrimaries($t.workingColorSpace),nt=y.colorSpace===_n?null:$t.getPrimaries(y.colorSpace),ut=y.colorSpace===_n||_t===nt?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,y.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,y.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,ut);const Ht=y.isCompressedTexture||y.image[0].isCompressedTexture,Q=y.image[0]&&y.image[0].isDataTexture,dt=[];for(let q=0;q<6;q++)!Ht&&!Q?dt[q]=v(y.image[q],!0,s.maxCubemapSize):dt[q]=Q?y.image[q].image:y.image[q],dt[q]=Qt(y,dt[q]);const bt=dt[0],Tt=r.convert(y.format,y.colorSpace),ft=r.convert(y.type),Nt=S(y.internalFormat,Tt,ft,y.colorSpace),Ct=y.isVideoTexture!==!0,Jt=$.__version===void 0||Y===!0,L=Z.dataReady;let lt=x(y,bt);st(i.TEXTURE_CUBE_MAP,y);let H;if(Ht){Ct&&Jt&&e.texStorage2D(i.TEXTURE_CUBE_MAP,lt,Nt,bt.width,bt.height);for(let q=0;q<6;q++){H=dt[q].mipmaps;for(let rt=0;rt<H.length;rt++){const ct=H[rt];y.format!==Xe?Tt!==null?Ct?L&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,rt,0,0,ct.width,ct.height,Tt,ct.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,rt,Nt,ct.width,ct.height,0,ct.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Ct?L&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,rt,0,0,ct.width,ct.height,Tt,ft,ct.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,rt,Nt,ct.width,ct.height,0,Tt,ft,ct.data)}}}else{if(H=y.mipmaps,Ct&&Jt){H.length>0&&lt++;const q=At(dt[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,lt,Nt,q.width,q.height)}for(let q=0;q<6;q++)if(Q){Ct?L&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,0,0,0,dt[q].width,dt[q].height,Tt,ft,dt[q].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,0,Nt,dt[q].width,dt[q].height,0,Tt,ft,dt[q].data);for(let rt=0;rt<H.length;rt++){const Bt=H[rt].image[q].image;Ct?L&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,rt+1,0,0,Bt.width,Bt.height,Tt,ft,Bt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,rt+1,Nt,Bt.width,Bt.height,0,Tt,ft,Bt.data)}}else{Ct?L&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,0,0,0,Tt,ft,dt[q]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,0,Nt,Tt,ft,dt[q]);for(let rt=0;rt<H.length;rt++){const ct=H[rt];Ct?L&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,rt+1,0,0,Tt,ft,ct.image[q]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,rt+1,Nt,Tt,ft,ct.image[q])}}}p(y)&&u(i.TEXTURE_CUBE_MAP),$.__version=Z.version,y.onUpdate&&y.onUpdate(y)}w.__version=y.version}function J(w,y,N,Y,Z,$){const _t=r.convert(N.format,N.colorSpace),nt=r.convert(N.type),ut=S(N.internalFormat,_t,nt,N.colorSpace);if(!n.get(y).__hasExternalTextures){const Q=Math.max(1,y.width>>$),dt=Math.max(1,y.height>>$);Z===i.TEXTURE_3D||Z===i.TEXTURE_2D_ARRAY?e.texImage3D(Z,$,ut,Q,dt,y.depth,0,_t,nt,null):e.texImage2D(Z,$,ut,Q,dt,0,_t,nt,null)}e.bindFramebuffer(i.FRAMEBUFFER,w),zt(y)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,Y,Z,n.get(N).__webglTexture,0,Ut(y)):(Z===i.TEXTURE_2D||Z>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&Z<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,Y,Z,n.get(N).__webglTexture,$),e.bindFramebuffer(i.FRAMEBUFFER,null)}function mt(w,y,N){if(i.bindRenderbuffer(i.RENDERBUFFER,w),y.depthBuffer){const Y=y.depthTexture,Z=Y&&Y.isDepthTexture?Y.type:null,$=M(y.stencilBuffer,Z),_t=y.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,nt=Ut(y);zt(y)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,nt,$,y.width,y.height):N?i.renderbufferStorageMultisample(i.RENDERBUFFER,nt,$,y.width,y.height):i.renderbufferStorage(i.RENDERBUFFER,$,y.width,y.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,_t,i.RENDERBUFFER,w)}else{const Y=y.textures;for(let Z=0;Z<Y.length;Z++){const $=Y[Z],_t=r.convert($.format,$.colorSpace),nt=r.convert($.type),ut=S($.internalFormat,_t,nt,$.colorSpace),Ht=Ut(y);N&&zt(y)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,Ht,ut,y.width,y.height):zt(y)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Ht,ut,y.width,y.height):i.renderbufferStorage(i.RENDERBUFFER,ut,y.width,y.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function ht(w,y){if(y&&y.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(i.FRAMEBUFFER,w),!(y.depthTexture&&y.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!n.get(y.depthTexture).__webglTexture||y.depthTexture.image.width!==y.width||y.depthTexture.image.height!==y.height)&&(y.depthTexture.image.width=y.width,y.depthTexture.image.height=y.height,y.depthTexture.needsUpdate=!0),W(y.depthTexture,0);const Y=n.get(y.depthTexture).__webglTexture,Z=Ut(y);if(y.depthTexture.format===pi)zt(y)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,Y,0,Z):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,Y,0);else if(y.depthTexture.format===yi)zt(y)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,Y,0,Z):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,Y,0);else throw new Error("Unknown depthTexture format")}function wt(w){const y=n.get(w),N=w.isWebGLCubeRenderTarget===!0;if(y.__boundDepthTexture!==w.depthTexture){const Y=w.depthTexture;if(y.__depthDisposeCallback&&y.__depthDisposeCallback(),Y){const Z=()=>{delete y.__boundDepthTexture,delete y.__depthDisposeCallback,Y.removeEventListener("dispose",Z)};Y.addEventListener("dispose",Z),y.__depthDisposeCallback=Z}y.__boundDepthTexture=Y}if(w.depthTexture&&!y.__autoAllocateDepthBuffer){if(N)throw new Error("target.depthTexture not supported in Cube render targets");ht(y.__webglFramebuffer,w)}else if(N){y.__webglDepthbuffer=[];for(let Y=0;Y<6;Y++)if(e.bindFramebuffer(i.FRAMEBUFFER,y.__webglFramebuffer[Y]),y.__webglDepthbuffer[Y]===void 0)y.__webglDepthbuffer[Y]=i.createRenderbuffer(),mt(y.__webglDepthbuffer[Y],w,!1);else{const Z=w.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,$=y.__webglDepthbuffer[Y];i.bindRenderbuffer(i.RENDERBUFFER,$),i.framebufferRenderbuffer(i.FRAMEBUFFER,Z,i.RENDERBUFFER,$)}}else if(e.bindFramebuffer(i.FRAMEBUFFER,y.__webglFramebuffer),y.__webglDepthbuffer===void 0)y.__webglDepthbuffer=i.createRenderbuffer(),mt(y.__webglDepthbuffer,w,!1);else{const Y=w.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Z=y.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,Z),i.framebufferRenderbuffer(i.FRAMEBUFFER,Y,i.RENDERBUFFER,Z)}e.bindFramebuffer(i.FRAMEBUFFER,null)}function Mt(w,y,N){const Y=n.get(w);y!==void 0&&J(Y.__webglFramebuffer,w,w.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),N!==void 0&&wt(w)}function Ft(w){const y=w.texture,N=n.get(w),Y=n.get(y);w.addEventListener("dispose",A);const Z=w.textures,$=w.isWebGLCubeRenderTarget===!0,_t=Z.length>1;if(_t||(Y.__webglTexture===void 0&&(Y.__webglTexture=i.createTexture()),Y.__version=y.version,o.memory.textures++),$){N.__webglFramebuffer=[];for(let nt=0;nt<6;nt++)if(y.mipmaps&&y.mipmaps.length>0){N.__webglFramebuffer[nt]=[];for(let ut=0;ut<y.mipmaps.length;ut++)N.__webglFramebuffer[nt][ut]=i.createFramebuffer()}else N.__webglFramebuffer[nt]=i.createFramebuffer()}else{if(y.mipmaps&&y.mipmaps.length>0){N.__webglFramebuffer=[];for(let nt=0;nt<y.mipmaps.length;nt++)N.__webglFramebuffer[nt]=i.createFramebuffer()}else N.__webglFramebuffer=i.createFramebuffer();if(_t)for(let nt=0,ut=Z.length;nt<ut;nt++){const Ht=n.get(Z[nt]);Ht.__webglTexture===void 0&&(Ht.__webglTexture=i.createTexture(),o.memory.textures++)}if(w.samples>0&&zt(w)===!1){N.__webglMultisampledFramebuffer=i.createFramebuffer(),N.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,N.__webglMultisampledFramebuffer);for(let nt=0;nt<Z.length;nt++){const ut=Z[nt];N.__webglColorRenderbuffer[nt]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,N.__webglColorRenderbuffer[nt]);const Ht=r.convert(ut.format,ut.colorSpace),Q=r.convert(ut.type),dt=S(ut.internalFormat,Ht,Q,ut.colorSpace,w.isXRRenderTarget===!0),bt=Ut(w);i.renderbufferStorageMultisample(i.RENDERBUFFER,bt,dt,w.width,w.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+nt,i.RENDERBUFFER,N.__webglColorRenderbuffer[nt])}i.bindRenderbuffer(i.RENDERBUFFER,null),w.depthBuffer&&(N.__webglDepthRenderbuffer=i.createRenderbuffer(),mt(N.__webglDepthRenderbuffer,w,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if($){e.bindTexture(i.TEXTURE_CUBE_MAP,Y.__webglTexture),st(i.TEXTURE_CUBE_MAP,y);for(let nt=0;nt<6;nt++)if(y.mipmaps&&y.mipmaps.length>0)for(let ut=0;ut<y.mipmaps.length;ut++)J(N.__webglFramebuffer[nt][ut],w,y,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+nt,ut);else J(N.__webglFramebuffer[nt],w,y,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+nt,0);p(y)&&u(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(_t){for(let nt=0,ut=Z.length;nt<ut;nt++){const Ht=Z[nt],Q=n.get(Ht);e.bindTexture(i.TEXTURE_2D,Q.__webglTexture),st(i.TEXTURE_2D,Ht),J(N.__webglFramebuffer,w,Ht,i.COLOR_ATTACHMENT0+nt,i.TEXTURE_2D,0),p(Ht)&&u(i.TEXTURE_2D)}e.unbindTexture()}else{let nt=i.TEXTURE_2D;if((w.isWebGL3DRenderTarget||w.isWebGLArrayRenderTarget)&&(nt=w.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(nt,Y.__webglTexture),st(nt,y),y.mipmaps&&y.mipmaps.length>0)for(let ut=0;ut<y.mipmaps.length;ut++)J(N.__webglFramebuffer[ut],w,y,i.COLOR_ATTACHMENT0,nt,ut);else J(N.__webglFramebuffer,w,y,i.COLOR_ATTACHMENT0,nt,0);p(y)&&u(nt),e.unbindTexture()}w.depthBuffer&&wt(w)}function Kt(w){const y=w.textures;for(let N=0,Y=y.length;N<Y;N++){const Z=y[N];if(p(Z)){const $=w.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:i.TEXTURE_2D,_t=n.get(Z).__webglTexture;e.bindTexture($,_t),u($),e.unbindTexture()}}}const Ot=[],R=[];function Ce(w){if(w.samples>0){if(zt(w)===!1){const y=w.textures,N=w.width,Y=w.height;let Z=i.COLOR_BUFFER_BIT;const $=w.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,_t=n.get(w),nt=y.length>1;if(nt)for(let ut=0;ut<y.length;ut++)e.bindFramebuffer(i.FRAMEBUFFER,_t.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ut,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,_t.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ut,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,_t.__webglMultisampledFramebuffer),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,_t.__webglFramebuffer);for(let ut=0;ut<y.length;ut++){if(w.resolveDepthBuffer&&(w.depthBuffer&&(Z|=i.DEPTH_BUFFER_BIT),w.stencilBuffer&&w.resolveStencilBuffer&&(Z|=i.STENCIL_BUFFER_BIT)),nt){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,_t.__webglColorRenderbuffer[ut]);const Ht=n.get(y[ut]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,Ht,0)}i.blitFramebuffer(0,0,N,Y,0,0,N,Y,Z,i.NEAREST),l===!0&&(Ot.length=0,R.length=0,Ot.push(i.COLOR_ATTACHMENT0+ut),w.depthBuffer&&w.resolveDepthBuffer===!1&&(Ot.push($),R.push($),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,R)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,Ot))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),nt)for(let ut=0;ut<y.length;ut++){e.bindFramebuffer(i.FRAMEBUFFER,_t.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ut,i.RENDERBUFFER,_t.__webglColorRenderbuffer[ut]);const Ht=n.get(y[ut]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,_t.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ut,i.TEXTURE_2D,Ht,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,_t.__webglMultisampledFramebuffer)}else if(w.depthBuffer&&w.resolveDepthBuffer===!1&&l){const y=w.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[y])}}}function Ut(w){return Math.min(s.maxSamples,w.samples)}function zt(w){const y=n.get(w);return w.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&y.__useRenderToTexture!==!1}function Et(w){const y=o.render.frame;d.get(w)!==y&&(d.set(w,y),w.update())}function Qt(w,y){const N=w.colorSpace,Y=w.format,Z=w.type;return w.isCompressedTexture===!0||w.isVideoTexture===!0||N!==En&&N!==_n&&($t.getTransfer(N)===ee?(Y!==Xe||Z!==on)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",N)),y}function At(w){return typeof HTMLImageElement<"u"&&w instanceof HTMLImageElement?(c.width=w.naturalWidth||w.width,c.height=w.naturalHeight||w.height):typeof VideoFrame<"u"&&w instanceof VideoFrame?(c.width=w.displayWidth,c.height=w.displayHeight):(c.width=w.width,c.height=w.height),c}this.allocateTextureUnit=k,this.resetTextureUnits=b,this.setTexture2D=W,this.setTexture2DArray=K,this.setTexture3D=G,this.setTextureCube=j,this.rebindTextures=Mt,this.setupRenderTarget=Ft,this.updateRenderTargetMipmap=Kt,this.updateMultisampleRenderTarget=Ce,this.setupDepthRenderbuffer=wt,this.setupFrameBufferTexture=J,this.useMultisampledRTT=zt}function lm(i,t){function e(n,s=_n){let r;const o=$t.getTransfer(s);if(n===on)return i.UNSIGNED_BYTE;if(n===Co)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Ro)return i.UNSIGNED_SHORT_5_5_5_1;if(n===pl)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===dl)return i.BYTE;if(n===fl)return i.SHORT;if(n===Oi)return i.UNSIGNED_SHORT;if(n===wo)return i.INT;if(n===Hn)return i.UNSIGNED_INT;if(n===sn)return i.FLOAT;if(n===Bi)return i.HALF_FLOAT;if(n===ml)return i.ALPHA;if(n===gl)return i.RGB;if(n===Xe)return i.RGBA;if(n===_l)return i.LUMINANCE;if(n===vl)return i.LUMINANCE_ALPHA;if(n===pi)return i.DEPTH_COMPONENT;if(n===yi)return i.DEPTH_STENCIL;if(n===xl)return i.RED;if(n===Po)return i.RED_INTEGER;if(n===yl)return i.RG;if(n===Lo)return i.RG_INTEGER;if(n===Do)return i.RGBA_INTEGER;if(n===Ss||n===Es||n===bs||n===Ts)if(o===ee)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===Ss)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Es)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===bs)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Ts)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===Ss)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Es)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===bs)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Ts)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Xr||n===$r||n===Yr||n===qr)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===Xr)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===$r)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Yr)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===qr)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===jr||n===Kr||n===Zr)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===jr||n===Kr)return o===ee?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===Zr)return o===ee?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===Jr||n===Qr||n===to||n===eo||n===no||n===io||n===so||n===ro||n===oo||n===ao||n===lo||n===co||n===ho||n===uo)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===Jr)return o===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Qr)return o===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===to)return o===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===eo)return o===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===no)return o===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===io)return o===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===so)return o===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===ro)return o===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===oo)return o===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===ao)return o===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===lo)return o===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===co)return o===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===ho)return o===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===uo)return o===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===As||n===fo||n===po)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===As)return o===ee?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===fo)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===po)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Ml||n===mo||n===go||n===_o)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===As)return r.COMPRESSED_RED_RGTC1_EXT;if(n===mo)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===go)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===_o)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===xi?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}class cm extends Ne{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}}class Fn extends pe{constructor(){super(),this.isGroup=!0,this.type="Group"}}const hm={type:"move"};class br{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Fn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Fn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new U,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new U),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Fn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new U,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new U),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,o=null;const a=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){o=!0;for(const v of t.hand.values()){const p=e.getJointPose(v,n),u=this._getHandJoint(c,v);p!==null&&(u.matrix.fromArray(p.transform.matrix),u.matrix.decompose(u.position,u.rotation,u.scale),u.matrixWorldNeedsUpdate=!0,u.jointRadius=p.radius),u.visible=p!==null}const d=c.joints["index-finger-tip"],h=c.joints["thumb-tip"],f=d.position.distanceTo(h.position),m=.02,g=.005;c.inputState.pinching&&f>m+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&f<=m-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(hm)))}return a!==null&&(a.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const n=new Fn;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}}const um=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,dm=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class fm{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,n){if(this.texture===null){const s=new Ae,r=t.properties.get(s);r.__webglTexture=e.texture,(e.depthNear!=n.depthNear||e.depthFar!=n.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=s}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,n=new Mn({vertexShader:um,fragmentShader:dm,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new $e(new Gs(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class pm extends Wn{constructor(t,e){super();const n=this;let s=null,r=1,o=null,a="local-floor",l=1,c=null,d=null,h=null,f=null,m=null,g=null;const v=new fm,p=e.getContextAttributes();let u=null,S=null;const M=[],x=[],C=new Rt;let A=null;const T=new Ne;T.layers.enable(1),T.viewport=new re;const P=new Ne;P.layers.enable(2),P.viewport=new re;const V=[T,P],_=new cm;_.layers.enable(1),_.layers.enable(2);let b=null,k=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(X){let J=M[X];return J===void 0&&(J=new br,M[X]=J),J.getTargetRaySpace()},this.getControllerGrip=function(X){let J=M[X];return J===void 0&&(J=new br,M[X]=J),J.getGripSpace()},this.getHand=function(X){let J=M[X];return J===void 0&&(J=new br,M[X]=J),J.getHandSpace()};function B(X){const J=x.indexOf(X.inputSource);if(J===-1)return;const mt=M[J];mt!==void 0&&(mt.update(X.inputSource,X.frame,c||o),mt.dispatchEvent({type:X.type,data:X.inputSource}))}function W(){s.removeEventListener("select",B),s.removeEventListener("selectstart",B),s.removeEventListener("selectend",B),s.removeEventListener("squeeze",B),s.removeEventListener("squeezestart",B),s.removeEventListener("squeezeend",B),s.removeEventListener("end",W),s.removeEventListener("inputsourceschange",K);for(let X=0;X<M.length;X++){const J=x[X];J!==null&&(x[X]=null,M[X].disconnect(J))}b=null,k=null,v.reset(),t.setRenderTarget(u),m=null,f=null,h=null,s=null,S=null,qt.stop(),n.isPresenting=!1,t.setPixelRatio(A),t.setSize(C.width,C.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(X){r=X,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(X){a=X,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(X){c=X},this.getBaseLayer=function(){return f!==null?f:m},this.getBinding=function(){return h},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(X){if(s=X,s!==null){if(u=t.getRenderTarget(),s.addEventListener("select",B),s.addEventListener("selectstart",B),s.addEventListener("selectend",B),s.addEventListener("squeeze",B),s.addEventListener("squeezestart",B),s.addEventListener("squeezeend",B),s.addEventListener("end",W),s.addEventListener("inputsourceschange",K),p.xrCompatible!==!0&&await e.makeXRCompatible(),A=t.getPixelRatio(),t.getSize(C),s.renderState.layers===void 0){const J={antialias:p.antialias,alpha:!0,depth:p.depth,stencil:p.stencil,framebufferScaleFactor:r};m=new XRWebGLLayer(s,e,J),s.updateRenderState({baseLayer:m}),t.setPixelRatio(1),t.setSize(m.framebufferWidth,m.framebufferHeight,!1),S=new Gn(m.framebufferWidth,m.framebufferHeight,{format:Xe,type:on,colorSpace:t.outputColorSpace,stencilBuffer:p.stencil})}else{let J=null,mt=null,ht=null;p.depth&&(ht=p.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,J=p.stencil?yi:pi,mt=p.stencil?xi:Hn);const wt={colorFormat:e.RGBA8,depthFormat:ht,scaleFactor:r};h=new XRWebGLBinding(s,e),f=h.createProjectionLayer(wt),s.updateRenderState({layers:[f]}),t.setPixelRatio(1),t.setSize(f.textureWidth,f.textureHeight,!1),S=new Gn(f.textureWidth,f.textureHeight,{format:Xe,type:on,depthTexture:new Fl(f.textureWidth,f.textureHeight,mt,void 0,void 0,void 0,void 0,void 0,void 0,J),stencilBuffer:p.stencil,colorSpace:t.outputColorSpace,samples:p.antialias?4:0,resolveDepthBuffer:f.ignoreDepthValues===!1})}S.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await s.requestReferenceSpace(a),qt.setContext(s),qt.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return v.getDepthTexture()};function K(X){for(let J=0;J<X.removed.length;J++){const mt=X.removed[J],ht=x.indexOf(mt);ht>=0&&(x[ht]=null,M[ht].disconnect(mt))}for(let J=0;J<X.added.length;J++){const mt=X.added[J];let ht=x.indexOf(mt);if(ht===-1){for(let Mt=0;Mt<M.length;Mt++)if(Mt>=x.length){x.push(mt),ht=Mt;break}else if(x[Mt]===null){x[Mt]=mt,ht=Mt;break}if(ht===-1)break}const wt=M[ht];wt&&wt.connect(mt)}}const G=new U,j=new U;function z(X,J,mt){G.setFromMatrixPosition(J.matrixWorld),j.setFromMatrixPosition(mt.matrixWorld);const ht=G.distanceTo(j),wt=J.projectionMatrix.elements,Mt=mt.projectionMatrix.elements,Ft=wt[14]/(wt[10]-1),Kt=wt[14]/(wt[10]+1),Ot=(wt[9]+1)/wt[5],R=(wt[9]-1)/wt[5],Ce=(wt[8]-1)/wt[0],Ut=(Mt[8]+1)/Mt[0],zt=Ft*Ce,Et=Ft*Ut,Qt=ht/(-Ce+Ut),At=Qt*-Ce;if(J.matrixWorld.decompose(X.position,X.quaternion,X.scale),X.translateX(At),X.translateZ(Qt),X.matrixWorld.compose(X.position,X.quaternion,X.scale),X.matrixWorldInverse.copy(X.matrixWorld).invert(),wt[10]===-1)X.projectionMatrix.copy(J.projectionMatrix),X.projectionMatrixInverse.copy(J.projectionMatrixInverse);else{const w=Ft+Qt,y=Kt+Qt,N=zt-At,Y=Et+(ht-At),Z=Ot*Kt/y*w,$=R*Kt/y*w;X.projectionMatrix.makePerspective(N,Y,Z,$,w,y),X.projectionMatrixInverse.copy(X.projectionMatrix).invert()}}function it(X,J){J===null?X.matrixWorld.copy(X.matrix):X.matrixWorld.multiplyMatrices(J.matrixWorld,X.matrix),X.matrixWorldInverse.copy(X.matrixWorld).invert()}this.updateCamera=function(X){if(s===null)return;let J=X.near,mt=X.far;v.texture!==null&&(v.depthNear>0&&(J=v.depthNear),v.depthFar>0&&(mt=v.depthFar)),_.near=P.near=T.near=J,_.far=P.far=T.far=mt,(b!==_.near||k!==_.far)&&(s.updateRenderState({depthNear:_.near,depthFar:_.far}),b=_.near,k=_.far);const ht=X.parent,wt=_.cameras;it(_,ht);for(let Mt=0;Mt<wt.length;Mt++)it(wt[Mt],ht);wt.length===2?z(_,T,P):_.projectionMatrix.copy(T.projectionMatrix),at(X,_,ht)};function at(X,J,mt){mt===null?X.matrix.copy(J.matrixWorld):(X.matrix.copy(mt.matrixWorld),X.matrix.invert(),X.matrix.multiply(J.matrixWorld)),X.matrix.decompose(X.position,X.quaternion,X.scale),X.updateMatrixWorld(!0),X.projectionMatrix.copy(J.projectionMatrix),X.projectionMatrixInverse.copy(J.projectionMatrixInverse),X.isPerspectiveCamera&&(X.fov=vo*2*Math.atan(1/X.projectionMatrix.elements[5]),X.zoom=1)}this.getCamera=function(){return _},this.getFoveation=function(){if(!(f===null&&m===null))return l},this.setFoveation=function(X){l=X,f!==null&&(f.fixedFoveation=X),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=X)},this.hasDepthSensing=function(){return v.texture!==null},this.getDepthSensingMesh=function(){return v.getMesh(_)};let st=null;function It(X,J){if(d=J.getViewerPose(c||o),g=J,d!==null){const mt=d.views;m!==null&&(t.setRenderTargetFramebuffer(S,m.framebuffer),t.setRenderTarget(S));let ht=!1;mt.length!==_.cameras.length&&(_.cameras.length=0,ht=!0);for(let Mt=0;Mt<mt.length;Mt++){const Ft=mt[Mt];let Kt=null;if(m!==null)Kt=m.getViewport(Ft);else{const R=h.getViewSubImage(f,Ft);Kt=R.viewport,Mt===0&&(t.setRenderTargetTextures(S,R.colorTexture,f.ignoreDepthValues?void 0:R.depthStencilTexture),t.setRenderTarget(S))}let Ot=V[Mt];Ot===void 0&&(Ot=new Ne,Ot.layers.enable(Mt),Ot.viewport=new re,V[Mt]=Ot),Ot.matrix.fromArray(Ft.transform.matrix),Ot.matrix.decompose(Ot.position,Ot.quaternion,Ot.scale),Ot.projectionMatrix.fromArray(Ft.projectionMatrix),Ot.projectionMatrixInverse.copy(Ot.projectionMatrix).invert(),Ot.viewport.set(Kt.x,Kt.y,Kt.width,Kt.height),Mt===0&&(_.matrix.copy(Ot.matrix),_.matrix.decompose(_.position,_.quaternion,_.scale)),ht===!0&&_.cameras.push(Ot)}const wt=s.enabledFeatures;if(wt&&wt.includes("depth-sensing")){const Mt=h.getDepthInformation(mt[0]);Mt&&Mt.isValid&&Mt.texture&&v.init(t,Mt,s.renderState)}}for(let mt=0;mt<M.length;mt++){const ht=x[mt],wt=M[mt];ht!==null&&wt!==void 0&&wt.update(ht,J,c||o)}st&&st(X,J),J.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:J}),g=null}const qt=new Ul;qt.setAnimationLoop(It),this.setAnimationLoop=function(X){st=X},this.dispose=function(){}}}const Pn=new qe,mm=new ie;function gm(i,t){function e(p,u){p.matrixAutoUpdate===!0&&p.updateMatrix(),u.value.copy(p.matrix)}function n(p,u){u.color.getRGB(p.fogColor.value,Ll(i)),u.isFog?(p.fogNear.value=u.near,p.fogFar.value=u.far):u.isFogExp2&&(p.fogDensity.value=u.density)}function s(p,u,S,M,x){u.isMeshBasicMaterial||u.isMeshLambertMaterial?r(p,u):u.isMeshToonMaterial?(r(p,u),h(p,u)):u.isMeshPhongMaterial?(r(p,u),d(p,u)):u.isMeshStandardMaterial?(r(p,u),f(p,u),u.isMeshPhysicalMaterial&&m(p,u,x)):u.isMeshMatcapMaterial?(r(p,u),g(p,u)):u.isMeshDepthMaterial?r(p,u):u.isMeshDistanceMaterial?(r(p,u),v(p,u)):u.isMeshNormalMaterial?r(p,u):u.isLineBasicMaterial?(o(p,u),u.isLineDashedMaterial&&a(p,u)):u.isPointsMaterial?l(p,u,S,M):u.isSpriteMaterial?c(p,u):u.isShadowMaterial?(p.color.value.copy(u.color),p.opacity.value=u.opacity):u.isShaderMaterial&&(u.uniformsNeedUpdate=!1)}function r(p,u){p.opacity.value=u.opacity,u.color&&p.diffuse.value.copy(u.color),u.emissive&&p.emissive.value.copy(u.emissive).multiplyScalar(u.emissiveIntensity),u.map&&(p.map.value=u.map,e(u.map,p.mapTransform)),u.alphaMap&&(p.alphaMap.value=u.alphaMap,e(u.alphaMap,p.alphaMapTransform)),u.bumpMap&&(p.bumpMap.value=u.bumpMap,e(u.bumpMap,p.bumpMapTransform),p.bumpScale.value=u.bumpScale,u.side===Te&&(p.bumpScale.value*=-1)),u.normalMap&&(p.normalMap.value=u.normalMap,e(u.normalMap,p.normalMapTransform),p.normalScale.value.copy(u.normalScale),u.side===Te&&p.normalScale.value.negate()),u.displacementMap&&(p.displacementMap.value=u.displacementMap,e(u.displacementMap,p.displacementMapTransform),p.displacementScale.value=u.displacementScale,p.displacementBias.value=u.displacementBias),u.emissiveMap&&(p.emissiveMap.value=u.emissiveMap,e(u.emissiveMap,p.emissiveMapTransform)),u.specularMap&&(p.specularMap.value=u.specularMap,e(u.specularMap,p.specularMapTransform)),u.alphaTest>0&&(p.alphaTest.value=u.alphaTest);const S=t.get(u),M=S.envMap,x=S.envMapRotation;M&&(p.envMap.value=M,Pn.copy(x),Pn.x*=-1,Pn.y*=-1,Pn.z*=-1,M.isCubeTexture&&M.isRenderTargetTexture===!1&&(Pn.y*=-1,Pn.z*=-1),p.envMapRotation.value.setFromMatrix4(mm.makeRotationFromEuler(Pn)),p.flipEnvMap.value=M.isCubeTexture&&M.isRenderTargetTexture===!1?-1:1,p.reflectivity.value=u.reflectivity,p.ior.value=u.ior,p.refractionRatio.value=u.refractionRatio),u.lightMap&&(p.lightMap.value=u.lightMap,p.lightMapIntensity.value=u.lightMapIntensity,e(u.lightMap,p.lightMapTransform)),u.aoMap&&(p.aoMap.value=u.aoMap,p.aoMapIntensity.value=u.aoMapIntensity,e(u.aoMap,p.aoMapTransform))}function o(p,u){p.diffuse.value.copy(u.color),p.opacity.value=u.opacity,u.map&&(p.map.value=u.map,e(u.map,p.mapTransform))}function a(p,u){p.dashSize.value=u.dashSize,p.totalSize.value=u.dashSize+u.gapSize,p.scale.value=u.scale}function l(p,u,S,M){p.diffuse.value.copy(u.color),p.opacity.value=u.opacity,p.size.value=u.size*S,p.scale.value=M*.5,u.map&&(p.map.value=u.map,e(u.map,p.uvTransform)),u.alphaMap&&(p.alphaMap.value=u.alphaMap,e(u.alphaMap,p.alphaMapTransform)),u.alphaTest>0&&(p.alphaTest.value=u.alphaTest)}function c(p,u){p.diffuse.value.copy(u.color),p.opacity.value=u.opacity,p.rotation.value=u.rotation,u.map&&(p.map.value=u.map,e(u.map,p.mapTransform)),u.alphaMap&&(p.alphaMap.value=u.alphaMap,e(u.alphaMap,p.alphaMapTransform)),u.alphaTest>0&&(p.alphaTest.value=u.alphaTest)}function d(p,u){p.specular.value.copy(u.specular),p.shininess.value=Math.max(u.shininess,1e-4)}function h(p,u){u.gradientMap&&(p.gradientMap.value=u.gradientMap)}function f(p,u){p.metalness.value=u.metalness,u.metalnessMap&&(p.metalnessMap.value=u.metalnessMap,e(u.metalnessMap,p.metalnessMapTransform)),p.roughness.value=u.roughness,u.roughnessMap&&(p.roughnessMap.value=u.roughnessMap,e(u.roughnessMap,p.roughnessMapTransform)),u.envMap&&(p.envMapIntensity.value=u.envMapIntensity)}function m(p,u,S){p.ior.value=u.ior,u.sheen>0&&(p.sheenColor.value.copy(u.sheenColor).multiplyScalar(u.sheen),p.sheenRoughness.value=u.sheenRoughness,u.sheenColorMap&&(p.sheenColorMap.value=u.sheenColorMap,e(u.sheenColorMap,p.sheenColorMapTransform)),u.sheenRoughnessMap&&(p.sheenRoughnessMap.value=u.sheenRoughnessMap,e(u.sheenRoughnessMap,p.sheenRoughnessMapTransform))),u.clearcoat>0&&(p.clearcoat.value=u.clearcoat,p.clearcoatRoughness.value=u.clearcoatRoughness,u.clearcoatMap&&(p.clearcoatMap.value=u.clearcoatMap,e(u.clearcoatMap,p.clearcoatMapTransform)),u.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=u.clearcoatRoughnessMap,e(u.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),u.clearcoatNormalMap&&(p.clearcoatNormalMap.value=u.clearcoatNormalMap,e(u.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(u.clearcoatNormalScale),u.side===Te&&p.clearcoatNormalScale.value.negate())),u.dispersion>0&&(p.dispersion.value=u.dispersion),u.iridescence>0&&(p.iridescence.value=u.iridescence,p.iridescenceIOR.value=u.iridescenceIOR,p.iridescenceThicknessMinimum.value=u.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=u.iridescenceThicknessRange[1],u.iridescenceMap&&(p.iridescenceMap.value=u.iridescenceMap,e(u.iridescenceMap,p.iridescenceMapTransform)),u.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=u.iridescenceThicknessMap,e(u.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),u.transmission>0&&(p.transmission.value=u.transmission,p.transmissionSamplerMap.value=S.texture,p.transmissionSamplerSize.value.set(S.width,S.height),u.transmissionMap&&(p.transmissionMap.value=u.transmissionMap,e(u.transmissionMap,p.transmissionMapTransform)),p.thickness.value=u.thickness,u.thicknessMap&&(p.thicknessMap.value=u.thicknessMap,e(u.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=u.attenuationDistance,p.attenuationColor.value.copy(u.attenuationColor)),u.anisotropy>0&&(p.anisotropyVector.value.set(u.anisotropy*Math.cos(u.anisotropyRotation),u.anisotropy*Math.sin(u.anisotropyRotation)),u.anisotropyMap&&(p.anisotropyMap.value=u.anisotropyMap,e(u.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=u.specularIntensity,p.specularColor.value.copy(u.specularColor),u.specularColorMap&&(p.specularColorMap.value=u.specularColorMap,e(u.specularColorMap,p.specularColorMapTransform)),u.specularIntensityMap&&(p.specularIntensityMap.value=u.specularIntensityMap,e(u.specularIntensityMap,p.specularIntensityMapTransform))}function g(p,u){u.matcap&&(p.matcap.value=u.matcap)}function v(p,u){const S=t.get(u).light;p.referencePosition.value.setFromMatrixPosition(S.matrixWorld),p.nearDistance.value=S.shadow.camera.near,p.farDistance.value=S.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function _m(i,t,e,n){let s={},r={},o=[];const a=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(S,M){const x=M.program;n.uniformBlockBinding(S,x)}function c(S,M){let x=s[S.id];x===void 0&&(g(S),x=d(S),s[S.id]=x,S.addEventListener("dispose",p));const C=M.program;n.updateUBOMapping(S,C);const A=t.render.frame;r[S.id]!==A&&(f(S),r[S.id]=A)}function d(S){const M=h();S.__bindingPointIndex=M;const x=i.createBuffer(),C=S.__size,A=S.usage;return i.bindBuffer(i.UNIFORM_BUFFER,x),i.bufferData(i.UNIFORM_BUFFER,C,A),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,M,x),x}function h(){for(let S=0;S<a;S++)if(o.indexOf(S)===-1)return o.push(S),S;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function f(S){const M=s[S.id],x=S.uniforms,C=S.__cache;i.bindBuffer(i.UNIFORM_BUFFER,M);for(let A=0,T=x.length;A<T;A++){const P=Array.isArray(x[A])?x[A]:[x[A]];for(let V=0,_=P.length;V<_;V++){const b=P[V];if(m(b,A,V,C)===!0){const k=b.__offset,B=Array.isArray(b.value)?b.value:[b.value];let W=0;for(let K=0;K<B.length;K++){const G=B[K],j=v(G);typeof G=="number"||typeof G=="boolean"?(b.__data[0]=G,i.bufferSubData(i.UNIFORM_BUFFER,k+W,b.__data)):G.isMatrix3?(b.__data[0]=G.elements[0],b.__data[1]=G.elements[1],b.__data[2]=G.elements[2],b.__data[3]=0,b.__data[4]=G.elements[3],b.__data[5]=G.elements[4],b.__data[6]=G.elements[5],b.__data[7]=0,b.__data[8]=G.elements[6],b.__data[9]=G.elements[7],b.__data[10]=G.elements[8],b.__data[11]=0):(G.toArray(b.__data,W),W+=j.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,k,b.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function m(S,M,x,C){const A=S.value,T=M+"_"+x;if(C[T]===void 0)return typeof A=="number"||typeof A=="boolean"?C[T]=A:C[T]=A.clone(),!0;{const P=C[T];if(typeof A=="number"||typeof A=="boolean"){if(P!==A)return C[T]=A,!0}else if(P.equals(A)===!1)return P.copy(A),!0}return!1}function g(S){const M=S.uniforms;let x=0;const C=16;for(let T=0,P=M.length;T<P;T++){const V=Array.isArray(M[T])?M[T]:[M[T]];for(let _=0,b=V.length;_<b;_++){const k=V[_],B=Array.isArray(k.value)?k.value:[k.value];for(let W=0,K=B.length;W<K;W++){const G=B[W],j=v(G),z=x%C,it=z%j.boundary,at=z+it;x+=it,at!==0&&C-at<j.storage&&(x+=C-at),k.__data=new Float32Array(j.storage/Float32Array.BYTES_PER_ELEMENT),k.__offset=x,x+=j.storage}}}const A=x%C;return A>0&&(x+=C-A),S.__size=x,S.__cache={},this}function v(S){const M={boundary:0,storage:0};return typeof S=="number"||typeof S=="boolean"?(M.boundary=4,M.storage=4):S.isVector2?(M.boundary=8,M.storage=8):S.isVector3||S.isColor?(M.boundary=16,M.storage=12):S.isVector4?(M.boundary=16,M.storage=16):S.isMatrix3?(M.boundary=48,M.storage=48):S.isMatrix4?(M.boundary=64,M.storage=64):S.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",S),M}function p(S){const M=S.target;M.removeEventListener("dispose",p);const x=o.indexOf(M.__bindingPointIndex);o.splice(x,1),i.deleteBuffer(s[M.id]),delete s[M.id],delete r[M.id]}function u(){for(const S in s)i.deleteBuffer(s[S]);o=[],s={},r={}}return{bind:l,update:c,dispose:u}}class vm{constructor(t={}){const{canvas:e=sh(),context:n=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:d="default",failIfMajorPerformanceCaveat:h=!1}=t;this.isWebGLRenderer=!0;let f;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");f=n.getContextAttributes().alpha}else f=o;const m=new Uint32Array(4),g=new Int32Array(4);let v=null,p=null;const u=[],S=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=Ge,this.toneMapping=xn,this.toneMappingExposure=1;const M=this;let x=!1,C=0,A=0,T=null,P=-1,V=null;const _=new re,b=new re;let k=null;const B=new Pt(0);let W=0,K=e.width,G=e.height,j=1,z=null,it=null;const at=new re(0,0,K,G),st=new re(0,0,K,G);let It=!1;const qt=new No;let X=!1,J=!1;const mt=new ie,ht=new ie,wt=new U,Mt=new re,Ft={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Kt=!1;function Ot(){return T===null?j:1}let R=n;function Ce(E,D){return e.getContext(E,D)}try{const E={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:d,failIfMajorPerformanceCaveat:h};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${Ao}`),e.addEventListener("webglcontextlost",q,!1),e.addEventListener("webglcontextrestored",rt,!1),e.addEventListener("webglcontextcreationerror",ct,!1),R===null){const D="webgl2";if(R=Ce(D,E),R===null)throw Ce(D)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(E){throw console.error("THREE.WebGLRenderer: "+E.message),E}let Ut,zt,Et,Qt,At,w,y,N,Y,Z,$,_t,nt,ut,Ht,Q,dt,bt,Tt,ft,Nt,Ct,Jt,L;function lt(){Ut=new Ef(R),Ut.init(),Ct=new lm(R,Ut),zt=new _f(R,Ut,t,Ct),Et=new rm(R),zt.reverseDepthBuffer&&Et.buffers.depth.setReversed(!0),Qt=new Af(R),At=new Wp,w=new am(R,Ut,Et,At,zt,Ct,Qt),y=new xf(M),N=new Sf(M),Y=new Dh(R),Jt=new mf(R,Y),Z=new bf(R,Y,Qt,Jt),$=new Cf(R,Z,Y,Qt),Tt=new wf(R,zt,w),Q=new vf(At),_t=new Vp(M,y,N,Ut,zt,Jt,Q),nt=new gm(M,At),ut=new $p,Ht=new Jp(Ut),bt=new pf(M,y,N,Et,$,f,l),dt=new im(M,$,zt),L=new _m(R,Qt,zt,Et),ft=new gf(R,Ut,Qt),Nt=new Tf(R,Ut,Qt),Qt.programs=_t.programs,M.capabilities=zt,M.extensions=Ut,M.properties=At,M.renderLists=ut,M.shadowMap=dt,M.state=Et,M.info=Qt}lt();const H=new pm(M,R);this.xr=H,this.getContext=function(){return R},this.getContextAttributes=function(){return R.getContextAttributes()},this.forceContextLoss=function(){const E=Ut.get("WEBGL_lose_context");E&&E.loseContext()},this.forceContextRestore=function(){const E=Ut.get("WEBGL_lose_context");E&&E.restoreContext()},this.getPixelRatio=function(){return j},this.setPixelRatio=function(E){E!==void 0&&(j=E,this.setSize(K,G,!1))},this.getSize=function(E){return E.set(K,G)},this.setSize=function(E,D,F=!0){if(H.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}K=E,G=D,e.width=Math.floor(E*j),e.height=Math.floor(D*j),F===!0&&(e.style.width=E+"px",e.style.height=D+"px"),this.setViewport(0,0,E,D)},this.getDrawingBufferSize=function(E){return E.set(K*j,G*j).floor()},this.setDrawingBufferSize=function(E,D,F){K=E,G=D,j=F,e.width=Math.floor(E*F),e.height=Math.floor(D*F),this.setViewport(0,0,E,D)},this.getCurrentViewport=function(E){return E.copy(_)},this.getViewport=function(E){return E.copy(at)},this.setViewport=function(E,D,F,O){E.isVector4?at.set(E.x,E.y,E.z,E.w):at.set(E,D,F,O),Et.viewport(_.copy(at).multiplyScalar(j).round())},this.getScissor=function(E){return E.copy(st)},this.setScissor=function(E,D,F,O){E.isVector4?st.set(E.x,E.y,E.z,E.w):st.set(E,D,F,O),Et.scissor(b.copy(st).multiplyScalar(j).round())},this.getScissorTest=function(){return It},this.setScissorTest=function(E){Et.setScissorTest(It=E)},this.setOpaqueSort=function(E){z=E},this.setTransparentSort=function(E){it=E},this.getClearColor=function(E){return E.copy(bt.getClearColor())},this.setClearColor=function(){bt.setClearColor.apply(bt,arguments)},this.getClearAlpha=function(){return bt.getClearAlpha()},this.setClearAlpha=function(){bt.setClearAlpha.apply(bt,arguments)},this.clear=function(E=!0,D=!0,F=!0){let O=0;if(E){let I=!1;if(T!==null){const tt=T.texture.format;I=tt===Do||tt===Lo||tt===Po}if(I){const tt=T.texture.type,ot=tt===on||tt===Hn||tt===Oi||tt===xi||tt===Co||tt===Ro,pt=bt.getClearColor(),gt=bt.getClearAlpha(),yt=pt.r,St=pt.g,vt=pt.b;ot?(m[0]=yt,m[1]=St,m[2]=vt,m[3]=gt,R.clearBufferuiv(R.COLOR,0,m)):(g[0]=yt,g[1]=St,g[2]=vt,g[3]=gt,R.clearBufferiv(R.COLOR,0,g))}else O|=R.COLOR_BUFFER_BIT}D&&(O|=R.DEPTH_BUFFER_BIT,R.clearDepth(this.capabilities.reverseDepthBuffer?0:1)),F&&(O|=R.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),R.clear(O)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",q,!1),e.removeEventListener("webglcontextrestored",rt,!1),e.removeEventListener("webglcontextcreationerror",ct,!1),ut.dispose(),Ht.dispose(),At.dispose(),y.dispose(),N.dispose(),$.dispose(),Jt.dispose(),L.dispose(),_t.dispose(),H.dispose(),H.removeEventListener("sessionstart",zo),H.removeEventListener("sessionend",Ho),bn.stop()};function q(E){E.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),x=!0}function rt(){console.log("THREE.WebGLRenderer: Context Restored."),x=!1;const E=Qt.autoReset,D=dt.enabled,F=dt.autoUpdate,O=dt.needsUpdate,I=dt.type;lt(),Qt.autoReset=E,dt.enabled=D,dt.autoUpdate=F,dt.needsUpdate=O,dt.type=I}function ct(E){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",E.statusMessage)}function Bt(E){const D=E.target;D.removeEventListener("dispose",Bt),ae(D)}function ae(E){Me(E),At.remove(E)}function Me(E){const D=At.get(E).programs;D!==void 0&&(D.forEach(function(F){_t.releaseProgram(F)}),E.isShaderMaterial&&_t.releaseShaderCache(E))}this.renderBufferDirect=function(E,D,F,O,I,tt){D===null&&(D=Ft);const ot=I.isMesh&&I.matrixWorld.determinant()<0,pt=ql(E,D,F,O,I);Et.setMaterial(O,ot);let gt=F.index,yt=1;if(O.wireframe===!0){if(gt=Z.getWireframeAttribute(F),gt===void 0)return;yt=2}const St=F.drawRange,vt=F.attributes.position;let jt=St.start*yt,te=(St.start+St.count)*yt;tt!==null&&(jt=Math.max(jt,tt.start*yt),te=Math.min(te,(tt.start+tt.count)*yt)),gt!==null?(jt=Math.max(jt,0),te=Math.min(te,gt.count)):vt!=null&&(jt=Math.max(jt,0),te=Math.min(te,vt.count));const se=te-jt;if(se<0||se===1/0)return;Jt.setup(I,O,pt,F,gt);let Re,Wt=ft;if(gt!==null&&(Re=Y.get(gt),Wt=Nt,Wt.setIndex(Re)),I.isMesh)O.wireframe===!0?(Et.setLineWidth(O.wireframeLinewidth*Ot()),Wt.setMode(R.LINES)):Wt.setMode(R.TRIANGLES);else if(I.isLine){let xt=O.linewidth;xt===void 0&&(xt=1),Et.setLineWidth(xt*Ot()),I.isLineSegments?Wt.setMode(R.LINES):I.isLineLoop?Wt.setMode(R.LINE_LOOP):Wt.setMode(R.LINE_STRIP)}else I.isPoints?Wt.setMode(R.POINTS):I.isSprite&&Wt.setMode(R.TRIANGLES);if(I.isBatchedMesh)if(I._multiDrawInstances!==null)Wt.renderMultiDrawInstances(I._multiDrawStarts,I._multiDrawCounts,I._multiDrawCount,I._multiDrawInstances);else if(Ut.get("WEBGL_multi_draw"))Wt.renderMultiDraw(I._multiDrawStarts,I._multiDrawCounts,I._multiDrawCount);else{const xt=I._multiDrawStarts,me=I._multiDrawCounts,Xt=I._multiDrawCount,Be=gt?Y.get(gt).bytesPerElement:1,Xn=At.get(O).currentProgram.getUniforms();for(let Pe=0;Pe<Xt;Pe++)Xn.setValue(R,"_gl_DrawID",Pe),Wt.render(xt[Pe]/Be,me[Pe])}else if(I.isInstancedMesh)Wt.renderInstances(jt,se,I.count);else if(F.isInstancedBufferGeometry){const xt=F._maxInstanceCount!==void 0?F._maxInstanceCount:1/0,me=Math.min(F.instanceCount,xt);Wt.renderInstances(jt,se,me)}else Wt.render(jt,se)};function Vt(E,D,F){E.transparent===!0&&E.side===nn&&E.forceSinglePass===!1?(E.side=Te,E.needsUpdate=!0,Vi(E,D,F),E.side=yn,E.needsUpdate=!0,Vi(E,D,F),E.side=nn):Vi(E,D,F)}this.compile=function(E,D,F=null){F===null&&(F=E),p=Ht.get(F),p.init(D),S.push(p),F.traverseVisible(function(I){I.isLight&&I.layers.test(D.layers)&&(p.pushLight(I),I.castShadow&&p.pushShadow(I))}),E!==F&&E.traverseVisible(function(I){I.isLight&&I.layers.test(D.layers)&&(p.pushLight(I),I.castShadow&&p.pushShadow(I))}),p.setupLights();const O=new Set;return E.traverse(function(I){if(!(I.isMesh||I.isPoints||I.isLine||I.isSprite))return;const tt=I.material;if(tt)if(Array.isArray(tt))for(let ot=0;ot<tt.length;ot++){const pt=tt[ot];Vt(pt,F,I),O.add(pt)}else Vt(tt,F,I),O.add(tt)}),S.pop(),p=null,O},this.compileAsync=function(E,D,F=null){const O=this.compile(E,D,F);return new Promise(I=>{function tt(){if(O.forEach(function(ot){At.get(ot).currentProgram.isReady()&&O.delete(ot)}),O.size===0){I(E);return}setTimeout(tt,10)}Ut.get("KHR_parallel_shader_compile")!==null?tt():setTimeout(tt,10)})};let Se=null;function je(E){Se&&Se(E)}function zo(){bn.stop()}function Ho(){bn.start()}const bn=new Ul;bn.setAnimationLoop(je),typeof self<"u"&&bn.setContext(self),this.setAnimationLoop=function(E){Se=E,H.setAnimationLoop(E),E===null?bn.stop():bn.start()},H.addEventListener("sessionstart",zo),H.addEventListener("sessionend",Ho),this.render=function(E,D){if(D!==void 0&&D.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(x===!0)return;if(E.matrixWorldAutoUpdate===!0&&E.updateMatrixWorld(),D.parent===null&&D.matrixWorldAutoUpdate===!0&&D.updateMatrixWorld(),H.enabled===!0&&H.isPresenting===!0&&(H.cameraAutoUpdate===!0&&H.updateCamera(D),D=H.getCamera()),E.isScene===!0&&E.onBeforeRender(M,E,D,T),p=Ht.get(E,S.length),p.init(D),S.push(p),ht.multiplyMatrices(D.projectionMatrix,D.matrixWorldInverse),qt.setFromProjectionMatrix(ht),J=this.localClippingEnabled,X=Q.init(this.clippingPlanes,J),v=ut.get(E,u.length),v.init(),u.push(v),H.enabled===!0&&H.isPresenting===!0){const tt=M.xr.getDepthSensingMesh();tt!==null&&Ws(tt,D,-1/0,M.sortObjects)}Ws(E,D,0,M.sortObjects),v.finish(),M.sortObjects===!0&&v.sort(z,it),Kt=H.enabled===!1||H.isPresenting===!1||H.hasDepthSensing()===!1,Kt&&bt.addToRenderList(v,E),this.info.render.frame++,X===!0&&Q.beginShadows();const F=p.state.shadowsArray;dt.render(F,E,D),X===!0&&Q.endShadows(),this.info.autoReset===!0&&this.info.reset();const O=v.opaque,I=v.transmissive;if(p.setupLights(),D.isArrayCamera){const tt=D.cameras;if(I.length>0)for(let ot=0,pt=tt.length;ot<pt;ot++){const gt=tt[ot];Vo(O,I,E,gt)}Kt&&bt.render(E);for(let ot=0,pt=tt.length;ot<pt;ot++){const gt=tt[ot];Go(v,E,gt,gt.viewport)}}else I.length>0&&Vo(O,I,E,D),Kt&&bt.render(E),Go(v,E,D);T!==null&&(w.updateMultisampleRenderTarget(T),w.updateRenderTargetMipmap(T)),E.isScene===!0&&E.onAfterRender(M,E,D),Jt.resetDefaultState(),P=-1,V=null,S.pop(),S.length>0?(p=S[S.length-1],X===!0&&Q.setGlobalState(M.clippingPlanes,p.state.camera)):p=null,u.pop(),u.length>0?v=u[u.length-1]:v=null};function Ws(E,D,F,O){if(E.visible===!1)return;if(E.layers.test(D.layers)){if(E.isGroup)F=E.renderOrder;else if(E.isLOD)E.autoUpdate===!0&&E.update(D);else if(E.isLight)p.pushLight(E),E.castShadow&&p.pushShadow(E);else if(E.isSprite){if(!E.frustumCulled||qt.intersectsSprite(E)){O&&Mt.setFromMatrixPosition(E.matrixWorld).applyMatrix4(ht);const ot=$.update(E),pt=E.material;pt.visible&&v.push(E,ot,pt,F,Mt.z,null)}}else if((E.isMesh||E.isLine||E.isPoints)&&(!E.frustumCulled||qt.intersectsObject(E))){const ot=$.update(E),pt=E.material;if(O&&(E.boundingSphere!==void 0?(E.boundingSphere===null&&E.computeBoundingSphere(),Mt.copy(E.boundingSphere.center)):(ot.boundingSphere===null&&ot.computeBoundingSphere(),Mt.copy(ot.boundingSphere.center)),Mt.applyMatrix4(E.matrixWorld).applyMatrix4(ht)),Array.isArray(pt)){const gt=ot.groups;for(let yt=0,St=gt.length;yt<St;yt++){const vt=gt[yt],jt=pt[vt.materialIndex];jt&&jt.visible&&v.push(E,ot,jt,F,Mt.z,vt)}}else pt.visible&&v.push(E,ot,pt,F,Mt.z,null)}}const tt=E.children;for(let ot=0,pt=tt.length;ot<pt;ot++)Ws(tt[ot],D,F,O)}function Go(E,D,F,O){const I=E.opaque,tt=E.transmissive,ot=E.transparent;p.setupLightsView(F),X===!0&&Q.setGlobalState(M.clippingPlanes,F),O&&Et.viewport(_.copy(O)),I.length>0&&Gi(I,D,F),tt.length>0&&Gi(tt,D,F),ot.length>0&&Gi(ot,D,F),Et.buffers.depth.setTest(!0),Et.buffers.depth.setMask(!0),Et.buffers.color.setMask(!0),Et.setPolygonOffset(!1)}function Vo(E,D,F,O){if((F.isScene===!0?F.overrideMaterial:null)!==null)return;p.state.transmissionRenderTarget[O.id]===void 0&&(p.state.transmissionRenderTarget[O.id]=new Gn(1,1,{generateMipmaps:!0,type:Ut.has("EXT_color_buffer_half_float")||Ut.has("EXT_color_buffer_float")?Bi:on,minFilter:Nn,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:$t.workingColorSpace}));const tt=p.state.transmissionRenderTarget[O.id],ot=O.viewport||_;tt.setSize(ot.z,ot.w);const pt=M.getRenderTarget();M.setRenderTarget(tt),M.getClearColor(B),W=M.getClearAlpha(),W<1&&M.setClearColor(16777215,.5),M.clear(),Kt&&bt.render(F);const gt=M.toneMapping;M.toneMapping=xn;const yt=O.viewport;if(O.viewport!==void 0&&(O.viewport=void 0),p.setupLightsView(O),X===!0&&Q.setGlobalState(M.clippingPlanes,O),Gi(E,F,O),w.updateMultisampleRenderTarget(tt),w.updateRenderTargetMipmap(tt),Ut.has("WEBGL_multisampled_render_to_texture")===!1){let St=!1;for(let vt=0,jt=D.length;vt<jt;vt++){const te=D[vt],se=te.object,Re=te.geometry,Wt=te.material,xt=te.group;if(Wt.side===nn&&se.layers.test(O.layers)){const me=Wt.side;Wt.side=Te,Wt.needsUpdate=!0,Wo(se,F,O,Re,Wt,xt),Wt.side=me,Wt.needsUpdate=!0,St=!0}}St===!0&&(w.updateMultisampleRenderTarget(tt),w.updateRenderTargetMipmap(tt))}M.setRenderTarget(pt),M.setClearColor(B,W),yt!==void 0&&(O.viewport=yt),M.toneMapping=gt}function Gi(E,D,F){const O=D.isScene===!0?D.overrideMaterial:null;for(let I=0,tt=E.length;I<tt;I++){const ot=E[I],pt=ot.object,gt=ot.geometry,yt=O===null?ot.material:O,St=ot.group;pt.layers.test(F.layers)&&Wo(pt,D,F,gt,yt,St)}}function Wo(E,D,F,O,I,tt){E.onBeforeRender(M,D,F,O,I,tt),E.modelViewMatrix.multiplyMatrices(F.matrixWorldInverse,E.matrixWorld),E.normalMatrix.getNormalMatrix(E.modelViewMatrix),I.onBeforeRender(M,D,F,O,E,tt),I.transparent===!0&&I.side===nn&&I.forceSinglePass===!1?(I.side=Te,I.needsUpdate=!0,M.renderBufferDirect(F,D,O,I,E,tt),I.side=yn,I.needsUpdate=!0,M.renderBufferDirect(F,D,O,I,E,tt),I.side=nn):M.renderBufferDirect(F,D,O,I,E,tt),E.onAfterRender(M,D,F,O,I,tt)}function Vi(E,D,F){D.isScene!==!0&&(D=Ft);const O=At.get(E),I=p.state.lights,tt=p.state.shadowsArray,ot=I.state.version,pt=_t.getParameters(E,I.state,tt,D,F),gt=_t.getProgramCacheKey(pt);let yt=O.programs;O.environment=E.isMeshStandardMaterial?D.environment:null,O.fog=D.fog,O.envMap=(E.isMeshStandardMaterial?N:y).get(E.envMap||O.environment),O.envMapRotation=O.environment!==null&&E.envMap===null?D.environmentRotation:E.envMapRotation,yt===void 0&&(E.addEventListener("dispose",Bt),yt=new Map,O.programs=yt);let St=yt.get(gt);if(St!==void 0){if(O.currentProgram===St&&O.lightsStateVersion===ot)return $o(E,pt),St}else pt.uniforms=_t.getUniforms(E),E.onBeforeCompile(pt,M),St=_t.acquireProgram(pt,gt),yt.set(gt,St),O.uniforms=pt.uniforms;const vt=O.uniforms;return(!E.isShaderMaterial&&!E.isRawShaderMaterial||E.clipping===!0)&&(vt.clippingPlanes=Q.uniform),$o(E,pt),O.needsLights=Kl(E),O.lightsStateVersion=ot,O.needsLights&&(vt.ambientLightColor.value=I.state.ambient,vt.lightProbe.value=I.state.probe,vt.directionalLights.value=I.state.directional,vt.directionalLightShadows.value=I.state.directionalShadow,vt.spotLights.value=I.state.spot,vt.spotLightShadows.value=I.state.spotShadow,vt.rectAreaLights.value=I.state.rectArea,vt.ltc_1.value=I.state.rectAreaLTC1,vt.ltc_2.value=I.state.rectAreaLTC2,vt.pointLights.value=I.state.point,vt.pointLightShadows.value=I.state.pointShadow,vt.hemisphereLights.value=I.state.hemi,vt.directionalShadowMap.value=I.state.directionalShadowMap,vt.directionalShadowMatrix.value=I.state.directionalShadowMatrix,vt.spotShadowMap.value=I.state.spotShadowMap,vt.spotLightMatrix.value=I.state.spotLightMatrix,vt.spotLightMap.value=I.state.spotLightMap,vt.pointShadowMap.value=I.state.pointShadowMap,vt.pointShadowMatrix.value=I.state.pointShadowMatrix),O.currentProgram=St,O.uniformsList=null,St}function Xo(E){if(E.uniformsList===null){const D=E.currentProgram.getUniforms();E.uniformsList=Rs.seqWithValue(D.seq,E.uniforms)}return E.uniformsList}function $o(E,D){const F=At.get(E);F.outputColorSpace=D.outputColorSpace,F.batching=D.batching,F.batchingColor=D.batchingColor,F.instancing=D.instancing,F.instancingColor=D.instancingColor,F.instancingMorph=D.instancingMorph,F.skinning=D.skinning,F.morphTargets=D.morphTargets,F.morphNormals=D.morphNormals,F.morphColors=D.morphColors,F.morphTargetsCount=D.morphTargetsCount,F.numClippingPlanes=D.numClippingPlanes,F.numIntersection=D.numClipIntersection,F.vertexAlphas=D.vertexAlphas,F.vertexTangents=D.vertexTangents,F.toneMapping=D.toneMapping}function ql(E,D,F,O,I){D.isScene!==!0&&(D=Ft),w.resetTextureUnits();const tt=D.fog,ot=O.isMeshStandardMaterial?D.environment:null,pt=T===null?M.outputColorSpace:T.isXRRenderTarget===!0?T.texture.colorSpace:En,gt=(O.isMeshStandardMaterial?N:y).get(O.envMap||ot),yt=O.vertexColors===!0&&!!F.attributes.color&&F.attributes.color.itemSize===4,St=!!F.attributes.tangent&&(!!O.normalMap||O.anisotropy>0),vt=!!F.morphAttributes.position,jt=!!F.morphAttributes.normal,te=!!F.morphAttributes.color;let se=xn;O.toneMapped&&(T===null||T.isXRRenderTarget===!0)&&(se=M.toneMapping);const Re=F.morphAttributes.position||F.morphAttributes.normal||F.morphAttributes.color,Wt=Re!==void 0?Re.length:0,xt=At.get(O),me=p.state.lights;if(X===!0&&(J===!0||E!==V)){const Ie=E===V&&O.id===P;Q.setState(O,E,Ie)}let Xt=!1;O.version===xt.__version?(xt.needsLights&&xt.lightsStateVersion!==me.state.version||xt.outputColorSpace!==pt||I.isBatchedMesh&&xt.batching===!1||!I.isBatchedMesh&&xt.batching===!0||I.isBatchedMesh&&xt.batchingColor===!0&&I.colorTexture===null||I.isBatchedMesh&&xt.batchingColor===!1&&I.colorTexture!==null||I.isInstancedMesh&&xt.instancing===!1||!I.isInstancedMesh&&xt.instancing===!0||I.isSkinnedMesh&&xt.skinning===!1||!I.isSkinnedMesh&&xt.skinning===!0||I.isInstancedMesh&&xt.instancingColor===!0&&I.instanceColor===null||I.isInstancedMesh&&xt.instancingColor===!1&&I.instanceColor!==null||I.isInstancedMesh&&xt.instancingMorph===!0&&I.morphTexture===null||I.isInstancedMesh&&xt.instancingMorph===!1&&I.morphTexture!==null||xt.envMap!==gt||O.fog===!0&&xt.fog!==tt||xt.numClippingPlanes!==void 0&&(xt.numClippingPlanes!==Q.numPlanes||xt.numIntersection!==Q.numIntersection)||xt.vertexAlphas!==yt||xt.vertexTangents!==St||xt.morphTargets!==vt||xt.morphNormals!==jt||xt.morphColors!==te||xt.toneMapping!==se||xt.morphTargetsCount!==Wt)&&(Xt=!0):(Xt=!0,xt.__version=O.version);let Be=xt.currentProgram;Xt===!0&&(Be=Vi(O,D,I));let Xn=!1,Pe=!1,Xs=!1;const oe=Be.getUniforms(),an=xt.uniforms;if(Et.useProgram(Be.program)&&(Xn=!0,Pe=!0,Xs=!0),O.id!==P&&(P=O.id,Pe=!0),Xn||V!==E){zt.reverseDepthBuffer?(mt.copy(E.projectionMatrix),oh(mt),ah(mt),oe.setValue(R,"projectionMatrix",mt)):oe.setValue(R,"projectionMatrix",E.projectionMatrix),oe.setValue(R,"viewMatrix",E.matrixWorldInverse);const Ie=oe.map.cameraPosition;Ie!==void 0&&Ie.setValue(R,wt.setFromMatrixPosition(E.matrixWorld)),zt.logarithmicDepthBuffer&&oe.setValue(R,"logDepthBufFC",2/(Math.log(E.far+1)/Math.LN2)),(O.isMeshPhongMaterial||O.isMeshToonMaterial||O.isMeshLambertMaterial||O.isMeshBasicMaterial||O.isMeshStandardMaterial||O.isShaderMaterial)&&oe.setValue(R,"isOrthographic",E.isOrthographicCamera===!0),V!==E&&(V=E,Pe=!0,Xs=!0)}if(I.isSkinnedMesh){oe.setOptional(R,I,"bindMatrix"),oe.setOptional(R,I,"bindMatrixInverse");const Ie=I.skeleton;Ie&&(Ie.boneTexture===null&&Ie.computeBoneTexture(),oe.setValue(R,"boneTexture",Ie.boneTexture,w))}I.isBatchedMesh&&(oe.setOptional(R,I,"batchingTexture"),oe.setValue(R,"batchingTexture",I._matricesTexture,w),oe.setOptional(R,I,"batchingIdTexture"),oe.setValue(R,"batchingIdTexture",I._indirectTexture,w),oe.setOptional(R,I,"batchingColorTexture"),I._colorsTexture!==null&&oe.setValue(R,"batchingColorTexture",I._colorsTexture,w));const $s=F.morphAttributes;if(($s.position!==void 0||$s.normal!==void 0||$s.color!==void 0)&&Tt.update(I,F,Be),(Pe||xt.receiveShadow!==I.receiveShadow)&&(xt.receiveShadow=I.receiveShadow,oe.setValue(R,"receiveShadow",I.receiveShadow)),O.isMeshGouraudMaterial&&O.envMap!==null&&(an.envMap.value=gt,an.flipEnvMap.value=gt.isCubeTexture&&gt.isRenderTargetTexture===!1?-1:1),O.isMeshStandardMaterial&&O.envMap===null&&D.environment!==null&&(an.envMapIntensity.value=D.environmentIntensity),Pe&&(oe.setValue(R,"toneMappingExposure",M.toneMappingExposure),xt.needsLights&&jl(an,Xs),tt&&O.fog===!0&&nt.refreshFogUniforms(an,tt),nt.refreshMaterialUniforms(an,O,j,G,p.state.transmissionRenderTarget[E.id]),Rs.upload(R,Xo(xt),an,w)),O.isShaderMaterial&&O.uniformsNeedUpdate===!0&&(Rs.upload(R,Xo(xt),an,w),O.uniformsNeedUpdate=!1),O.isSpriteMaterial&&oe.setValue(R,"center",I.center),oe.setValue(R,"modelViewMatrix",I.modelViewMatrix),oe.setValue(R,"normalMatrix",I.normalMatrix),oe.setValue(R,"modelMatrix",I.matrixWorld),O.isShaderMaterial||O.isRawShaderMaterial){const Ie=O.uniformsGroups;for(let Ys=0,Zl=Ie.length;Ys<Zl;Ys++){const Yo=Ie[Ys];L.update(Yo,Be),L.bind(Yo,Be)}}return Be}function jl(E,D){E.ambientLightColor.needsUpdate=D,E.lightProbe.needsUpdate=D,E.directionalLights.needsUpdate=D,E.directionalLightShadows.needsUpdate=D,E.pointLights.needsUpdate=D,E.pointLightShadows.needsUpdate=D,E.spotLights.needsUpdate=D,E.spotLightShadows.needsUpdate=D,E.rectAreaLights.needsUpdate=D,E.hemisphereLights.needsUpdate=D}function Kl(E){return E.isMeshLambertMaterial||E.isMeshToonMaterial||E.isMeshPhongMaterial||E.isMeshStandardMaterial||E.isShadowMaterial||E.isShaderMaterial&&E.lights===!0}this.getActiveCubeFace=function(){return C},this.getActiveMipmapLevel=function(){return A},this.getRenderTarget=function(){return T},this.setRenderTargetTextures=function(E,D,F){At.get(E.texture).__webglTexture=D,At.get(E.depthTexture).__webglTexture=F;const O=At.get(E);O.__hasExternalTextures=!0,O.__autoAllocateDepthBuffer=F===void 0,O.__autoAllocateDepthBuffer||Ut.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),O.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(E,D){const F=At.get(E);F.__webglFramebuffer=D,F.__useDefaultFramebuffer=D===void 0},this.setRenderTarget=function(E,D=0,F=0){T=E,C=D,A=F;let O=!0,I=null,tt=!1,ot=!1;if(E){const gt=At.get(E);if(gt.__useDefaultFramebuffer!==void 0)Et.bindFramebuffer(R.FRAMEBUFFER,null),O=!1;else if(gt.__webglFramebuffer===void 0)w.setupRenderTarget(E);else if(gt.__hasExternalTextures)w.rebindTextures(E,At.get(E.texture).__webglTexture,At.get(E.depthTexture).__webglTexture);else if(E.depthBuffer){const vt=E.depthTexture;if(gt.__boundDepthTexture!==vt){if(vt!==null&&At.has(vt)&&(E.width!==vt.image.width||E.height!==vt.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");w.setupDepthRenderbuffer(E)}}const yt=E.texture;(yt.isData3DTexture||yt.isDataArrayTexture||yt.isCompressedArrayTexture)&&(ot=!0);const St=At.get(E).__webglFramebuffer;E.isWebGLCubeRenderTarget?(Array.isArray(St[D])?I=St[D][F]:I=St[D],tt=!0):E.samples>0&&w.useMultisampledRTT(E)===!1?I=At.get(E).__webglMultisampledFramebuffer:Array.isArray(St)?I=St[F]:I=St,_.copy(E.viewport),b.copy(E.scissor),k=E.scissorTest}else _.copy(at).multiplyScalar(j).floor(),b.copy(st).multiplyScalar(j).floor(),k=It;if(Et.bindFramebuffer(R.FRAMEBUFFER,I)&&O&&Et.drawBuffers(E,I),Et.viewport(_),Et.scissor(b),Et.setScissorTest(k),tt){const gt=At.get(E.texture);R.framebufferTexture2D(R.FRAMEBUFFER,R.COLOR_ATTACHMENT0,R.TEXTURE_CUBE_MAP_POSITIVE_X+D,gt.__webglTexture,F)}else if(ot){const gt=At.get(E.texture),yt=D||0;R.framebufferTextureLayer(R.FRAMEBUFFER,R.COLOR_ATTACHMENT0,gt.__webglTexture,F||0,yt)}P=-1},this.readRenderTargetPixels=function(E,D,F,O,I,tt,ot){if(!(E&&E.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let pt=At.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&ot!==void 0&&(pt=pt[ot]),pt){Et.bindFramebuffer(R.FRAMEBUFFER,pt);try{const gt=E.texture,yt=gt.format,St=gt.type;if(!zt.textureFormatReadable(yt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!zt.textureTypeReadable(St)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}D>=0&&D<=E.width-O&&F>=0&&F<=E.height-I&&R.readPixels(D,F,O,I,Ct.convert(yt),Ct.convert(St),tt)}finally{const gt=T!==null?At.get(T).__webglFramebuffer:null;Et.bindFramebuffer(R.FRAMEBUFFER,gt)}}},this.readRenderTargetPixelsAsync=async function(E,D,F,O,I,tt,ot){if(!(E&&E.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let pt=At.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&ot!==void 0&&(pt=pt[ot]),pt){const gt=E.texture,yt=gt.format,St=gt.type;if(!zt.textureFormatReadable(yt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!zt.textureTypeReadable(St))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(D>=0&&D<=E.width-O&&F>=0&&F<=E.height-I){Et.bindFramebuffer(R.FRAMEBUFFER,pt);const vt=R.createBuffer();R.bindBuffer(R.PIXEL_PACK_BUFFER,vt),R.bufferData(R.PIXEL_PACK_BUFFER,tt.byteLength,R.STREAM_READ),R.readPixels(D,F,O,I,Ct.convert(yt),Ct.convert(St),0);const jt=T!==null?At.get(T).__webglFramebuffer:null;Et.bindFramebuffer(R.FRAMEBUFFER,jt);const te=R.fenceSync(R.SYNC_GPU_COMMANDS_COMPLETE,0);return R.flush(),await rh(R,te,4),R.bindBuffer(R.PIXEL_PACK_BUFFER,vt),R.getBufferSubData(R.PIXEL_PACK_BUFFER,0,tt),R.deleteBuffer(vt),R.deleteSync(te),tt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(E,D=null,F=0){E.isTexture!==!0&&(Cs("WebGLRenderer: copyFramebufferToTexture function signature has changed."),D=arguments[0]||null,E=arguments[1]);const O=Math.pow(2,-F),I=Math.floor(E.image.width*O),tt=Math.floor(E.image.height*O),ot=D!==null?D.x:0,pt=D!==null?D.y:0;w.setTexture2D(E,0),R.copyTexSubImage2D(R.TEXTURE_2D,F,0,0,ot,pt,I,tt),Et.unbindTexture()},this.copyTextureToTexture=function(E,D,F=null,O=null,I=0){E.isTexture!==!0&&(Cs("WebGLRenderer: copyTextureToTexture function signature has changed."),O=arguments[0]||null,E=arguments[1],D=arguments[2],I=arguments[3]||0,F=null);let tt,ot,pt,gt,yt,St;F!==null?(tt=F.max.x-F.min.x,ot=F.max.y-F.min.y,pt=F.min.x,gt=F.min.y):(tt=E.image.width,ot=E.image.height,pt=0,gt=0),O!==null?(yt=O.x,St=O.y):(yt=0,St=0);const vt=Ct.convert(D.format),jt=Ct.convert(D.type);w.setTexture2D(D,0),R.pixelStorei(R.UNPACK_FLIP_Y_WEBGL,D.flipY),R.pixelStorei(R.UNPACK_PREMULTIPLY_ALPHA_WEBGL,D.premultiplyAlpha),R.pixelStorei(R.UNPACK_ALIGNMENT,D.unpackAlignment);const te=R.getParameter(R.UNPACK_ROW_LENGTH),se=R.getParameter(R.UNPACK_IMAGE_HEIGHT),Re=R.getParameter(R.UNPACK_SKIP_PIXELS),Wt=R.getParameter(R.UNPACK_SKIP_ROWS),xt=R.getParameter(R.UNPACK_SKIP_IMAGES),me=E.isCompressedTexture?E.mipmaps[I]:E.image;R.pixelStorei(R.UNPACK_ROW_LENGTH,me.width),R.pixelStorei(R.UNPACK_IMAGE_HEIGHT,me.height),R.pixelStorei(R.UNPACK_SKIP_PIXELS,pt),R.pixelStorei(R.UNPACK_SKIP_ROWS,gt),E.isDataTexture?R.texSubImage2D(R.TEXTURE_2D,I,yt,St,tt,ot,vt,jt,me.data):E.isCompressedTexture?R.compressedTexSubImage2D(R.TEXTURE_2D,I,yt,St,me.width,me.height,vt,me.data):R.texSubImage2D(R.TEXTURE_2D,I,yt,St,tt,ot,vt,jt,me),R.pixelStorei(R.UNPACK_ROW_LENGTH,te),R.pixelStorei(R.UNPACK_IMAGE_HEIGHT,se),R.pixelStorei(R.UNPACK_SKIP_PIXELS,Re),R.pixelStorei(R.UNPACK_SKIP_ROWS,Wt),R.pixelStorei(R.UNPACK_SKIP_IMAGES,xt),I===0&&D.generateMipmaps&&R.generateMipmap(R.TEXTURE_2D),Et.unbindTexture()},this.copyTextureToTexture3D=function(E,D,F=null,O=null,I=0){E.isTexture!==!0&&(Cs("WebGLRenderer: copyTextureToTexture3D function signature has changed."),F=arguments[0]||null,O=arguments[1]||null,E=arguments[2],D=arguments[3],I=arguments[4]||0);let tt,ot,pt,gt,yt,St,vt,jt,te;const se=E.isCompressedTexture?E.mipmaps[I]:E.image;F!==null?(tt=F.max.x-F.min.x,ot=F.max.y-F.min.y,pt=F.max.z-F.min.z,gt=F.min.x,yt=F.min.y,St=F.min.z):(tt=se.width,ot=se.height,pt=se.depth,gt=0,yt=0,St=0),O!==null?(vt=O.x,jt=O.y,te=O.z):(vt=0,jt=0,te=0);const Re=Ct.convert(D.format),Wt=Ct.convert(D.type);let xt;if(D.isData3DTexture)w.setTexture3D(D,0),xt=R.TEXTURE_3D;else if(D.isDataArrayTexture||D.isCompressedArrayTexture)w.setTexture2DArray(D,0),xt=R.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}R.pixelStorei(R.UNPACK_FLIP_Y_WEBGL,D.flipY),R.pixelStorei(R.UNPACK_PREMULTIPLY_ALPHA_WEBGL,D.premultiplyAlpha),R.pixelStorei(R.UNPACK_ALIGNMENT,D.unpackAlignment);const me=R.getParameter(R.UNPACK_ROW_LENGTH),Xt=R.getParameter(R.UNPACK_IMAGE_HEIGHT),Be=R.getParameter(R.UNPACK_SKIP_PIXELS),Xn=R.getParameter(R.UNPACK_SKIP_ROWS),Pe=R.getParameter(R.UNPACK_SKIP_IMAGES);R.pixelStorei(R.UNPACK_ROW_LENGTH,se.width),R.pixelStorei(R.UNPACK_IMAGE_HEIGHT,se.height),R.pixelStorei(R.UNPACK_SKIP_PIXELS,gt),R.pixelStorei(R.UNPACK_SKIP_ROWS,yt),R.pixelStorei(R.UNPACK_SKIP_IMAGES,St),E.isDataTexture||E.isData3DTexture?R.texSubImage3D(xt,I,vt,jt,te,tt,ot,pt,Re,Wt,se.data):D.isCompressedArrayTexture?R.compressedTexSubImage3D(xt,I,vt,jt,te,tt,ot,pt,Re,se.data):R.texSubImage3D(xt,I,vt,jt,te,tt,ot,pt,Re,Wt,se),R.pixelStorei(R.UNPACK_ROW_LENGTH,me),R.pixelStorei(R.UNPACK_IMAGE_HEIGHT,Xt),R.pixelStorei(R.UNPACK_SKIP_PIXELS,Be),R.pixelStorei(R.UNPACK_SKIP_ROWS,Xn),R.pixelStorei(R.UNPACK_SKIP_IMAGES,Pe),I===0&&D.generateMipmaps&&R.generateMipmap(xt),Et.unbindTexture()},this.initRenderTarget=function(E){At.get(E).__webglFramebuffer===void 0&&w.setupRenderTarget(E)},this.initTexture=function(E){E.isCubeTexture?w.setTextureCube(E,0):E.isData3DTexture?w.setTexture3D(E,0):E.isDataArrayTexture||E.isCompressedArrayTexture?w.setTexture2DArray(E,0):w.setTexture2D(E,0),Et.unbindTexture()},this.resetState=function(){C=0,A=0,T=null,Et.reset(),Jt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return rn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorSpace=t===Io?"display-p3":"srgb",e.unpackColorSpace=$t.workingColorSpace===ks?"display-p3":"srgb"}}class xm extends pe{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new qe,this.environmentIntensity=1,this.environmentRotation=new qe,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}}class gn extends Ei{constructor(t){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Pt(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}}const Fs=new U,Os=new U,Ga=new ie,Li=new Hs,ps=new zs,Tr=new U,Va=new U;class ci extends pe{constructor(t=new fe,e=new gn){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,n=[0];for(let s=1,r=e.count;s<r;s++)Fs.fromBufferAttribute(e,s-1),Os.fromBufferAttribute(e,s),n[s]=n[s-1],n[s]+=Fs.distanceTo(Os);t.setAttribute("lineDistance",new we(n,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(t,e){const n=this.geometry,s=this.matrixWorld,r=t.params.Line.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),ps.copy(n.boundingSphere),ps.applyMatrix4(s),ps.radius+=r,t.ray.intersectsSphere(ps)===!1)return;Ga.copy(s).invert(),Li.copy(t.ray).applyMatrix4(Ga);const a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=this.isLineSegments?2:1,d=n.index,f=n.attributes.position;if(d!==null){const m=Math.max(0,o.start),g=Math.min(d.count,o.start+o.count);for(let v=m,p=g-1;v<p;v+=c){const u=d.getX(v),S=d.getX(v+1),M=ms(this,t,Li,l,u,S);M&&e.push(M)}if(this.isLineLoop){const v=d.getX(g-1),p=d.getX(m),u=ms(this,t,Li,l,v,p);u&&e.push(u)}}else{const m=Math.max(0,o.start),g=Math.min(f.count,o.start+o.count);for(let v=m,p=g-1;v<p;v+=c){const u=ms(this,t,Li,l,v,v+1);u&&e.push(u)}if(this.isLineLoop){const v=ms(this,t,Li,l,g-1,m);v&&e.push(v)}}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){const a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}}function ms(i,t,e,n,s,r){const o=i.geometry.attributes.position;if(Fs.fromBufferAttribute(o,s),Os.fromBufferAttribute(o,r),e.distanceSqToSegment(Fs,Os,Tr,Va)>n)return;Tr.applyMatrix4(i.matrixWorld);const l=t.ray.origin.distanceTo(Tr);if(!(l<t.near||l>t.far))return{distance:l,point:Va.clone().applyMatrix4(i.matrixWorld),index:s,face:null,faceIndex:null,barycoord:null,object:i}}const Wa=new U,Xa=new U;class ym extends ci{constructor(t,e){super(t,e),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,n=[];for(let s=0,r=e.count;s<r;s+=2)Wa.fromBufferAttribute(e,s),Xa.fromBufferAttribute(e,s+1),n[s]=s===0?0:n[s-1],n[s+1]=n[s]+Wa.distanceTo(Xa);t.setAttribute("lineDistance",new we(n,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class Oo extends fe{constructor(t=1,e=32,n=16,s=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:s,phiLength:r,thetaStart:o,thetaLength:a},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));const l=Math.min(o+a,Math.PI);let c=0;const d=[],h=new U,f=new U,m=[],g=[],v=[],p=[];for(let u=0;u<=n;u++){const S=[],M=u/n;let x=0;u===0&&o===0?x=.5/e:u===n&&l===Math.PI&&(x=-.5/e);for(let C=0;C<=e;C++){const A=C/e;h.x=-t*Math.cos(s+A*r)*Math.sin(o+M*a),h.y=t*Math.cos(o+M*a),h.z=t*Math.sin(s+A*r)*Math.sin(o+M*a),g.push(h.x,h.y,h.z),f.copy(h).normalize(),v.push(f.x,f.y,f.z),p.push(A+x,1-M),S.push(c++)}d.push(S)}for(let u=0;u<n;u++)for(let S=0;S<e;S++){const M=d[u][S+1],x=d[u][S],C=d[u+1][S],A=d[u+1][S+1];(u!==0||o>0)&&m.push(M,x,A),(u!==n-1||l<Math.PI)&&m.push(x,C,A)}this.setIndex(m),this.setAttribute("position",new we(g,3)),this.setAttribute("normal",new we(v,3)),this.setAttribute("uv",new we(p,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Oo(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}class $a extends Ei{constructor(t){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.type="MeshStandardMaterial",this.color=new Pt(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Pt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Sl,this.normalScale=new Rt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new qe,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class Hl extends pe{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new Pt(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(e.object.target=this.target.uuid),e}}class Mm extends Hl{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(pe.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Pt(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}}const Ar=new ie,Ya=new U,qa=new U;class Sm{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Rt(512,512),this.map=null,this.mapPass=null,this.matrix=new ie,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new No,this._frameExtents=new Rt(1,1),this._viewportCount=1,this._viewports=[new re(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera,n=this.matrix;Ya.setFromMatrixPosition(t.matrixWorld),e.position.copy(Ya),qa.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(qa),e.updateMatrixWorld(),Ar.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Ar),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(Ar)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}class Em extends Sm{constructor(){super(new Nl(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class wr extends Hl{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(pe.DEFAULT_UP),this.updateMatrix(),this.target=new pe,this.shadow=new Em}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}class bm{constructor(t=!0){this.autoStart=t,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=ja(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let t=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){const e=ja();t=(e-this.oldTime)/1e3,this.oldTime=e,this.elapsedTime+=t}return t}}function ja(){return performance.now()}const Ka=new ie;class Tm{constructor(t,e,n=0,s=1/0){this.ray=new Hs(t,e),this.near=n,this.far=s,this.camera=null,this.layers=new Uo,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(t,e){this.ray.set(t,e)}setFromCamera(t,e){e.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(t.x,t.y,.5).unproject(e).sub(this.ray.origin).normalize(),this.camera=e):e.isOrthographicCamera?(this.ray.origin.set(t.x,t.y,(e.near+e.far)/(e.near-e.far)).unproject(e),this.ray.direction.set(0,0,-1).transformDirection(e.matrixWorld),this.camera=e):console.error("THREE.Raycaster: Unsupported camera type: "+e.type)}setFromXRController(t){return Ka.identity().extractRotation(t.matrixWorld),this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Ka),this}intersectObject(t,e=!0,n=[]){return yo(t,this,n,e),n.sort(Za),n}intersectObjects(t,e=!0,n=[]){for(let s=0,r=t.length;s<r;s++)yo(t[s],this,n,e);return n.sort(Za),n}}function Za(i,t){return i.distance-t.distance}function yo(i,t,e,n){let s=!0;if(i.layers.test(t.layers)&&i.raycast(t,e)===!1&&(s=!1),s===!0&&n===!0){const r=i.children;for(let o=0,a=r.length;o<a;o++)yo(r[o],t,e,!0)}}class Ja{constructor(t=1,e=0,n=0){return this.radius=t,this.phi=e,this.theta=n,this}set(t,e,n){return this.radius=t,this.phi=e,this.theta=n,this}copy(t){return this.radius=t.radius,this.phi=t.phi,this.theta=t.theta,this}makeSafe(){return this.phi=Math.max(1e-6,Math.min(Math.PI-1e-6,this.phi)),this}setFromVector3(t){return this.setFromCartesianCoords(t.x,t.y,t.z)}setFromCartesianCoords(t,e,n){return this.radius=Math.sqrt(t*t+e*e+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(t,n),this.phi=Math.acos(ye(e/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}}class Am extends ym{constructor(t=10,e=10,n=4473924,s=8947848){n=new Pt(n),s=new Pt(s);const r=e/2,o=t/e,a=t/2,l=[],c=[];for(let f=0,m=0,g=-a;f<=e;f++,g+=o){l.push(-a,0,g,a,0,g),l.push(g,0,-a,g,0,a);const v=f===r?n:s;v.toArray(c,m),m+=3,v.toArray(c,m),m+=3,v.toArray(c,m),m+=3,v.toArray(c,m),m+=3}const d=new fe;d.setAttribute("position",new we(l,3)),d.setAttribute("color",new we(c,3));const h=new gn({vertexColors:!0,toneMapped:!1});super(d,h),this.type="GridHelper"}dispose(){this.geometry.dispose(),this.material.dispose()}}class wm extends Wn{constructor(t,e=null){super(),this.object=t,this.domElement=e,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(){}disconnect(){}dispose(){}update(){}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Ao}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Ao);const Qa={type:"change"},Bo={type:"start"},Gl={type:"end"},gs=new Hs,tl=new mn,Cm=Math.cos(70*ih.DEG2RAD),ce=new U,be=2*Math.PI,Zt={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},Cr=1e-6;class Rm extends wm{constructor(t,e=null){super(t,e),this.state=Zt.NONE,this.enabled=!0,this.target=new U,this.cursor=new U,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:di.ROTATE,MIDDLE:di.DOLLY,RIGHT:di.PAN},this.touches={ONE:hi.ROTATE,TWO:hi.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this._lastPosition=new U,this._lastQuaternion=new Vn,this._lastTargetPosition=new U,this._quat=new Vn().setFromUnitVectors(t.up,new U(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new Ja,this._sphericalDelta=new Ja,this._scale=1,this._panOffset=new U,this._rotateStart=new Rt,this._rotateEnd=new Rt,this._rotateDelta=new Rt,this._panStart=new Rt,this._panEnd=new Rt,this._panDelta=new Rt,this._dollyStart=new Rt,this._dollyEnd=new Rt,this._dollyDelta=new Rt,this._dollyDirection=new U,this._mouse=new Rt,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=Lm.bind(this),this._onPointerDown=Pm.bind(this),this._onPointerUp=Dm.bind(this),this._onContextMenu=km.bind(this),this._onMouseWheel=Nm.bind(this),this._onKeyDown=Fm.bind(this),this._onTouchStart=Om.bind(this),this._onTouchMove=Bm.bind(this),this._onMouseDown=Im.bind(this),this._onMouseMove=Um.bind(this),this._interceptControlDown=zm.bind(this),this._interceptControlUp=Hm.bind(this),this.domElement!==null&&this.connect(),this.update()}connect(){this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.getRootNode().removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.style.touchAction="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(t){t.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=t}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(Qa),this.update(),this.state=Zt.NONE}update(t=null){const e=this.object.position;ce.copy(e).sub(this.target),ce.applyQuaternion(this._quat),this._spherical.setFromVector3(ce),this.autoRotate&&this.state===Zt.NONE&&this._rotateLeft(this._getAutoRotationAngle(t)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,s=this.maxAzimuthAngle;isFinite(n)&&isFinite(s)&&(n<-Math.PI?n+=be:n>Math.PI&&(n-=be),s<-Math.PI?s+=be:s>Math.PI&&(s-=be),n<=s?this._spherical.theta=Math.max(n,Math.min(s,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+s)/2?Math.max(n,this._spherical.theta):Math.min(s,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let r=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{const o=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),r=o!=this._spherical.radius}if(ce.setFromSpherical(this._spherical),ce.applyQuaternion(this._quatInverse),e.copy(this.target).add(ce),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let o=null;if(this.object.isPerspectiveCamera){const a=ce.length();o=this._clampDistance(a*this._scale);const l=a-o;this.object.position.addScaledVector(this._dollyDirection,l),this.object.updateMatrixWorld(),r=!!l}else if(this.object.isOrthographicCamera){const a=new U(this._mouse.x,this._mouse.y,0);a.unproject(this.object);const l=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),r=l!==this.object.zoom;const c=new U(this._mouse.x,this._mouse.y,0);c.unproject(this.object),this.object.position.sub(c).add(a),this.object.updateMatrixWorld(),o=ce.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;o!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(o).add(this.object.position):(gs.origin.copy(this.object.position),gs.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(gs.direction))<Cm?this.object.lookAt(this.target):(tl.setFromNormalAndCoplanarPoint(this.object.up,this.target),gs.intersectPlane(tl,this.target))))}else if(this.object.isOrthographicCamera){const o=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),o!==this.object.zoom&&(this.object.updateProjectionMatrix(),r=!0)}return this._scale=1,this._performCursorZoom=!1,r||this._lastPosition.distanceToSquared(this.object.position)>Cr||8*(1-this._lastQuaternion.dot(this.object.quaternion))>Cr||this._lastTargetPosition.distanceToSquared(this.target)>Cr?(this.dispatchEvent(Qa),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(t){return t!==null?be/60*this.autoRotateSpeed*t:be/60/60*this.autoRotateSpeed}_getZoomScale(t){const e=Math.abs(t*.01);return Math.pow(.95,this.zoomSpeed*e)}_rotateLeft(t){this._sphericalDelta.theta-=t}_rotateUp(t){this._sphericalDelta.phi-=t}_panLeft(t,e){ce.setFromMatrixColumn(e,0),ce.multiplyScalar(-t),this._panOffset.add(ce)}_panUp(t,e){this.screenSpacePanning===!0?ce.setFromMatrixColumn(e,1):(ce.setFromMatrixColumn(e,0),ce.crossVectors(this.object.up,ce)),ce.multiplyScalar(t),this._panOffset.add(ce)}_pan(t,e){const n=this.domElement;if(this.object.isPerspectiveCamera){const s=this.object.position;ce.copy(s).sub(this.target);let r=ce.length();r*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*t*r/n.clientHeight,this.object.matrix),this._panUp(2*e*r/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(t*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(e*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(t,e){if(!this.zoomToCursor)return;this._performCursorZoom=!0;const n=this.domElement.getBoundingClientRect(),s=t-n.left,r=e-n.top,o=n.width,a=n.height;this._mouse.x=s/o*2-1,this._mouse.y=-(r/a)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(t){return Math.max(this.minDistance,Math.min(this.maxDistance,t))}_handleMouseDownRotate(t){this._rotateStart.set(t.clientX,t.clientY)}_handleMouseDownDolly(t){this._updateZoomParameters(t.clientX,t.clientX),this._dollyStart.set(t.clientX,t.clientY)}_handleMouseDownPan(t){this._panStart.set(t.clientX,t.clientY)}_handleMouseMoveRotate(t){this._rotateEnd.set(t.clientX,t.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const e=this.domElement;this._rotateLeft(be*this._rotateDelta.x/e.clientHeight),this._rotateUp(be*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(t){this._dollyEnd.set(t.clientX,t.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(t){this._panEnd.set(t.clientX,t.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(t){this._updateZoomParameters(t.clientX,t.clientY),t.deltaY<0?this._dollyIn(this._getZoomScale(t.deltaY)):t.deltaY>0&&this._dollyOut(this._getZoomScale(t.deltaY)),this.update()}_handleKeyDown(t){let e=!1;switch(t.code){case this.keys.UP:t.ctrlKey||t.metaKey||t.shiftKey?this._rotateUp(be*this.rotateSpeed/this.domElement.clientHeight):this._pan(0,this.keyPanSpeed),e=!0;break;case this.keys.BOTTOM:t.ctrlKey||t.metaKey||t.shiftKey?this._rotateUp(-be*this.rotateSpeed/this.domElement.clientHeight):this._pan(0,-this.keyPanSpeed),e=!0;break;case this.keys.LEFT:t.ctrlKey||t.metaKey||t.shiftKey?this._rotateLeft(be*this.rotateSpeed/this.domElement.clientHeight):this._pan(this.keyPanSpeed,0),e=!0;break;case this.keys.RIGHT:t.ctrlKey||t.metaKey||t.shiftKey?this._rotateLeft(-be*this.rotateSpeed/this.domElement.clientHeight):this._pan(-this.keyPanSpeed,0),e=!0;break}e&&(t.preventDefault(),this.update())}_handleTouchStartRotate(t){if(this._pointers.length===1)this._rotateStart.set(t.pageX,t.pageY);else{const e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._rotateStart.set(n,s)}}_handleTouchStartPan(t){if(this._pointers.length===1)this._panStart.set(t.pageX,t.pageY);else{const e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._panStart.set(n,s)}}_handleTouchStartDolly(t){const e=this._getSecondPointerPosition(t),n=t.pageX-e.x,s=t.pageY-e.y,r=Math.sqrt(n*n+s*s);this._dollyStart.set(0,r)}_handleTouchStartDollyPan(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enablePan&&this._handleTouchStartPan(t)}_handleTouchStartDollyRotate(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enableRotate&&this._handleTouchStartRotate(t)}_handleTouchMoveRotate(t){if(this._pointers.length==1)this._rotateEnd.set(t.pageX,t.pageY);else{const n=this._getSecondPointerPosition(t),s=.5*(t.pageX+n.x),r=.5*(t.pageY+n.y);this._rotateEnd.set(s,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const e=this.domElement;this._rotateLeft(be*this._rotateDelta.x/e.clientHeight),this._rotateUp(be*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(t){if(this._pointers.length===1)this._panEnd.set(t.pageX,t.pageY);else{const e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._panEnd.set(n,s)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(t){const e=this._getSecondPointerPosition(t),n=t.pageX-e.x,s=t.pageY-e.y,r=Math.sqrt(n*n+s*s);this._dollyEnd.set(0,r),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);const o=(t.pageX+e.x)*.5,a=(t.pageY+e.y)*.5;this._updateZoomParameters(o,a)}_handleTouchMoveDollyPan(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enablePan&&this._handleTouchMovePan(t)}_handleTouchMoveDollyRotate(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enableRotate&&this._handleTouchMoveRotate(t)}_addPointer(t){this._pointers.push(t.pointerId)}_removePointer(t){delete this._pointerPositions[t.pointerId];for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId){this._pointers.splice(e,1);return}}_isTrackingPointer(t){for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId)return!0;return!1}_trackPointer(t){let e=this._pointerPositions[t.pointerId];e===void 0&&(e=new Rt,this._pointerPositions[t.pointerId]=e),e.set(t.pageX,t.pageY)}_getSecondPointerPosition(t){const e=t.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[e]}_customWheelEvent(t){const e=t.deltaMode,n={clientX:t.clientX,clientY:t.clientY,deltaY:t.deltaY};switch(e){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100;break}return t.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}}function Pm(i){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(i.pointerId),this.domElement.addEventListener("pointermove",this._onPointerMove),this.domElement.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(i)&&(this._addPointer(i),i.pointerType==="touch"?this._onTouchStart(i):this._onMouseDown(i)))}function Lm(i){this.enabled!==!1&&(i.pointerType==="touch"?this._onTouchMove(i):this._onMouseMove(i))}function Dm(i){switch(this._removePointer(i),this._pointers.length){case 0:this.domElement.releasePointerCapture(i.pointerId),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(Gl),this.state=Zt.NONE;break;case 1:const t=this._pointers[0],e=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:e.x,pageY:e.y});break}}function Im(i){let t;switch(i.button){case 0:t=this.mouseButtons.LEFT;break;case 1:t=this.mouseButtons.MIDDLE;break;case 2:t=this.mouseButtons.RIGHT;break;default:t=-1}switch(t){case di.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(i),this.state=Zt.DOLLY;break;case di.ROTATE:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=Zt.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=Zt.ROTATE}break;case di.PAN:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=Zt.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=Zt.PAN}break;default:this.state=Zt.NONE}this.state!==Zt.NONE&&this.dispatchEvent(Bo)}function Um(i){switch(this.state){case Zt.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(i);break;case Zt.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(i);break;case Zt.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(i);break}}function Nm(i){this.enabled===!1||this.enableZoom===!1||this.state!==Zt.NONE||(i.preventDefault(),this.dispatchEvent(Bo),this._handleMouseWheel(this._customWheelEvent(i)),this.dispatchEvent(Gl))}function Fm(i){this.enabled===!1||this.enablePan===!1||this._handleKeyDown(i)}function Om(i){switch(this._trackPointer(i),this._pointers.length){case 1:switch(this.touches.ONE){case hi.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(i),this.state=Zt.TOUCH_ROTATE;break;case hi.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(i),this.state=Zt.TOUCH_PAN;break;default:this.state=Zt.NONE}break;case 2:switch(this.touches.TWO){case hi.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(i),this.state=Zt.TOUCH_DOLLY_PAN;break;case hi.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(i),this.state=Zt.TOUCH_DOLLY_ROTATE;break;default:this.state=Zt.NONE}break;default:this.state=Zt.NONE}this.state!==Zt.NONE&&this.dispatchEvent(Bo)}function Bm(i){switch(this._trackPointer(i),this.state){case Zt.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(i),this.update();break;case Zt.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(i),this.update();break;case Zt.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(i),this.update();break;case Zt.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(i),this.update();break;default:this.state=Zt.NONE}}function km(i){this.enabled!==!1&&i.preventDefault()}function zm(i){i.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function Hm(i){i.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}const ai=bo,Sn=[{id:"peakA",name:"山峰 A",short:"山峰",type:"peak",accent:"#f59e0b",shape:{kind:"circle",x:ai.peakA.x,y:ai.peakA.y,radius:200},elevation:{min:620,max:930},slope:{label:"山顶附近较陡，向外逐渐变缓"},summary:"整幅图海拔最高的地方。",desc:"山峰是地形中海拔较高的局部区域，四周都比它低。",contour:"在等高线图上，山峰附近常出现一圈圈近似闭合的等高线，海拔数值由外向内越来越大；最里面那一圈围出的就是山顶。",note:"要注意：闭合的等高线不一定都是山峰，还要看数值是向中心变大还是变小。",detail:["观察三维地形：这是一个四周低、中间高的隆起。","观察等高线图：以山峰 A 为中心，等高线一圈套一圈，越往里海拔越高。","观察剖面图：把剖面线拖过山顶，剖面上会出现一个明显的“尖峰”。"],challenge:"找出整张地图的最高点，并说出它大约是多少米。"},{id:"peakB",name:"山峰 B",short:"山峰",type:"peak",accent:"#f97316",shape:{kind:"circle",x:590,y:350,radius:200},elevation:{min:560,max:810},slope:{label:"西南侧较陡，东北侧较缓"},summary:"图幅内第二高的山峰。",desc:"同一幅地图上可以有不止一个山峰，它们的高度可以不相同。",contour:"山峰 B 同样表现为一组闭合等高线，但最高一圈的数值比山峰 A 小。",note:"比较两个山峰的高低，要看最内圈等高线的数值，而不是看“圈数多少”。",detail:["山峰 B 的最高海拔低于山峰 A。","它的西南坡朝山谷，等高线更密，坡度更陡；东北坡等高线较疏。"],challenge:"比较山峰 A 与山峰 B，哪一座更高？"},{id:"saddle",name:"鞍部",short:"鞍部",type:"saddle",accent:"#a78bfa",shape:{kind:"circle",x:ai.saddle.x,y:ai.saddle.y,radius:185},elevation:{min:450,max:720},slope:{label:"两个方向上坡度不同：两侧较陡，前后较缓"},summary:"两座山峰之间相对较低的地方，像马鞍。",desc:"鞍部是两个相邻高地之间的相对低处，也叫垭口，是穿越山地的天然通道。",contour:"在等高线图上，鞍部常位于两组闭合曲线之间，形状像马鞍：顺着一个方向是向上爬到两个山峰，顺着另一个方向则是向两侧下降。",note:"鞍部并不是“山谷”：它两侧是更高的山峰，而山谷两侧是向一面倾斜的山坡。",detail:["把 A 点放在山峰 A、B 点放在山峰 B，剖面图上会出现“高—低—高”的马鞍形状。","鞍部的高度比两侧山峰都低，但比它南边山谷的谷底高得多。"],challenge:"在地图上找出鞍部的位置并点击它。"},{id:"ridge",name:"山脊",short:"山脊",type:"ridge",accent:"#22c55e",shape:{kind:"capsule",a:[-420,300],b:[-268,-560],radius:165},elevation:{min:200,max:880},slope:{label:"脊线两侧都向下倾斜，两侧坡度相近"},summary:"从山峰 A 向南延伸的狭长高地。",desc:"山脊是从高处向低处延伸的狭长高地，像山体的“脊梁”。",contour:"等高线在经过山脊时，会向海拔较低的方向突出弯曲——也就是“凸向低处”。把各条等高线弯曲最突出的点连起来，就是山脊线。",note:"判断技巧：等高线凸向低处是山脊，凸向高处是山谷。",detail:["在三维地形上沿着脊线走：脚下始终是附近最高的地方，两侧都在下降。","在等高线图上，山脊两侧的等高线像一对手掌，把脊线夹在中间。"],challenge:"找出地图上呈狭长延伸的高地（山脊）并点击它。"},{id:"valley",name:"山谷",short:"山谷",type:"valley",accent:"#38bdf8",shape:{kind:"capsule",a:[70,430],b:[10,-790],radius:175},elevation:{min:20,max:620},slope:{label:"谷坡较陡，谷底相对平缓"},summary:"自鞍部南侧发源、向南延伸的狭长低地。",desc:"山谷是两侧地势较高、中间较低的狭长低地，谷底常有河流。",contour:"等高线在经过山谷时，会向海拔较高的方向突出弯曲，常呈 V 形；V 形的尖端指向高处，也就是河流的上游方向。",note:"河流沿 V 形尖端连线由高处流向低处，所以 V 形尖端总是指向海拔更高的方向。",detail:["在三维地形上，山谷像一个“V”字形的凹槽，谷底还可以看到一条小河。","在等高线图上，V 形弯曲指向高处；弯曲最尖的那些点的连线就是谷底（集水线）。"],challenge:"找出一条两侧高、中间低的狭长山谷并点击它。"},{id:"basin",name:"盆地",short:"盆地",type:"basin",accent:"#f472b6",shape:{kind:"circle",x:ai.basin.x,y:ai.basin.y,radius:250},elevation:{min:20,max:230},slope:{label:"盆地边缘为环形高地，中部平缓"},summary:"西南部四周较高、中间较低的封闭低地。",desc:"盆地是周围地势较高、中部相对较低的封闭低地。",contour:"盆地也表现为闭合的等高线，但与山峰相反：海拔数值由外向内越来越小，中心是最低处。",note:"同样是闭合曲线，数值“里大外小”是山峰，“里小外大”是盆地。",detail:["盆地的核心最低，外围绕着一圈更高的环形高地，因此地形是“封闭”的。","盆地内部等高线稀疏，说明盆地底部比较平缓。"],challenge:"找出地图上的封闭低地（盆地）并点击它。"},{id:"steep",name:"陡坡",short:"陡坡",type:"steep",accent:"#ef4444",shape:{kind:"circle",x:-233,y:40,radius:180},elevation:{min:180,max:660},slope:{label:"等高线密集，坡度大"},summary:"等高线明显密集、坡度很大的区域。",desc:"在相同等高距条件下，等高线越密集，说明同样的水平距离内海拔变化越大，坡就越陡。",contour:"陡坡处等高线密集：相邻两条等高线之间的水平距离很短。",note:"一定要记住前提：只有在等高距相同、比较范围合理时，才能用疏密直接比较坡度。等高线密 ≠ 海拔高。",detail:["这里是山谷西侧的谷坡，等高线挤在一起。","用「测量」工具在坡上取两点，坡度百分比会明显大于缓坡。"],challenge:"找出全图等高线最密集、坡度最陡的区域。"},{id:"gentle",name:"缓坡",short:"缓坡",type:"gentle",accent:"#14b8a6",shape:{kind:"circle",x:800,y:-620,radius:225},elevation:{min:90,max:190},slope:{label:"等高线稀疏，坡度小"},summary:"等高线稀疏、地势平缓的南部平原。",desc:"在相同等高距条件下，等高线稀疏，说明同样的水平距离内海拔变化小，坡就缓。",contour:"缓坡处等高线稀疏：相邻两条等高线之间的水平距离很长。",note:"“陡”和“缓”是相对的。比较时请使用同一幅图、同一等高距。",detail:["这里是地图南部的缓坡平原，走很远海拔才升高一点。","把等高距从 50m 改成 100m，等高线会更稀疏，但地形本身没有变化。"],challenge:"找出全图等高线最稀疏、坡度最缓的区域。"},{id:"river",name:"小河",short:"河流",type:"river",accent:"#2f86c9",shape:{kind:"capsule",a:kn[0],b:kn[kn.length-1],radius:90},elevation:{min:20,max:380},slope:{label:"沿谷底流动，落差平缓"},summary:"沿山谷谷底由北向南流动的小河（辅助元素）。",desc:"河流总是沿山谷谷底由高处流向低处，是判断地势高低方向的重要线索。",contour:"河流所在的位置就是山谷的谷底，等高线的 V 形尖端指向河流的上游。",note:"河流是辅助显示元素，它不会改变地形高度数据。",detail:["顺着河流看：它总是从等高线数值大的地方流向数值小的地方。"],challenge:"沿着河流判断：这条河流向哪个方向流？"}],Gm=new Map(Sn.map(i=>[i.id,i]));function On(i){return Gm.get(i)||null}function Vm(i,t,e,n,s,r){const o=s-e,a=r-n,l=o*o+a*a;if(l<1e-9)return Math.hypot(i-e,t-n);let c=((i-e)*o+(t-n)*a)/l;return c=c<0?0:c>1?1:c,Math.hypot(i-(e+c*o),t-(n+c*a))}function Bn(i,t,e){const n=i.shape;return n.kind==="circle"?Math.hypot(t-n.x,e-n.y)<=n.radius:n.kind==="capsule"?Vm(t,e,n.a[0],n.a[1],n.b[0],n.b[1])<=n.radius:!1}function Wm(i){const t=i.shape;return t.kind==="circle"?{x:t.x,y:t.y}:{x:(t.a[0]+t.b[0])/2,y:(t.a[1]+t.b[1])/2}}function Vl(i,t){return Sn.filter(e=>Bn(e,i,t))}const Xm=[{id:"peak",label:"山峰",featureIds:["peakA","peakB"]},{id:"ridge",label:"山脊",featureIds:["ridge"]},{id:"valley",label:"山谷",featureIds:["valley"]},{id:"saddle",label:"鞍部",featureIds:["saddle"]},{id:"basin",label:"盆地",featureIds:["basin"]},{id:"steep",label:"陡坡",featureIds:["steep"]},{id:"gentle",label:"缓坡",featureIds:["gentle"]},{id:"river",label:"河流",featureIds:["river"]}];function $m(i,t,e){return i?Bn(i,t,e):!1}function Ym(i,t,e=15){if(!i)return null;const n=Wm(i);let s=1/0,r=-1/0,o=0,a=0;const l=i.shape,c=[];if(l.kind==="circle"){c.push({x:l.x,y:l.y});for(let d=0;d<e;d+=1){const h=d/e*Math.PI*2;for(const f of[l.radius*.5,l.radius*.92])c.push({x:l.x+Math.cos(h)*f,y:l.y+Math.sin(h)*f})}}else{for(let d=0;d<=e;d+=1){const h=d/e;c.push({x:l.a[0]+(l.b[0]-l.a[0])*h,y:l.a[1]+(l.b[1]-l.a[1])*h})}for(let d=0;d<=e;d+=1){const h=d/e,f=l.a[0]+(l.b[0]-l.a[0])*h,m=l.a[1]+(l.b[1]-l.a[1])*h,g=l.b[0]-l.a[0],v=l.b[1]-l.a[1],p=Math.hypot(g,v)||1,u=-v/p,S=g/p;c.push({x:f+u*l.radius*.85,y:m+S*l.radius*.85}),c.push({x:f-u*l.radius*.85,y:m-S*l.radius*.85})}}for(const d of c){const h=t.getHeightAt(d.x,d.y);h<s&&(s=h),h>r&&(r=h),o+=t.getSlopeAt(d.x,d.y),a+=1}return{center:n,centerElevation:t.getHeightAt(n.x,n.y),minElevation:s,maxElevation:r,avgSlopePercent:a?o/a:0,sampleCount:a}}class qm{constructor(t){this.host=t,this.container=document.createElement("div"),this.container.className="marker-overlay",this.container.setAttribute("aria-hidden","true"),t.appendChild(this.container),this.labels=new Map,this.visible=!0}ensure(t,e){let n=this.labels.get(t);return n||(n=document.createElement("div"),n.className=`marker-label ${e}`,this.container.appendChild(n),this.labels.set(t,n)),n}set(t,e){const n=this.ensure(t,e.className||"");return n.textContent=e.text||"",n.style.display=e.visible&&this.visible?"block":"none",e.color&&n.style.setProperty("--marker-color",e.color),n}place(t,e,n={}){const s=this.labels.get(t);if(!s)return;if(!e||!e.visible){s.style.display="none";return}s.style.display=this.visible?"block":"none";const r=n.offsetX??0,o=n.offsetY??-18;s.style.transform=`translate(-50%, -50%) translate(${e.x+r}px, ${e.y+o}px)`}setVisible(t){this.visible=t,t||this.labels.forEach(e=>{e.style.display="none"})}clear(){this.labels.forEach(t=>{t.style.display="none"})}dispose(){this.container.remove(),this.labels.clear()}}const jm=Sn,_s={default:{position:[0,1750,2350],target:[0,120,0]},top:{position:[0,2900,60],target:[0,60,0]},north:{position:[0,1250,2600],target:[0,140,0]},west:{position:[-2700,1150,400],target:[0,140,0]},iso:{position:[2100,1500,1900],target:[0,120,0]}};class Km{constructor(t,e,n,s){this.host=t,this.canvas=e,this.model=n,this.coords=s,this.verticalExaggeration=1,this.showContours=!0,this.contourResult=null,this.profile=null,this.selection=null,this.pointA=null,this.pointB=null,this.hover=null,this.feature=null,this.raycaster=new Tm,this.pointer=new Rt,this.clock=new bm,this._dirty=!0,this._raf=0,this._disposed=!1,this.onPick=null,this.onHover=null,this._initScene(),this._buildTerrain(),this._buildHelpers(),this.applyVerticalExaggeration(this.verticalExaggeration),this._bindEvents(),this._startLoop()}_initScene(){this.scene=new xm,this.scene.background=null;const t=this._aspect();this.camera=new Ne(42,t,5,4e4),this.camera.position.set(..._s.default.position),this.renderer=new vm({canvas:this.canvas,antialias:!0,alpha:!0,powerPreference:"high-performance"}),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),this.renderer.setClearColor(0,0),"outputColorSpace"in this.renderer&&(this.renderer.outputColorSpace=Ge),this.controls=new Rm(this.camera,this.canvas),this.controls.enableDamping=!0,this.controls.dampingFactor=.075,this.controls.rotateSpeed=.75,this.controls.zoomSpeed=.9,this.controls.panSpeed=.8,this.controls.minDistance=500,this.controls.maxDistance=9e3,this.controls.maxPolarAngle=Math.PI*.495,this.controls.minPolarAngle=.08,this.controls.target.set(..._s.default.target);const e=new Mm(12376319,1778742,1.05);this.scene.add(e);const n=new wr(16777215,1.35);n.position.set(900,1800,1200),this.scene.add(n);const s=new wr(9418495,.45);s.position.set(-1200,700,-900),this.scene.add(s);const r=new wr(16767392,.35);r.position.set(400,500,-1500),this.scene.add(r),this.controls.update()}_aspect(){const t=this.host.getBoundingClientRect();return Math.max(.2,t.width/Math.max(1,t.height))}_buildTerrain(){const t=this.model,{cols:e,rows:n}=t,s=e*n,r=new Float32Array(s*3),o=new Float32Array(s*3),a=new Uint32Array((e-1)*(n-1)*6),l=0,c=1e3;for(let h=0;h<n;h+=1)for(let f=0;f<e;f+=1){const m=h*e+f,g=t.gridToWorldFloat(f,h),v=t.getGridHeight(h,f);r[m*3+0]=g.x,r[m*3+1]=v,r[m*3+2]=-g.y;const p=Fi(v,l,c);o[m*3+0]=p.r/255,o[m*3+1]=p.g/255,o[m*3+2]=p.b/255}let d=0;for(let h=0;h<n-1;h+=1)for(let f=0;f<e-1;f+=1){const m=h*e+f,g=m+1,v=m+e,p=v+1;a[d++]=m,a[d++]=v,a[d++]=g,a[d++]=g,a[d++]=v,a[d++]=p}this.geometry=new fe,this.geometry.setAttribute("position",new ve(r,3)),this.geometry.setAttribute("color",new ve(o.slice(),3)),this.geometry.setIndex(new ve(a,1)),this.geometry.computeVertexNormals(),this.baseColors=o,this.positionsArray=r,this.terrainMaterial=new $a({vertexColors:!0,roughness:.94,metalness:.03,flatShading:!1,polygonOffset:!0,polygonOffsetFactor:1.5,polygonOffsetUnits:3}),this.terrainMesh=new $e(this.geometry,this.terrainMaterial),this.terrainMesh.name="terrain",this.scene.add(this.terrainMesh),this.contourGroup=new Fn,this.contourGroup.name="contours",this.scene.add(this.contourGroup),this.markerGroup=new Fn,this.markerGroup.name="markers",this.scene.add(this.markerGroup),this.labelOverlay=new qm(this.host),this.labelOverlay.container.classList.add("marker-overlay-3d")}_buildHelpers(){const t=new Am(2e3,10,2837103,1913936);t.position.set(0,-2,0),t.material.transparent=!0,t.material.opacity=.35,this.gridHelper=t,this.scene.add(t);const e=new fe().setFromPoints([new U(-1e3,0,800),new U(1e3,0,800),new U(1e3,0,-800),new U(-1e3,0,-800),new U(-1e3,0,800)]),n=new ci(e,new gn({color:4026270,transparent:!0,opacity:.5}));n.position.y=-1,this.border=n,this.scene.add(n),this.markerGeometry=new Oo(1,20,14);const s=new fe().setFromPoints([new U(0,0,0),new U(0,1,0)]);this.markers={};const r=(o,a,l)=>{const c=new Fn,d=new $e(this.markerGeometry,new $a({color:a,emissive:a,emissiveIntensity:.5,roughness:.35}));d.scale.setScalar(l),c.add(d);const h=new ci(s,new gn({color:a,transparent:!0,opacity:.7}));return c.add(h),c.visible=!1,c.userData={sphere:d,stem:h,radius:l,color:a},this.markerGroup.add(c),this.markers[o]=c,c};r("a",new Pt(kt.pointA).getHex(),26),r("b",new Pt(kt.pointB).getHex(),26),r("selection",new Pt(kt.selection).getHex(),22),r("hover",new Pt(kt.hover).getHex(),13),this.profileLine=new ci(new fe,new gn({color:new Pt(kt.profileLine).getHex(),transparent:!0,opacity:.95})),this.profileLine.visible=!1,this.scene.add(this.profileLine),this.highlightLine=new ci(new fe,new gn({color:new Pt(kt.contourHighlight).getHex(),transparent:!0,opacity:1})),this.highlightLine.visible=!1,this.scene.add(this.highlightLine)}applyVerticalExaggeration(t){const e=this.verticalExaggeration;this.verticalExaggeration=t;const n=this.geometry.getAttribute("position"),s=n.array,r=this.model.getHeightGrid();for(let o=0;o<r.length;o+=1)s[o*3+1]=r[o]*t;if(n.needsUpdate=!0,this.geometry.computeVertexNormals(),this.geometry.computeBoundingSphere(),this._updateContourLines(!0),this._updateProfileLine(),this._updateMarkers(),e!==t&&this.camera&&this.controls){const o=this.camera.position.clone().sub(this.controls.target),l=(o.length()||1)*(1+.38*(t-e));o.setLength(Math.min(Math.max(l,this.controls.minDistance),this.controls.maxDistance)),this.camera.position.copy(this.controls.target).add(o),this.controls.update()}this._dirty=!0}setVerticalExaggeration(t){this.applyVerticalExaggeration(t)}setContourResult(t){this.contourResult=t,this._updateContourLines(!0)}setShowContours(t){this.showContours=t,this.contourGroup.visible=t,this._dirty=!0}_updateContourLines(t){if(!t)return;for(;this.contourGroup.children.length;){const r=this.contourGroup.children.pop();r.geometry.dispose(),r.material.dispose()}if(!this.contourResult){this._dirty=!0;return}const e=new gn({color:1708296,transparent:!0,opacity:.85}),n=new gn({color:3877402,transparent:!0,opacity:.42}),s=2;for(const r of this.contourResult.lines){const o=r.points,a=new Float32Array(o.length*3),l=r.level*this.verticalExaggeration+s;for(let h=0;h<o.length;h+=1)a[h*3+0]=o[h].x,a[h*3+1]=l,a[h*3+2]=-o[h].y;const c=new fe;c.setAttribute("position",new ve(a,3));const d=new ci(c,r.major?e:n);d.frustumCulled=!1,this.contourGroup.add(d)}this.contourGroup.visible=this.showContours,this._dirty=!0}setHighlightedContour(t){if(!t){this.highlightLine.visible=!1,this._dirty=!0;return}const e=t.points,n=new Float32Array(e.length*3),s=t.level*this.verticalExaggeration+4;for(let o=0;o<e.length;o+=1)n[o*3+0]=e[o].x,n[o*3+1]=s,n[o*3+2]=-e[o].y;this.highlightLine.geometry.dispose();const r=new fe;r.setAttribute("position",new ve(n,3)),this.highlightLine.geometry=r,this.highlightLine.visible=!0,this._dirty=!0}_placeMarker(t,e,n={}){const s=this.markers[t];if(!s)return;if(!e){s.visible=!1;return}const o=this.model.getHeightAt(e.x,e.y)*this.verticalExaggeration,a=n.stemHeight??90;s.position.set(e.x,o+a,-e.y),s.userData.stem.scale.set(1,a,1),s.visible=!0}_updateMarkers(){this._placeMarker("a",this.pointA,{stemHeight:95}),this._placeMarker("b",this.pointB,{stemHeight:95}),this._placeMarker("selection",this.selection,{stemHeight:0}),this._placeMarker("hover",this.hover,{stemHeight:0}),this._dirty=!0}projectPoint(t,e,n=0){if(!this.camera)return null;const s=this.model.getHeightAt(t,e)*this.verticalExaggeration+n,r=new U(t,s,-e);r.project(this.camera);const o=this.canvas.getBoundingClientRect();return!o.width||!o.height?null:{x:(r.x*.5+.5)*o.width,y:(-r.y*.5+.5)*o.height,visible:r.z>-1&&r.z<1}}_updateLabels(){const t=this.labelOverlay;if(!t)return;const e=(n,s,r,o,a,l,c)=>{if(!s){t.set(n,{text:"",visible:!1});return}const d=this.model.getHeightAt(s.x,s.y),h=this.projectPoint(s.x,s.y,l);t.set(n,{text:r?`${r} · ${Math.round(d)} m`:`${Math.round(d)} m`,className:o,visible:!0,color:a}),t.place(n,h,{offsetY:c})};e("a",this.pointA,"A","marker-label-a",kt.pointA,100,-20),e("b",this.pointB,"B","marker-label-b",kt.pointB,100,-20),e("hover",this.hover?this.hover:null,"","marker-label-hover",kt.hover,12,-16)}setPointA(t){this.pointA=t,this._updateMarkers()}setPointB(t){this.pointB=t,this._updateMarkers()}setSelection(t){this.selection=t,this._updateMarkers()}setHover(t){this.hover=t,this._updateMarkers()}setProfile(t){this.profile=t,this._updateProfileLine()}_updateProfileLine(){if(!this.profile||!this.profile.samples||this.profile.samples.length<2){this.profileLine.visible=!1,this._dirty=!0;return}const t=this.profile.samples,e=new Float32Array(t.length*3),n=2.5;for(let r=0;r<t.length;r+=1){const o=t[r];e[r*3+0]=o.x,e[r*3+1]=o.elevation*this.verticalExaggeration+n,e[r*3+2]=-o.y}this.profileLine.geometry.dispose();const s=new fe;s.setAttribute("position",new ve(e,3)),this.profileLine.geometry=s,this.profileLine.visible=!0,this._dirty=!0}setFeature(t,e=!1){this.feature=t,this.showAllFeatures=e;const n=this.geometry.getAttribute("color"),s=n.array,r=this.baseColors,{cols:o,rows:a}=this.model;s.set(r);const l=e?jm:t?[t]:[];if(l.length){const c=l.map(d=>new Pt(d.accent||kt.selection));for(let d=0;d<a;d+=1)for(let h=0;h<o;h+=1){const f=d*o+h,m=this.model.gridToWorldFloat(h,d);for(let g=0;g<l.length;g+=1){if(!$m(l[g],m.x,m.y))continue;const v=c[g],p=e?.5:.65;s[f*3+0]=s[f*3+0]*(1-p)+v.r*p,s[f*3+1]=s[f*3+1]*(1-p)+v.g*p,s[f*3+2]=s[f*3+2]*(1-p)+v.b*p;break}}}n.needsUpdate=!0,this._dirty=!0}setViewPreset(t){const e=_s[t]||_s.default;this.camera.position.set(...e.position),this.controls.target.set(...e.target),this.controls.update(),this._dirty=!0}resetView(){this.setViewPreset("default")}_bindEvents(){this._onPointerDown=t=>{this._downX=t.clientX,this._downY=t.clientY,this._downTime=performance.now()},this._onPointerUp=t=>{if(this._downX===void 0||Math.hypot(t.clientX-this._downX,t.clientY-this._downY)>5)return;const n=this.pickAt(t.clientX,t.clientY);n&&typeof this.onPick=="function"&&this.onPick(n)},this._onPointerMove=t=>{if(!this.onHover)return;const e=performance.now();if(this._lastHover&&e-this._lastHover<40)return;this._lastHover=e;const n=this.pickAt(t.clientX,t.clientY);this.onHover(n)},this._onLeave=()=>{this.onHover&&this.onHover(null)},this.canvas.addEventListener("pointerdown",this._onPointerDown),this.canvas.addEventListener("pointerup",this._onPointerUp),this.canvas.addEventListener("pointermove",this._onPointerMove),this.canvas.addEventListener("pointerleave",this._onLeave),this._resizeObserver=new ResizeObserver(()=>this.resize()),this._resizeObserver.observe(this.host),this.resize()}pickAt(t,e){const n=this.canvas.getBoundingClientRect();if(n.width===0||n.height===0)return null;this.pointer.x=(t-n.left)/n.width*2-1,this.pointer.y=-((e-n.top)/n.height)*2+1,this.raycaster.setFromCamera(this.pointer,this.camera);const s=this.raycaster.intersectObject(this.terrainMesh,!1);if(!s.length)return null;const r=s[0].point,o={x:r.x,y:-r.z};return this.coords.contains(o.x,o.y)?{x:o.x,y:o.y,elevation:this.model.getHeightAt(o.x,o.y)}:null}resize(){const t=this.host.getBoundingClientRect(),e=Math.max(1,Math.floor(t.width)),n=Math.max(1,Math.floor(t.height));this.cssWidth=t.width,this.cssHeight=t.height,this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),this.renderer.setSize(e,n,!1),this.camera.aspect=e/n,this.camera.updateProjectionMatrix(),this._dirty=!0}syncSizeWithHost(){const t=this.host.getBoundingClientRect();return t.width<1||t.height<1?!1:Math.abs(t.width-this.cssWidth)>.5||Math.abs(t.height-this.cssHeight)>.5?(this.resize(),!0):!1}_startLoop(){const t=()=>{if(this._disposed)return;this._raf=requestAnimationFrame(t);const e=this.syncSizeWithHost();(this.controls.update()||e||this._dirty)&&(this.renderer.render(this.scene,this.camera),this._updateLabels(),this._dirty=!1)};this._raf=requestAnimationFrame(t)}dispose(){this._disposed=!0,cancelAnimationFrame(this._raf),this.labelOverlay&&this.labelOverlay.dispose(),this._resizeObserver&&this._resizeObserver.disconnect(),this.canvas.removeEventListener("pointerdown",this._onPointerDown),this.canvas.removeEventListener("pointerup",this._onPointerUp),this.canvas.removeEventListener("pointermove",this._onPointerMove),this.canvas.removeEventListener("pointerleave",this._onLeave),this.controls.dispose(),this.renderer.dispose()}}function Zm(i,t,e={}){const{scale:n=1,spacing:s=250,minGap:r=10,fontSize:o=11,maxLabels:a=80,margin:l=26}=e,c=(i?.lines??[]).slice().sort((m,g)=>(g.major?1:0)-(m.major?1:0)||g.length-m.length),d=[],h=[],f=(m,g,v,p)=>{for(const u of d)if(Math.abs(u.px-m)<(u.w+v)/2+r&&Math.abs(u.py-g)<(u.h+p)/2+r)return!0;return!1};for(const m of c){if(h.length>=a)break;const g=`${Math.round(m.level)}m`,v=m.major?s:s*1.8;if(!m.major&&m.length*n<320)continue;const p=m.points,u=p.length;if(u<3)continue;const S=new Array(u).fill(0);for(let P=1;P<u;P+=1)S[P]=S[P-1]+Math.hypot(p[P].x-p[P-1].x,p[P].y-p[P-1].y);const M=S[u-1]+(m.closed?Math.hypot(p[0].x-p[u-1].x,p[0].y-p[u-1].y):0);if(M*n<90)continue;const x=v/n,C=Math.max(1,Math.floor(M/x)),A=g.length*o*.66+12,T=o+8;for(let P=0;P<C;P+=1){const V=x*(P+.5);if(V>M)break;let _=1;for(;_<u&&S[_]<V;)_+=1;const b=Math.min(_,u-1),k=Math.max(0,b-1),B=S[b]-S[k]||1,W=(V-S[k])/B,K=p[k].x+(p[b].x-p[k].x)*W,G=p[k].y+(p[b].y-p[k].y)*W,j=p[Math.max(0,b-2)],z=p[Math.min(u-1,b+2)],it=z.x-j.x,at=z.y-j.y;if(Math.hypot(it,at)<1e-6)continue;const st=t(K,G);let It=Math.atan2(-at,it);It>Math.PI/2&&(It-=Math.PI),It<-Math.PI/2&&(It+=Math.PI),!(st.px<l||st.py<l||!Number.isFinite(st.px)||!Number.isFinite(st.py))&&(f(st.px,st.py,A,T)||(d.push({px:st.px,py:st.py,w:A,h:T}),h.push({px:st.px,py:st.py,angle:It,text:g,level:m.level,major:m.major})))}}return h}const vs={left:54,right:44,top:28,bottom:50};class Jm{constructor(t,e,n,s){this.host=t,this.canvas=e,this.model=n,this.coords=s,this.ctx=e.getContext("2d"),this.contourResult=null,this.interval=50,this.display={fill:!0,grid:!1,labels:!0,river:!0,featureMarkers:!1},this.selection=null,this.pointA=null,this.pointB=null,this.hover=null,this.profile=null,this.profileCursor=null,this.highlightedLine=null,this.feature=null,this.showAllFeatures=!1,this.uiScale=1,this.cssWidth=1,this.cssHeight=1,this._fillCanvas=null,this._labels=[],this._dirty=!0,this._raf=0,this.resize(),this._observe(),this._loop()}setContourResult(t,e){this.contourResult=t,e&&(this.interval=e),this._labels=[],this._dirty=!0}setDisplay(t){Object.assign(this.display,t),this._dirty=!0}setSelection(t){this.selection=t,this._dirty=!0}setPointA(t){this.pointA=t,this._dirty=!0}setPointB(t){this.pointB=t,this._dirty=!0}setHover(t){this.hover=t,this._dirty=!0}setProfile(t){this.profile=t,this._dirty=!0}setProfileCursor(t){this.profileCursor=t,this._dirty=!0}setHighlightedLine(t){this.highlightedLine=t,this._dirty=!0}setFeature(t,e=!1){this.feature=t,this.showAllFeatures=!!e,this._dirty=!0}_observe(){this._ro=new ResizeObserver(()=>this.resize()),this._ro.observe(this.host)}padding(){const t=this.uiScale,e=Math.min(this.cssWidth/720,this.cssHeight/520),n=Math.max(.55,Math.min(1,e));return{left:vs.left*t*n,right:vs.right*t*n,top:vs.top*t*n,bottom:vs.bottom*t*n}}get isCompactMap(){return this.coords.viewport.width<520*this.uiScale}resize(){const t=this.host.getBoundingClientRect();this.cssWidth=Math.max(1,t.width),this.cssHeight=Math.max(1,t.height),this.dpr=Math.min(window.devicePixelRatio||1,2),this.canvas.width=Math.round(this.cssWidth*this.dpr),this.canvas.height=Math.round(this.cssHeight*this.dpr),this.canvas.style.width=`${this.cssWidth}px`,this.canvas.style.height=`${this.cssHeight}px`,this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0),this.coords.fitViewport(this.cssWidth,this.cssHeight,this.padding()),this._fillCanvas=null,this._labels=[],this._dirty=!0}clientToWorld(t,e){const n=this.canvas.getBoundingClientRect(),s=t-n.left,r=e-n.top;return this.coords.pixelToWorld(s,r)}isInsideMap(t,e){const n=this.canvas.getBoundingClientRect(),s=t-n.left,r=e-n.top,o=this.coords.viewport;return s>=o.x&&s<=o.x+o.width&&r>=o.y&&r<=o.y+o.height}hitTestContour(t,e=45){return fc(this.contourResult,t.x,t.y,e)}_loop(){const t=()=>{this._raf=requestAnimationFrame(t),this.syncSizeWithHost(),this._dirty&&(this.render(),this._dirty=!1)};this._raf=requestAnimationFrame(t)}syncSizeWithHost(){const t=this.host.getBoundingClientRect();return t.width<1||t.height<1?!1:Math.abs(t.width-this.cssWidth)>.5||Math.abs(t.height-this.cssHeight)>.5?(this.resize(),!0):!1}render(){const t=this.ctx,e=this.cssWidth,n=this.cssHeight;this.uiScale;const s=this.coords.viewport;t.clearRect(0,0,e,n),t.fillStyle="#0d1524",t.fillRect(0,0,e,n),t.save(),t.shadowColor="rgba(0,0,0,0.45)",t.shadowBlur=18,t.fillStyle=kt.paper,t.fillRect(s.x,s.y,s.width,s.height),t.restore(),t.save(),t.beginPath(),t.rect(s.x,s.y,s.width,s.height),t.clip(),this.display.fill&&this._drawElevationFill(),this.display.grid&&this._drawGrid(),this._drawContours(),this.display.river&&this._drawRiver(),this._drawFeature(),this._drawProfileLine(),this.display.labels&&this._drawLabels(),t.restore(),this._drawFrame(),this._drawGraticuleLabels(),this._drawNorthArrow(),this._drawScaleBar(),this._drawLegendBox(),this._drawMarkers()}_drawElevationFill(){const{cols:t,rows:e}=this.model;if(!this._fillCanvas||this._fillCanvas.width!==t||this._fillCanvas.height!==e){const r=document.createElement("canvas");r.width=t,r.height=e;const o=r.getContext("2d"),a=o.createImageData(t,e),l=this.model.getHeightGrid();for(let c=0;c<t*e;c+=1){const d=Fi(l[c],0,1e3);a.data[c*4+0]=d.r,a.data[c*4+1]=d.g,a.data[c*4+2]=d.b,a.data[c*4+3]=255}o.putImageData(a,0,0),this._fillCanvas=r}const n=this.ctx,s=this.coords.viewport;n.save(),n.globalAlpha=.5,n.imageSmoothingEnabled=!0,n.drawImage(this._fillCanvas,s.x,s.y,s.width,s.height),n.restore(),n.save(),n.globalAlpha=.28,n.fillStyle="#ffffff",n.fillRect(s.x,s.y,s.width,s.height),n.restore()}_drawGrid(){const t=this.ctx,{minX:e,maxX:n,minY:s,maxY:r}=Yt;t.save(),t.strokeStyle=kt.grid,t.lineWidth=.8,t.setLineDash([2,3]),t.beginPath();for(let o=Math.ceil(e/200)*200;o<=n;o+=200){const a=this.coords.worldToPixel(o,s),l=this.coords.worldToPixel(o,r);t.moveTo(a.px,a.py),t.lineTo(l.px,l.py)}for(let o=Math.ceil(s/200)*200;o<=r;o+=200){const a=this.coords.worldToPixel(e,o),l=this.coords.worldToPixel(n,o);t.moveTo(a.px,a.py),t.lineTo(l.px,l.py)}t.stroke(),t.restore()}_drawContours(){const t=this.contourResult;if(!t)return;const e=this.ctx,n=this.uiScale;e.save(),e.lineJoin="round",e.lineCap="round";for(const s of[!1,!0])for(const r of t.lines)r.major===s&&this.highlightedLine!==r&&(this._strokePolyline(r),e.strokeStyle=r.major?kt.contourMajor:kt.contour,e.lineWidth=(r.major?1.75:.85)*n,e.globalAlpha=r.major?.95:.72,e.stroke());if(this.highlightedLine){const s=this.highlightedLine;this._strokePolyline(s),e.globalAlpha=1,e.strokeStyle=kt.contourHighlight,e.lineWidth=3.4*n,e.stroke(),this._strokePolyline(s),e.strokeStyle="#fff7ed",e.lineWidth=1.2*n,e.stroke()}e.globalAlpha=1,e.restore()}_strokePolyline(t){const e=this.ctx,n=t.points;e.beginPath();const s=this.coords.worldToPixel(n[0].x,n[0].y);e.moveTo(s.px,s.py);for(let r=1;r<n.length;r+=1){const o=this.coords.worldToPixel(n[r].x,n[r].y);e.lineTo(o.px,o.py)}t.closed&&e.closePath()}_drawLabels(){const t=this.ctx,e=this.uiScale;(this._labels.length===0||this._labelsForInterval!==this.interval||this._labelsScale!==this.coords.scale)&&(this._labels=Zm(this.contourResult,(s,r)=>this.coords.worldToPixel(s,r),{scale:this.coords.scale,spacing:300*e,minGap:13*e,fontSize:11*e,maxLabels:72,margin:24*e}),this._labelsForInterval=this.interval,this._labelsScale=this.coords.scale),t.save(),t.textAlign="center",t.textBaseline="middle";for(const s of this._labels){const r=(s.major?12.5:10.5)*e;t.save(),t.translate(s.px,s.py),t.rotate(s.angle);const o=s.text;t.font=`${s.major?700:500} ${r}px ui-monospace, SFMono-Regular, Menlo, monospace`;const a=t.measureText(o),l=3.5*e;t.fillStyle="rgba(244, 239, 227, 0.92)",t.fillRect(-a.width/2-l,-r*.72,a.width+l*2,r*1.44),t.fillStyle=s.major?"#1c130a":"#4a3a29",t.fillText(o,0,0),t.restore()}t.restore()}_drawRiver(){const t=this.ctx,e=this.uiScale;t.save(),t.lineJoin="round",t.lineCap="round",t.beginPath(),kn.forEach((n,s)=>{const r=this.coords.worldToPixel(n[0],n[1]);s===0?t.moveTo(r.px,r.py):t.lineTo(r.px,r.py)}),t.strokeStyle="rgba(47, 134, 201, 0.25)",t.lineWidth=6*e,t.stroke(),t.strokeStyle=kt.water,t.lineWidth=2.6*e,t.stroke(),t.restore()}_drawFeature(){const t=this.showAllFeatures?Sn:this.feature?[this.feature]:[];if(!t.length)return;const e=this.showAllFeatures;for(const n of t)this._drawOneFeature(n,e)}_drawOneFeature(t,e){const n=this.ctx,s=this.uiScale,r=t.accent||kt.selection;if(n.save(),n.beginPath(),t.shape.kind==="circle"){const h=this.coords.worldToPixel(t.shape.x,t.shape.y);n.arc(h.px,h.py,this.coords.metersToPixel(t.shape.radius),0,Math.PI*2)}else{const h=this.coords.worldToPixel(t.shape.a[0],t.shape.a[1]),f=this.coords.worldToPixel(t.shape.b[0],t.shape.b[1]);n.lineCap="round",n.lineWidth=this.coords.metersToPixel(t.shape.radius*2),n.moveTo(h.px,h.py),n.lineTo(f.px,f.py)}n.fillStyle=xs(r,e?.12:.18),n.strokeStyle=xs(r,.9),t.shape.kind==="capsule"?(n.stroke(),n.lineWidth=1.6*s,n.setLineDash([7*s,5*s]),n.strokeStyle=xs(r,.95)):(n.fill(),n.lineWidth=e?1.6*s:2.2*s,n.setLineDash([7*s,5*s])),n.stroke(),n.setLineDash([]);const o=t.shape.kind==="circle"?{x:t.shape.x,y:t.shape.y}:{x:(t.shape.a[0]+t.shape.b[0])/2,y:(t.shape.a[1]+t.shape.b[1])/2},a=this.coords.worldToPixel(o.x,o.y),l=(e?11:12.5)*s;n.font=`700 ${l}px system-ui, -apple-system, "PingFang SC", sans-serif`,n.textAlign="center",n.textBaseline="middle";const c=n.measureText(t.name).width+14*s,d=e?18*s:22*s;n.fillStyle=xs(r,e?.8:.92),Rr(n,a.px-c/2,a.py-d/2,c,d,d/2),n.fill(),n.fillStyle="#08131f",n.fillText(t.name,a.px,a.py+.5),n.restore()}_drawProfileLine(){if(!this.pointA||!this.pointB)return;const t=this.ctx,e=this.uiScale,n=this.coords.worldToPixel(this.pointA.x,this.pointA.y),s=this.coords.worldToPixel(this.pointB.x,this.pointB.y);if(t.save(),t.lineCap="round",t.beginPath(),t.moveTo(n.px,n.py),t.lineTo(s.px,s.py),t.strokeStyle="rgba(255,255,255,0.85)",t.lineWidth=5.5*e,t.stroke(),t.strokeStyle=kt.profileLine,t.lineWidth=2.4*e,t.setLineDash([10*e,6*e]),t.stroke(),t.setLineDash([]),this.profile&&this.profile.samples){const r=Math.max(1,Math.floor(this.profile.samples.length/26));t.fillStyle="rgba(56, 189, 248, 0.75)";for(let o=0;o<this.profile.samples.length;o+=r){const a=this.profile.samples[o],l=this.coords.worldToPixel(a.x,a.y);t.beginPath(),t.arc(l.px,l.py,1.6*e,0,Math.PI*2),t.fill()}}t.restore()}_drawMarkers(){const t=this.ctx,e=this.uiScale,n=(s,r,o,a)=>{if(!s)return;const l=this.coords.worldToPixel(s.x,s.y);t.save(),t.beginPath(),t.arc(l.px,l.py,a*e,0,Math.PI*2),t.fillStyle=r,t.fill(),t.lineWidth=2.6*e,t.strokeStyle="#ffffff",t.stroke(),o&&(t.font=`800 ${11*e}px system-ui, -apple-system, sans-serif`,t.textAlign="center",t.textBaseline="middle",t.fillStyle="#0b1220",t.fillText(o,l.px,l.py+.5)),t.restore()};if(this.profileCursor){const s=this.coords.worldToPixel(this.profileCursor.x,this.profileCursor.y);t.save(),t.beginPath(),t.arc(s.px,s.py,9*e,0,Math.PI*2),t.strokeStyle=kt.profileLine,t.lineWidth=2.4*e,t.stroke(),t.beginPath(),t.arc(s.px,s.py,3.4*e,0,Math.PI*2),t.fillStyle=kt.profileLine,t.fill(),t.restore()}if(n(this.selection,kt.selection,"",7),n(this.pointA,kt.pointA,"A",11),n(this.pointB,kt.pointB,"B",11),this.hover){const s=this.coords.worldToPixel(this.hover.x,this.hover.y);t.save(),t.strokeStyle=kt.hover,t.lineWidth=1.6*e,t.beginPath(),t.moveTo(s.px-11*e,s.py),t.lineTo(s.px-3*e,s.py),t.moveTo(s.px+3*e,s.py),t.lineTo(s.px+11*e,s.py),t.moveTo(s.px,s.py-11*e),t.lineTo(s.px,s.py-3*e),t.moveTo(s.px,s.py+3*e),t.lineTo(s.px,s.py+11*e),t.stroke(),t.restore()}}_drawFrame(){const t=this.ctx,e=this.coords.viewport,n=this.uiScale;t.save(),t.strokeStyle="rgba(20, 14, 8, 0.45)",t.lineWidth=1.4*n,t.strokeRect(e.x,e.y,e.width,e.height),t.strokeStyle="rgba(20, 14, 8, 0.18)",t.lineWidth=1*n,t.strokeRect(e.x+4*n,e.y+4*n,e.width-8*n,e.height-8*n),t.restore()}_drawGraticuleLabels(){const t=this.ctx,e=this.coords.viewport,n=this.uiScale,{minX:s,maxX:r,minY:o,maxY:a}=Yt;t.save(),t.fillStyle="rgba(180, 200, 225, 0.75)",t.font=`${10*n}px ui-monospace, SFMono-Regular, Menlo, monospace`,t.textBaseline="top",t.textAlign="center";for(let l=Math.ceil(s/400)*400;l<=r;l+=400){const c=this.coords.worldToPixel(l,o);t.fillText(`${l}`,c.px,e.y+e.height+7*n)}t.textAlign="right",t.textBaseline="middle";for(let l=Math.ceil(o/400)*400;l<=a;l+=400){const c=this.coords.worldToPixel(s,l);t.fillText(`${l}`,e.x-8*n,c.py)}t.textAlign="center",t.fillStyle="rgba(180, 200, 225, 0.5)",t.fillText("东西坐标 x (m)",e.x+e.width/2,e.y+e.height+20*n),t.restore()}_drawNorthArrow(){const t=this.ctx,e=this.coords.viewport,n=this.uiScale,s=e.x+e.width-34*n,r=e.y+40*n,o=20*n;t.save(),t.beginPath(),t.arc(s,r,o+6*n,0,Math.PI*2),t.fillStyle="rgba(244, 239, 227, 0.86)",t.fill(),t.strokeStyle="rgba(20, 14, 8, 0.32)",t.lineWidth=1.2*n,t.stroke(),t.beginPath(),t.moveTo(s,r-o),t.lineTo(s+o*.5,r+o*.62),t.lineTo(s,r+o*.28),t.lineTo(s-o*.5,r+o*.62),t.closePath(),t.fillStyle="#b3261e",t.fill(),t.font=`700 ${11*n}px system-ui, -apple-system, "PingFang SC", sans-serif`,t.textAlign="center",t.textBaseline="middle",t.fillStyle="#1c130a",t.fillText("北",s,r+o+13*n),t.restore()}_drawScaleBar(){const t=this.ctx,e=this.coords.viewport,n=this.uiScale;let s=500;for(const d of[500,250,200,100,50]){if(this.coords.metersToPixel(d)<=e.width*.32){s=d;break}s=d}const r=this.coords.metersToPixel(s),o=e.x+16*n,a=e.y+e.height-26*n,l=7*n;t.save(),t.fillStyle="rgba(244, 239, 227, 0.86)",Rr(t,o-8*n,a-18*n,r+16*n,l+30*n,6*n),t.fill(),t.strokeStyle="rgba(20, 14, 8, 0.3)",t.lineWidth=1*n,t.stroke();const c=r/2;t.fillStyle="#1c130a",t.fillRect(o,a,c,l),t.fillStyle="#f4efe3",t.fillRect(o+c,a,c,l),t.strokeStyle="#1c130a",t.lineWidth=1.2*n,t.strokeRect(o,a,r,l),t.font=`${10*n}px ui-monospace, SFMono-Regular, Menlo, monospace`,t.fillStyle="#1c130a",t.textAlign="center",t.textBaseline="bottom",t.fillText("0",o,a-3*n),t.fillText(`${s/2}`,o+c,a-3*n),t.fillText(`${s} m`,o+r,a-3*n),t.restore()}_drawLegendBox(){const t=this.ctx,e=this.coords.viewport,n=this.uiScale;if(this.isCompactMap)return;const s=176*n,r=74*n,o=e.x+e.width-s-14*n,a=e.y+e.height-r-14*n;t.save(),t.fillStyle="rgba(244, 239, 227, 0.9)",Rr(t,o,a,s,r,8*n),t.fill(),t.strokeStyle="rgba(20, 14, 8, 0.3)",t.lineWidth=1.2*n,t.stroke(),t.font=`700 ${11*n}px system-ui, -apple-system, "PingFang SC", sans-serif`,t.fillStyle="#1c130a",t.textAlign="left",t.textBaseline="middle",t.fillText(`等高距 ${this.interval} m`,o+10*n,a+15*n),t.strokeStyle=kt.contourMajor,t.lineWidth=1.9*n,t.beginPath(),t.moveTo(o+10*n,a+36*n),t.lineTo(o+44*n,a+36*n),t.stroke(),t.font=`${10*n}px system-ui, -apple-system, "PingFang SC", sans-serif`,t.fillStyle="#3a2c1d",t.fillText("计曲线（每 100 m）",o+52*n,a+36*n),t.strokeStyle=kt.contour,t.lineWidth=.9*n,t.beginPath(),t.moveTo(o+10*n,a+57*n),t.lineTo(o+44*n,a+57*n),t.stroke(),t.fillStyle="#3a2c1d",t.fillText("首曲线",o+52*n,a+57*n),t.restore()}dispose(){cancelAnimationFrame(this._raf),this._ro&&this._ro.disconnect()}}function xs(i,t){let e=i.replace("#","");e.length===3&&(e=e.split("").map(a=>a+a).join(""));const n=parseInt(e,16),s=n>>16&255,r=n>>8&255,o=n&255;return`rgba(${s}, ${r}, ${o}, ${t})`}function Rr(i,t,e,n,s,r){const o=Math.min(r,n/2,s/2);i.beginPath(),i.moveTo(t+o,e),i.arcTo(t+n,e,t+n,e+s,o),i.arcTo(t+n,e+s,t,e+s,o),i.arcTo(t,e+s,t,e,o),i.arcTo(t,e,t+n,e,o),i.closePath()}const ys={left:62,right:26,top:26,bottom:52};function Qm(i,t){const e=Math.max(1,t-i);for(const n of[10,20,25,50,100,200,250,500])if(e/n<=5.5)return n;return 500}function tg(i,t,e,n={}){const{uiScale:s=1,minXStep:r=220}=n,o={left:ys.left*s,right:ys.right*s,top:ys.top*s,bottom:ys.bottom*s},a={x:o.left,y:o.top,w:Math.max(10,i-o.left-o.right),h:Math.max(10,t-o.top-o.bottom)},l=e?e.length:0,c=e?e.minElevation:0,d=e?e.maxElevation:100,h=n.yStep||Qm(c,d),f=Math.max(0,Math.floor(c/h)*h-h*.6),m=Math.ceil((d+h*.8)/h)*h,g=x=>a.x+(l>0?x/l*a.w:0),v=x=>a.y+a.h-(x-f)/Math.max(1,m-f)*a.h,p=[];for(let x=Math.ceil(f/h)*h;x<=m;x+=h)p.push({elevation:x,y:v(x)});const u=[],S=[100,200,250,500,1e3,2e3];let M=S[0];for(const x of S)if(M=x,l>0&&x/l*a.w>=r)break;for(let x=0;x<=l+1e-6;x+=M)u.push({distance:x,x:g(x)});return u.length&&u[u.length-1].distance<l-1&&u.push({distance:l,x:g(l)}),{plot:a,xScale:g,yScale:v,yMin:f,yMax:m,yTicks:p,xTicks:u,length:l,uiScale:s}}function eg(i,t){const{width:e,height:n,profile:s,analysis:r,layout:o,cursor:a=null,hoverSample:l=null,handles:c=null,emptyHint:d=""}=t,h=o.uiScale;i.clearRect(0,0,e,n),i.fillStyle="#0d1524",i.fillRect(0,0,e,n);const{plot:f,xScale:m,yScale:g,yTicks:v,xTicks:p}=o;i.save(),i.fillStyle="rgba(14, 24, 39, 0.92)",i.fillRect(f.x,f.y,f.w,f.h),i.restore(),i.save(),i.strokeStyle="rgba(120, 160, 200, 0.14)",i.lineWidth=1,i.font=`${10.5*h}px ui-monospace, SFMono-Regular, Menlo, monospace`,i.fillStyle="rgba(180, 200, 225, 0.72)",i.textAlign="right",i.textBaseline="middle";for(const A of v)i.beginPath(),i.moveTo(f.x,A.y),i.lineTo(f.x+f.w,A.y),i.stroke(),i.fillText(`${A.elevation}`,f.x-8*h,A.y);i.textAlign="center",i.textBaseline="top";for(const A of p)i.beginPath(),i.moveTo(A.x,f.y),i.lineTo(A.x,f.y+f.h),i.stroke(),i.fillText(`${Math.round(A.distance)}`,A.x,f.y+f.h+8*h);if(i.restore(),!s||!s.samples||s.samples.length<2){i.save(),i.fillStyle="rgba(148, 163, 184, 0.9)",i.font=`${14*h}px system-ui, -apple-system, "PingFang SC", sans-serif`,i.textAlign="center",i.textBaseline="middle",i.fillText(d||"还没有剖面线",f.x+f.w/2,f.y+f.h/2-12*h),i.font=`${12*h}px system-ui, -apple-system, "PingFang SC", sans-serif`,i.fillStyle="rgba(148, 163, 184, 0.65)",i.fillText("在等高线地图上拖动 A、B 两端，剖面图会实时更新",f.x+f.w/2,f.y+f.h/2+14*h),i.restore();return}const u=s.samples,S=Fi(o.yMax,0,1e3),M=Fi(o.yMin,0,1e3),x=i.createLinearGradient(0,f.y,0,f.y+f.h);x.addColorStop(0,`rgba(${S.r}, ${S.g}, ${S.b}, 0.72)`),x.addColorStop(1,`rgba(${M.r}, ${M.g}, ${M.b}, 0.55)`),i.save(),i.beginPath(),i.moveTo(m(0),g(o.yMin));for(const A of u)i.lineTo(m(A.distance),g(A.elevation));if(i.lineTo(m(s.length),g(o.yMin)),i.closePath(),i.fillStyle=x,i.fill(),i.restore(),i.save(),i.beginPath(),u.forEach((A,T)=>{const P=m(A.distance),V=g(A.elevation);T===0?i.moveTo(P,V):i.lineTo(P,V)}),i.strokeStyle="rgba(56, 189, 248, 0.22)",i.lineWidth=5*h,i.lineJoin="round",i.stroke(),i.strokeStyle=kt.profileLine,i.lineWidth=2*h,i.stroke(),i.restore(),r&&r.featureHits){const A=f.y+f.h-5*h;i.save();for(const T of r.featureHits){const P=m(T.from),V=m(T.to);i.fillStyle=nl(T.accent||kt.selection,.85),i.fillRect(P,A,Math.max(2,V-P),4*h),V-P>34*h&&(i.fillStyle="rgba(226, 232, 240, 0.85)",i.font=`${9.5*h}px system-ui, -apple-system, "PingFang SC", sans-serif`,i.textAlign="center",i.textBaseline="bottom",i.fillText(T.name,(P+V)/2,A-2*h))}i.restore()}if(l){const A=m(l.distance),T=g(l.elevation);i.save(),i.strokeStyle="rgba(226, 232, 240, 0.45)",i.setLineDash([4*h,4*h]),i.lineWidth=1*h,i.beginPath(),i.moveTo(A,f.y),i.lineTo(A,f.y+f.h),i.stroke(),i.setLineDash([]),i.beginPath(),i.arc(A,T,5*h,0,Math.PI*2),i.fillStyle=kt.selection,i.fill(),i.strokeStyle="#e2e8f0",i.lineWidth=1.6*h,i.stroke();const P=`距离 ${Math.round(l.distance)} m · 海拔 ${Math.round(l.elevation)} m`;i.font=`${11*h}px ui-monospace, SFMono-Regular, Menlo, monospace`;const V=i.measureText(P).width+16*h;let _=A+12*h;_+V>f.x+f.w&&(_=A-V-12*h);const b=Math.max(f.y+4*h,T-34*h);i.fillStyle="rgba(9, 17, 29, 0.92)",il(i,_,b,V,22*h,6*h),i.fill(),i.strokeStyle="rgba(56, 189, 248, 0.5)",i.lineWidth=1*h,i.stroke(),i.fillStyle="#e2e8f0",i.textAlign="left",i.textBaseline="middle",i.fillText(P,_+8*h,b+11*h),i.restore()}if(a){const A=m(a.distance),T=g(a.elevation);i.save(),i.beginPath(),i.arc(A,T,7*h,0,Math.PI*2),i.strokeStyle="#fbbf24",i.lineWidth=2.2*h,i.stroke(),i.restore()}const C=c||{a:{distance:0,elevation:u[0].elevation},b:{distance:s.length,elevation:u[u.length-1].elevation}};i.save(),i.font=`800 ${12*h}px system-ui, -apple-system, sans-serif`;for(const A of["a","b"]){const T=C[A];if(!T)continue;const P=m(T.distance),V=g(T.elevation),_=A==="a"?kt.pointA:kt.pointB;i.beginPath(),i.arc(P,V,8*h,0,Math.PI*2),i.fillStyle=_,i.fill(),i.strokeStyle="#0b1220",i.lineWidth=2*h,i.stroke(),i.fillStyle="#0b1220",i.textAlign="center",i.textBaseline="middle",i.fillText(A.toUpperCase(),P,V+.5);const b=`${A.toUpperCase()} ${Math.round(T.elevation)} m`;i.font=`${10.5*h}px ui-monospace, SFMono-Regular, Menlo, monospace`;const k=i.measureText(b).width+12*h,B=Math.min(Math.max(P-k/2,f.x),f.x+f.w-k),W=V>f.y+f.h/2?V-26*h:V+12*h;i.fillStyle=nl(_,.92),il(i,B,W,k,19*h,5*h),i.fill(),i.fillStyle="#0b1220",i.textAlign="center",i.textBaseline="middle",i.fillText(b,B+k/2,W+9.5*h),i.font=`800 ${12*h}px system-ui, -apple-system, sans-serif`}i.restore(),i.save(),i.fillStyle="rgba(180, 200, 225, 0.85)",i.font=`${11*h}px system-ui, -apple-system, "PingFang SC", sans-serif`,i.textAlign="center",i.textBaseline="top",i.fillText("水平距离 (m)",f.x+f.w/2,f.y+f.h+26*h),i.translate(16*h,f.y+f.h/2),i.rotate(-Math.PI/2),i.textBaseline="middle",i.fillText("海拔 (m)",0,0),i.restore(),i.save(),i.strokeStyle="rgba(120, 160, 200, 0.3)",i.lineWidth=1,i.strokeRect(f.x,f.y,f.w,f.h),i.restore()}function el(i,t,e){const s=(i-t.left-e.plot.x)/Math.max(1,e.plot.w);return Math.max(0,Math.min(e.length,s*e.length))}function nl(i,t){let e=i.replace("#","");e.length===3&&(e=e.split("").map(s=>s+s).join(""));const n=parseInt(e,16);return`rgba(${n>>16&255}, ${n>>8&255}, ${n&255}, ${t})`}function il(i,t,e,n,s,r){const o=Math.min(r,n/2,s/2);i.beginPath(),i.moveTo(t+o,e),i.arcTo(t+n,e,t+n,e+s,o),i.arcTo(t+n,e+s,t,e+s,o),i.arcTo(t,e+s,t,e,o),i.arcTo(t,e,t+n,e,o),i.closePath()}class ng{constructor(t,e,n){this.host=t,this.canvas=e,this.model=n,this.ctx=e.getContext("2d"),this.profile=null,this.analysis=null,this.cursor=null,this.hoverSample=null,this.uiScale=1,this.onHover=null,this.onPick=null,this.onEndpointDrag=null,this.cssWidth=1,this.cssHeight=1,this._dirty=!0,this._raf=0,this._dragging=null,this.resize(),this._observe(),this._bind(),this._loop()}setProfile(t){this.profile=t,this.cursor=null,this.hoverSample=null,this._dirty=!0}setAnalysis(t){this.analysis=t,this._dirty=!0}setCursor(t){this.cursor=t,this._dirty=!0}setUiScale(t){this.uiScale=t,this.resize()}_observe(){this._ro=new ResizeObserver(()=>this.resize()),this._ro.observe(this.host)}resize(){const t=this.host.getBoundingClientRect();this.cssWidth=Math.max(1,t.width),this.cssHeight=Math.max(1,t.height),this.dpr=Math.min(window.devicePixelRatio||1,2),this.canvas.width=Math.round(this.cssWidth*this.dpr),this.canvas.height=Math.round(this.cssHeight*this.dpr),this.canvas.style.width=`${this.cssWidth}px`,this.canvas.style.height=`${this.cssHeight}px`,this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0),this._dirty=!0}layout(){return tg(this.cssWidth,this.cssHeight,this.profile,{uiScale:this.uiScale})}_bind(){this._onMove=t=>{if(!this.profile)return;const e=this.layout();if(this._dragging){const s=el(t.clientX,this.canvas.getBoundingClientRect(),e);typeof this.onEndpointDrag=="function"&&this.onEndpointDrag({which:this._dragging,distance:s});return}const n=this._sampleAt(t.clientX,t.clientY,e);this.hoverSample=n,this.canvas.parentElement.classList.add("is-hovering-profile"),typeof this.onHover=="function"&&this.onHover(n),this._dirty=!0},this._onLeave=()=>{this.hoverSample=null,this.canvas.parentElement.classList.remove("is-hovering-profile"),typeof this.onHover=="function"&&this.onHover(null),this._dirty=!0},this._onDown=t=>{if(!this.profile)return;const e=this.layout(),n=this.canvas.getBoundingClientRect(),s=t.clientX-n.left,r=t.clientY-n.top,o=14*this.uiScale,a=this.profile.samples,l=e.xScale(0),c=e.yScale(a[0].elevation),d=e.xScale(this.profile.length),h=e.yScale(a[a.length-1].elevation);if(Math.hypot(s-l,r-c)<=o){this._dragging="a",this.canvas.setPointerCapture?.(t.pointerId);return}if(Math.hypot(s-d,r-h)<=o){this._dragging="b",this.canvas.setPointerCapture?.(t.pointerId);return}},this._onUp=t=>{if(this._dragging){this._dragging=null;return}if(!this.profile)return;const e=this.layout(),n=this.canvas.getBoundingClientRect(),s=t.clientX-n.left,r=t.clientY-n.top,{plot:o}=e;if(s<o.x-6||s>o.x+o.w+6||r<o.y-6||r>o.y+o.h+6)return;const a=this._sampleAt(t.clientX,t.clientY,e);a&&typeof this.onPick=="function"&&this.onPick(a)},this.canvas.addEventListener("pointermove",this._onMove),this.canvas.addEventListener("pointerleave",this._onLeave),this.canvas.addEventListener("pointerdown",this._onDown),this.canvas.addEventListener("pointerup",this._onUp)}_sampleAt(t,e,n){if(!this.profile||!this.profile.samples.length)return null;const s=this.canvas.getBoundingClientRect(),r=el(t,s,n);return this.model.getProfilePointAtDistance(this.profile,r)}_loop(){const t=()=>{this._raf=requestAnimationFrame(t);const e=this.host.getBoundingClientRect();e.width>=1&&e.height>=1&&(Math.abs(e.width-this.cssWidth)>.5||Math.abs(e.height-this.cssHeight)>.5)?this.resize():this._dirty&&(this.render(),this._dirty=!1)};this._raf=requestAnimationFrame(t)}render(){const t=this.layout(),e=this.profile?.samples;eg(this.ctx,{width:this.cssWidth,height:this.cssHeight,profile:this.profile,analysis:this.analysis,layout:t,cursor:this.cursor,hoverSample:this.hoverSample,handles:e&&e.length?{a:{distance:0,elevation:e[0].elevation},b:{distance:this.profile.length,elevation:e[e.length-1].elevation}}:null,emptyHint:"尚未生成剖面图"})}dispose(){cancelAnimationFrame(this._raf),this._ro&&this._ro.disconnect()}}class ig{constructor(t){this.renderer=t,this.currentPreset="default"}setPreset(t){this.currentPreset=t,this.renderer.setViewPreset(t)}reset(){this.renderer.resetView(),this.currentPreset="default"}getExaggeration(){return this.renderer.verticalExaggeration}setExaggeration(t){return this.renderer.setVerticalExaggeration(t),t}zoomBy(t){const e=this.renderer.controls,n=this.renderer.camera,s=n.position.clone().sub(e.target);s.multiplyScalar(t),n.position.copy(e.target).add(s),e.update()}}class sg{constructor(t){this.canvas=t.canvas,this.host=t.host,this.state=t.state,this.model=t.model,this.coords=t.coords,this.handlers=t.handlers||{},this.dragging=null,this._downPoint=null,this._downTime=0,this._moved=!1,this._uiScale=1,this._bind()}setUiScale(t){this._uiScale=t}_handlePositions(){const t=this.state.get("pointA"),e=this.state.get("pointB"),n={};return t&&(n.a=this.coords.worldToPixel(t.x,t.y)),e&&(n.b=this.coords.worldToPixel(e.x,e.y)),n}_hitHandle(t,e){const n=this.canvas.getBoundingClientRect(),s=t-n.left,r=e-n.top,o=15*this._uiScale,a=this._handlePositions();for(const l of["a","b"]){const c=a[l];if(c&&Math.hypot(s-c.px,r-c.py)<=o)return l}return null}_bind(){this._onMove=t=>{const e=this.handlers.isInsideMap?this.handlers.isInsideMap(t.clientX,t.clientY):!0;if(this.dragging){const l=this.coords.pixelToWorld(t.clientX-this.canvas.getBoundingClientRect().left,t.clientY-this.canvas.getBoundingClientRect().top),c=this.coords.clampToBounds(l.x,l.y);this.host.classList.add("is-dragging"),typeof this.handlers.onEndpointDrag=="function"&&this.handlers.onEndpointDrag({which:this.dragging,point:c}),this._moved=!0;return}const n=e?this._hitHandle(t.clientX,t.clientY):null;if(this.host.style.cursor=n?"grab":"",!e){typeof this.handlers.onHover=="function"&&this.handlers.onHover(null,null);return}const s=this.canvas.getBoundingClientRect(),r=this.coords.pixelToWorld(t.clientX-s.left,t.clientY-s.top),o=this.coords.clampToBounds(r.x,r.y),a=this.model.getHeightAt(o.x,o.y);typeof this.handlers.onHover=="function"&&this.handlers.onHover({x:o.x,y:o.y,elevation:a},{clientX:t.clientX,clientY:t.clientY})},this._onDown=t=>{if(t.button!==0)return;this._downPoint={x:t.clientX,y:t.clientY},this._downTime=performance.now(),this._moved=!1;const e=this._hitHandle(t.clientX,t.clientY);e&&(this.dragging=e,this.canvas.setPointerCapture?.(t.pointerId),this.host.classList.add("is-dragging"))},this._onUp=t=>{if(this.dragging){this.dragging=null,this.host.classList.remove("is-dragging"),typeof this.handlers.onEndpointDragEnd=="function"&&this.handlers.onEndpointDragEnd();return}if(!this._downPoint)return;const e=Math.hypot(t.clientX-this._downPoint.x,t.clientY-this._downPoint.y);if(this._downPoint=null,e>5||!(this.handlers.isInsideMap?this.handlers.isInsideMap(t.clientX,t.clientY):!0))return;const s=this.canvas.getBoundingClientRect(),r=this.coords.pixelToWorld(t.clientX-s.left,t.clientY-s.top),o=this.coords.clampToBounds(r.x,r.y);typeof this.handlers.onClick=="function"&&this.handlers.onClick({x:o.x,y:o.y},t)},this._onLeave=()=>{this.dragging||typeof this.handlers.onHover=="function"&&this.handlers.onHover(null,null)},this.canvas.addEventListener("pointermove",this._onMove),this.canvas.addEventListener("pointerdown",this._onDown),this.canvas.addEventListener("pointerup",this._onUp),this.canvas.addEventListener("pointerleave",this._onLeave),this.canvas.addEventListener("contextmenu",t=>t.preventDefault())}dispose(){this.canvas.removeEventListener("pointermove",this._onMove),this.canvas.removeEventListener("pointerdown",this._onDown),this.canvas.removeEventListener("pointerup",this._onUp),this.canvas.removeEventListener("pointerleave",this._onLeave)}}function Wl(i,t,e){const n=i.getHeightAt(t,e),s=i.getSlopeInfo(t,e),r=Vl(t,e);return{x:t,y:e,elevation:n,slopePercent:s.percent,angleDeg:s.angleDeg,aspectDeg:s.aspectDeg,gradient:s.gradient,features:r.map(o=>({id:o.id,name:o.name,type:o.type,accent:o.accent}))}}function rg(i,t){const e=t.maxElevation-t.minElevation||1,n=(i-t.minElevation)/e;return n<.25?"属于图幅中较低的地方":n<.5?"属于图幅中偏低的地方":n<.75?"属于图幅中偏高的地方":"属于图幅中很高的地方"}function og(i,t,e){const n=e.x-t.x,s=e.y-t.y,r=Math.hypot(n,s),o=i.getHeightAt(t.x,t.y),a=i.getHeightAt(e.x,e.y),l=Math.abs(a-o),c=r>1e-6?l/r*100:0,d=Math.atan2(l,r)*180/Math.PI;let h=Math.atan2(n,s)*180/Math.PI;return h<0&&(h+=360),{a:{x:t.x,y:t.y,elevation:o},b:{x:e.x,y:e.y,elevation:a},deltaX:n,deltaY:s,horizontalDistance:r,elevationDifference:l,higher:o>=a?"A":"B",slopePercent:c,angleDeg:d,bearingDeg:h}}class ag{constructor(t,e){this.state=t,this.model=e}describe(t){return Wl(this.model,t.x,t.y)}pick(t){const e=this.state.get("tool");if(e==="measure"){const n=this.state.get("pointA"),s=this.state.get("pointB");return!n||n&&s?(this.state.set({pointA:t,pointB:null,measurement:null,selection:t}),{tool:e,changed:["pointA","pointB"]}):(this.state.set({pointB:t,selection:t}),this.updateMeasurement(),{tool:e,changed:["pointB"]})}if(e==="profile"){const n=this.state.get("pointA"),s=this.state.get("pointB");if(!n)return this.state.set({pointA:t,selection:t}),{tool:e,changed:["pointA"]};if(!s)return this.state.set({pointB:t,selection:t}),{tool:e,changed:["pointB"]};const r=Math.hypot(t.x-n.x,t.y-n.y),o=Math.hypot(t.x-s.x,t.y-s.y);return r<=o?this.state.set({pointA:t,selection:t}):this.state.set({pointB:t,selection:t}),{tool:e,changed:[r<=o?"pointA":"pointB"]}}return this.state.set({selection:t}),{tool:e,changed:["selection"]}}setPoint(t,e){t==="a"?this.state.set({pointA:e}):this.state.set({pointB:e})}clearPoints(){this.state.set({pointA:null,pointB:null,measurement:null,profile:null,profileCursor:null})}updateMeasurement(){const t=this.state.get("pointA"),e=this.state.get("pointB");if(!t||!e)return this.state.set({measurement:null}),null;const n=og(this.model,t,e);return this.state.set({measurement:n}),n}swapPoints(){const t=this.state.get("pointA"),e=this.state.get("pointB");this.state.set({pointA:e,pointB:t})}}const sl=(i,t,e)=>i<t?t:i>e?e:i;class Si{constructor(t,e=Lr.samples){this.model=t,this.sampleCount=e}setSampleCount(t){this.sampleCount=Math.max(16,Math.round(t))}static clampPoint(t){return{x:sl(t.x,Yt.minX,Yt.maxX),y:sl(t.y,Yt.minY,Yt.maxY)}}sample(t,e){const n=Si.clampPoint(t),s=Si.clampPoint(e);return Math.hypot(s.x-n.x,s.y-n.y)<Lr.minLength?null:this.model.getProfile(n,s,this.sampleCount)}pointAtDistance(t,e){return this.model.getProfilePointAtDistance(t,e)}worldAtDistance(t,e){const n=this.pointAtDistance(t,e);return n?{x:n.x,y:n.y,elevation:n.elevation,distance:n.distance}:null}static defaultLine(){return{start:{x:-800,y:460},end:{x:820,y:240}}}}function lg(){return Si.defaultLine()}const rl=["peakA","peakB","saddle","ridge","valley","basin","river","steep","gentle"];function Xl(i,t={}){const{flatThreshold:e=4,peakProminence:n=22,minFeatureSpan:s=45}=t;if(!i||!i.samples||i.samples.length<2)return null;const r=i.samples;let o=0,a=0,l=0,c=0,d=1/0,h=0;for(let x=1;x<r.length;x+=1){const C=r[x].elevation-r[x-1].elevation;C>0?o+=C:a-=C}for(const x of r){const C=Math.abs(x.alongSlopePercent);C>l&&(l=C,c=x.distance),C<d&&(d=C,h=x.distance)}const f=[];for(let x=1;x<r.length-1;x+=1){const C=r[x-1].elevation,A=r[x].elevation,T=r[x+1].elevation;A>=C&&A>=T&&(A>C||A>T)?f.push({type:"max",index:x,distance:r[x].distance,elevation:A}):A<=C&&A<=T&&(A<C||A<T)&&f.push({type:"min",index:x,distance:r[x].distance,elevation:A})}const m=[];for(const x of f){const C=m[m.length-1];if(C&&C.type===x.type&&Math.abs(C.distance-x.distance)<i.length*.04){(x.type==="max"?x.elevation>C.elevation:x.elevation<C.elevation)&&(m[m.length-1]=x);continue}C&&C.type!==x.type&&Math.abs(x.elevation-C.elevation)<n||m.push(x)}const g=m.filter(x=>x.type==="max"),v=m.filter(x=>x.type==="min"),p=[];let u={from:0,to:r[0].distance,dz:0};const S=(x,C)=>{if(C<=0)return"flat";const A=x/C*100;return Math.abs(A)<e/5?"flat":A>0?"up":"down"};for(let x=1;x<r.length;x+=1){const C=r[x].elevation-r[x-1].elevation,A=S(C,r[x].distance-r[x-1].distance);A===u.type?(u.to=r[x].distance,u.dz+=C):(u.type&&p.push(u),u={type:A,from:r[x-1].distance,to:r[x].distance,dz:C})}u.type&&p.push(u);const M=[];for(const x of Sn){let C=null,A=null;for(const T of r)Bn(x,T.x,T.y)&&(C===null&&(C=T.distance),A=T.distance);C!==null&&A-C>=s&&M.push({id:x.id,name:x.name,type:x.type,accent:x.accent,from:C,to:A,span:A-C})}return M.sort((x,C)=>rl.indexOf(x.id)-rl.indexOf(C.id)||x.from-C.from),{length:i.length,minElevation:i.minElevation,maxElevation:i.maxElevation,relief:i.maxElevation-i.minElevation,startElevation:r[0].elevation,endElevation:r[r.length-1].elevation,ascent:o,descent:a,averageSlopePercent:i.length>0?Math.abs(i.maxElevation-i.minElevation)/i.length*100:0,maxSlopePercent:l,maxSlopeDistance:c,minSlopePercent:d===1/0?0:d,minSlopeDistance:h,peaks:g,pits:v,segments:p,featureHits:M}}function Mo(i){if(!i)return"尚未生成剖面。";const{peaks:t,pits:e,relief:n}=i,s=[];n<40?s.push("整体比较平坦"):n<150?s.push("起伏不大"):n<300?s.push("起伏明显"):s.push("起伏很大"),t.length>=2?s.push(`中间出现了 ${t.length} 个高起的部位`):t.length===1&&s.push("中间出现 1 个明显的高起部位"),e.length>=1&&s.push(`有 ${e.length} 处相对低洼`);const r=i.featureHits.map(o=>o.name);return r.length&&s.push(`沿途经过：${r.join("、")}`),`${s.join("，")}。`}class cg{constructor(t,e){this.state=t,this.model=e,this.sampler=new Si(e),this.state.subscribe("pointA",()=>this.recompute()),this.state.subscribe("pointB",()=>this.recompute())}recompute(){const t=this.state.get("pointA"),e=this.state.get("pointB");if(!t||!e)return this.state.get("profile")&&this.state.set({profile:null,profileCursor:null}),null;const n=this.sampler.sample(t,e);return this.state.set({profile:n,profileCursor:null}),n}useDefaultLine(){const t=lg();return this.state.set({pointA:t.start,pointB:t.end}),t}hasLine(){return!!(this.state.get("pointA")&&this.state.get("pointB"))}dragEndpoint(t,e){const n=this.state.get("profile"),s=this.state.get("pointA"),r=this.state.get("pointB");if(e&&typeof e.distance=="number"){if(!n||!s||!r)return;const o=(r.x-s.x)/(n.length||1),a=(r.y-s.y)/(n.length||1);if(t==="a"){const l=Math.max(0,Math.min(n.length-40,e.distance));this.setEndpoint("a",{x:s.x+o*l,y:s.y+a*l})}else{const l=Math.max(40,Math.min(n.length,n.length-e.distance));this.setEndpoint("b",{x:r.x-o*l,y:r.y-a*l})}return}e&&typeof e.x=="number"&&this.setEndpoint(t,e)}setEndpoint(t,e){const n=Si.clampPoint(e);t==="a"?this.state.set({pointA:n}):this.state.set({pointB:n})}locateFromProfile(t){t&&this.state.set({profileCursor:{distance:t.distance,x:t.x,y:t.y,elevation:t.elevation},selection:{x:t.x,y:t.y}})}clearCursor(){this.state.set({profileCursor:null})}analyze(){const t=this.state.get("profile");return t?Xl(t):null}describe(){return Mo(this.analyze())}summary(){const t=this.state.get("profile"),e=this.analyze();return!t||!e?null:{length:t.length,minElevation:t.minElevation,maxElevation:t.maxElevation,relief:e.relief,ascent:e.ascent,descent:e.descent,maxSlopePercent:e.maxSlopePercent,startElevation:e.startElevation,endElevation:e.endElevation,text:Mo(e)}}}class hg{constructor(t){this.state=t.state,this.model=t.model,this.contourGenerator=t.contourGenerator,this.terrain3d=t.terrain3d,this.contour2d=t.contour2d,this.profileView=t.profileView,this.onContoursUpdated=t.onContoursUpdated||(()=>{}),this.onProfileUpdated=t.onProfileUpdated||(()=>{}),this.contourResult=null,this._unsubscribers=[]}init(){const t=this.state;return this._unsubscribers.push(t.subscribe("interval",e=>{this.refreshContours(e)})),this._unsubscribers.push(t.subscribe("verticalExaggeration",e=>{this.terrain3d.setVerticalExaggeration(e)})),this._unsubscribers.push(t.subscribe("display",e=>{this.terrain3d.setShowContours(e.terrainContours),this.contour2d.setDisplay({fill:e.fill,grid:e.grid,labels:e.labels,river:e.river})})),this._unsubscribers.push(t.subscribe("selection",e=>{this.terrain3d.setSelection(e),this.contour2d.setSelection(e)})),this._unsubscribers.push(t.subscribe("pointA",e=>{this.terrain3d.setPointA(e),this.contour2d.setPointA(e)})),this._unsubscribers.push(t.subscribe("pointB",e=>{this.terrain3d.setPointB(e),this.contour2d.setPointB(e)})),this._unsubscribers.push(t.subscribe("profile",e=>{this.terrain3d.setProfile(e),this.contour2d.setProfile(e),this.profileView.setProfile(e),this.onProfileUpdated(e)})),this._unsubscribers.push(t.subscribe("profileCursor",e=>{this.contour2d.setProfileCursor(e),this.profileView.setCursor(e)})),this._unsubscribers.push(t.subscribe("hover",e=>{this.terrain3d.setHover(e),this.contour2d.setHover(e)})),this._unsubscribers.push(t.subscribe("feature",e=>{const n=t.get("showAllFeatures");this.terrain3d.setFeature(e,n),this.contour2d.setFeature(e,n)})),this._unsubscribers.push(t.subscribe("showAllFeatures",e=>{const n=t.get("feature");this.terrain3d.setFeature(n,e),this.contour2d.setFeature(n,e)})),this._unsubscribers.push(t.subscribe("highlightedContour",e=>{this.terrain3d.setHighlightedContour(e),this.contour2d.setHighlightedLine(e)})),this.refreshContours(t.get("interval")),this}refreshContours(t){const e=this.contourGenerator.generate(t);return this.contourResult=e,this.terrain3d.setContourResult(e),this.contour2d.setContourResult(e,t),this.state.get("highlightedContour")&&this.state.set({highlightedContour:null}),this.onContoursUpdated(e),e}syncAll(){const t=this.state.snapshot();this.terrain3d.setSelection(t.selection),this.terrain3d.setPointA(t.pointA),this.terrain3d.setPointB(t.pointB),this.terrain3d.setHover(t.hover),this.terrain3d.setFeature(t.feature,t.showAllFeatures),this.terrain3d.setProfile(t.profile),this.terrain3d.setVerticalExaggeration(t.verticalExaggeration),this.terrain3d.setShowContours(t.display.terrainContours),this.contour2d.setSelection(t.selection),this.contour2d.setPointA(t.pointA),this.contour2d.setPointB(t.pointB),this.contour2d.setHover(t.hover),this.contour2d.setFeature(t.feature,t.showAllFeatures),this.contour2d.setProfile(t.profile),this.contour2d.setProfileCursor(t.profileCursor),this.contour2d.setDisplay({fill:t.display.fill,grid:t.display.grid,labels:t.display.labels,river:t.display.river}),this.profileView.setProfile(t.profile),this.profileView.setCursor(t.profileCursor),this.refreshContours(t.interval)}dispose(){this._unsubscribers.forEach(t=>t()),this._unsubscribers=[]}}class ug{constructor(t){this.state=t.state,this.model=t.model,this.onNote=t.onNote||(()=>{})}static groups(){return Xm.map(t=>({...t,features:t.featureIds.map(e=>On(e)).filter(Boolean)}))}static allFeatures(){return Sn.slice()}select(t){const e=On(t);if(!e)return this.clear(),null;this.state.set({feature:e,experiment:"recognition"});const n=this.buildNote(e);return this.onNote(n),n}clear(){return this.state.set({feature:null}),this.onNote(null),null}buildNote(t){const e=Ym(t,this.model);return{id:t.id,name:t.name,type:t.type,accent:t.accent,summary:t.summary,desc:t.desc,contour:t.contour,note:t.note,detail:t.detail,challenge:t.challenge,stats:e?{centerElevation:e.centerElevation,minElevation:e.minElevation,maxElevation:e.maxElevation,avgSlopePercent:e.avgSlopePercent}:null}}}class dg{constructor(t){this.state=t.state,this.model=t.model,this.profileController=t.profileController}start(){return this.profileController.hasLine()||this.profileController.useDefaultLine(),this.state.set({experiment:"profile"}),this.summary()}useExample(){return this.profileController.useDefaultLine(),this.summary()}clear(){this.profileController.clearPoints?.(),this.state.set({pointA:null,pointB:null,profile:null,profileCursor:null})}isActive(){return this.profileController.hasLine()}summary(){return this.profileController.summary()}featuresCrossed(){const t=this.profileController.analyze();return t?t.featureHits:[]}steepestSegment(){const t=this.profileController.analyze();return t?{distance:t.maxSlopeDistance,percent:t.maxSlopePercent}:null}}function $l(i){const t=Math.abs(i);return t<8?{key:"flat",label:"接近平地",note:"高差很小，等高线非常稀疏。"}:t<20?{key:"gentle",label:"较缓",note:"在相同等高距下，等高线较稀疏。"}:t<45?{key:"moderate",label:"中等",note:"等高线疏密中等。"}:t<80?{key:"steep",label:"较陡",note:"在相同等高距下，等高线明显变密。"}:{key:"verySteep",label:"很陡",note:"等高线非常密集，几乎并在一起。"}}function Yl(i){const t=$l(i.slopePercent),e=i.higher==="A"?"由 B 向 A 上升":"由 A 向 B 上升";return{...t,text:`A、B 两点高差约 ${i.elevationDifference.toFixed(0)} m，水平距离约 ${i.horizontalDistance.toFixed(0)} m，平均坡度约 ${i.slopePercent.toFixed(1)}%（约 ${i.angleDeg.toFixed(1)}°），属于「${t.label}」。${e}。`}}class fg{constructor(t){this.state=t.state,this.model=t.model}pointInfo(t){if(!t)return null;const e=this.model.getHeightAt(t.x,t.y),n=this.model.getSlopeAt(t.x,t.y);return{x:t.x,y:t.y,elevation:e,slopePercent:n,slopeClass:$l(n),description:rg(e,this.model)}}describe(t){if(!t)return null;const e=Yl(t);return{a:{x:t.a.x,y:t.a.y,elevation:t.a.elevation},b:{x:t.b.x,y:t.b.y,elevation:t.b.elevation},elevationDifference:t.elevationDifference,horizontalDistance:t.horizontalDistance,slopePercent:t.slopePercent,angleDeg:t.angleDeg,bearingDeg:t.bearingDeg,higher:t.higher,slopeClass:e,text:e.text}}reminder(){return"海拔是某一点相对于平均海平面的高度；相对高度是两地海拔之差。两者含义不同，不要混淆。"}}function pg(i,t){const e=i.slice();let n=Math.abs(Math.round(t))||1;for(let s=e.length-1;s>0;s-=1){n=(n*1103515245+12345)%2147483648;const r=n%(s+1),o=e[s];e[s]=e[r],e[r]=o}return e}function Pr(i,t,e=24){let n=0,s=0;n+=i.getSlopeAt(t.x,t.y),s+=1;for(let r=0;r<e;r+=1){const o=r/e*Math.PI*2;for(const a of[t.radius*.5,t.radius*.85])n+=i.getSlopeAt(t.x+Math.cos(o)*a,t.y+Math.sin(o)*a),s+=1}return n/s}class mg{constructor(t){this.model=t.model,this.state=t.state,this.profileController=t.profileController,this.onProgress=t.onProgress||(()=>{}),this.onFeedback=t.onFeedback||(()=>{}),this.results=new Map,this.challenges=this.buildChallenges(),this.activeId=null}buildChallenges(){const t=this.model;let e={x:0,y:0,z:-1/0};for(let u=0;u<t.rows;u+=1)for(let S=0;S<t.cols;S+=1){const M=t.getGridHeight(u,S);if(M>e.z){const x=t.gridToWorld(u,S);e={x:x.x,y:x.y,z:M}}}this.highestPoint=e;const n={x:-233,y:40,radius:170},s={x:820,y:-620,radius:190},r={x:-700,y:-560,radius:90},o={steep:Pr(t,n),gentle:Pr(t,s),basin:Pr(t,r)},a=Object.keys(o).sort((u,S)=>o[S]-o[u])[0],l=t.getContourLevels(50),c=l[l.length-1],d=pg([c,c-50,c+50,Math.round(c/2)].filter((u,S,M)=>M.indexOf(u)===S),c+7),h=t.getHeightAt(0,0),f=Math.round(h/50)*50,m=kn[0],g=kn[kn.length-1],v=t.getHeightAt(m[0],m[1])>t.getHeightAt(g[0],g[1]);return[{id:"highest",type:"click",title:"找出整张地图的最高点",prompt:"在等高线地图（或三维地形）上点击你认为海拔最高的位置。",hint:"注意找最里面那一圈闭合等高线——数值最大的地方。",check:u=>{const S=t.getHeightAt(u.x,u.y),M=Math.hypot(u.x-e.x,u.y-e.y),x=S>=e.z-30||M<=140;return{ok:x,title:x?"正确：这里就是全图最高处":"还差一点",message:x?`全图最高点海拔约 ${e.z.toFixed(0)} m，就在山峰 A 的山顶附近。`:`你点的位置海拔约 ${S.toFixed(0)} m，距离真正的最高点还有 ${M.toFixed(0)} m。最高点海拔约 ${e.z.toFixed(0)} m。`}}},{id:"saddle",type:"click",title:"找出两座山峰之间的鞍部",prompt:"在地图上点击两座山峰之间那个“相对较低、但两侧都比它高”的位置。",hint:"鞍部在两组闭合等高线之间，形状像马鞍。",check:u=>{const S=On("saddle"),M=Bn(S,u.x,u.y),x=t.getHeightAt(u.x,u.y),C=x<700,A=M&&C;return{ok:A,title:A?"正确：这里是鞍部":"还不是鞍部",message:A?`该处海拔约 ${x.toFixed(0)} m，明显低于两侧山峰（约 840 m / 720 m），是穿越山地的通道。`:`该处海拔约 ${x.toFixed(0)} m。鞍部应位于两座山峰中间、海拔明显低于两侧山峰的位置。`}}},{id:"ridge",type:"click",title:"找出山脊",prompt:"点击一条“从高处向低处延伸的狭长高地”（脊线两侧都向下倾斜）。",hint:"等高线凸向低处的地方就是山脊。",check:u=>{const S=On("ridge"),M=Bn(S,u.x,u.y),x=S.shape,C=x.a[0],A=x.a[1],T=x.b[0],P=x.b[1],V=T-C,_=P-A,b=Math.hypot(V,_)||1,k=-_/b,B=V/b,W=240,K=t.getHeightAt(u.x,u.y),G=t.getHeightAt(u.x+k*W,u.y+B*W),j=t.getHeightAt(u.x-k*W,u.y-B*W),z=K-(G+j)/2,it=M&&z>=20;return{ok:it,title:it?"正确：这是山脊":"还不是山脊",message:it?`这一点比垂直于脊线方向两侧平均高 ${z.toFixed(0)} m，确实是狭长高地的脊线。`:`这一点比垂直方向两侧平均只高 ${z.toFixed(0)} m。山脊的脊线应该明显高于两侧。`}}},{id:"valley",type:"click",title:"找出山谷",prompt:"点击一条“两侧地势较高、中间较低”的狭长低地。",hint:"等高线凸向高处（常呈 V 形）的地方就是山谷。",check:u=>{const S=On("valley"),M=Bn(S,u.x,u.y),x=t.getHeightAt(u.x,u.y),C=200,A=t.getGradient(u.x,u.y),T=Math.hypot(A.dx,A.dy)||1,P=-A.dy/T,V=A.dx/T,_=t.getHeightAt(u.x+P*C,u.y+V*C),b=t.getHeightAt(u.x-P*C,u.y-V*C),k=(_+b)/2-x,B=M&&k>=15;return{ok:B,title:B?"正确：这是山谷":"还不是山谷",message:B?`这一点比两侧平均低 ${k.toFixed(0)} m，是狭长低地（谷底）。`:`这一点比两侧平均只低 ${k.toFixed(0)} m。山谷要做到“两侧高、中间低”。`}}},{id:"basin",type:"click",title:"找出盆地",prompt:"点击一处“四周较高、中间较低”的封闭低地。",hint:"等高线闭合、数值由外向内变小的地方就是盆地。",check:u=>{const S=On("basin"),M=Bn(S,u.x,u.y),x=t.getHeightAt(u.x,u.y);let C=1/0;for(let P=0;P<8;P+=1){const V=P/8*Math.PI*2,_=t.getHeightAt(u.x+Math.cos(V)*330,u.y+Math.sin(V)*330);_<C&&(C=_)}const A=C-x,T=M&&A>=25;return{ok:T,title:T?"正确：这是盆地":"还不是盆地",message:T?`这一点比四周 330 m 外的最低处还低 ${A.toFixed(0)} m，是封闭的低地。`:`这一点比四周最低处只低 ${A.toFixed(0)} m。盆地要四周高、中间低。`}}},{id:"steepest",type:"choice",title:"哪一区域等高线最密集、坡度最陡？",prompt:"根据等高线的疏密判断：在相同等高距下，哪一块区域最陡？",hint:"等高线越密，说明同样的水平距离内海拔变化越大。",options:[{id:"steep",label:"A 区：山谷西侧的坡面"},{id:"gentle",label:"B 区：地图东南部的平原"},{id:"basin",label:"C 区：盆地中部"}],correct:a,explain:()=>`A 区平均坡度约 ${o.steep.toFixed(0)}%，B 区约 ${o.gentle.toFixed(0)}%，C 区约 ${o.basin.toFixed(0)}%。在等高距相同的条件下，等高线越密集，坡越陡。`},{id:"profile-features",type:"choice",title:"这条剖面线经过了什么地形？",prompt:"系统已经在图上画出一条 A—B 剖面线，请看剖面图，判断它经过了哪些地形部位。",hint:"剖面图上的高起处对应山峰，下凹处对应山谷或鞍部。",prepare:u=>u.useExampleProfile(),options:[{id:"a",label:"只经过一座山峰"},{id:"b",label:"经过两座山峰和它们之间的低处"},{id:"c",label:"全程都是平缓下坡"}],correct:"b",explain:u=>{const S=u.analyzeCurrentProfile();return`剖面数据来自 TerrainModel 的真实采样，沿途经过：${(S?S.featureHits.map(x=>x.name).join("、"):"")||"—"}。剖面最低约 ${S?S.minElevation.toFixed(0):"—"} m，最高约 ${S?S.maxElevation.toFixed(0):"—"} m。`}},{id:"max-level",type:"choice",title:"图中海拔最高的等高线是多少米？",prompt:"在当前等高距（50 m）下，这幅图里画出的最高一条等高线是多少？",hint:"等高线只画到不超过最高海拔的那一条。",options:d.map(u=>({id:String(u),label:`${u} m`})),correct:String(c),explain:()=>`全图最高海拔约 ${e.z.toFixed(0)} m，因此 50 m 等高距下最高的等高线是 ${c} m。`},{id:"center-elevation",type:"choice",title:"地图中心 (0, 0) 附近的海拔大约是多少？",prompt:"结合等高线数值判断地图中心区域的海拔。",hint:"找到地图中心，看它落在哪两条等高线之间。",options:[{id:"low",label:`${f-150} m 左右`},{id:"mid",label:`${f} m 左右`},{id:"high",label:`${f+150} m 左右`},{id:"top",label:`${f+400} m 左右`}],correct:"mid",explain:()=>`TerrainModel 在 (0, 0) 处的真实海拔是 ${h.toFixed(0)} m。`},{id:"river-flow",type:"choice",title:"图中的小河流向哪个方向？",prompt:"河流总是由高处流向低处，请判断它的流向。",hint:"顺着等高线数值变小的方向，就是河流的流向。",options:[{id:"ns",label:"由北向南"},{id:"sn",label:"由南向北"},{id:"ew",label:"由东向西"}],correct:v?"ns":"sn",explain:()=>`河流上游海拔约 ${t.getHeightAt(m[0],m[1]).toFixed(0)} m，下游海拔约 ${t.getHeightAt(g[0],g[1]).toFixed(0)} m，因此由高处流向低处。`}]}setActive(t){this.activeId=t;const e=this.challenges.find(n=>n.id===t);e&&typeof e.prepare=="function"&&e.prepare(this.api())}api(){return{useExampleProfile:()=>this.profileController.useDefaultLine(),analyzeCurrentProfile:()=>this.profileController.analyze(),setProfileLine:(t,e)=>this.state.set({pointA:t,pointB:e})}}submit(t,e){const n=this.challenges.find(o=>o.id===t);if(!n)return null;let s;if(n.type==="click")!e||typeof e.x!="number"?s={ok:!1,title:"还没有选点",message:"请先在地图或三维地形上点击一个位置。"}:s=n.check(e);else{n.options&&!n.options.some(c=>String(c.id)===String(n.correct))&&console.warn(`[Challenge] 题目「${n.id}」的 correct 与 options 不匹配，永远无法答对：`,{correct:n.correct,optionIds:n.options.map(c=>c.id)});const o=String(e)===String(n.correct),a=typeof n.explain=="function"?n.explain(this.api()):"",l=n.options.find(c=>String(c.id)===String(n.correct));s={ok:o,title:o?"回答正确":"再想一想",message:o?a:`正确答案是「${l?l.label:n.correct}」。${a}`}}this.results.set(t,{answer:e,feedback:s,at:Date.now()});const r=this.progress();return this.onProgress(r),this.onFeedback(t,s),s}progress(){return{solved:this.challenges.filter(e=>this.results.get(e.id)?.feedback?.ok).length,total:this.challenges.length,results:this.results}}reset(){this.results.clear(),this.onProgress(this.progress())}needsProfile(t){return t==="profile-features"}}const gg=[{id:"explore",label:"自由探索",hint:"旋转三维地形、查看等高线、点击取点、拖动剖面"},{id:"recognition",label:"地形识别",hint:"高亮山峰 / 山脊 / 山谷 / 鞍部 / 盆地 / 陡坡 / 缓坡"},{id:"profile",label:"地形剖面",hint:"拖动 A、B 生成真实剖面"},{id:"measure",label:"地形测量",hint:"测海拔、相对高度、水平距离与坡度"},{id:"challenge",label:"探索挑战",hint:"用 10 道互动题检验理解"}];class _g{constructor(t){this.state=t.state,this.model=t.model,this.profileController=t.profileController,this.recognition=new ug(t),this.profile=new dg(t),this.measurement=new fg(t),this.challenge=new mg(t),this.current="explore"}list(){return gg}activate(t){return this.current=t,this.state.set({experiment:t}),t==="profile"&&this.profile.start(),t==="measure"&&this.state.set({tool:"measure"}),t==="recognition"&&this.state.set({tool:"select"}),t}}const ne=bo;function vg(i,t,e,n,s,r=120){const o=[];for(let a=0;a<r;a+=1){const l=a/(r-1),c=t+(n-t)*l,d=e+(s-e)*l;o.push({t:l,x:c,y:d,z:i.getHeightAt(c,d)})}return o}function xg(i){return i.reduce((t,e)=>e.z<t.z?e:t,i[0])}function yg(i,t=8,e=90){const{rows:n,cols:s}=i,r=[];for(let o=t;o<n-t;o+=1)for(let a=t;a<s-t;a+=1){const l=i.getGridHeight(o,a);let c=!0,d=1/0;for(let h=-t;h<=t&&c;h+=1)for(let f=-t;f<=t;f+=1){if(h===0&&f===0)continue;const m=i.getGridHeight(o+h,a+f);if(m>l){c=!1;break}m<d&&(d=m)}if(c&&l-d>=e){const h=i.gridToWorld(o,a);r.push({row:o,col:a,x:h.x,y:h.y,z:l,prominence:l-d})}}return r}function ol(i,t,e,n,s,r,o,a=260){const l=n-t,c=s-e,d=Math.hypot(l,c)||1,h=-c/d,f=l/d,m=[],g=9;for(let S=0;S<=g;S+=1){const M=.2+.6*S/g,x=t+l*M,C=e+c*M,A=i.getHeightAt(x,C),T=i.getHeightAt(x+h*a,C+f*a),P=i.getHeightAt(x-h*a,C-f*a),V=o>0?A-(T+P)/2:(T+P)/2-A;m.push({t:M,x,y:C,center:A,sideA:T,sideB:P,diff:V})}const v=Math.min(...m.map(S=>S.diff)),p=m.reduce((S,M)=>S+M.diff,0)/m.length,u=m.map(S=>S.center);return{samples:m,minDiff:v,avgDiff:p,axisMin:Math.min(...u),axisMax:Math.max(...u)}}function Mg(i,t,e,n=380){const s=i.getHeightAt(t,e),r=[];for(let h=0;h<12;h+=1){const f=h/12*Math.PI*2,m=t+Math.cos(f)*n,g=e+Math.sin(f)*n;r.push({angleDeg:f*180/Math.PI,x:m,y:g,z:i.getHeightAt(m,g)})}const o=Math.min(...r.map(h=>h.z)),a=Math.max(...r.map(h=>h.z)),l=r.reduce((h,f)=>h+f.z,0)/r.length,c=[];for(let h=0;h<12;h+=1){const f=h/12*Math.PI*2;c.push(i.getHeightAt(t+Math.cos(f)*n*.5,e+Math.sin(f)*n*.5))}const d=Math.min(...c);return{center:s,minRing:o,maxRing:a,avgRing:l,depth:o-s,closed:s<d-5&&s<o-20,rings:r}}function Sg(i,t=2){let e={x:0,y:0,slope:-1},n={x:0,y:0,slope:1/0};const s=[],r=80;for(let a=0;a<i.rows;a+=t)for(let l=0;l<i.cols;l+=t){const c=i.gridToWorld(a,l);if(c.x<Yt.minX+r||c.x>Yt.maxX-r||c.y<Yt.minY+r||c.y>Yt.maxY-r)continue;const d=i.getSlopeAt(c.x,c.y);s.push(d),d>e.slope&&(e={x:c.x,y:c.y,slope:d}),d<n.slope&&(n={x:c.x,y:c.y,slope:d})}s.sort((a,l)=>a-l);const o=a=>s[Math.min(s.length-1,Math.floor(s.length*a))];return{steepest:e,gentlest:n,p50:o(.5),p90:o(.9),p99:o(.99),p10:o(.1),area:s.length}}function Eg(i,t=260,e=200){const n=[];for(let o=6;o<i.rows-6;o+=4)for(let a=6;a<i.cols-6;a+=4){const l=i.gridToWorld(o,a);if(Math.abs(l.x)>860||Math.abs(l.y)>640)continue;const c=[];for(let m=0;m<12;m+=1){const g=m/12*Math.PI*2;c.push(i.getSlopeAt(l.x+Math.cos(g)*e,l.y+Math.sin(g)*e)),c.push(i.getSlopeAt(l.x+Math.cos(g)*e*.5,l.y+Math.sin(g)*e*.5))}const d=i.getSlopeAt(l.x,l.y),h=c.reduce((m,g)=>m+g,0)/c.length,f=Math.max(...c);n.push({x:l.x,y:l.y,center:d,avg:h,worst:f,radius:t})}const s=n.slice().sort((o,a)=>a.avg-o.avg)[0],r=n.slice().sort((o,a)=>o.worst-a.worst||o.avg-a.avg)[0];return{steep:s,gentle:r}}function bg(i){const t=[],e=T=>t.push(T),n=(()=>{let T={x:0,y:0,z:-1/0};for(let P=0;P<i.rows;P+=1)for(let V=0;V<i.cols;V+=1){const _=i.getGridHeight(P,V);if(_>T.z){const b=i.gridToWorld(P,V);T={row:P,col:V,x:b.x,y:b.y,z:_}}}return T})(),s=Math.hypot(n.x-ne.peakA.x,n.y-ne.peakA.y);e({id:"highestPoint",name:"明显最高点",ok:n.z>=800&&n.z<=1e3&&s<=200,detail:`最高点 (${n.x.toFixed(0)}, ${n.y.toFixed(0)}) 海拔 ${n.z.toFixed(1)} m；距山峰A锚点 ${s.toFixed(0)} m`,expect:"位于山峰 A 附近，海拔 800~1000 m",data:{...n,distToPeakA:s}});const r=yg(i,8,70).sort((T,P)=>P.z-T.z),o=r.find(T=>Math.hypot(T.x-ne.peakA.x,T.y-ne.peakA.y)<260)||r[0],a=r.find(T=>Math.hypot(T.x-ne.peakB.x,T.y-ne.peakB.y)<260);e({id:"secondPeak",name:"第二个明显高点",ok:!!a&&a.z>=600&&o&&o.z-a.z>40,detail:a?`山峰A ${o.z.toFixed(0)} m @(${o.x.toFixed(0)}, ${o.y.toFixed(0)})；山峰B ${a.z.toFixed(0)} m @(${a.x.toFixed(0)}, ${a.y.toFixed(0)})；局部高点共 ${r.length} 处`:`未在山峰 B 附近找到局部高点，局部高点共 ${r.length} 处`,expect:"两个独立高点，且 A 高于 B",data:{peakA:o,peakB:a,count:r.length}});const l=vg(i,ne.peakA.x,ne.peakA.y,ne.peakB.x,ne.peakB.y,160),c=xg(l),d=Math.abs(c.t-.5),h=o?o.z-c.z:0,f=a?a.z-c.z:0,m=i.getHeightAt(ne.saddle.x,ne.saddle.y),g=Math.abs(m-c.z)<150;e({id:"saddle",name:"两峰之间的鞍部（垭口）",ok:c.t>.25&&c.t<.75&&Math.min(h,f)>=90&&g,detail:`两峰连线最低处 t=${c.t.toFixed(2)} 海拔 ${c.z.toFixed(0)} m；相对山峰A低 ${h.toFixed(0)} m，相对山峰B低 ${f.toFixed(0)} m；鞍部锚点海拔 ${m.toFixed(0)} m`,expect:"在两峰中间出现明显相对低点，比两峰低 90 m 以上",data:{t:c.t,z:c.z,dropA:h,dropB:f,saddleElev:m,colMidT:d}});const v=ol(i,ne.ridge.a[0],ne.ridge.a[1],ne.ridge.b[0],ne.ridge.b[1],ne.ridge.sigma,1,240);e({id:"ridge",name:"狭长高地（山脊）",ok:v.minDiff>=25&&v.avgDiff>=60&&v.axisMax-v.axisMin>=150,detail:`轴线比两侧平均高 ${v.avgDiff.toFixed(0)} m（最小 ${v.minDiff.toFixed(0)} m）；轴线高程 ${v.axisMin.toFixed(0)}~${v.axisMax.toFixed(0)} m`,expect:"轴线明显高于垂直方向两侧，且沿轴线延伸很长",data:v});const p=ol(i,ne.valley.a[0],ne.valley.a[1],ne.valley.b[0],ne.valley.b[1],ne.valley.sigma,-1,230);e({id:"valley",name:"两侧高中间低的狭长山谷",ok:p.minDiff>=30&&p.avgDiff>=70,detail:`轴线比两侧平均低 ${p.avgDiff.toFixed(0)} m（最小 ${p.minDiff.toFixed(0)} m）；轴底高程 ${p.axisMin.toFixed(0)}~${p.axisMax.toFixed(0)} m`,expect:"轴线明显低于垂直方向两侧",data:p});const u=Mg(i,ne.basin.x,ne.basin.y,380);e({id:"basin",name:"四周高中间低的盆地",ok:u.closed&&u.depth>=35,detail:`盆底 ${u.center.toFixed(0)} m；外圈最低 ${u.minRing.toFixed(0)} m / 平均 ${u.avgRing.toFixed(0)} m；相对外圈最低处深 ${u.depth.toFixed(0)} m；封闭=${u.closed}`,expect:"中心低于内圈与外圈各方向，形成封闭洼地",data:u});const S=Sg(i,2),M=Eg(i,260,200);e({id:"steepSlope",name:"等高线密集的陡坡",ok:S.steepest.slope>=55&&M.steep.avg>=60,detail:`最陡成片区域中心 (${M.steep.x.toFixed(0)}, ${M.steep.y.toFixed(0)})：周边平均坡度 ${M.steep.avg.toFixed(0)}%；全图最陡点 ${S.steepest.slope.toFixed(0)}%（${S.steepest.x.toFixed(0)}, ${S.steepest.y.toFixed(0)}）；坡度中位数 ${S.p50.toFixed(0)}%`,expect:"存在成片的陡坡区（周边平均坡度 ≥ 60%）",data:{...M.steep,steepest:S.steepest}});const x=M;e({id:"gentleSlope",name:"等高线稀疏的缓坡",ok:x.gentle.worst<=34&&x.gentle.avg<=16&&S.gentlest.slope<=6,detail:`最缓成片区域中心 (${x.gentle.x.toFixed(0)}, ${x.gentle.y.toFixed(0)})：中心坡度 ${x.gentle.center.toFixed(1)}%，周边平均 ${x.gentle.avg.toFixed(1)}%，周边最陡处 ${x.gentle.worst.toFixed(1)}%`,expect:"存在成片的缓坡区（周边平均 ≤ 14%）",data:x.gentle});const C=i.getContourLevels(zn.defaultInterval);return e({id:"contourLevels",name:"等高线层级可生成",ok:C.length>=8,detail:`等高距 50 m 时共 ${C.length} 条等高线：${C[0]} m … ${C[C.length-1]} m`,expect:"至少 8 条等高线",data:{levels:C}}),{ok:t.every(T=>T.ok),items:t,slopeStats:S,maxima:r,maxElevation:i.maxElevation,minElevation:i.minElevation}}function Tg(i){const t=[];return t.push("================ 地形结构验收报告 ================"),t.push(`高程范围：${i.minElevation.toFixed(1)} m ~ ${i.maxElevation.toFixed(1)} m`),t.push("--------------------------------------------------"),i.items.forEach(e=>{t.push(`${e.ok?"✅":"❌"} ${e.name}`),t.push(`   实测：${e.detail}`),t.push(`   期望：${e.expect}`)}),t.push("--------------------------------------------------"),t.push(i.ok?"全部通过 ✅":"存在未通过项 ❌"),t.join(`
`)}function Ag(i){try{const t=bg(i),e=t.items.filter(n=>!n.ok);return e.length===0?console.info("[TerrainValidation] 地形结构验收全部通过 ✅"):console.warn(`[TerrainValidation] 有 ${e.length} 项未通过：
${Tg(t)}`),typeof console.table=="function"&&console.table(t.items.map(n=>({项目:n.name,结果:n.ok?"通过":"未通过",实测:n.detail}))),t}catch(t){return console.warn("[TerrainValidation] 验收过程出错：",t),null}}class wg{constructor(t,e){this.container=t,this.state=e,this.buttons=new Map,this._build(),e.subscribe("mode",n=>this.setActive(n)),this.setActive(e.get("mode"))}_build(){this.container.innerHTML="";for(const t of tc){const e=document.createElement("button");e.type="button",e.className="mode-tab",e.dataset.mode=t.id,e.textContent=t.label,e.title=t.hint,e.addEventListener("click",()=>this.state.set({mode:t.id})),this.container.appendChild(e),this.buttons.set(t.id,e)}}setActive(t){this.buttons.forEach((e,n)=>{const s=n===t;e.classList.toggle("is-active",s),e.setAttribute("aria-selected",s?"true":"false")})}}class Cg{constructor(t){this.state=t.state,this.el=t.elements,this.intervalButtons=this._buildSegmented(this.el.intervalGroup,zn.intervals.map(n=>({id:String(n),label:`${n}m`})),String(this.state.get("interval")),n=>this.state.set({interval:Number(n)})),this.state.subscribe("interval",n=>this._setActive(this.intervalButtons,String(n))),this.toolButtons=this._buildSegmented(this.el.toolGroup,nc.map(n=>({id:n.id,label:n.label,title:n.hint})),this.state.get("tool"),n=>this.state.set({tool:n})),this.state.subscribe("tool",n=>this._setActive(this.toolButtons,n)),this.vexButtons=this._buildSegmented(this.el.vexGroup,ll.options.map(n=>({id:String(n),label:`${n.toFixed(1)}×`})),String(this.state.get("verticalExaggeration")),n=>this.state.set({verticalExaggeration:Number(n)})),this.state.subscribe("verticalExaggeration",n=>this._setActive(this.vexButtons,String(n))),this._bindToggle(this.el.togGrid,"grid"),this._bindToggle(this.el.togLabels,"labels"),this._bindToggle(this.el.togFill,"fill"),this._bindToggle(this.el.tog3dContours,"terrainContours");const e=this.state.get("display");this.el.togGrid&&(this.el.togGrid.checked=e.grid),this.el.togLabels&&(this.el.togLabels.checked=e.labels),this.el.togFill&&(this.el.togFill.checked=e.fill),this.el.tog3dContours&&(this.el.tog3dContours.checked=e.terrainContours),this.state.subscribe("verticalExaggeration",n=>{this.el.vexBadge&&(this.el.vexBadge.textContent=`垂直夸张 ${n.toFixed(1)}×`,this.el.vexBadge.classList.toggle("is-exaggerated",n>1))}),this.state.subscribe("interval",n=>{this.el.intervalBadge&&(this.el.intervalBadge.textContent=`等高距：${n}m`)})}_buildSegmented(t,e,n,s){const r=new Map;if(!t)return r;t.innerHTML="";for(const o of e){const a=document.createElement("button");a.type="button",a.dataset.id=o.id,a.textContent=o.label,o.title&&(a.title=o.title),a.classList.toggle("is-active",o.id===n),a.addEventListener("click",()=>s(o.id)),t.appendChild(a),r.set(o.id,a)}return r}_setActive(t,e){t.forEach((n,s)=>n.classList.toggle("is-active",s===e))}_bindToggle(t,e){t&&t.addEventListener("change",()=>{this.state.set({display:{[e]:t.checked}})})}syncFromState(){const t=this.state.snapshot();this._setActive(this.intervalButtons,String(t.interval)),this._setActive(this.toolButtons,t.tool),this._setActive(this.vexButtons,String(t.verticalExaggeration)),this.el.togGrid&&(this.el.togGrid.checked=t.display.grid),this.el.togLabels&&(this.el.togLabels.checked=t.display.labels),this.el.togFill&&(this.el.togFill.checked=t.display.fill),this.el.tog3dContours&&(this.el.tog3dContours.checked=t.display.terrainContours),this.el.intervalBadge&&(this.el.intervalBadge.textContent=`等高距：${t.interval}m`),this.el.vexBadge&&(this.el.vexBadge.textContent=`垂直夸张 ${t.verticalExaggeration.toFixed(1)}×`,this.el.vexBadge.classList.toggle("is-exaggerated",t.verticalExaggeration>1))}}const pn=(i,t=0)=>Number.isFinite(i)?i.toFixed(t):"—";class Rg{constructor(t){this.state=t.state,this.model=t.model,this.el=t.elements,this._buildLegend(),this._subscribe(),this.renderHover(null),this.renderMeasurement(null),this.renderFeature(null)}_subscribe(){const t=this.state;t.subscribe("hover",e=>this.renderHover(e)),t.subscribe("selection",e=>{e&&this.renderSelection(e)}),t.subscribe("measurement",e=>this.renderMeasurement(e)),t.subscribe("pointA",()=>{this.renderPoints(),this.renderMeasurement(this.state.get("measurement"))}),t.subscribe("pointB",()=>{this.renderPoints(),this.renderMeasurement(this.state.get("measurement"))}),t.subscribe("profile",e=>{this.renderPoints(),this.renderProfileSummary(e)}),t.subscribe("tool",()=>this.renderHint())}renderHover(t){const e=(s,r)=>{s&&(s.textContent=r)};if(!t){e(this.el.roX,"—"),e(this.el.roY,"—"),e(this.el.roZ,"—"),e(this.el.srX,"—"),e(this.el.srY,"—"),e(this.el.srZ,"—"),this.el.hoverReadout&&this.el.hoverReadout.classList.remove("is-visible");return}const n=this.model.getHeightAt(t.x,t.y);e(this.el.roX,`${Math.round(t.x)} m`),e(this.el.roY,`${Math.round(t.y)} m`),e(this.el.roZ,`${Math.round(n)} m`),e(this.el.srX,`${Math.round(t.x)} m`),e(this.el.srY,`${Math.round(t.y)} m`),e(this.el.srZ,`${Math.round(n)} m`),this.el.hoverReadout&&this.el.hoverReadout.classList.add("is-visible")}renderSelection(t){if(!t)return;const e=Wl(this.model,t.x,t.y);this.el.srX&&(this.el.srX.textContent=`${Math.round(e.x)} m`),this.el.srY&&(this.el.srY.textContent=`${Math.round(e.y)} m`),this.el.srZ&&(this.el.srZ.textContent=`${Math.round(e.elevation)} m`)}renderPoints(){const t=this.state.get("pointA"),e=this.state.get("pointB"),n=o=>{if(!o)return"未选择";const a=this.model.getHeightAt(o.x,o.y);return`${Math.round(a)} m · (${Math.round(o.x)}, ${Math.round(o.y)})`};this.el.mA&&(this.el.mA.textContent=n(t)),this.el.mB&&(this.el.mB.textContent=n(e));const s=t?this.model.getHeightAt(t.x,t.y):null,r=e?this.model.getHeightAt(e.x,e.y):null;this.el.chipA&&(this.el.chipA.textContent=t?`A：${Math.round(s)} m`:"A：—"),this.el.chipB&&(this.el.chipB.textContent=e?`B：${Math.round(r)} m`:"B：—"),this.el.chipDh&&(this.el.chipDh.textContent=t&&e?`相对高度：${Math.round(Math.abs(s-r))} m`:"相对高度：—")}renderMeasurement(t){const e=(s,r)=>{s&&(s.textContent=r)};if(!t){e(this.el.mDh,"—"),e(this.el.mDist,"—"),e(this.el.mPercent,"—"),e(this.el.mAngle,"—"),e(this.el.mType,"—");return}e(this.el.mDh,`${pn(t.elevationDifference)} m`),e(this.el.mDist,`${pn(t.horizontalDistance)} m`),e(this.el.mPercent,`${pn(t.slopePercent,1)} %`),e(this.el.mAngle,`${pn(t.angleDeg,1)} °`);const n=Yl(t);e(this.el.mType,`${n.label}（等高线${n.key==="gentle"||n.key==="flat"?"较稀疏":n.key==="moderate"?"疏密中等":"较密集"}）`),this.el.mHint&&(this.el.mHint.textContent=`A 与 B 中较高的是 ${t.higher} 点。${n.text}`)}renderHint(){const t=this.state.get("tool");if(this.el.mHint){if(t==="measure"){const e=this.state.get("pointA"),n=this.state.get("pointB");e?n||(this.el.mHint.textContent="接着点击 B 点，程序会计算相对高度、水平距离与坡度。"):this.el.mHint.textContent="请在等高线地图或三维地形上点击 A 点。";return}if(t==="profile"){this.el.mHint.textContent="拖动图中的 A、B 两个端点，剖面图会实时更新。也可以在地图上依次点击两点。";return}this.el.mHint.textContent="选择「测量」工具后，在等高线地图上依次点击 A 点与 B 点。"}}renderProfileSummary(t){const e=(s,r)=>{s&&(s.textContent=r)};if(!t){e(this.el.pfLength,"—"),e(this.el.pfRange,"—"),e(this.el.pfRelief,"—"),e(this.el.pfFeatures,"—"),e(this.el.pfSummary,"选择「剖面」工具后，在地图上拖动 A、B 两端，剖面图会实时生成。");return}const n=Xl(t);e(this.el.pfLength,`${pn(t.length)} m`),e(this.el.pfRange,`${pn(t.minElevation)} / ${pn(t.maxElevation)} m`),e(this.el.pfRelief,`${pn(n?n.relief:0)} m`),e(this.el.pfFeatures,n&&n.featureHits.length?n.featureHits.map(s=>s.name).join("、"):"未经过典型地形部位"),e(this.el.pfSummary,Mo(n))}renderFeature(t){const e=this.el.featureNote;if(!e)return;if(!t){e.innerHTML='<p class="hint-text">点击任意地形类型，可以看到它在三维地形与等高线图上的位置与形态。</p>';return}const n=[];n.push(`<h4 style="--accent:${t.accent}">${t.name}</h4>`),n.push(`<p class="feature-summary">${Di(t.summary||"")}</p>`),t.stats&&n.push(`<div class="feature-stats"><span>中心海拔 <b>${t.stats.centerElevation.toFixed(0)} m</b></span><span>区域内海拔 <b>${t.stats.minElevation.toFixed(0)} ~ ${t.stats.maxElevation.toFixed(0)} m</b></span><span>平均坡度 <b>${t.stats.avgSlopePercent.toFixed(0)}%</b></span></div>`),t.desc&&n.push(`<p>${Di(t.desc)}</p>`),t.contour&&n.push(`<p class="feature-contour">${Di(t.contour)}</p>`),t.note&&n.push(`<p class="feature-caution">注意：${Di(t.note)}</p>`),t.detail&&t.detail.length&&n.push(`<ul class="feature-list">${t.detail.map(s=>`<li>${Di(s)}</li>`).join("")}</ul>`),e.innerHTML=n.join("")}_buildLegend(){const t=this.el.legendList;if(!t)return;const e=sc.map(s=>`rgb(${s.c[0]}, ${s.c[1]}, ${s.c[2]}) ${(s.t*100).toFixed(0)}%`).join(", "),n=[0,200,400,600,800,1e3];t.innerHTML=`
      <div class="legend-ramp" style="background: linear-gradient(90deg, ${e});"></div>
      <div class="legend-ramp-ticks">${n.map(s=>`<span>${s}</span>`).join("")}</div>
      <div class="legend-caption">高程填色（米）</div>
      <div class="legend-item"><i class="legend-line major"></i><span>计曲线（每 100 m 一条，线更粗）</span></div>
      <div class="legend-item"><i class="legend-line minor"></i><span>首曲线</span></div>
      <div class="legend-item"><i class="legend-dot" style="background:${kt.pointA}"></i><span>A 点 / 剖面起点</span></div>
      <div class="legend-item"><i class="legend-dot" style="background:${kt.pointB}"></i><span>B 点 / 剖面终点</span></div>
      <div class="legend-item"><i class="legend-line profile"></i><span>A—B 剖面线（三个视图同步）</span></div>
      <div class="legend-item"><i class="legend-line river"></i><span>小河（沿山谷谷底，不改变地形数据）</span></div>
    `,Fi(0,0,1e3)}}function Di(i){return String(i??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}class Pg{constructor(t){this.container=t.container,this.experiment=t.experiment,this.state=t.state,this.progressText=t.progressText,this.progressBar=t.progressBar,this.onArmedChange=t.onArmedChange||(()=>{}),this.armedId=null,this.cards=new Map,this.render(),this.updateProgress()}render(){this.container.innerHTML="",this.cards.clear(),this.experiment.challenges.forEach((t,e)=>{const n=document.createElement("div");n.className="challenge-card",n.dataset.id=t.id;const s=document.createElement("div");if(s.className="challenge-head",s.innerHTML=`
        <span class="challenge-index">${e+1}</span>
        <div class="challenge-title-wrap">
          <h4 class="challenge-title">${Ms(t.title)}</h4>
          <p class="challenge-prompt">${Ms(t.prompt)}</p>
        </div>
        <span class="challenge-status">未作答</span>`,n.appendChild(s),t.type==="choice"){const a=document.createElement("div");a.className="challenge-options";for(const l of t.options){const c=document.createElement("button");c.type="button",c.className="challenge-option",c.dataset.option=l.id,c.textContent=l.label,c.setAttribute("aria-pressed","false"),c.addEventListener("click",()=>this.submitChoice(t.id,l.id)),a.appendChild(c)}n.appendChild(a)}else{const a=document.createElement("div");a.className="challenge-arm";const l=document.createElement("button");l.type="button",l.className="btn btn-soft challenge-arm-btn",l.textContent="开始作答（在地图上点击）",l.addEventListener("click",()=>this.arm(t.id));const c=document.createElement("span");c.className="challenge-arm-hint",c.textContent="按下按钮后，在等高线地图或三维地形上点击你的答案位置",a.appendChild(l),a.appendChild(c),n.appendChild(a)}const r=document.createElement("p");r.className="challenge-hint",r.textContent=`提示：${t.hint}`,n.appendChild(r);const o=document.createElement("div");o.className="challenge-feedback",n.appendChild(o),this.container.appendChild(n),this.cards.set(t.id,{card:n,feedback:o,status:s.querySelector(".challenge-status")})})}arm(t){if(this.armedId===t){this.disarm();return}this.armedId=t,this.experiment.setActive(t),this.cards.forEach((e,n)=>{e.card.classList.toggle("is-armed",n===t);const s=e.card.querySelector(".challenge-arm-btn");s&&(s.textContent=n===t?"取消作答":"开始作答（在地图上点击）")}),this.onArmedChange(t)}disarm(){this.armedId=null,this.cards.forEach(t=>{t.card.classList.remove("is-armed");const e=t.card.querySelector(".challenge-arm-btn");e&&(e.textContent="开始作答（在地图上点击）")}),this.onArmedChange(null)}getArmedId(){return this.armedId}submitClick(t,e){const n=this.experiment.submit(t,e);return this.showFeedback(t,n),n&&n.ok&&this.disarm(),n}submitChoice(t,e){const n=this.experiment.submit(t,e);return this.showFeedback(t,n,e),n}showFeedback(t,e,n=null){const s=this.cards.get(t);!s||!e||(s.feedback.className=`challenge-feedback is-visible ${e.ok?"is-correct":"is-wrong"}`,s.feedback.innerHTML=`<b>${Ms(e.title)}</b><span>${Ms(e.message)}</span>`,s.status.textContent=e.ok?"已通过":"再试试",s.status.classList.toggle("is-correct",e.ok),s.status.classList.toggle("is-wrong",!e.ok),s.card.classList.toggle("is-correct",e.ok),s.card.classList.toggle("is-wrong",!e.ok),this.markOptions(t,n,e.ok))}markOptions(t,e,n){const s=this.cards.get(t);if(!s)return;const r=s.card.querySelectorAll(".challenge-option");if(!r.length)return;const o=this.experiment.challenges.find(l=>l.id===t),a=o?String(o.correct):null;r.forEach(l=>{l.classList.remove("is-selected","is-correct","is-wrong"),l.setAttribute("aria-pressed","false");const c=String(l.dataset.option),d=e!=null&&c===String(e),h=a!==null&&c===a;d&&(l.classList.add("is-selected"),l.setAttribute("aria-pressed","true")),d&&n&&l.classList.add("is-correct"),d&&!n&&l.classList.add("is-wrong"),!n&&h&&l.classList.add("is-correct")})}updateProgress(){const{solved:t,total:e}=this.experiment.progress();this.progressText&&(this.progressText.textContent=`已通过 ${t} / ${e}`),this.progressBar&&(this.progressBar.style.width=`${e?t/e*100:0}%`)}reset(){this.disarm(),this.experiment.reset(),this.cards.forEach(t=>{t.feedback.className="challenge-feedback",t.feedback.innerHTML="",t.status.textContent="未作答",t.status.classList.remove("is-correct","is-wrong"),t.card.classList.remove("is-correct","is-wrong"),t.card.querySelectorAll(".challenge-option").forEach(e=>{e.classList.remove("is-selected","is-correct","is-wrong"),e.setAttribute("aria-pressed","false")})}),this.updateProgress()}}function Ms(i){return String(i??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}const Lg=i=>i.requestFullscreen?.()||i.webkitRequestFullscreen?.()||i.msRequestFullscreen?.(),Dg=()=>document.exitFullscreen?.()||document.webkitExitFullscreen?.()||document.msExitFullscreen?.();class Ig{constructor(t=document.documentElement,e=null){this.target=t,this.button=e,this.listeners=new Set,this.supported=!!(document.fullscreenEnabled||document.webkitFullscreenEnabled||document.msFullscreenEnabled),this._onChange=()=>{const n=this.isFullscreen();this.target.classList.toggle("is-fullscreen",n),document.body.classList.toggle("is-fullscreen",n),this._updateButton(n),this.listeners.forEach(s=>s(n))},document.addEventListener("fullscreenchange",this._onChange),document.addEventListener("webkitfullscreenchange",this._onChange),document.addEventListener("MSFullscreenChange",this._onChange),this.button&&(this.button.addEventListener("click",()=>this.toggle()),this.supported||(this.button.disabled=!0,this.button.title="当前浏览器不支持全屏 API")),this._updateButton(this.isFullscreen())}isFullscreen(){return!!(document.fullscreenElement||document.webkitFullscreenElement||document.msFullscreenElement)}async toggle(){try{this.isFullscreen()?await Dg():await Lg(this.target)}catch(t){console.warn("[Fullscreen] 切换全屏失败：",t)}}onChange(t){return this.listeners.add(t),()=>this.listeners.delete(t)}_updateButton(t){this.button&&(this.button.textContent=t?"⤡":"⛶",this.button.title=t?"退出全屏":"全屏显示 (F11)",this.button.setAttribute("aria-pressed",t?"true":"false"))}dispose(){document.removeEventListener("fullscreenchange",this._onChange),document.removeEventListener("webkitfullscreenchange",this._onChange),document.removeEventListener("MSFullscreenChange",this._onChange)}}const ko=[{id:"elevation",index:1,title:"什么是海拔",subtitle:"某地高出平均海平面的高度",summary:"海拔是某地相对于平均海平面的垂直高度，也叫绝对高度，表示一个地点的高低。",blocks:[{type:"p",text:"海拔是指某个地点高出平均海平面的垂直高度，也叫绝对高度。平时说的“这座山海拔多少米”，说的就是海拔。"},{type:"formula",text:"海拔＝该点高出平均海平面的垂直距离（起算面是平均海平面）"},{type:"list",items:["起算面是平均海平面，不是当地地面，也不是地图的最低处。","海拔的单位通常是米，地图上常写作“海拔1200米”。","海拔表示一个地点的绝对高度，不涉及另一个地点。"]},{type:"figure",caption:"海拔以平均海平面为起算面",diagram:'<svg viewBox="0 0 220 120"><path d="M10 95 L60 40 L90 70 L120 25 L180 95" fill="none" stroke="#4a6d7c" stroke-width="2"/><line x1="5" y1="95" x2="215" y2="95" stroke="#2f7fa6" stroke-width="1.5" stroke-dasharray="5 4"/><text x="120" y="112" font-size="10" fill="#2f7fa6" text-anchor="middle">平均海平面</text><line x1="120" y1="25" x2="120" y2="95" stroke="#c0504d" stroke-width="1.5"/><text x="128" y="55" font-size="10" fill="#c0504d">海拔</text></svg>'},{type:"note",text:"海拔只有一个起算面——平均海平面。不要把它和相对高度混在一起，两者起算面不同。"}],actions:[{id:"mode-3d",label:"看三维地形",hint:"在三维视图中观察地表高低"},{id:"tool-measure",label:"测量海拔",hint:"读取某一点的海拔数值"}],relatedFeatures:["peakA","peakB"]},{id:"relative-height",index:2,title:"什么是相对高度",subtitle:"两地海拔之差",summary:"相对高度是两地海拔之差，表示一个地点比另一个地点高出多少，不要与海拔混淆。",blocks:[{type:"p",text:"相对高度是两个地点海拔的差值，表示其中一个地点比另一个地点高出多少。它的起算面是另一个地点，而不是平均海平面。"},{type:"formula",text:"相对高度 = 甲地海拔 − 乙地海拔"},{type:"list",items:["海拔以平均海平面为起算面，相对高度以另一地点为起算面。","甲地海拔1500米、乙地海拔800米，相对高度就是700米。","相对高度只说明两地相差多少，不能说明它们各自有多高。"]},{type:"table",head:["比较项","海拔","相对高度"],rows:[["起算面","平均海平面","另一地点"],["含义","某地高出海平面的高度","两地海拔之差"],["能否单独说明高低","能","不能"]]},{type:"note",text:"计算相对高度时，用较大的海拔减去较小的海拔，结果不会是负数。"}],actions:[{id:"tool-measure",label:"计算高度差",hint:"取两点海拔相减得到相对高度"}],relatedFeatures:["peakA","peakB"]},{id:"contour",index:3,title:"什么是等高线",subtitle:"海拔相同各点的连线",summary:"把地图上海拔相同的各点连接成的线叫等高线，同一条等高线上各点海拔相同。",blocks:[{type:"p",text:"把地图上海拔相同的各个点连接成一条平滑的曲线，这条线就是等高线。同一幅地形图上，往往画有许多条海拔不同的等高线。"},{type:"figure",caption:"一圈一圈的等高线，表示一座小山",diagram:'<svg viewBox="0 0 200 130"><ellipse cx="100" cy="65" rx="80" ry="52" fill="none" stroke="#8aa7b3" stroke-width="1.6"/><ellipse cx="100" cy="65" rx="56" ry="37" fill="none" stroke="#8aa7b3" stroke-width="1.6"/><ellipse cx="100" cy="65" rx="32" ry="22" fill="none" stroke="#c0504d" stroke-width="1.6"/><text x="100" y="100" font-size="10" fill="#4a6d7c" text-anchor="middle">100</text><text x="100" y="52" font-size="10" fill="#c0504d" text-anchor="middle">200</text></svg>'},{type:"list",items:["同一条等高线上，各点的海拔都相同。","等高线是画在地图上的线，实际地面上并没有这条线。","在普通地形图上，不同海拔的等高线一般不相交，也不重合。"]},{type:"note",text:"等高线只是地图上的标记线，地面上并不存在，不要把它当成真实的分界线。"},{type:"p",text:"等高线都是闭合曲线。如果图幅太小画不下整圈，它就会在图幅边缘断开，但断开的两端其实属于同一条线。"}],actions:[{id:"mode-contour",label:"看等高线图",hint:"在二维视图中观察等高线"},{id:"mode-3d",label:"对照三维",hint:"与三维地形对照理解"}],relatedFeatures:["peakA","peakB"]},{id:"interval",index:4,title:"什么是等高距",subtitle:"相邻两条等高线的高差",summary:"等高距是相邻两条等高线之间的海拔差，同一幅地形图上等高距通常相同。",blocks:[{type:"p",text:"相邻两条等高线之间的海拔差，叫做等高距。读图前先看清等高距，才能把等高线的条数换算成高度变化。"},{type:"formula",text:"等高距 = 相邻两条等高线的海拔差（如 150米 − 100米 = 50米）"},{type:"list",items:["同一幅图上，等高距一般相同，读图时要先看清它。","等高距越小，图上等高线越密，地形显示得越细致。","等高距越大，图上等高线越稀，显示的地形越粗略。"]},{type:"table",head:["等高距","同样地形上的等高线","显示效果"],rows:[["20米","条数多、较密","细节清楚"],["50米","条数适中","常用于教学图"],["100米","条数少、较稀","较粗略"]]},{type:"note",text:"比较坡度时，要用同一幅图（等高距相同）的等高线；不同图幅不能只看疏密就下结论。"}],actions:[{id:"interval-20",label:"等高距20米",hint:"切换为20米的等高距"},{id:"interval-50",label:"等高距50米",hint:"切换为50米的等高距"},{id:"interval-100",label:"等高距100米",hint:"切换为100米的等高距"}],relatedFeatures:["peakA","peakB"]},{id:"reading",index:5,title:"怎样看等高线图",subtitle:"读图的基本步骤和要点",summary:"看等高线图要抓住海拔相同、闭合、数值变化、疏密和弯曲这几个方面。",blocks:[{type:"p",text:"读等高线地形图，可以按下面的要点一步一步看：先看等高距和数值，再看线的疏密和弯曲，最后判断地形部位。"},{type:"list",items:["同一条等高线上，各点的海拔相同。","普通地形图上，不同海拔的等高线一般不相交、不重合。","等高线都是闭合曲线，画不全时会在图幅边缘断开。","看数值由外向内变大还是变小，能判断地势的升降。","看等高线的疏密，能判断坡度的陡和缓。"]},{type:"list",items:["看等高线的弯曲形状，能判断山脊、山谷等形态。","疏密只反映坡的陡缓，不能说明海拔的高低。"]},{type:"note",text:"等高线的疏密，只有在等高距相同的条件下才能直接比较坡度；不能把等高线密集理解成海拔高。"},{type:"p",text:"把这几点结合起来，就能从一张平面图读出地形的起伏和变化。"}],actions:[{id:"mode-contour",label:"看等高线图",hint:"对照要点逐条读图"},{id:"feature-all",label:"显示全部地形",hint:"一次看到各类地形部位"}],relatedFeatures:["peakA","peakB","ridge","valley","saddle","basin"]},{id:"slope",index:6,title:"等高线疏密与坡度",subtitle:"密集坡陡，稀疏坡缓",summary:"在等高距相同时，等高线密集表示坡陡，稀疏表示坡缓，疏密反映水平距离的长短。",blocks:[{type:"p",text:"在等高距相同的地形图上，等高线的疏密直接反映坡度的陡缓。密集处坡陡，稀疏处坡缓。"},{type:"formula",text:"坡度 = 高差 ÷ 水平距离 × 100%（近似算法）"},{type:"list",items:["等高线密集，相同高差对应的水平距离短，坡就陡。","等高线稀疏，相同高差对应的水平距离长，坡就缓。","同样的高差，走的路越长，坡度越缓。","坡度常用百分比表示，数值越大，坡越陡。"]},{type:"table",head:["等高线","水平距离","坡度"],rows:[["密集","短","陡"],["稀疏","长","缓"]]},{type:"note",text:"等高距不同（或来自不同图幅）时，不能直接比较等高线的疏密；坡度公式是近似算法，忽略了地面的细小起伏。"}],actions:[{id:"feature-steep",label:"陡坡",hint:"高亮等高线密集的陡坡"},{id:"feature-gentle",label:"缓坡",hint:"高亮等高线稀疏的缓坡"}],relatedFeatures:["steep","gentle"]},{id:"landforms",index:7,title:"五种地形部位",subtitle:"山峰·山脊·山谷·鞍部·盆地",summary:"山峰、山脊、山谷、鞍部、盆地在等高线图上形态各异，可以用闭合和弯曲来判断。",blocks:[{type:"p",text:"同一片山地可以分成不同的地形部位。它们在等高线图上各有特点，抓住“闭合”和“弯曲”两个线索就比较容易分辨。"},{type:"table",head:["地形部位","等高线特点","判断要点"],rows:[["山峰","近似闭合的小圈，数值由外向内增大","中心不一定都是山峰"],["山脊","等高线凸向低处","凸出点的连线是山脊线"],["山谷","等高线凸向高处，常呈V形","V形尖端连线处常有河流"],["鞍部","位于两组闭合曲线之间，形似马鞍","两个相邻高地间的低处"],["盆地","近似闭合，数值由外向内减小","四周高、中间低"]]},{type:"note",text:"判断山脊和山谷，关键看等高线凸向哪里：凸向低处是山脊，凸向高处是山谷。"},{type:"list",items:["判断山脊和山谷，先找准等高线弯曲的方向。","山谷中的河流沿V形尖端的连线流动，水由高处流向低处。","闭合等高线的中心不一定是山峰，要结合数值判断。","陡坡处等高线密集，缓坡处等高线稀疏（等高距相同时）。"]},{type:"p",text:"鞍部是两个相邻高地之间的相对低处，常是翻山越岭的通道；盆地则与山峰相反，四周高、中间低。"}],actions:[{id:"feature-ridge",label:"山脊",hint:"高亮凸向低处的山脊"},{id:"feature-valley",label:"山谷",hint:"高亮凸向高处的山谷"},{id:"feature-saddle",label:"鞍部",hint:"高亮两高地之间的鞍部"}],relatedFeatures:["peakA","peakB","ridge","valley","saddle","basin","steep","gentle","river"]},{id:"profile",index:8,title:"什么是地形剖面图",subtitle:"用距离和海拔表示起伏",summary:"地形剖面图用横轴表示水平距离、纵轴表示海拔，直观显示出沿剖面线的地势起伏。",blocks:[{type:"p",text:"地形剖面图，是把某条剖面线经过的地形起伏，用“距离—海拔”的形式表示出来的图。它和等高线地形图表示的是同一片地形，只是看的角度不同。"},{type:"list",items:["横轴表示水平距离，纵轴表示海拔。","剖面线的方向和位置，决定剖面图的形状。","剖面图能直观看出地势起伏和坡度陡缓。","沿剖面线经过的地形部位，也会在剖面图上表现出来。"]},{type:"p",text:"剖面图通常是根据等高线地形图画出来的：先在图上选一条剖面线，再逐个读出线上各点的海拔，最后按距离和海拔描点连线。"},{type:"note",text:"剖面线换了方向或位置，剖面图就要重画；剖面图只反映这条线上的地形，不能代表整幅图。"},{type:"p",text:"把剖面图和等高线图对照起来看，更容易理解山峰、鞍部、山谷等部位在地势上的高低变化。"}],actions:[{id:"tool-profile",label:"画剖面线",hint:"在地图上选取剖面线"},{id:"mode-profile",label:"剖面模式",hint:"切换到剖面图视图"},{id:"mode-sync",label:"三视图联动",hint:"三维、等高线、剖面同步"}],relatedFeatures:["peakA","ridge","valley","saddle"]}],Ug=i=>{const t={};return i.forEach(e=>{e.actions.forEach(n=>{t[n.id]||(t[n.id]={label:n.label,hint:n.hint})})}),t},Ng=Ug(ko);function Fg(i){const t=Ng[i];return t?t.label:null}class Og{constructor(t){this.tocEl=t.tocEl,this.articlesEl=t.articlesEl,this.onAction=t.onAction||(()=>{}),this.model=t.model||null,this.sections=ko,this.activeId=null,this.rendered=!1}render(){if(!this.rendered){this.tocEl.innerHTML="",this.articlesEl.innerHTML="";for(const t of this.sections)this.tocEl.appendChild(this._buildTocLink(t)),this.articlesEl.appendChild(this._buildArticle(t));this.rendered=!0}}_buildTocLink(t){const e=document.createElement("button");return e.type="button",e.className="k-toc-link",e.dataset.target=t.id,e.innerHTML=`<span class="k-toc-index">${t.index}</span><span class="k-toc-text">${Ii(t.title)}</span>`,e.addEventListener("click",()=>{const n=this.articlesEl.querySelector(`[data-section="${t.id}"]`);n&&n.scrollIntoView({behavior:"smooth",block:"start"}),this.setActive(t.id)}),e}_buildArticle(t){const e=document.createElement("article");e.className="k-section",e.dataset.section=t.id;const n=document.createElement("header");if(n.className="k-head",n.innerHTML=`
      <span class="k-index">${t.index}</span>
      <div class="k-head-text">
        <h3 class="k-title">${Ii(t.title)}</h3>
        <p class="k-subtitle">${Ii(t.subtitle)}</p>
      </div>`,e.appendChild(n),t.summary){const r=document.createElement("p");r.className="k-summary",r.textContent=t.summary,e.appendChild(r)}for(const r of t.blocks||[])e.appendChild(this._buildBlock(r));const s=this._buildStats(t);if(s&&e.appendChild(s),t.actions&&t.actions.length){const r=document.createElement("div");r.className="k-actions";for(const o of t.actions){const a=document.createElement("button");a.type="button",a.className="k-action",a.dataset.action=o.id;const l=Fg(o.id)||o.label||o.id;a.innerHTML=`<span class="k-action-mark">▸</span>${Ii(l)}`,o.hint&&(a.title=o.hint),a.addEventListener("click",()=>this.onAction(o.id)),r.appendChild(a)}e.appendChild(r)}return e}_buildBlock(t){const e=document.createElement("div");switch(t.type){case"p":{e.className="k-p",e.textContent=t.text;break}case"list":{e.className="k-list";const n=document.createElement("ul");for(const s of t.items||[]){const r=document.createElement("li");r.textContent=s,n.appendChild(r)}e.appendChild(n);break}case"note":{e.className="k-note",e.textContent=t.text;break}case"formula":{e.className="k-formula",e.textContent=t.text;break}case"table":{e.className="k-table-wrap";const n=document.createElement("table");n.className="k-table";const s=document.createElement("thead"),r=document.createElement("tr");for(const a of t.head||[]){const l=document.createElement("th");l.textContent=a,r.appendChild(l)}s.appendChild(r),n.appendChild(s);const o=document.createElement("tbody");for(const a of t.rows||[]){const l=document.createElement("tr");for(const c of a){const d=document.createElement("td");d.textContent=c,l.appendChild(d)}o.appendChild(l)}n.appendChild(o),e.appendChild(n);break}case"figure":{e.className="k-figure";const n=document.createElement("div");n.className="k-figure-art",n.innerHTML=t.diagram||"";const s=document.createElement("figcaption");s.className="k-figure-caption",s.textContent=t.caption||"",e.appendChild(n),e.appendChild(s);break}default:e.className="k-p",e.textContent=t.text||""}return e}_buildStats(t){if(!this.model||!t.relatedFeatures||!t.relatedFeatures.length)return null;const e=[];for(const o of t.relatedFeatures){const a=On(o);if(!a)continue;const l=a.shape.kind==="circle"?{x:a.shape.x,y:a.shape.y}:{x:(a.shape.a[0]+a.shape.b[0])/2,y:(a.shape.a[1]+a.shape.b[1])/2},c=this.model.getHeightAt(l.x,l.y),d=this.model.getSlopeAt(l.x,l.y);e.push({name:a.name,elevation:c,slope:d})}if(!e.length)return null;const n=document.createElement("div");n.className="k-stats";const s=document.createElement("div");s.className="k-stats-title",s.textContent="在这块地形上的实际数据",n.appendChild(s);const r=document.createElement("div");r.className="k-stats-rows";for(const o of e){const a=document.createElement("div");a.className="k-stats-row",a.innerHTML=`<span>${Ii(o.name)}</span><b>海拔 ${o.elevation.toFixed(0)} m</b><i>坡度 ${o.slope.toFixed(0)}%</i>`,r.appendChild(a)}return n.appendChild(r),n}setActive(t){this.activeId=t,this.tocEl.querySelectorAll(".k-toc-link").forEach(e=>{e.classList.toggle("is-active",e.dataset.target===t)})}}function Ii(i){return String(i??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}class Bg{constructor(t){this.renderer=t.renderer,this.drawerEl=t.drawerEl,this.onAction=t.onAction||(()=>{}),this.sections=ko,this.activeId=this.sections[0]?.id||null,this._observer=null}mount(){this.renderer.render(),this._observeSections(),this.renderer.setActive(this.activeId)}_observeSections(){const t=this.renderer.articlesEl;this._observer=new IntersectionObserver(e=>{const n=e.filter(s=>s.isIntersecting).sort((s,r)=>r.intersectionRatio-s.intersectionRatio);if(n.length){const s=n[0].target.dataset.section;s&&s!==this.activeId&&(this.activeId=s,this.renderer.setActive(s))}},{root:t,threshold:[.15,.4,.75],rootMargin:"-10% 0px -55% 0px"}),t.querySelectorAll("[data-section]").forEach(e=>this._observer.observe(e))}goto(t){const e=this.renderer.articlesEl.querySelector(`[data-section="${t}"]`);e&&(e.scrollIntoView({behavior:"smooth",block:"start"}),this.activeId=t,this.renderer.setActive(t))}handleAction(t){this.onAction(t)}gotoByFeature(t){const e=this.sections.find(n=>(n.relatedFeatures||[]).includes(t));return e&&this.goto(e.id),e?e.id:null}dispose(){this._observer&&this._observer.disconnect()}}class kg{constructor(){this.$=t=>document.getElementById(t),this.model=new To,this.coords=new lc,this.contourGenerator=new pc(this.model),this.state=new hc,this.validationReport=Ag(this.model),this.terrain3d=new Km(this.$("terrain3d-host"),this.$("terrain3d-canvas"),this.model,this.coords),this.contour2d=new Jm(this.$("contour2d-host"),this.$("contour2d-canvas"),this.model,this.coords),this.profileView=new ng(this.$("profile-host"),this.$("profile-canvas"),this.model),this.camera=new ig(this.terrain3d),this.selectionController=new ag(this.state,this.model),this.profileController=new cg(this.state,this.model),this.sync=new hg({state:this.state,model:this.model,contourGenerator:this.contourGenerator,terrain3d:this.terrain3d,contour2d:this.contour2d,profileView:this.profileView,onContoursUpdated:t=>this._onContoursUpdated(t),onProfileUpdated:t=>this._onProfileUpdated(t)}),this.experiments=new _g({state:this.state,model:this.model,profileController:this.profileController,onNote:t=>this.infoPanel.renderFeature(t),onProgress:()=>this.challengePanel&&this.challengePanel.updateProgress(),onFeedback:()=>{}}),this.appEl=this.$("app"),this.toastEl=this.$("toast"),this.modeTabs=new wg(this.$("mode-tabs"),this.state),this.controlPanel=new Cg({state:this.state,elements:{intervalGroup:this.$("interval-group"),toolGroup:this.$("tool-group"),vexGroup:this.$("vex-group"),togGrid:this.$("tog-grid"),togLabels:this.$("tog-labels"),togFill:this.$("tog-fill"),tog3dContours:this.$("tog-3d-contours"),intervalBadge:this.$("interval-badge"),vexBadge:this.$("vex-badge")}}),this.infoPanel=new Rg({state:this.state,model:this.model,elements:{roX:this.$("ro-x"),roY:this.$("ro-y"),roZ:this.$("ro-z"),srX:this.$("sr-x"),srY:this.$("sr-y"),srZ:this.$("sr-z"),hoverReadout:this.$("hover-readout"),mA:this.$("m-a"),mB:this.$("m-b"),mDh:this.$("m-dh"),mDist:this.$("m-dist"),mPercent:this.$("m-percent"),mAngle:this.$("m-angle"),mType:this.$("m-type"),mHint:this.$("m-hint"),chipA:this.$("chip-a"),chipB:this.$("chip-b"),chipDh:this.$("chip-dh"),pfLength:this.$("pf-length"),pfRange:this.$("pf-range"),pfRelief:this.$("pf-relief"),pfFeatures:this.$("pf-features"),pfSummary:this.$("pf-summary"),featureNote:this.$("feature-note"),legendList:this.$("legend-list")}}),this.knowledgeRenderer=new Og({tocEl:this.$("knowledge-toc"),articlesEl:this.$("knowledge-articles"),model:this.model,onAction:t=>this.handleKnowledgeAction(t)}),this.knowledgeNavigator=new Bg({renderer:this.knowledgeRenderer,drawerEl:this.$("knowledge-drawer"),onAction:t=>this.handleKnowledgeAction(t)}),this.knowledgeNavigator.mount(),this.featureChipsEl=this.$("feature-chips"),this._buildFeatureChips(),this.challengePanel=new Pg({container:this.$("challenge-list"),experiment:this.experiments.challenge,state:this.state,progressText:this.$("challenge-progress-text"),progressBar:this.$("challenge-progress-bar"),onArmedChange:t=>this._onChallengeArmed(t)}),this.mapPointer=new sg({canvas:this.$("contour2d-canvas"),host:this.$("contour2d-host"),state:this.state,model:this.model,coords:this.coords,handlers:{isInsideMap:(t,e)=>this.contour2d.isInsideMap(t,e),onHover:t=>this.state.set({hover:t}),onClick:t=>this.handlePointPick(t),onEndpointDrag:({which:t,point:e})=>this.profileController.dragEndpoint(t,e)}}),this.terrain3d.onPick=t=>this.handlePointPick({x:t.x,y:t.y},"3d"),this.terrain3d.onHover=t=>this.state.set({hover:t?{x:t.x,y:t.y}:null}),this.profileView.onPick=t=>this.profileController.locateFromProfile(t),this.profileView.onHover=t=>{this.state.set({hover:t?{x:t.x,y:t.y}:null})},this.profileView.onEndpointDrag=({which:t,distance:e})=>{this.profileController.dragEndpoint(t,{distance:e})},this.fullscreen=new Ig(document.documentElement,this.$("btn-fullscreen")),this._bindButtons(),this._bindState(),this._bindKeyboard(),this.sync.init(),this.sync.syncAll(),this._applyMode(this.state.get("mode")),this.infoPanel.renderHint(),requestAnimationFrame(()=>{this.terrain3d.resize(),this.contour2d.resize(),this.profileView.resize();const t=this.$("boot");t&&(t.classList.add("is-done"),setTimeout(()=>{t.hidden=!0},420))})}_bindState(){this.state.subscribe("mode",t=>this._applyMode(t)),this.state.subscribe("feature",()=>this._syncFeatureChips()),this.state.subscribe("tool",t=>{const e=this.$("contour2d-host");e&&e.classList.toggle("is-picking",t==="select"||t==="measure"),this.$("contour2d-hint").textContent=this._hintForTool(t),t==="profile"&&(this.$("profile-hint").textContent="单击剖面曲线可反向定位到地图与三维地形 · 拖动剖面两端微调剖切范围")}),this.state.subscribe("profile",t=>{if(!this.$("profile-title"))return;const e=this.state.get("pointA"),n=this.state.get("pointB");this.$("profile-title").textContent=e&&n?`A(${Math.round(e.x)}, ${Math.round(e.y)}) → B(${Math.round(n.x)}, ${Math.round(n.y)})`:"A — B"})}_hintForTool(t){switch(t){case"measure":return"依次点击 A、B 两点，测量相对高度、水平距离与坡度";case"profile":return"拖动 A、B 端点或依次点击两点，生成地形剖面";case"contour":return"单击任意一条等高线，高亮整条线并显示它的海拔";default:return"移动鼠标探测海拔 · 单击取点，三维地形会同步出现同一点"}}_applyMode(t){this.appEl.dataset.mode=t,(t==="profile"||t==="sync")&&!this.profileController.hasLine()&&(this.profileController.useDefaultLine(),this.toast("已生成示例剖面 A—B，可拖动端点实时调整")),requestAnimationFrame(()=>this.resizeViews()),[120,320,620].forEach(n=>setTimeout(()=>this.resizeViews(),n))}resizeViews(){this.terrain3d.resize(),this.contour2d.resize(),this.profileView.resize()}_onContoursUpdated(t){const e=this.$("interval-badge");e&&(e.textContent=`等高距：${t.interval}m`),this.profileView.setAnalysis(this.profileController.analyze())}_onProfileUpdated(){this.profileView.setAnalysis(this.profileController.analyze())}handlePointPick(t,e="map"){const n=this.challengePanel?this.challengePanel.getArmedId():null;if(n){this.challengePanel.submitClick(n,t);return}const s=this.state.get("tool");if(s==="contour"){const r=this.contour2d.hitTestContour(t,55);r?(this.state.set({highlightedContour:r.line}),this.infoPanel.renderSelection(t),this.toast(`这条等高线的海拔是 ${Math.round(r.line.level)} m${r.line.major?"（计曲线）":""}`)):(this.state.set({highlightedContour:null}),this.infoPanel.renderSelection(t),this.toast(`该点海拔约 ${Math.round(this.model.getHeightAt(t.x,t.y))} m，附近没有等高线`));return}if(this.selectionController.pick(t),this.infoPanel.renderSelection(t),s==="profile"&&this.profileController.hasLine()&&(this.$("profile-hint").textContent="拖动 A、B 端点可实时改变剖面 · 单击曲线反向定位"),s==="select"){const r=this.model.getHeightAt(t.x,t.y),o=Vl(t.x,t.y).find(a=>["peak","saddle","basin","ridge","valley"].includes(a.type));if(o){this.state.set({feature:o,showAllFeatures:!1});const a=this.experiments.recognition.buildNote(o);this.infoPanel.renderFeature(a);const l=a.stats?a.stats.maxElevation:r;this.toast(`${o.name}：区域内最高海拔约 ${Math.round(l)} m（单击点海拔 ${Math.round(r)} m）`)}else this.toast(`该点海拔 ${Math.round(r)} m（x=${Math.round(t.x)}, y=${Math.round(t.y)}）`)}}_buildFeatureChips(){const t=this.featureChipsEl;if(!t)return;t.innerHTML="";for(const n of Sn){const s=document.createElement("button");s.type="button",s.className="chip-btn feature-chip",s.dataset.feature=n.id,s.textContent=n.name,s.style.setProperty("--chip-color",n.accent),s.addEventListener("click",()=>this.selectFeature(n.id)),t.appendChild(s)}const e=document.createElement("button");e.type="button",e.className="chip-btn feature-chip feature-chip-all",e.dataset.feature="all",e.textContent="显示全部",e.addEventListener("click",()=>this.selectFeature("all")),t.appendChild(e)}selectFeature(t){if(t==="all"){this.state.set({feature:null,showAllFeatures:!0}),this.infoPanel.renderFeature({id:"all",name:"全部典型地形",accent:"#38bdf8",summary:"同一块地形上同时存在的典型地形部位",desc:"山峰 A、山峰 B、鞍部、山脊、山谷、盆地、陡坡、缓坡都来自同一份高度数据。",contour:"把它们放在一起对比，就能理解“等高线形态”与“真实地形”的对应关系。",detail:["闭合、内高外低 → 山峰；闭合、内低外高 → 盆地。","凸向低处 → 山脊；凸向高处（V 形）→ 山谷。","两座山峰之间相对低处 → 鞍部。","等高线密集 → 陡坡；等高线稀疏 → 缓坡（等高距相同时）。"],stats:null}),this.toast("已在地图上高亮全部典型地形");return}this.state.set({showAllFeatures:!1}),this.experiments.recognition.select(t)}_syncFeatureChips(){const t=this.state.get("feature"),e=this.state.get("showAllFeatures");this.featureChipsEl?.querySelectorAll(".feature-chip").forEach(n=>{const s=n.dataset.feature;n.classList.toggle("is-active",e?s==="all":!!(t&&t.id===s))})}_onChallengeArmed(t){if(t){this.toast("请在等高线地图或三维地形上点击你的答案");const e=this.$("challenge-drawer");e&&!e.hidden&&this.closeDrawer("challenge-drawer")}}_bindButtons(){this.$("btn-reset-view")?.addEventListener("click",()=>{this.camera.reset(),this.toast("已重置三维视角")});const t=()=>{this.profileController.useDefaultLine(),(this.state.get("mode")==="dual"||this.state.get("mode")==="contour"||this.state.get("mode")==="3d")&&this.state.set({mode:"sync"}),this.toast("已生成示例剖面 A—B，可拖动端点实时调整")};this.$("btn-profile-preset")?.addEventListener("click",t),this.$("btn-sample-profile")?.addEventListener("click",t);const e=()=>{this.profileController.clearPoints(),this.state.set({pointA:null,pointB:null,profile:null,profileCursor:null,measurement:null}),this.toast("已清除 A/B 与剖面")};this.$("btn-profile-clear")?.addEventListener("click",e),this.$("btn-clear-profile")?.addEventListener("click",e),this.$("btn-measure-reset")?.addEventListener("click",()=>{this.selectionController.clearPoints(),this.state.set({measurement:null})}),this.$("btn-feature-clear")?.addEventListener("click",()=>{this.state.set({feature:null,showAllFeatures:!1}),this.infoPanel.renderFeature(null)}),this.$("btn-challenge-reset")?.addEventListener("click",()=>{this.challengePanel.reset(),this.toast("挑战已重置")}),this.$("btn-knowledge")?.addEventListener("click",()=>this.openDrawer("knowledge-drawer")),this.$("btn-challenge")?.addEventListener("click",()=>this.openDrawer("challenge-drawer")),this.$("btn-help")?.addEventListener("click",()=>this.openDrawer("help-modal",!0)),this.$("btn-classroom")?.addEventListener("click",()=>this.toggleClassroom()),document.querySelectorAll("[data-close]").forEach(n=>{n.addEventListener("click",()=>{const s=n.dataset.close;s==="help-modal"?this.closeDrawer("help-modal",!0):this.closeDrawer(s)})}),["knowledge-drawer","challenge-drawer","help-modal"].forEach(n=>{const s=this.$(n);s&&s.addEventListener("click",r=>{r.target===s&&this.closeDrawer(n,n==="help-modal")})})}_bindKeyboard(){window.addEventListener("keydown",t=>{t.key==="Escape"&&(["knowledge-drawer","challenge-drawer"].forEach(e=>{this.$(e)?.hidden||this.closeDrawer(e)}),this.$("help-modal")?.hidden||this.closeDrawer("help-modal",!0),this.state.set({highlightedContour:null})),t.key==="r"&&(t.metaKey||t.ctrlKey)&&(t.preventDefault(),this.camera.reset())})}openDrawer(t,e=!1){const n=this.$(t);n&&(n.hidden=!1,requestAnimationFrame(()=>n.classList.add("is-open")),e&&n.classList.add("is-open"))}closeDrawer(t,e=!1){const n=this.$(t);n&&(n.classList.remove("is-open"),setTimeout(()=>{n.hidden=!0},e?0:220))}toggleClassroom(){const t=!this.state.get("classroomMode");this.state.set({classroomMode:t}),document.body.classList.toggle("classroom",t);const e=t?1.4:1;this.contour2d.uiScale=e,this.profileView.setUiScale(e),this.mapPointer.setUiScale(e),this.contour2d.resize(),this.$("btn-classroom")?.classList.toggle("is-active",t),this.toast(t?"已进入课堂模式：字体与按钮已放大，适合投影":"已退出课堂模式")}toast(t,e=""){const n=this.toastEl;n&&(n.textContent=t,n.hidden=!1,n.classList.toggle("is-error",e==="error"),requestAnimationFrame(()=>n.classList.add("is-visible")),clearTimeout(this._toastTimer),this._toastTimer=setTimeout(()=>{n.classList.remove("is-visible"),setTimeout(()=>{n.hidden=!0},260)},2800))}handleKnowledgeAction(t){if(t){if(t.startsWith("mode-")){const e=t.slice(5);this.state.set({mode:e}),e!=="dual"&&this.toast(`已切换到「${this._modeLabel(e)}」`);return}if(t.startsWith("interval-")){const e=Number(t.slice(9));Number.isFinite(e)&&(this.state.set({interval:e}),this.state.get("mode")==="3d"&&this.state.set({mode:"dual"}),this.toast(`等高距已调整为 ${e} m`));return}if(t.startsWith("tool-")){const e=t.slice(5);this.state.set({tool:e}),e==="profile"&&(this.state.get("mode")==="3d"||this.state.get("mode")==="dual")&&this.state.set({mode:"sync"}),this.toast(`已切换到「${this._toolLabel(e)}」工具，请在地图上试一试`);return}if(t.startsWith("feature-")){const e=t.slice(8);if(e==="all"){this.selectFeature("all");return}if(e==="peak"){this.selectFeature("peakA");return}this.selectFeature(e);const n=Sn.find(s=>s.id===e);n&&this.toast(`已高亮：${n.name}`);return}if(t==="open-challenge"){this.openDrawer("challenge-drawer");return}}}_modeLabel(t){return{"3d":"三维地形",contour:"等高线地图",dual:"三维 + 等高线",profile:"地形剖面",sync:"同步实验"}[t]||t}_toolLabel(t){return{select:"选点",measure:"测量",profile:"剖面",contour:"等高线"}[t]||t}}function zg(i){console.error("[ContourTerrainLab] 初始化失败：",i);const t=document.getElementById("boot");t&&(t.hidden=!1,t.classList.remove("is-done"),t.innerHTML=`
      <div class="boot-inner">
        <p class="boot-error-title">实验室初始化失败</p>
        <p class="boot-error-detail">${String(i&&i.message?i.message:i)}</p>
        <p class="boot-error-hint">请确认浏览器支持 WebGL，并通过 <code>npm run dev</code> 或构建后的页面访问。</p>
      </div>`)}function al(){try{const i=new kg;window.contourTerrainLab=i,window.__terrainModel=i.model}catch(i){zg(i)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",al,{once:!0}):al();

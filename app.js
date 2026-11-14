var FORMS={'4-4-2':[4,4,2],'4-3-3':[4,3,3],'4-2-3-1':[4,2,3,1],'3-5-2':[3,5,2],'3-4-3':[3,4,3],'5-3-2':[5,3,2],'3-3-2':[3,3,2],'3-3-1':[3,3,1],'2-3-2':[2,3,2],'2-3-1':[2,3,1],'2-2-1':[2,2,1]};
var MAX_QUARTERS=20;
var KEY='captain-notes-v1',UI={pick:null,text:null,mg:false,menu:false,matchDate:'',matchTime:'',dateMatches:null,dateTarget:'',calendarOpen:false,calendarMonth:'',matchCalendarOpen:false,matchCalendarMonth:'',calendarMode:'days',calendarPickerYear:0,teamEditOpen:false,confirm:null,dragSuppressUntil:0,playerEditor:null};
var peopleById=Object.create(null),guestIds=Object.create(null);
var LANGS={ko:{name:'한국어',locale:'ko-KR'},en:{name:'English',locale:'en-US'},es:{name:'Español',locale:'es-ES'},pt:{name:'Português',locale:'pt-PT'},de:{name:'Deutsch',locale:'de-DE'},fr:{name:'Français',locale:'fr-FR'},it:{name:'Italiano',locale:'it-IT'}};
var LANG_KEY='captain-notes-language',LANG='ko';
var LOCALES=window.APP_LOCALES=window.APP_LOCALES||{},localeLoads=Object.create(null);
try{var storedLang=localStorage.getItem(LANG_KEY);if(LANGS[storedLang])LANG=storedLang}catch(e){}
var teamFitObserver=null;
function loadLocale(code){
 if(LOCALES[code])return Promise.resolve();
 if(localeLoads[code])return localeLoads[code];
 localeLoads[code]=new Promise(function(resolve,reject){
  var script=document.createElement('script');script.src='locales/'+code+'.js';script.async=true;
  script.onload=function(){if(LOCALES[code])resolve();else{delete localeLoads[code];reject(new Error('Locale dictionary is missing: '+code))}};
  script.onerror=function(){delete localeLoads[code];reject(new Error('Locale failed to load: '+code))};
  document.head.appendChild(script)
 });
 return localeLoads[code]
}
function tr(s,values){var words=LOCALES[LANG],text=words&&words[s]||s;
 return text.replace(/\{([a-zA-Z]+)\}/g,function(token,key){return values&&values[key]!=null?String(values[key]):token})}
function localizeNodeText(s){
 var v=s.trim(),t=tr(v);if(t!==v)return s.replace(v,t);
 var dm=v.match(/^(.*) 경기$/);if(dm)return s.replace(v,dm[1]+' '+tr('경기'));
 var m=v.match(/^참석 (\d+)명, 게스트 (\d+)명, 배치 (\d+)명$/);if(m)return s.replace(v,tr('참석 {present}명, 게스트 {guests}명, 배치 {assigned}명',{present:m[1],guests:m[2],assigned:m[3]}));
 m=v.match(/^(\d+)쿼터$/);if(m)return s.replace(v,tr('{count}쿼터',{count:m[1]}));
 m=v.match(/^(\d+)쿼터 기준, 최종 (\d+) : (\d+) (승|패|무)$/);if(m)return s.replace(v,tr('{quarter}쿼터 기준, 최종 {home} : {away} {result}',{quarter:m[1],home:m[2],away:m[3],result:tr(m[4])}));
 var scorePattern=/(\d+)쿼터 (\d+):(\d+)/g,scoreMatch,result=v;while((scoreMatch=scorePattern.exec(v))!==null)result=result.replace(scoreMatch[0],tr('{quarter}쿼터 {home}:{away}',{quarter:scoreMatch[1],home:scoreMatch[2],away:scoreMatch[3]}));if(result!==v)return s.replace(v,result);
 m=v.match(/^(\d+)-(\d+-\d+(?:-\d+)?) \((\d+)인\)$/);if(m)return s.replace(v,tr('{formation} ({players}인)',{formation:m[1]+'-'+m[2],players:m[3]}));
 m=v.match(/^(GK|DF|MF|FW) 자리$/);if(m)return s.replace(v,tr('{position} 자리',{position:m[1]}));
 m=v.match(/^(우리|상대) 점수 (빼기|더하기)$/);if(m)return s.replace(v,tr('{side} 점수 {action}',{side:tr(m[1]),action:tr(m[2]==='빼기'?'점수 빼기':'점수 더하기')}));
 m=v.match(/^Inactive 선수 (\d+)명은 출석 목록에 나오지 않아요\.$/);if(m)return s.replace(v,tr('Inactive 선수 {count}명은 출석 목록에 나오지 않아요.',{count:m[1]}));
 m=v.match(/^선수 (\d+)명, 저장된 경기 (\d+)건, 약 (.+)\. 데이터는 이 기기의 브라우저에만 저장돼서, 기기를 바꾸거나 브라우저 데이터를 지우면 사라져요\. 백업 코드를 메모나 메신저에 보관해 두세요\.$/);if(m)return s.replace(v,tr('선수 {players}명, 저장된 경기 {matches}건, 약 {size}. 데이터는 이 기기의 브라우저에만 저장돼서, 기기를 바꾸거나 브라우저 데이터를 지우면 사라져요. 백업 코드를 메모나 메신저에 보관해 두세요.',{players:m[1],matches:m[2],size:m[3]}));
 m=v.match(/^(\d+)명, (\d+)쿼터 x (\d+)분$/);if(m)return s.replace(v,tr('{players}명, {quarters}쿼터 x {minutes}분',{players:m[1],quarters:m[2],minutes:m[3]}));
 m=v.match(/^(.*?, )?참석 (\d+)명, (\d+)쿼터 x (\d+)분(.*)$/);if(m)return s.replace(v,tr('{prefix}참석 {players}명, {quarters}쿼터 x {minutes}분',{prefix:m[1]?localizeNodeText(m[1]):'',players:m[2],quarters:m[3],minutes:m[4]})+localizeNodeText(m[5]));
 m=v.match(/^(\d+)일, 경기 기록 없음$/);if(m)return s.replace(v,tr('{day}일, 경기 기록 없음',{day:m[1]}));
 var quarterMinutesPattern=/(\d+)쿼터 (\d+)분/g,quarterMinutesMatch,quarterMinuteResult=v;while((quarterMinutesMatch=quarterMinutesPattern.exec(v))!==null)quarterMinuteResult=quarterMinuteResult.replace(quarterMinutesMatch[0],tr('{quarter}쿼터 {minutes}분',{quarter:quarterMinutesMatch[1],minutes:quarterMinutesMatch[2]}));if(quarterMinuteResult!==v)return s.replace(v,quarterMinuteResult);
 return s.replace(/(\d+)분/g,function(_,minutes){return tr('{minutes}분',{minutes:minutes})})}
function localizeUI(){
 document.documentElement.lang=LANGS[LANG].locale;
 var walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 nodes.forEach(function(n){var name=n.parentElement.closest('.nm');if(n.parentElement.closest('.team')||n.parentElement.closest('.player-display-name')||(name&&!name.closest('.rec')&&n.parentElement===name))return;n.nodeValue=localizeNodeText(n.nodeValue)});
 document.querySelectorAll('[placeholder],[aria-label]').forEach(function(e){['placeholder','aria-label'].forEach(function(a){var v=e.getAttribute(a);if(v)e.setAttribute(a,localizeNodeText(v))})});
 var navLabels={hs:'경기 목록',att:'출석',tm:'출전시간',fm:'작전판',pl:'선수',cf:'설정'};
 document.querySelectorAll('.nav button').forEach(function(b){b.textContent=tr(navLabels[b.dataset.tab])});
 document.title=tr('앱 제목');
}
function pad(n){return String(n).padStart(2,'0')}
function today(){var d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function fresh(){return {team:'우리 팀',date:today(),members:[],att:{},qn:5,qmin:25,defaultQn:5,defaultQmin:25,q:[],tab:'att',cq:0,hist:[],sort:'name',guests:[],sc:[],opp:''}}
function load(){try{var r=localStorage.getItem(KEY);return r?JSON.parse(r):null}catch(e){return null}}
var S=Object.assign(fresh(),load()||{});
S.hist=S.hist||[];S.hist.forEach(function(r){if(!r.id)r.id=uid()});
function teamSnapshot(){var d={};Object.keys(S).forEach(function(k){if(k!=='teams'&&k!=='activeTeamId')d[k]=S[k]});return JSON.parse(JSON.stringify(d))}
function syncTeam(){var t=(S.teams||[]).find(function(x){return x.id===S.activeTeamId});if(t){t.name=S.team||t.name||'우리 팀';t.image=S.teamImage||'';t.data=teamSnapshot()}}
function ensureTeams(){
 if(!Array.isArray(S.teams))S.teams=[];
 S.teams.forEach(function(t){if(!t.id)t.id=uid()});
 if(!S.teams.length){var id=uid();S.activeTeamId=id;S.teams.push({id:id,name:S.team||'우리 팀',image:S.teamImage||'',data:teamSnapshot()})}
 var active=S.teams.find(function(t){return t.id===S.activeTeamId});
 if(!active){active=S.teams[0];S.activeTeamId=active.id;Object.assign(S,fresh(),JSON.parse(JSON.stringify(active.data||{})))}
 syncTeam()
}
ensureTeams();
function save(){if(S.matchId)saveMatch();syncTeam();try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function uid(){return Math.random().toString(36).slice(2,8)+Date.now().toString(36).slice(-3)}
function fmtDate(s){var p=s.split('-');return new Date(+p[0],+p[1]-1,+p[2]).toLocaleDateString(LANGS[LANG].locale,{month:'long',day:'numeric',weekday:'short'})}
function setTeamImage(file){if(!file)return;
 if(!/^image\//.test(file.type)||file.size>15*1024*1024){toast('이미지는 15MB 이하 파일을 선택해 주세요');return}
 var reader=new FileReader();
 reader.onerror=function(){toast('앰블럼 이미지를 읽지 못했어요')};
 reader.onload=function(){var img=new Image();
  img.onerror=function(){toast('앰블럼 이미지 형식을 확인해 주세요')};
  img.onload=function(){try{var scale=Math.min(1,256/Math.max(img.naturalWidth,img.naturalHeight)),w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale)),canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
    var ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas is unavailable');
    ctx.drawImage(img,0,0,w,h);var image=canvas.toDataURL('image/webp',.82);
    if(image.length>500000){toast('이미지 용량이 커서 저장하지 못했어요');return}
    S.teamImage=image;save();render();toast('팀 앰블럼을 저장했어요')
   }catch(err){toast('앰블럼 이미지를 처리하지 못했어요')}}
  img.src=String(reader.result||'')};
 reader.readAsDataURL(file)}
function slotDefs(f){var L=FORMS[f],n=L.length,out=[{g:'GK',x:50,y:92}];
 out[0].rowSize=1;L.forEach(function(c,i){var progress=n>1?i/(n-1):.5,y=n>1?75-47*progress+(i&&i<n-1?2.5*Math.sin(Math.PI*progress):0):50,g=i===0?'DF':(i===n-1?'FW':'MF');for(var j=0;j<c;j++)out.push({g:g,x:(j+1)/(c+1)*100,y:y,rowSize:c})});return out}
function opponentDefs(){return slotDefs('4-3-3').map(function(d,i){return {x:d.x,y:i===0?8:i<=4?18:i<=7?38:65}})}
function clampCoord(n){return Math.max(4,Math.min(96,+n||50))}
function fixCoords(coords,count){coords=coords&&typeof coords==='object'?coords:{};Object.keys(coords).forEach(function(i){var c=coords[i];if(+i<0||+i>=count||!c||!isFinite(+c.x)||!isFinite(+c.y))delete coords[i];else coords[i]={x:clampCoord(c.x),y:clampCoord(c.y)}});return coords}
function resizeQuarters(count){count=Math.max(1,Math.min(MAX_QUARTERS,Math.floor(+count||1)));
 while(S.q.length<count)S.q.push({f:S.q.length?S.q[S.q.length-1].f:'4-3-3',s:[]});S.q.length=count;S.qn=count;
 S.sc=S.sc||[];while(S.sc.length<count)S.sc.push({a:0,b:0});S.sc.length=count;if(S.cq>=count)S.cq=count-1}
function fixQ(){S.defaultQn=Math.max(1,Math.min(MAX_QUARTERS,Math.floor(+S.defaultQn||5)));S.defaultQmin=Math.max(5,Math.min(45,Math.round(+S.defaultQmin||25)));
 S.qn=Math.max(1,Math.min(MAX_QUARTERS,Math.floor(+S.qn||S.q.length||5)));S.qmin=Math.max(5,Math.min(45,Math.round(+S.qmin||25)));resizeQuarters(S.qn);
 S.q.forEach(function(q){if(!FORMS[q.f])q.f='4-3-3';if(!S.v2&&q.f==='4-4-2'&&!q.s.some(Boolean))q.f='4-3-3';var n=slotDefs(q.f).length;q.s=(q.s||[]).slice(0,n);while(q.s.length<n)q.s.push(null);q.sub=q.sub||{};q.coords=fixCoords(q.coords,n);q.opponentOn=!!q.opponentOn;q.opponentCoords=fixCoords(q.opponentCoords,11);q.ballOn=!!q.ballOn;if(q.ballCoord&&(!isFinite(+q.ballCoord.x)||!isFinite(+q.ballCoord.y)))q.ballCoord=null;else if(q.ballCoord)q.ballCoord={x:clampCoord(q.ballCoord.x),y:clampCoord(q.ballCoord.y)};Object.keys(q.sub).forEach(function(i){if(!q.s[i]||!q.sub[i])delete q.sub[i]})});S.v2=1;if(!S.v3){S.sort='name';S.v3=1}if(S.sort==='add'||S.sort==='pos')S.sort='name';
}
function attendees(){return S.members.filter(function(m){return S.att[m.id]==='y'})}
function formatName(parts,legacy){var first=String(parts&&parts.firstName||'').trim(),middle=String(parts&&parts.middleName||'').trim(),last=String(parts&&parts.lastName||'').trim();
 var ordered=LANG==='ko'?[last,first,middle]:[first,middle,last],name=ordered.filter(Boolean).join(LANG==='ko'?'':' ');return name||legacy||''}
function personName(m){return formatName(m,m&&m.name)}
function recordName(r,id){return formatName(r.nameParts&&r.nameParts[id],r.names&&r.names[id])}
function playerPositions(m){var p=Array.isArray(m.positions)?m.positions:(m.pos&&m.pos!=='ANY'?[m.pos]:[]),seen={};return p.filter(function(x){if(!x||x==='ANY'||seen[x])return false;seen[x]=1;return true}).slice(0,3)}
var POSITION_GROUP={GK:'GK',DF:'DF',CB:'DF',LB:'DF',RB:'DF',LWB:'DF',RWB:'DF',MF:'MF',DM:'MF',CM:'MF',AM:'MF',LM:'MF',RM:'MF',FW:'FW',LW:'FW',RW:'FW',CF:'FW',ST:'FW'};
function positionGroup(p){return POSITION_GROUP[p]||''}
function positionRank(m,group){var p=playerPositions(m),i;for(i=0;i<p.length;i++)if(positionGroup(p[i])===group)return i;return 99}
function setPlayerPositions(m,container){var seen={},positions=Array.from(container.querySelectorAll('select[data-chg="preferredPos"],select[data-chg="newPreferredPos"],select[data-chg="editorPreferredPos"]')).map(function(select){return select.value}).filter(function(p){if(!p||p==='ANY'||seen[p])return false;seen[p]=1;return true}).slice(0,3);m.positions=positions;m.pos=positions[0]||'ANY'}
function positionRankFields(positions,id,isNew,isEditor){var ranks=['1순위','2순위','3순위'],data=isNew?' data-new-rank="':' data-rank="',idAttr=isNew?'':' data-id="'+id+'"',change=isEditor?'editorPreferredPos':(isNew?'newPreferredPos':'preferredPos');
 return '<div class="position-ranks">'+ranks.map(function(label,i){var value=positions[i]||'ANY';return '<label><span>'+tr(label)+'</span><select class="in" data-chg="'+change+'"'+data+i+'"'+idAttr+' aria-label="'+tr(label)+' '+tr('선호 포지션')+'">'+posOpts(value)+'</select></label>'}).join('')+'</div>'}
function indexPeople(){peopleById=Object.create(null);guestIds=Object.create(null);
 S.members.forEach(function(m){peopleById[m.id]=personName(m)});
 S.guests.forEach(function(g){if(!Object.prototype.hasOwnProperty.call(peopleById,g.id))peopleById[g.id]=g.name;guestIds[g.id]=true})}
function nameOf(id){return peopleById[id]||''}
function isGuest(id){return !!guestIds[id]}
function sumSc(src){var a=0,b=0;(src||S.sc).forEach(function(s){a+=s.a;b+=s.b});return {a:a,b:b}}
function scTxt(r){var s=sumSc(r.sc);return (r.opp?tr('대진 접두사')+esc(r.opp)+' ':'')+s.a+' : '+s.b+' '+tr(s.a>s.b?'승':s.a<s.b?'패':'무')}
function resultLabel(a,b){return tr(a>b?'승':a<b?'패':'무')}
function scoreSummary(q,a,b){return tr('{quarter}쿼터 기준, 최종 {home} : {away} {result}',{quarter:q,home:a,away:b,result:resultLabel(a,b)})}
function quarterMinutes(q,fallback){return q&&q.duration!=null?Math.max(5,Math.min(45,+q.duration||fallback)):fallback}
function scoreCard(){var s=S.sc[S.cq],f=sumSc();
 function st(k,l){var side=esc(l);return '<div><span class="lbl">'+l+'</span><div class="step"><button data-act="sc" data-k="'+k+'" data-d="-1" aria-label="'+tr('{side} 점수 {action}',{side:side,action:tr('점수 빼기')})+'">−</button><b>'+s[k]+'</b><button data-act="sc" data-k="'+k+'" data-d="1" aria-label="'+tr('{side} 점수 {action}',{side:side,action:tr('점수 더하기')})+'">+</button></div></div>'}
 return '<section class="card score-card"><div class="scr">'+st('a',tr('우리'))+'<span class="vs">:</span>'+st('b',esc(S.opp||tr('상대')))+'</div><div class="fin">'+scoreSummary(S.cq+1,f.a,f.b)+'</div><p class="note" style="text-align:center;margin:0">'+S.sc.map(function(x,i){return (i+1)+'쿼터 '+x.a+':'+x.b}).join(', ')+'</p><input class="in opp" value="'+esc(S.opp)+'" maxlength="20" placeholder="상대팀 이름 (선택)" data-chg="opp" aria-label="상대팀 이름"></section>'}
function cl(m,qm){return Math.max(1,Math.min(+m||1,qm-1))}
function qinfo(q,id,qm){qm=quarterMinutes(q,qm);var d=slotDefs(q.f),sb=q.sub||{},i=q.s.indexOf(id);
 if(i>=0){var s=sb[i];return {m:s?cl(s.m,qm):qm,g:d[i].g}}
 for(var k in sb){if(sb[k].id===id)return {m:qm-cl(sb[k].m,qm),g:d[+k].g}}
 return null}
function qids(q){var o={};q.s.forEach(function(id){if(id)o[id]=1});Object.keys(q.sub||{}).forEach(function(k){o[q.sub[k].id]=1});return Object.keys(o)}
function cntQ(id){return S.q.filter(function(q){return qinfo(q,id,S.qmin)}).length}
function minsAll(id){return S.q.reduce(function(a,q){var f=qinfo(q,id,S.qmin);return a+(f?f.m:0)},0)}
function modeTabs(c){return '<div class="qt"><button class="'+(c==='st'?'on':'')+'" data-act="pmode" data-v="st">선발</button><button class="'+(c==='sb'?'on':'')+'" data-act="pmode" data-v="sb">교체 선수</button></div>'}
function subSheet(q,defs,at){var i=UI.pick,sb=q.sub[i],qm=quarterMinutes(q,S.qmin),st=q.s[i];
 var h='<div class="shade" data-act="close"></div><div class="sheet" role="dialog"><h3>'+defs[i].g+' 자리 교체</h3>'+modeTabs('sb');
 h+='<p class="note">선발 '+esc(nameOf(st))+'. 교체 시각을 입력하고 투입할 선수를 고르세요.</p>';
 if(sb){var m=cl(sb.m,qm);h+='<p class="note"><b>'+esc(nameOf(sb.id))+'</b> 투입, '+m+'분 교체. '+esc(nameOf(st))+' '+m+'분, '+esc(nameOf(sb.id))+' '+(qm-m)+'분 출전</p><button class="btn ghost" data-act="clearsub">교체 해제</button>'}
 h+='<label class="lbl" for="subMin">'+tr('교체 시각 (쿼터 시작 후 분, 1~{max})',{max:qm-1})+'</label><input id="subMin" class="in" type="number" min="1" max="'+(qm-1)+'" value="'+(sb?cl(sb.m,qm):cl(15,qm))+'">';
 var us={};Object.keys(q.sub).forEach(function(k){us[q.sub[k].id]=1});
 var cand=at.filter(function(p){return q.s.indexOf(p.id)<0&&(!us[p.id]||(sb&&sb.id===p.id))}).sort(byName);
 h+=cand.map(function(p){return '<button class="pick" data-act="setsub" data-id="'+p.id+'"><span>'+esc(personName(p))+tag(p)+'</span><em>'+(sb&&sb.id===p.id?'현재 교체 선수':minsAll(p.id)+'분 출전')+'</em></button>'}).join('')||'<p class="note">벤치에 남은 선수가 없어요.</p>';
 return h+'<button class="btn ghost" data-act="close">닫기</button></div>'}
function anyFilled(){return S.q.some(function(q){return q.s.some(Boolean)})}
function dropFromLineups(id){S.q.forEach(function(q){q.sub=q.sub||{};q.s=q.s.map(function(x,i){if(x===id)delete q.sub[i];return x===id?null:x});Object.keys(q.sub).forEach(function(i){if(q.sub[i].id===id)delete q.sub[i]})})}
function cno(v){var n=parseInt(v,10);return isNaN(n)?'':String(Math.max(0,Math.min(99,n)))}
function tag(m){if(m.guest)return '<small>'+tr('게스트')+'</small>';var p=[];if(m.no)p.push('#'+esc(m.no));var positions=playerPositions(m);if(positions.length)p.push(positions.map(esc).join(' › '));return p.length?'<small>'+p.join(' ')+'</small>':''}
var SORTS=[['name','이름순 (First name)'],['last','이름순 (Last name)'],['no','등번호순'],['att','참석률순'],['min','누적 출전시간순']];
function sortSel(){return '<div class="sort"><span>명단 정렬</span><select data-chg="sort" aria-label="명단 정렬">'+SORTS.map(function(s){return '<option value="'+s[0]+'"'+(S.sort===s[0]?' selected':'')+'>'+s[1]+'</option>'}).join('')+'</select></div>'}
function compareNames(a,b){return String(a||'').localeCompare(String(b||''),LANGS[LANG].locale)}
function firstNameOf(m){return m.firstName||(!m.lastName?m.name:'')||personName(m)}
function lastNameOf(m){return m.lastName||(!m.firstName?m.name:'')||personName(m)}
function byFirstName(a,b){return compareNames(firstNameOf(a),firstNameOf(b))||compareNames(personName(a),personName(b))}
function byLastName(a,b){return compareNames(lastNameOf(a),lastNameOf(b))||compareNames(personName(a),personName(b))}
function byName(a,b){return byFirstName(a,b)}
function blank(n){return {y:0,n:0,min:0,GK:0,DF:0,MF:0,FW:0,name:n}}
function totals(records){var T={};
 (records||S.hist).forEach(function(r){
  Object.keys(r.att).forEach(function(id){var t=T[id]=T[id]||blank(recordName(r,id));if(r.att[id]==='y')t.y++;else if(r.att[id]==='n')t.n++});
  r.q.forEach(function(q){qids(q).forEach(function(id){if(!recordName(r,id))return;var f=qinfo(q,id,r.qmin);if(!f)return;var t=T[id]=T[id]||blank(recordName(r,id));t[f.g]++;t.min+=f.m})})});
 return T}
function attendanceRate(t){return t&&t.y+t.n?t.y/(t.y+t.n):0}
function sorted(list,statsTotals){var l=list.slice(),T=S.sort==='min'||S.sort==='att'?(statsTotals||totals()):null;
 if(S.sort==='name')l.sort(byFirstName);
 else if(S.sort==='last')l.sort(byLastName);
 else if(S.sort==='no')l.sort(function(a,b){return (+a.no||999)-(+b.no||999)||byName(a,b)});
 else if(S.sort==='att')l.sort(function(a,b){return attendanceRate(T[b.id])-attendanceRate(T[a.id])||byName(a,b)});
 else if(S.sort==='min')l.sort(function(a,b){return (T[b.id]?T[b.id].min:0)-(T[a.id]?T[a.id].min:0)||byName(a,b)});
 return l}
function saveMatch(){var names={},nameParts={},att={};S.members.forEach(function(m){names[m.id]=personName(m);nameParts[m.id]={firstName:m.firstName||'',middleName:m.middleName||'',lastName:m.lastName||''};if(S.att[m.id])att[m.id]=S.att[m.id]});
 var g={};S.guests.forEach(function(x){g[x.id]=x.name});var rec={date:S.date,time:S.matchTime||'',names:names,nameParts:nameParts,att:att,g:g,sc:JSON.parse(JSON.stringify(S.sc)),opp:S.opp,q:JSON.parse(JSON.stringify(S.q)),qn:S.qn,qmin:S.qmin};
 var old=S.hist.find(function(r){return r.id===S.matchId});rec.id=S.matchId;rec.createdAt=old?old.createdAt:Date.now();
 var i=S.hist.findIndex(function(r){return r.id===S.matchId});
 if(i>=0)S.hist[i]=rec;else S.hist.push(rec);
 S.hist.sort(function(a,b){return a.date<b.date?1:a.date>b.date?-1:(b.createdAt||0)-(a.createdAt||0)})}
function loadRec(id){var r=S.hist.find(function(x){return x.id===id});if(!r)return;
 var ok={};S.members.forEach(function(m){ok[m.id]=1});Object.keys(r.g||{}).forEach(function(id){ok[id]=1});
 S.matchId=r.id;S.date=r.date;S.matchTime=r.time||'';S.qn=r.qn||r.q.length||5;S.qmin=r.qmin||25;S.att={};S.guests=Object.keys(r.g||{}).map(function(id){return {id:id,name:r.g[id],pos:'ANY',guest:true}});S.sc=JSON.parse(JSON.stringify(r.sc||[]));S.opp=r.opp||'';
 Object.keys(r.att||{}).forEach(function(id){if(ok[id])S.att[id]=r.att[id]});
 S.q=JSON.parse(JSON.stringify(r.q));S.q.forEach(function(q){q.s=q.s.map(function(id){return ok[id]?id:null});q.sub=q.sub||{};Object.keys(q.sub).forEach(function(k){if(!ok[q.sub[k].id])delete q.sub[k]})});S.cq=0}
function hasContent(){return Object.keys(S.att).some(function(k){return S.att[k]&&S.att[k]!=='m'})||anyFilled()||S.guests.length>0||!!S.opp||S.sc.some(function(x){return x.a||x.b})}
function startMatch(d,time){S.matchId=uid();S.date=d;S.matchTime=time||'';S.att={};S.guests=[];S.qmin=S.defaultQmin;S.cq=0;resizeQuarters(S.defaultQn);S.sc=S.q.map(function(){return {a:0,b:0}});S.opp='';S.q.forEach(function(q){q.s=q.s.map(function(){return null});q.sub={};delete q.duration})}
function selectMatchDate(d){if(!d)return;
 if(S.matchId)saveMatch();else if(hasContent()){S.matchId=uid();saveMatch()}
 var matches=S.hist.filter(function(r){return r.date===d});
 if(matches.length>1){UI.dateTarget=d;UI.dateMatches=matches;return}
 if(matches.length&&matches[0].id!==S.matchId)loadRec(matches[0].id);else if(!matches.length&&d!==S.date)startMatch(d)}
function calendarView(forMatch){var p=forMatch?(UI.matchCalendarMonth||UI.matchDate.slice(0,7)):(UI.calendarMonth||S.date.slice(0,7)),parts=p.split('-'),y=+parts[0],m=+parts[1],offset=new Date(y,m-1,1).getDay(),days=new Date(y,m,0).getDate(),available={};
 S.hist.forEach(function(r){available[r.date]=1});
 var current=forMatch?UI.matchDate:S.date,prev=forMatch?'matchCalendarPrev':'calendarPrev',next=forMatch?'matchCalendarNext':'calendarNext',pick=forMatch?'selectMatchDate':'selectCalendarDate',pickerYear=UI.calendarPickerYear||y;
 var weekdays=Array.from({length:7},function(_,i){return new Date(2026,0,4+i).toLocaleDateString(LANGS[LANG].locale,{weekday:'short'})}),monthLabel=new Date(y,m-1,1).toLocaleDateString(LANGS[LANG].locale,{year:'numeric',month:'long'}),months=Array.from({length:12},function(_,i){return new Date(y,i,1).toLocaleDateString(LANGS[LANG].locale,{month:'short'})});
 var h='<div class="calendar-shade"><section class="calendar" role="dialog" aria-modal="true" aria-label="'+(forMatch?'새 경기 날짜와 시간':'경기 날짜 선택')+'">';
 if(UI.calendarMode==='months')h+='<div class="calendar-head year-head"><button data-act="'+prev+'" aria-label="이전 연도">‹</button><label class="calendar-year"><span>'+tr('연도')+'</span><input type="number" min="1" max="9999" value="'+pickerYear+'" data-chg="calendarPickerYear" aria-label="'+tr('연도')+'"></label><button data-act="'+next+'" aria-label="다음 연도">›</button></div><div class="month-grid">'+months.map(function(name,i){return '<button class="'+(y===pickerYear&&m===i+1?'selected':'')+'" data-act="calendarPickMonth" data-month="'+(i+1)+'">'+name+'</button>'}).join('')+'</div><button class="btn ghost calendar-close" data-act="calendarBack">'+tr('달력으로 돌아가기')+'</button>';
 else{
 h+='<div class="calendar-head"><button data-act="'+prev+'" aria-label="이전 달">‹</button><button class="calendar-title" data-act="calendarTitle" aria-label="'+tr('연도와 월 선택')+'">'+monthLabel+'</button><button data-act="'+next+'" aria-label="다음 달">›</button></div><div class="calendar-grid">'+weekdays.map(function(d){return '<span>'+d+'</span>'}).join('');
 for(var i=0;i<offset;i++)h+='<span></span>';
 for(var d=1;d<=days;d++){var key=y+'-'+pad(m)+'-'+pad(d),enabled=forMatch||available[key],classes=(available[key]?'has-match ':'')+(key===current?'selected':'');h+='<button'+(enabled?' class="'+classes.trim()+'" data-act="'+pick+'" data-date="'+key+'"':' disabled aria-label="'+d+'일, 경기 기록 없음"')+'>'+d+'</button>'}
 for(var j=offset+days;j<42;j++)h+='<span></span>';
 h+='</div>'}
 if(forMatch)h+='<div class="calendar-time"><label class="lbl" for="matchTime">경기 시간 (선택)</label><input id="matchTime" type="time" class="in" value="'+esc(UI.matchTime||'')+'"></div><button class="btn calendar-create" data-act="createMatch">이 날짜와 시간으로 경기 만들기</button>';
 return h+'<button class="btn ghost calendar-close" data-act="'+(forMatch?'closeMatchCalendar':'closeCalendar')+'">닫기</button></section></div>'}
function shiftCalendarMonth(forMatch,delta){
 if(UI.calendarMode==='months'){UI.calendarPickerYear=Math.max(1,Math.min(9999,(UI.calendarPickerYear||+(forMatch?UI.matchCalendarMonth:UI.calendarMonth).split('-')[0])+delta));return}
 var key=forMatch?(UI.matchCalendarMonth||UI.matchDate.slice(0,7)):(UI.calendarMonth||S.date.slice(0,7)),parts=key.split('-'),date=new Date(+parts[0],+parts[1]-1+delta,1),month=date.getFullYear()+'-'+pad(date.getMonth()+1);
 if(forMatch)UI.matchCalendarMonth=month;else UI.calendarMonth=month
}
function dismissed(){if(UI.hd)return true;try{return localStorage.getItem('captain-hint')==='1'}catch(e){return false}}
function isIos(){return /iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)}
function isStandalone(){return navigator.standalone===true||(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)}
function isPwa(){return !!document.querySelector('link[rel="manifest"]')}
function installBanner(){if(!isPwa()||dismissed()||isStandalone())return '';
 if(UI.ip)return '<section class="card ib"><b>앱으로 설치할 수 있어요</b><p class="note">홈 화면에 아이콘을 추가하면 앱처럼 바로 열려요.</p><div class="ibb"><button class="btn" data-act="inst">설치하기</button><button class="btn ghost" data-act="hint">닫기</button></div></section>';
 if(isIos())return '<section class="card ib"><b>홈 화면에 추가하기</b><p class="note">Safari의 공유 버튼(네모에 위쪽 화살표)을 누르고 "홈 화면에 추가"를 선택하세요.</p><button class="btn ghost" data-act="hint">닫기</button></section>';
 return ''}
function appUrl(){return location.origin+location.pathname.replace(/index\.html$/,'')}
function qrSvg(t){try{var q=qrcode(0,'M');q.addData(t);q.make();var n=q.getModuleCount(),d='';for(var r=0;r<n;r++)for(var c=0;c<n;c++)if(q.isDark(r,c))d+='M'+(c+4)+' '+(r+4)+'h1v1h-1z';var s=n+8;return '<svg class="qr" viewBox="0 0 '+s+' '+s+'" role="img" aria-label="앱 주소 QR코드" shape-rendering="crispEdges"><rect width="'+s+'" height="'+s+'" fill="#fff"/><path d="'+d+'" fill="#000"/></svg>'}catch(e){return ''}}
function shareCard(){if(!isPwa())return '';var u=appUrl(),qs=window.qrcode?qrSvg(u):'';
 return '<section class="card"><b>팀원에게 앱 공유</b><p class="note">팀원이 카메라로 QR코드를 비추거나 주소로 접속한 뒤 홈 화면에 추가하면 설치돼요.</p>'+(qs||'<p class="note w">QR코드는 인터넷에 연결되어 있을 때 나타나요.</p>')+'<p class="note" style="word-break:break-all;text-align:center">'+esc(u)+'</p><button class="btn" data-act="shareurl">주소 공유하기</button><button class="btn ghost" data-act="copyurl">주소 복사하기</button></section>'}
function bkInfo(){var t=S.lastBk;if(!t)return '<p class="note w">아직 백업한 적이 없어요.</p>';
 var old=Date.now()-t>7*864e5;return '<p class="note'+(old?' w':'')+'">'+tr('마지막 백업')+': '+new Date(t).toLocaleString(LANGS[LANG].locale,{month:'long',day:'numeric',hour:'numeric',minute:'2-digit'})+(old?' ('+tr('7일이 넘었어요')+')':'')+'</p>'}
function teamEditorSheet(){
 return '<div class="shade" data-act="closeTeamEditor"></div><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="teamEditTitle"><h3 id="teamEditTitle">'+tr('팀 수정')+'</h3><div class="team-editor"><button class="crest" data-act="chooseCrest" aria-label="'+tr(S.teamImage?'팀 앰블럼 변경':'팀 앰블럼 추가')+'">'+(S.teamImage?'<img src="'+esc(S.teamImage)+'" alt="'+tr('팀 앰블럼')+'">':tr('앰블럼 추가'))+'</button><div><label class="lbl" for="managedTeamName">'+tr('팀 이름')+'</label><input id="managedTeamName" class="in" value="'+esc(S.team)+'" maxlength="20" data-chg="teamName" aria-label="'+tr('팀 이름')+'"><p class="note">'+tr('최대 20자까지 입력할 수 있어요.')+'</p></div><input id="crestFile" class="crest-file" type="file" accept="image/*" data-chg="crestFile" aria-label="'+tr('팀 앰블럼 이미지 선택')+'"></div><button class="btn ghost" data-act="closeTeamEditor">'+tr('닫기')+'</button></div>'
}
function confirmSheet(){var c=UI.confirm;if(!c)return '';
 return '<div class="shade" data-act="cancelConfirm"></div><div class="sheet confirm-sheet" role="alertdialog" aria-modal="true" aria-labelledby="confirmTitle"><h3 id="confirmTitle">'+esc(tr(c.title))+'</h3><p class="note">'+esc(tr(c.message,c.values))+'</p><div class="confirm-actions"><button class="btn ghost" data-act="cancelConfirm">'+esc(tr('취소'))+'</button><button class="btn warn" data-act="acceptConfirm">'+esc(tr(c.confirmLabel))+'</button></div></div>'}
function requestConfirm(title,message,confirmLabel,callback,values){UI.confirm={title:title,message:message,confirmLabel:confirmLabel,callback:callback,values:values};render()}
function viewLanguage(){
 return '<section class="card"><b>언어 설정</b><label class="lbl" for="appLanguage">앱 표시 언어</label><select id="appLanguage" class="in" data-chg="language" aria-label="앱 표시 언어">'+Object.keys(LANGS).map(function(k){return '<option value="'+k+'"'+(LANG===k?' selected':'')+'>'+LANGS[k].name+'</option>'}).join('')+'</select></section>'
}
function viewMatchDefaults(){
 return '<section class="card match-defaults"><b>기본 경기 설정</b><label class="lbl" for="defaultQn">기본 쿼터 수</label><input id="defaultQn" class="in" type="number" min="1" max="'+MAX_QUARTERS+'" step="1" value="'+S.defaultQn+'" data-chg="defaultQn"><label class="lbl" for="defaultQmin">기본 쿼터당 분</label><input id="defaultQmin" class="in" type="number" min="5" max="45" step="5" value="'+S.defaultQmin+'" data-chg="defaultQmin"></section>'
}
function viewSt(){var kb=Math.max(1,Math.round(JSON.stringify(S).length/1024));
 var h=viewLanguage()+viewMatchDefaults()+shareCard();h+='<section class="card"><b>데이터 백업</b><p class="note">선수 '+S.members.length+'명, 저장된 경기 '+S.hist.length+'건, 약 '+kb+'KB. 데이터는 이 기기의 브라우저에만 저장돼서, 기기를 바꾸거나 브라우저 데이터를 지우면 사라져요. 백업 코드를 메모나 메신저에 보관해 두세요.</p>'+bkInfo()+'<button class="btn" data-act="bkfile">파일로 저장 (iCloud 드라이브에 보관)</button><button class="btn ghost" data-act="exp">백업 코드 복사하기</button><p class="note" style="margin:0">파일 저장을 누르면 나오는 목록에서 "파일에 저장"을 고른 뒤 iCloud Drive 폴더를 선택하세요.</p></section>';
 h+='<section class="card"><b>백업 가져오기</b><p class="note">백업 파일을 고르거나 복사해 둔 백업 코드를 붙여넣으세요. 지금 데이터는 모두 바뀌어요.</p><label class="btn ghost" style="display:flex;align-items:center;justify-content:center;cursor:pointer">백업 파일 선택<input id="impFile" type="file" accept=".json,application/json,text/plain" data-chg="impfile" hidden></label><textarea id="impTxt" class="in ta" placeholder="백업 코드 붙여넣기" aria-label="백업 코드">'+esc(UI.imp||'')+'</textarea><button class="btn" data-act="imp" style="margin-top:10px">가져오기</button></section>';
 h+='<section class="card"><b>데이터 초기화</b><p class="note">선수, 기록, 현재 경기를 모두 지워요. 먼저 백업해 두세요.</p><button class="btn ghost" data-act="wipe" style="color:var(--no)">모든 데이터 지우기</button></section>';
 return h}
function recMins(r){var m={};r.q.forEach(function(q){qids(q).forEach(function(id){var f=qinfo(q,id,r.qmin);if(f)m[id]=(m[id]||0)+f.m})});return m}
function viewDates(){
 var dateCounts={},dateTotals={};
 S.hist.forEach(function(r){dateTotals[r.date]=(dateTotals[r.date]||0)+1});
 var h='';
 if(S.hist.length)h+='<p class="note match-instruction">경기를 누르면 기록을 불러와요.</p>'+S.hist.map(function(r){var m=recMins(r),ys=Object.keys(r.att||{}).filter(function(id){return r.att[id]==='y'}),n=dateCounts[r.date]=(dateCounts[r.date]||0)+1;
  var durationNotes=r.q.map(function(q,i){var qm=quarterMinutes(q,r.qmin);return qm!==r.qmin?(i+1)+'쿼터 '+qm+'분':''}).filter(Boolean).join(', ');
  return '<section class="rec"><button class="nm lnk" data-act="loadrec" data-id="'+r.id+'">'+esc(fmtDate(r.date))+(r.time?' · '+esc(r.time):'')+(dateTotals[r.date]>1?' · '+(dateTotals[r.date]-n+1)+'번째 경기':' 경기')+'<small>'+(r.opp?'vs '+esc(r.opp)+', ':'')+(r.sc?scTxt(r)+', ':'')+'참석 '+ys.length+'명, '+r.qn+'쿼터 x '+r.qmin+'분'+(durationNotes?' · '+durationNotes:'')+'</small></button><button class="x" data-act="delrec" data-id="'+r.id+'">'+tr('삭제')+'</button><details><summary>선수별 출전 시간</summary><p class="note">'+(ys.map(function(id){return esc(recordName(r,id))+' '+(m[id]||0)+'분'}).concat(Object.keys(r.g||{}).map(function(id){return esc(r.g[id])+'(게스트) '+(m[id]||0)+'분'})).join(', ')||'참석자 없음')+'</p></details></section>'}).join('');
 else h+='<p class="note">아직 경기가 없어요. 경기 추가를 눌러 새 경기를 만들어 주세요.</p>';
 return h}
function viewAll(){
 if(!S.hist.length)return '<section class="card empty"><p>저장된 경기가 없어요. 경기 날짜를 바꾸면 여기에 누적 기록이 쌓여요.</p></section>';
 var period=UI.statsPeriod||'all',todayDate=today(),start='',end=todayDate;
 if(period==='30'||period==='90'){var since=new Date();since.setDate(since.getDate()-(+period-1));start=since.getFullYear()+'-'+pad(since.getMonth()+1)+'-'+pad(since.getDate())}
 else if(period==='year')start=todayDate.slice(0,4)+'-01-01';
 else if(period==='custom'){start=UI.statsFrom||'';end=UI.statsTo||''}
 else end='';
 var matches=S.hist.filter(function(r){return (!start||r.date>=start)&&(!end||r.date<=end)}),T=totals(matches),list=Object.keys(T).map(function(id){var m=S.members.find(function(x){return x.id===id});return {id:id,name:m?personName(m):T[id].name,active:m?isAct(m):false,why:m&&!isAct(m)?(m.why||'Inactive'):'',no:m?m.no:''}});
 list=list.filter(function(p){return (UI.statsStatus||'all')==='all'||(UI.statsStatus==='on')===p.active});
 list=sorted(list,T);
 var h='<div class="stats-filters"><label>'+tr('선수 상태')+'<select class="in" data-chg="statsStatus"><option value="all"'+((UI.statsStatus||'all')==='all'?' selected':'')+'>'+tr('전체')+'</option><option value="on"'+(UI.statsStatus==='on'?' selected':'')+'>'+tr('활성 선수')+'</option><option value="off"'+(UI.statsStatus==='off'?' selected':'')+'>'+tr('비활성 선수')+'</option></select></label><label>'+tr('기간')+'<select class="in" data-chg="statsPeriod"><option value="all"'+(period==='all'?' selected':'')+'>'+tr('전체 기간')+'</option><option value="30"'+(period==='30'?' selected':'')+'>'+tr('최근 30일')+'</option><option value="90"'+(period==='90'?' selected':'')+'>'+tr('최근 90일')+'</option><option value="year"'+(period==='year'?' selected':'')+'>'+tr('올해')+'</option><option value="custom"'+(period==='custom'?' selected':'')+'>'+tr('직접 선택')+'</option></select></label>'+(period==='custom'?'<label>'+tr('시작일')+'<input type="date" class="in" data-chg="statsFrom" value="'+esc(UI.statsFrom||'')+'"></label><label>'+tr('종료일')+'<input type="date" class="in" data-chg="statsTo" value="'+esc(UI.statsTo||'')+'"></label>':'')+'</div>'+sortSel();
 if(!matches.length)h+='<p class="note">'+tr('이 기간에 기록된 경기가 없어요.')+'</p>';
 if(matches.length&&!list.length)h+='<p class="note">'+tr('해당하는 선수가 없어요.')+'</p>';
 else if(matches.length)h+='<div class="tw"><table><thead><tr><th>이름</th><th>등번호</th><th>참석</th><th>불참</th><th>출석률</th><th>출전분</th><th>평균</th></tr></thead><tbody>';
 list.forEach(function(p){var t=T[p.id],rate=t.y+t.n?Math.round(t.y/(t.y+t.n)*100)+'%':'-';h+='<tr><td>'+esc(p.name)+(p.why?'<small>'+esc(p.why)+'</small>':'')+'</td><td>'+(p.no?'#'+esc(p.no):'-')+'</td><td>'+t.y+'</td><td>'+t.n+'</td><td>'+rate+'</td><td>'+t.min+'</td><td>'+(t.y?Math.round(t.min/t.y):'-')+'</td></tr>'});
 if(list.length&&matches.length)h+='</tbody></table></div>';
 var w=0,dr=0,l=0,gf=0,ga=0;matches.forEach(function(r){if(!r.sc)return;var s=sumSc(r.sc);gf+=s.a;ga+=s.b;if(s.a>s.b)w++;else if(s.a<s.b)l++;else dr++});return h+'<p class="note">전적 '+w+'승 '+dr+'무 '+l+'패, 득점 '+gf+' 실점 '+ga+'</p><p class="note">총 '+matches.length+'경기 기록. 출전분은 누적 분, 평균은 참석한 경기당 분이에요.</p>'}
function viewHs(){return viewDates()}
function isAct(m){return m.act!==false}
var POSL=['GK','CB','LB','RB','LWB','RWB','DF','DM','CM','AM','LM','RM','MF','LW','RW','CF','ST','FW'];
var POS_LABELS={GK:'골키퍼',CB:'센터백',LB:'왼쪽 풀백',RB:'오른쪽 풀백',LWB:'왼쪽 윙백',RWB:'오른쪽 윙백',DF:'수비수 (전체)',DM:'수비형 미드필더',CM:'중앙 미드필더',AM:'공격형 미드필더',LM:'왼쪽 미드필더',RM:'오른쪽 미드필더',MF:'미드필더 (전체)',LW:'왼쪽 윙어',RW:'오른쪽 윙어',CF:'센터 포워드',ST:'스트라이커',FW:'공격수 (전체)'};
function posOpts(sel){return '<option value="ANY"'+((!sel||sel==='ANY')?' selected':'')+'>'+tr('무관')+'</option>'+POSL.map(function(p){return '<option value="'+p+'"'+(sel===p?' selected':'')+'>'+tr(POS_LABELS[p])+' ('+p+')</option>'}).join('')}

function viewAtt(){var ms=sorted(S.members.filter(isAct)),c={y:0,n:0},off=S.members.length-ms.length;
 ms.forEach(function(m){var v=S.att[m.id];if(v==='y')c.y++;else if(v==='n')c.n++});
 var h='<section class="card attendance-summary"><div class="stats"><div><b>'+c.y+'</b>참석</div><div><b>'+c.n+'</b>불참</div></div></section>';
 if(ms.length>1)h+=sortSel();
 if(!ms.length)h+='<section class="card empty"><p>Active 선수가 없어요. 선수 탭에서 선수를 추가하거나 Active로 바꿔 주세요.</p><button class="btn" data-tab="pl">선수 탭으로 이동</button></section>';
 else h+='<section class="list attendance-roster">'+ms.map(function(m){var v=S.att[m.id]||'n';
  return '<div class="row"><div class="nm">'+esc(personName(m))+tag(m)+'</div><div class="seg">'+[['y','참석'],['n','불참']].map(function(a){return '<button class="'+a[0]+(v===a[0]?' on':'')+'" data-act="att" data-id="'+m.id+'" data-v="'+a[0]+'">'+a[1]+'</button>'}).join('')+'</div></div>'}).join('')+'</section>';
 if(off)h+='<p class="note">Inactive 선수 '+off+'명은 출석 목록에 나오지 않아요.</p>';
 h+='<section class="card"><b>게스트</b><div class="add"><input id="gName" class="in" maxlength="10" placeholder="게스트 이름" aria-label="게스트 이름"><button class="btn" data-act="addguest" data-in="gName">추가</button></div>'+S.guests.map(function(g){return '<div class="mrow"><div class="nm">'+esc(g.name)+'<small>게스트</small></div><button class="x" data-act="delguest" data-id="'+g.id+'">'+tr('삭제')+'</button></div>'}).join('')+(S.guests.length?'':'<p class="note" style="margin:0">'+tr('작전판 탭의 자리 선택에서도 바로 추가할 수 있어요.')+'</p>')+'</section>';
 return h}

function playerEditorSheet(){
 var p=UI.playerEditor;if(!p)return '';
 return '<div class="shade" data-act="closePlayerEditor"></div><div class="sheet player-editor" role="dialog" aria-modal="true" aria-labelledby="playerEditorTitle"><h3 id="playerEditorTitle">'+tr(p.id?'선수 정보 수정':'선수 추가')+'</h3><div class="name-fields"><label><span>'+tr('이름 (First name)')+'</span><input id="editorFirstName" class="in" data-editor-field="firstName" maxlength="30" autocomplete="given-name" value="'+esc(p.firstName||'')+'"></label><label><span>'+tr('미들네임 (선택)')+'</span><input id="editorMiddleName" class="in" data-editor-field="middleName" maxlength="30" autocomplete="additional-name" value="'+esc(p.middleName||'')+'"></label><label><span>'+tr('성 (Last name)')+'</span><input id="editorLastName" class="in" data-editor-field="lastName" maxlength="30" autocomplete="family-name" value="'+esc(p.lastName||'')+'"></label></div><label class="lbl">'+tr('등번호')+'<input id="editorNo" class="in" data-editor-field="no" type="number" inputmode="numeric" min="0" max="99" value="'+esc(p.no||'')+'"></label>'+positionRankFields(p.positions||[],p.id||'',false,true)+'<label class="lbl">'+tr('선수 상태')+'</label><div class="seg editor-status"><button class="y'+(p.act?' on':'')+'" data-act="playerEditorActive" data-v="on">Active</button><button class="n'+(!p.act?' on':'')+'" data-act="playerEditorActive" data-v="off">Inactive</button></div>'+(!p.act?'<label class="lbl">'+tr('Inactive 사유')+'<select id="editorWhy" class="in" data-editor-field="why">'+['부상','은퇴','휴식','기타'].map(function(w){return '<option'+((p.why||'부상')===w?' selected':'')+'>'+tr(w)+'</option>'}).join('')+'</select></label>':'')+'<div class="confirm-actions"><button class="btn ghost" data-act="closePlayerEditor">'+tr('취소')+'</button><button class="btn" data-act="savePlayer">'+tr('저장')+'</button></div></div>'
}
function openPlayerEditor(member){
 UI.playerEditor=member?{id:member.id,firstName:member.firstName||(!member.lastName?member.name||'':''),middleName:member.middleName||'',lastName:member.lastName||'',legacyName:member.name||'',no:member.no||'',positions:playerPositions(member),act:isAct(member),why:member.why||'부상'}:{firstName:'',middleName:'',lastName:'',legacyName:'',no:'',positions:[],act:true,why:'부상'};
 render()
}
function viewPl(){var ms=S.members,na=ms.filter(isAct).length,f=UI.pf||'all',cn={};ms.forEach(function(m){if(m.no)cn[m.no]=(cn[m.no]||0)+1});
 var list=sorted(ms.filter(function(m){return f==='all'||(f==='on')===isAct(m)}));
 var h='<section class="card player-summary"><div class="stats"><div><b>'+na+'</b>Active</div><div><b>'+(ms.length-na)+'</b>Inactive</div><div><b>'+ms.length+'</b>전체</div></div></section><button class="btn player-add-button" data-act="newPlayer">'+tr('선수 추가')+'</button>';
 if(!ms.length)return h+'<section class="card empty"><p>아직 선수가 없어요. 이름을 추가하거나 예시 명단으로 시작해 보세요.</p><button class="btn" data-act="sample">예시 명단 넣어보기</button></section>';
 h+='<div class="qt">'+[['all','전체'],['on','Active'],['off','Inactive']].map(function(x){return '<button class="'+(f===x[0]?'on':'')+'" data-act="pf" data-v="'+x[0]+'">'+x[1]+'</button>'}).join('')+'</div>';
 if(ms.length>1)h+=sortSel();
 if(!list.length)return h+'<p class="note">해당하는 선수가 없어요.</p>';
 return h+'<div class="player-grid">'+list.map(function(m){var a=isAct(m),positions=playerPositions(m);
  return '<section class="card pr compact-player'+(a?'':' off')+'"><div class="compact-player-main"><div class="nm"><span class="player-display-name">'+esc(personName(m))+'</span>'+(m.no?'<small>#'+esc(m.no)+'</small>':'')+(m.no&&cn[m.no]>1?'<small class="duplicate-no">'+tr('번호 중복')+'</small>':'')+'</div><button class="x" data-act="editPlayer" data-id="'+m.id+'">'+tr('수정')+'</button></div><div class="compact-player-meta"><span class="status-label">'+tr(a?'활성 선수':'비활성 선수')+'</span><span>'+esc(positions.length?positions.join(' › '):tr('무관'))+'</span>'+(m.why&&!a?'<span>'+tr(m.why)+'</span>':'')+'</div></section>'}).join('')+'</div>'}

function viewFm(){var q=S.q[S.cq],defs=slotDefs(q.f),at=attendees();
 var h='<div class="quarter-nav"><div class="qt">'+S.q.map(function(_,i){var removable=i===S.qn-1&&S.qn>1;return '<span class="quarter-tab'+(removable?' removable':'')+'"><button class="quarter-select'+(i===S.cq?' on':'')+'" data-act="q" data-i="'+i+'">'+(i+1)+'쿼터</button>'+(removable?'<button class="quarter-remove" type="button" data-act="removeQuarter" aria-label="'+tr('마지막 쿼터 삭제')+'">×</button>':'')+'</span>'}).join('')+'<button class="quarter-add" type="button" data-act="addQuarter" aria-label="'+tr('쿼터 추가')+'"'+(S.qn>=MAX_QUARTERS?' disabled':'')+'>+</button></div></div>';
 h+='<div class="bar"><select data-chg="form" aria-label="포메이션">'+Object.keys(FORMS).map(function(k){return '<option value="'+k+'"'+(k===q.f?' selected':'')+'>'+k+' ('+(FORMS[k].reduce(function(a,b){return a+b},0)+1)+'인)</option>'}).join('')+'</select><label class="quarter-duration"><span>'+tr('쿼터 시간')+'</span><input type="number" min="5" max="45" step="5" value="'+quarterMinutes(q,S.qmin)+'" data-chg="quarterMinutes" aria-label="'+tr('쿼터 시간')+'"><span>'+tr('분')+'</span><button type="button" data-act="resetQuarterMinutes" aria-label="'+tr('기본 시간으로 되돌리기')+'"'+(q.duration==null?' hidden':'')+'>↺</button></label></div>';
 h+='<div class="pitch-panel">'+(S.cq>0?'<button class="btn ghost pitch-copy" data-act="copyprev">'+tr('이전 쿼터 배치 복사')+'</button>':'');
 if(!at.length)h+='<p class="note w">출석 탭에서 참석자를 먼저 체크해 주세요.</p>';
 var opponentBase=opponentDefs(),hasMovedPositions=Object.keys(q.coords||{}).length||Object.keys(q.opponentCoords||{}).length||q.ballCoord;
 h+='<div class="pitch-hint"><p class="note">'+tr('선수 아이콘을 드래그해 위치를 조정할 수 있어요.')+'</p><div class="pitch-tools"><button class="pitch-toggle'+(q.opponentOn?' on':'')+'" type="button" data-act="toggleOpponent" aria-pressed="'+q.opponentOn+'" aria-label="'+tr('상대팀 표시')+'"><span class="opponent-toggle-icon" aria-hidden="true"><i></i><i></i><i></i></span>'+tr('상대팀')+'</button><button class="pitch-toggle'+(q.ballOn?' on':'')+'" type="button" data-act="toggleBall" aria-pressed="'+q.ballOn+'" aria-label="'+tr('축구공 표시')+'"><span aria-hidden="true">⚽</span>'+tr('축구공')+'</button>'+(hasMovedPositions?'<button class="pitch-reset" type="button" data-act="resetPositions" aria-label="'+tr('작전판 위치 초기화')+'" title="'+tr('작전판 위치 초기화')+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 0 0-14.9-3L3 11m0-6v6h6m-5 2a8 8 0 0 0 14.9 3L21 13m0 6v-6h-6"/></svg></button>':'')+'</div></div><div class="pitch"><i class="hl"></i><i class="cc"></i><i class="bx t"></i><i class="bx b"></i>'+defs.map(function(d,i){var id=q.s[i],coord=q.coords&&q.coords[i],x=coord?clampCoord(coord.x):d.x,y=coord?clampCoord(coord.y):d.y;
  var label=id?nameOf(id):'',labelFont=Math.max(10,Math.min(13,150/Math.max(1,Array.from(label).length)));
  return '<button class="slot g-'+d.g+'" style="left:'+x+'%;top:'+y+'%;--chip-column:'+100/(d.rowSize+1)+'cqw;--chip-font:'+labelFont+'px" data-act="slot" data-i="'+i+'" aria-label="'+d.g+' 자리'+(id?' '+esc(label):'')+'">'+(id?'<span class="chip'+(isGuest(id)?' gs':'')+'" title="'+esc(label)+'">'+esc(label)+'</span>'+(q.sub[i]?'<span class="sbc">'+cl(q.sub[i].m,quarterMinutes(q,S.qmin))+'’'+esc(nameOf(q.sub[i].id))+'</span>':''):'<span class="chip e">'+d.g+'</span>')+'</button>'}).join('')+(q.opponentOn?opponentBase.map(function(d,i){var coord=q.opponentCoords[i],x=coord?coord.x:d.x,y=coord?coord.y:d.y;return '<div class="opponent-token pitch-draggable" style="left:'+x+'%;top:'+y+'%" data-drag-type="opponent" data-i="'+i+'" role="img" aria-label="'+tr('상대팀 선수')+'"></div>'}).join(''):'')+(q.ballOn?'<div class="ball-marker pitch-draggable" style="left:'+(q.ballCoord?q.ballCoord.x:50)+'%;top:'+(q.ballCoord?q.ballCoord.y:50)+'%" data-drag-type="ball" role="img" aria-label="'+tr('축구공')+'"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.5" fill="#fff" stroke="#1b241d"/><path d="m12 6 4 2.8-1.5 4.6h-5L8 8.8 12 6Zm-4-1.4 4-3m4.2 4.4 4.2-1.3M16 13.4l2.2 4.2m-8.7-4.2L7.3 18m.7-9.2L3.8 7.5m13.6 9.9 3.4 1.8m-13.5-.8-3.1 2.2" fill="#16231A" stroke="#16231A" stroke-width=".5" stroke-linejoin="round"/></svg></div>':'')+'</div></div>';
 var bench=at.concat(S.guests).filter(function(m){return q.s.indexOf(m.id)<0}).map(function(m){return esc(m.guest?m.name:personName(m))+(m.guest?'(게스트)':'')});
 h+='<div class="fm-side"><p class="bench"><b>벤치</b> '+(bench.length?bench.join(', '):'없음')+'</p>'+scoreCard()+'</div>';return h}

function viewTm(){var mode=UI.tmView||'match',h='<div class="qt tm-view-tabs"><button class="'+(mode==='match'?'on':'')+'" data-act="tmv" data-v="match">현재 경기</button><button class="'+(mode==='all'?'on':'')+'" data-act="tmv" data-v="all">통합 기록</button></div>';
 if(mode==='all')return h+viewAll();
 var at=sorted(attendees().concat(S.guests.filter(function(g){return cntQ(g.id)>0}))),ms=sorted(attendees());
 h+='<section class="card attendee-card"><b>참석자</b><p class="note">참석은 출석 탭에서 선택해 주세요.</p>';
 if(ms.length)h+='<div class="list attendee-grid">'+ms.map(function(m){
  return '<div class="row"><div class="nm">'+esc(personName(m))+tag(m)+'</div></div>'}).join('')+'</div>';
 else h+='<p class="note w">참석자가 없어요. 출석 탭에서 참석자를 선택해 주세요.</p>';
 h+='<button class="btn" data-act="auto">빈 자리에 참석자 자동 배치</button></section>';
 if(!at.length)return h+'<p class="note w">참석자를 선택한 뒤 자동 배치할 수 있어요.</p>';
 h+='<div class="tw"><table><thead><tr><th>이름</th>'+S.q.map(function(_,i){return '<th>'+(i+1)+'쿼터</th>'}).join('')+'<th>합계</th></tr></thead><tbody>';
 var mins=[],zero=[];
 at.forEach(function(m){var n=minsAll(m.id);mins.push(n);if(!n)zero.push(personName(m));
  h+='<tr><td>'+esc(personName(m))+(m.guest?'<small>게스트</small>':'')+'</td>'+S.q.map(function(q){var qm=quarterMinutes(q,S.qmin),f=qinfo(q,m.id,S.qmin);return f?'<td><span class="dot g-'+f.g+'"></span>'+(f.m<qm?'<small>'+f.m+'분</small>':'')+'</td>':'<td class="off">–</td>'}).join('')+'<td class="'+(n?'':'z')+'">'+n+'분</td></tr>'});
 h+='</tbody></table></div>';
 if(!anyFilled())h+='<p class="note">'+tr('아직 배치된 선수가 없어요. 작전판 탭에서 선수를 배치해 보세요.')+'</p>';
 else if(zero.length)h+='<p class="note w">출전 없음: '+zero.map(esc).join(', ')+'</p>';
 else h+='<p class="note">출전 시간 차이는 최대 '+(Math.max.apply(null,mins)-Math.min.apply(null,mins))+'분이에요.</p>';
 return h}

function sheet(){
 if(UI.text!=null)return '<div class="shade" data-act="close"></div><div class="sheet" role="dialog"><h3>직접 복사하기</h3><textarea readonly class="in ta">'+esc(UI.text)+'</textarea><button class="btn" data-act="close">닫기</button></div>';
 if(UI.confirm)return confirmSheet();
 if(UI.playerEditor)return playerEditorSheet();
 if(UI.teamEditOpen)return teamEditorSheet();
 if(UI.matchCalendarOpen)return calendarView(true);
 if(UI.calendarOpen)return calendarView(false);
 if(UI.dateMatches)return '<div class="shade" data-act="closeDateMatches"></div><div class="sheet" role="dialog" aria-label="경기 기록 선택"><h3>'+esc(fmtDate(UI.dateTarget))+' 경기 기록</h3><p class="note">불러올 기록을 선택해 주세요.</p>'+UI.dateMatches.map(function(r,i){return '<button class="pick" data-act="chooseDateMatch" data-id="'+r.id+'"><span>'+esc(fmtDate(r.date))+' 경기 '+(i+1)+'</span><em>'+(r.opp?'vs '+esc(r.opp)+' · ':'')+scTxt(r)+'</em></button>'}).join('')+'<button class="btn ghost" data-act="closeDateMatches">취소</button></div>';
 if(UI.pick==null)return '';
 var q=S.q[S.cq],defs=slotDefs(q.f),at=attendees().concat(S.guests);
 if(UI.pm==='sb'&&q.s[UI.pick])return subSheet(q,defs,at);
 var free=at.filter(function(m){return q.s.indexOf(m.id)<0}).sort(byName);
 var used=at.filter(function(m){return q.s.indexOf(m.id)>=0}).sort(byName);
 function item(m){var j=q.s.indexOf(m.id);return '<button class="pick" data-act="assign" data-id="'+m.id+'"><span>'+esc(personName(m))+tag(m)+'</span><em>'+(j>=0?'이 쿼터 '+defs[j].g+' 배치됨':cntQ(m.id)+'쿼터 출전')+'</em></button>'}
 var h='<div class="shade" data-act="close"></div><div class="sheet" role="dialog"><h3>'+defs[UI.pick].g+' 자리에 배치</h3>'+modeTabs('st');
 h+=(free.concat(used)).map(item).join('')||'<p class="note">출석 탭에서 참석자를 먼저 체크해 주세요.</p>';
 h+='<div class="add"><input id="gName2" class="in" maxlength="10" placeholder="게스트 이름" aria-label="게스트 이름"><button class="btn" data-act="addguest" data-in="gName2">게스트 추가</button></div>';
 if(q.s[UI.pick])h+='<button class="btn ghost" data-act="clear">이 자리 비우기</button>';
 return h+'<button class="btn ghost" data-act="close">닫기</button></div>'}

function render(){fixQ();indexPeople();
 S.members.forEach(function(m){if(isAct(m)&&(!S.att[m.id]||S.att[m.id]==='m'))S.att[m.id]='n'});
 var h='<div class="page-header"><div class="head"><div class="team-switch" aria-label="현재 팀 '+esc(S.team)+'"><span class="crest">'+(S.teamImage?'<img src="'+esc(S.teamImage)+'" alt="팀 앰블럼">':'앰블럼 없음')+'</span><span class="team">'+esc(S.team)+'</span></div></div>';
 if(S.tab==='hs')h+='<div class="date-wrap"><button class="date-button header-add-match" data-act="menu" aria-expanded="'+(UI.matchCalendarOpen?'true':'false')+'">＋ 경기 추가</button></div>';
 else if(S.tab!=='cf'&&S.tab!=='pl')h+='<div class="date-wrap"><button class="date-button" data-act="openCalendar" aria-expanded="'+(UI.calendarOpen?'true':'false')+'" aria-label="경기 날짜 선택">'+esc(fmtDate(S.date))+' 경기</button></div>';
 else if(S.tab==='cf')h+='<div class="date-wrap"><button class="date-button header-edit-team" data-act="editTeam">'+tr('팀 수정')+'</button></div>';
 else h+='<div class="date-wrap header-placeholder" aria-hidden="true"></div>';
 h+='</div>';
 var banner=installBanner();
 if(S.tab==='cf')h+=viewSt()+banner;
 else h+=banner+(S.tab==='att'?viewAtt():S.tab==='fm'?viewFm():S.tab==='hs'?viewHs():S.tab==='pl'?viewPl():viewTm());
 var app=document.getElementById('app');app.className='tab-'+S.tab;app.innerHTML=h+sheet();fitTeamName();
 if(teamFitObserver)teamFitObserver.disconnect();
 var teamSwitch=app.querySelector('.team-switch');
 if(teamSwitch&&typeof ResizeObserver!=='undefined'){teamFitObserver=new ResizeObserver(fitTeamName);teamFitObserver.observe(teamSwitch)}
 document.querySelectorAll('.nav button').forEach(function(b){b.classList.toggle('on',b.dataset.tab===S.tab)});localizeUI()}

function changeTab(tab){var tabs=['hs','att','tm','fm','pl','cf'],next=tabs.indexOf(tab);if(next<0)return;
 S.tab=tab;UI.pick=null;UI.menu=false;UI.dateMatches=null;UI.calendarOpen=false;UI.matchCalendarOpen=false;save();render();window.scrollTo(0,0)}
var pitchDrag=null;
document.addEventListener('pointerdown',function(e){
 var marker=e.target.closest('.pitch .slot,.pitch .pitch-draggable');if(!marker||!e.isPrimary||e.button!==0)return;
 var type=marker.dataset.dragType||'player',index=+marker.dataset.i,q=S.q[S.cq];if(type==='player'&&!q.s[index])return;
 var pitch=marker.closest('.pitch'),rect=pitch.getBoundingClientRect();
 pitchDrag={pointerId:e.pointerId,slot:marker,pitch:pitch,rect:rect,qIndex:S.cq,index:index,type:type,startX:e.clientX,startY:e.clientY,x:parseFloat(marker.style.left),y:parseFloat(marker.style.top),moved:false};
 if(marker.setPointerCapture)marker.setPointerCapture(e.pointerId)
});
document.addEventListener('pointermove',function(e){
 var drag=pitchDrag;if(!drag||drag.pointerId!==e.pointerId)return;
 if(Math.abs(e.clientX-drag.startX)>6||Math.abs(e.clientY-drag.startY)>6)drag.moved=true;
 if(!drag.moved)return;
 e.preventDefault();drag.x=clampCoord((e.clientX-drag.rect.left)/drag.rect.width*100);drag.y=clampCoord((e.clientY-drag.rect.top)/drag.rect.height*100);
 drag.slot.style.left=drag.x+'%';drag.slot.style.top=drag.y+'%'
},{passive:false});
document.addEventListener('pointerup',function(e){
 var drag=pitchDrag;if(!drag||drag.pointerId!==e.pointerId)return;pitchDrag=null;
 if(!drag.moved)return;
 e.preventDefault();var q=S.q[drag.qIndex];if(drag.type==='player'){q.coords=q.coords||{};q.coords[drag.index]={x:drag.x,y:drag.y}}else if(drag.type==='opponent'){q.opponentCoords=q.opponentCoords||{};q.opponentCoords[drag.index]={x:drag.x,y:drag.y}}else q.ballCoord={x:drag.x,y:drag.y};UI.dragSuppressUntil=Date.now()+500;save();render()
});
document.addEventListener('pointercancel',function(e){
 if(pitchDrag&&pitchDrag.pointerId===e.pointerId){var moved=pitchDrag.moved;pitchDrag=null;if(moved)render()}
});
var touchGesture=null;
document.addEventListener('touchstart',function(e){
 if(e.touches.length!==1)return;
 var target=e.target,calendar=target.closest('.calendar'),seg=target.closest('.attendance-roster .seg'),button=target.closest('button[data-act="att"]');
 if(calendar){touchGesture={type:'calendar',forMatch:UI.matchCalendarOpen,x:e.touches[0].clientX,y:e.touches[0].clientY};return}
 if(seg&&button){var row=seg.closest('.row');if(row){touchGesture={type:'attendance',id:button.dataset.id,x:e.touches[0].clientX,y:e.touches[0].clientY};return}}
 if(target.closest('button,input,select,textarea,a,.pitch,.sheet,.calendar,.nav,.tw,.seg'))return;
 if(target.closest('#app'))touchGesture={type:'tab',x:e.touches[0].clientX,y:e.touches[0].clientY}
},{passive:true});
document.addEventListener('touchend',function(e){
 if(!touchGesture||!e.changedTouches.length)return;
 var g=touchGesture;touchGesture=null;var dx=e.changedTouches[0].clientX-g.x,dy=e.changedTouches[0].clientY-g.y;
 if(Math.abs(dx)<(g.type==='attendance'?24:60)||Math.abs(dx)<Math.abs(dy)*1.3)return;
 if(g.type==='attendance'){var status=dx<0?'n':'y';if(S.att[g.id]===status)return;e.preventDefault();S.att[g.id]=status;if(status!=='y')dropFromLineups(g.id);save();render();return}
 if(g.type==='calendar'){e.preventDefault();shiftCalendarMonth(g.forMatch,dx<0?1:-1);render();return}
 var tabs=['hs','att','tm','fm','pl','cf'],i=tabs.indexOf(S.tab),next=i+(dx<0?1:-1);if(next>=0&&next<tabs.length){e.preventDefault();changeTab(tabs[next])}
},{passive:false});
document.addEventListener('touchcancel',function(){touchGesture=null},{passive:true});

function fitTeamName(){
 var el=document.querySelector('.team-switch .team');if(!el)return;
 el.style.fontSize='';
 var size=parseFloat(getComputedStyle(el).fontSize),min=10;
 while(el.scrollWidth>el.clientWidth&&size>min){size=Math.max(min,size-1);el.style.fontSize=size+'px'}
}

function toast(t){var el=document.getElementById('toast');el.textContent=localizeNodeText(tr(t));el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(function(){el.classList.remove('show')},1800)}
function lineupText(){var fs=sumSc(),L=[S.team+' '+fmtDate(S.date)+(S.opp?' vs '+S.opp:'')+' 최종 '+fs.a+' : '+fs.b];
 S.q.forEach(function(q,qi){var defs=slotDefs(q.f);L.push('',(qi+1)+'쿼터 '+q.f+(S.sc[qi]?' ('+S.sc[qi].a+' : '+S.sc[qi].b+')':''));
  ['GK','DF','MF','FW'].forEach(function(g){var n=[];defs.forEach(function(d,i){if(d.g===g&&q.s[i])n.push(nameOf(q.s[i])+(isGuest(q.s[i])?'(게스트)':''))});if(n.length)L.push(g+' '+n.join(', '))});
  Object.keys(q.sub||{}).forEach(function(k){var sb=q.sub[k];L.push('교체 '+cl(sb.m,quarterMinutes(q,S.qmin))+'분 '+nameOf(q.s[k])+' → '+nameOf(sb.id))});var b=attendees().filter(function(m){return q.s.indexOf(m.id)<0}).map(personName);if(b.length)L.push('벤치 '+b.join(', '))});
 return L.join('\n')}
function copyText(t){return new Promise(function(res){
 function fb(){try{var a=document.createElement('textarea');a.value=t;a.style.cssText='position:fixed;opacity:0';document.body.appendChild(a);a.select();var ok=document.execCommand('copy');a.remove();res(ok)}catch(e){res(false)}}
 try{navigator.clipboard.writeText(t).then(function(){res(true)},fb)}catch(e){fb()}})}

function autoAssign(){var ppl=attendees(),cnt={},len=ppl.length,added=0;ppl.forEach(function(p){cnt[p.id]=0});
 S.q.forEach(function(q){var seen={};q.s.forEach(function(id){if(id&&cnt[id]!==undefined&&!seen[id]){cnt[id]++;seen[id]=1}})});
 S.q.forEach(function(q,qi){var defs=slotDefs(q.f),res=q.s.slice(),placed={},empty=0;
  res.forEach(function(id){if(id)placed[id]=1;else empty++});
  if(!empty)return;
  var order=ppl.map(function(p,i){return {p:p,k:(i+qi*3)%Math.max(len,1)}}).filter(function(o){return !placed[o.p.id]}).sort(function(a,b){return cnt[a.p.id]-cnt[b.p.id]||a.k-b.k}).map(function(o){return o.p});
  function preferredIndex(list,group){var best=99,index=-1;list.forEach(function(p,i){var rank=positionRank(p,group);if(rank<best){best=rank;index=i}});return index}
  var chosen=[],gk=preferredIndex(order,'GK');
  if(gk>=0)chosen.push(order.splice(gk,1)[0]);
  chosen=chosen.concat(order).slice(0,empty);
  var left=chosen.slice();
  ['GK','FW','DF','MF'].forEach(function(g){defs.forEach(function(d,i){if(d.g!==g||res[i])return;var k=preferredIndex(left,g);if(k>=0){res[i]=left[k].id;left.splice(k,1)}})});
  defs.forEach(function(d,i){if(!res[i]&&left.length)res[i]=left.shift().id});
  chosen.forEach(function(p){cnt[p.id]++;added++});q.s=res});
 return added}

document.addEventListener('click',function(e){
 if(e.target.classList.contains('calendar-shade')){UI.calendarOpen=false;UI.matchCalendarOpen=false;render();return}
 var t=e.target.closest('[data-act],[data-tab]');if(!t)return;
 if(t.dataset.tab){changeTab(t.dataset.tab);return}
 var a=t.dataset.act,id=t.dataset.id;if(a==='slot'&&Date.now()<UI.dragSuppressUntil)return;
 if(a==='cancelConfirm'){UI.confirm=null;render();return}
 if(a==='acceptConfirm'){var confirmation=UI.confirm;UI.confirm=null;if(confirmation&&confirmation.callback)confirmation.callback();save();render();return}
 if(a==='chooseCrest'){if(!UI.teamEditOpen)return;var ci=document.getElementById('crestFile');if(ci)ci.click();return}
 if(a==='editTeam'){UI.teamEditOpen=true;render();return}
 else if(a==='closeTeamEditor'){UI.teamEditOpen=false;render();return}
 if(a==='menu'){UI.menu=false;UI.matchDate=today();UI.matchTime='20:00';UI.matchCalendarOpen=true;UI.matchCalendarMonth=UI.matchDate.slice(0,7);UI.calendarMode='days';render();return}
 else if(a==='openCalendar'){UI.calendarOpen=!UI.calendarOpen;UI.calendarMonth=S.date.slice(0,7);UI.calendarMode='days';render();return}
 else if(a==='openMatchCalendar'){UI.matchCalendarOpen=!UI.matchCalendarOpen;UI.matchCalendarMonth=UI.matchDate.slice(0,7);UI.calendarMode='days';render();return}
 else if(a==='closeCalendar'){UI.calendarOpen=false;render();return}
 else if(a==='closeMatchCalendar'){UI.matchCalendarOpen=false;render();return}
 else if(a==='calendarTitle'){var cm=UI.matchCalendarOpen?UI.matchCalendarMonth:UI.calendarMonth;UI.calendarPickerYear=+(cm||today().slice(0,7)).slice(0,4);UI.calendarMode='months';render();return}
 else if(a==='calendarBack'){UI.calendarMode='days';render();return}
 else if(a==='calendarPickMonth'){var selectedYear=UI.calendarPickerYear||new Date().getFullYear(),selectedMonth=pad(+t.dataset.month);if(UI.matchCalendarOpen)UI.matchCalendarMonth=selectedYear+'-'+selectedMonth;else UI.calendarMonth=selectedYear+'-'+selectedMonth;UI.calendarMode='days';render();return}
 else if(a==='calendarPrev'||a==='calendarNext'){shiftCalendarMonth(false,a==='calendarPrev'?-1:1);render();return}
 else if(a==='matchCalendarPrev'||a==='matchCalendarNext'){shiftCalendarMonth(true,a==='matchCalendarPrev'?-1:1);render();return}
 else if(a==='selectCalendarDate'){UI.calendarOpen=false;UI.calendarMonth='';selectMatchDate(t.dataset.date);if(!UI.dateMatches)toast('경기 기록을 불러왔어요')}
 else if(a==='selectMatchDate'){UI.matchDate=t.dataset.date}
 else if(a==='closeDateMatches'){UI.dateMatches=null;UI.dateTarget='';render();return}
 else if(a==='chooseDateMatch'){loadRec(id);UI.dateMatches=null;UI.dateTarget='';toast('경기 기록을 불러왔어요')}
 else if(a==='closeMenu'){UI.menu=false}
 else if(a==='matchList'){UI.menu=false;S.tab='hs';save();render();return}
 else if(a==='addPlayer'){UI.menu=false;S.tab='pl';save();openPlayerEditor(null);window.scrollTo(0,0);return}
 else if(a==='createMatch'){var mt=document.getElementById('matchTime');if(!UI.matchDate){toast('경기 날짜를 선택해 주세요');return}if(!S.matchId&&hasContent()){S.matchId=uid();saveMatch()}startMatch(UI.matchDate,mt?mt.value:'');UI.menu=false;UI.matchCalendarOpen=false;S.tab='att';toast('새 경기를 만들었어요')}
 else if(a==='att'){var nextStatus=t.dataset.v;if(nextStatus!=='y'&&S.att[id]==='y'&&S.q.some(function(q){return q.s.indexOf(id)>=0||Object.keys(q.sub||{}).some(function(k){return q.sub[k].id===id})})){requestConfirm('출석 상태 변경 확인','불참으로 변경하면 현재 경기의 모든 배치에서 제외돼요. 계속할까요?','변경',function(){S.att[id]=nextStatus;dropFromLineups(id)});return}S.att[id]=nextStatus;if(nextStatus!=='y')dropFromLineups(id)}
 else if(a==='newPlayer'){openPlayerEditor(null);return}
 else if(a==='editPlayer'){var editMember=S.members.find(function(m){return m.id===id});if(editMember)openPlayerEditor(editMember);return}
 else if(a==='closePlayerEditor'){UI.playerEditor=null;render();return}
 else if(a==='playerEditorActive'){if(UI.playerEditor){UI.playerEditor.act=t.dataset.v==='on';render()}return}
 else if(a==='savePlayer'){var draft=UI.playerEditor;if(!draft)return;var firstName=(document.getElementById('editorFirstName')||{}).value||'',middleName=(document.getElementById('editorMiddleName')||{}).value||'',lastName=(document.getElementById('editorLastName')||{}).value||'',number=(document.getElementById('editorNo')||{}).value||'',why=(document.getElementById('editorWhy')||{}).value||draft.why,rankFields=document.querySelector('.player-editor .position-ranks');if(!firstName.trim()&&!lastName.trim()){toast('이름을 입력해 주세요.');return}var target=draft.id&&S.members.find(function(m){return m.id===draft.id}),wasActive=target?isAct(target):true,willBeActive=draft.act,applyPlayer=function(){var person=target||{id:uid()};person.firstName=firstName.trim();person.middleName=middleName.trim();person.lastName=lastName.trim();person.name=formatName(person,'');person.no=cno(number);person.act=willBeActive;if(!willBeActive)person.why=why||'부상';else delete person.why;if(rankFields)setPlayerPositions(person,rankFields);if(!target)S.members.push(person);if(wasActive&&!willBeActive){delete S.att[person.id];dropFromLineups(person.id)}UI.playerEditor=null};if(target&&wasActive&&!willBeActive&&S.q.some(function(q){return q.s.indexOf(target.id)>=0||Object.keys(q.sub||{}).some(function(k){return q.sub[k].id===target.id})})){requestConfirm('선수 상태 변경 확인','비활성으로 변경하면 현재 경기 출석과 모든 배치에서 제외돼요. 계속할까요?','변경',applyPlayer);return}applyPlayer()}
 else if(a==='toggleOpponent'){S.q[S.cq].opponentOn=!S.q[S.cq].opponentOn}
 else if(a==='toggleBall'){S.q[S.cq].ballOn=!S.q[S.cq].ballOn}
 else if(a==='resetPositions'){var positionQuarter=S.q[S.cq];positionQuarter.coords={};positionQuarter.opponentCoords={};positionQuarter.ballCoord=null;save();render();return}
 else if(a==='sample'){[['김민준','GK'],['이서준','DF'],['박도윤','DF'],['최하준','DF'],['정지호','DF'],['강시우','MF'],['조은우','MF'],['윤지훈','MF'],['장현우','MF'],['임준서','FW'],['한유찬','FW'],['오태민','ANY'],['서건우','ANY'],['신재원','ANY']].forEach(function(p){S.members.push({id:uid(),name:p[0],pos:p[1]})})}
 else  if(a==='del'){var member=S.members.find(function(m){return m.id===id});if(!member)return;requestConfirm('선수 삭제 확인','{name} 선수를 삭제할까요? 현재 경기의 출석과 배치에서도 제외됩니다.','삭제',function(){S.members=S.members.filter(function(m){return m.id!==id});delete S.att[id];dropFromLineups(id)},{name:personName(member)});return}
 else if(a==='q'){S.cq=+t.dataset.i}
 else if(a==='addQuarter'){if(S.qn>=MAX_QUARTERS)return;var last=S.q[S.q.length-1];resizeQuarters(S.qn+1);S.q[S.qn-1].f=last?last.f:'4-3-3';S.cq=S.qn-1}
 else if(a==='removeQuarter'){if(S.qn>1){requestConfirm('쿼터 삭제 확인','마지막 쿼터와 해당 기록을 삭제할까요? 이 작업은 되돌릴 수 없습니다.','삭제',function(){S.q.pop();S.sc.pop();S.qn--;if(S.cq>=S.qn)S.cq=S.qn-1});return}}
 else if(a==='slot'){UI.pick=+t.dataset.i;UI.pm=S.q[S.cq].s[UI.pick]?'sb':'st';render();return}
 else if(a==='assign'){var q=S.q[S.cq],i=UI.pick,prev=q.s[i],j=q.s.indexOf(id);q.sub=q.sub||{};delete q.sub[i];Object.keys(q.sub).forEach(function(k){if(q.sub[k].id===id)delete q.sub[k]});if(j>=0){q.s[j]=prev||null;delete q.sub[j]}q.s[i]=id;UI.pick=null}
 else if(a==='clear'){var clearIndex=UI.pick,clearName=nameOf(S.q[S.cq].s[clearIndex]);requestConfirm('자리 비우기 확인','{name} 선수를 이 자리에서 제외할까요?','비우기',function(){S.q[S.cq].s[clearIndex]=null;delete S.q[S.cq].sub[clearIndex];UI.pick=null},{name:clearName});return}
 else if(a==='close'){UI.pick=null;UI.text=null;render();return}
 else if(a==='tmv'){UI.tmView=t.dataset.v}
 else if(a==='pf'){UI.pf=t.dataset.v}
 else if(a==='inst'){var iv=UI.ip;UI.ip=null;if(iv)iv.prompt()}
 else if(a==='hint'){UI.hd=1;try{localStorage.setItem('captain-hint','1')}catch(err){}}
 else if(a==='shareurl'){var su=appUrl();if(navigator.share){navigator.share({title:'축구팀 주장 수첩',text:'축구팀 주장 수첩 앱 주소예요. 열어서 홈 화면에 추가해 주세요.',url:su}).catch(function(){})}else{copyText(su).then(function(ok){toast(ok?'주소를 복사했어요':'주소를 길게 눌러 복사해 주세요')})}return}
 else if(a==='copyurl'){copyText(appUrl()).then(function(ok){toast(ok?'주소를 복사했어요':'주소를 길게 눌러 복사해 주세요')});return}
 else if(a==='bkfile'){var js=JSON.stringify({app:'captain-notes',v:1,data:S}),fn='captain-backup-'+today()+'.json';
  try{var fl=new File([js],fn,{type:'application/json'});
   if(navigator.canShare&&navigator.canShare({files:[fl]})){navigator.share({files:[fl],title:'주장 수첩 백업'}).then(function(){S.lastBk=Date.now();save();toast('백업을 저장했어요');render()}).catch(function(){});return}
   var bl=new Blob([js],{type:'application/json'}),bu=URL.createObjectURL(bl),an=document.createElement('a');an.href=bu;an.download=fn;document.body.appendChild(an);an.click();an.remove();setTimeout(function(){URL.revokeObjectURL(bu)},4000);S.lastBk=Date.now();toast('백업 파일을 저장했어요')}catch(err){UI.text=js;render();return}}
 else if(a==='exp'){var etx=JSON.stringify({app:'captain-notes',v:1,data:S});copyText(etx).then(function(ok){if(ok){S.lastBk=Date.now();save();toast('백업 코드를 복사했어요');render()}else{UI.text=etx;render()}});return}
 else if(a==='imp'){var ra=(document.getElementById('impTxt')||{}).value||UI.imp||'',dd=null;try{var oo=JSON.parse(ra.trim());if(oo&&oo.app==='captain-notes')dd=oo.data}catch(err){}if(!dd||!Array.isArray(dd.members)||!Array.isArray(dd.hist)){toast('백업 코드를 확인해 주세요');return}requestConfirm('백업 가져오기 확인','현재 데이터를 가져온 백업으로 바꿀까요? 되돌리려면 기존 백업이 필요합니다.','가져오기',function(){S=Object.assign(fresh(),dd);S.hist=S.hist||[];S.hist.forEach(function(r){if(!r.id)r.id=uid()});ensureTeams();S.tab='cf';UI.imp='';UI.pick=null;toast('백업을 가져왔어요')});return}
 else if(a==='wipe'){requestConfirm('데이터 초기화 확인','선수와 모든 경기 기록을 삭제할까요? 이 작업은 되돌릴 수 없습니다.','초기화',function(){S=fresh();ensureTeams();S.tab='cf';UI.imp='';toast('모든 데이터를 지웠어요')});return}
 else if(a==='actv'){var am=S.members.find(function(x){return x.id===id});if(!am)return;if(t.dataset.v==='off'){requestConfirm('선수 상태 변경 확인','비활성으로 변경하면 현재 경기 출석과 모든 배치에서 제외돼요. 계속할까요?','변경',function(){am.act=false;am.why=am.why||'부상';delete S.att[id];dropFromLineups(id);toast('현재 경기 출석과 배치에서 뺐어요')});return}else{am.act=true}}
 else if(a==='copyprev'){var cq=S.q[S.cq],pq=S.q[S.cq-1];if(!pq)return;var copyLineup=function(){cq.f=pq.f;cq.s=pq.s.slice();cq.sub={};cq.coords=JSON.parse(JSON.stringify(pq.coords||{}));cq.opponentOn=!!pq.opponentOn;cq.opponentCoords=JSON.parse(JSON.stringify(pq.opponentCoords||{}));cq.ballOn=!!pq.ballOn;cq.ballCoord=pq.ballCoord?JSON.parse(JSON.stringify(pq.ballCoord)):null;toast('라인업을 복사했어요')};if(cq.s.some(Boolean)){requestConfirm('배치 덮어쓰기 확인','현재 쿼터의 포메이션과 배치를 이전 쿼터 값으로 덮어쓸까요?','덮어쓰기',copyLineup);return}copyLineup()}
 else if(a==='pmode'){if(t.dataset.v==='sb'&&!S.q[S.cq].s[UI.pick]){toast('선발 선수를 먼저 배치해 주세요');return}UI.pm=t.dataset.v}
 else if(a==='setsub'){var mi=document.getElementById('subMin'),mv=cl(mi?mi.value:15,quarterMinutes(S.q[S.cq],S.qmin));S.q[S.cq].sub=S.q[S.cq].sub||{};S.q[S.cq].sub[UI.pick]={id:id,m:mv};UI.pick=null;toast('교체를 등록했어요')}
 else if(a==='resetQuarterMinutes'){delete S.q[S.cq].duration}
 else if(a==='clearsub'){var subIndex=UI.pick;requestConfirm('교체 해제 확인','이 교체 기록을 삭제할까요?','교체 해제',function(){delete S.q[S.cq].sub[subIndex];UI.pick=null});return}
 else if(a==='sc'){var sc=S.sc[S.cq],k=t.dataset.k;sc[k]=Math.max(0,Math.min(99,sc[k]+(+t.dataset.d)))}
 else if(a==='addguest'){var gi=document.getElementById(t.dataset.in),gn=gi?gi.value.trim():'';if(!gn)return;var gg={id:'g'+uid(),name:gn,pos:'ANY',guest:true};S.guests.push(gg);if(UI.pick!=null){S.q[S.cq].s[UI.pick]=gg.id;delete S.q[S.cq].sub[UI.pick];UI.pick=null}}
 else if(a==='delguest'){var guest=S.guests.find(function(g){return g.id===id});if(!guest)return;requestConfirm('게스트 삭제 확인','{name} 게스트를 삭제할까요? 현재 경기의 배치에서도 제외됩니다.','삭제',function(){S.guests=S.guests.filter(function(g){return g.id!==id});dropFromLineups(id)},{name:guest.name});return}
 else if(a==='delrec'){var record=S.hist.find(function(r){return r.id===id});if(!record)return;requestConfirm('경기 삭제 확인','{date} 경기 기록을 삭제할까요? 이 작업은 되돌릴 수 없습니다.','삭제',function(){S.hist=S.hist.filter(function(r){return r.id!==id});if(S.matchId===id)S.matchId=null},{date:fmtDate(record.date)});return}
 else if(a==='loadrec'){if(S.matchId)saveMatch();loadRec(id);S.tab='att'}
 else if(a==='auto'){if(!attendees().length){toast('참석자를 먼저 체크해 주세요');return}var assigned=autoAssign();toast(assigned?'빈 자리에 '+assigned+'명을 자동 배치했어요':'자동 배치할 빈 자리가 없어요')}
 else if(a==='copy'){var txt=lineupText();copyText(txt).then(function(ok){if(ok)toast('라인업을 복사했어요');else{UI.text=txt;render()}});return}
 save();render()});
document.addEventListener('change',function(e){var t=e.target,c=t.dataset.chg;if(!c)return;
 if(c==='language'){var selected=t.value;if(!LANGS[selected])return;
  loadLocale(selected).then(function(){LANG=selected;try{localStorage.setItem(LANG_KEY,LANG)}catch(err){toast('언어 설정을 저장하지 못했어요')}render()}).catch(function(){t.value=LANG;toast('언어 파일을 불러오지 못했어요')});return}
 if(c==='crestFile'){if(UI.teamEditOpen)setTeamImage(t.files&&t.files[0]);t.value='';return}
 if(c==='calendarPickerYear'){var yearValue=Math.floor(+t.value);if(yearValue>=1&&yearValue<=9999)UI.calendarPickerYear=yearValue;render();return}
 if(c==='teamName'){S.team=t.value.trim()||'우리 팀';save();var title=document.querySelector('.team-switch .team');if(title)title.textContent=S.team;t.value=S.team;return}
 if(c==='editorPreferredPos'){if(UI.playerEditor){UI.playerEditor.positions=Array.from(t.closest('.position-ranks').querySelectorAll('select')).map(function(select){return select.value});render()}return}
 if(c==='editorWhy'){if(UI.playerEditor)UI.playerEditor.why=t.value;return}
 else if(c==='form'){var quarter=S.q[S.cq],formation=t.value,hasLineup=quarter.s.some(Boolean),hasSubstitutions=Object.keys(quarter.sub||{}).length>0;var setFormation=function(){quarter.f=formation;quarter.sub={};quarter.coords={}};if(hasLineup||hasSubstitutions){requestConfirm('포메이션 변경 확인','포메이션을 바꾸면 현재 선수 배치와 교체 기록이 영향을 받아요. 계속할까요?','변경',setFormation);return}setFormation()}
 else if(c==='defaultQn'){S.defaultQn=Math.max(1,Math.min(MAX_QUARTERS,Math.floor(+t.value||1)));t.value=S.defaultQn}
 else if(c==='defaultQmin'){S.defaultQmin=Math.max(5,Math.min(45,Math.round(+t.value||25)));t.value=S.defaultQmin}
 else if(c==='statsStatus'){UI.statsStatus=t.value}
 else if(c==='statsPeriod'){UI.statsPeriod=t.value;if(t.value!=='custom'){UI.statsFrom='';UI.statsTo=''}}
 else if(c==='statsFrom'){UI.statsFrom=t.value}
 else if(c==='statsTo'){UI.statsTo=t.value}
 else if(c==='quarterMinutes'){S.q[S.cq].duration=Math.max(5,Math.min(45,Math.round(+t.value||S.qmin)));t.value=S.q[S.cq].duration;save();var resetButton=document.querySelector('[data-act="resetQuarterMinutes"]');if(resetButton)resetButton.hidden=false;return}
 else if(c==='sort')S.sort=t.value;
 else if(c==='opp')S.opp=t.value.trim();
 else if(c==='impfile'){var f0=t.files&&t.files[0];if(!f0)return;var fr=new FileReader();fr.onload=function(){UI.imp=String(fr.result||'');render();toast('파일을 읽었어요. 가져오기를 눌러 주세요')};fr.readAsText(f0);return}
 else if(c==='no'){var nmm=S.members.find(function(x){return x.id===t.dataset.id});if(nmm)nmm.no=cno(t.value)}
 else if(c==='why'){var wm=S.members.find(function(x){return x.id===t.dataset.id});if(wm)wm.why=t.value}
 save();render()});
document.addEventListener('keydown',function(e){var idm=e.target.id;if((idm==='newFirstName'||idm==='newMiddleName'||idm==='newLastName'||idm==='gName'||idm==='gName2')&&e.key==='Enter'){e.preventDefault();var b=document.querySelector('[data-in="'+idm+'"]')||document.querySelector('[data-act="add"]');if(b)b.click()}});
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();UI.ip=e;render()});
window.addEventListener('appinstalled',function(){UI.ip=null;render()});
document.addEventListener('input',function(e){if(e.target.dataset.editorField&&UI.playerEditor){UI.playerEditor[e.target.dataset.editorField]=e.target.value}else if(e.target.id==='impTxt')UI.imp=e.target.value;else if(e.target.id==='matchTime')UI.matchTime=e.target.value;else if(e.target.id==='managedTeamName'){S.team=e.target.value;save();var title=document.querySelector('.team-switch .team');if(title)title.textContent=S.team}});
document.addEventListener('toggle',function(e){if(e.target.matches&&e.target.matches('details[data-mg]'))UI.mg=e.target.open},true);
loadLocale(LANG).then(render).catch(function(){LANG='ko';loadLocale('ko').then(render).catch(function(){render()});toast('언어 파일을 불러오지 못했어요')});
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fitTeamName);
if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})})}

(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const c of r.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&n(c)}).observe(document,{childList:!0,subtree:!0});function a(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(i){if(i.ep)return;i.ep=!0;const r=a(i);fetch(i.href,r)}})();(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))a(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const r of i.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&a(r)}).observe(document,{childList:!0,subtree:!0});function t(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function a(n){if(n.ep)return;n.ep=!0;const i=t(n);fetch(n.href,i)}})();(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))a(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const r of i.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&a(r)}).observe(document,{childList:!0,subtree:!0});function t(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function a(n){if(n.ep)return;n.ep=!0;const i=t(n);fetch(n.href,i)}})();
/**
* @license
* Copyright 2025 Google LLC
* SPDX-License-Identifier: Apache-2.0
*//**
* @license
* Copyright 2025 Google LLC
* SPDX-License-Identifier: Apache-2.0
*/var S;(function(e){e.PAGED_ITEM_BATCH_JOBS="batchJobs",e.PAGED_ITEM_MODELS="models",e.PAGED_ITEM_TUNING_JOBS="tuningJobs",e.PAGED_ITEM_FILES="files",e.PAGED_ITEM_CACHED_CONTENTS="cachedContents"})(S||(S={}));/**
* @license
* Copyright 2025 Google LLC
* SPDX-License-Identifier: Apache-2.0
*/
var N;(function(e){e.OUTCOME_UNSPECIFIED="OUTCOME_UNSPECIFIED",e.OUTCOME_OK="OUTCOME_OK",e.OUTCOME_FAILED="OUTCOME_FAILED",e.OUTCOME_DEADLINE_EXCEEDED="OUTCOME_DEADLINE_EXCEEDED"})(N||(N={}));var A;(function(e){e.LANGUAGE_UNSPECIFIED="LANGUAGE_UNSPECIFIED",e.PYTHON="PYTHON"})(A||(A={}));var O;(function(e){e.HARM_CATEGORY_UNSPECIFIED="HARM_CATEGORY_UNSPECIFIED",e.HARM_CATEGORY_HATE_SPEECH="HARM_CATEGORY_HATE_SPEECH",e.HARM_CATEGORY_DANGEROUS_CONTENT="HARM_CATEGORY_DANGEROUS_CONTENT",e.HARM_CATEGORY_HARASSMENT="HARM_CATEGORY_HARASSMENT",e.HARM_CATEGORY_SEXUALLY_EXPLICIT="HARM_CATEGORY_SEXUALLY_EXPLICIT",e.HARM_CATEGORY_CIVIC_INTEGRITY="HARM_CATEGORY_CIVIC_INTEGRITY"})(O||(O={}));var y;(function(e){e.HARM_BLOCK_METHOD_UNSPECIFIED="HARM_BLOCK_METHOD_UNSPECIFIED",e.SEVERITY="SEVERITY",e.PROBABILITY="PROBABILITY"})(y||(y={}));var C;(function(e){e.HARM_BLOCK_THRESHOLD_UNSPECIFIED="HARM_BLOCK_THRESHOLD_UNSPECIFIED",e.BLOCK_LOW_AND_ABOVE="BLOCK_LOW_AND_ABOVE",e.BLOCK_MEDIUM_AND_ABOVE="BLOCK_MEDIUM_AND_ABOVE",e.BLOCK_ONLY_HIGH="BLOCK_ONLY_HIGH",e.BLOCK_NONE="BLOCK_NONE",e.OFF="OFF"})(C||(C={}));var $;(function(e){e.MODE_UNSPECIFIED="MODE_UNSPECIFIED",e.MODE_DYNAMIC="MODE_DYNAMIC"})($||($={}));var P;(function(e){e.AUTH_TYPE_UNSPECIFIED="AUTH_TYPE_UNSPECIFIED",e.NO_AUTH="NO_AUTH",e.API_KEY_AUTH="API_KEY_AUTH",e.HTTP_BASIC_AUTH="HTTP_BASIC_AUTH",e.GOOGLE_SERVICE_ACCOUNT_AUTH="GOOGLE_SERVICE_ACCOUNT_AUTH",e.OAUTH="OAUTH",e.OIDC_AUTH="OIDC_AUTH"})(P||(P={}));var U;(function(e){e.TYPE_UNSPECIFIED="TYPE_UNSPECIFIED",e.STRING="STRING",e.NUMBER="NUMBER",e.INTEGER="INTEGER",e.BOOLEAN="BOOLEAN",e.ARRAY="ARRAY",e.OBJECT="OBJECT"})(U||(U={}));var R;(function(e){e.FINISH_REASON_UNSPECIFIED="FINISH_REASON_UNSPECIFIED",e.STOP="STOP",e.MAX_TOKENS="MAX_TOKENS",e.SAFETY="SAFETY",e.RECITATION="RECITATION",e.LANGUAGE="LANGUAGE",e.OTHER="OTHER",e.BLOCKLIST="BLOCKLIST",e.PROHIBITED_CONTENT="PROHIBITED_CONTENT",e.SPII="SPII",e.MALFORMED_FUNCTION_CALL="MALFORMED_FUNCTION_CALL",e.IMAGE_SAFETY="IMAGE_SAFETY"})(R||(R={}));var L;(function(e){e.HARM_PROBABILITY_UNSPECIFIED="HARM_PROBABILITY_UNSPECIFIED",e.NEGLIGIBLE="NEGLIGIBLE",e.LOW="LOW",e.MEDIUM="MEDIUM",e.HIGH="HIGH"})(L||(L={}));var M;(function(e){e.HARM_SEVERITY_UNSPECIFIED="HARM_SEVERITY_UNSPECIFIED",e.HARM_SEVERITY_NEGLIGIBLE="HARM_SEVERITY_NEGLIGIBLE",e.HARM_SEVERITY_LOW="HARM_SEVERITY_LOW",e.HARM_SEVERITY_MEDIUM="HARM_SEVERITY_MEDIUM",e.HARM_SEVERITY_HIGH="HARM_SEVERITY_HIGH"})(M||(M={}));var F;(function(e){e.BLOCKED_REASON_UNSPECIFIED="BLOCKED_REASON_UNSPECIFIED",e.SAFETY="SAFETY",e.OTHER="OTHER",e.BLOCKLIST="BLOCKLIST",e.PROHIBITED_CONTENT="PROHIBITED_CONTENT"})(F||(F={}));var x;(function(e){e.TRAFFIC_TYPE_UNSPECIFIED="TRAFFIC_TYPE_UNSPECIFIED",e.ON_DEMAND="ON_DEMAND",e.PROVISIONED_THROUGHPUT="PROVISIONED_THROUGHPUT"})(x||(x={}));var B;(function(e){e.MODALITY_UNSPECIFIED="MODALITY_UNSPECIFIED",e.TEXT="TEXT",e.IMAGE="IMAGE",e.AUDIO="AUDIO"})(B||(B={}));var H;(function(e){e.MEDIA_RESOLUTION_UNSPECIFIED="MEDIA_RESOLUTION_UNSPECIFIED",e.MEDIA_RESOLUTION_LOW="MEDIA_RESOLUTION_LOW",e.MEDIA_RESOLUTION_MEDIUM="MEDIA_RESOLUTION_MEDIUM",e.MEDIA_RESOLUTION_HIGH="MEDIA_RESOLUTION_HIGH"})(H||(H={}));var G;(function(e){e.JOB_STATE_UNSPECIFIED="JOB_STATE_UNSPECIFIED",e.JOB_STATE_QUEUED="JOB_STATE_QUEUED",e.JOB_STATE_PENDING="JOB_STATE_PENDING",e.JOB_STATE_RUNNING="JOB_STATE_RUNNING",e.JOB_STATE_SUCCEEDED="JOB_STATE_SUCCEEDED",e.JOB_STATE_FAILED="JOB_STATE_FAILED",e.JOB_STATE_CANCELLING="JOB_STATE_CANCELLING",e.JOB_STATE_CANCELLED="JOB_STATE_CANCELLED",e.JOB_STATE_PAUSED="JOB_STATE_PAUSED",e.JOB_STATE_EXPIRED="JOB_STATE_EXPIRED",e.JOB_STATE_UPDATING="JOB_STATE_UPDATING",e.JOB_STATE_PARTIALLY_SUCCEEDED="JOB_STATE_PARTIALLY_SUCCEEDED"})(G||(G={}));var k;(function(e){e.ADAPTER_SIZE_UNSPECIFIED="ADAPTER_SIZE_UNSPECIFIED",e.ADAPTER_SIZE_ONE="ADAPTER_SIZE_ONE",e.ADAPTER_SIZE_TWO="ADAPTER_SIZE_TWO",e.ADAPTER_SIZE_FOUR="ADAPTER_SIZE_FOUR",e.ADAPTER_SIZE_EIGHT="ADAPTER_SIZE_EIGHT",e.ADAPTER_SIZE_SIXTEEN="ADAPTER_SIZE_SIXTEEN",e.ADAPTER_SIZE_THIRTY_TWO="ADAPTER_SIZE_THIRTY_TWO"})(k||(k={}));var Y;(function(e){e.FEATURE_SELECTION_PREFERENCE_UNSPECIFIED="FEATURE_SELECTION_PREFERENCE_UNSPECIFIED",e.PRIORITIZE_QUALITY="PRIORITIZE_QUALITY",e.BALANCED="BALANCED",e.PRIORITIZE_COST="PRIORITIZE_COST"})(Y||(Y={}));var V;(function(e){e.MODE_UNSPECIFIED="MODE_UNSPECIFIED",e.MODE_DYNAMIC="MODE_DYNAMIC"})(V||(V={}));var K;(function(e){e.MODE_UNSPECIFIED="MODE_UNSPECIFIED",e.AUTO="AUTO",e.ANY="ANY",e.NONE="NONE"})(K||(K={}));var j;(function(e){e.BLOCK_LOW_AND_ABOVE="BLOCK_LOW_AND_ABOVE",e.BLOCK_MEDIUM_AND_ABOVE="BLOCK_MEDIUM_AND_ABOVE",e.BLOCK_ONLY_HIGH="BLOCK_ONLY_HIGH",e.BLOCK_NONE="BLOCK_NONE"})(j||(j={}));var J;(function(e){e.DONT_ALLOW="DONT_ALLOW",e.ALLOW_ADULT="ALLOW_ADULT",e.ALLOW_ALL="ALLOW_ALL"})(J||(J={}));var q;(function(e){e.auto="auto",e.en="en",e.ja="ja",e.ko="ko",e.hi="hi"})(q||(q={}));var W;(function(e){e.MASK_MODE_DEFAULT="MASK_MODE_DEFAULT",e.MASK_MODE_USER_PROVIDED="MASK_MODE_USER_PROVIDED",e.MASK_MODE_BACKGROUND="MASK_MODE_BACKGROUND",e.MASK_MODE_FOREGROUND="MASK_MODE_FOREGROUND",e.MASK_MODE_SEMANTIC="MASK_MODE_SEMANTIC"})(W||(W={}));var Z;(function(e){e.CONTROL_TYPE_DEFAULT="CONTROL_TYPE_DEFAULT",e.CONTROL_TYPE_CANNY="CONTROL_TYPE_CANNY",e.CONTROL_TYPE_SCRIBBLE="CONTROL_TYPE_SCRIBBLE",e.CONTROL_TYPE_FACE_MESH="CONTROL_TYPE_FACE_MESH"})(Z||(Z={}));var X;(function(e){e.SUBJECT_TYPE_DEFAULT="SUBJECT_TYPE_DEFAULT",e.SUBJECT_TYPE_PERSON="SUBJECT_TYPE_PERSON",e.SUBJECT_TYPE_ANIMAL="SUBJECT_TYPE_ANIMAL",e.SUBJECT_TYPE_PRODUCT="SUBJECT_TYPE_PRODUCT"})(X||(X={}));var Q;(function(e){e.EDIT_MODE_DEFAULT="EDIT_MODE_DEFAULT",e.EDIT_MODE_INPAINT_REMOVAL="EDIT_MODE_INPAINT_REMOVAL",e.EDIT_MODE_INPAINT_INSERTION="EDIT_MODE_INPAINT_INSERTION",e.EDIT_MODE_OUTPAINT="EDIT_MODE_OUTPAINT",e.EDIT_MODE_CONTROLLED_EDITING="EDIT_MODE_CONTROLLED_EDITING",e.EDIT_MODE_STYLE="EDIT_MODE_STYLE",e.EDIT_MODE_BGSWAP="EDIT_MODE_BGSWAP",e.EDIT_MODE_PRODUCT_IMAGE="EDIT_MODE_PRODUCT_IMAGE"})(Q||(Q={}));var z;(function(e){e.STATE_UNSPECIFIED="STATE_UNSPECIFIED",e.PROCESSING="PROCESSING",e.ACTIVE="ACTIVE",e.FAILED="FAILED"})(z||(z={}));var ee;(function(e){e.SOURCE_UNSPECIFIED="SOURCE_UNSPECIFIED",e.UPLOADED="UPLOADED",e.GENERATED="GENERATED"})(ee||(ee={}));var te;(function(e){e.MODALITY_UNSPECIFIED="MODALITY_UNSPECIFIED",e.TEXT="TEXT",e.IMAGE="IMAGE",e.VIDEO="VIDEO",e.AUDIO="AUDIO",e.DOCUMENT="DOCUMENT"})(te||(te={}));var ae;(function(e){e.START_SENSITIVITY_UNSPECIFIED="START_SENSITIVITY_UNSPECIFIED",e.START_SENSITIVITY_HIGH="START_SENSITIVITY_HIGH",e.START_SENSITIVITY_LOW="START_SENSITIVITY_LOW"})(ae||(ae={}));var ne;(function(e){e.END_SENSITIVITY_UNSPECIFIED="END_SENSITIVITY_UNSPECIFIED",e.END_SENSITIVITY_HIGH="END_SENSITIVITY_HIGH",e.END_SENSITIVITY_LOW="END_SENSITIVITY_LOW"})(ne||(ne={}));var ie;(function(e){e.ACTIVITY_HANDLING_UNSPECIFIED="ACTIVITY_HANDLING_UNSPECIFIED",e.START_OF_ACTIVITY_INTERRUPTS="START_OF_ACTIVITY_INTERRUPTS",e.NO_INTERRUPTION="NO_INTERRUPTION"})(ie||(ie={}));var oe;(function(e){e.TURN_COVERAGE_UNSPECIFIED="TURN_COVERAGE_UNSPECIFIED",e.TURN_INCLUDES_ONLY_ACTIVITY="TURN_INCLUDES_ONLY_ACTIVITY",e.TURN_INCLUDES_ALL_INPUT="TURN_INCLUDES_ALL_INPUT"})(oe||(oe={}));
/**
* @license
* SPDX-License-Identifier: Apache-2.0
*/
const de="../api/index.php";async function v(e,t={},a="POST"){try{const n={method:a,headers:{"Content-Type":"application/json"}};let i=`${de}?action=${e}`;a==="POST"?n.body=JSON.stringify(t):Object.keys(t).length&&(i+="&"+new URLSearchParams(t).toString());const r=await fetch(i,n);if(!r.ok){const s=await r.text();throw new Error(`HTTP error! status: ${r.status}, message: ${s}`)}const c=await r.json();if(c.success===!1)throw new Error(c.message||"API call failed");return c}catch(n){throw console.error(`API call failed for action "${e}":`,n),alert(`Ocorreu um erro de comunicação com o servidor: ${n instanceof Error?n.message:"Erro desconhecido"}`),n}}const o={currentUser:null,currentView:"login",users:[],courses:[],enrollments:[],attendance:[],payments:[],schoolProfile:null,systemSettings:null,adminView:"dashboard",viewingCourseId:null,viewingUserId:null,userFilters:{name:"",role:"all",courseId:"all",enrollmentStatus:"all"},attendanceState:{courseId:null,selectedDate:new Date().toISOString().split("T")[0],students:[],history:{}},financialState:{isDashboardVisible:!1,isControlPanelVisible:!1,selectedDate:new Date().toISOString().slice(0,7),expandedStudentId:null},pixModal:{isOpen:!1,paymentIds:[],content:null}},g=document.getElementById("app-root"),se=document.getElementById("app-header");async function p(){if(!o.schoolProfile)try{const s=await v("getSchoolProfile",{},"GET");o.schoolProfile=s.profile}catch{g.innerHTML='<div class="auth-container"><h2>Erro ao carregar dados da escola.</h2><p>Verifique a conexão com o servidor e o banco de dados.</p></div>';return}if(ce(),!g)return;g.innerHTML="",o.pixModal.isOpen&&document.body.appendChild(Ne());const{currentUser:e,currentView:t}=o;if(!e){t==="register"?g.innerHTML=me():g.innerHTML=ue();return}const{financialState:a,attendanceState:n,viewingCourseId:i,viewingUserId:r,adminView:c}=o;if(a.isControlPanelVisible){g.innerHTML=await Se();return}if(a.isDashboardVisible){g.innerHTML=await we();return}if(r!==null){g.innerHTML=await _e(r);return}if(i!==null){const s=o.courses.find(l=>l.id===i);c==="editCourse"&&s?g.innerHTML=await be(s):s&&(g.innerHTML=await Te(s));return}if(n.courseId!==null){g.innerHTML=await Ie(n.courseId);return}switch(t){case"dashboard":await pe();break;default:o.currentUser=null,p();break}}function ce(){if(!se||!o.schoolProfile)return;const e=o.schoolProfile.profilePicture?`<img src="${o.schoolProfile.profilePicture}" alt="Logo da Escola" class="header-logo">`:'<span class="logo-icon">🎨</span>';let t=`<h1>${e} ${o.schoolProfile.name}</h1>`;if(o.currentUser){const{currentUser:a}=o,n=a.role==="superadmin",i=a.role==="admin"||n;t=`
            <div class="header-content">
                <h1>${e} ${o.schoolProfile.name}</h1>
                <div class="user-info">
                    <span>Olá, ${a.firstName}! (${a.role})</span>
                    <button class="action-button secondary" onclick="window.handleNavigateToProfile(${a.id})">Meu Perfil</button>
                    ${i?'<button class="action-button secondary" onclick="window.handleNavigateToSchoolProfile()">Dados da UE</button>':""}
                    ${n?'<button class="action-button secondary" onclick="window.handleNavigateToSystemSettings()">Configurações</button>':""}
                    <button onclick="window.handleLogout()" class="logout-button">Sair</button>
                </div>
            </div>
        `}se.innerHTML=t}function ue(){return`
        <div class="auth-container">
            <h2>Login</h2>
            <form onsubmit="window.handleLogin(event)">
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" required>
                </div>
                <div class="form-group">
                    <label for="password">Senha</label>
                    <input type="password" id="password" name="password" required>
                </div>
                <button type="submit" class="auth-button">Entrar</button>
            </form>
            <p>Não tem uma conta? <button class="link-button" onclick="window.navigateTo('register')">Cadastre-se</button></p>
        </div>
    `}function me(){return`
         <div class="auth-container">
            <h2>Cadastro</h2>
            <form onsubmit="window.handleRegister(event)">
                <div class="form-group">
                    <label for="name">Nome</label>
                    <input type="text" id="name" name="name" required>
                </div>
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" required>
                </div>
                <div class="form-group">
                    <label for="password">Senha</label>
                    <input type="password" id="password" name="password" required>
                </div>
                <button type="submit" class="auth-button">Cadastrar</button>
            </form>
            <p>Já tem uma conta? <button class="link-button" onclick="window.navigateTo('login')">Faça login</button></p>
        </div>
    `}async function pe(){if(!o.currentUser){o.currentView="login",p();return}let e="";const t=await v("getDashboardData",{userId:o.currentUser.id,role:o.currentUser.role},"GET");switch(o.courses=t.courses||[],o.enrollments=t.enrollments||[],o.attendance=t.attendance||[],o.payments=t.payments||[],o.users=t.users||[],o.currentUser.role){case"student":e=ve(o.currentUser.id,t);break;case"admin":case"superadmin":o.adminView==="userManagement"?e=await fe(o.currentUser.id):o.adminView==="systemSettings"?e=await Ae():o.adminView==="createCourse"?e=he():e=Ee(o.currentUser.id,t);break;case"teacher":e=ge(o.currentUser.id,t);break;default:e='<div class="welcome-message"><h2>Aguardando atribuição</h2><p>Sua conta foi criada. Um administrador precisa atribuir uma função a você.</p></div>';break}g.innerHTML=e,setTimeout(Re,0)}function ve(e,t){const a=o.currentUser;if(!a)return"";const n=t.enrollments||[],i=t.attendance||[],r=t.courses||[],c=[{id:"student-courses",html:`
        <div class="card" id="student-courses" draggable="true" ondragstart="window.handleDragStart(event)" ondragend="window.handleDragEnd(event)">
            <h3 class="card-title">📚 Meus Cursos e Matrículas</h3>
            <ul class="list">
                ${n.map(s=>{const l=r.find(u=>u.id===s.courseId);if(!l)return"";const d=t.teachers.find(u=>u.id===l.teacherId);let m=`<span class="status-badge status-${s.status.toLowerCase()}">${s.status}</span>`;return`
                        <li class="list-item">
                            <div class="list-item-content">
                                <span class="list-item-title">${l.name}</span>
                                <span class="list-item-subtitle">Professor: ${d==null?void 0:d.firstName} ${(d==null?void 0:d.lastName)||""}</span>
                            </div>
                            <div class="list-item-actions">
                                <button class="action-button secondary" onclick="window.handleNavigateToCourseDetails(${l.id})">Detalhes</button>
                                ${m}
                            </div>
                        </li>
                    `}).join("")||"<li>Nenhuma matrícula encontrada.</li>"}
            </ul>
        </div>
      `},{id:"student-available-courses",html:`
        <div class="card" id="student-available-courses" draggable="true" ondragstart="window.handleDragStart(event)" ondragend="window.handleDragEnd(event)">
            <h3 class="card-title">🏫 Cursos Disponíveis para Inscrição</h3>
            <ul class="list">
                ${r.map(s=>{const l=n.find(m=>m.courseId===s.id);if(l&&(l.status==="Aprovada"||l.status==="Pendente"))return"";const d=t.teachers.find(m=>m.id===s.teacherId);return`
                        <li class="list-item">
                            <div class="list-item-content">
                                <span class="list-item-title">${s.name}</span>
                                <span class="list-item-subtitle">Professor: ${d==null?void 0:d.firstName} ${(d==null?void 0:d.lastName)||""}</span>
                            </div>
                            <div class="list-item-actions">
                                <button class="action-button secondary" onclick="window.handleNavigateToCourseDetails(${s.id})">Detalhes</button>
                                <button class="action-button" data-course-id="${s.id}" onclick="window.handleEnroll(event)">Inscreva-se Agora</button>
                            </div>
                        </li>
                    `}).join("")||"<li>Nenhum novo curso disponível no momento.</li>"}
            </ul>
        </div>
      `},{id:"student-attendance",html:`
        <div class="card" id="student-attendance" draggable="true" ondragstart="window.handleDragStart(event)" ondragend="window.handleDragEnd(event)">
            <h3 class="card-title">📊 Meu Relatório de Frequência</h3>
             ${i.length===0?"<p>Nenhum registro de frequência ainda.</p>":`
                <div class="table-wrapper">
                <table>
                    <thead><tr><th>Curso</th><th>Data</th><th>Status</th></tr></thead>
                    <tbody>
                        ${i.map(s=>{const l=r.find(m=>m.id===s.courseId),d=new Date(s.date+"T00:00:00").toLocaleDateString("pt-BR");return`
                                <tr>
                                    <td>${(l==null?void 0:l.name)||"Curso não encontrado"}</td>
                                    <td>${d}</td>
                                    <td><span class="status-badge status-${s.status.toLowerCase()}">${s.status}</span></td>
                                </tr>
                            `}).join("")}
                    </tbody>
                </table>
                </div>
             `}
        </div>
      `},{id:"student-finance",html:`
        <div class="card full-width" id="student-finance" draggable="true" ondragstart="window.handleDragStart(event)" ondragend="window.handleDragEnd(event)">
            ${w(e,t.payments)}
        </div>
      `}];return`
    <div class="welcome-message">
        <h2>Olá, ${a.firstName}!</h2>
        <p>Veja os cursos disponíveis e o status da sua matrícula.</p>
    </div>
    <div class="dashboard-grid" ondragover="window.handleDragOver(event)" ondrop="window.handleDrop(event)">
        ${c.map(s=>s.html).join("")}
    </div>
  `}function Ee(e,t){const a=o.currentUser;if(!a)return"";const n=t.enrollments.filter(s=>s.status==="Pendente"),i=t.courses||[],r=i.filter(s=>s.status==="Aberto"),c=[{id:"admin-finance",html:`
            <div class="card" id="admin-finance" draggable="true" ondragstart="window.handleDragStart(event)" ondragend="window.handleDragEnd(event)">
                <h3 class="card-title">💰 Controle Financeiro</h3>
                <p>Acesse o dashboard financeiro para visualizar a receita e a inadimplência.</p>
                <button class="action-button" onclick="window.handleNavigateToFinancialDashboard()">Acessar Dashboard</button>
            </div>
          `},...a.role==="superadmin"?[{id:"admin-users",html:`
            <div class="card" id="admin-users" draggable="true" ondragstart="window.handleDragStart(event)" ondragend="window.handleDragEnd(event)">
                <h3 class="card-title">👥 Gerenciamento de Usuários</h3>
                <p>Filtre, visualize e altere as funções dos usuários do sistema.</p>
                <button class="action-button" onclick="window.handleNavigateToUserManagement()">Acessar Gerenciamento</button>
            </div>
          `}]:[],{id:"admin-create-course",html:`
            <div class="card" id="admin-create-course" draggable="true" ondragstart="window.handleDragStart(event)" ondragend="window.handleDragEnd(event)">
                <h3 class="card-title">➕ Criar Novo Curso</h3>
                <p>Adicione um novo curso ao catálogo da escola.</p>
                <button class="action-button" onclick="window.handleNavigateToCreateCourse()">Criar Curso</button>
            </div>
          `},{id:"admin-manage-courses",html:`
            <div class="card" id="admin-manage-courses" draggable="true" ondragstart="window.handleDragStart(event)" ondragend="window.handleDragEnd(event)">
                <h3 class="card-title">⚙️ Gerenciar Cursos</h3>
                <ul class="list">
                    ${i.map(s=>`
                        <li class="list-item">
                            <div class="list-item-content">
                                <span class="list-item-title">${s.name}</span>
                                <span class="status-badge status-${s.status.toLowerCase()}">${s.status}</span>
                            </div>
                             <div class="list-item-actions">
                                <button class="action-button secondary" onclick="window.handleNavigateToCourseDetails(${s.id})">Detalhes</button>
                                <button class="action-button" onclick="window.handleNavigateToEditCourse(${s.id})">Editar</button>
                                ${s.status==="Aberto"?`<button class="action-button danger" onclick="window.handleEndCourse(${s.id})">Encerrar</button>`:""}
                                ${s.status==="Encerrado"&&a.role==="superadmin"?`<button class="action-button" onclick="window.handleReopenCourse(${s.id})">Reabrir</button>`:""}
                            </div>
                        </li>
                    `).join("")}
                </ul>
            </div>
          `},{id:"admin-pending-enrollments",html:`
            <div class="card" id="admin-pending-enrollments" draggable="true" ondragstart="window.handleDragStart(event)" ondragend="window.handleDragEnd(event)">
                <h3 class="card-title">📬 Matrículas Pendentes (${n.length})</h3>
                <ul class="list">
                    ${n.length===0?"<li>Nenhuma matrícula pendente.</li>":n.map(s=>{const l=t.users.find(E=>E.id===s.studentId),d=i.find(E=>E.id===s.courseId);if(!l||!d)return"";const m=t.enrollments.filter(E=>E.courseId===d.id&&E.status==="Aprovada").length,u=d.totalSlots===null?"Ilimitadas":Math.max(0,d.totalSlots-m);return`
                        <li class="list-item">
                            <div class="list-item-content">
                                <span class="list-item-title">${l.firstName} ${l.lastName||""} - ${d.name}</span>
                                <span class="list-item-subtitle">Vagas restantes: ${u}</span>
                            </div>
                            <form class="enrollment-approval-form" onsubmit="window.handleApprove(event)" data-student-id="${l.id}" data-course-id="${d.id}">
                                <div class="form-group-inline">
                                    <select name="billingStart" required>
                                        <option value="this_month">Cobrar este mês</option>
                                        <option value="next_month">Cobrar próximo mês</option>
                                    </select>
                                    <button type="submit" class="action-button">Aprovar</button>
                                </div>
                            </form>
                        </li>`}).join("")}
                </ul>
            </div>
          `},{id:"admin-attendance",html:`
            <div class="card" id="admin-attendance" draggable="true" ondragstart="window.handleDragStart(event)" ondragend="window.handleDragEnd(event)">
                <h3 class="card-title">📋 Controle de Frequência</h3>
                <ul class="list">
                    ${r.length===0?"<li>Nenhum curso aberto.</li>":r.map(s=>`
                        <li class="list-item">
                             <div class="list-item-content">
                                <span class="list-item-title">${s.name}</span>
                            </div>
                            <button class="action-button" onclick="window.handleNavigateToAttendance(${s.id})">Lançar Frequência</button>
                        </li>
                    `).join("")}
                </ul>
            </div>
          `}];return`
        <div class="welcome-message">
            <h2>Painel do Administrador - ${a.firstName}</h2>
            <p>Gerencie usuários, cursos, matrículas e relatórios.</p>
        </div>
        <div class="dashboard-grid" ondragover="window.handleDragOver(event)" ondrop="window.handleDrop(event)">
            ${c.map(s=>s.html).join("")}
        </div>
    `}function he(){return`
        <div class="view-header">
            <h2>Criar Novo Curso</h2>
            <button class="back-button" onclick="window.handleNavigateBackToDashboard()">← Voltar ao Painel</button>
        </div>
        <div class="card full-width">
            <form id="create-course-form" onsubmit="window.handleCreateCourse(event)">
                <div class="form-group">
                    <label for="courseName">Nome do Curso</label>
                    <input type="text" id="courseName" name="courseName" required>
                </div>
                <div class="form-group">
                    <div class="form-group-header">
                        <label for="courseDescription">Descrição</label>
                        <button type="button" class="action-button secondary generate-ai-button" onclick="window.handleGenerateDescription('create-course-form')">Gerar com IA ✨</button>
                    </div>
                    <textarea id="courseDescription" name="courseDescription" rows="3" required></textarea>
                </div>
                <div class="form-group">
                    <label for="teacherId">Professor</label>
                    <select id="teacherId" name="teacherId" required>
                        <option value="">Selecione um professor</option>
                        ${o.users.filter(e=>e.role==="teacher").map(e=>`<option value="${e.id}">${e.firstName} ${e.lastName||""}</option>`).join("")}
                    </select>
                </div>
                <div class="form-group">
                    <label for="totalSlots">Número de Vagas</label>
                    <input type="number" id="totalSlots" name="totalSlots" min="1" placeholder="Deixe em branco para ilimitado">
                </div>
                <div class="form-group">
                    <label for="monthlyFee">Valor da Mensalidade (R$)</label>
                    <input type="number" id="monthlyFee" name="monthlyFee" step="0.01" min="0" placeholder="Ex: 150.00" required>
                </div>
                <div class="form-group">
                    <label>Estrutura de Pagamento</label>
                    <div class="radio-group">
                        <label><input type="radio" name="paymentType" value="recorrente" checked onchange="document.getElementById('installments-group').style.display='none'"> Recorrente</label>
                        <label><input type="radio" name="paymentType" value="parcelado" onchange="document.getElementById('installments-group').style.display='block'"> Parcelado</label>
                    </div>
                </div>
                <div class="form-group" id="installments-group" style="display: none;">
                    <label for="installments">Número de Parcelas</label>
                    <input type="number" id="installments" name="installments" min="1" placeholder="Ex: 12">
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label for="dayOfWeek">Dia da Semana</label>
                        <select id="dayOfWeek" name="dayOfWeek">
                            <option value="">Nenhum</option>
                            <option value="Domingo">Domingo</option>
                            <option value="Segunda-feira">Segunda-feira</option>
                            <option value="Terça-feira">Terça-feira</option>
                            <option value="Quarta-feira">Quarta-feira</option>
                            <option value="Quinta-feira">Quinta-feira</option>
                            <option value="Sexta-feira">Sexta-feira</option>
                            <option value="Sábado">Sábado</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="startTime">Horário de Início</label>
                        <input type="time" id="startTime" name="startTime">
                    </div>
                    <div class="form-group">
                        <label for="endTime">Horário de Fim</label>
                        <input type="time" id="endTime" name="endTime">
                    </div>
                </div>
                <button type="submit" class="action-button">Criar Curso</button>
            </form>
        </div>
    `}async function fe(e){const{users:t,courses:a}=await v("getFilteredUsers",o.userFilters,"POST");o.users=t,o.courses=a;const n=o.users.filter(i=>i.id!==e);return`
        <div class="view-header">
            <h2>Gerenciamento de Usuários</h2>
            <button class="back-button" onclick="window.handleNavigateBackToDashboard()">← Voltar ao Painel</button>
        </div>
        <div class="card full-width">
            <h3 class="card-title">Filtros</h3>
            <div class="filter-container">
                 <div class="filter-group">
                    <label for="filter-name">Nome</label>
                    <input type="text" id="filter-name" name="name" oninput="window.handleUserFilterChange(event)" value="${o.userFilters.name}">
                </div>
                <div class="filter-group">
                    <label for="filter-role">Função</label>
                    <select id="filter-role" name="role" onchange="window.handleUserFilterChange(event)">
                        <option value="all" ${o.userFilters.role==="all"?"selected":""}>Todas</option>
                        <option value="unassigned" ${o.userFilters.role==="unassigned"?"selected":""}>Não atribuído</option>
                        <option value="student" ${o.userFilters.role==="student"?"selected":""}>Aluno</option>
                        <option value="teacher" ${o.userFilters.role==="teacher"?"selected":""}>Professor</option>
                        <option value="admin" ${o.userFilters.role==="admin"?"selected":""}>Admin</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label for="filter-course">Curso</label>
                    <select id="filter-course" name="courseId" onchange="window.handleUserFilterChange(event)">
                        <option value="all">Todos</option>
                        ${o.courses.map(i=>`<option value="${i.id}" ${o.userFilters.courseId===i.id?"selected":""}>${i.name}</option>`).join("")}
                    </select>
                </div>
                <div class="filter-group">
                    <label for="filter-status">Status da Matrícula</label>
                    <select id="filter-status" name="enrollmentStatus" onchange="window.handleUserFilterChange(event)" ${o.userFilters.courseId==="all"?"disabled":""}>
                        <option value="all">Todos</option>
                        <option value="Pendente" ${o.userFilters.enrollmentStatus==="Pendente"?"selected":""}>Pendente</option>
                        <option value="Aprovada" ${o.userFilters.enrollmentStatus==="Aprovada"?"selected":""}>Aprovada</option>
                    </select>
                </div>
            </div>
        </div>
        <div class="card full-width">
            <h3 class="card-title">Usuários Encontrados (${n.length})</h3>
            <div class="table-wrapper">
            <table>
                <thead><tr><th>Nome</th><th>Email</th><th>Função</th><th>Ações</th></tr></thead>
                <tbody>
                    ${n.map(i=>`
                        <tr>
                            <td>${i.firstName} ${i.lastName||""}</td>
                            <td>${i.email}</td>
                            <td>
                                <select onchange="window.handleRoleChange(event, ${i.id})">
                                    <option value="unassigned" ${i.role==="unassigned"?"selected":""}>Não atribuído</option>
                                    <option value="student" ${i.role==="student"?"selected":""}>Aluno</option>
                                    <option value="teacher" ${i.role==="teacher"?"selected":""}>Professor</option>
                                    <option value="admin" ${i.role==="admin"?"selected":""}>Admin</option>
                                </select>
                            </td>
                            <td>
                                <button class="action-button" onclick="window.handleNavigateToProfile(${i.id})">Ver Perfil</button>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
            </div>
        </div>
    `}function ge(e,t){const a=o.currentUser;if(!a)return"";const n=(t.courses||[]).map(i=>({id:`teacher-course-${i.id}`,html:`
            <div class="card" id="teacher-course-${i.id}" draggable="true" ondragstart="window.handleDragStart(event)" ondragend="window.handleDragEnd(event)">
                <h3 class="card-title">Turma: ${i.name}</h3>
                 <div class="list-item-actions">
                     <button class="action-button secondary" onclick="window.handleNavigateToCourseDetails(${i.id})">Detalhes</button>
                     <button class="action-button" onclick="window.handleNavigateToAttendance(${i.id})">Lançar Frequência</button>
                 </div>
            </div>
        `}));return`
        <div class="welcome-message">
            <h2>Área do Professor - ${a.firstName} ${a.lastName||""}</h2>
            <p>Selecione uma turma para gerenciar a frequência.</p>
        </div>
        <div class="dashboard-grid" ondragover="window.handleDragOver(event)" ondrop="window.handleDrop(event)">
            ${n.length===0?'<div class="card"><p>Nenhum curso aberto atribuído a você.</p></div>':n.map(i=>i.html).join("")}
        </div>
    `}async function Ie(e){const t=await v("getAttendanceData",{courseId:e,date:o.attendanceState.selectedDate},"GET"),a=t.course;if(!a)return"";const{selectedDate:n}=o.attendanceState,i=new Date().toISOString().split("T")[0],r=new Date(n+"T12:00:00Z"),c=["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"][r.getUTCDay()],s=a.dayOfWeek===c,l=t.recordsForDate,d=l.length>0,m=t.history;return`
        <div class="view-header">
            <h2>Controle de Frequência: ${a.name}</h2>
            <button class="back-button" onclick="window.handleNavigateBackToDashboard()">← Voltar</button>
        </div>

        <div class="dashboard-grid">
            <div class="card">
                <div class="attendance-controls">
                    <label for="attendance-date">Data da Chamada:</label>
                    <input type="date" id="attendance-date" value="${n}" max="${i}" onchange="window.handleAttendanceDateChange(event)">
                </div>

                ${d?'<div class="notice">Você está editando a frequência de uma data já registrada.</div>':""}
                ${!s&&a.dayOfWeek?`<div class="notice">Atenção: Este curso ocorre às ${a.dayOfWeek}s. A data selecionada é uma ${c}.</div>`:""}

                 ${t.students.length===0?"<p>Nenhum aluno matriculado nesta turma ainda.</p>":`
                    <form onsubmit="window.handleSaveAttendance(event)" data-course-id="${a.id}">
                        <input type="hidden" name="attendanceDate" value="${n}">
                        <table>
                            <thead><tr><th>Aluno</th><th>Faltou?</th></tr></thead>
                            <tbody>
                            ${t.students.map(u=>{const E=l.find(f=>f.studentId===u.id),h=E?E.status==="Falta":!1;return`
                                    <tr>
                                        <td>${u.firstName} ${u.lastName||""}</td>
                                        <td>
                                            <div class="attendance-checkbox">
                                             <input type="checkbox" id="student-${u.id}" name="absent" value="${u.id}" ${h?"checked":""}>
                                            </div>
                                        </td>
                                    </tr>
                                `}).join("")}
                            </tbody>
                        </table>
                        <button type="submit" class="action-button" style="margin-top: 1rem;" ${!s&&a.dayOfWeek?"disabled":""}>${d?"Atualizar Frequência":"Salvar Frequência"}</button>
                    </form>
                    `}
            </div>
             <div class="card">
                <h3 class="card-title">Histórico de Frequência</h3>
                ${Object.keys(m).length===0?"<p>Nenhum histórico de frequência.</p>":`
                 <div class="table-wrapper">
                    <table>
                        <thead><tr><th>Data</th><th>Presentes</th><th>Faltas</th></tr></thead>
                        <tbody>
                            ${Object.entries(m).sort(([u],[E])=>E.localeCompare(u)).map(([u,E])=>`
                                    <tr>
                                        <td>${new Date(u+"T00:00:00").toLocaleDateString("pt-BR")}</td>
                                        <td>${E.presentes}</td>
                                        <td>${E.faltas}</td>
                                    </tr>
                                `).join("")}
                        </tbody>
                    </table>
                 </div>
                `}
            </div>
        </div>
    `}async function be(e){const t=(await v("getTeachers",{},"GET")).teachers;return`
        <div class="view-header">
            <h2>Editando Curso: ${e.name}</h2>
            <button class="back-button" onclick="window.handleNavigateBackToDashboard()">Cancelar</button>
        </div>
        <div class="card full-width">
             <form id="edit-course-form" onsubmit="window.handleUpdateCourse(event)">
                <input type="hidden" name="courseId" value="${e.id}">
                <div class="form-group">
                    <label for="editCourseName">Nome do Curso</label>
                    <input type="text" id="editCourseName" name="courseName" value="${e.name}" required>
                </div>
                <div class="form-group">
                    <div class="form-group-header">
                        <label for="editCourseDescription">Descrição</label>
                        <button type="button" class="action-button secondary generate-ai-button" onclick="window.handleGenerateDescription('edit-course-form')">Gerar com IA ✨</button>
                    </div>
                    <textarea id="editCourseDescription" name="courseDescription" rows="4" required>${e.description}</textarea>
                </div>
                 <div class="form-group">
                    <label for="editTeacherId">Professor</label>
                    <select id="editTeacherId" name="teacherId" required>
                        ${t.map(a=>`<option value="${a.id}" ${a.id===e.teacherId?"selected":""}>${a.firstName} ${a.lastName||""}</option>`).join("")}
                    </select>
                </div>
                <div class="form-group">
                    <label for="totalSlots">Número de Vagas</label>
                    <input type="number" id="totalSlots" name="totalSlots" min="1" placeholder="Deixe em branco para ilimitado" value="${e.totalSlots||""}">
                </div>
                <div class="form-group">
                    <label for="monthlyFee">Valor da Mensalidade (R$)</label>
                    <input type="number" id="monthlyFee" name="monthlyFee" step="0.01" min="0" value="${e.monthlyFee||""}" required>
                </div>
                <div class="form-group">
                    <label>Estrutura de Pagamento</label>
                    <div class="radio-group">
                        <label><input type="radio" name="paymentType" value="recorrente" ${e.paymentType==="recorrente"?"checked":""} onchange="document.getElementById('edit-installments-group').style.display='none'"> Recorrente</label>
                        <label><input type="radio" name="paymentType" value="parcelado" ${e.paymentType==="parcelado"?"checked":""} onchange="document.getElementById('edit-installments-group').style.display='block'"> Parcelado</label>
                    </div>
                </div>
                <div class="form-group" id="edit-installments-group" style="${e.paymentType==="parcelado"?"display: block;":"display: none;"}">
                    <label for="edit-installments">Número de Parcelas</label>
                    <input type="number" id="edit-installments" name="installments" min="1" value="${e.installments||""}">
                </div>
                 <div class="form-grid">
                    <div class="form-group">
                        <label for="dayOfWeek">Dia da Semana</label>
                        <select id="dayOfWeek" name="dayOfWeek">
                            <option value="" ${e.dayOfWeek?"":"selected"}>Nenhum</option>
                            <option value="Domingo" ${e.dayOfWeek==="Domingo"?"selected":""}>Domingo</option>
                            <option value="Segunda-feira" ${e.dayOfWeek==="Segunda-feira"?"selected":""}>Segunda-feira</option>
                            <option value="Terça-feira" ${e.dayOfWeek==="Terça-feira"?"selected":""}>Terça-feira</option>
                            <option value="Quarta-feira" ${e.dayOfWeek==="Quarta-feira"?"selected":""}>Quarta-feira</option>
                            <option value="Quinta-feira" ${e.dayOfWeek==="Quinta-feira"?"selected":""}>Quinta-feira</option>
                            <option value="Sexta-feira" ${e.dayOfWeek==="Sexta-feira"?"selected":""}>Sexta-feira</option>
                            <option value="Sábado" ${e.dayOfWeek==="Sábado"?"selected":""}>Sábado</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="startTime">Horário de Início</label>
                        <input type="time" id="startTime" name="startTime" value="${e.startTime||""}">
                    </div>
                    <div class="form-group">
                        <label for="endTime">Horário de Fim</label>
                        <input type="time" id="endTime" name="endTime" value="${e.endTime||""}">
                    </div>
                </div>
                <button type="submit" class="action-button">Salvar Alterações</button>
            </form>
        </div>
    `}async function Te(e){const t=await v("getCourseDetails",{courseId:e.id},"GET"),{teacher:a,students:n,admin:i}=t,r=n.length,c=e.totalSlots===null?"Ilimitadas":Math.max(0,e.totalSlots-r);let s=e.paymentType==="parcelado"?`${e.installments} parcelas`:"Recorrente",l="";if(e.status==="Encerrado"&&e.closed_by_admin_id&&i){const d=new Date(e.closed_date).toLocaleString("pt-BR");l=`
            <div class="audit-info">
                <strong>Encerrado por:</strong> ${(i==null?void 0:i.firstName)||"Admin desconhecido"} em ${d}
            </div>
        `}return`
        <div class="view-header">
            <h2>Detalhes do Curso: ${e.name}</h2>
            <button class="back-button" onclick="window.handleNavigateBackToDashboard()">← Voltar</button>
        </div>
        <div class="card full-width">
            <div class="course-details-grid">
                <div><strong>Professor:</strong></div>
                <div>${a==null?void 0:a.firstName} ${(a==null?void 0:a.lastName)||""}</div>

                <div><strong>Status:</strong></div>
                <div><span class="status-badge status-${e.status.toLowerCase()}">${e.status}</span></div>

                <div><strong>Vagas:</strong></div>
                <div>${r} / ${e.totalSlots===null?"∞":e.totalSlots} (Restantes: ${c})</div>
                
                <div><strong>Mensalidade:</strong></div>
                <div>${e.monthlyFee?`R$ ${Number(e.monthlyFee).toFixed(2).replace(".",",")} (${s})`:"Não definido"}</div>

                <div><strong>Agenda:</strong></div>
                <div>${e.dayOfWeek&&e.startTime&&e.endTime?`${e.dayOfWeek}, das ${e.startTime} às ${e.endTime}`:"Não definida"}</div>
            </div>
            ${l}
            <div class="course-description">
                <strong>Descrição:</strong><br>
                ${e.description.replace(/\n/g,"<br>")}
            </div>
        </div>
        <div class="card full-width">
            <h3 class="card-title">Alunos Matriculados (${n.length})</h3>
            ${n.length>0?`
                <ul class="list">
                    ${n.map(d=>`
                        <li class="list-item">
                            <div class="list-item-content">
                                <span class="list-item-title">${d.firstName} ${d.lastName||""}</span>
                                <span class="list-item-subtitle">${d.email}</span>
                            </div>
                        </li>
                    `).join("")}
                </ul>
            `:"<p>Nenhum aluno com matrícula aprovada neste curso.</p>"}
        </div>
    `}async function _e(e){const t=await v("getProfileData",{userId:e},"GET"),a=t.user;if(!a||!o.currentUser)return window.handleNavigateBackToDashboard(),"";const n=o.currentUser.id===e,i=(o.currentUser.role==="admin"||o.currentUser.role==="superadmin")&&!n,r=l=>{if(n)return!0;if(i){const d=a[l];return d==null||d===""}return!1},c=l=>!r(l);let s="";if(i&&a.role==="student"){const l=t.enrollments;s=`
            <h3 class="card-title">Matrículas</h3>
            ${l.length===0?"<p>Nenhuma matrícula encontrada.</p>":`
                <ul class="list">
                    ${l.map(d=>`
                        <li class="list-item">
                            <div class="list-item-content">
                                <span class="list-item-title">${d.courseName||"Curso não encontrado"}</span>
                            </div>
                            <div class="list-item-actions">
                                <span class="status-badge status-${d.status.toLowerCase()}">${d.status}</span>
                            </div>
                        </li>
                    `).join("")}
                </ul>
            `}
        `}return`
        <div class="view-header">
            <h2>Perfil de ${a.firstName} ${a.lastName||""}</h2>
            <button class="back-button" onclick="window.handleNavigateBackToDashboard()">← Voltar</button>
        </div>
        <div class="card full-width">
            <form class="profile-form" onsubmit="window.handleUpdateProfile(event)">
                <input type="hidden" name="userId" value="${e}">
                <div class="profile-pic-container">
                    <img id="profile-pic-preview" class="profile-pic-preview" src="${a.profilePicture||"https://via.placeholder.com/150"}" alt="Foto do Perfil">
                    <div class="form-group">
                        <label for="profilePicture">Alterar Foto de Perfil</label>
                        <input type="file" id="profilePicture" name="profilePicture" accept="image/*" onchange="window.previewProfileImage(event)" ${c("profilePicture")?"disabled":""}>
                    </div>
                </div>
                <div class="profile-fields-container">
                    <h3 class="card-title">Dados Pessoais</h3>
                    <div class="profile-grid">
                        <div class="form-group">
                            <label for="firstName">Nome</label>
                            <input type="text" id="firstName" name="firstName" value="${a.firstName||""}" ${c("firstName")?"disabled":""}>
                        </div>
                        <div class="form-group">
                            <label for="lastName">Sobrenome</label>
                            <input type="text" id="lastName" name="lastName" value="${a.lastName||""}" ${c("lastName")?"disabled":""}>
                        </div>
                        <div class="form-group">
                            <label for="age">Idade</label>
                            <input type="number" id="age" name="age" value="${a.age||""}" ${c("age")?"disabled":""}>
                        </div>
                         <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" name="email" value="${a.email}" disabled>
                        </div>
                    </div>
                     <div class="form-group">
                        <label for="address">Endereço</label>
                        <textarea id="address" name="address" rows="3" ${c("address")?"disabled":""}>${a.address||""}</textarea>
                    </div>

                    <div class="admin-only-section">
                       ${s}
                       ${a.role==="student"?w(e,t.payments,!0,i):""}
                    </div>

                    <button type="submit" class="action-button">Salvar Alterações</button>
                </div>
            </form>
        </div>
    `}async function De(){if(!o.currentUser||!(o.currentUser.role==="admin"||o.currentUser.role==="superadmin"))return window.handleNavigateBackToDashboard(),"";if(!o.schoolProfile){const a=await v("getSchoolProfile",{},"GET");o.schoolProfile=a.profile}const e=o.schoolProfile;if(!e)return"<h1>Erro ao carregar perfil da escola</h1>";const t=["CPF","CNPJ","E-mail","Telefone","Aleatória"];return`
        <div class="view-header">
            <h2>Dados da Unidade de Ensino</h2>
            <button class="back-button" onclick="window.handleNavigateBackToDashboard()">← Voltar</button>
        </div>
        <div class="card full-width">
             <form class="profile-form" onsubmit="window.handleUpdateSchoolProfile(event)">
                <div class="profile-pic-container">
                    <img id="school-pic-preview" class="profile-pic-preview" src="${e.profilePicture||"https://via.placeholder.com/150"}" alt="Logo da Escola">
                    <div class="form-group">
                        <label for="schoolProfilePicture">Alterar Logo</label>
                        <input type="file" id="schoolProfilePicture" name="schoolProfilePicture" accept="image/*" onchange="window.previewSchoolImage(event)">
                    </div>
                </div>

                <div class="profile-fields-container">
                    <div class="profile-grid">
                        <div class="form-group">
                            <label for="schoolName">Nome da Unidade</label>
                            <input type="text" id="schoolName" name="name" value="${e.name}" required>
                        </div>
                         <div class="form-group">
                            <label for="cnpj">CNPJ</label>
                            <input type="text" id="cnpj" name="cnpj" value="${e.cnpj}" required>
                        </div>
                         <div class="form-group">
                            <label for="phone">Telefone</label>
                            <input type="tel" id="phone" name="phone" value="${e.phone}" required>
                        </div>
                    </div>
                     <div class="form-grid">
                        <div class="form-group">
                           <label for="pixKeyType">Tipo de Chave PIX</label>
                           <select id="pixKeyType" name="pixKeyType">
                             ${t.map(a=>`<option value="${a}" ${e.pixKeyType===a?"selected":""}>${a}</option>`).join("")}
                           </select>
                        </div>
                         <div class="form-group">
                            <label for="pixKey">Chave PIX</label>
                            <input type="text" id="pixKey" name="pixKey" value="${e.pixKey}" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="schoolAddress">Endereço da Unidade</label>
                        <textarea id="schoolAddress" name="address" rows="3" required>${e.address}</textarea>
                    </div>
                    <button type="submit" class="action-button">Salvar Alterações</button>
                </div>
            </form>
        </div>
    `}async function we(){const e=o.financialState.selectedDate,t=await v("getFinancialDashboardData",{month:e},"GET"),{expectedRevenue:a,collectedRevenue:n,outstandingRevenue:i,evolutionData:r,revenueByCourseData:c}=t,s=a>0?n/a*100:n>0?100:0,l={Pago:n,"Em Aberto":i};return`
        <div class="view-header">
            <h2>Dashboard Financeiro</h2>
            <div class="dashboard-controls">
                <label for="month-selector">Selecionar Mês:</label>
                <input type="month" id="month-selector" name="month" value="${e}" onchange="window.handleDashboardDateChange(event)">
            </div>
            <button class="back-button" onclick="window.handleNavigateBackToDashboard()">← Voltar</button>
        </div>

        <div class="card full-width">
            <div class="financial-summary-grid">
                <div class="summary-card">
                    <h3>Receita Prevista</h3>
                    <p>R$ ${Number(a).toFixed(2).replace(".",",")}</p>
                </div>
                <div class="summary-card">
                    <h3>Receita Arrecadada</h3>
                    <p>R$ ${Number(n).toFixed(2).replace(".",",")}</p>
                </div>
                <div class="summary-card">
                    <h3>Inadimplência</h3>
                    <p>R$ ${Number(i).toFixed(2).replace(".",",")}</p>
                </div>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${s}%"></div>
            </div>
            <p style="text-align: center; margin-top: 0.5rem; font-weight: 500;">${s.toFixed(0)}% da meta arrecadada</p>
        </div>
        
         <div class="card full-width">
            <h3 class="card-title">Ações</h3>
            <button class="action-button" onclick="window.handleNavigateToFinancialControlPanel()">Gerenciar Pagamentos dos Alunos</button>
        </div>

        <div class="charts-grid three-cols">
            <div class="card chart-container">
                <h3 class="card-title">Pago vs. Em Aberto (Mês)</h3>
                ${Ce(l)}
            </div>
            <div class="card chart-container">
                <h3 class="card-title">Receita por Curso (Mês)</h3>
                ${ye(c)}
            </div>
             <div class="card chart-container">
                <h3 class="card-title">Evolução da Receita (6 Meses)</h3>
                ${Oe(r)}
            </div>
        </div>
    `}async function Se(){const e=(await v("getActiveStudents",{},"GET")).students;return`
        <div class="view-header">
            <h2>Gerenciar Pagamentos</h2>
            <button class="back-button" onclick="window.handleNavigateToFinancialDashboard()">← Voltar ao Dashboard</button>
        </div>
        <div class="card full-width">
            <h3 class="card-title">Alunos com Matrículas (${e.length})</h3>
            ${e.length===0?"<p>Nenhum aluno ativo para gerenciar.</p>":`
            <ul class="list finance-student-list">
                ${e.map(t=>`
                    <li class="list-item clickable" onclick="window.handleToggleFinanceStudent(${t.id})">
                        <div class="list-item-content">
                            <span class="list-item-title">${t.firstName} ${t.lastName||""}</span>
                            <span class="list-item-subtitle">${t.email}</span>
                        </div>
                        <span class="expand-icon">${o.financialState.expandedStudentId===t.id?"▼":"▶"}</span>
                    </li>
                    ${o.financialState.expandedStudentId===t.id?`
                        <li class="student-payment-details">
                            ${w(t.id,o.payments.filter(a=>a.studentId===t.id),!0,!0)}
                        </li>
                    `:""}
                `).join("")}
            </ul>
            `}
        </div>
    `}function w(e,t,a=!1,n=!1){t.sort((s,l)=>l.referenceDate.localeCompare(s.referenceDate));const i=a?"Histórico Financeiro":"Meu Histórico Financeiro",r=t.filter(s=>s.status==="Pendente"||s.status==="Atrasado");let c="";return!a&&r.length>1&&(c=`<div style="margin-bottom: 1rem;"><button class="action-button" onclick="window.handleInitiatePixPayment([${r.map(s=>s.id).join(",")}])">Pagar todas as pendências com PIX</button></div>`),`
        <h4 class="card-title">${i}</h4>
        ${c}
        ${t.length===0?"<p>Nenhum histórico de pagamento encontrado.</p>":`
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Mês de Referência</th>
                            <th>Curso</th>
                            <th>Valor</th>
                            <th>Vencimento</th>
                            <th>Status</th>
                            <th>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                       ${t.map(s=>{const l=o.courses.find(E=>E.id===s.courseId),d=new Date(s.referenceDate+"T00:00:00"),m=new Date(s.dueDate+"T00:00:00");let u="<td>-</td>";return n?u=`<td>
                                 <select class="payment-status-select" onchange="window.handlePaymentStatusChange(event, ${s.id})">
                                    <option value="Pendente" ${s.status==="Pendente"?"selected":""}>Pendente</option>
                                    <option value="Pago" ${s.status==="Pago"?"selected":""}>Pago</option>
                                    <option value="Atrasado" ${s.status==="Atrasado"?"selected":""}>Atrasado</option>
                                    <option value="Cancelado" ${s.status==="Cancelado"?"selected":""}>Cancelado</option>
                                 </select>
                               </td>`:(s.status==="Pendente"||s.status==="Atrasado")&&(u=`<td><button class="action-button" onclick="window.handleInitiatePixPayment([${s.id}])">Pagar com PIX</button></td>`),`
                            <tr class="${s.status==="Cancelado"?"text-strikethrough":""}">
                                <td>${d.toLocaleString("pt-BR",{month:"long",year:"numeric",timeZone:"UTC"})}</td>
                                <td>${(l==null?void 0:l.name)||"N/A"}</td>
                                <td>R$ ${Number(s.amount).toFixed(2).replace(".",",")}</td>
                                <td>${m.toLocaleDateString("pt-BR",{timeZone:"UTC"})}</td>
                                <td><span class="status-badge status-${s.status.toLowerCase()}">${s.status}</span></td>
                                ${u}
                            </tr>
                           `}).join("")}
                    </tbody>
                </table>
            </div>
        `}
    `}function Ne(){const e=document.createElement("div");e.className="modal-overlay",e.onclick=r=>{r.target===e&&window.handleClosePixModal()};let t="";const{content:a,isOpen:n}=o.pixModal,i=o.schoolProfile;if(!n)return e;if(!a)t=`
            <div class="pix-status-container">
                <div class="spinner"></div>
                <span>Gerando cobrança PIX...</span>
            </div>
        `;else{const{qrCodeUrl:r,pixCode:c,totalAmount:s,coursesInfo:l}=a,d=(i==null?void 0:i.name)||"",m=`(${i==null?void 0:i.pixKeyType}): ${i==null?void 0:i.pixKey}`;t=`
            <p>Para pagar, aponte a câmera do seu celular para o QR Code ou utilize o código "Copia e Cola".</p>
            <div class="qr-code-placeholder">
                <img src="${r}" alt="PIX QR Code" />
            </div>
            <div class="pix-copy-paste">
                <input type="text" id="pix-code" value="${c}" readonly>
                <button onclick="window.handleCopyPixCode()">Copiar</button>
            </div>
            <div class="payment-summary">
                <h4>Resumo do Pagamento</h4>
                <p><strong>Valor Total:</strong> R$ ${s.toFixed(2).replace(".",",")}</p>
                <p><strong>Recebedor:</strong> ${d}</p>
                <p><strong>Chave PIX ${m}</strong></p>
                <p><strong>Referente a:</strong> ${l}</p>
            </div>
        `}return e.innerHTML=`
        <div class="modal-content">
            <button class="modal-close" onclick="window.handleClosePixModal()">×</button>
            <h2>Pagamento via PIX</h2>
            <div class="pix-modal-body">
                ${t}
            </div>
        </div>
    `,e}async function Ae(){if(!o.systemSettings){const t=await v("getSystemSettings",{},"GET");o.systemSettings=t.settings}const e=o.systemSettings;return e?`
        <div class="view-header">
            <h2>Configurações do Sistema</h2>
            <button class="back-button" onclick="window.handleNavigateBackToDashboard()">← Voltar</button>
        </div>
        <div class="card full-width">
            <form onsubmit="window.handleUpdateSystemSettings(event)">
                <div class="settings-grid">
                    <div class="settings-section">
                        <h3 class="card-title">⚙️ Geral</h3>
                        <div class="form-group">
                            <label for="language">Linguagem</label>
                            <select id="language" name="language">
                                <option value="pt-BR" ${e.language==="pt-BR"?"selected":""}>Português (Brasil)</option>
                                <option value="en-US" ${e.language==="en-US"?"selected":""}>Inglês (EUA)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="timeZone">Fuso Horário (NTP)</label>
                            <input type="text" id="timeZone" name="timeZone" value="${e.timeZone}">
                            <small>Ex: America/Sao_Paulo, Europe/Lisbon, UTC</small>
                        </div>
                    </div>
                     <div class="settings-section">
                        <h3 class="card-title">💰 Financeiro</h3>
                        <div class="form-group">
                            <label for="currencySymbol">Símbolo da Moeda</label>
                            <input type="text" id="currencySymbol" name="currencySymbol" value="${e.currencySymbol}">
                        </div>
                         <div class="form-group">
                            <label for="defaultDueDay">Dia Padrão de Vencimento</label>
                            <input type="number" id="defaultDueDay" name="defaultDueDay" value="${e.defaultDueDay}" min="1" max="28">
                        </div>
                    </div>
                     <div class="settings-section">
                        <h3 class="card-title">🤖 Integração com IA</h3>
                        <div class="form-group">
                            <p>A integração com IA (Gemini) está ativada.</p>
                            <small>A chave de API é gerenciada pelo ambiente do servidor.</small>
                        </div>
                    </div>
                    <div class="settings-section">
                        <h3 class="card-title">✉️ E-mail (SMTP)</h3>
                        <div class="form-group">
                            <label for="smtpServer">Servidor SMTP</label>
                            <input type="text" id="smtpServer" name="smtpServer" value="${e.smtpServer}">
                        </div>
                        <div class="form-group">
                            <label for="smtpPort">Porta</label>
                            <input type="text" id="smtpPort" name="smtpPort" value="${e.smtpPort}">
                        </div>
                        <div class="form-group">
                            <label for="smtpUser">Usuário</label>
                            <input type="text" id="smtpUser" name="smtpUser" value="${e.smtpUser}">
                        </div>
                        <div class="form-group">
                            <label for="smtpPass">Senha</label>
                            <input type="password" id="smtpPass" name="smtpPass" value="${e.smtpPass}">
                        </div>
                    </div>
                    <div class="settings-section">
                        <h3 class="card-title">💾 Base de Dados</h3>
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="dbHost">Host</label>
                                <input type="text" id="dbHost" name="dbHost" value="${e.dbHost||""}">
                            </div>
                            <div class="form-group">
                                <label for="dbPort">Porta</label>
                                <input type="text" id="dbPort" name="dbPort" value="${e.dbPort||""}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="dbName">Nome da Base</label>
                            <input type="text" id="dbName" name="dbName" value="${e.dbName||""}">
                        </div>
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="dbUser">Usuário</label>
                                <input type="text" id="dbUser" name="dbUser" value="${e.dbUser||""}">
                            </div>
                            <div class="form-group">
                                <label for="dbPass">Senha</label>
                                <input type="password" id="dbPass" name="dbPass" value="${e.dbPass||""}">
                            </div>
                        </div>
                        <button type="button" class="action-button secondary" onclick="window.handleExportDatabase()" style="margin-top: 1rem;">Exportar Dados Atuais (JSON)</button>
                        <small style="display: block; margin-top: 0.5rem;">Exporta todos os dados do banco para um arquivo JSON.</small>
                    </div>
                </div>
                <button type="submit" class="action-button" style="margin-top: 2rem;">Salvar Configurações</button>
            </form>
        </div>
    `:"<h2>Erro ao carregar configurações</h2>"}function Oe(e){if(e.length===0)return"<p>Dados insuficientes para gerar o gráfico.</p>";const t=500,a=300,n={top:20,right:20,bottom:40,left:60},i=t-n.left-n.right,r=a-n.top-n.bottom,c=Math.max(...e.flatMap(h=>[Number(h.expected),Number(h.collected)]),0),s=h=>r-h/(c>0?c:1)*r,l=5,d=Array.from({length:l+1}).map((h,f)=>{const T=c/l*f,I=s(T);return`<g class="y-tick">
            <line x1="-5" y1="${I}" x2="${i}" y2="${I}" stroke="#e0e0e0" stroke-dasharray="2,2" />
            <text x="-10" y="${I+5}" text-anchor="end">R$${T.toFixed(0)}</text>
        </g>`}).join(""),m=i/e.length/2.5,u=i/e.length,E=e.map((h,f)=>{const T=f*u+u/2-m,I=f*u+u/2;return`
            <g class="bar-group">
                <rect class="bar expected" x="${T}" y="${s(Number(h.expected))}" width="${m}" height="${r-s(Number(h.expected))}">
                    <title>Previsto: R$ ${Number(h.expected).toFixed(2)}</title>
                </rect>
                <rect class="bar collected" x="${I}" y="${s(Number(h.collected))}" width="${m}" height="${r-s(Number(h.collected))}">
                     <title>Arrecadado: R$ ${Number(h.collected).toFixed(2)}</title>
                </rect>
                <text class="x-axis-label" x="${f*u+u/2}" y="${r+20}" text-anchor="middle">${h.month}</text>
            </g>`}).join("");return`
        <svg viewBox="0 0 ${t} ${a}" class="chart bar-chart" preserveAspectRatio="xMidYMid meet">
            <g transform="translate(${n.left}, ${n.top})">
                <g class="y-axis">${d}</g>
                <g class="x-axis">
                    <line x1="0" y1="${r}" x2="${i}" y2="${r}" stroke="#333" />
                </g>
                ${E}
            </g>
             <g class="legend" transform="translate(${n.left}, ${a-10})">
                <rect x="0" y="-10" width="12" height="12" class="bar expected" />
                <text x="18" y="0">Previsto</text>
                <rect x="80" y="-10" width="12" height="12" class="bar collected" />
                <text x="98" y="0">Arrecadado</text>
            </g>
        </svg>
    `}function ye(e){const t=Object.entries(e);if(t.length===0)return"<p>Nenhuma receita registrada este mês para exibir o gráfico.</p>";const a=["#007bff","#28a745","#ffc107","#dc3545","#17a2b8","#6610f2"],n=t.reduce((s,[,l])=>s+Number(l),0);if(n===0)return"<p>Nenhuma receita registrada este mês para exibir o gráfico.</p>";let i=0;const r=t.map(([s,l],d)=>{const m=Number(l)/n,u=m*360,E=i+u,h=Math.cos(Math.PI/180*i),f=Math.sin(Math.PI/180*i),T=Math.cos(Math.PI/180*E),I=Math.sin(Math.PI/180*E),D=u>180?1:0,le=`M ${h} ${f} A 1 1 0 ${D} 1 ${T} ${I} L 0 0 Z`;return i=E,`
            <path d="${le}" fill="${a[d%a.length]}" class="pie-slice">
                <title>${s}: R$ ${Number(l).toFixed(2)} (${(m*100).toFixed(1)}%)</title>
            </path>
        `}).join(""),c=t.map(([s,l],d)=>{const m=(Number(l)/n*100).toFixed(1);return`
            <div class="legend-item">
                <span class="legend-color" style="background-color: ${a[d%a.length]}"></span>
                <span class="legend-label">${s} (${m}%)</span>
            </div>
        `}).join("");return`
        <div class="pie-chart-container">
            <svg viewBox="-1.1 -1.1 2.2 2.2" class="chart pie-chart">
                ${r}
            </svg>
            <div class="pie-chart-legend">
                ${c}
            </div>
        </div>
    `}function Ce(e){const t={top:20,right:20,bottom:40,left:60},a=400-t.left-t.right,n=300-t.top-t.bottom,i=Object.entries(e),r=Math.max(...Object.values(e).map(Number),0),c=h=>n-h/(r>0?r:1)*n,s={Pago:"var(--status-pago-text)","Em Aberto":"var(--status-atrasado-text)"},l=5,d=Array.from({length:l+1}).map((h,f)=>{const T=r/l*f,I=c(T);return`<g class="y-tick">
            <line x1="-5" y1="${I}" x2="${a}" y2="${I}" stroke="#e0e0e0" stroke-dasharray="2,2" />
            <text x="-10" y="${I+5}" text-anchor="end">R$${T.toFixed(0)}</text>
        </g>`}).join(""),m=a/i.length/2,u=a/i.length,E=i.map(([h,f],T)=>{const I=T*u+u/2-m/2,D=s[h];return`
            <g class="bar-group">
                <rect class="bar" x="${I}" y="${c(Number(f))}" width="${m}" height="${n-c(Number(f))}" style="fill: ${D};">
                    <title>${h}: R$ ${Number(f).toFixed(2)}</title>
                </rect>
                 <text class="x-axis-label" x="${T*u+u/2}" y="${n+20}" text-anchor="middle">${h}</text>
            </g>`}).join("");return`
        <svg viewBox="0 0 400 300" class="chart bar-chart" preserveAspectRatio="xMidYMid meet">
            <g transform="translate(${t.left}, ${t.top})">
                <g class="y-axis">${d}</g>
                <g class="x-axis">
                    <line x1="0" y1="${n}" x2="${a}" y2="${n}" stroke="#333" />
                </g>
                ${E}
            </g>
        </svg>
    `}function b(e,t){const a=t.length.toString().padStart(2,"0");return`${e}${a}${t}`}function $e(e){let t=65535;for(let a=0;a<e.length;a++){t^=e.charCodeAt(a)<<8;for(let n=0;n<8;n++)(t&32768)!==0?t=t<<1^4129:t<<=1}return("0000"+(t&65535).toString(16).toUpperCase()).slice(-4)}function Pe(e,t,a,n,i="***",r=null){const c=a.normalize("NFD").replace(/[\u0300-\u036f]/g,"").substring(0,25),s=n.normalize("NFD").replace(/[\u0300-\u036f]/g,"").substring(0,15),l=t?t.toFixed(2):null;let d=b("00","br.gov.bcb.pix")+b("01",e);if(r){const h=r.normalize("NFD").replace(/[\u0300-\u036f]/g,"").substring(0,72);d+=b("02",h)}const m=[b("00","01"),b("26",d),b("52","0000"),b("53","986")];l&&m.push(b("54",l)),m.push(b("58","BR"),b("59",c),b("60",s),b("62",b("05",i)));const u=`${m.join("")}6304`,E=$e(u);return`${u}${E}`}function re(e){return new Promise((t,a)=>{const n=new FileReader;n.readAsDataURL(e),n.onload=()=>t(n.result),n.onerror=i=>a(i)})}window.handleLogin=async e=>{e.preventDefault();const t=e.target,a=t.elements.namedItem("email").value,n=t.elements.namedItem("password").value;try{const i=await v("login",{email:a,password:n});o.currentUser=i.user,o.currentView="dashboard",p()}catch{}};window.handleRegister=async e=>{e.preventDefault();const t=e.target,a=t.elements.namedItem("name").value,n=t.elements.namedItem("email").value,i=t.elements.namedItem("password").value;try{await v("register",{name:a,email:n,password:i}),alert("Cadastro realizado com sucesso! Faça o login."),o.currentView="login",p()}catch{}};window.navigateTo=e=>{o.currentView=e,p()};window.handleLogout=()=>{o.currentUser=null,o.currentView="login",Object.assign(o,{users:[],courses:[],enrollments:[],attendance:[],payments:[],adminView:"dashboard",viewingCourseId:null,viewingUserId:null,userFilters:{name:"",role:"all",courseId:"all",enrollmentStatus:"all"},attendanceState:{courseId:null,selectedDate:new Date().toISOString().split("T")[0],students:[],history:{}},financialState:{isDashboardVisible:!1,isControlPanelVisible:!1,selectedDate:new Date().toISOString().slice(0,7),expandedStudentId:null},pixModal:{isOpen:!1,paymentIds:[],content:null}}),p()};window.handleEnroll=async e=>{if(!o.currentUser||o.currentUser.role!=="student")return;const t=e.target,a=parseInt(t.dataset.courseId,10);try{await v("enroll",{studentId:o.currentUser.id,courseId:a}),alert("Solicitação de matrícula enviada! Aguarde a aprovação do administrador."),p()}catch{}};window.handleApprove=async e=>{e.preventDefault();const t=e.target,a=parseInt(t.dataset.studentId,10),n=parseInt(t.dataset.courseId,10),i=t.elements.namedItem("billingStart").value;try{await v("approveEnrollment",{studentId:a,courseId:n,billingStartChoice:i}),p()}catch{}};window.handleSaveAttendance=async e=>{e.preventDefault();const t=e.target,a=parseInt(t.dataset.courseId,10),n=t.elements.namedItem("attendanceDate").value,i=new FormData(t).getAll("absent").map(r=>parseInt(r,10));try{await v("saveAttendance",{courseId:a,date:n,absentStudentIds:i}),alert("Frequência salva com sucesso!"),p()}catch{}};window.handleCreateCourse=async e=>{e.preventDefault();const t=e.target,a=new FormData(t),n=Object.fromEntries(a.entries());try{await v("createCourse",{courseData:n}),window.handleNavigateBackToDashboard()}catch{}};window.handleUpdateCourse=async e=>{e.preventDefault();const t=e.target,a=new FormData(t),n=Object.fromEntries(a.entries());try{await v("updateCourse",{courseData:n}),alert("Curso atualizado com sucesso!"),o.viewingCourseId=null,o.adminView="dashboard",p()}catch{}};window.handleUpdateProfile=async e=>{e.preventDefault();const t=e.target,a=new FormData(t),n=parseInt(a.get("userId"),10),i={};a.forEach((c,s)=>{s!=="profilePicture"&&(i[s]=c)});const r=a.get("profilePicture");r&&r.size>0&&(i.profilePicture=await re(r));try{await v("updateProfile",{userId:n,profileData:i}),alert("Perfil atualizado com sucesso!"),window.handleNavigateBackToDashboard()}catch{}};window.handleUpdateSchoolProfile=async e=>{e.preventDefault();const t=e.target,a=new FormData(t),n=Object.fromEntries(a.entries()),i=a.get("schoolProfilePicture");i&&i.size>0&&(n.profilePicture=await re(i));try{await v("updateSchoolProfile",{profileData:n}),alert("Dados da unidade atualizados com sucesso!"),window.handleNavigateBackToDashboard()}catch{}};window.handleUpdateSystemSettings=async e=>{e.preventDefault();const t=e.target,a=new FormData(t),n=Object.fromEntries(a.entries());try{await v("updateSystemSettings",{settingsData:n}),alert("Configurações salvas com sucesso!"),o.systemSettings=null,window.handleNavigateBackToDashboard()}catch{}};window.previewProfileImage=e=>{const t=e.target,a=document.getElementById("profile-pic-preview");if(t.files&&t.files[0]){const n=new FileReader;n.onload=i=>{var r;(r=i.target)!=null&&r.result&&(a.src=i.target.result)},n.readAsDataURL(t.files[0])}};window.previewSchoolImage=e=>{const t=e.target,a=document.getElementById("school-pic-preview");if(t.files&&t.files[0]){const n=new FileReader;n.onload=i=>{var r;(r=i.target)!=null&&r.result&&(a.src=i.target.result)},n.readAsDataURL(t.files[0])}};window.handleRoleChange=async(e,t)=>{const a=e.target.value;try{await v("updateUserRole",{userId:t,newRole:a}),p()}catch{}};window.handleUserFilterChange=e=>{const t=e.target,{name:a,value:n}=t;a==="courseId"?(o.userFilters.courseId=n==="all"?"all":parseInt(n,10),o.userFilters.courseId==="all"&&(o.userFilters.enrollmentStatus="all")):o.userFilters[a]=n,p()};window.handleDashboardDateChange=e=>{const t=e.target;o.financialState.selectedDate=t.value,p()};window.handleAttendanceDateChange=e=>{const t=e.target;o.attendanceState.selectedDate=t.value,p()};window.handleEndCourse=async e=>{if(o.currentUser)try{await v("endCourse",{courseId:e,adminId:o.currentUser.id}),p()}catch{}};window.handleReopenCourse=async e=>{var t;if(((t=o.currentUser)==null?void 0:t.role)!=="superadmin"){alert("Apenas o superadmin pode reabrir cursos.");return}try{await v("reopenCourse",{courseId:e}),p()}catch{}};window.handleNavigateToAttendance=async e=>{o.attendanceState.courseId=e,o.attendanceState.selectedDate=new Date().toISOString().split("T")[0],p()};window.handleNavigateToEditCourse=async e=>{o.viewingCourseId=e,o.adminView="editCourse",p()};window.handleNavigateToCreateCourse=()=>{o.adminView="createCourse",p()};window.handleNavigateToCourseDetails=async e=>{o.viewingCourseId=e,o.adminView="details",p()};window.handleNavigateToUserManagement=async()=>{o.adminView="userManagement",p()};window.handleNavigateToSystemSettings=async()=>{o.adminView="systemSettings",p()};window.handleNavigateToProfile=async e=>{o.viewingUserId=e,p()};window.handleNavigateToSchoolProfile=async()=>{o.viewingUserId=-1,g.innerHTML=await De()};window.handleNavigateToFinancialDashboard=async()=>{o.financialState.isDashboardVisible=!0,o.financialState.isControlPanelVisible=!1,o.financialState.expandedStudentId=null,p()};window.handleNavigateToFinancialControlPanel=async()=>{o.financialState.isDashboardVisible=!1,o.financialState.isControlPanelVisible=!0,p()};window.handleToggleFinanceStudent=async e=>{const{financialState:t}=o;if(t.expandedStudentId===e)t.expandedStudentId=null;else{t.expandedStudentId=e;const a=await v("getStudentPayments",{studentId:e},"GET");o.payments=a.payments}p()};window.handlePaymentStatusChange=async(e,t)=>{const a=e.target.value;try{await v("updatePaymentStatus",{paymentId:t,status:a}),p()}catch{}};window.handleInitiatePixPayment=e=>{if(!o.schoolProfile)return;o.pixModal.isOpen=!0,o.pixModal.paymentIds=e;const t=o.payments.filter(s=>e.includes(s.id));if(t.length===0){alert("Nenhum pagamento selecionado."),o.pixModal.isOpen=!1;return}const a=t.reduce((s,l)=>s+Number(l.amount),0),n=[...new Set(t.map(s=>{var l;return(l=o.courses.find(d=>d.id===s.courseId))==null?void 0:l.name}))].filter(Boolean).join(", "),i=`SGE${Date.now()}`,r=Pe(o.schoolProfile.pixKey,a,o.schoolProfile.name,"SAO PAULO",i,n),c=`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(r)}`;o.pixModal.content={qrCodeUrl:c,pixCode:r,totalAmount:a,coursesInfo:n},p()};window.handleClosePixModal=()=>{const e=document.querySelector(".modal-overlay");e&&e.remove(),o.pixModal={isOpen:!1,paymentIds:[],content:null},p()};window.handleCopyPixCode=()=>{const e=document.getElementById("pix-code");e&&(e.select(),e.setSelectionRange(0,99999),navigator.clipboard.writeText(e.value),alert("Código PIX copiado!"))};window.handleGenerateDescription=async e=>{{alert("A chave de API de IA não está configurada no ambiente do servidor.");return}};window.handleExportDatabase=async()=>{try{const e=await v("exportDatabase",{},"GET"),t=JSON.stringify(e.exportData,null,2),a=new Blob([t],{type:"application/json"}),n=URL.createObjectURL(a),i=document.createElement("a");i.href=n,i.download=`sge_export_${new Date().toISOString().split("T")[0]}.json`,document.body.appendChild(i),i.click(),document.body.removeChild(i),URL.revokeObjectURL(n),alert("Exportação concluída com sucesso!")}catch(e){console.error("Erro ao exportar dados:",e)}};window.handleNavigateBackToDashboard=()=>{o.viewingCourseId=null,o.viewingUserId=null,o.attendanceState.courseId=null,o.financialState.isDashboardVisible=!1,o.financialState.isControlPanelVisible=!1,o.adminView="dashboard",p()};let _=null;function Ue(e,t){return[...e.querySelectorAll(".card:not(.dragging)")].reduce((a,n)=>{const i=n.getBoundingClientRect(),r=t-i.top-i.height/2;return r<0&&r>a.offset?{offset:r,element:n}:a},{offset:Number.NEGATIVE_INFINITY,element:null}).element}window.handleDragStart=e=>{e.target&&e.target.classList.contains("card")&&(_=e.target,setTimeout(()=>{_.classList.add("dragging")},0))};window.handleDragEnd=e=>{_&&(_.classList.remove("dragging"),_=null)};window.handleDragOver=e=>{e.preventDefault();const t=e.target.closest(".dashboard-grid");if(t&&_){const a=Ue(t,e.clientY);a==null?t.appendChild(_):t.insertBefore(_,a)}};window.handleDrop=e=>{e.preventDefault();const t=e.target.closest(".dashboard-grid");if(t&&o.currentUser){const a=[...t.querySelectorAll(".card")].map(n=>n.id);localStorage.setItem(`cardOrder_${o.currentUser.id}`,JSON.stringify(a))}};function Re(){if(!o.currentUser)return;const e=g.querySelector(".dashboard-grid");if(!e)return;const t=localStorage.getItem(`cardOrder_${o.currentUser.id}`);if(t)try{const a=JSON.parse(t),n=document.createDocumentFragment();a.forEach(i=>{const r=document.getElementById(i);r&&n.appendChild(r)}),e.appendChild(n)}catch(a){console.error("Failed to parse card order from localStorage",a)}}function Le(){p()}Le();

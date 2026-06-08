import{r as M,j as s}from"./main-lUK_GDvX.js";import{Z as P,f as S}from"./index-CySOyJOT.js";/* empty css              */const Z=({label:$,type:i="text",placeholder:r,value:p,onChange:c,error:t,success:e,helperText:h,required:n=!1,disabled:u=!1,readOnly:N=!1,size:m="medium",variant:x="default",icon:a,iconPosition:d="left",className:g="",allowPasswordToggle:b=!1,options:w=[],rows:k=4,resize:I="vertical",...j})=>{const[f,V]=M.useState(!1),o=b&&i==="password",v=o&&f?"text":i,y=()=>i==="select"?s.jsxs("select",{className:`
            input-field 
            input-${m} 
            input-${x}
            input-select
            ${t?"input-error":""} 
            ${e?"input-success":""}
          `.trim().replace(/\s+/g," "),value:p,onChange:c,disabled:u,required:n,...j,children:[s.jsx("option",{value:"",disabled:!0,children:r||"Pilih..."}),w.map((l,E)=>s.jsx("option",{value:l.value,children:l.label},E))]}):i==="textarea"?s.jsx("textarea",{className:`
            input-field 
            input-${m} 
            input-${x}
            input-textarea
            input-resize-${I}
            ${t?"input-error":""} 
            ${e?"input-success":""}
          `.trim().replace(/\s+/g," "),placeholder:r,value:p,onChange:c,disabled:u,readOnly:N,required:n,rows:k,...j}):s.jsxs(s.Fragment,{children:[a&&d==="left"&&s.jsx("span",{className:"input-icon input-icon-left",children:a}),s.jsx("input",{type:v,className:`
            input-field 
            input-${m} 
            input-${x} 
            ${a?`has-icon-${d}`:""} 
            ${o?"has-toggle":""} 
            ${t?"input-error":""} 
            ${e?"input-success":""}
          `.trim().replace(/\s+/g," "),placeholder:r,value:p,onChange:c,disabled:u,readOnly:N,required:n,...j}),a&&d==="right"&&s.jsx("span",{className:"input-icon input-icon-right",children:a}),o&&s.jsx("button",{type:"button",className:"password-toggle",onClick:()=>V(l=>!l),tabIndex:-1,"aria-label":f?"Sembunyikan kata sandi":"Tampilkan kata sandi",children:f?s.jsx(P,{size:18}):s.jsx(S,{size:18})})]});return s.jsxs("div",{className:`input-wrapper ${g}`,children:[$&&s.jsxs("label",{className:"input-label",children:[$,n&&s.jsx("span",{className:"required-mark",children:"*"})]}),s.jsx("div",{className:"input-container",children:y()}),t&&s.jsx("span",{className:"error-message",children:t}),e&&s.jsx("span",{className:"success-message",children:e}),h&&!t&&!e&&s.jsx("span",{className:"helper-text",children:h})]})};export{Z as I};

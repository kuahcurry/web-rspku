import{j as s}from"./main-lUK_GDvX.js";/* empty css               */const w=({children:b,variant:i="primary",size:c="medium",fullWidth:m=!1,width:e,tabletWidth:a,mobileWidth:l,disabled:p=!1,loading:t=!1,icon:o,iconPosition:f="left",onClick:u,type:x="button",className:h=""})=>{const n=f==="right"?"right":"left",j=`
    btn 
    btn-${i} 
    btn-${c} 
    ${m?"btn-full-width":""} 
    ${t?"btn-loading":""} 
    ${h}
  `.trim(),r=o&&!t&&s.jsx("span",{className:`btn-icon btn-icon-${n}`,children:o}),$={...e?{"--btn-width":e}:{},...a?{"--btn-tablet-width":a}:{},...l?{"--btn-mobile-width":l}:{}};return s.jsxs("button",{type:x,className:j,onClick:u,disabled:p||t,style:$,children:[t&&s.jsx("span",{className:"btn-spinner"}),n==="left"&&r,s.jsx("span",{className:"btn-text",children:b}),n==="right"&&r]})};export{w as B};

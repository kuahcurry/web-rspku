import{j as a}from"./main-lUK_GDvX.js";const v=({children:e,title:s,subtitle:r,headerAction:d,footer:c,variant:l="default",padding:i="normal",border:m=!1,shadow:x=!0,glass:h=!1,hover:n=!1,className:j="",onClick:o})=>a.jsxs("div",{className:`
        card 
        card-${l} 
        card-${i} 
        ${h?"card-glass":""} 
        ${n?"card-hover":""} 
        ${m?"card-border":""}
        ${x?"":"card-no-shadow"}
        ${j}
      `.trim().replace(/\s+/g," "),onClick:o,children:[(s||r||d)&&a.jsxs("div",{className:"card-header",children:[a.jsxs("div",{className:"card-header-text",children:[s&&a.jsx("h3",{className:"card-title",children:s}),r&&a.jsx("p",{className:"card-subtitle",children:r})]}),d&&a.jsx("div",{className:"card-header-action",children:d})]}),a.jsx("div",{className:"card-body",children:e}),c&&a.jsx("div",{className:"card-footer",children:c})]});export{v as C};

import{E as e,aG as d}from"./index-DM-CIWAp.js";const f=({label:l,id:n,icon:t,error:s,className:r="",as:i="input",children:c,...o})=>{const u=`
    flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm 
    ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium 
    placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 
    focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed 
    disabled:opacity-50
    ${s?"border-destructive focus:ring-destructive":""}
    ${t?"pl-10":""}
  `,a=i==="select"?"select":"input";return e.jsxs("div",{className:d("w-full",i==="input"?r:""),children:[l&&e.jsxs("label",{htmlFor:n,className:"block text-sm font-medium text-foreground mb-1.5",children:[l," ",o.required&&e.jsx("span",{className:"text-destructive",children:"*"})]}),e.jsxs("div",{className:"relative",children:[t&&e.jsx("div",{className:"absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground",children:t}),e.jsx(a,{id:n,className:d(u,i==="select"?r:""),...o,children:c})]}),s&&e.jsx("p",{className:"mt-1.5 text-xs text-destructive",children:s})]})};export{f as I};

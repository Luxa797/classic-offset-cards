import{E as e,aG as c,at as i}from"./index-BrZuWI6n.js";const x=({id:r,label:n,options:d,error:s,className:a="",placeholder:l,...o})=>e.jsxs("div",{className:c("w-full",a),children:[n&&e.jsxs("label",{htmlFor:r,className:"block text-sm font-medium text-foreground mb-1.5",children:[n," ",o.required&&e.jsx("span",{className:"text-destructive",children:"*"})]}),e.jsxs("div",{className:"relative",children:[e.jsxs("select",{id:r,className:c(`
            h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm 
            ring-offset-background placeholder:text-muted-foreground 
            focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 
            disabled:cursor-not-allowed disabled:opacity-50
            ${s?"border-destructive focus:ring-destructive":""}
          `,a),...o,children:[l&&e.jsx("option",{value:"",children:l}),d.map(t=>e.jsx("option",{value:t.value,children:t.label},t.value))]}),e.jsx("div",{className:"absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none",children:e.jsx(i,{className:"w-5 h-5 text-muted-foreground"})})]}),s&&e.jsx("p",{className:"mt-1.5 text-xs text-destructive",children:s})]});export{x as S};

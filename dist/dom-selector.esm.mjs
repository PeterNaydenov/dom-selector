function e(){const e=new Map,n=new Map;function t(n){let{name:t,selector:r,where:i,direction:o}=n;return!!(t&&r&&r instanceof Function)&&(i||(i=({item:e})=>e),o||(o="down"),e.set(t,{name:t,selector:r,where:i,direction:o}),!0)}function*r(e,n=!1){if(yield e,n)return;const t=e.parentElement;"BODY"===t.tagName&&(n=!0),yield*r(t,n)}function*i(e){yield e;const n=e.children;if(0!==n.length)for(let e of n)yield*i(e)}return{define:t,remember:function(e,t){t?.length?n.set(e,t):n.set(e,[t])},run:function(o,...l){if("string"!=typeof o){if(!t(o))return[]}let u=e.get(o);if(null==u)return[];let{name:c,selector:f,direction:s,where:d}=u,a=function(e,n,t,...o){const l=!e?.length,u=[],c=Symbol("end___");let f;f=l?"up"===n?r(e):i(e):e;let s=0;for(let e of f){let n=t({item:e,i:s,END:c,length:u.length,down:i,up:r},...o);if(s++,n===c)break;n&&u.push(n)}return u}(f(...l),s,d,...l);return n.set(o,a),a},use:function(e){const t=n.get(e);return null==t?[]:t}}}export{e as default};

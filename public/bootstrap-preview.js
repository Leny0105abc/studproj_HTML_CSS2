(() => {
    const root=document.getElementById('preview-root'),style=document.getElementById('preview-style');
    const types=['Modal','Toast','Collapse','Offcanvas','Dropdown','Tooltip','Popover','Tab'];
    let port,lastHtml='',lastStructure='',instances=[];
    const clean=html=>{
        const template=document.createElement('template');template.innerHTML=html;
        template.content.querySelectorAll('script,iframe,object,embed,meta,link,base').forEach(n=>n.remove());
        for(const node of template.content.querySelectorAll('*'))for(const attribute of [...node.attributes])if(attribute.name.toLowerCase().startsWith('on')||['srcdoc','action','formaction','data-bs-config','data-bs-html','data-bs-sanitize','data-bs-template'].includes(attribute.name))node.removeAttribute(attribute.name);
        if(template.content.querySelectorAll('*').length>500)throw Error('Preview exceeds 500 elements.');
        return template.content;
    };
    const init=()=>{
        root.querySelectorAll('[data-bs-toggle="tooltip"],[data-bs-toggle="popover"]').forEach(n=>{if(!n.id)return;const Type=n.dataset.bsToggle==='tooltip'?bootstrap.Tooltip:bootstrap.Popover;instances.push(Type.getOrCreateInstance(n,{html:false,sanitize:true}));});
    };
    const structure=fragment=>{
        const copy=document.createElement('div');copy.append(fragment.cloneNode(true));
        copy.querySelectorAll('input,select,textarea,option').forEach(node=>{
            for(const name of ['value','checked','selected'])node.removeAttribute(name);
            if(node.tagName==='TEXTAREA')node.textContent='';
        });
        return copy.innerHTML;
    };
    const synchronizeFields=fragment=>{
        for(const incoming of fragment.querySelectorAll('input,select,textarea')){
            const key=incoming.getAttribute('data-codelab-key');
            const existing=[...root.querySelectorAll('input,select,textarea')].find(node=>node.getAttribute('data-codelab-key')===key);
            if(!existing||existing.tagName!==incoming.tagName)continue;
            const value=incoming.getAttribute('value')??incoming.value??'';
            // Keep the actively edited native value while older worker replies settle.
            if(existing!==document.activeElement&&existing.value!==value)existing.value=value;
            if(existing!==document.activeElement&&'checked' in existing)existing.checked=incoming.hasAttribute('checked');
        }
    };
    addEventListener('message',event=>{
        if(event.source!==parent||port||event.data?.type!=='bootstrap-preview-connect'||!event.ports[0])return;
        port=event.ports[0];port.onmessage=({data})=>{
            if(typeof data.html!=='string'||data.html.length>65536||typeof data.css!=='string'||data.css.length>50000)return;
            try {
                if(data.html!==lastHtml){
                    const fragment=clean(data.html),nextStructure=structure(fragment);
                    if(nextStructure===lastStructure){
                        synchronizeFields(fragment);
                    }else{
                    const shown=[...root.querySelectorAll('.modal.show,.offcanvas.show,.collapse.show')].map(n=>({id:n.id,type:n.classList.contains('modal')?'Modal':n.classList.contains('offcanvas')?'Offcanvas':'Collapse'}));
                    const active=document.activeElement?.id;
                    const selectionStart=document.activeElement?.selectionStart,selectionEnd=document.activeElement?.selectionEnd;
                    for(const instance of instances)try{instance.dispose();}catch{} instances=[];
                    root.querySelectorAll('*').forEach(n=>{for(const type of types)try{bootstrap[type].getInstance(n)?.dispose();}catch{}});
                    document.querySelectorAll('.modal-backdrop,.offcanvas-backdrop,.tooltip,.popover').forEach(n=>n.remove());
                    document.body.classList.remove('modal-open');document.body.style.removeProperty('overflow');document.body.style.removeProperty('padding-right');
                    root.replaceChildren(fragment);init();
                    synchronizeFields(root);
                    for(const state of shown){const node=document.getElementById(state.id);if(node&&root.contains(node))bootstrap[state.type].getOrCreateInstance(node,{toggle:false}).show();}
                    if(active){const node=document.getElementById(active);if(node&&root.contains(node)){node.focus();try{node.setSelectionRange(selectionStart,selectionEnd);}catch{}}}
                    }
                    lastHtml=data.html;lastStructure=nextStructure;
                }
                style.textContent=data.css;
                for(const command of (Array.isArray(data.bootstrapCommands)?data.bootstrapCommands:[]).slice(0,50)){
                    if(!types.includes(command.type)||!['show','hide','toggle','dispose'].includes(command.action)||typeof command.id!=='string')continue;
                    const node=document.getElementById(command.id);if(!node||!root.contains(node))continue;
                    const options={toggle:false,html:false,sanitize:true};
                    if(typeof command.options?.autohide==='boolean')options.autohide=command.options.autohide;
                    if(Number.isFinite(command.options?.delay))options.delay=Math.max(0,Math.min(10000,command.options.delay));
                    const instance=bootstrap[command.type].getOrCreateInstance(node,options);instances.push(instance);instance[command.action]();
                }
            }catch(error){port.postMessage({type:'preview-error',message:String(error.message).slice(0,1000)});}
        };
    });
    const events=['click','input','change','submit','shown.bs.modal','hidden.bs.modal','shown.bs.offcanvas','hidden.bs.offcanvas','shown.bs.collapse','hidden.bs.collapse','shown.bs.toast'];
    for(const type of events)root.addEventListener(type,event=>{
        if(type==='submit'||event.target.closest('a'))event.preventDefault();
        if(!port)return;
        const target=event.target.closest('[data-codelab-key]');if(!target)return;
        const fields=[...root.querySelectorAll('input,select,textarea')].slice(0,100).map(n=>({key:n.getAttribute('data-codelab-key'),value:String(n.value??'').slice(0,2000),checked:!!n.checked}));
        port.postMessage({type,key:target.getAttribute('data-codelab-key'),fields});
    });
})();

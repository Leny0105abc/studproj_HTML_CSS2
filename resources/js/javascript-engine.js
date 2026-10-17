// Only this isolated QuickJS context sees student code. No host objects are exposed.
export function createJavascriptEngine(
    QuickJS,
    domLibrary,
    { code, html = '', css = '', input = '', rules = {} },
) {
    if (
        code.length > 100000 ||
        html.length > 100000 ||
        css.length > 50000 ||
        input.length > 20000
    )
        throw Error('Source or input exceeds the lab limit.');
    const settings = input.trim() ? JSON.parse(input) : {};
    if (!settings || typeof settings !== 'object' || Array.isArray(settings))
        throw Error('Lab inputs must be a JSON object.');
    const prompts = settings.prompts ?? [];
    if (
        !Array.isArray(prompts) ||
        prompts.length > 100 ||
        prompts.some((v) => typeof v !== 'string' || v.length > 2000)
    )
        throw Error('Prompts must be an array of short strings.');
    const modules = { ...rules.modules, ...settings.modules };
    if (
        Object.keys(modules).length > 10 ||
        Object.entries(modules).some(
            ([k, v]) =>
                !/^\.\/[a-zA-Z0-9_-]+\.js$/.test(k) ||
                typeof v !== 'string' ||
                v.length > 20000,
        )
    )
        throw Error('Use at most ten local module files, such as ./math.js.');
    const fixtures = { ...rules.fixtures, ...settings.fixtures };
    if (JSON.stringify(fixtures).length > 20000)
        throw Error('Mock API fixtures exceed 20,000 characters.');
    const runtime = QuickJS.newRuntime();
    runtime.setMemoryLimit(33554432);
    runtime.setMaxStackSize(524288);
    let deadline = Date.now() + 3000,
        output = '',
        outputBytes = 0,
        disposed = false;
    runtime.setInterruptHandler(() => Date.now() > deadline);
    runtime.setModuleLoader((name) => {
        const key = name.startsWith('./') ? name : './' + name;
        if (!Object.hasOwn(modules, key))
            throw Error('Module not provided in Lab inputs: ' + name);
        return modules[key];
    });
    const vm = runtime.newContext();
    const evaluate = (source, filename = 'lab-internal.js', options) => {
        const result = vm.evalCode(source, filename, options);
        if (result.error) {
            let message = 'JavaScript runtime failed';
            try {
                if (vm.typeof(result.error) === 'string')
                    message = vm.getString(result.error);
                else {
                    const detail = vm.getProp(result.error, 'message');
                    try {
                        message = vm.getString(detail) || message;
                    } finally {
                        detail.dispose();
                    }
                }
            } finally {
                result.error.dispose();
            }
            throw Error(message);
        }
        const value = result.value;
        return value;
    };
    const setString = (key, value) => {
        const handle = vm.newString(value);
        vm.setProp(vm.global, key, handle);
        handle.dispose();
    };
    const emit = vm.newFunction('__emit', (handle) => {
        const text = vm.getString(handle);
        outputBytes += new TextEncoder().encode(text).length + 1;
        if (outputBytes > 65536) throw Error('Console output exceeds 64 KiB.');
        output += text + '\n';
    });
    vm.setProp(vm.global, '__emit', emit);
    emit.dispose();
    const drain = () => {
        for (let jobs = 0; runtime.hasPendingJob(); jobs++) {
            if (jobs >= 200) throw Error('Too many asynchronous jobs.');
            const r = runtime.executePendingJobs(1);
            if (r.error) {
                const e = vm.dump(r.error);
                r.error.dispose();
                throw Error(e?.message ?? String(e));
            }
        }
    };
    const flush = () => {
        drain();
        for (let i = 0; i < 100; i++) {
            const result = evaluate('__labNextTimer()');
            const more = vm.dump(result);
            result.dispose();
            if (!more) return;
            drain();
        }
        throw Error(
            'Timer limit reached. Clear intervals or reduce scheduled work.',
        );
    };
    const dispose = () => {
        if (!disposed) {
            disposed = true;
            runtime.setInterruptHandler(() => false);
            vm.dispose();
            runtime.dispose();
        }
    };
    try {
        evaluate(
            `globalThis.atob=input=>{const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';let bits=0,value=0,out='';for(const c of String(input).replace(/=+$/,'')){const n=alphabet.indexOf(c);if(n<0)continue;value=(value<<6)|n;bits+=6;if(bits>=8){bits-=8;out+=String.fromCharCode((value>>bits)&255);}}return out;};`,
        ).dispose();
        evaluate(domLibrary).dispose();
        setString('__html', html);
        setString('__css', css);
        setString('__prompts', JSON.stringify(prompts));
        setString('__fixtures', JSON.stringify(fixtures));
        evaluate(`
const __parsed = CodelabDOM.parseHTML('<!doctype html><html><head></head><body></body></html>');
globalThis.document=__parsed.document;
globalThis.window=globalThis;
globalThis.Event=CodelabDOM.Event;
const __content=/<html[\\s>]/i.test(__html)?CodelabDOM.parseHTML(__html).document.body.innerHTML:__html;
document.body.innerHTML=__content;
for(const select of document.querySelectorAll('select'))Object.defineProperty(select,'value',{configurable:true,get(){const options=[...this.querySelectorAll('option')];return (options.find(option=>option.hasAttribute('selected'))??options[0])?.getAttribute('value')??(options.find(option=>option.hasAttribute('selected'))??options[0])?.textContent??'';},set(value){for(const option of this.querySelectorAll('option')){if((option.getAttribute('value')??option.textContent)===String(value))option.setAttribute('selected','');else option.removeAttribute('selected');}}});
const __answers=JSON.parse(__prompts), __mock=JSON.parse(__fixtures);
globalThis.prompt=(message)=>{__emit('[prompt] '+String(message));return __answers.length?__answers.shift():null;};
globalThis.alert=message=>__emit('[alert] '+String(message));
globalThis.console=Object.fromEntries(['log','info','warn','error','debug'].map(kind=>[kind,(...args)=>__emit(args.map(value=>{if(typeof value==='string')return value;if(typeof value==='bigint')return value.toString()+'n';try{return JSON.stringify(value)??String(value);}catch{return '[circular value]';}}).join(' '))]));
globalThis.fetch=async(url)=>{const key=String(url);if(!Object.hasOwn(__mock,key))throw Error('Network is disabled. Provide a local mock fixture for '+key);const f=__mock[key];const status=f.status??200;return {ok:status>=200&&status<300,status,json:async()=>JSON.parse(JSON.stringify(f.data)),text:async()=>JSON.stringify(f.data)};};
const __store=new Map();
globalThis.localStorage={getItem:key=>__store.has(String(key))?__store.get(String(key)):null,setItem:(key,value)=>{if(String(value).length>10000||__store.size>=100)throw Error('Practice storage limit.');__store.set(String(key),String(value));},removeItem:key=>__store.delete(String(key)),clear:()=>__store.clear()};
globalThis.sessionStorage=localStorage;
let __timerId=0,__clock=0;
const __timers=new Map();
globalThis.setTimeout=(fn,delay=0,...args)=>{if(typeof fn!=='function'||__timers.size>=100)throw Error('Use a function and at most 100 timers.');const id=++__timerId;__timers.set(id,{fn,args,at:__clock+Math.max(0,Math.min(5000,Number(delay)||0))});return id;};
globalThis.clearTimeout=id=>__timers.delete(id);
globalThis.setInterval=(fn,delay=0,...args)=>{const id=setTimeout(fn,delay,...args);__timers.get(id).interval=Math.max(1,Number(delay)||1);return id;};
globalThis.clearInterval=clearTimeout;
globalThis.__labNextTimer=()=>{if(!__timers.size)return false;const [id,t]=[...__timers].sort((a,b)=>a[1].at-b[1].at)[0];__clock=t.at;__timers.delete(id);if(t.interval)__timers.set(id,{...t,at:__clock+t.interval});t.fn(...t.args);return true;};
globalThis.__labSnapshot=()=>{const nodes=[...document.body.querySelectorAll('*')];if(nodes.length>500)throw Error('Preview exceeds 500 elements.');let id=0;for(const node of nodes){node.setAttribute('data-codelab-key',String(++id));if('value' in node&&node.tagName!=='OPTION')node.setAttribute('value',node.value??'');if('checked' in node){if(node.checked)node.setAttribute('checked','');else node.removeAttribute('checked');}}const html=document.body.innerHTML;if(html.length>65536)throw Error('Preview exceeds 64 KiB.');return html;};
globalThis.__labEvent=(data)=>{for(const field of data.fields??[]){const node=[...document.body.querySelectorAll('[data-codelab-key]')].find(n=>n.getAttribute('data-codelab-key')===field.key);if(node){node.value=field.value;node.checked=!!field.checked;}}const node=[...document.body.querySelectorAll('[data-codelab-key]')].find(n=>n.getAttribute('data-codelab-key')===data.key);if(node){const event=new Event(data.type,{bubbles:true,cancelable:true});if(typeof data.keyboardKey==='string')Object.defineProperty(event,'key',{value:data.keyboardKey.slice(0,20)});node.dispatchEvent(event);}};
`).dispose();
        if (rules.bootstrapPreview) {
            evaluate(`
const __bootstrapCommands=[];
globalThis.bootstrap=Object.fromEntries(['Modal','Toast','Collapse','Offcanvas','Dropdown','Tooltip','Popover','Tab'].map(type=>{
 class Component {
  constructor(element, options={}) { const node=typeof element==='string'?document.querySelector(element):element; if(!node?.id)throw Error('Bootstrap bridge components need a unique element id.'); this.id=node.id; this.options=JSON.parse(JSON.stringify(options)); }
  static getOrCreateInstance(element,options={}) {return new this(element,options);}
  static getInstance(element) {return new this(element);}
 }
 for(const action of ['show','hide','toggle','dispose'])Component.prototype[action]=function(){if(__bootstrapCommands.length>=50)throw Error('Bootstrap component command limit.');__bootstrapCommands.push({type,action,id:this.id,options:this.options});};
 return [type,Component];
}));
globalThis.__takeBootstrapCommands=()=>__bootstrapCommands.splice(0);
`).dispose();
        }
        deadline = Date.now() + 2000;
        evaluate(code, 'main.js', {
            type: rules.module ? 'module' : 'global',
        }).dispose();
        flush();
        return {
            snapshot() {
                deadline = Date.now() + 1000;
                const r = evaluate('__labSnapshot()');
                const rendered = vm.getString(r);
                if (rendered.length > 65536) {
                    r.dispose();
                    throw Error('Preview exceeds 64 KiB.');
                }
                r.dispose();
                let bootstrapCommands = [];
                if (rules.bootstrapPreview) {
                    const commands = evaluate(
                        'JSON.stringify(__takeBootstrapCommands())',
                    );
                    bootstrapCommands = JSON.parse(vm.getString(commands));
                    commands.dispose();
                }
                let domChecks = [];
                if (
                    (rules.bootstrapPreview || rules.tailwindPreview) &&
                    Array.isArray(rules.dom_checks)
                ) {
                    setString(
                        '__domChecks',
                        JSON.stringify(rules.dom_checks.slice(0, 20)),
                    );
                    const checks = evaluate(
                        `JSON.stringify(JSON.parse(__domChecks).map(check=>{let passed=false;try{passed=!!document.querySelector(String(check.selector).slice(0,200));}catch{}return {description:String(check.description).slice(0,300),passed};}))`,
                    );
                    domChecks = JSON.parse(vm.getString(checks));
                    checks.dispose();
                }
                return {
                    output,
                    html: rendered,
                    css,
                    ...(rules.bootstrapPreview || rules.tailwindPreview
                        ? { bootstrapCommands, domChecks }
                        : {}),
                };
            },
            event(data) {
                deadline = Date.now() + 1000;
                setString('__eventJson', JSON.stringify(data));
                evaluate('__labEvent(JSON.parse(__eventJson))').dispose();
                flush();
                return this.snapshot();
            },
            dispose,
        };
    } catch (error) {
        // A fatal guest allocation/stack fault may also abort native cleanup.
        // The owner discards this worker; preserve the original diagnostic.
        try {
            dispose();
        } catch {
            /* Worker termination releases the instance. */
        }
        throw error;
    }
}

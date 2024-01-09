import './test-eventlet-styles.scss'
const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// 📌 CHEAT-like
let buf = new ArrayBuffer(4), f32=new Float32Array(buf), u32=new Uint32Array(buf), x2, y;
function q2(d) {
  x2 = 0.5 * (f32[0] = d);
  u32[0] = (0x5f3759df - (u32[0] >> 1));
  y = f32[0];
  y = y * ( 1.5 - ( x2 * y * y ) );
  return y;
}

// 📌 CLASS-like
const meter = (len) => {
    let prev, cv;
    const set = (arv) => {
        M.raw = [...arv];
        if(!M.isdef){
            M.a = [...arv];
            M.isdef = true;
        }else{
            prev = [...M.b];
            M.a.forEach((v,i) =>{
                cv = arv[i] - v;
                M.b[i] = cv;
                M.delta[i] = prev[i] - cv;
            });
        }
    }

    const unset = () => {
        M.isdef = undefined;
        M.b.fill(0);
        M.raw.fill(0);
        M.delta.fill(0);
    }
    
    const obj = () => {
        return {
            initial:[...M.a],
            raw:[...M.raw],
            change:[...M.b],
            delta:[...M.delta]
        }
    }

    const M = {
        a: null,
        b: new Array(len).fill(0),
        raw: new Array(len).fill(0),
        delta: new Array(len).fill(0),
        isdef: undefined,
        unset,
        set,
        obj
    }

    return M;
}

// 📌 CLASS-like
const create_eventlet = () => {
    let TC_change, btn = ['pan','rotate'];

    const interval = {
        pre: (evt) => {
            E.opt.interval && setTimeout(interval.start, Number(E.opt.interval)*E.opt.interval_delay);
        },
        start: () => {
            if(E.attr.is === 'down'){
                E.attr.interval = 0;
                E.opt.interval_id = setInterval((e) => {interval.next_t(e)}, Number(E.opt.interval));
            } 
        },
        clear: () => {
            E.opt.interval_id && clearInterval(Number(E.opt.interval_id));
            E.opt.interval_id = undefined;
            E.attr.interval = undefined;
        },
        next_t: (evt) => {
            E.attr.interval ++;
            E.cb(evt, E);
        }
    }

    // touch controller
    const TC = {
        _angle_prop: 2,
        meters: {
            pan:meter(2),
            zoom:meter(2),
            rotate:meter(2),
        },
        _map: new Map(),
        _mct: 0,
        end:(evt) => {
            if(!evt) return;
            for(let t of evt){
                TC._map.delete(t.identifier);
                TC._mct --;
            }
        },
        start:(evt) => {
            if(!evt) return;
            for(let t of evt){
                TC._map.set(t.identifier,{'x': t.clientX, 'y': t.clientY, 'index': TC._mct});
                TC._mct ++;
            }
        },
        read:(evt) => {
            if(!evt) return;
            for(let t of evt){
                const m = TC._map.get(t.identifier);
                m.x = t.clientX;
                m.y = t.clientY;
            }
        },
        scan:() => {
            if(TC._mct === 0){
                TC.meters.pan.unset();
            }

            if(TC._mct === 1){
                const m = TC._map.get([...TC._map.keys()][0]);
                m.index = 0;
                TC.meters.zoom.unset();
                TC.meters.rotate.unset();
                TC.meters.pan.set([m.x, m.y]);
            }

            if(TC._mct === 2){
                const A = TC.distance_and_angle();
                for(let v in TC.meters){
                    if(v !== 'pan') TC.meters[v].set(A[v]);
                }
            } 
        },
        distance_and_angle:() => {
            const tk = [...TC._map.keys()];
            const s = [TC._map.get(tk[0]),TC._map.get(tk[1])];
            if(s[1].x > s[0].x) s.reverse(); // for atan2
            let [xo, yo] = [s[0].x-s[1].x, s[0].y-s[1].y];
            const dsq = (xo ** 2) + (yo ** 2);
            const ang = [];

            if(TC._angle_prop === 1){
                ang[0] = [Math.atan2(yo, xo)];
            }else{
                ang[0] = s[0].x + ((s[0].x-s[1].x)/2.0);
                ang[1] = s[0].y + ((s[0].y-s[1].y)/2.0);
            }
            return {zoom:[q2(dsq) * dsq,], rotate:ang};
        }
    }

    const act = (event) => {
        E.attr.type = event.type;
        E.opt.blocks && event.preventDefault();
        E.opt.blocks && event.stopImmediatePropagation();

        // 📌 keyboard-like
        if(E.opt.eventlet_type === 'keyboard'){
            const key_pusher = (event) => {
                E.attr.KEYS.forEach((v) => {
                    if (E.attr[v] !== undefined) {
                        E.attr[v] = !E.attr[v];
                        if (E.attr.KEYS.includes(v)) E.attr.KEYS.splice(E.attr.KEYS.indexOf(v), 1);
                    }
                });
                if (E.attr.KEYS.length === 0) {
                    clearInterval(E.opt.interval_timer);
                    E.opt.interval_timer = undefined;
                } else {
                    E.cb(event, E);
                }                
            };

            if (event.type === 'keydown') {
                if (!E.attr.KEYS.includes(event.code)) E.attr.KEYS.push(event.code);
                if (!E.opt.interval_timer) {
                    key_pusher(event);
                    E.opt.interval_timer = setInterval((_) => { key_pusher(event) }, E.opt.interval);
                }
            }
            
            if (event.type === 'keyup') {
                if (E.attr.KEYS.includes(event.code)){
                    E.attr.KEYS.splice(E.attr.KEYS.indexOf(event.code), 1);
                }
                if (E.attr.KEYS.length === 0) {
                    clearInterval(E.opt.interval_timer);
                    E.opt.interval_timer = undefined;
                    E.cb(event, E); // final
                }
            }

        }

        // 📌 pointer-like
        if(E.opt.eventlet_type === 'pointer'){
            E.mobile && (TC_change = event.changedTouches);
            
            if(event.buttons) E.attr.button = event.buttons;

            if(event.type === 'mousedown' || event.type === 'touchstart'){
                E.opt.interval && interval.clear();
                E.opt.interval && interval.pre();
                E.attr.is = 'down';

                E.mobile && TC.start(TC_change);
                E.desktop && E.meters[btn[E.attr.button-1]].set([event.clientX, event.clientY]);
            }

            if(event.type === 'mouseup' || event.type === 'mouseleave' || event.type === 'touchend' || event.type === 'touchcancel'){
                E.mobile && TC.end(TC_change);
                E.desktop && E.attr.drag && E.meters[btn[E.attr.button-1]].unset();

                TC._mct === 0 && (E.attr.is = 'up');
                E.opt.interval && interval.clear();
                E.attr.drag = false;
            }

            if(event.type === 'mousemove' || event.type === 'touchmove'){
                E.attr.drag = (E.attr.is === 'down');
                const track = E.meters[btn[E.attr.button-1]];
                E.mobile && TC.read(TC_change);
                if(E.desktop){
                    E.attr.drag && track.set([event.clientX, event.clientY]);
                    !E.attr.drag && track && track.unset();
                }                
            }

            if(event.type === 'wheel'){
                E.meters['wheel'].set([event.deltaX, event.deltaY]);
                clearTimeout(E.opt.wheel_timer);
                E.opt.wheel_timer = setTimeout(() => {
                    E.meters['wheel'].unset();
                    E.attr.wheel = undefined;
                    E.cb(event, E);
                }, E.opt.wheel_timeout);
            }

            E.mobile && TC.scan();
            const ref = E.mobile ? TC : E;

            Object.keys(ref.meters).forEach((k) => {
                if(ref.meters[k].isdef){
                    E.attr[k] = ref.meters[k].obj();
                }else{
                    E.attr[k] = undefined;
                }
            });

            E.cb(event, E);
        }
       
    }



    const opt_defaults = {
        pointer:{
            blocks: true,
            wheel_timer: null,
            wheel_timeout: 50, //ms
            interval_delay: 2.0,
            interval: false,
            context_disable: false,
        },
        keyboard:{
            blocks: true,
            interval_timer: null,
            interval: 200, //ms
            toggle: ['Space', 'Tab']
        }
    }


    const init = (dom_target, callback, opt) => {

        const eventlet_type = opt.eventlet_type;
        const options = {...opt_defaults[eventlet_type]};
        Object.assign(options, opt);

        E.target = dom_target;
        E.cb = callback;
        E.opt = options;

        E.mobile = isMobile();
        E.desktop = !E.mobile;

        E.attr.id = dom_target.self === dom_target ? 'window' : dom_target.id;


        if(E.opt.eventlet_type === "pointer"){

            dom_target.addEventListener('mousedown', E.act, {passive: false});
            dom_target.addEventListener('mouseup', E.act, {passive: false});
            dom_target.addEventListener('mousemove', E.act, {passive: false});
            dom_target.addEventListener('mouseleave', E.act, {passive: false});
            dom_target.addEventListener('mouseenter', E.act, {passive: false});
            dom_target.addEventListener('wheel', E.act, {passive: false});

            dom_target.addEventListener('touchstart', E.act, {passive: false});
            dom_target.addEventListener('touchcancel', E.act, {passive: false});
            dom_target.addEventListener('touchmove', E.act, {passive: false});
            dom_target.addEventListener('touchend', E.act, {passive: false});

            E.opt.context_disable === true && dom_target.addEventListener('contextmenu', (evt) => { evt.preventDefault(); });

            E.meters = {
                wheel:meter(2),
                zoom:meter(2),
                pan:meter(2),
                rotate:meter(2),
            }

        }else{
            //assume keyboard
            E.attr.KEYS = [];            
            E.opt.toggle.forEach((t) => E.attr[t] = false);
            dom_target.addEventListener('keydown', E.act, {passive: false});
            dom_target.addEventListener('keyup', E.act, {passive: false});
        }

    }


    const E = {
        opt: {},
        attr: {},
        context: !isMobile() ? 'desktop' : 'mobile',
        target: null,
        cb: null,
        init,
        act
    }

    return E;
}

// 📌 result-like
// the objective of this is to create a visual trace of eventlet variables in the dom.
function supervise_eventlet() {
    
    const all_equal = (a,b) => a.sort().toString() === b.sort().toString();

    const T1 = (k, obj) => {
        obj[k][SE.attr[k].f].forEach((v,i) => {
            const key = `${k}-${SE.tets[i]}`;
            const p_v = SE.record[key][1];
            SE.record[key][1] += isNaN(v) ? 0 : v;
            SE.record[key][0] = SE.record[key][1] === p_v ? 'same' : 'set';
        });
    }

    const T2 = (k, obj) => {
        obj[k][SE.attr[k].f].forEach((v,i) => {
            const key = `${k}-${SE.tets[i]}`;
            const p_v = SE.record[key][1];
            SE.record[key][1] += isNaN(v) ? 0 : v;
            SE.record[key][0] = SE.record[key][1] === p_v ? 'same' : 'set';
            if(SE.attr[k].alt){
                const key = `${k}-alt-${SE.tets[i]}`;
                const p_v = SE.record[key][1];
                SE.record[key][1] *= 1.0 - (v/1000.0);
                SE.record[key][0] = SE.record[key][1] === p_v ? 'same' : 'set';                
            }
        });
    }

    const spawn_dom_part = (_value, _class, _id=null) => {
        const line = document.createElement('div');
        line.classList.add(...Array.isArray(_class) ? _class : [_class]);
        line.innerHTML = `${_value}\n`;
        _id && line.setAttribute('id',_id);
        return line;
    }

    const create_dom_line = (k, l) => {
        SE.out.appendChild(spawn_dom_part(k,'header'));
        const fields = new Array(l).fill([]).map((v,i) => {
            const label = l === 1 ? null : SE.tets[i];
            const key = l === 1 ? `${k}` : `${k}-${label}`;
            return [label,key];
        })
        fields.forEach(([label,key],i) => {
            const wrap = document.createElement('div');
            wrap.classList.add('value-wrapper', `${l > 1 ? 'full':'single'}`);
            if(SE.context === 'mobile' && k.indexOf('zoom') !== -1 && i > 0) wrap.classList.add('inactive');
            if(l > 1) wrap.appendChild(spawn_dom_part(label,'label'));
            SE.record[key][2] = wrap.appendChild(spawn_dom_part(0, 'value', key));
            SE.out.appendChild(wrap);
        });
    }

    const create_dom = (k) => {
        const fields = SE.attr[k] !== undefined ? SE.attr[k].l : 1;
        create_dom_line(k, fields);
        if(SE.attr[k] && SE.attr[k].alt) create_dom_line(`${k}-alt`, fields);
    }

    const filter_deltas = (eventlet) => {
        Object.keys(eventlet.attr).forEach((k) => {
            // is meter ?
            if(SE.attr.hasOwnProperty(k)){
                eventlet.attr[k] && SE.attr[k].fn(k, eventlet.attr);
            }else{
                const av = eventlet.attr[k];
                const dv = Array.isArray(av) ? [...av] : av;

                if(SE.record[k]){
                    let k_eq = false;
                    if(Array.isArray(dv)){
                        k_eq = all_equal(dv, SE.record[k][1]);
                    }
                    if(SE.record[k][1] !== dv && !k_eq){
                        SE.record[k][0] = 'set';
                        SE.record[k][1] = dv;
                    }else{
                        SE.record[k][0] = 'same';
                    }
                }else{
                    SE.record[k] = ['null', dv, null];
                    create_dom(k);
                }
            }
        });
    }   

    const show_deltas = () => {
        for(let r in SE.record){
            if(SE.record[r][0] !== 'same'){
                SE.record[r][2].innerHTML = typeof SE.record[r][1] === 'number' ? SE.record[r][1].toFixed(2) : SE.record[r][1];
                SE.record[r][2].parentNode.classList.add('active');
                SE.record[r][0] = 'same';
            }else{
                SE.record[r][2].parentNode.classList.remove('active');
            }
        }
    }

    const watch = (eventlet) => {
        filter_deltas(eventlet);
        show_deltas();
        clearTimeout(SE.complete_interval);
        SE.complete_interval = setTimeout(() => {
            show_deltas();
        }, 500);
    }

    const attach_eventlet = (eventlet) => {
        eventlet.watch = function(){ watch(this) };
    }

    const collapse_expand = () => {
        const states = ['>','<'];
        const dom_states = ['none','grid'];
        SE.collapsed = !SE.collapsed;
        SE.out.style.display = dom_states[+!SE.collapsed];
        SE.handle.innerHTML = states[+!SE.collapsed];
    }

    const show_hide = (which) => {
        SE.visible = which;
        const dom_states = ['none','block'];
        const el = document.querySelector('.super');
        el.style.display = dom_states[+!which];
    }

    const init = () => {
        const dom_el = document.createElement('div');
        dom_el.classList.add('super');

        const flex = `
        <div class="supervisor-menu">
            <button id="toggle">hide</button>
        </div>
        <div class="supervisor"></div>`;

        dom_el.innerHTML = flex;
        document.body.prepend(dom_el);

        const close_btn = dom_el.querySelector('#toggle');
        close_btn.addEventListener('click',collapse_expand,{passive:false});
        SE.handle = close_btn;

        SE.out = dom_el.querySelector('.supervisor');


        const pref = getComputedStyle(document.documentElement).getPropertyValue('color-scheme');
        document.documentElement.style.setProperty('--mode-fg', pref === 'dark' ? '#FFFFFF' : '#000000');
        document.documentElement.style.setProperty('--mode-bg', pref === 'dark' ? '#FFFFFF22' : '#00000022');

        SE.attr = {
            'pan':{f:'delta', fn:T1, l:2},
            'rotate':{f:'delta', fn:T1, l:2},
            'zoom':{f:(SE.context === 'mobile' ? 'delta':'initial'), fn:T2, l:2, alt:true} /// mobile is "delta".
        }

        SE.context === 'desktop' && (SE.attr['wheel'] = {f:'delta', fn:T1, l:2});


        Object.keys(SE.attr).forEach((k) => {
            for(let l = 0; l < SE.attr[k].l; l++){
                const key = `${k}-${SE.tets[l]}`;
                SE.record[key] = ['null',0,null];
                if(SE.attr[k].alt){
                    const key = `${k}-alt-${SE.tets[l]}`;
                    SE.record[key] = ['null',1.0,null];
                }
            }
            create_dom(k);
        });
    }

    const SE = {
        handle: null,
        visible: true,
        collapsed: false,
        complete_interval: null,
        context: !isMobile() ? 'desktop' : 'mobile',
        vars:['pan','rotate','zoom','wheel'],
        tets:['X','Y','Z'],
        attr:{},
        record:{},
        show_hide,
        collapse_expand,
        init,
        attach: attach_eventlet,
    }

    SE.init();
    return SE;
}



export { create_eventlet, supervise_eventlet };
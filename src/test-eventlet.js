
import { create_eventlet, supervise_eventlet } from './eventlet.js';

let btn = null, app = null, general=null;

const supervisor = supervise_eventlet();
const super_evt = create_eventlet(); 
const button_evt = create_eventlet(); 
const keys = create_eventlet(); 

let tab_state = false;



const ivt_cb = (e, eventlet) => {
    console.log(e);
    // if(e instanceof Event){
    //     e.preventDefault();
    //     e.stopImmediatePropagation();
    // }

    if(eventlet.attr.hasOwnProperty('Tab') && eventlet.attr.Tab !== tab_state){
        supervisor.show_hide(eventlet.attr.Tab);
        tab_state = eventlet.attr.Tab;
    }

    if(eventlet.hasOwnProperty('watch')) eventlet.watch();

    if(eventlet.attr.interval){
        eventlet.target.innerHTML = eventlet.attr.interval.toString().padStart(2,'0');
    }

}


document.querySelector('#app').innerHTML += `
  <div id="general"></div>
`

// btn = document.querySelector('#control');
general = document.querySelector('#general');
app = document.querySelector('#app');

keys.init(window, ivt_cb, {eventlet_type:'keyboard'});
super_evt.init(document, ivt_cb, {eventlet_type:'pointer', context_disable:true, blocks:false});
// button_evt.init(btn, ivt_cb, {eventlet_type:'pointer', interval:50, context_disable:false});

supervisor.attach(keys);
supervisor.attach(super_evt);
// supervisor.attach(button_evt);

keys.watch('ok');



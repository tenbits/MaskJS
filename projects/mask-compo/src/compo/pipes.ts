import { _Array_slice } from '@utils/refs';
import { customAttr_register } from '@core/custom/exports';
import { log_error, log_warn } from '@core/util/reporters';
import { dom_addEventListener } from '../util/dom';
import { compo_attachDisposer } from '../util/compo';


var _collection = {};

customAttr_register('x-pipe-signal', 'client', function(node, attrValue, model, ctx, element, ctr) {

    var arr = attrValue.split(';'),
        imax = arr.length,
        i = -1,
        x;
    while ( ++i < imax ) {
        x = arr[i].trim();
        if (x === '') 
            continue;
        
        var i_colon = x.indexOf(':'),
            event = x.substring(0, i_colon),
            handler = x.substring(i_colon + 1).trim(),
            dot = handler.indexOf('.'),
            
            pipe, signal;

        if (dot === -1) {
            log_error('Pipe-slot is invalid: {0} Usage e.g. "click: pipeName.pipeSignal"', x);
            return;
        }

        pipe = handler.substring(0, dot);
        signal = handler.substring(++dot);

        // if DEBUG
        !event && log_error('Pipe-slot is invalid. Event type is not set', attrValue);
        // endif

        dom_addEventListener(
            element
            , event
            , _createListener(pipe, signal)
        );
    }
});

function _createListener(pipe, signal) {
    return function(event){
        new Pipe(pipe).emit(signal, event);
    };
}


function pipe_attach(pipeName, ctr) {
    if (ctr.pipes[pipeName] == null) {
        log_error('Controller has no pipes to be added to collection', pipeName, ctr);
        return;
    }

    if (_collection[pipeName] == null) {
        _collection[pipeName] = [];
    }
    _collection[pipeName].push(ctr);
}

function pipe_detach(pipeName, ctr) {
    var pipe = _collection[pipeName],
        i = pipe.length;

    while (--i > -1) {
        if (pipe[i] === ctr) 
            pipe.splice(i, 1);
    }

}

function _removeController(ctr) {
    var	pipes = ctr.pipes;
    for (var key in pipes) {
        pipe_detach(key, ctr);
    }
}
function _removeControllerDelegate(ctr) {
    return function(){
        _removeController(ctr);
        ctr = null;
    };
}

function _addController(ctr) {
    var pipes = ctr.pipes;
    
    // if DEBUG
    if (pipes == null) {
        log_error('Controller has no pipes', ctr);
        return;
    }
    // endif
    
    for (var key in pipes) {
        pipe_attach(key, ctr);
    }
    compo_attachDisposer(ctr, _removeControllerDelegate(ctr));
}

export class Pipe {
    name: string
    constructor (name) {
        this.name = name;
    }
    emit(signal, a?, b?, c?){
        var controllers = _collection[this.name],
            name = this.name,
            args = _Array_slice.call(arguments, 1);
        
        if (controllers == null) {
            //if DEBUG
            log_warn('Pipe.emit: No signals were bound to:', name);
            //endif
            return;
        }
        
        var i = controllers.length,
            called = false;

        while (--i !== -1) {
            var ctr = controllers[i];
            var slots = ctr.pipes[name];

            if (slots == null) 
                continue;
            
            var slot = slots[signal];
            if (slot != null) {
                slot.apply(ctr, args);
                called = true;
            }
        }

        // if DEBUG
        if (called === false)
            log_warn('Pipe `%s` has not slots for `%s`', name, signal);
        // endif
    }
};

export function PipeCtor (name) {
    return new Pipe(name);
}
PipeCtor.addController = _addController;
PipeCtor.removeController = _removeController;

export const Pipes =  {
    addController: _addController,
    removeController: _removeController,
    pipe: PipeCtor
};

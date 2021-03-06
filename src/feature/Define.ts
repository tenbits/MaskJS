import { is_Function, is_Object } from '@utils/is';
import { obj_extend } from '@utils/obj';
import { _Array_slice } from '@utils/refs';
import { log_error } from '@core/util/reporters';
import { Dom } from '@core/dom/exports';
import { custom_Tags, customTag_register, customTag_registerScoped, customTag_get } from '@core/custom/exports';
import { parser_parse } from '@core/parser/exports';
import { expression_eval } from '@project/expression/src/exports';
import { mask_merge } from './merge';
import { Decorator } from './decorators/exports';
import { Methods } from './methods/exports';
import { Component } from '@compo/exports';

export const Define = {
        create: function(node, model, ctr, Base) {
            return compo_fromNode(node, model, ctr, Base);
        },
        registerGlobal: function(node, model, ctr, Base?) {
            let Ctor = Define.create(node, model, ctr, Base);
            customTag_register(
                node.name, Ctor
            );
        },
        registerScoped: function(node, model, ctr, Base?) {
            let Ctor = Define.create(node, model, ctr, Base);
            customTag_registerScoped(
                ctr, node.name, Ctor
            );
        }
    };

    function compo_prototype(node, compoName, tagName, attr, nodes, owner, model, Base) {
        let arr = [];
        let selfFns = null;
        let Proto = obj_extend({
            tagName: tagName,
            compoName: compoName,
            template: arr,
            attr: attr,
            location: trav_location(owner),
            meta: {
                template: 'merge',
                arguments: node.arguments,
                statics: null
            },
            constructor: function DefineBase() {
                if (selfFns != null) {
                    let i = selfFns.length;
                    while(--i !== -1) {
                        let key = selfFns[i];
                        this[key] = this[key].bind(this);
                    }
                }
            },
            renderStart: function(model_, ctx, el){
                let model = model_;
                Component.prototype.renderStart.call(this, model, ctx, el);
                if (this.nodes === this.template && this.meta.template !== 'copy') {
                    this.nodes = mask_merge(this.nodes, [], this, null, mergeStats);
                    if (mergeStats.placeholders.$isEmpty) {
                        this.meta.template = 'copy';
                    }
                }
            },
            getHandler: null
        }, Base);

        Methods.compileForDefine(node, Proto, model, owner);

        let imax = nodes == null ? 0 : nodes.length;
        for(let i = 0; i < imax; i++) {
            let decorators = null;
            let x = nodes[i];
            if (x == null) {
                continue;
            }
            if (x.type === Dom.DECORATOR) {
                let start = i;
                i = Decorator.goToNode(nodes, i, imax);
                decorators = _Array_slice.call(nodes, start, i);
                x = nodes[i];
            }

            let name = x.tagName;
            if ('function' === name) {
                if (name === 'constructor') {
                    Proto.constructor = joinFns([Proto.constructor, x.fn]);
                    continue;
                }
                let fn = x.fn;
                Proto[x.name] = fn;
                if (x.decorators != null) {
                    let result = Decorator.wrapMethod(x.decorators, fn, Proto, x.name, model, null, owner);
                    if (is_Function(result)) {
                        Proto[x.name] = result;
                    }
                }
                if (x.flagSelf) {
                    selfFns = selfFns || [];
                    selfFns.push(x.name);
                }
                if (x.flagStatic) {
                    if (Proto.meta.statics == null) {
                        Proto.meta.statics = {};
                    }
                    Proto.meta.statics[x.name] = fn;
                }
                continue;
            }
            if ('slot' === name || 'event' === name) {
                if ('event' === name && Proto.tagName != null) {
                    // bind the event later via the component
                    arr.push(x);
                    continue;
                }
                let type = name + 's';
                let fns = Proto[type];
                if (fns == null) {
                    fns = Proto[type] = {};
                }
                fns[x.name] = x.flagPrivate ? slot_privateWrap(x.fn) : x.fn;
                if (x.decorators != null) {
                    let result = Decorator.wrapMethod(x.decorators, x.fn, fns, x.name, model, null, owner);
                    if (is_Function(result)) {
                        fns[x.name] = result;
                    }
                }
                continue;
            }
            if ('pipe' === name) {
                custom_Tags.pipe.attach(x, Proto);
                continue;
            }
            if ('define' === name || 'let' === name) {
                let register = name === 'define'
                    ? Define.registerGlobal
                    : Define.registerScoped;
                register(x, model, Proto);
                continue;
            }
            if ('var' === name) {
                let obj = x.getObject(model, null, owner),
                    key, val;
                for(key in obj) {
                    val = obj[key];
                    if (key === 'meta' || key === 'model' || key === 'attr' || key === 'compos') {
                        Proto[key] = obj_extend(Proto[key], val);
                        continue;
                    }
                    if (key === 'scope') {
                        if (is_Object(val)) {
                            Proto.scope = obj_extend(Proto.scope, val);
                            continue;
                        }
                    }
                    let scope = Proto.scope;
                    if (scope == null) {
                        Proto.scope = scope = {};
                    }
                    scope[key] = val;
                    Proto[key] = val;
                }
                continue;
            }

            if (decorators != null) {
                arr.push.apply(arr, decorators);
            }
            arr.push(x);
        }
        return Proto;
    }
    function compo_extends(extends_, model, ctr) {
        let args = [];
        if (extends_ == null)
            return args;

        let imax = extends_.length,
            i = -1,
            x;
        while( ++i < imax ){
            x = extends_[i];
            if (x.compo) {
                let compo = customTag_get(x.compo, ctr);
                if (compo != null) {
                    args.unshift(compo);
                    continue;
                }

                let obj = expression_eval(x.compo, model, null, ctr);
                if (obj != null) {
                    args.unshift(obj);
                    continue;
                }
                log_error('Nor component, nor scoped data is resolved:', x.compo);
                continue;
            }
        }
        return args;
    }

    function compo_fromNode(node, model, ctr, Base) {
        let extends_ = node['extends'],
            args_ = node['arguments'],
            as_ = node['as'],
            tagName,
            attr;
        if (as_ != null) {
            let x = parser_parse(as_);
            tagName = x.tagName;
            attr = obj_extend(node.attr, x.attr);
        }

        let name = node.name,
            Proto = compo_prototype(node, name, tagName, attr, node.nodes, ctr, model, Base),
            args = compo_extends(extends_, model, ctr)
            ;


        let Ctor = Component.createExt(Proto, args);
        if (Proto.meta.statics) {
            obj_extend(Ctor, Proto.meta.statics);
        }
        return Ctor;
    }

    function trav_location(ctr) {
        while(ctr != null) {
            if (ctr.location) {
                return ctr.location;
            }
            if (ctr.resource && ctr.resource.location) {
                return ctr.resource.location;
            }
            ctr = ctr.parent;
        }
        return null;
    }

    function slot_privateWrap(fn) {
        return function (mix) {
            if (mix != null && mix.stopPropagation != null) {
                mix.stopPropagation();
            }
            fn.apply(this, arguments);
            return false;
        };
    }
    function joinFns (fns) {
        return function () {
            let args = _Array_slice.call(arguments),
                imax = fns.length,
                i = -1;
            while (++i < imax) {
                fns[i].apply(this, args);
            }
        };
    }
    let mergeStats = { placeholders: { $isEmpty: true } };

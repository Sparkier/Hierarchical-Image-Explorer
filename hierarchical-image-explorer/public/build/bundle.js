
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35730/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function xlink_attr(node, attribute, value) {
        node.setAttributeNS('http://www.w3.org/1999/xlink', attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                if (info.blocks[i] === block) {
                                    info.blocks[i] = null;
                                }
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }
    function update_await_block_branch(info, ctx, dirty) {
        const child_ctx = ctx.slice();
        const { resolved } = info;
        if (info.current === info.then) {
            child_ctx[info.value] = resolved;
        }
        if (info.current === info.catch) {
            child_ctx[info.error] = resolved;
        }
        info.block.p(child_ctx, dirty);
    }
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.45.0' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\components\minis\Hexagon.svelte generated by Svelte v3.45.0 */
    const file$2 = "src\\components\\minis\\Hexagon.svelte";

    function create_fragment$2(ctx) {
    	let defs;
    	let pattern;
    	let image_1;
    	let image_1_width_value;
    	let image_1_height_value;
    	let pattern_id_value;
    	let pattern_height_value;
    	let pattern_width_value;
    	let t0;
    	let g;
    	let polygon;
    	let text_1;
    	let t1;
    	let text_1_transform_value;
    	let g_transform_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			defs = svg_element("defs");
    			pattern = svg_element("pattern");
    			image_1 = svg_element("image");
    			t0 = space();
    			g = svg_element("g");
    			polygon = svg_element("polygon");
    			text_1 = svg_element("text");
    			t1 = text(/*text*/ ctx[5]);
    			attr_dev(image_1, "width", image_1_width_value = /*side*/ ctx[0] * 2);
    			attr_dev(image_1, "height", image_1_height_value = /*side*/ ctx[0] * 2);
    			xlink_attr(image_1, "xlink:href", /*image*/ ctx[1]);
    			add_location(image_1, file$2, 44, 2, 1172);
    			attr_dev(pattern, "id", pattern_id_value = `image-bg_${/*image*/ ctx[1]}`);
    			attr_dev(pattern, "height", pattern_height_value = /*side*/ ctx[0] * 2);
    			attr_dev(pattern, "width", pattern_width_value = /*side*/ ctx[0] * 2);
    			attr_dev(pattern, "patternUnits", "userSpaceOnUse");
    			add_location(pattern, file$2, 43, 1, 1069);
    			add_location(defs, file$2, 42, 0, 1060);
    			attr_dev(polygon, "class", "hex svelte-1bvyzxq");
    			attr_dev(polygon, "points", "" + (/*p5*/ ctx[11] + " " + /*p4*/ ctx[10] + " " + /*p2*/ ctx[8] + " " + /*p1*/ ctx[7] + " " + /*p3*/ ctx[9] + " " + /*p6*/ ctx[12]));
    			attr_dev(polygon, "fill", /*fill*/ ctx[6]);
    			add_location(polygon, file$2, 49, 0, 1363);
    			attr_dev(text_1, "transform", text_1_transform_value = "translate(" + /*side*/ ctx[0] + "," + /*side*/ ctx[0] + ")");
    			attr_dev(text_1, "font-family", "Verdana");
    			attr_dev(text_1, "font-size", "30");
    			attr_dev(text_1, "text-anchor", "middle");
    			attr_dev(text_1, "fill", "red");
    			add_location(text_1, file$2, 50, 0, 1440);
    			attr_dev(g, "transform", g_transform_value = "scale(" + /*scale*/ ctx[2] + ") translate(" + /*x*/ ctx[3] + ", " + /*y*/ ctx[4] + ")");
    			add_location(g, file$2, 48, 0, 1287);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, defs, anchor);
    			append_dev(defs, pattern);
    			append_dev(pattern, image_1);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, g, anchor);
    			append_dev(g, polygon);
    			append_dev(g, text_1);
    			append_dev(text_1, t1);

    			if (!mounted) {
    				dispose = listen_dev(g, "click", /*handleClick*/ ctx[13], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*side*/ 1 && image_1_width_value !== (image_1_width_value = /*side*/ ctx[0] * 2)) {
    				attr_dev(image_1, "width", image_1_width_value);
    			}

    			if (dirty & /*side*/ 1 && image_1_height_value !== (image_1_height_value = /*side*/ ctx[0] * 2)) {
    				attr_dev(image_1, "height", image_1_height_value);
    			}

    			if (dirty & /*image*/ 2) {
    				xlink_attr(image_1, "xlink:href", /*image*/ ctx[1]);
    			}

    			if (dirty & /*image*/ 2 && pattern_id_value !== (pattern_id_value = `image-bg_${/*image*/ ctx[1]}`)) {
    				attr_dev(pattern, "id", pattern_id_value);
    			}

    			if (dirty & /*side*/ 1 && pattern_height_value !== (pattern_height_value = /*side*/ ctx[0] * 2)) {
    				attr_dev(pattern, "height", pattern_height_value);
    			}

    			if (dirty & /*side*/ 1 && pattern_width_value !== (pattern_width_value = /*side*/ ctx[0] * 2)) {
    				attr_dev(pattern, "width", pattern_width_value);
    			}

    			if (dirty & /*fill*/ 64) {
    				attr_dev(polygon, "fill", /*fill*/ ctx[6]);
    			}

    			if (dirty & /*text*/ 32) set_data_dev(t1, /*text*/ ctx[5]);

    			if (dirty & /*side*/ 1 && text_1_transform_value !== (text_1_transform_value = "translate(" + /*side*/ ctx[0] + "," + /*side*/ ctx[0] + ")")) {
    				attr_dev(text_1, "transform", text_1_transform_value);
    			}

    			if (dirty & /*scale, x, y*/ 28 && g_transform_value !== (g_transform_value = "scale(" + /*scale*/ ctx[2] + ") translate(" + /*x*/ ctx[3] + ", " + /*y*/ ctx[4] + ")")) {
    				attr_dev(g, "transform", g_transform_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(defs);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(g);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let fill;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Hexagon', slots, []);
    	const dispatch = createEventDispatcher();
    	let { side = 100 } = $$props;
    	let { color = "green" } = $$props;
    	let { image = "" } = $$props;
    	let { scale = 1 } = $$props;
    	let { x = 0 } = $$props;
    	let { y = 0 } = $$props;
    	let { text = "" } = $$props;

    	//export let textSize:string = "20";
    	const t = 120 * Math.PI / 180;

    	const a = side * Math.sqrt(3) / 2;
    	const P1 = { x: 0, y: a };

    	const P2 = {
    		x: P1.x - side * Math.cos(t),
    		y: P1.y + side * Math.sin(t)
    	};

    	const P3 = { x: P2.x, y: 0 };
    	const P4 = { x: P2.x + side, y: P2.y };
    	const P5 = { x: side * 2, y: a };
    	const P6 = { x: P2.x + side, y: 0 };
    	let p1 = P1.x + "," + P1.y;
    	let p2 = P2.x + "," + P2.y;
    	let p3 = P3.x + "," + P3.y;
    	let p4 = P4.x + "," + P4.y;
    	let p5 = P5.x + "," + P5.y;
    	let p6 = P6.x + "," + P6.y;

    	if (image == "") {
    		fill = color;
    	}

    	function handleClick() {
    		dispatch('message', { text: 'Hello!' });
    	}

    	const writable_props = ['side', 'color', 'image', 'scale', 'x', 'y', 'text'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Hexagon> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('side' in $$props) $$invalidate(0, side = $$props.side);
    		if ('color' in $$props) $$invalidate(14, color = $$props.color);
    		if ('image' in $$props) $$invalidate(1, image = $$props.image);
    		if ('scale' in $$props) $$invalidate(2, scale = $$props.scale);
    		if ('x' in $$props) $$invalidate(3, x = $$props.x);
    		if ('y' in $$props) $$invalidate(4, y = $$props.y);
    		if ('text' in $$props) $$invalidate(5, text = $$props.text);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		side,
    		color,
    		image,
    		scale,
    		x,
    		y,
    		text,
    		t,
    		a,
    		P1,
    		P2,
    		P3,
    		P4,
    		P5,
    		P6,
    		p1,
    		p2,
    		p3,
    		p4,
    		p5,
    		p6,
    		handleClick,
    		fill
    	});

    	$$self.$inject_state = $$props => {
    		if ('side' in $$props) $$invalidate(0, side = $$props.side);
    		if ('color' in $$props) $$invalidate(14, color = $$props.color);
    		if ('image' in $$props) $$invalidate(1, image = $$props.image);
    		if ('scale' in $$props) $$invalidate(2, scale = $$props.scale);
    		if ('x' in $$props) $$invalidate(3, x = $$props.x);
    		if ('y' in $$props) $$invalidate(4, y = $$props.y);
    		if ('text' in $$props) $$invalidate(5, text = $$props.text);
    		if ('p1' in $$props) $$invalidate(7, p1 = $$props.p1);
    		if ('p2' in $$props) $$invalidate(8, p2 = $$props.p2);
    		if ('p3' in $$props) $$invalidate(9, p3 = $$props.p3);
    		if ('p4' in $$props) $$invalidate(10, p4 = $$props.p4);
    		if ('p5' in $$props) $$invalidate(11, p5 = $$props.p5);
    		if ('p6' in $$props) $$invalidate(12, p6 = $$props.p6);
    		if ('fill' in $$props) $$invalidate(6, fill = $$props.fill);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*image*/ 2) {
    			$$invalidate(6, fill = `url(#image-bg_${image})`);
    		}
    	};

    	return [
    		side,
    		image,
    		scale,
    		x,
    		y,
    		text,
    		fill,
    		p1,
    		p2,
    		p3,
    		p4,
    		p5,
    		p6,
    		handleClick,
    		color
    	];
    }

    class Hexagon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			side: 0,
    			color: 14,
    			image: 1,
    			scale: 2,
    			x: 3,
    			y: 4,
    			text: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Hexagon",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get side() {
    		throw new Error("<Hexagon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set side(value) {
    		throw new Error("<Hexagon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Hexagon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Hexagon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get image() {
    		throw new Error("<Hexagon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set image(value) {
    		throw new Error("<Hexagon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scale() {
    		throw new Error("<Hexagon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scale(value) {
    		throw new Error("<Hexagon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get x() {
    		throw new Error("<Hexagon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<Hexagon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<Hexagon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<Hexagon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get text() {
    		throw new Error("<Hexagon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Hexagon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Hierarchical.svelte generated by Svelte v3.45.0 */
    const file$1 = "src\\components\\Hierarchical.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    // (62:2) {:catch error}
    function create_catch_block(ctx) {
    	let p;
    	let t_value = /*error*/ ctx[15].message + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = svg_element("p");
    			t = text(t_value);
    			add_location(p, file$1, 62, 4, 2255);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(62:2) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (45:2) {:then}
    function create_then_block(ctx) {
    	let hexagon;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;

    	hexagon = new Hexagon({
    			props: {
    				side: /*hexaSide*/ ctx[0],
    				x: getSVGwidth() / 2 - /*hexaSide*/ ctx[0],
    				y: 30,
    				text: /*parentNode*/ ctx[1].nodeID.toString(),
    				color: "limegreen",
    				image: getImage(/*parentNode*/ ctx[1].nodeID)
    			},
    			$$inline: true
    		});

    	hexagon.$on("message", /*message_handler*/ ctx[9]);
    	let each_value = /*children*/ ctx[2];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*child*/ ctx[12].nodeID;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			create_component(hexagon.$$.fragment);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			mount_component(hexagon, target, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const hexagon_changes = {};
    			if (dirty & /*hexaSide*/ 1) hexagon_changes.side = /*hexaSide*/ ctx[0];
    			if (dirty & /*hexaSide*/ 1) hexagon_changes.x = getSVGwidth() / 2 - /*hexaSide*/ ctx[0];
    			if (dirty & /*parentNode*/ 2) hexagon_changes.text = /*parentNode*/ ctx[1].nodeID.toString();
    			if (dirty & /*parentNode*/ 2) hexagon_changes.image = getImage(/*parentNode*/ ctx[1].nodeID);
    			hexagon.$set(hexagon_changes);

    			if (dirty & /*getSVGwidth, hexaSide, getChildPosition, getIndexOfNodeID, children, getImage, updateTree*/ 213) {
    				each_value = /*children*/ ctx[2];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block, each_1_anchor, get_each_context);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(hexagon.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(hexagon.$$.fragment, local);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(hexagon, detaching);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(45:2) {:then}",
    		ctx
    	});

    	return block;
    }

    // (51:2) {#each children as child (child.nodeID)}
    function create_each_block(key_1, ctx) {
    	let first;
    	let hexagon;
    	let line;
    	let line_y__value;
    	let line_x__value_1;
    	let current;

    	function message_handler_1(...args) {
    		return /*message_handler_1*/ ctx[10](/*child*/ ctx[12], ...args);
    	}

    	hexagon = new Hexagon({
    			props: {
    				side: /*hexaSide*/ ctx[0],
    				x: /*getChildPosition*/ ctx[7](/*getIndexOfNodeID*/ ctx[6](/*child*/ ctx[12].nodeID)),
    				y: 300,
    				text: /*child*/ ctx[12].nodeID.toString(),
    				color: "lightblue",
    				image: getImage(/*child*/ ctx[12].nodeID)
    			},
    			$$inline: true
    		});

    	hexagon.$on("message", message_handler_1);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(hexagon.$$.fragment);
    			line = svg_element("line");
    			attr_dev(line, "x1", getSVGwidth() / 2);
    			attr_dev(line, "y1", line_y__value = 4 + /*hexaSide*/ ctx[0] * 2);
    			attr_dev(line, "x2", line_x__value_1 = /*getChildPosition*/ ctx[7](/*getIndexOfNodeID*/ ctx[6](/*child*/ ctx[12].nodeID)) + /*hexaSide*/ ctx[0]);
    			attr_dev(line, "y2", "300");
    			set_style(line, "stroke", "black");
    			set_style(line, "stroke-width", "2");
    			add_location(line, file$1, 56, 4, 2029);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(hexagon, target, anchor);
    			insert_dev(target, line, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const hexagon_changes = {};
    			if (dirty & /*hexaSide*/ 1) hexagon_changes.side = /*hexaSide*/ ctx[0];
    			if (dirty & /*children*/ 4) hexagon_changes.x = /*getChildPosition*/ ctx[7](/*getIndexOfNodeID*/ ctx[6](/*child*/ ctx[12].nodeID));
    			if (dirty & /*children*/ 4) hexagon_changes.text = /*child*/ ctx[12].nodeID.toString();
    			if (dirty & /*children*/ 4) hexagon_changes.image = getImage(/*child*/ ctx[12].nodeID);
    			hexagon.$set(hexagon_changes);

    			if (!current || dirty & /*hexaSide*/ 1 && line_y__value !== (line_y__value = 4 + /*hexaSide*/ ctx[0] * 2)) {
    				attr_dev(line, "y1", line_y__value);
    			}

    			if (!current || dirty & /*children, hexaSide*/ 5 && line_x__value_1 !== (line_x__value_1 = /*getChildPosition*/ ctx[7](/*getIndexOfNodeID*/ ctx[6](/*child*/ ctx[12].nodeID)) + /*hexaSide*/ ctx[0])) {
    				attr_dev(line, "x2", line_x__value_1);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(hexagon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(hexagon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(hexagon, detaching);
    			if (detaching) detach_dev(line);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(51:2) {#each children as child (child.nodeID)}",
    		ctx
    	});

    	return block;
    }

    // (43:22)       <p>Loading data</p>    {:then}
    function create_pending_block(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = svg_element("p");
    			t = text("Loading data");
    			add_location(p, file$1, 43, 4, 1440);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(43:22)       <p>Loading data</p>    {:then}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let svg;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		error: 15,
    		blocks: [,,,]
    	};

    	handle_promise(/*setupTree*/ ctx[3](), info);

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			info.block.c();
    			attr_dev(svg, "id", "svg");
    			attr_dev(svg, "width", "100%");
    			attr_dev(svg, "height", "580px");
    			attr_dev(svg, "class", "svelte-mm9hc3");
    			add_location(svg, file$1, 41, 0, 1368);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			info.block.m(svg, info.anchor = null);
    			info.mount = () => svg;
    			info.anchor = null;
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			update_await_block_branch(info, ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			info.block.d();
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const serverAdress = "http://localhost:25679/";

    function getSVGwidth() {
    	return document.getElementById("svg").clientWidth;
    }

    function getImage(nodeID) {
    	return `${serverAdress}hc/repImage/${nodeID}`;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Hierarchical', slots, []);
    	let parentNode;
    	let children;
    	let { hexaSide = 100 } = $$props;
    	let { childPadding = 400 } = $$props;
    	const svgElem = document.getElementById("svg");

    	async function setupTree() {
    		const response = await fetch(`${serverAdress}hc/root`);
    		var root = await response.json();
    		$$invalidate(1, parentNode = root);
    		$$invalidate(2, children = root.children);
    		return root;
    	}

    	async function updateTree(newRootID) {
    		const response = await fetch(`${serverAdress}hc/nodes/${newRootID}`);
    		var node = await response.json();
    		$$invalidate(1, parentNode = node);
    		$$invalidate(2, children = node.children);
    		return node;
    	}

    	async function updateParent() {
    		const parentRes = await fetch(`${serverAdress}hc/parent/${parentNode.nodeID}`);
    		const parent = await parentRes.json();
    		updateTree(parent.nodeID);
    	}

    	function getIndexOfNodeID(nodeID) {
    		const elem = children.filter(e => e.nodeID == nodeID)[0];
    		return children.indexOf(elem);
    	}

    	function getChildPosition(childIndex) {
    		return childPadding + (getSVGwidth() - 2 * childPadding) * (childIndex / (children.length - 1)) - hexaSide;
    	}

    	const writable_props = ['hexaSide', 'childPadding'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Hierarchical> was created with unknown prop '${key}'`);
    	});

    	const message_handler = async e => updateParent();
    	const message_handler_1 = async (child, e) => updateTree(child.nodeID);

    	$$self.$$set = $$props => {
    		if ('hexaSide' in $$props) $$invalidate(0, hexaSide = $$props.hexaSide);
    		if ('childPadding' in $$props) $$invalidate(8, childPadding = $$props.childPadding);
    	};

    	$$self.$capture_state = () => ({
    		serverAdress,
    		Hexagon,
    		parentNode,
    		children,
    		hexaSide,
    		childPadding,
    		svgElem,
    		setupTree,
    		updateTree,
    		updateParent,
    		getIndexOfNodeID,
    		getSVGwidth,
    		getChildPosition,
    		getImage
    	});

    	$$self.$inject_state = $$props => {
    		if ('parentNode' in $$props) $$invalidate(1, parentNode = $$props.parentNode);
    		if ('children' in $$props) $$invalidate(2, children = $$props.children);
    		if ('hexaSide' in $$props) $$invalidate(0, hexaSide = $$props.hexaSide);
    		if ('childPadding' in $$props) $$invalidate(8, childPadding = $$props.childPadding);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		hexaSide,
    		parentNode,
    		children,
    		setupTree,
    		updateTree,
    		updateParent,
    		getIndexOfNodeID,
    		getChildPosition,
    		childPadding,
    		message_handler,
    		message_handler_1
    	];
    }

    class Hierarchical extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { hexaSide: 0, childPadding: 8 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Hierarchical",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get hexaSide() {
    		throw new Error("<Hierarchical>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hexaSide(value) {
    		throw new Error("<Hierarchical>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get childPadding() {
    		throw new Error("<Hierarchical>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set childPadding(value) {
    		throw new Error("<Hierarchical>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.45.0 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let div;
    	let hierarchical;
    	let current;
    	hierarchical = new Hierarchical({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Hierarchical Demo";
    			t1 = space();
    			div = element("div");
    			create_component(hierarchical.$$.fragment);
    			attr_dev(h1, "class", "svelte-1gps1rp");
    			add_location(h1, file, 4, 2, 103);
    			attr_dev(div, "class", "container");
    			add_location(div, file, 5, 2, 133);
    			attr_dev(main, "class", "svelte-1gps1rp");
    			add_location(main, file, 3, 0, 93);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, div);
    			mount_component(hierarchical, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(hierarchical.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(hierarchical.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(hierarchical);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Hierarchical });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
        props: {
            name: 'world',
        },
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map

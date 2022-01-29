
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
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

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
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
    	let pattern_height_value;
    	let pattern_width_value;
    	let t0;
    	let g;
    	let polygon;
    	let text_1;
    	let t1;
    	let text_1_transform_value;
    	let g_transform_value;

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
    			add_location(image_1, file$2, 37, 2, 978);
    			attr_dev(pattern, "id", "image-bg");
    			attr_dev(pattern, "height", pattern_height_value = /*side*/ ctx[0] * 2);
    			attr_dev(pattern, "width", pattern_width_value = /*side*/ ctx[0] * 2);
    			attr_dev(pattern, "patternUnits", "userSpaceOnUse");
    			add_location(pattern, file$2, 36, 1, 886);
    			add_location(defs, file$2, 35, 0, 877);
    			attr_dev(polygon, "class", "hex svelte-1bvyzxq");
    			attr_dev(polygon, "points", "" + (/*p5*/ ctx[11] + " " + /*p4*/ ctx[10] + " " + /*p2*/ ctx[8] + " " + /*p1*/ ctx[7] + " " + /*p3*/ ctx[9] + " " + /*p6*/ ctx[12]));
    			attr_dev(polygon, "fill", /*fill*/ ctx[6]);
    			add_location(polygon, file$2, 42, 0, 1146);
    			attr_dev(text_1, "transform", text_1_transform_value = "translate(" + /*side*/ ctx[0] + "," + /*side*/ ctx[0] + ")");
    			attr_dev(text_1, "font-family", "Verdana");
    			attr_dev(text_1, "font-size", "30");
    			attr_dev(text_1, "text-anchor", "middle");
    			add_location(text_1, file$2, 43, 0, 1223);
    			attr_dev(g, "transform", g_transform_value = "scale(" + /*scale*/ ctx[2] + ") translate(" + /*x*/ ctx[3] + ", " + /*y*/ ctx[4] + ")");
    			add_location(g, file$2, 41, 0, 1093);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Hexagon', slots, []);
    	let { side = 100 } = $$props;
    	let { color = "green" } = $$props;
    	let { image = "" } = $$props;
    	let { scale = 1 } = $$props;
    	let { x = "0" } = $$props;
    	let { y = "0" } = $$props;
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
    	let fill = "url('#image-bg')";

    	if (image == "") {
    		fill = color;
    	}

    	const writable_props = ['side', 'color', 'image', 'scale', 'x', 'y', 'text'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Hexagon> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('side' in $$props) $$invalidate(0, side = $$props.side);
    		if ('color' in $$props) $$invalidate(13, color = $$props.color);
    		if ('image' in $$props) $$invalidate(1, image = $$props.image);
    		if ('scale' in $$props) $$invalidate(2, scale = $$props.scale);
    		if ('x' in $$props) $$invalidate(3, x = $$props.x);
    		if ('y' in $$props) $$invalidate(4, y = $$props.y);
    		if ('text' in $$props) $$invalidate(5, text = $$props.text);
    	};

    	$$self.$capture_state = () => ({
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
    		fill
    	});

    	$$self.$inject_state = $$props => {
    		if ('side' in $$props) $$invalidate(0, side = $$props.side);
    		if ('color' in $$props) $$invalidate(13, color = $$props.color);
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

    	return [side, image, scale, x, y, text, fill, p1, p2, p3, p4, p5, p6, color];
    }

    class Hexagon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			side: 0,
    			color: 13,
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

    const { console: console_1 } = globals;
    const file$1 = "src\\components\\Hierarchical.svelte";

    function create_fragment$1(ctx) {
    	let svg;
    	let hexagon;
    	let current;

    	hexagon = new Hexagon({
    			props: {
    				x: "30",
    				y: "30",
    				text: /*parentNode*/ ctx[0].nodeID.toString()
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			create_component(hexagon.$$.fragment);
    			attr_dev(svg, "id", "svg");
    			attr_dev(svg, "width", "100%");
    			attr_dev(svg, "height", "580px");
    			attr_dev(svg, "class", "svelte-1gn5q01");
    			add_location(svg, file$1, 24, 0, 706);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			mount_component(hexagon, svg, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const hexagon_changes = {};
    			if (dirty & /*parentNode*/ 1) hexagon_changes.text = /*parentNode*/ ctx[0].nodeID.toString();
    			hexagon.$set(hexagon_changes);
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
    			if (detaching) detach_dev(svg);
    			destroy_component(hexagon);
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

    async function getRoot() {
    	const response = await fetch(`${serverAdress}hc/root`);
    	var root = await response.json();
    	return root;
    }

    async function getNode(nodeID) {
    	const response = await fetch(`${serverAdress}hc/nodes/${nodeID}`);
    	var node = await response.json();
    	return node;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Hierarchical', slots, []);
    	let { parentNode } = $$props;
    	let { childLeft } = $$props;
    	let { childRight } = $$props;

    	async function startUp() {
    		const root = await getRoot();
    		$$invalidate(0, parentNode = root);
    		$$invalidate(2, childRight = root.children[0]);
    		$$invalidate(1, childLeft = root.children[1]);
    		console.log("All loaded");
    	}

    	const writable_props = ['parentNode', 'childLeft', 'childRight'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Hierarchical> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('parentNode' in $$props) $$invalidate(0, parentNode = $$props.parentNode);
    		if ('childLeft' in $$props) $$invalidate(1, childLeft = $$props.childLeft);
    		if ('childRight' in $$props) $$invalidate(2, childRight = $$props.childRight);
    	};

    	$$self.$capture_state = () => ({
    		serverAdress,
    		Hexagon,
    		parentNode,
    		childLeft,
    		childRight,
    		getRoot,
    		getNode,
    		startUp
    	});

    	$$self.$inject_state = $$props => {
    		if ('parentNode' in $$props) $$invalidate(0, parentNode = $$props.parentNode);
    		if ('childLeft' in $$props) $$invalidate(1, childLeft = $$props.childLeft);
    		if ('childRight' in $$props) $$invalidate(2, childRight = $$props.childRight);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [parentNode, childLeft, childRight];
    }

    class Hierarchical extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			parentNode: 0,
    			childLeft: 1,
    			childRight: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Hierarchical",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*parentNode*/ ctx[0] === undefined && !('parentNode' in props)) {
    			console_1.warn("<Hierarchical> was created without expected prop 'parentNode'");
    		}

    		if (/*childLeft*/ ctx[1] === undefined && !('childLeft' in props)) {
    			console_1.warn("<Hierarchical> was created without expected prop 'childLeft'");
    		}

    		if (/*childRight*/ ctx[2] === undefined && !('childRight' in props)) {
    			console_1.warn("<Hierarchical> was created without expected prop 'childRight'");
    		}
    	}

    	get parentNode() {
    		throw new Error("<Hierarchical>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set parentNode(value) {
    		throw new Error("<Hierarchical>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get childLeft() {
    		throw new Error("<Hierarchical>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set childLeft(value) {
    		throw new Error("<Hierarchical>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get childRight() {
    		throw new Error("<Hierarchical>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set childRight(value) {
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

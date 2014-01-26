/*
x.js

(C) Bryan Matsuo 2014

This is __free__ software y'all.
*/

var X = function() {
    var _Node = function(node) {
        var self = this;

        var _nodeListToArray = function(list) {
            var a = [];
            for (var i = 0; i < list.length; i++) {
                a.push(list.item(i));
            }
            return a
        };

        var _mapNode = function(list, f) {
            return _.map(_nodeListToArray(list), f)
        };

        var _filterNode = function(nodeList, predicate) {
            var filtered = new DOMNodeList(nodeList.ownerDocument, nodeList.parentNode);
            for (var i = 0; i < nodeList.length; i++) {
                var node = nodeList.item(i);
                if (predicate(node)) {
                    filtered._appendChild(node);
                }
            }
            return filtered
        };

        var _attr = function() {
            if (node === null)  return _Node(null);

            var nsuri, local;
            if (arguments.length === 2) {
                nsuri = arguments[0];
                local = arguments[1];
            } else if (arguments.length === 1) {
                local = arguments[0];
            } else {
                throw 'unexpected number of arguments: ' + arguments.length
            }

            var a;
            if (nsuri) {
                a = node.getAttributeNodeNS(nsuri, local);
            } else {
                a = node.getAttributeNode(local);
            }
            a = _Node(a);

            return a;
        };

        var _find = function(filter) {
            if (node === null)  return _Node(null);
            throw 'unimplemented';
        };

        var _first = function(filter) {
            if (node === null)  return _Node(null);
            throw 'unimplemented';
        };

        var _children = function(filter) {
            var children;
            if (node === null) {
                children = [];
            } else {
                children = node.getChildNodes();
                if (typeof filter === 'undefined') {
                    // noop
                } else if (typeof filter === 'string') {
                    children = _filterNode(children, function(child) { return child.localName === filter; });
                } else {
                    // duck typing here. is this the right thing to do?
                    if (typeof filter.ns === 'function' || typeof filter.local === 'function') {
                        var ns = filter.ns().uri();
                        var local = filter.local();

                        children = _filterNode(children, function(child) {
                            return child.getNamespaceURI().toString() === ns && child.localName === local;
                        });
                    } else if (typeof filter.uri === 'function') {
                        var ns = filter.uri();
                        children = _filterNode(children, function(child) {
                            return child.getNamespaceURI().toString() === ns;
                        });
                    }
                }
                children = _mapNode(children, function(child) { return _Node(child) });
            }
            children.head = function() {
                if (children.length === 0) {
                    return X.Node(null);
                }
                return children[0];
            };
            return children;
        };

        // TODO moar efficiency. remove the head() method.
        var _firstChild = function(filter) { return _children(filter).head(); };

        var _ns = function() {
            if (node === null) return null;
            var ns = node.getNamespaceURI();
            if (!ns) return null;
            return _NS(ns.toString());
        };

        var _local = function() {
            if (node === null) return null;
            return node.localName;
        };

        var _text = function() {
            if (node === null) return null;

            return node.nodeValue.toString();
        };
        var _int = function() { return parseInt(_text()); };
        var _float = function() { return parseFloat(_text()); };
        var _bool = function() {
            var t = _text();
            if (t === 'true') return true;
            if (t === 'false') return false;
            return null;
        };

        return {
            attr: _attr,
            children: _children,
            child: _firstChild,
            text: _text,
            int: _int,
            float: _float,
            bool: _bool,
            ns: _ns,
            local: _local,
            node: function() { return node; }
        };
    };

    var _NS = function(uri) {
        var self = function(local) {
            return {
                ns: function() { return _NS(uri); },
                local: function() { return local; },
                toString: function() { return '{' + uri + '}:' + local }
            };
        };
        self.uri = function() { return uri; };
        return self;
    };

    var _load = function(rawxml) {
        var _parser = new DOMImplementation(),
            _dom = _parser.loadXML(rawxml),
            _domTree = _dom.getDocumentElement();
        return new _Node(_domTree);
    };

    return {
        Node: _Node,
        NS: _NS,
        load: _load
    };
}()

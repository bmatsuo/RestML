/*
rest.js

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
                            return child.namespaceURI.toString() === ns && child.localName === local;
                        });
                    } else if (typeof filter.uri === 'function') {
                        var ns = filter.uri();
                        children = _filterNode(children, function(child) {
                            return child.namespaceURI.toString() === ns;
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
            var ns = node.namespaceURI.toString();
            if (ns) return null;
            return NS(ns);
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

    return {
        Node: _Node,
        NS: _NS
    };
}()

var restml = angular.module('restml', []);

restml.factory('restSpec', ['$rootScope', '$http', '$q', function($rootScope, $http, $q) {
    var _dom,  // the specification DOM
        _tree; // the specification DOM tree

    var _loadXML = function(data) {
        var q = $q.defer();

        setTimeout(function() {
            $rootScope.$apply(function() {
                try {
                    var _parser = new DOMImplementation(),
                        _dom = _parser.loadXML(data),
                        _domTree = _dom.getDocumentElement();

                    q.resolve({
                        dom: _dom,
                        domTree: _domTree,
                    });
                }
                catch(e) {
                    console.error('fuck', e);
                    q.reject(e);
                }
            });
        }, 0);

        return q.promise;
    };

    var NS_SERVICE = 'http://x.bmats.co/rest-service/2013.01',
        NS_MODEL = 'http://x.bmats.co/rest-model/2013.01',
        NS_META = 'http://x.bmats.co/rest-meta/2013.01',
        NS_REST = 'http://x.bmats.co/rest/2013.01';
    var NS = {
            Service: X.NS(NS_SERVICE),
            Model: X.NS(NS_MODEL),
            Meta: X.NS(NS_META),
            Rest: X.NS(NS_REST)
        };

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

    var _getChildrenByTagNameNS = function(node, ns, local) {
        return _filterNode(node.childNodes, function(child) {
            return child.getNamespaceURI().toString() === ns.toString() &&
                child.localName == local;
        })
    };

    var _getMeta = function(node, key) {
        var child = _getChildrenByTagNameNS(node, NS_META, key).item(0),
            text = child ? child.childNodes.item(0) : null,
            val = text ? text.getNodeValue().toString() : undefined;
        return val;
    };

    var _getRest = function(node, key) {
        var child = _getChildrenByTagNameNS(node, NS_REST, key).item(0),
            text = child ? child.childNodes.item(0) : null,
            val = text ? text.getNodeValue().toString() : undefined;
        return val;
    }

    var Model = function(constraints) {
        var _baseType, _enum, _enumValues = [];
        if (constraints.length > 1) {
            var base = constraints[0].value;
            if (base !== 'string' &&
                base !== 'url' &&
                base !== 'boolean' &&
                base !== 'false' &&
                base !== 'true' &&
                base !== 'integer' &&
                base !== 'positive-integer' &&
                base !== 'non-negative-integer' &&
                base !== 'non-positive-integer' &&
                base !== 'negative-integer' &&
                base !== 'decimal' &&
                base !== 'positive-decimal' &&
                base !== 'non-negative-decimal' &&
                base !== 'non-positive-decimal' &&
                base !== 'negative-decimal')
                throw 'unrecognized primitive type: ' + base.value;

            _baseType = base;
            constraints = constraints.slice(1, constraints.length)
            _.each(constraints, function(c) {
                if (c.type === 'min') {
                    c.value = parseFloat(c.value);
                } else if (c.type === 'max') {
                    c.value = parseFloat(c.value);
                } else if (c.type === 'minLength') {
                    c.value = parseFloat(c.value);
                } else if (c.type === 'maxLength') {
                    c.value = parseFloat(c.value);
                } else if (c.type === 'minExclusive') {
                    c.value = parseFloat(c.value);
                } else if (c.type === 'maxExclusive') {
                    c.value = parseFloat(c.value);
                } else if (c.type === 'enumeration') {
                    _enum = true;
                }
            });

            if (_enum) {
                _enumValues = _.filter(constraints, function() { return c.type === 'enumeration'; });
                _enumValues = _.map(_enumValues,    function() { return c.value; });
            }
        }

        var _minimizeConstraints = function() {
            // TODO
        };

        var _validate = function(data) {
            var errors = [],
                decimal;

            if (_enum && !_.find(_enumValues, function(v) { return v === data; })) {
                errors.push('value must be one of {' + _enumValues.join(', ') + '}');
            }

            if (_baseType === 'integer' ||
                _baseType === 'positive-integer' || _baseType === 'non-negative-integer' ||
                _baseType === 'non-positive-integer' || _baseType === 'negative-integer') {
                decimal = parseInt(data);
                if (isNaN(decimal)) {
                    errors.push({reason: 'must be an integer'});
                } else if (decimal < 0 && (_baseType === 'postive-integer' || _baseType === 'non-negative-integer')) {
                    errors.push({reason: 'cannot not be negative'});
                } else if (decimal > 0 && (_baseType === 'negative-integer' || _baseType === 'non-positive-integer')) {
                    errors.push({reason: 'cannot not be positive'});
                } else if (decimal === 0 && (_baseType === 'positive-integer' || _baseType ==='negative-integer')) {
                    errors.push({reason: 'cannot not be zero'});
                }
            } else if (_baseType === 'decimal' ||
                _baseType === 'positive-decimal' || _baseType === 'non-negative-decimal' ||
                _baseType === 'non-positive-decimal' || _baseType === 'negative-decimal') {
                decimal = parseInt(data);
                if (isNaN(decimal)) {
                    errors.push({reason: 'must be a decimal number'});
                } else if (decimal < 0 && (_baseType === 'postive-decimal' || _baseType === 'non-negative-decimal')) {
                    errors.push({reason: 'cannot not be negative'});
                } else if (decimal > 0 && (_baseType === 'negative-decimal' || _baseType === 'non-positive-decimal')) {
                    errors.push({reason: 'cannot not be positive'});
                } else if (decimal === 0 && (_baseType === 'positive-decimal' || _baseType ==='negative-decimal')) {
                    errors.push({reason: 'cannot not be zero'});
                }
            } else if (_baseType === 'boolean' || _baseType === 'true' || _baseType === 'false') {
                var isBool = data === 'true' || data === 'false',
                    b = Boolean(data);
                if (!isBool) {
                    errors.push({reason: 'must be boolean'});
                } else if (b && _baseType === 'false') {
                    errors.push({reason: 'must be false'});
                } else if (!b && _baseType === 'true') {
                    errors.push({reason: 'must be true'});
                }
            } else if (_baseType === 'url') {
                var urlre = /^https?:\/\/([^.]+[.])[^.]{2,}(\/[^\/])*$/;
                if (!data.match(urlre)) {
                    errors.push({reason: 'must be a url'});
                }
            }

            _.each(constraints, function(c) {
                if (c.type === 'min') {
                    if (decimal < c.value) {
                        errors.push({reason: 'must be at least ' + n.toString()});
                    }
                } else if (c.type === 'max') {
                    if (c.value < decimal) {
                        errors.push({reason: 'must not be more than ' + n.toString()});
                    }
                } else if (c.type === 'minLength') {
                    if (data.length < c.value) {
                        errors.push({reason: 'must be at least ' + n.toString() + 'characters'});
                    }
                } else if (c.type === 'maxLength') {
                    if (c.value < data.length) {
                        errors.push({reason: 'must not be more than ' + n.toString() + 'characters'});
                    }
                } else if (c.type === 'minExclusive') {
                    if (decimal <= c.value) {
                        errors.push({reason: 'must be greater than ' + c.value.toString()});
                    }
                } else if (c.type === 'maxExclusive') {
                    if (c.value <= decimal) {
                        errors.push({reason: 'must be less than ' + c.value.toString()});
                    }
                }
            });


            return errors;
        };

        return {
            baseType: function() { return _baseType; },
            validate: _validate,
        };
    };

    var _buildParam = function(node) {
        var param = {};
        param.name = node.attr('name').text();
        param.type = node.attr('type').text();
        param.required = node.attr('required').bool(); // defaults false
        param.description = "??? description ???";

        param.model = {};

        var constraints = _.map(node.children(NS.Model), function(child) {
            return {
                type: child.local(),
                value: child.attr('value').text()
            };
        });

        var base = constraints.shift();
        if (base.value === 'string') {
        } else if (base.value === 'url') {
        } else if (base.value === 'boolean') {
        } else if (base.value === 'false') {
        } else if (base.value === 'true') {
        } else if (base.value === 'integer') {
        } else if (base.value === 'positive-integer') {
        } else if (base.value === 'non-negative-integer') {
        } else if (base.value === 'non-positive-integer') {
        } else if (base.value === 'negative-integer') {
        } else if (base.value === 'decimal') {
        } else if (base.value === 'positive-decimal') {
        } else if (base.value === 'non-negative-decimal') {
        } else if (base.value === 'non-positive-decimal') {
        } else if (base.value === 'negative-decimal') {
        } else {
            throw 'unrecognized primitive type: ' + base.value;
        }

        // TODO derived models
        param.model.baseType = base.value;
        param.model.constraints = constraints;

        return param;
    };

    var _buildModelRef = function(node) {
        // FIXME no xml representation
        var model = {};
        model = {
            title: "OK",
            description: "A generic success message"
        }
        return model;
    };

    var _statuses = {
        "1xx": "Informal",
        "2xx": "Success",
        "3xx": "Redirection",
        "4xx": "Client Error",
        "5xx": "Server Error"
    };

    var _buildResponse = function(node) {
        var response = {};

        response.statusCode = node.attr('status').text();
        response.status = _statuses[response.statusCode];
        response.models = _.map(node.children(NS.Rest('model')), _buildModelRef);

        return response;
    };

    var _buildAction = function(node) {
        var action = {};
        action.method = node.attr('method').text();

        action.title = node.child(NS.Meta('title')).child().text();
        action.subtitle = node.child(NS.Meta('subtitle')).child().text();
        action.description = node.child(NS.Meta('description')).child().text();

        action.params = _.map(node.children(NS.Rest('param')), _buildParam);
        action.responses = _.map(node.children(NS.Rest('response')), _buildResponse);

        return action;
    };

    var _buildResource = function(node) {
        return {
            nickname: "watches", // FIXME
            path: node.attr('path').text(),
            actions: _.map(node.children(NS.Rest('action')), _buildAction)
        };
    };

    var _buildGroup = function(node) {
        return {
            title: node.child(NS.Meta('title')).child().text(),
            subtitle: node.child(NS.Meta('subtitle')).child().text(),
            description: node.child(NS.Meta('description')).child().text(),
            resources: _.map(
                node.children(NS.Rest('resource')),
                _buildResource)
        };
    };

    var _buildModel = function(node) {
        var model = {};
        model.id = node.attr('id').text();
        model.title = node.child(NS.Meta('title')).child().text();
        model.subtitle = node.child(NS.Meta('subtitle')).child().text();
        model.description = node.child(NS.Meta('description')).child().text();
        return model;
    };

    var _buildApi_really = function(node) {
        var api = {};

        api.id = node.attr('id').text();
        api.title = node.child(NS.Meta('title')).child().text();
        api.subtitle = node.child(NS.Meta('subtitle')).child().text();
        api.description = node.child(NS.Meta('description')).child().text();
        api.baseUrl = node.attr('baseUrl').text();
        api.version = node.attr('version').text();
        api.groups = _.map(node.children(NS.Rest('group')), _buildGroup);
        api.models = _.map(node.children(NS.Rest('model')), _buildModel);

        return api;
    }

    var _buildApi = function(node) {
        var id = node.attr('id').text();
        var q = $q.defer();

        var href = node.attr('href').text();
        if (href !== null) {
            if (href === '') {
                console.log('WARNING: empty href attribute on rest:api "'+id+'"');
            } else {
                console.log('NOTICE: fetching rest:api "'+id+'"');
                $http.get(href).
                    success(function(data, status) {
                        _pflatmap(_loadXML(data), function(xml) {
                            return _pmap(_buildApi(X.Node(xml.domTree)), function(api) { // FIXME i'm losing information here.
                                if (api.id !== id) {
                                    var msg = 'rest:api at '+href;
                                    msg += ' has id "'+api.id+'"';
                                    msg += ' when id "'+id+'"';
                                    msg += ' is expected';
                                    q.reject(msg)
                                } else {
                                    q.resolve(api);
                                }
                            })
                        })
                    }).
                    error(function(data, status) {
                        q.reject('could not retrieve rest:api "'+id+'"');
                    });
            }
        } else {
            console.log('building api specification "'+id+'"')
            q.resolve(_buildApi_really(node))
        }
        return q.promise;
    };

    var _buildLicense = function(node) {
        var license = {};
        license.type = node.attr('type').text();
        license.href = node.attr('href').text();
        return license;
    };

    var _buildTerms = function(node) {
        var terms = {};
        terms.type = node.attr('type').text();
        terms.href = node.attr('href').text();
        return terms;
    };

    var _async = function(fn) {
        return function() {
            var args = arguments;
            var q = $q.defer();
            setTimeout(function(){
                $rootScope.$apply(function() {
                    try { q.resolve(fn.apply(this, args)); }
                    catch(e) { q.reject(e); }
                });
            }, 0);
            return q.promise;
        }
    };
    var _pmap = function(p, fn) {
        return _pflatmap(p, _async(fn));
    };
    var _pmap2 = function(p1, p2, fn) {
        return _pflatmap(p1, function(x) {
            return _pmap(p2, function(y) {
                return fn(x, y);
            });
        })
    };
    var _pflatmap = function(p, fn) {
        var q = $q.defer();
        p.then(function(x) {
            try { fn(x).then(q.resolve, q.reject); }
            catch(e) { q.reject(e); }
        }, q.reject);
        return q.promise;
    };
    var _pseq = function(ps) {
        if (ps.length == 0) {
            var q = $q.defer();
            q.resolve([]);
            return q.promise;
        } else {
            var head = ps[0];
            var tail = ps.slice(1, ps.length);
            var cat = function(h, t) { return [h].concat(t); };
            return _pmap2(head, _pseq(tail), cat);
        }
    };

    var _buildService = function(node) {
        node = X.Node(node);
        console.log('building api specifications');
        var apiPromises = _.map(node.children(NS.Rest('api')), _buildApi);
        return _pmap(_pseq(apiPromises), function(apis) {
            var service = {};

            service.apis = apis;

            service.title = node.child(NS.Meta('title')).child().text();
            service.subtitle = node.child(NS.Meta('subtitle')).child().text();
            service.description = node.child(NS.Meta('description')).child().text();

            service.licenses = _.map(node.children(NS.Meta('license')), _buildLicense);
            service.terms = _.map(node.children(NS.Meta('terms')), _buildTerms);
            return service;
        })
    };

    var _buildSpec = function(xml) {
        var root = xml.domTree;

        if (root.getNamespaceURI().toString() !== NS_SERVICE) {
            throw 'invalid namespace: ' + ns;
        }

        console.log('building service specification');
        return _pmap(_buildService(xml.domTree), function(service) {
            return {
                xml: xml,
                service: service
            };
        });
    };

    var _load = function(src) {
        var q = $q.defer();
        $http.get(src).
            success(function(data, status, header) {
                _pmap(_loadXML(data), _buildSpec).
                    then(q.resolve, q.reject);
            }).
            error(function(data, status) {
                console.log('could not retreive data:', src)
                q.reject(data, status);
            });
        return q.promise;
    };

    return {
        loadXML: _loadXML,
        load: _load
    };
}]);

restml.directive('rest', ['restSpec', function(restSpec) {
    return {
        template: '<div class="restml service-specification" ng-transclude></div>',
        restrict: "E",
        replace: true,
        transclude: true,
        scope: {
            src: '=',
            onLoad: '&'
        },
        link: function($scope, element) {
            $scope.service = null;
            $scope.title = "REST Service";
            $scope.description = "Just another REST service.";
            $scope.apis = [];

            var _src;

            var _init = function(restml) {
                console.log("initializing rest directive:", $scope.src);
                if (typeof $scope.src === 'undefined') {
                    console.log("clearing rest directive");
                    $scope.service = null;
                    return;
                }
                if (typeof $scope.src !== 'string') {
                    console.error('rest src is not a url:', $scope.src);
                    return;
                }
                if (_src === $scope.src) { // src must be a string for this to work
                    if ($scope.service !== null) {
                        console.log("rest directive already initialized");
                        // nothing to do
                        return;
                    }
                }

                _src = $scope.src;
                $scope.service = null;

                restSpec.load(_src).then(
                    function(data) {
                        if (typeof $scope.onLoad !== 'undefined') {
                            $scope.onLoad(data);
                        }
                    },
                    function(data, status) {
                        console.log('rejected:', status);
                    });
            };

            $scope.$watch('src', _init);
        }
    };
}]);

restml.directive('restAction', ['restSpec', function(restSpec) {
    var template = '';
    template += '<div class="restml action-specification">';
    template += '<form ng-submit="submit()" ng-transclude></form>'
    template += '</div>';
    return {
        template: template,
        restrict: "E",
        replace: true,
        transclude: true,
        scope: {
            resource: '=',
            action: '='
        },
        link: function($scope, element) {
            $scope.submit = function() {
                // retreive parameter values
                var params = {};
                var paramElements = element.contents()[0].getElementsByClassName('rest-action-param');
                paramElements = _.map(paramElements, function(elem) { return angular.element(elem); });
                _.each(paramElements, function(elem) { params[elem.attr('name')] = elem.val(); });
                console.log('params:', params);

                // compute acceptable content-types
                var accepts = [];
                var acceptElements = element.contents()[0].getElementsByClassName('rest-action-accept');
                acceptElements = _.map(acceptElements, function(elem) { return angular.element(elem); });
                accepts = _.map(acceptElements, function(elem) { return elem.val(); });
                accepts.push('*/*')
                console.log('accept:', accepts)
            };
        }
    };
}]);

restml.directive('restSelect', ['restSpec', function(restSpec) {
    var template = '';
    template += '<div class="restml service-selection">';
    template += '<input type="text" ng-model="textInput">';
    template += '<button type="button" ng-click="setSrc(textInput)">select</button>';
    template += '</div>';

    return {
        template: template,
        restrict: "E",
        replace: true,
        scope: {
            src: '=',
            onSelect: '&',
        },
        link: function($scope, element) {
            $scope.setSrc = function(src) {
                if (typeof $scope.onSelect !== 'undefined') {
                    $scope.onSelect({
                        serviceUrl: src
                    })
                }
            }

            $scope.$watch('src', function() {
                if ($scope.src !== $scope.textInput) {
                    $scope.textInput = $scope.src;
                    $scope.setSrc($scope.src);
                }
            })
        }
    };
}]);

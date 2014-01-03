/*
rest.js

(C) Bryan Matsuo 2014

This is __free__ software y'all.
*/

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

    var _buildParam = function(node) {
        var param = {};
        param.name = node.getAttribute('name').toString();
        param.type = node.getAttribute('type').toString();
        param.required = Boolean(node.getAttribute('required').toString()); // defaults false
        param.description = "??? description ???";

        param.model = {};

        var constraints = node.getChildNodes();
        constraints = _filterNode(constraints, function(child) {
            return child.getNamespaceURI().toString() === NS_MODEL
        });
        constraints = _mapNode(constraints, function(child) {
            return {
                type: child.localName,
                value: child.getAttribute('value').toString()
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
        } else { // TODO derived models
            throw 'unrecognized primitive type: ' + base.value;
        }

        param.model.type = base.value;
        param.model.constraints = constraints; // TODO constraint chains from derived models

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

        response.statusCode = node.getAttribute('status').toString();
        response.status = _statuses[response.statusCode];
        response.models = _mapNode(_getChildrenByTagNameNS(node, NS_REST, 'model'), _buildModelRef);

        return response;
    };

    var _buildAction = function(node) {
        var action = {};
        action.method = node.getAttribute('method').toString();

        action.title = _getMeta(node, 'title');
        action.subtitle = _getMeta(node, 'subtitle');
        action.description = _getMeta(node, 'description');

        action.params = _mapNode(_getChildrenByTagNameNS(node, NS_REST, 'param'), _buildParam);
        action.responses = _mapNode(_getChildrenByTagNameNS(node, NS_REST, 'response'), _buildResponse);

        return action;
    };

    var _buildResource = function(node) {
        var resource = {};

        resource.path = node.getAttribute('path').toString();

        resource.actions = _mapNode(_getChildrenByTagNameNS(node, NS_REST, 'action'), _buildAction);

        resource = {
            nickname: "watches",
            path: resource.path,
            actions: resource.actions
        };
        return resource
    };

    var _buildGroup = function(node) {
        var group = {};
        group.title = _getMeta(node, 'title');
        group.subtitle = _getMeta(node, 'subtitle');
        group.description = _getMeta(node, 'description');

        group.resources = _mapNode(_getChildrenByTagNameNS(node, NS_REST, 'resource'), _buildResource);

        return group;
    };

    var _buildModel = function(node) {
        var model = {};
        model.id = node.getAttribute('id').toString();
        model.title = _getMeta(node, 'title');
        model.subtitle = _getMeta(node, 'subtitle');
        model.description = _getMeta(node, 'description');
        return model;
    };

    var _buildApi = function(node) {
        var api = {};
        api.title = _getMeta(node, 'title');
        api.subtitle = _getMeta(node, 'subtitle');
        api.description = _getMeta(node, 'description');

        api.baseUrl = node.getAttribute('baseUrl').toString();
        api.version = node.getAttribute('version').toString();

        api.groups = _mapNode(_getChildrenByTagNameNS(node, NS_REST, 'group'), _buildGroup);
        api.models = _mapNode(_getChildrenByTagNameNS(node, NS_REST, 'model'), _buildModel);

        return api;
    };

    var _buildLicense = function(node) {
        var license = {};
        license.type = node.getAttribute('type').toString();
        license.href = node.getAttribute('href').toString();
        return license;
    };

    var _buildTerms = function(node) {
        var terms = {};
        terms.type = node.getAttribute('type').toString();
        terms.href = node.getAttribute('href').toString();
        return terms;
    };

    var _buildService = function(node) {
        var service = {};

        service.title = _getMeta(node, 'title');
        service.subtitle = _getMeta(node, 'subtitle');
        service.description = _getMeta(node, 'description');

        service.apis = _mapNode(_getChildrenByTagNameNS(node, NS_REST, 'api'), _buildApi);
        service.licenses = _mapNode(_getChildrenByTagNameNS(node, NS_META, 'license'), _buildLicense);
        service.terms = _mapNode(_getChildrenByTagNameNS(node, NS_META, 'terms'), _buildTerms);

        return service;
    };

    var _buildSpec = function(xml) {
        var root = xml.domTree;

        if (root.getNamespaceURI().toString() !== NS_SERVICE) {
            throw 'invalid namespace: ' + ns;
        }

        return {
            xml: xml,
            service: _buildService(xml.domTree)
        };
    };

    var _load = function(src) {
        var q = $q.defer();
        $http.get(src).
            success(function(data, status, header) {
                _loadXML(data).then(
                    function(xml) { q.resolve(_buildSpec(xml)); },
                    function(e) { q.reject(e); });
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

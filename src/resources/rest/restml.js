/*
rest.js

(C) Bryan Matsuo 2014

This is __free__ software y'all.
*/

var restml = angular.module('restml', ['concurrency']);

restml.factory('restSpec', ['$rootScope', '$http', '$p', '$q', function($rootScope, $http, $p, $q) {
    var _dom,  // the specification DOM
        _tree; // the specification DOM tree

    var _loadXML = function(data) {
        return $p.async(function() { return X.load(data); });
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

    // TODO this is NOT done. it probably needs to be reworked
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
        return { ref: node.attr('ref').text() };
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
            id: node.attr("id").text(),
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

    var _toObject = function(arr, sel) {
        if (typeof sel === 'undefined' || sel === '') sel = 'id'
        var o = {};
        _.each(arr, function(v) { o[v[sel]] = v; })
        return o;
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
        api.models = _toObject(_.map(node.children(NS.Rest('model')), _buildModel));

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
                        $p.flatmap(_loadXML(data), function(xml) {
                            return $p.map(_buildApi(xml), function(api) { // FIXME i'm losing information here.
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
            var api = _buildApi_really(node);
            q.resolve(api)
            console.log('API "'+api.id+'"', api.models);
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

    var _buildService = function(node) {
        var service = {};
        service.title = node.child(NS.Meta('title')).child().text();
        service.subtitle = node.child(NS.Meta('subtitle')).child().text();
        service.description = node.child(NS.Meta('description')).child().text();
        service.licenses = _.map(node.children(NS.Meta('license')), _buildLicense);
        service.terms = _.map(node.children(NS.Meta('terms')), _buildTerms);

        var apis = node.children(NS.Rest('api'));
        apis = _.map(apis, _buildApi);
        apis = $q.all(apis)
        return $p.map(apis, function(apis) {
            service.apis = apis;
            return service;
        });
    };

    var _buildSpec = function(xml) {
        var ns = xml.ns().uri();
        if (ns !== NS_SERVICE) {
            throw 'invalid namespace: ' + ns + ' (!= '+ NS_SERVICE +')';
        }

        var service = _buildService(xml);
        return $p.map(service, function(service) {
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
                $p.complete(q, $p.map(_loadXML(data), _buildSpec));
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

restml.directive('restApi', [function() {
    return {
        template: '<div class="rest-api" ng-transclude></div>',
        restrict: "E",
        replace: true,
        transclude: true,
        scope: { },
        link: function($scope, element) { }
    };
}]);

restml.directive('restDocs1', [function() {
    return {
        // TODO templatize this template!
        template: '<div class="rest-docs"><h1>{{title}} <small>{{subtitle}}</small></h1><p>{{description}}</p></div>',
        restrict: "E",
        replace: true,
        transclude: true,
        scope: {
            obj: '=for'
        },
        link: function(scope, element) {
            var _setObj = function(obj) {
                if (obj) {
                    scope.title = obj.title;
                    scope.subtitle = obj.subtitle;
                    scope.description = obj.description;
                }
            };

            scope.$watch('obj', function(value) {
                _setObj(value);
            });
        }
    };
}]);

restml.directive('restDocs2', [function() {
    return {
        // TODO templatize this template!
        template: '<div class="rest-docs"><h2>{{title}} <small>{{subtitle}}</small></h2><p>{{description}}</p></div>',
        restrict: "E",
        replace: true,
        transclude: true,
        scope: {
            obj: '=for'
        },
        link: function(scope, element) {
            var _setObj = function(obj) {
                if (obj) {
                    scope.title = obj.title;
                    scope.subtitle = obj.subtitle;
                    scope.description = obj.description;
                }
            };

            scope.$watch('obj', function(value) {
                _setObj(value);
            });
        }
    };
}]);

restml.directive('restDocs3', [function() {
    return {
        // TODO templatize this template!
        template: '<div class="rest-docs"><h3>{{title}} <small>{{subtitle}}</small></h3><p>{{description}}</p></div>',
        restrict: "E",
        replace: true,
        transclude: true,
        scope: {
            obj: '=for'
        },
        link: function(scope, element) {
            var _setObj = function(obj) {
                if (obj) {
                    scope.title = obj.title;
                    scope.subtitle = obj.subtitle;
                    scope.description = obj.description;
                }
            };

            scope.$watch('obj', function(value) {
                _setObj(value);
            });
        }
    };
}]);

restml.directive('restSubmit', [ function() {
    return {
        template: '<button type="submit" class="rest-submit" ng-transclude></button>',
        restrict: "E",
        replace: true,
        transclude: true,
        scope: { },
        link: function($scope, element) { }
    };
}]);

restml.directive('rest', ['restSpec', function(restSpec) {
    return {
        template: '<div class="rest-service" ng-transclude></div>',
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

restml.directive('restAction', ['$timeout','$http', function($timeout, $http, $httpProvider) {
    var template = '';
    template += '<div class="rest-action">';
    template += '<form ng-submit="submit(config)" ng-transclude></form>';
    template += '</div>';

    var _encode = {
        "application/x-www-form-urlencoded": function(data) {
            return _.map(data, function(val, name) {
                return encodeURIComponent(name) + '=' + encodeURIComponent(val);
            }).join('&');
        },
        "application/json": function(data) {
            return JSON.stringify(data);
        }
    };

    return {
        template: template,
        restrict: "E",
        replace: true,
        transclude: true,
        scope: {
            headerCase: '@',
            api: '=',
            resource: '=',
            action: '='
        },
        controller: function($scope) {
            var _headerLower = function() {
                return $scope.headerCase === 'lower'
            };

            this.configParam = function(name, value) {
                var p = $scope.config.params[name];
                if (p) {
                    p.value = value;
                }
            };
            this.configContentType = function(type) {
                $scope.config.contentType = type;
            };
            this.configAccept = function(type) {
                $scope.config.accept = type;
            };

            this.apiId = function() { return $scope.api.id; };
            this.resourceId = function() { return $scope.resource.id; };
            this.method = function() { return $scope.action.method; };
            this.contentTypes = function() {
                return [
                    "application/json",
                    "application/x-www-form-urlencoded"
                ];
            };
            this.accepts = function() {
                return [
                    "application/json",
                    "application/xml",
                    "text/plain",
                    "*/*"
                ];
            };

            this.onDemo = function(key, callback) {
                $scope.$watch('demo.'+key, callback);
            };

            $scope.config = {
                params: (function() {
                    var ps = $scope.action.params;
                    ps = _.map(ps, function(p) { return Object.create(p); });
                    ps = _.map(ps, function(p) { return [p.name, p] });
                    ps = _.object(ps);
                    return ps;
                })(),
                contentType: null,
                accept: null
            };

            $scope.demo =  {
                hasRun: false,
                inProgress: false,
                method: null,
                url: null,
                header: null,
                body: null,
                response: {
                    status: null,
                    header: null,
                    body: null
                }
            };

            var _demoFinish = function(data, status, headers) {
                $scope.demo.hasRun = true;
                $scope.demo.inProgress = false;

                $scope.demo.response.status = status.toString() + ' ???';
                $scope.demo.response.header = _.map(headers(), function(value, name) {
                    if (!_headerLower()) {
                        name = name.replace(/(\w+)/g, function(s) {
                            return s.charAt(0).toUpperCase() + s.substr(1);
                        });
                    }
                    return {
                        name: name,
                        value: value
                    }
                });
                $scope.demo.response.body = data;
            };

            var _demoStart = function(config) {
                $scope.demo.response = {};
                $scope.demo.inProgress = true;

                $http(config).
                    success(_demoFinish).
                    error(_demoFinish);
            };

            $scope.submit = function(config) {
                if (!config) {
                    console.log('no config');
                    return;
                }
                console.log('config:', config);

                // TODO validate parameters

                var url = $scope.api.baseUrl + $scope.resource.path; // FIXME render path param templates
                $scope.demo.url = url;

                var method = $scope.action.method;
                var hasBody = method == 'POST' || method == 'PUT'
                $scope.demo.method = method;

                var query = $scope.action.params;
                query = _.filter(query, function(param) { return param.type === 'query'; });
                query = _.map(query, function(param) { return [param.name, config.params[param.name].value]; });
                query = _.object(query);

                var _query = _encode['application/x-www-form-urlencoded'](query);
                if (query) $scope.demo.url += '?' + _query;

                var header = [];

                var accepts = []
                if (config.accept) {
                    accepts.push(config.accept);
                }
                accepts.push('*/*')
                header.push({
                    name: 'Accept',
                    value: accepts.join(',')
                });


                var body;
                if (hasBody) {
                    body =  $scope.action.params;
                    body = _.filter(body, function(param) { return param.type === 'form' });
                    body = _.map(body, function(param) { return [param.name, config.params[param.name].value] });
                    body = _.object(body);

                    var _type = config.contentType;
                    if (!_type) {
                        _type = 'application/x-www-form-urlencoded';
                    }
                    header.push({
                        name: 'Content-Type',
                        value: config.contentType + '; charset=utf-8'
                    });
                    $scope.demo.body = _encode[_type](body);
                } else {
                    console.log('no body for request');
                    delete $scope.demo.body;
                }

                if (_headerLower()) {
                    _.each(header, function(h) { h.name = h.name.toLowerCase(); })
                }
                $scope.demo.header = header;
                var headers = _.object(_.map(header, function(h) { return [h.name, h.value]; }))

                console.log('method:', method);
                console.log('url:', url);
                console.log('query:', query);
                console.log('header:', headers);
                console.log('body:', $scope.demo.body);

                _demoStart({
                    method: method,
                    url: url,
                    params: query,
                    headers: headers,
                    body: $scope.demo.body
                });
            };
        }
    };
}]);

restml.directive('restDemoMethod', function() {
    var template = '';
    template += '<span class="rest-demo-method {{class}}" ng-bind="method"></span>';

    return {
        require: '^restAction',
        template: template,
        restrict: 'E',
        scope: {
            class: '@'
        },
        link: function(scope, element, attrs, actionCtrl) {
            element.removeAttr('class');
            actionCtrl.onDemo('method', function(value) {
                scope.method = value;
            });
        }
    };
});

restml.directive('restDemoUrl', function() {
    var template = '';
    template += '<span class="rest-demo-url {{class}}" ng-bind="url"></span>';

    return {
        require: '^restAction',
        template: template,
        restrict: 'E',
        scope: {
            class: '@'
        },
        link: function(scope, element, attrs, actionCtrl) {
            element.removeAttr('class');
            actionCtrl.onDemo('url', function(value) {
                scope.url = value;
            });
        }
    };
});

restml.directive('restDemoHeader', function() {
    var template = '';
    template += '<ul class="rest-demo-header {{class}}">';
    template += '<li';
    template += ' ng-repeat="header in list"';
    template += ' class="{{itemClass}}"';
    template += '>';
    template += '<span class="header-name">{{header.name}}</span>';
    template += ': ';
    template += '<span class="header-value">{{header.value}}</span>';
    template += '</li>';
    template += '</ul>';

    return {
        require: '^restAction',
        template: template,
        restrict: 'E',
        scope: {
            class: '@',
            itemClass: '@'
        },
        link: function(scope, element, attrs, actionCtrl) {
            element.removeAttr('class');
            element.removeAttr('itemClass');
            actionCtrl.onDemo('header', function(value) {
                scope.list = value;
            })
        }
    };
});

restml.directive('restDemoBody', function() {
    var template = '';
    template += '<span class="rest-demo-body {{class}}" ng-bind="body"></span>';

    return {
        require: '^restAction',
        template: template,
        restrict: 'E',
        scope: {
            class: '@'
        },
        link: function(scope, element, attrs, actionCtrl) {
            element.removeAttr('class');
            actionCtrl.onDemo('body', function(value) {
                scope.body = value;
            });
        }
    };
});

restml.directive('restDemoResponseStatus', function() {
    var template = '';
    template += '<div class="rest-demo-body {{class}}" ng-bind="status"></div>';

    return {
        require: '^restAction',
        template: template,
        restrict: 'E',
        scope: {
            class: '@'
        },
        link: function(scope, element, attrs, actionCtrl) {
            element.removeAttr('class');
            actionCtrl.onDemo('response.status', function(value) {
                scope.status = value;
            });
        }
    };
});

restml.directive('restDemoResponseHeader', function() {
    var template = '';
    template += '<ul class="rest-demo-header {{class}}">';
    template += '<li';
    template += ' ng-repeat="header in list"';
    template += ' class="{{itemClass}}"';
    template += '>';
    template += '<span class="header-name">{{header.name}}</span>';
    template += ': ';
    template += '<span class="header-value">{{header.value}}</span>';
    template += '</li>';
    template += '</ul>';

    return {
        require: '^restAction',
        template: template,
        restrict: 'E',
        scope: {
            class: '@',
            itemClass: '@'
        },
        link: function(scope, element, attrs, actionCtrl) {
            element.removeAttr('class');
            element.removeAttr('itemClass');
            actionCtrl.onDemo('response.header', function(value) {
                scope.list = value;
            })
        }
    };
});

restml.directive('restDemoResponseBody', function() {
    var template = '';
    template += '<div class="rest-demo-body {{class}}" ng-bind="body"></div>';

    return {
        require: '^restAction',
        template: template,
        restrict: 'E',
        scope: {
            class: '@'
        },
        link: function(scope, element, attrs, actionCtrl) {
            element.removeAttr('class');
            actionCtrl.onDemo('response.body', function(value) {
                scope.body = value;
            });
        }
    };
});

restml.directive('restParamInput', [function() {
    var template = '';
    template += '<div class="rest-param">';
    template += '<input';
    template += ' id="rest-param-{{api}}-{{method}}-{{resource}}-{{name}}"';
    template += ' class="rest-param"'
    template += ' type="text"';
    template += ' name="{{name}}"';
    template += ' ng-model="value"';
    template += ' ng-change="update()"';
    template += '>';
    template += '</div>';

    return {
        require: '^restAction',
        template: template,
        restrict: "E",
        scope: {
            name: '='
        },
        link: function(scope, element, attrs, actionCtrl) {
            element.addClass('rest-param')
            scope.api = actionCtrl.apiId();
            scope.resource = actionCtrl.resourceId();
            scope.method = actionCtrl.method();
            scope.update = function() {
                actionCtrl.configParam(scope.name, scope.value);
            };
        }
    }
}])

restml.directive('restParamLabel', [function() {
    var template = '';
    template += '<label';
    template += ' for="rest-param-{{api}}-{{method}}-{{resource}}-{{name}}"';
    template += '>{{name}}</label>';

    return {
        require: '^restAction',
        template: template,
        restrict: "E",
        scope: {
            name: '=for'
        },
        link: function(scope, element, attrs, actionCtrl) {
            scope.api = actionCtrl.apiId();
            scope.resource = actionCtrl.resourceId();
            scope.method = actionCtrl.method();
        }
    }
}])

// idk wtf is going on here.
restml.directive('restParamName', [function() {
    var template = 'param.name';

    return {
        require: '^restAction',
        template: template,
        restrict: "E",
        scope: { name: '=' },
        link: function(scope, element, attrs, actionCtrl) { }
    }
}])

restml.directive('restContentTypeSelect', [function() {
    var template = '';
    template += '<select';
    template += ' id="rest-content-type-{{api}}-{{method}}-{{resource}}"';
    template += ' class="rest-content-type {{class}}"';
    template += ' name="rest-content-type"';
    template += ' ng-model="input"';
    template += ' ng-change="update()"';
    template += '>';
    template += '<option ng-repeat="type in contentTypes" value="{{type}}">{{type}}</option>';
    template += '</select>';

    return {
        require: '^restAction',
        template: template,
        restrict: "E",
        scope: {
            name: '=',
            class: '@'
        },
        link: function(scope, element, attrs, actionCtrl) {
            element.removeAttr('class');
            scope.api = actionCtrl.apiId();
            scope.resource = actionCtrl.resourceId();
            scope.method = actionCtrl.method();
            scope.contentTypes = actionCtrl.contentTypes();
            scope.input = _.first(scope.contentTypes);
            scope.update = function() { actionCtrl.configContentType(scope.input); }
            if (scope.input) scope.update();
        }
    }
}]);

restml.directive('restContentTypeLabel', [function() {
    var template = '';
    template += '<label';
    template += ' for="rest-content-type-{{api}}-{{method}}-{{resource}}"';
    template += ' ng-transclude';
    template += '></label>';

    return {
        require: '^restAction',
        template: template,
        transclude: true,
        restrict: "E",
        scope: { },
        link: function(scope, element, attrs, actionCtrl) {
            scope.api = actionCtrl.apiId();
            scope.resource = actionCtrl.resourceId();
            scope.method = actionCtrl.method();
        }
    }
}])

restml.directive('restAcceptSelect', [function() {
    var template = '';
    template += '<select';
    template += ' id="rest-accept-{{api}}-{{method}}-{{resource}}"';
    template += ' class="rest-accept {{class}}"';
    template += ' name="rest-accept"';
    template += ' ng-class="classes"'
    template += ' ng-model="input"';
    template += ' ng-change="update()"';
    template += '>';
    template += '<option ng-repeat="type in accepts" value="{{type}}">{{type}}</option>';
    template += '</select>';

    return {
        require: '^restAction',
        template: template,
        restrict: "E",
        scope: {
            name: '=',
            class: '@'
        },
        link: function(scope, element, attrs, actionCtrl) {
            element.removeAttr('class');
            scope.api = actionCtrl.apiId();
            scope.resource = actionCtrl.resourceId();
            scope.method = actionCtrl.method();
            scope.accepts = actionCtrl.accepts();
            scope.input = _.first(scope.accepts);
            scope.update = function() { actionCtrl.configAccept(scope.input); }
            if (scope.input) scope.update();
        }
    }
}]);

restml.directive('restAcceptLabel', [function() {
    var template = '';
    template += '<label';
    template += ' for="rest-accept-{{api}}-{{method}}-{{resource}}"';
    template += ' ng-transclude';
    template += '></label>';

    return {
        require: '^restAction',
        template: template,
        transclude: true,
        restrict: "E",
        scope: {},
        link: function(scope, element, attrs, actionCtrl) {
            scope.api = actionCtrl.apiId();
            scope.resource = actionCtrl.resourceId();
            scope.method = actionCtrl.method();
        }
    }
}])

restml.directive('restSelect', [function() {
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

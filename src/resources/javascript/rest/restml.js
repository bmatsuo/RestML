/*
rest.js

(C) Bryan Matsuo 2014

This is __free__ software y'all.
*/

var restml = angular.module('restml', []);

restml.service('restSpec', ['$rootScope', '$http', '$q', function($rootScope, $http, $q) {
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

    var _load = function(src) {
        var q = $q.defer();
        $http.get(src).
            success(function(data, status, header) {
                _loadXML(data).then(
                    function(xml) {
                        q.resolve({
                            service: {
                                title: 'REST documentation',
                                subtitle: 'ARS',
                                description: 'Another REST service.',
                                apis: [
                                    {
                                        title: "Notification",
                                        description: "Notification management and triggering",
                                        groups: [
                                            {
                                                title: "Watch",
                                                subtitle: "Receive notifications",
                                                description: "A system to declare interest in notifications channels.",
                                                resources: [
                                                    {
                                                        nickname: "watches",
                                                        path: "/watch",
                                                        actions: [
                                                            {
                                                                method: "GET",
                                                                title: "Search for watches",
                                                                params: [
                                                                    {
                                                                        name: "channel",
                                                                        type: "query",
                                                                        required: true,
                                                                        description: "the channel being watched"
                                                                    },
                                                                    {
                                                                        name: "creator",
                                                                        type: "query",
                                                                        required: false,
                                                                        description: "the creator of the watch"
                                                                    }
                                                                ],
                                                                responses: [
                                                                    {
                                                                        status: "Success",
                                                                        statusCode: "2XX",
                                                                        models: [
                                                                            {
                                                                                title: "OK",
                                                                                description: "A generic success message"
                                                                            }
                                                                        ]
                                                                    }
                                                                ]
                                                            },
                                                            {
                                                                method: "POST",
                                                                title: "Create a watch",
                                                                params: [
                                                                    {
                                                                        name: "channel",
                                                                        type: "form",
                                                                        required: true,
                                                                        description: "the channel being watched"
                                                                    }
                                                                ],
                                                                responses: [
                                                                    {
                                                                        status: "Success",
                                                                        statusCode: "2XX",
                                                                        models: [
                                                                            {
                                                                                title: "OK",
                                                                                description: "A generic success message"
                                                                            }
                                                                        ]
                                                                    }
                                                                ]
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        nickname: "watch",
                                                        path: "/watch/{id}"
                                                    }
                                                ]
                                            },
                                            {
                                                title: "Notify",
                                                subtitle: "Send notifications",
                                                description: "Deliver information to interested parties.",
                                                resources: [
                                                    {
                                                        nickname: "notify",
                                                        path: "/notification",
                                                        actions: [
                                                            {
                                                                method: "POST",
                                                                title: "Issue a notificiation over a channel",
                                                                params: [
                                                                    {
                                                                        name: "channel",
                                                                        type: "form",
                                                                        required: true,
                                                                        description: "the channel being watched"
                                                                    },
                                                                    {
                                                                        name: "contentType",
                                                                        type: "form",
                                                                        required: false,
                                                                        description: "format of the payload"
                                                                    },
                                                                    {
                                                                        name: "payload",
                                                                        type: "form",
                                                                        required: false,
                                                                        description: "the notification message payload"
                                                                    }
                                                                ],
                                                                responses: [
                                                                    {
                                                                        status: "Success",
                                                                        statusCode: "2XX",
                                                                        models: [
                                                                            {
                                                                                title: "OK",
                                                                                description: "A generic success message"
                                                                            }
                                                                        ]
                                                                    }
                                                                ]
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ],
                                licenses: [
                                    {
                                        type: 'GPL v3',
                                        href: 'http://example.com/GPLv3'
                                    }
                                ],
                                terms: [
                                    {
                                        name: 'Terms of Service',
                                        href: 'http://example.com/terms'
                                    }
                                ],
                                xml: data
                            }
                        });
                    },
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

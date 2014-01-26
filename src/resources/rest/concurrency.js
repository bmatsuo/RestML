/*
concurrency.js

(C) Bryan Matsuo 2014

This is __free__ software y'all.
*/

angular.
    module('concurrency', []).
    service('$p', ['$q', '$timeout', function($q, $timeout) {
        var _q = function(fn) {
            var q = $q.defer();
            fn(q);
            return q.promise;
        };

        var _unit = function(v) {
            return _q(function(q) {
                q.resolve(v);
            });
        };

        var _async = function(fn) {
            return _q(function(q) {
                q.resolve(fn());
            });
        };

        var _map = function(p, fn) {
            return _q(function(q) {
                p.then(function(x) { q.resolve(fn(x)) }, q.reject);
            });
        };

        var _flatmap = function(p, fn) {
            return _q(function(q) {
                p.then(function(x) { fn(x).then(q.resolve, q.reject) }, q.reject);
            });
        };

        var _map2 = function(p1, p2, fn) {
            return _q(function(q) {
                _flatmap(p1, function(x1) {
                    _map(p2, function(x2) {
                        return fn(x1, x2);
                    });
                });
            });
        };

        var _complete = function(q, p) {
            p.then(q.resolve, q.reject);
        };

        return {
            unit: _unit,
            async: _async,
            map: _map,
            flatmap: _flatmap,
            map2: _flatmap,
            complete: _complete
        };
    }]);

var restApp = angular.module('restApp', ['ui.bootstrap', 'restml']);

restApp.controller('restController', ['$scope', 'restSpec', function($scope, restSpec) {
    $scope.selected = function(url) {
        $scope.src = url;
    };

    $scope.serviceLoaded = function(service) {
        console.log('service loaded:', service);
        $scope.service = service;
    };
}]);

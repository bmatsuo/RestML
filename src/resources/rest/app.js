var restApp = angular.module('restApp', ['restml']);

restApp.controller('restController', ['$scope', 'restSpec', function($scope, restSpec) {
    $scope.selected = function(url) {
        $scope.src = url;
    };

    $scope.serviceLoaded = function(service) {
        console.log('service loaded:', service);
        $scope.title = service.title;
        $scope.subtitle = service.subtitle;
        $scope.description = service.description;
        $scope.licenses = service.licenses;
        $scope.terms = service.terms;
        $scope.apis = service.apis;
    };
}]);

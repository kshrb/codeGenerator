var app = angular.module('codeGeneratorApp', ['ngRoute','renderEngin','ctrl.home']);

app.config(['$routeProvider', '$locationProvider', '$httpProvider', function($routeProvider, $locationProvider, $httpProvider) {

    $locationProvider.html5Mode(true);
    delete $httpProvider.defaults.headers.common['X-Requested-With'];

    $routeProvider
    .when("/", {
        templateUrl : 'views/home.html',
        controller  : 'homeController'
    })
    .when("/home", {
        templateUrl : 'pages/home.html',
        controller  : 'homeController'
    });

}]).run([function() {}]);
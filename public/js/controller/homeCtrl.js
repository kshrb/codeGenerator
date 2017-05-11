var home = angular.module('ctrl.home', []);
home.controller('homeController', ["$scope", "JSchemaPareser", function ($scope, JSchemaPareser) {
    
    $scope.processLog = function(){

    };

    $scope.processSchema = function () {
        $scope.status = "Schema processing started";
        try {
            $scope.schema = JSON.parse($scope.JSchema);
            $scope.status = "Valid schema";
            $("#messageLabel").css("color", "green");
            $scope.status = "Dereferencing schema";
        } catch (err) {
            $scope.status = "Invalid JSON Schems : " + err.message;
            $("#messageLabel").css("color", "red");
        }
    };
}]);
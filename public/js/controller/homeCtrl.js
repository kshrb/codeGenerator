var home = angular.module('ctrl.home', []);
home.controller('homeController', ["$scope", "JSchemaPareser","UIBuilder", function ($scope, JSchemaPareser,UIBuilder) {

    var loggger = function (msg) {
        $(".panel-body").append(msg + "<br/>");
    };

    var buildTemplate = function (dereferencedJSONSchema) {
        loggger("Started building template..");
        $scope.parsedJSONS = JSON.stringify(dereferencedJSONSchema);
        var promise = UIBuilder.getHTML(dereferencedJSONSchema);
        promise.then(function (htmlStr) {
            loggger("Template generated.. :) ");
            $scope.htmlStr = htmlStr;
        }, function (err) {
             loggger("Error in generating template : " + err.message);
        });
    }

    var dereferenceJSchema = function (schema) {
        var promise = JSchemaPareser.deReferenceSchema(schema);
        promise.then(function (parsedSchema) {
            loggger("JSON schema definition references merged.");
            buildTemplate(parsedSchema);
        }, function (err) {
             loggger("Invalid JSON Schems : " + err.message);
        });
    };

    $scope.processSchema = function () {
        loggger("Schema processing started..");
        try {
            loggger("Validating JSON scahema..");
            var schema = $.parseJSON($scope.JSchema)
            loggger("JSON schema is valid.");
            loggger("Dereferencing JSON schema.");
            dereferenceJSchema(schema);
        } catch (err) {
            loggger("Invalid JSON Schemas : " + err.message);
        }
    };
}]);
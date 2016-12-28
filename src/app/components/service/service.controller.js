(function () {
  'use strict';

  angular
    .module('app.service')
    .controller('ServiceCtrl', ServiceCtrl);

  ServiceCtrl.$inject = ['$scope', '$routeParams', '$http', '$window', 'gettextCatalog', 'alertService', 'Service'];

  function ServiceCtrl ($scope, $routeParams, $http, $window, gettextCatalog, alertService, Service) {
    $scope.serviceTypes = [
      {
        value: 'mailchimp',
        label: 'Mailchimp'
      },
      {
        value: 'googlegroup',
        label: 'Google Group'
      }
    ];
    $scope.mailchimpLists = [];

    if ($routeParams.serviceId) {
      $scope.service = Service.get({'serviceId': $routeParams.serviceId});
    }
    else {
      $scope.service = new Service();
    }

    $scope.saveService = function() {
      var success = function (resp, headers) {
        alertService.add('success', gettextCatalog.getString('Service saved successfully'));
      };
      var error = function (err) {
        alertService.add('danger', gettextCatalog.getString('There was an error saving this service'));
      };
      if ($scope.service._id) {
        $scope.service.$update(success, error);
      }
      else {
        $scope.service.$save(success, error);
      }
    };

    $scope.deleteService = function () {
      $scope.service.$delete(function (resp, headers) {
        alertService.add('success', gettextCatalog.getString('Service deleted successfully'));
      });
    };

    $scope.getMailchimpLists = function () {
      Service
        .getMailchimpLists($scope.service.mailchimp.apiKey)
        .then(function (result) {
          $scope.mailchimpLists = result.data.lists;
        });
    };
  }
})();

(function () {
  'use strict';

  angular
    .module('app.user')
    .controller('UserNewCtrl', UserNewCtrl);

  UserNewCtrl.$inject = ['$scope', '$location', 'alertService', 'User', 'gettextCatalog'];

  function UserNewCtrl($scope, $location, alertService, User, gettextCatalog) {
    $scope.user = new User();
    $scope.user.setAppMetaData({login: false});
    $scope.user.locale = gettextCatalog.getCurrentLanguage();
    $scope.user.app_verify_url = $location.protocol() + '://' + $location.host() + '/reset_password?orphan=true';
    $scope.currentPath = $location.path();
    $scope.saving = false;
    
    var successMessage = gettextCatalog.getString('The user was successfully created. If you inserted an email address, they will receive an email to claim their account. You can now edit the user profile to add more information.');
    var errorMessage = gettextCatalog.getString('There was an error processing your registration.');

    $scope.userCreate = function(registerForm) {
      $scope.saving = true;
      $scope.user.$save(function(user) {
        alertService.add('success', successMessage, false, false, 6000);
        registerForm.$setPristine();
        registerForm.$setUntouched();
        $scope.user = new User();
        $location.path('/users/' + user._id);
        $scope.saving = false;
      }, function (resp) {
        alertService.add('danger', errorMessage);
        registerForm.$setPristine();
        $scope.saving = false;
      });
    };
  }

})();

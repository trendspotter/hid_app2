(function () {
  'use strict';

  angular
    .module('app.common')
    .controller('AppCtrl', AppCtrl);

  AppCtrl.$inject = ['$rootScope', '$scope', '$location', '$window', 'gettextCatalog', 'User'];

  function AppCtrl($rootScope, $scope, $location, $window, gettextCatalog, User) {
    $rootScope.canCache = true;
    $scope.currentUser = null;
    $scope.currentUserResource = null;
    $scope.filters = {};
    $scope.language = gettextCatalog.getCurrentLanguage();

    $scope.sidebar = {
      open: false,
      sidebars: {
        admin: false,
        listsFilters: false,
        userFilters: false
      }
    };
    $scope.keyupEvent = function (event) {
      if (!$scope.sidebar) {
        return;
      }
      if ($scope.sidebar.open && (event.key === 'Escape' || event.code === 'Escape' || event.keyCode === 27)) {
        $scope.sidebar.open = false;
      }
    }

    $scope.closeSidebar = function () {
      $scope.sidebar.open = false;
      $rootScope.$emit('sidebar-closed');
    };

    $scope.toggleSidebar = function (name) {
      if ($scope.sidebar.sidebars[name] && $scope.sidebar.open) {
        $scope.sidebar.open = false;
        $rootScope.$emit('sidebar-closed');
        return;
      }
      $scope.sidebar.open = true;
      angular.forEach($scope.sidebar.sidebars, function(value, key) {
        $scope.sidebar.sidebars[key] = name === key ? true : false;
      });
    };

    $scope.removeCurrentUser = function() {
      $scope.currentUser = null;
    };

    $scope.setCurrentUser = function (user) {
      $scope.currentUser = new User(user);
      $window.localStorage.setItem('currentUser', JSON.stringify(user));
    };

    $scope.saveCurrentUser = function() {
      var prom = $scope.getCurrentUserResource().$promise;
      prom.then(function () {
        angular.copy($scope.currentUser, $scope.currentUserResource);
        $scope.currentUserResource.$save();
      });
      return prom;
    };

    $scope.getCurrentUserResource = function () {
      if (!$scope.currentUserResource) {
        $scope.currentUserResource = User.get({userId: $scope.currentUser.id});
      }
      return $scope.currentUserResource;
    };

    $scope.initCurrentUser = function () {
      if ($window.localStorage.getItem('currentUser')) {
        $scope.setCurrentUser(JSON.parse($window.localStorage.getItem('currentUser')));
      }
      $scope.initLanguage();
    };

    $rootScope.$on('updateCurrentUser', function () {
      User.get({userId: $scope.currentUser.id}, function (user) {
        $scope.setCurrentUser(user);
      })
    })

    $scope.activeNav = function (path) {
      return $location.path() === path;
    };

    function hideHeaderFooter () {
      return ($location.path() === '/start' || $location.path() === '/tutorial') ? true : false;
    }

    $scope.hideHeaderFooter = hideHeaderFooter();

    $scope.initLanguage = function () {
      if (!$scope.currentUser) {
        return;
      }

      var locale = $scope.currentUser.locale ? $scope.currentUser.locale : 'en';
      var lang = gettextCatalog.getCurrentLanguage();

      if (lang !== locale) {
        gettextCatalog.setCurrentLanguage(locale);
        $scope.language = locale;
      }
    }

    $scope.changeLanguage = function (lang) {
      gettextCatalog.setCurrentLanguage(lang);
      $scope.currentUser.locale = lang;
      $scope.language = lang;
      User.update($scope.currentUser, function (user) {
        $scope.setCurrentUser(user);
      });
    }

    $scope.getCurrentLanguage = function () {
      var lang = gettextCatalog.getCurrentLanguage();
      return lang.toUpperCase();
    }

    var initView = function () {
      $scope.closeSidebar();
      $scope.hideHeaderFooter = hideHeaderFooter();
    };

    $scope.initCurrentUser();

    $scope.$on('$routeChangeSuccess', initView);

  }

})();

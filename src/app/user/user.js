var userDirectives = angular.module('userDirectives', []);

userDirectives.directive('hidUsers', ['$http', '$location', 'config', 'gettextCatalog', 'alertService', 'User', 'ListUser', function($http, $location, config, gettextCatalog, alertService, User, ListUser) {
  return {
    restrict: 'E',
    templateUrl: 'app/user/users.html',
    scope: {
      users: '=',
      list: '=',
      currentUser: '='
    },
    link: function (scope, elem, attrs) {
      scope.isManager = false;
      if (scope.list) {
        scope.$watch('users', function (newVal) {
          if (newVal) {
            for (var i = 0, len = newVal.length; i < len; i++) {
              if (newVal[i].user.id == scope.currentUser.id && newVal[i].role == 'manager') {
                scope.isManager = true;
              }
            }
          }
        }, true);
      }
      scope.filters = $location.search();
      scope.filter = function() {
        if (scope.filters.verified === false) {
          delete scope.filters.verified;
        }
        //scope.users = User.query(scope.filters);
        $location.search(scope.filters);
      };

      scope.roles = [];
      scope.getRoles = function () {
        return $http.get(config.hrinfoUrl + '/functional_roles')
          .success(function (resp) {
            scope.roles = resp.data;
          });
      };

      scope.removeFromList = function (lu) {
        var alert = alertService.add('warning', gettextCatalog.getString('Are you sure ?'), true, function() {
          ListUser.delete({listUserId: lu.id }, function(out) {
            // Close existing alert
            alert.closeConfirm();
            alertService.add('success', gettextCatalog.getString('The user was successfully removed.'));
            scope.users = ListUser.query({'list': scope.list.id});
          });
        });
      };

      scope.approveUser = function (lu) {
        var alert = alertService.add('warning', gettextCatalog.getString('Are you sure ?'), true, function() {
          lu.pending = false;
          lu.$save(function (listuser, response) {
            alert.closeConfirm();
            alertService.add('success', gettextCatalog.getString('The user was successfully approved.'));
          });
        });
      };

      scope.promoteManager = function (lu) {
        var alert = alertService.add('warning', gettextCatalog.getString('Are you sure ?'), true, function() {
          lu.role = 'manager';
          lu.$save(function (listuser, response) {
            alert.closeConfirm();
            alertService.add('success', gettextCatalog.getString('The user was successfully promoted to manager.'));
          });
        });
      };

      scope.demoteManager = function (lu) {
        var alert = alertService.add('warning', gettextCatalog.getString('Are you sure ?'), true, function() {
          lu.role = 'member';
          lu.$save(function (listuser, response) {
            alert.closeConfirm();
            alertService.add('success', gettextCatalog.getString('The user is not a manager anymore.'));
          });
        });
      };
    }
  };
}]);


var userServices = angular.module('userServices', ['ngResource']);

userServices.factory('User', ['$resource', 'config',
  function($resource, config){
    return $resource(config.apiUrl + 'users/:userId', {userId: '@id'},
    {
      'save': {
        method: 'PUT',
        transformRequest: function (data, headersGetter) {
          delete data.checkins;
          delete data.lists;
          delete data.favoriteLists;
          return angular.toJson(data);
        }
      }
    });
  }
]);

var userControllers = angular.module('userControllers', []);

userControllers.controller('UserCtrl', ['$scope', '$routeParams', '$http', '$window', 'alertService', 'md5', 'config', 'User', 'List', function($scope, $routeParams, $http, $window, alertService, md5, config, User, List) {
  $scope.setAdminAvailable(true);
  $scope.newEmail = {
    type: '',
    email: ''
  };
  $scope.newPhoneNumber = {
    type: '',
    number: ''
  };
  $scope.newLocation = {
    location: {
      id: '',
      name: ''
    }
  };

  $scope.gravatarUrl = '';

  $scope.canEditUser = ($routeParams.userId == $scope.currentUser.id || $scope.currentUser.is_admin);

  $scope.user = User.get({userId: $routeParams.userId}, function(user) {
    var userEmail = md5.createHash(user.email.trim().toLowerCase());
    $scope.gravatarUrl = 'https://secure.gravatar.com/avatar/' + userEmail + '?s=200';
  });

  $scope.countries = [];
  $http.get('https://www.humanitarianresponse.info/hid/locations/countries').then(
    function (response) {
      for (var key in response.data) {
        $scope.countries.push({
          'id': key,
          'name': response.data[key]
        });
      }
    }
  );

  $scope.regions = [];
  $scope.setRegions = function ($item, $model) {
    $scope.regions = [];
    $http.get('https://www.humanitarianresponse.info/hid/locations/' + $item.id).then(
      function (response) {
        for (var key in response.data.regions) {
          $scope.regions.push({
            'id': key,
            'name': response.data.regions[key].name
          });
        }
      }
    );
  };

  $scope.addItem = function (key) {
    if (!$scope.user[key]) {
      $scope.user[key] = [];
    }
    switch (key) {
      case 'websites':
        $scope.user[key].unshift({url: ''});
        break;
      case 'voips':
        $scope.user[key].unshift({ type: 'Skype', username: '' });
        break;
      case 'phone_numbers':
        $scope.user[key].unshift($scope.newPhoneNumber);
        break;
      case 'emails':
        $scope.user[key].unshift($scope.newEmail);
        break;
      case 'locations':
        $scope.user[key].unshift({country: '', region: ''});
        break;
      case 'job_titles':
        $scope.user[key].unshift('');
        break;
      case 'organizations':
        $scope.user[key].unshift({id: '', name: ''});
        break;
    }
  };

  $scope.dropItem = function (key, index ){
    $scope.user[key].splice(index, 1);
  };

  var hrinfoResponse = function (response) {
    var out = [];
    angular.forEach(response.data.data, function (value, key) {
      this.push({
        id: key,
        name: value
      });
    }, out);
    return out;
  };

  $scope.getOrganization = function(val) {
    return $http.get(config.hrinfoUrl + '/organizations?autocomplete[string]=' + val + '&autocomplete[operator]=STARTS_WITH')
      .then(hrinfoResponse);
  };

  $scope.getDisasters = function(val) {
    return $http.get(config.hrinfoUrl + '/disasters?autocomplete[string]=' + val + '&autocomplete[operator]=STARTS_WITH')
      .then(hrinfoResponse);
  };

  $scope.getLists = function (val) {
    return $http.get(config.apiUrl + 'lists', { params: { where: { name: { contains: val } } } })
      .then(function (response) {
        return response.data;
      });
  };

  $scope.getLocations = function (val) {
    return $http.get(config.hrinfoUrl + '/locations?autocomplete[string]=' + val + '&autocomplete[operator]=STARTS_WITH')
      .then(hrinfoResponse);
  };

  $scope.roles = [];
  $scope.getRoles = function () {
    return $http.get(config.hrinfoUrl + '/functional_roles')
      .success(function (resp) {
        $scope.roles = resp.data;
      });
  };

  $scope.getCountries = function () {
    return $http.get('https://www.humanitarianresponse.info/hid/locations/countries')
      .then(hrinfoResponse);
  };

  $scope.phoneNumberTypes = [
    {value: 'Landline', name: 'Landline'},
    {value: 'Mobile', name: 'Mobile'}
  ];

  $scope.emailTypes = [
    {value: 'Work', name: 'Work'},
    {value: 'Personal', name: 'Personal'}
  ];

  $scope.voipTypes = [
    {value: 'Skype', name: 'Skype'},
    {value: 'Google', name: 'Google'}
  ];

  $scope.saveUser = function() {
    $scope.user.$save(function (user, response) {
      //  Update the currentUser item in localStorage if the current user is the one being saved
      if (user.id == $scope.currentUser.id) {
        $scope.setCurrentUser(user);
      }
    });
  };

  $scope.setOrganization = function (data, index) {
    $scope.user.organizations[index] = data;
  };

  // Export user details to vcard
  $scope.exportVcard = function () {
    var vcard = "BEGIN:VCARD\n" +
      "VERSION:3.0\n" +
      "N:" + $scope.user.family_name + ";" + $scope.user.given_name + ";;;\n" +
      "FN:" + $scope.user.name + "\n";
    if ($scope.user.organization && $scope.user.organization.name) {
      vcard += "ORG:" + $scope.user.organization.name + "\n";
    }
    if ($scope.user.job_title) {
      vcard += "TITLE:" + $scope.user.job_title + "\n";
    }
    if ($scope.user.phone_number) {
      vcard += "TEL;";
      if ($scope.user.phone_number_type) {
        vcard += "TYPE=" + $scope.user.phone_number_type+",";
      }
      vcard += "VOICE:" + $scope.user.phone_number + "\n";
    }
    angular.forEach($scope.user.phone_numbers, function (item) {
      if (item.type && item.number) {
        vcard += "TEL;TYPE=" + item.type + ",VOICE:" + item.number + "\n";
      }
    });
    if ($scope.user.email) {
      vcard += "EMAIL:" + $scope.user.email + "\n";
    }
    angular.forEach($scope.user.emails, function (item) {
      if (item.email) {
        vcard += "EMAIL:" + item.email + "\n";
      }
    });
    vcard += "REV:" + new Date().toISOString() + "\n" +
      "END:VCARD\n";
    window.location.href = 'data:text/vcard;charset=UTF-8,' + encodeURIComponent(vcard);
  }

}]);

userControllers.controller('UserPrefsCtrl', ['$scope', 'alertService', 'User', function ($scope, alertService, User) {

  $scope.password = {
    old: '',
    new: ''
  };


  $scope.user = User.get({userId: $scope.currentUser.id}, function(user) {
  });

  $scope.savePassword = function() {
    $scope.user.old_password = $scope.password.old;
    $scope.user.new_password = $scope.password.new;
    $scope.user.$save(function (user) {
     alertService.add('success', 'Your password was successfully changed.');
    }, function (resp) {
      alertService.add('danger', 'There was an error saving your password.');
    });
  };
}]);

userControllers.controller('UserNewCtrl', ['$scope', '$location', 'alertService', 'User', function ($scope, $location, alertService, User) {
  $scope.user = new User();
  $scope.currentPath = $location.path();

  $scope.userCreate = function() {
    $scope.user.$save(function(user) {
      alertService.add('success', 'Thank you, your registration is now complete. You will soon receive a confirmation email.');
      //$location.path('/settings' + $scope.user.id);
    }, function (resp) {
      alertService.add('danger', 'There was an error processing your registration.');
    });
  };
}]);


userControllers.controller('UsersCtrl', ['$scope', '$routeParams', 'User', function($scope, $routeParams, User) {
  $scope.request = $routeParams;
  $scope.listusers = [];
  $scope.users = User.query($routeParams, function () {
    angular.forEach($scope.users, function (val, key) {
      this.push({user: val});
    }, $scope.listusers);
    $scope.users = $scope.listusers;
  });
  $scope.filters = {};

  $scope.filter = function() {
    $scope.users = User.query($scope.filters);
  };
}]);

userControllers.controller('CheckInCtrl', ['$scope', 'User', function ($scope, User) {
  $scope.status = 'responding';
}]);

/* jshint module: true */
var ProfilePage = function() {
  this.userName = element(by.css('.page-header__heading'));
  this.userStatus = element(by.css('.profile-header__status'));
  this.editButton = element(by.css('.t-user-edit-btn'));
  this.closeEditButton = element(by.css('.t-close-edit-btn'));
  this.newEmailInput = element(by.id('new_email'));
  this.statusInput = element(by.id('user_status'));
  this.profileAlert = element(by.css('.profile-alert'));
  this.connectButton = element(by.css('.t-connect-btn'));
  this.connectMessage = element(by.css('.alert__inner'));
  this.modalOverlay = element(by.css('.modal'));
  this.connectModalText = element(by.cssContainingText('div .modal-body', 'Connection request sent'));
  this.phonePermissionButton = element(by.css('.t-request-phone'));
  this.phonePermissionMessage = element(by.css('.t-phone-permission-message'));
  this.phoneNumbers = element(by.repeater('phone in user.phone_numbers'));
};

module.exports = ProfilePage;

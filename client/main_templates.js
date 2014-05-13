Template.mainLobby.show = function() {
  return Session.equals('page', 'mainLobby');
};

Template.mainLobby.username = function() {
  var me = Players.findOne(Session.get("player_id"));
  return me && me.username;
};

Template.mainLobby.events({
  "click .button.set-name": function(event) {
    event.preventDefault();
    
    var username = $(event.currentTarget).parent().find("input").val();
    Players.update(Session.get('player_id'), {$set: {username: username}});
  },

  "click .single-player": function(event) {
    event.preventDefault();

    Session.set("page", "singleLobby");
  },

  "click .multiplayer": function(event) {
    event.preventDefault();

    Session.set("page", "multiLobby");
  }
});

Template.gamePlay.show = function() {
  return Session.equals('page', 'gamePlay');
};

Template.gamePlay.events({
  "click .button.lobby": function(event) {
    event.preventDefault();
    
    Meteor.call("end_game", Session.get("player_id"));
    Session.set("page", "mainLobby");
  }
});
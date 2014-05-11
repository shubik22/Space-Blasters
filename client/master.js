var player = function() {
  return Players.findOne(Session.get("player_id"));
};

var game = function() {
  var me = player();
  return me && me.game_id && Games.findOne(me.game_id);
}

Template.lobby.show = function() {
  return Session.equals('page', 'lobby');
};

Template.lobby.events({
  "click .new-game": function(event) {
    event.preventDefault();

    Session.set("page", "gamePlay");
    Meteor.call('start_new_game', Session.get('player_id'));
  },
  
  "click .button.set-name": function(event) {
    event.preventDefault();
    
    var username = $(event.currentTarget).parent().find("input").val();
    Players.update(Session.get('player_id'), {username: username})
  }
});

Template.lobby.username = function() {
  var me = player();
  return me && me.username;
};

Template.gamePlay.show = function() {
  return Session.equals('page', 'gamePlay');
};

Template.gamePlay.clock = function() {
  return game() && game().clock;
};

Template.gamePlay.events({
  "click .button.lobby": function(event) {
    event.preventDefault();
    
    Session.set("page", "lobby");
  }
});

Meteor.startup(function() {
  var player_id = Players.insert({username: ""});
  Session.set('player_id', player_id);
  Session.setDefault('page', 'lobby');
  
  Deps.autorun(function() {
    Meteor.subscribe('players');
    if (Session.get('player_id')) {
      var me = player();
      if (me && me.game_id) {
        Meteor.subscribe('games', me.game_id);
      }
    }
  });
});
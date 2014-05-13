// Utility Functions

var player = function() {
  return Players.findOne(Session.get("player_id"));
};

var game = function() {
  var me = player();
  return me && me.game_id && Games.findOne(me.game_id);
};

Meteor.startup(function() {
  var player_id = Players.insert({username: ""});
  Session.set('player_id', player_id);
  Session.setDefault('page', 'lobby');
  Meteor.subscribe('players');
  Meteor.subscribe('records');
  Meteor.subscribe('games');

  Deps.autorun(function() {
    if (Session.get('player_id')) {
      var me = player();
      if (me && me.game_id) {
        Meteor.subscribe('asteroids', me.game_id);
        Meteor.subscribe('bullets', me.game_id);
        Meteor.subscribe('ships', me.game_id);
        console.log("subscribed with: ", me.game_id)
      }
    }
  });
    
  observeGames(player_id);
});
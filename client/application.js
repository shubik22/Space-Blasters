Meteor.startup(function() {
  var player_id = Players.insert({username: ""});
  Session.set('player_id', player_id);
  Session.setDefault('page', 'mainLobby');
  Meteor.subscribe('players');
  Meteor.subscribe('records');
  Meteor.subscribe('games');

  Deps.autorun(function() {
    if (Session.get('player_id')) {
      var me = Players.findOne(Session.get("player_id"));

      var interval = Meteor.setInterval(function() {
        Players.update(Session.get("player_id"),
          {$set: {last_update: Date.now()}})
      }, 5000);
      
      if (me && me.game_id) {
        Meteor.subscribe('asteroids', me.game_id);
        Meteor.subscribe('bullets', me.game_id);
        Meteor.subscribe('ships', me.game_id);
      }
    }
  });

  observeGames(player_id);
});
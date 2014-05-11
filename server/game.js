Meteor.methods({
  start_new_game: function(player_id) {
    var gameId = Games.insert({
      ship1: null,
      ship2: null,
      asteroids: null,
      bullets: null,
      clock: 0
    });

    Players.update({_id: player_id}, {$set: {game_id: gameId}});

    var clock = 1;
    
    var interval = Meteor.setInterval(function() {
      Games.update(gameId, {$set: {clock: clock}});
      clock += 1;
      
      if (clock === 60) {
        Meteor.clearInterval(interval);
      }
    }, 1000);
    
    return gameId;
  }
});


Meteor.publish('players');
Meteor.publish('games', function(id) {
  return Games.find({_id: id});
})
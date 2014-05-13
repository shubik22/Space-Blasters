var createObjects = function(player_id, game_id) {
  for (var i = 0; i < 10; i++) {
    var asteroid = Asteroid.randomAsteroid(game_id);
    Asteroids.insert(asteroid);
  }
};

// Game play functions

Meteor.methods({
  start_new_game: function(player_id) {
    var game_id = Games.insert({
      clock: 0,
      player_id: player_id
    });
    Players.update(player_id, {$set: {game_id: game_id}});
    createObjects(player_id, game_id);

    var clock = 0;
    
    var interval = Meteor.setInterval(function() {
      Games.update(game_id, {$set: {clock: clock}});
      clock += 0.03;
      if (Asteroids.find({game_id: game_id}).count() === 0) {
        var username = Players.findOne(player_id).username;
        Records.insert({username: username, time: clock});
      
        Meteor.clearInterval(interval);
      }
    }, 30);
    
    return game_id;
  },

  end_game: function(player_id) {
    var player = Players.findOne(player_id);
    var game_id = player.game_id;
    var ship = Ships.findOne({player_id: player_id});
    var asteroids = Asteroids.find({game_id: game_id});
    var bullets = Bullets.find({game_id: game_id});
  
    if (Games.findOne(game_id)) {
      Players.update(player_id, {$set: {game_id: null}});
      Games.remove(game_id);
      Ships.remove(ship._id);
      asteroids.forEach(function(asteriod) {
        Asteroids.remove(asteriod._id);
      });
      bullets.forEach(function(bullet) {
        Bullets.remove(bullet._id);
      });
    }
  }
});
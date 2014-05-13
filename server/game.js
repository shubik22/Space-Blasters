var createAsteroids = function(game_id) {
  for (var i = 0; i < 2; i++) {
    var asteroid = Asteroid.randomAsteroid(game_id);
    Asteroids.insert(asteroid);
  }
};

// Game play functions

Meteor.methods({
  start_new_game: function(player_id, type) {
    if (type === "single") {
      var game_id = Games.insert({
        clock: 0,
        player_id: player_id,
        type: type
      });
    } else if (type === "multi") {
      var game_id = Games.insert({
        clock: 0,
        player1_id: player_id,
        player2_id: "pending",
        type: type
      });
      Players.update(player_id, {$set: {position: "first"}});
    }
    Players.update(player_id, {$set: {
      game_id: game_id,
      game_type: type,
      hits: 0,
      winner: false}});
    createAsteroids(game_id);

    var clock = 0;
    
    if (type === "single") {
      var interval = Meteor.setInterval(function() {
        Games.update(game_id, {$set: {clock: clock}});
        clock += 0.03;
      
        if (Asteroids.find({game_id: game_id}).count() === 0) {
          Meteor.clearInterval(interval);
        
          var player = Players.findOne(player_id);
          if (player.winner) {
            Records.insert({
              type: "single",
              username: player.username,
              time: clock
            });
          }
        }
      }, 30);
    };
  },

  join_game: function(player_id, game_id) {
    var player1 = Players.findOne({game_id: game_id})
    
    Players.update(player_id, {$set: {
      game_id: game_id,
      game_type: "multi",
      position: "second",
      hits: 0,
      winner: false}});
    Games.update(game_id, {$set: {
      player2_id: player_id
    }});
    createAsteroids(game_id);

    var clock = 0;

    var interval = Meteor.setInterval(function() {
      Games.update(game_id, {$set: {clock: clock}});
      clock += 0.03;
  
      if (Asteroids.find({game_id: game_id}).count() === 0) {
        Meteor.clearInterval(interval);

        var player2 = Players.findOne(player_id);
        if (player2.winner) {
          Records.insert({
            type: "multi",
            username: player2.username,
            opponent: player1.username,
            time: clock
          });
        } else if (player1.winner) {
          Records.insert({
            type: "multi",
            username: player1.username,
            opponent: player2.username,
            time: clock
          });
        }
      }
    }, 30);
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
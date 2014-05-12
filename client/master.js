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
  
  Deps.autorun(function() {
    Meteor.subscribe('players');
    Meteor.subscribe('records');
    if (Session.get('player_id')) {
      var me = player();
      if (me && me.game_id) {
        Meteor.subscribe('games', me.game_id);
        Meteor.subscribe('asteroids', me.game_id);
        Meteor.subscribe('bullets', me.game_id);
        Meteor.subscribe('ships', me.game_id);
        
        var canvas = document.getElementsByTagName("canvas")[0];
        if (canvas && game()) {
          var ctx = canvas.getContext("2d");
          var ships = Ships.find({game_id: me.game_id}).fetch();
          var asteroids = Asteroids.find({game_id: me.game_id}).fetch();
          var bullets = Bullets.find({game_id: me.game_id}).fetch();
        
          draw(asteroids, bullets, ships, ctx, me.game_id);
        }
      }
    }
  });

  Ships.find({player_id: player()._id}).observeChanges({
    added: function(id) {
      var bindings = {
        'left': function(ship) {
          return {angle: (ship.angle + (Math.PI / 15))};
        },
        'right': function(ship) {
          return {angle: (ship.angle - (Math.PI / 15))};
        },
        'up': function(ship) {
          return {speed: (ship.speed + 1), accelerating: true};
        },
        'down': function(ship) {
          return {speed: (ship.speed - 1), accelerating: false};
        }
      }
      
      _.each(['left', 'right', 'up', 'down'], function(key) {
        Meteor.Keybindings.addOne(key, function(event) {
          event.preventDefault();

          var ship = Ships.findOne({player_id: player()._id});
          Ships.update(ship._id, {$set: bindings[key](ship)});
        })
      });
      
      Meteor.Keybindings.addOne('space', function(event) {
        event.preventDefault();

        var ship = Ships.findOne({player_id: player()._id});
        Bullets.insert({
          game_id: player().game_id,
          pos: ship.pos,
          vel: [Math.sin(ship.angle) * 15, Math.cos(ship.angle) * 15],
          radius: 3,
          color: 'red'
        })
      })
    }, // set constants for bullet attributes

    removed: function(id) {
      Meteor.Keybindings.remove(["left", "right", "up", "down", "space"])
    }
  });
  
  Games.find({player_id: player()._id}).observeChanges({
    added: function(game_id) {
      var interval = Meteor.setInterval(function() {
        Asteroids.find({game_id: game_id}).forEach(function(asteroid) {
          moveAsteroid(asteroid);
        });
        
        Bullets.find({game_id: game_id}).forEach(function(bullet) {
          Asteroids.find({game_id: game_id}).forEach(function(asteroid) {
            if (checkCollision(bullet, asteroid)) {
              Asteroids.remove(asteroid._id);
              Bullets.remove(bullet._id);
            }
          })
          if (Bullets.find(bullet._id)) moveBullet(bullet);
        });
        
        Ships.find({game_id: game_id}).forEach(function(ship) {
          Asteroids.find({game_id: game_id}).forEach(function(asteroid) {
            if (checkCollision(ship, asteroid)) {
              resetGame(Session.get("player_id"), game_id);
            }
          })
          if (Ships.find(ship._id)) moveShip(ship);
        });
        
        if (Asteroids.find({game_id: game_id}).count() === 0) {
          Meteor.clearInterval(interval);
          var score = Games.findOne(game_id).clock
          var ctx = document.getElementsByTagName("canvas")[0].getContext("2d");
          Players.update(Session.get("player_id"), {$set: {current_score: score}});
          Games.remove(game_id);
          drawWinMessage(score, ctx);
        }
      }, 30);
    }
  });
});
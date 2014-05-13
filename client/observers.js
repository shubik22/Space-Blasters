observeGames = function(player_id) {
  Games.find({player_id: player_id, type: "single"}).observeChanges({
    added: function(game_id) {
      var handles = setObservers(player_id, game_id);

      var ship = new Ship(player_id, game_id);
      LocalShips.insert(ship);

      var interval = Meteor.setInterval(function() {
        var game = Games.findOne(game_id);
        
        moveObjects(player_id, game_id);
        
        var canvas = document.getElementsByTagName("canvas")[0];
        if (canvas && game) {
          var ctx = canvas.getContext("2d");
          draw(ctx, player_id, game_id);
        }
        // fix game.clock > 1
        if (game  && (game.clock > 1) && 
                Asteroids.find({game_id: game_id}).count() === 0) {
          Meteor.clearInterval(interval);
          var score = Games.findOne(game_id).clock
          var ctx = document.getElementsByTagName("canvas")[0].getContext("2d");
          Players.update(
            Session.get("player_id"),
            {$set: {current_score: score, winner: true}}
          );
          Games.remove(game_id);
          _.each(handles, function(handle) {
            handle.stop();
          })
          drawWinMessage(player_id, ctx);
        };
        
        if (!game) {
          Meteor.clearInterval(interval);
          _.each(handles, function(handle) {
            handle.stop();
          })
        }
      }, 30);
    }
  });
  
  //customize for multiplayer games
  
  Games.find({
    player1_id: player_id,
    player2_id: "pending",
    type: "multi"
  }).observeChanges({
    added: function(game_id) {
      var canvas = document.getElementsByTagName("canvas")[0];
      if (canvas) {
        var ctx = canvas.getContext("2d");
        drawWaitingMessage(ctx);
      }
    }
  });
  
  Games.find({
    $or: [{player1_id: player_id, player2_id: {$ne: "pending"}},
          {player2_id: player_id}],
    type: "multi"
  }).observeChanges({
    added: function(game_id) {
      var handles = setObservers(player_id, game_id);

      var ship = new Ship(player_id, game_id);
      LocalShips.insert(ship);

      var interval = Meteor.setInterval(function() {
        var game = Games.findOne(game_id);
        
        moveObjects(player_id, game_id);
        
        var canvas = document.getElementsByTagName("canvas")[0];
        if (canvas && game) {
          var ctx = canvas.getContext("2d");
          draw(ctx, player_id, game_id);
        }
        // fix game.clock > 1
        if (game  && (game.clock > 1) && 
                Asteroids.find({game_id: game_id}).count() === 0) {
          Meteor.clearInterval(interval);
          var score = Games.findOne(game_id).clock
          var ctx = document.getElementsByTagName("canvas")[0].getContext("2d");
          Players.update(Session.get("player_id"),
              {$set: {current_score: score}});
          setWinner(game);
          Games.remove(game_id);
          _.each(handles, function(handle) {
            handle.stop();
          })
          drawWinMessage(player_id, ctx);
        };
        
        if (!game) {
          Meteor.clearInterval(interval);
          _.each(handles, function(handle) {
            handle.stop();
          })
        }
      }, 30);
    }
  });
};

var setWinner = function(game) {
  var player1 = Players.findOne(game.player1_id);
  var player2 = Players.findOne(game.player2_id);
  
  if (player1.score >= player2.score) {
    Players.update(player1._id, {$set: {winner: true}});
  }
};

var setObservers = function(player_id, game_id) {
  var shipHandle = observeShips(player_id, game_id);
  var localShipHandle = observeLocalShips(player_id, game_id);
  var asteroidsHandle = observeAsteroids(game_id);
  var bulletsHandle = observeBullets(player_id, game_id);  
  var localBulletsHandle = observeLocalBullets(player_id, game_id);

  return [shipHandle, localShipHandle,
          asteroidsHandle, bulletsHandle, localBulletsHandle];
};

var observeShips = function(player_id, game_id) {
  var handle = Ships.find({
    game_id: game_id,
    player_id: {$ne: player_id}
  }).observeChanges({
    added: function(id, fields) {
      console.log("Ship added", id);
      fields.server_id = id;
      LocalShips.insert(fields);
    },
    
    changed: function(id, fields) {
      console.log("Ship changed", id)
      var ship = LocalShips.findOne({server_id: id});
      LocalShips.update(ship._id, {$set: fields});
    },
    
    removed: function(id) {
      console.log("Ship removed", id)
      var ship = LocalShips.findOne({server_id: id});
      LocalShips.remove(ship._id);
    }
  })
  
  return handle;
};

var observeLocalShips = function(player_id, game_id) {
  var handle = LocalShips.find({
      player_id: player_id,
      game_id: game_id
  }).observeChanges({
    added: function(id, fields) {
      console.log("LocalShip added", id)
      addKeybindings(id, player_id, game_id);
      fields.client_id = id;
      Ships.insert(fields);
    },

    changed: function(id, fields) {
      console.log("LocalShip changed", id)
      var ship = Ships.findOne({client_id: id});
      Ships.update(ship._id, {$set: fields});
    },

    removed: function(id) {
      removeKeybindings();
      console.log("LocalShip removed", id)
      var ship = Ships.findOne({client_id: id});
      Ships.remove(ship._id);
    }
  });
  
  return handle;
};

var observeAsteroids = function(game_id) {
  var handle = Asteroids.find({game_id: game_id}).observeChanges({
    added: function(id, fields) {
      // console.log("Asteroid added");
      fields.server_id = id;
      LocalAsteroids.insert(fields);
    },
    
    removed: function(id, fields) {
      // console.log("Asteroid removed")
      var asteroid = LocalAsteroids.findOne({server_id: id});
      if (asteroid) LocalAsteroids.remove(asteroid._id);
    }
  });
  
  return handle;
};

var observeBullets = function(player_id, game_id) {
  var handle = Bullets.find({game_id: game_id, player_id: {$ne: player_id}}).observeChanges({
    added: function(id, fields) {
      // console.log("Bullet added");
      fields.server_id = id;
      LocalBullets.insert(fields);
    },

    removed: function(id) {
      // console.log("Bullet removed")
      var bullet = LocalBullets.findOne({server_id: id});
      if (bullet) LocalBullets.remove(bullet._id);
    }
  });
  
  return handle;
};

var observeLocalBullets = function(player_id, game_id) {
  var handle = LocalBullets.find({player_id: player_id, game_id: game_id}).observeChanges({
    added: function(id, fields) {
      // console.log("LocalBullet added");
      fields.client_id = id;
      Bullets.insert(fields);
    },

    removed: function(id) {
      // console.log("LocalBullet removed")
      var bullet = Bullets.findOne({client_id: id});
      if (bullet) Bullets.remove(bullet._id);
    }
  });
  
  return handle;
};

var addKeybindings = function(id, player_id, game_id) {
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

      var ship = LocalShips.findOne(id);
      LocalShips.update(ship._id, {$set: bindings[key](ship)});
    })
  });

  Meteor.Keybindings.addOne('space', function(event) {
    event.preventDefault();

    var ship = LocalShips.findOne(id);
    LocalBullets.insert({
      player_id: player_id,
      game_id: game_id,
      pos: ship.pos,
      vel: [Math.sin(ship.angle) * 15, Math.cos(ship.angle) * 15],
      radius: 3,
      color: 'red'
    })
  }); // set constants for bullet attributes
};

var removeKeybindings = function() {
  Meteor.Keybindings.remove(["left", "right", "up", "down", "space"]);
};
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
        if (game  && (game.clock > 5) && 
                Asteroids.find({game_id: game_id}).count() === 0) {
          Meteor.clearInterval(interval);
          var player = Players.findOne(Session.get("player_id"));
          var score = Games.findOne(game_id).clock

          var ctx = canvas.getContext("2d");
          Players.update(
            player._id,
            {$set: {score: score, winner: true}}
          );
          
          Records.insert({
            type: "single",
            username: player.username,
            score: score
          });
          
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
          var player = Players.findOne(Session.get("player_id"));
          var score = Games.findOne(game_id).clock;
          var ctx = canvas.getContext("2d");
          
          Players.update(player._id,
              {$set: {current_score: score}});
            
          Games.remove(game_id);
          _.each(handles, function(handle) {
            handle.stop();
          })
          drawWinMessage(player_id, ctx);
        };
        
        if (!game) {
          if (canvas) drawWinMessage(player_id, canvas.getContext("2d"));
          
          Meteor.clearInterval(interval);
          _.each(handles, function(handle) {
            handle.stop();
          })
        }
      }, 30);
    }
  });
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
      fields.server_id = id;
      LocalShips.insert(fields);
    },
    
    changed: function(id, fields) {
      var ship = LocalShips.findOne({server_id: id});
      LocalShips.update(ship._id, {$set: fields});
    },
    
    removed: function(id) {
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
      addKeybindings(id, player_id, game_id);
      fields.client_id = id;
      Ships.insert(fields);
    },

    changed: function(id, fields) {
      var ship = Ships.findOne({client_id: id});
      Ships.update(ship._id, {$set: fields});
    },

    removed: function(id) {
      removeKeybindings();
      var ship = Ships.findOne({client_id: id});
      Ships.remove(ship._id);
    }
  });
  
  return handle;
};

var observeAsteroids = function(game_id) {
  var handle = Asteroids.find({game_id: game_id}).observeChanges({
    added: function(id, fields) {
      fields.server_id = id;
      LocalAsteroids.insert(fields);
    },
    
    removed: function(id, fields) {
      var asteroid = LocalAsteroids.findOne({server_id: id});
      if (asteroid) LocalAsteroids.remove(asteroid._id);
    }
  });
  
  return handle;
};

var observeBullets = function(player_id, game_id) {
  var handle = Bullets.find({game_id: game_id}).observeChanges({
    added: function(id, fields) {
      if (fields.player_id != player_id) {
        fields.server_id = id;
        LocalBullets.insert(fields);        
      }
    },

    removed: function(id) {
      var bullet = LocalBullets.findOne({server_id: id});
      if (bullet) LocalBullets.remove(bullet._id);
    }
  });
  
  return handle;
};

var observeLocalBullets = function(player_id, game_id) {
  var handle = LocalBullets.find({player_id: player_id, game_id: game_id}).observeChanges({
    added: function(id, fields) {
      fields.client_id = id;
      Bullets.insert(fields);
    },

    removed: function(id) {
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
      return {speed: (Math.min(ship.speed + 1, 10)), accelerating: true};
    },
    'down': function(ship) {
      return {speed: (Math.max(ship.speed - 1, -10)), accelerating: false};
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
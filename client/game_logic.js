Game = {};
Game.DIM_X = 600;
Game.DIM_Y = 600;

moveObjects = function(player_id, game_id) {
  moveAsteroids(game_id);
  moveBullets(player_id, game_id);
  moveShips(game_id);
};

var moveAsteroids = function(game_id) {
  LocalAsteroids.find({game_id: game_id}).forEach(function(asteroid) {
    moveAsteroid(asteroid);
  });
};

var moveBullets = function(player_id, game_id) {
  LocalBullets.find({game_id: game_id}).forEach(function(bullet) {
    LocalAsteroids.find({game_id: game_id}).forEach(function(asteroid) {
      if (bullet.player_id === player_id && checkCollision(bullet, asteroid)) {
        LocalAsteroids.remove(asteroid._id);
        Asteroids.remove(asteroid.server_id);
        LocalBullets.remove(bullet._id);
        Players.update(player_id, {$inc: {hits: 1}})
      }
    })
    if (LocalBullets.find(bullet._id)) moveBullet(bullet);
  });
};

var moveShips = function(game_id) {
  LocalShips.find({game_id: game_id}).forEach(function(ship) {
    LocalAsteroids.find({game_id: game_id}).forEach(function(asteroid) {
      if (checkCollision(ship, asteroid)) {
        resetGame(Session.get("player_id"), game_id);
      }
    })
    if (LocalShips.find(ship._id)) moveShip(ship);
  });
};

var moveAsteroid = function(asteroid) {
  var pos = [];
  pos[0] = asteroid.pos[0] + asteroid.vel[0];
  pos[1] = asteroid.pos[1] + asteroid.vel[1];
  pos = enforceBoundary(pos);
  
  LocalAsteroids.update(asteroid._id, {$set: {pos: pos}});
};

var moveBullet = function(bullet) {
  var pos = [];
  pos[0] = bullet.pos[0] + bullet.vel[0];
  pos[1] = bullet.pos[1] + bullet.vel[1];
  
  if (removeBullet(pos)) {
    LocalBullets.remove(bullet._id);
  } else {
    LocalBullets.update(bullet._id, {$set: {pos: pos}})
  }
};

var moveShip = function(ship) {
  var pos = [];
  pos[0] = ship.pos[0] + Math.sin(ship.angle) * ship.speed;
  pos[1] = ship.pos[1] + Math.cos(ship.angle) * ship.speed;
  pos = enforceBoundary(pos);
  
  LocalShips.update(ship._id, {$set: {pos: pos}});
};

var checkCollision = function(obj1, obj2) {
  var xDiff = obj1.pos[0] - obj2.pos[0];
  var yDiff = obj1.pos[1] - obj2.pos[1];
  var distance = Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2));
  var radii = obj1.radius + obj2.radius;

  return (distance < radii);
};

resetGame = function(player_id, game_id) {
  var ship = LocalShips.findOne({player_id: player_id, game_id: game_id});
  var ship_id = ship && ship._id

  LocalShips.remove(ship_id);
  LocalBullets.find({
    player_id: player_id,
    game_id: game_id
  }).forEach(function(bullet) {
    LocalBullets.remove(bullet._id)
  });
  respawnShip(player_id, game_id);
}

var respawnShip = function(player_id, game_id) {
  var interval = Meteor.setInterval(function() {
    var ship = LocalShips.findOne({player_id: player_id, game_id: game_id});
    var game = Games.findOne(game_id);
    
    if (game && !ship && clearForRespawn(game_id)) {
      var ship = new Ship(player_id, game_id);
      LocalShips.insert(ship);
    }
    
    if (ship || !game) Meteor.clearInterval(interval);
  }, 100)
};

var clearForRespawn = function(game_id) {
  var asteroids = LocalAsteroids.find({game_id: game_id}).fetch();
  return _.every(asteroids, function(asteroid) {
    var xDiff = asteroid.pos[0] - Game.DIM_X/2;
    var yDiff = asteroid.pos[1] - Game.DIM_Y/2;
    var distance = Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2));
    return (distance > 100);
  });
};

var enforceBoundary = function(pos) {
  if (pos[0] > Game.DIM_X) {
    pos[0] = 0;
  } else if (pos[0] < 0) {
    pos[0] = Game.DIM_X;
  };

  if (pos[1] > Game.DIM_Y) {
    pos[1] = 0;
  } else if (pos[1] < 0) {
    pos[1] = Game.DIM_Y;
  };

  return pos;
};

var removeBullet = function(pos) {
   return (pos[0] > Game.DIM_X) ||(pos[0] < 0) ||
          (pos[1] > Game.DIM_Y) || (pos[1] < 0);
};
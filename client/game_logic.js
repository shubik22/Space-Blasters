Game = {};
Game.DIM_X = 600;
Game.DIM_Y = 600;

moveObjects = function(player_id, game_id) {
  moveAsteroids(game_id);
  moveBullets(player_id, game_id);
  moveShips(player_id, game_id);
};

var moveAsteroids = function(game_id) {
  LocalAsteroids.find({game_id: game_id}).forEach(function(asteroid) {
    moveAsteroid(asteroid);
  });
};

var moveBullets = function(player_id, game_id) {
  LocalBullets.find({game_id: game_id}).forEach(function(bullet) {
    if (bullet.player_id === player_id) {
      checkBulletAsteroids(bullet, player_id, game_id);
    }
    if (LocalBullets.find(bullet._id)) moveBullet(bullet);
  });
};

var checkBulletAsteroids = function(bullet, player_id, game_id) {
  LocalAsteroids.find({game_id: game_id}).forEach(function(asteroid) {
    if (checkCollision(bullet, asteroid)) {
      LocalAsteroids.remove(asteroid._id);
      Asteroids.remove(asteroid.server_id);
      LocalBullets.remove(bullet._id);
      Players.update(player_id, {$inc: {score: 1}})
      if (LocalAsteroids.find().count() === 0
          && Games.findOne(game_id).type === "multi") {
        setWinner(game_id);
      }
    }
  })
};

var moveShips = function(player_id, game_id) {
  LocalShips.find({game_id: game_id}).forEach(function(ship) {
    if (ship.player_id === player_id) {
      checkShipAsteroids(ship, player_id, game_id);
      checkShipBullets(ship, player_id, game_id);
      checkShipShips(ship, player_id, game_id);      
    }
    if (LocalShips.findOne(ship._id)) moveShip(ship);
  });
};

var checkShipAsteroids = function(ship, player_id, game_id) {
  LocalAsteroids.find({game_id: game_id}).forEach(function(asteroid) {
    if (checkCollision(ship, asteroid)) resetShip(player_id, game_id);
  });
};

var checkShipBullets = function(ship, player_id, game_id) {
  LocalBullets.find({
    game_id: game_id,
    player_id: {$ne: player_id}
  }).forEach(function(bullet) {
    if (checkCollision(ship, bullet)) {
      Players.update(bullet.player_id, {$inc: {score: 1}});
      LocalBullets.remove(bullet._id);
      resetShip(player_id, game_id);
    }
  })
};

var checkShipShips = function(ship1, player_id, game_id) {
  LocalShips.find({
    game_id: game_id,
    player_id: {$ne: player_id}
  }).forEach(function(ship2) {
    if (checkCollision(ship1, ship2)) {
      resetShip(player_id, game_id);
    }
  })
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

var resetShip = function(player_id, game_id) {
  var ship = LocalShips.findOne({player_id: player_id, game_id: game_id});
  var ship_id = ship && ship._id

  LocalShips.remove(ship_id);
  respawnShip(player_id, game_id);
};

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
  var bullets = LocalBullets.find({game_id: game_id}).fetch();

  var objects = asteroids.concat(bullets);

  return _.every(objects, function(object) {
    var xDiff = object.pos[0] - Game.DIM_X/2;
    var yDiff = object.pos[1] - Game.DIM_Y/2;
    var distance = Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2));
    return (distance > (60 + object.radius));
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

var setWinner = function(game_id) {
  var game = Games.findOne(game_id);
  var player1 = Players.findOne(game.player1_id);
  var player2 = Players.findOne(game.player2_id);

  if (player1.score >= player2.score) {
    Players.update(player1._id, {$set: {winner: true}});
    Records.insert({
      type: "multi",
      username: player1.username,
      opponent: player2.username,
      score: player1.score
    });
  }
  if (player2.score >= player2.score) {
    Players.update(player2._id, {$set: {winner: true}});
    Records.insert({
      type: "multi",
      username: player2.username,
      opponent: player1.username,
      score: player2.score
    });
  }
};
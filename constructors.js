Game = {};
Game.DIM_X = 600;
Game.DIM_Y = 600;

// INHERITANCE

Function.prototype.inherits = function(SuperClass) {
  function Surrogate() {};
  Surrogate.prototype = SuperClass.prototype;
  this.prototype = new Surrogate();
};


// MOVING OBJECT

MovingObject = MovingObject = function(pos, vel, radius, color,  game_id) {
  this.pos    = pos;
  this.vel    = vel;
  this.radius = radius;
  this.color  = color;
  this.game_id = game_id;
};

// ASTEROID

Asteroid = function(pos, vel, radius, game_id) {
  MovingObject.call(this,
    pos,
    vel,
    radius,
    Asteroid.randomColor(),
    game_id
  );
};

Asteroid.randomColor = function() {
  var random = Math.random();
  if (random <= 0.5) {
    return "yellow";
  } else {
    return "black";
  };
};

Asteroid.RADIUS_BOUND = 40;

Asteroid.inherits(MovingObject);

Asteroid.randomAsteroid = function(game_id) {
  var radius = Asteroid.RADIUS_BOUND * (Math.random() + 0.2);
  return new Asteroid(this.randomPos(radius), this.randomVel(), radius, game_id);
};

Asteroid.randomPos = function(radius) {
  var posX = (Math.random() * (Game.DIM_X - 2 * radius) + radius);
  var posY = (Math.random() * (Game.DIM_Y - 2 * radius) + radius);
  
  var dist = function(x, y) {
    var dx = (x - Game.DIM_X / 2);
    var dy = (y - Game.DIM_Y / 2);
    return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2))
  }
  
  while (dist(posX, posY) < 200) {
    posX = (Math.random() * (Game.DIM_X - 2 * radius) + radius);
    posY = (Math.random() * (Game.DIM_Y - 2 * radius) + radius);
  }
  
  return [posX, posY];
};

Asteroid.randomVel = function() {
  var dirX = ((Math.random() * 2) - 1);
  var dirY = ((Math.random() * 2) - 1);
  var speedX = Game.DIM_X / 70 * Math.random();
  var speedY = Game.DIM_Y / 70 * Math.random();

  return [dirX * speedX, dirY * speedY];
};


// SHIP

Ship = function(player_id, game_id) {
  this.pos = [Game.DIM_X / 2, Game.DIM_X / 2];
  this.angle = Math.PI;
  this.radius = 20;
  this.speed = 0;
  this.color = "blue";
  this.game_id = game_id;
  this.player_id = player_id;
};
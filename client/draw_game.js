draw = function(ctx, player_id, game_id) {
  var ships = LocalShips.find({game_id: game_id}).fetch();
  var asteroids = LocalAsteroids.find({game_id: game_id}).fetch();
  var bullets = LocalBullets.find({game_id: game_id}).fetch();
  
  ctx.clearRect(0, 0, 600, 600);  // Fill in with global variables later
  _.each(asteroids, function(asteroid) {
    drawCircle(asteroid, ctx);
  });
  _.each(bullets, function(bullet) {
    drawCircle(bullet, ctx);
  })
  _.each(ships, function(ship) {
    drawShip(ship, ctx);
  });
  
  var hits = Players.findOne(player_id).hits;
  var clock = Games.findOne(game_id).clock;
  
  drawTime(ctx, hits, clock);
  
  if (ships.length === 0) {
    ctx.fillStyle = "red";
    ctx.font = "20pt Arial";
    ctx.textAlign = "center";
    ctx.fillText("Waiting to Respawn", 300, 300);
  }
};

drawWinMessage = function(score, ctx) {
  ctx.clearRect(0, 0, 600, 600);
  
  var rectX = 100;
  var rectY = 205;
  var rectWidth = 400;
  var rectHeight = 100;
  var cornerRadius = 20;

  ctx.lineJoin = "round";
  ctx.lineWidth = cornerRadius;
  ctx.fillStyle = "white";
  ctx.strokeStyle = "white";
  
  ctx.strokeRect(rectX + (cornerRadius/2), rectY + (cornerRadius/2),
      rectWidth - cornerRadius, rectHeight - cornerRadius);
  ctx.fillRect(rectX + (cornerRadius/2), rectY + (cornerRadius/2),
      rectWidth - cornerRadius, rectHeight - cornerRadius);
  
  ctx.fillStyle = "red";
  ctx.font = "20pt Arial";
  ctx.textAlign = "center";
  ctx.fillText("You win! Score: " + Math.round(score), 300, 250);
  ctx.font = "16pt Arial"
  ctx.fillText('Click on "Leave Game" to return home.', 300, 280);
};

var drawCircle = function(obj, ctx) {
  ctx.fillStyle = obj.color;
  ctx.beginPath();

  ctx.arc(
    obj.pos[0],
    obj.pos[1],
    obj.radius,
    0,
    2 * Math.PI,
    false
  );

  ctx.fill();
};

var drawShip = function(ship, ctx) {
  var baseAngle1 = ship.angle + (3 * Math.PI - (Math.PI / 20)) / 4 // Review
  var baseAngle2 = ship.angle - (3 * Math.PI - (Math.PI / 20)) / 4 // Review

  var dTop = [ship.radius * Math.sin(ship.angle),
                ship.radius * Math.cos(ship.angle)];
  var dBase1 = [ship.radius * Math.sin(baseAngle1),
                ship.radius * Math.cos(baseAngle1)];
  var dBase2 = [ship.radius * Math.sin(baseAngle2),
                ship.radius * Math.cos(baseAngle2)];

  var topPos = [ship.pos[0] + dTop[0], ship.pos[1] + dTop[1]];
  var base1Pos = [ship.pos[0] + dBase1[0], ship.pos[1] + dBase1[1]];
  var base2Pos = [ship.pos[0] + dBase2[0], ship.pos[1] + dBase2[1]];

  if (ship.accelerating) {
    ctx.fillStyle = ((Math.random() > 0.2) ? "orange" : "red");
    ctx.beginPath();
    ctx.moveTo(base1Pos[0], base1Pos[1]);
    ctx.lineTo(base2Pos[0],base2Pos[1]);
    ctx.lineTo(ship.pos[0] - dTop[0], ship.pos[1] - dTop[1]);
    ctx.fill();
  }
  
  ctx.fillStyle = ship.color;
  ctx.beginPath();
  ctx.moveTo(topPos[0], topPos[1]);
  ctx.lineTo(base1Pos[0], base1Pos[1]);
  ctx.lineTo(base2Pos[0],base2Pos[1]);
  ctx.fill();
};

var drawTime = function(ctx, hits, clock) {
  ctx.fillStyle = "#DE2BC6";
  ctx.font = "12pt Arial";
  ctx.textAlign = "left";
  ctx.fillText("Time: " + Math.round(clock), 10, 20);
  ctx.fillText("Asteroids Hit: " + hits, 10, 40);
};
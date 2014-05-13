Meteor.publish('players', function() {
  return Players.find();
});
Meteor.publish('games', function() {
  return Games.find();
});
Meteor.publish('records', function() {
  return Records.find({}, {sort: {"time": 1}, limit: 10});
});
Meteor.publish('asteroids', function(game_id) {
  return Asteroids.find({game_id: game_id});
});
Meteor.publish('bullets', function(game_id) {
  return Bullets.find({game_id: game_id});
});
Meteor.publish('ships', function(game_id) {
  return Ships.find({game_id: game_id});
});
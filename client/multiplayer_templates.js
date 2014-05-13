Template.multiLobby.show = function() {
  return Session.equals('page', 'multiLobby');
};

Template.multiLobby.events({
  "click .new-game": function(event) {
    event.preventDefault();

    Session.set("page", "gamePlay");
    Meteor.call('start_new_game', Session.get('player_id'), "multi");
  },
  
  "click .existing-games": function(event) {
    event.preventDefault();
    
    Session.set("page", "existingGames");
  },

  "click .button.leaderboard": function(event) {
    event.preventDefault();
    
    Session.set("page", "multiLeaderboard");
  },
  
  "click .button.back": function(event) {
    event.preventDefault();
    
    Session.set("page", "mainLobby");
  }
});

Template.existingGames.show = function() {
  return Session.equals('page', 'existingGames');
};

Template.existingGames.gamesExist = function() {
  return Games.find({type: "multi", player2_id: "pending"}).count() > 0;
};

Template.existingGames.games = function() {
  return Games.find({type: "multi", player2_id: "pending"});
};

Template.existingGames.opponent = function() {
  return Players.findOne(this.player1_id).username;
};

Template.existingGames.events({
  "click .join-game": function(event) {
    event.preventDefault();
    
    var game_id = $(event.currentTarget).attr("id");
    Meteor.call("join_game", Session.get("player_id"), game_id);
    Session.set("page", "gamePlay");
  },
  
  "click .button.back": function(event) {
    event.preventDefault();
    
    Session.set("page", "multiLobby");
  }
})

Template.multiLeaderboard.show = function() {
  return Session.equals('page', 'multiLeaderboard');
};

Template.multiLeaderboard.records = function() {
  return Records.find({type: "multi"}, {sort: {time: 1}});
};

Template.multiLeaderboard.time = function() {
  return Math.round(this.time);
};

Template.multiLeaderboard.events({
  "click .button.back": function(event) {
    event.preventDefault();
    
    Session.set("page", "multiLobby");
  }
});
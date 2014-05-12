// Utility Functions

var player = function() {
  return Players.findOne(Session.get("player_id"));
};

var game = function() {
  var me = player();
  return me && me.game_id && Games.findOne(me.game_id);
};

Template.lobby.show = function() {
  return Session.equals('page', 'lobby');
};

Template.lobby.events({
  "click .new-game": function(event) {
    event.preventDefault();

    Session.set("page", "gamePlay");
    Meteor.call('start_new_game', Session.get('player_id'));
  },
  
  "click .button.set-name": function(event) {
    event.preventDefault();
    
    var username = $(event.currentTarget).parent().find("input").val();
    Players.update(Session.get('player_id'), {$set: {username: username}})
  },
  
  "click .button.leaderboard": function(event) {
    event.preventDefault();
    
    Session.set("page", "leaderboard");
  }
});

Template.lobby.username = function() {
  var me = player();
  return me && me.username;
};

Template.leaderboard.show = function() {
  return Session.equals('page', 'leaderboard');
};

Template.leaderboard.records = function() {
  return Records.find();
}

Template.leaderboard.time = function() {
  return Math.round(this.time);
}

Template.leaderboard.events({
  "click .button.lobby": function(event) {
    event.preventDefault();
    
    Session.set("page", "lobby");
  }
})

Template.gamePlay.show = function() {
  return Session.equals('page', 'gamePlay');
};

Template.gamePlay.clock = function() {
  var clock = (game() ? game().clock : 0);
  if (clock) {
    return Math.round(clock);
  } else {
    if (player().current_score) return Math.round(player().current_score);
  }
};

Template.gamePlay.events({
  "click .button.lobby": function(event) {
    event.preventDefault();
    
    Meteor.call("end_game", Session.get("player_id"));
    Session.set("page", "lobby");
  }
});
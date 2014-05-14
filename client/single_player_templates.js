Template.singleLobby.show = function() {
  return Session.equals('page', 'singleLobby');
};

Template.singleLobby.events({
  "click .new-game": function(event) {
    event.preventDefault();

    Session.set("page", "gamePlay");
    Meteor.call('start_new_game', Session.get('player_id'), "single");
  },
  
  "click .button.leaderboard": function(event) {
    event.preventDefault();
    
    Session.set("page", "singleLeaderboard");
  },
  
  "click .button.back": function(event) {
    event.preventDefault();
    
    Session.set("page", "mainLobby");
  }
});

Template.singleLeaderboard.show = function() {
  return Session.equals('page', 'singleLeaderboard');
};

Template.singleLeaderboard.records = function() {
  return Records.find({type: "single"}, {sort: {score: 1}, limit: 10});
}

Template.singleLeaderboard.score = function() {
  return Math.round(this.score);
}

Template.singleLeaderboard.events({
  "click .button.back": function(event) {
    event.preventDefault();
    
    Session.set("page", "singleLobby");
  }
});
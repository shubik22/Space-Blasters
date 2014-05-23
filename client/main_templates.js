var player = function() {
  return Players.findOne(Session.get("player_id"));
};

Template.mainLobby.show = function() {
  return Session.equals('page', 'mainLobby');
};

Template.mainLobby.username = function() {
  return player() && player().username;
};

Template.mainLobby.events({
  "submit form.name": function(event) {
    event.preventDefault();
    
    var username = $(event.currentTarget).parent().find("input").val();
    Players.update(Session.get('player_id'), {$set: {username: username}});
  },

  "click .single-player": function(event) {
    event.preventDefault();

    Session.set("page", "singleLobby");
  },

  "click .multiplayer": function(event) {
    event.preventDefault();

    Session.set("page", "multiLobby");
  }
});

Template.modals.username = function() {
  return player() && player().username;
};

Template.modals.events({
  "click li.about": function(event) {
    event.preventDefault();
    
    $(".modal.about").removeClass("hidden");
    $(".modal.about").addClass("visible");
  },
  
  "click li.instructions": function(event) {
    event.preventDefault();
    
    $(".modal.instructions").removeClass("hidden");
    $(".modal.instructions").addClass("visible");
  },
  
  "click .modal-screen": function(event) {
    event.preventDefault();

    $(".modal.visible").addClass("hidden");
    $(".modal.visible").removeClass("visible");
  }
})

Template.gamePlay.show = function() {
  return Session.equals('page', 'gamePlay');
};

Template.gamePlay.opponent = function() {
  var game = Games.findOne(player().game_id);
  
  if (game && game.type === "multi") {
    if (game.player1_id === player()._id) {
      return Players.findOne(game.player2_id);
    } else {
      return Players.findOne(game.player1_id);
    }
  } else {
    return false;
  }
};

Template.gamePlay.color = function() {
  return player() && player().color;
};

Template.gamePlay.events({
  "click .button.lobby": function(event) {
    event.preventDefault();
    
    Meteor.call("end_game", Session.get("player_id"));
    Session.set("page", "mainLobby");
  }
});
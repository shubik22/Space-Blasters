Games = new Meteor.Collection('games');

Players = new Meteor.Collection('players');

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
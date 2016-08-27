import { Meteor } from 'meteor/meteor';

LiveGames = new Mongo.Collection("liveGames");

Meteor.methods({
    adjust_rating:function(new_rating){
        var prof = Meteor.user().profile;
        prof.rating = new_rating;

        Meteor.users.update(Meteor.userId(), {$set: {profile: prof}});
    },
    set_challenge:function(opp_user){
        var prof = Meteor.user().profile;
        prof.challenge = opp_user._id;

        Meteor.users.update(Meteor.userId(), {$set: {profile: prof}});

        if(opp_user.profile.challenge === Meteor.userId()){
        	var new_prof1 = Meteor.user().profile;
        	var new_prof2 = opp_user.profile;
        	var rand = Math.floor(Math.random() * 2);
        	var colors = ['w','b'];
        	new_prof1.challenge = null;
        	new_prof1.game = colors[rand];
        	new_prof1.opp = opp_user._id;
            new_prof1.opp_rating = opp_user.profile.rating;
        	new_prof2.challenge = null;
        	new_prof2.game = colors[1-rand];
        	new_prof2.opp = Meteor.userId();
            new_prof2.opp_rating = Meteor.user().profile.rating;

        	Meteor.users.update(Meteor.userId(), {$set: {profile: new_prof1}});
        	Meteor.users.update(opp_user._id, {$set: {profile: new_prof2}});

        	var players = [opp_user._id, Meteor.userId()].sort();
        	var new_game = {players: players, fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"};
        	LiveGames.upsert({players: players}, new_game);
        }
    },
    update_board:function(new_fen, id){
    	LiveGames.update({players: id}, {$set: {fen: new_fen}});
    },
    game_over:function(userid, wl){
    	var prof = Meteor.users.findOne({_id: userid}).profile;
        var opp_id = prof.opp;
    	var opp_rating = prof.opp_rating;
    	prof.game = null;
    	prof.opp = null;
        prof.opp_rating = null;


    	if(!prof.rating) {
    		prof.rating = 1200;
    	}
    	if(!opp_rating) {
    		opp_rating = 1200;
    	}

    	//adjust rating
    	var expected = 1.0 / (1.0 + Math.pow(10, (opp_rating - prof.rating) / 400));
    	var delta = Math.floor(32 * (wl - expected));
    	if(!prof.deltas) {
    		prof.deltas = [delta];
    	} else {
    		prof.deltas.unshift(delta);
    		if(prof.deltas.length > 10) {
    			prof.deltas.pop();
    		}
    	}
    	prof.rating += delta;

    	Meteor.users.update(userid, {$set: {profile: prof}});
    	LiveGames.remove({players: userid});
    }
});

Meteor.publish("liveGames", function(){
    return LiveGames.find();
});
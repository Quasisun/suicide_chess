import './navbar.html';


Template.navbar.helpers({
    user_rating() {
        var rating = Meteor.user().profile.rating;
        if(!rating){
            return "Unrated";
        }
        return rating;
    },
    rating_history() {
    	var rating = Meteor.user().profile.rating;
        var deltas = Meteor.user().profile.deltas;
        var history = [];
        for(i=0;i<deltas.length;i++){
        	rating -= deltas[i];
        	history.push({delta: deltas[i], old_rating: rating});
        }
        return history;
    },
    nonnegative(val) {
        return val >= 0;
    },
    absolute_value(val) {
        return Math.abs(val);
    },
    in_game() {
        if(LiveGames.findOne({players: Meteor.userId()})) {
            return true;
        } 
        return false;
    },
    is_active_path(path) {
    	var current_router = Router.current();
    	if(current_router && (path === current_router.route.path())) {
    		return "active";
    	}
    }
});

Template.navbar.events({
    'submit .challenge'(event) {
        event.preventDefault();
        const target = event.target;
        const text = target.text.value;

        var opp_user = Meteor.users.findOne({username: text});
        if(!opp_user || text == Meteor.user().username){
            challengeError.set(text);
            console.log("No user with that name");
        } else {
            challengeError.set(null);
            Meteor.call('set_challenge', opp_user);
        }
    }
});
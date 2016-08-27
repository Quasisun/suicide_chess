var require = meteorInstall({"server":{"main.js":["meteor/meteor",function(require){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// server/main.js                                                                                                     //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _meteor = require('meteor/meteor');                                                                               // 1
                                                                                                                      //
LiveGames = new Mongo.Collection("liveGames");                                                                        // 3
                                                                                                                      //
_meteor.Meteor.methods({                                                                                              // 5
    adjust_rating: function () {                                                                                      // 6
        function adjust_rating(new_rating) {                                                                          // 6
            var prof = _meteor.Meteor.user().profile;                                                                 // 7
            prof.rating = new_rating;                                                                                 // 8
                                                                                                                      //
            _meteor.Meteor.users.update(_meteor.Meteor.userId(), { $set: { profile: prof } });                        // 10
        }                                                                                                             //
                                                                                                                      //
        return adjust_rating;                                                                                         //
    }(),                                                                                                              //
    set_challenge: function () {                                                                                      // 12
        function set_challenge(opp_user) {                                                                            // 12
            var prof = _meteor.Meteor.user().profile;                                                                 // 13
            prof.challenge = opp_user._id;                                                                            // 14
                                                                                                                      //
            _meteor.Meteor.users.update(_meteor.Meteor.userId(), { $set: { profile: prof } });                        // 16
                                                                                                                      //
            if (opp_user.profile.challenge === _meteor.Meteor.userId()) {                                             // 18
                var new_prof1 = _meteor.Meteor.user().profile;                                                        // 19
                var new_prof2 = opp_user.profile;                                                                     // 20
                var rand = Math.floor(Math.random() * 2);                                                             // 21
                var colors = ['w', 'b'];                                                                              // 22
                new_prof1.challenge = null;                                                                           // 23
                new_prof1.game = colors[rand];                                                                        // 24
                new_prof1.opp_rating = opp_user.profile.rating;                                                       // 25
                new_prof2.challenge = null;                                                                           // 26
                new_prof2.game = colors[1 - rand];                                                                    // 27
                new_prof2.opp_rating = _meteor.Meteor.user().profile.rating;                                          // 28
                                                                                                                      //
                _meteor.Meteor.users.update(_meteor.Meteor.userId(), { $set: { profile: new_prof1 } });               // 30
                _meteor.Meteor.users.update(opp_user._id, { $set: { profile: new_prof2 } });                          // 31
                                                                                                                      //
                var players = [opp_user._id, _meteor.Meteor.userId()].sort();                                         // 33
                var new_game = { players: players, fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" };
                LiveGames.upsert({ players: players }, new_game);                                                     // 35
            }                                                                                                         //
        }                                                                                                             //
                                                                                                                      //
        return set_challenge;                                                                                         //
    }(),                                                                                                              //
    update_board: function () {                                                                                       // 38
        function update_board(new_fen, id) {                                                                          // 38
            LiveGames.update({ players: id }, { $set: { fen: new_fen } });                                            // 39
        }                                                                                                             //
                                                                                                                      //
        return update_board;                                                                                          //
    }(),                                                                                                              //
    game_over: function () {                                                                                          // 41
        function game_over(wl) {                                                                                      // 41
            var prof = _meteor.Meteor.user().profile;                                                                 // 42
            var opp_rating = prof.opp_rating;                                                                         // 43
            prof.game = null;                                                                                         // 44
            prof.opp_rating = null;                                                                                   // 45
                                                                                                                      //
            if (!prof.rating) {                                                                                       // 47
                prof.rating = 1200;                                                                                   // 48
            }                                                                                                         //
            if (!opp_rating) {                                                                                        // 50
                opp_rating = 1200;                                                                                    // 51
            }                                                                                                         //
                                                                                                                      //
            //adjust rating                                                                                           //
            var expected = 1.0 / (1.0 + Math.pow(10, (opp_rating - prof.rating) / 400));                              // 41
            var delta = Math.floor(32 * (wl - expected));                                                             // 56
            if (!prof.deltas) {                                                                                       // 57
                prof.deltas = [delta];                                                                                // 58
            } else {                                                                                                  //
                prof.deltas.unshift(delta);                                                                           // 60
                if (prof.deltas.length > 10) {                                                                        // 61
                    prof.deltas.pop();                                                                                // 62
                }                                                                                                     //
            }                                                                                                         //
            prof.rating += delta;                                                                                     // 65
                                                                                                                      //
            _meteor.Meteor.users.update(_meteor.Meteor.userId(), { $set: { profile: prof } });                        // 67
            LiveGames.remove({ players: _meteor.Meteor.userId() });                                                   // 68
        }                                                                                                             //
                                                                                                                      //
        return game_over;                                                                                             //
    }()                                                                                                               //
});                                                                                                                   //
                                                                                                                      //
_meteor.Meteor.publish("liveGames", function () {                                                                     // 72
    return LiveGames.find();                                                                                          // 73
});                                                                                                                   //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}]}},{"extensions":[".js",".json"]});
require("./server/main.js");
//# sourceMappingURL=app.js.map

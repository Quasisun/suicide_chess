import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

challengeError = new ReactiveVar(null);

import './main.html';
import '../imports/accounts-config.js'
import '../imports/navbar.js'

LiveGames = new Mongo.Collection("liveGames");

Meteor.subscribe("liveGames");

Router.route('/', function () {
  this.render('suicide');
});

Router.route('/leaderboard', function () {
  this.render('leaderboard');
});

//var Chess = require('./chess').Chess;
//Meteor.defer(function() {
Template.suicide.onRendered(function() {
    Meteor.subscribe("liveGames");

    var board, in_game,
      game = new Chess(),
      statusEl = $('#status');

    var squares = ['a1','a2','a3','a4','a5','a6','a7','a8',
                    'b1','b2','b3','b4','b5','b6','b7','b8',
                    'c1','c2','c3','c4','c5','c6','c7','c8',
                    'd1','d2','d3','d4','d5','d6','d7','d8',
                    'e1','e2','e3','e4','e5','e6','e7','e8',
                    'f1','f2','f3','f4','f5','f6','f7','f8',
                    'g1','g2','g3','g4','g5','g6','g7','g8',
                    'h1','h2','h3','h4','h5','h6','h7','h8'];
    

    var removeGreySquares = function() {
      $('#board .square-55d63').css('background', '');
    };

    var greySquare = function(square) {
      var squareEl = $('#board .square-' + square);
      
      var background = '#8fd8d8';
      if (squareEl.hasClass('black-3c85d') === true) {
        background = '#528b8b';
      }

      squareEl.css('background', background);
    };

    var canCapture = function (square) {
        var capture_moves = [];
        var v_moves;
        if (typeof square === 'undefined') {
            v_moves = game.moves({verbose: true});
        } else {
            v_moves = game.moves({square: square, verbose: true});
        }
        for (i=0; i < v_moves.length; i++) {
            var move = v_moves[i];
            if (move.flags.indexOf('c') != -1) {
                capture_moves.push(move);
            }
        }
        return capture_moves;
    };
    // do not pick up pieces if the game is over
    // only pick up pieces for the side to move
    var onDragStart = function(source, piece, position, orientation) {
      if ((in_game && game.turn() != Meteor.user().profile.game) ||
          (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
          (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
      }
    };

    var onDrop = function(source, target) {
      removeGreySquares();
      // see if the move is legal
      var target_square = game.get(target);
      var num_captures = canCapture().length;
      if (num_captures > 0 && target_square === null) return 'snapback';

      var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for example simplicity
      });

      // illegal move
      if (move === null) return 'snapback';

      
    };

    var onMouseoverSquare = function(square, piece) {
      if (game.get(square) === null || 
            (in_game && game.turn() != Meteor.user().profile.game) ||
            game.get(square).color != game.turn()) return;
      // get list of possible moves for this square
      var moves;
      if (canCapture().length > 0) {
          moves = canCapture(square);
      } else {
          moves = game.moves({
            legal: false,
            square: square,
            verbose: true
          });
      }

      // exit if there are no moves available for this square
      //if (moves.length === 0) return;

      // highlight the square they moused over
      greySquare(square);

      // highlight the possible squares for this piece
      for (var i = 0; i < moves.length; i++) {
        greySquare(moves[i].to);
      }
    };

    var onMouseoutSquare = function(square, piece) {
      removeGreySquares();
    };
    // update the board position after the piece snap 
    // for castling, en passant, pawn promotion
    var onSnapEnd = function() {
        if(in_game) Meteor.call('update_board',game.fen(),Meteor.userId());
        board.position(game.fen());
        updateStatus();
    };

    var outOfPieces = function(col) {
        for (i=0; i<squares.length; i++) {
            var square = game.get(squares[i]);
            if (!square) continue;
            if (square.color === col) return false;
        }
        return true;
    }

    var updateStatus = function() {
      var status = '';

      var moveColor = 'White';
      if (game.turn() === 'b') {
        moveColor = 'Black';
      }

      // out of pieces?
      if (outOfPieces('w')) {
        status = 'White wins! (Out of pieces)';
        if (in_game) {
            if (Meteor.user().profile.game ==='w') {
                Meteor.call('game_over', Meteor.userId(), 1);
            } else {
                Meteor.call('game_over', Meteor.userId(), 0);
            }
        }
      }

      else if (outOfPieces('b')) {
        status = 'Black wins! (Out of pieces)';
        if (in_game) {
            if (Meteor.user().profile.game ==='b') {
                Meteor.call('game_over', Meteor.userId(), 1);
            } else {
                Meteor.call('game_over', Meteor.userId(), 0);
            }
        }
      }
      // checkmate?

      // draw?
      else if (game.in_draw() === true) {
        var bleft = 0, wleft = 0;
        for (i = 0; i<squares.length; i++){
            var square = game.get(squares[i]);
            if (!square) continue;
            if (square.color === 'b') {
                bleft++;
            } else if (square.color === 'w') {
                wleft++;
            }
        }
        if (bleft > wleft) {
            status = 'White Wins! (Fewer pieces)';
            if (in_game) {
                if (Meteor.user().profile.game === 'w') {
                    Meteor.call('game_over', Meteor.userId(), 1);
                } else {
                    Meteor.call('game_over', Meteor.userId(), 0);
                }
            }
        } else if (wleft > bleft) {
            status = 'Black wins! (Fewer pieces)'
            if (in_game) {
                if (Meteor.user().profile.game === 'b') {
                    Meteor.call('game_over', Meteor.userId(), 1);
                } else {
                    Meteor.call('game_over', Meteor.userId(), 0);
                }
            }
        } else {
            status = 'Draw! (Equal pieces)'
            Meteor.call('game_over', Meteor.userId(), 0.5);
        }
      }

      // game still on
      else {
        var captures = canCapture().length;
       
        status = moveColor + ' to move';

        if (captures > 0) {
            status += ' - Forced capture!';
        }
      }

      statusEl.html(status);
    };

    var cfg = {
      draggable: true,
      position: 'start',
      onDragStart: onDragStart,
      onDrop: onDrop,
      onMouseoutSquare: onMouseoutSquare,
      onMouseoverSquare: onMouseoverSquare,
      onSnapEnd: onSnapEnd
    };
    board = ChessBoard('board', cfg);

    this.autorun(function() {
        in_game = LiveGames.findOne({players: Meteor.userId()});
        console.log(in_game);

        if(in_game) {
            console.log("In game!");
            var current_game = LiveGames.findOne({players: Meteor.userId()});
            game.load(current_game.fen);

            if(Meteor.user().profile.game == 'w') {
                board.orientation('white');
            } else if(Meteor.user().profile.game == 'b') {
                board.orientation('black');
            }

            board.position(current_game.fen);

            var resignEl = $('#resignNow')
            resignEl.on('click', function() {
                console.log("Resigning...");
                Meteor.call('game_over', Meteor.userId(), 0);
                Meteor.call('game_over', Meteor.user().profile.opp, 1);
            });   
        }
        updateStatus();
    });
    
    
});

Template.suicide.helpers({
    fen() {
        var fen = LiveGames.findOne({players: Meteor.userId()}).fen;
        return fen;
    },
    in_game() {
        if(Meteor.user().profile.opp) {
            return true;
        } 
        return false;
    }
});


Template.leaderboard.helpers({
    sorted_users() {
        var users = Meteor.users.find().fetch();
        console.log(users);

        function compare(a,b) {
          if (a.profile.rating < b.profile.rating)
            return 1;
          else if (a.profile.rating > b.profile.rating)
            return -1;
          else 
            return 0;
        }

        users.sort(compare);
        users = users.slice(0,5);
        return users;
    },
    get_rating(user_obj) {
      return user_obj.profile.rating;
    }
});

Template.notifs.helpers({
    isChallenge() {
      var opp_userid = Meteor.user().profile.challenge;
      if(opp_userid) {
        return Meteor.users.findOne({_id: opp_userid}).username;
      }
      return null;
    },
    isGame() {
      var opp_userid = Meteor.user().profile.opp;
      if(opp_userid) {
        return Meteor.users.findOne({_id: opp_userid}).username;
      }
      return null;
    },
    isError() {
      return challengeError.get();
    }
});

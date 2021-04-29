"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.rankedChoiceIRVAlt = exports.rankedChoiceIRV = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _bignumber = _interopRequireDefault(require("bignumber.js"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var MAX_ROUNDS = 32; // Rank-Any, Total-Majority, Stop-On-Total-Majority, Stop-When-2-Remain
// see: https://forum.makerdao.com/t/the-instant-run-off-voting-rabbithole/5340
// new default IRV algo

var rankedChoiceIRV = function rankedChoiceIRV(votes) {
  var totalMkrParticipation = votes.reduce(function (acc, cur) {
    return (0, _bignumber["default"])(cur.mkrSupport || 0).plus(acc);
  }, (0, _bignumber["default"])(0));
  var tally = {
    rounds: 1,
    winner: null,
    totalMkrParticipation: totalMkrParticipation,
    options: {},
    numVoters: votes.length
  };
  var defaultOptionObj = {
    firstChoice: (0, _bignumber["default"])(0),
    transfer: (0, _bignumber["default"])(0),
    winner: false,
    eliminated: false
  }; // if there are no votes, don't do anything

  if (votes.length === 0) {
    return tally;
  } // run the first round


  votes.forEach(function (vote) {
    // take the highest preference option from each voter's ballot
    vote.choice = vote.ballot.pop();
    if (!tally.options[vote.choice]) tally.options[vote.choice] = _objectSpread({}, defaultOptionObj);
    tally.options[vote.choice].firstChoice = (0, _bignumber["default"])(tally.options[vote.choice].firstChoice).plus(vote.mkrSupport || 0);
  }); // does any candidate have the majority after the first round?

  Object.entries(tally.options).forEach(function (_ref) {
    var _ref2 = (0, _slicedToArray2["default"])(_ref, 2),
        option = _ref2[0],
        firstChoice = _ref2[1].firstChoice;

    if (firstChoice.gt(totalMkrParticipation.div(2))) tally.winner = option;
  }); // if so we're done; return the winner

  if (tally.winner) {
    tally.options[tally.winner].winner = true;
    return tally;
  } // if we couldn't find a winner based on first preferences, run additional rounds until we find one


  var _loop = function _loop() {
    tally.rounds++; // find the weakest candidate

    var filteredOptions = Object.entries(tally.options).filter(function (_ref3) {
      var _ref4 = (0, _slicedToArray2["default"])(_ref3, 2),
          optionDetails = _ref4[1];

      return !optionDetails.eliminated;
    });

    var _filteredOptions$redu = filteredOptions.reduce(function (prv, cur) {
      var _prv = (0, _slicedToArray2["default"])(prv, 2),
          prvVotes = _prv[1];

      var _cur = (0, _slicedToArray2["default"])(cur, 2),
          curVotes = _cur[1];

      if (curVotes.firstChoice.plus(curVotes.transfer).lt(prvVotes.firstChoice.plus(prvVotes.transfer))) return cur;
      return prv;
    }),
        _filteredOptions$redu2 = (0, _slicedToArray2["default"])(_filteredOptions$redu, 1),
        optionToEliminate = _filteredOptions$redu2[0]; // mark the weakest as eliminated


    tally.options[optionToEliminate].eliminated = true; // a vote needs to be moved if...
    // 1) it's currently for the eliminated candidate
    // 2) there's another choice further down in the voter's preference list

    var votesToBeMoved = votes.map(function (vote, index) {
      return _objectSpread(_objectSpread({}, vote), {}, {
        index: index
      });
    }).filter(function (vote) {
      return parseInt(vote.choice) === parseInt(optionToEliminate);
    }).filter(function (vote) {
      return vote.ballot[vote.ballot.length - 1] !== 0;
    }); // move votes to the next choice on their preference list

    votesToBeMoved.forEach(function (vote) {
      var prevChoice = votes[vote.index].choice;
      votes[vote.index].choice = votes[vote.index].ballot.pop();
      if (!tally.options[votes[vote.index].choice]) tally.options[votes[vote.index].choice] = _objectSpread({}, defaultOptionObj);

      if (tally.options[votes[vote.index].choice].eliminated) {
        votes[vote.index].choice = votes[vote.index].ballot.pop();
        var validVoteFound = false;

        while (votes[vote.index].choice !== 0) {
          if (!tally.options[votes[vote.index].choice]) tally.options[votes[vote.index].choice] = _objectSpread({}, defaultOptionObj);

          if (!tally.options[votes[vote.index].choice].eliminated) {
            validVoteFound = true;
            break;
          }

          votes[vote.index].choice = votes[vote.index].ballot.pop();
        }

        if (!validVoteFound) return;
      }

      if (!tally.options[votes[vote.index].choice].eliminated) {
        tally.options[votes[vote.index].choice].transfer = (0, _bignumber["default"])(tally.options[votes[vote.index].choice].transfer).plus(vote.mkrSupport || 0);
        tally.options[prevChoice].transfer = (0, _bignumber["default"])(tally.options[prevChoice].transfer).minus(vote.mkrSupport || 0);
      }
    }); // look for a candidate with the majority

    Object.entries(tally.options).forEach(function (_ref5) {
      var _ref6 = (0, _slicedToArray2["default"])(_ref5, 2),
          option = _ref6[0],
          _ref6$ = _ref6[1],
          firstChoice = _ref6$.firstChoice,
          transfer = _ref6$.transfer;

      if (firstChoice.plus(transfer).gt(totalMkrParticipation.div(2))) tally.winner = option;
    }); // count the number of options that haven't been eliminated

    var remainingOptions = Object.entries(tally.options).filter(function (_ref7) {
      var _ref8 = (0, _slicedToArray2["default"])(_ref7, 2),
          optionDetails = _ref8[1];

      return !optionDetails.eliminated;
    }).length; // if there are no more rounds or if there is only one opiton remaining
    // and no winner could be found, then we end the search

    if ((tally.rounds > MAX_ROUNDS || remainingOptions === 1) && !tally.winner) {
      return {
        v: tally
      };
    } // sanity checks


    if (Object.keys(tally.options).length === 2 && !tally.winner) {
      // dead tie. this seems super unlikely, but it should be here for completeness
      // return the tally without declaring a winner
      return {
        v: tally
      };
    }

    if (Object.keys(tally.options).length === 1) {
      // this shouldn't happen
      throw new Error("Invalid ranked choice tally ".concat(tally.options));
    } // if we couldn't find one, go for another round

  };

  while (!tally.winner) {
    var _ret = _loop();

    if ((0, _typeof2["default"])(_ret) === "object") return _ret.v;
  }

  tally.options[tally.winner].winner = true;
  return tally;
}; // Rank-Any, Total-Majority, Stop-On-Total-Majority, Stop-When-2-Remain
// formerly the default IRV algo


exports.rankedChoiceIRV = rankedChoiceIRV;

var rankedChoiceIRVAlt = function rankedChoiceIRVAlt(votes) {
  var totalMkrParticipation = votes.reduce(function (acc, cur) {
    return (0, _bignumber["default"])(cur.mkrSupport || 0).plus(acc);
  }, (0, _bignumber["default"])(0));
  var tally = {
    rounds: 1,
    winner: null,
    totalMkrParticipation: totalMkrParticipation,
    options: {},
    numVoters: votes.length
  };
  var defaultOptionObj = {
    firstChoice: (0, _bignumber["default"])(0),
    transfer: (0, _bignumber["default"])(0),
    winner: false,
    eliminated: false
  };

  if (votes.length === 0) {
    return tally;
  } // run the first round


  votes.forEach(function (vote) {
    vote.choice = vote.ballot.pop();
    if (!tally.options[vote.choice]) tally.options[vote.choice] = _objectSpread({}, defaultOptionObj);
    tally.options[vote.choice].firstChoice = (0, _bignumber["default"])(tally.options[vote.choice].firstChoice).plus(vote.mkrSupport || 0);
  }); // does any candidate have the majority after the first round?

  Object.entries(tally.options).forEach(function (_ref9) {
    var _ref10 = (0, _slicedToArray2["default"])(_ref9, 2),
        option = _ref10[0],
        firstChoice = _ref10[1].firstChoice;

    if (firstChoice.gt(totalMkrParticipation.div(2))) tally.winner = option;
  }); // if so, we're done. Return the winner

  if (tally.winner) {
    tally.options[tally.winner].winner = true;
    return tally;
  } // if we couldn't find a winner based on first preferences, run additionaly irv rounds until we find one


  var _loop2 = function _loop2() {
    tally.rounds++; // eliminate the weakest candidate

    var filteredOptions = Object.entries(tally.options).filter(function (_ref11) {
      var _ref12 = (0, _slicedToArray2["default"])(_ref11, 2),
          optionDetails = _ref12[1];

      return !optionDetails.eliminated;
    });

    var _filteredOptions$redu3 = filteredOptions.reduce(function (prv, cur) {
      var _prv2 = (0, _slicedToArray2["default"])(prv, 2),
          prvVotes = _prv2[1];

      var _cur2 = (0, _slicedToArray2["default"])(cur, 2),
          curVotes = _cur2[1];

      if (curVotes.firstChoice.plus(curVotes.transfer).lt(prvVotes.firstChoice.plus(prvVotes.transfer))) return cur;
      return prv;
    }),
        _filteredOptions$redu4 = (0, _slicedToArray2["default"])(_filteredOptions$redu3, 1),
        optionToEliminate = _filteredOptions$redu4[0];

    tally.options[optionToEliminate].eliminated = true; // a vote needs to be moved if...
    // 1) it's currently for the eliminated candidate
    // 2) there's another choice further down in the voter's preference list

    var votesToBeMoved = votes.map(function (vote, index) {
      return _objectSpread(_objectSpread({}, vote), {}, {
        index: index
      });
    }).filter(function (vote) {
      return parseInt(vote.choice) === parseInt(optionToEliminate);
    }).filter(function (vote) {
      return vote.ballot[vote.ballot.length - 1] !== 0;
    }); // move votes to the next choice on their preference list

    votesToBeMoved.forEach(function (vote) {
      var prevChoice = votes[vote.index].choice;
      votes[vote.index].choice = votes[vote.index].ballot.pop();
      if (!tally.options[votes[vote.index].choice]) tally.options[votes[vote.index].choice] = _objectSpread({}, defaultOptionObj);

      if (tally.options[votes[vote.index].choice].eliminated) {
        votes[vote.index].choice = votes[vote.index].ballot.pop();
        var validVoteFound = false;

        while (votes[vote.index].choice !== 0) {
          if (!tally.options[votes[vote.index].choice]) tally.options[votes[vote.index].choice] = _objectSpread({}, defaultOptionObj);

          if (!tally.options[votes[vote.index].choice].eliminated) {
            validVoteFound = true;
            break;
          }

          votes[vote.index].choice = votes[vote.index].ballot.pop();
        }

        if (!validVoteFound) return;
      }

      if (!tally.options[votes[vote.index].choice].eliminated) {
        tally.options[votes[vote.index].choice].transfer = (0, _bignumber["default"])(tally.options[votes[vote.index].choice].transfer).plus(vote.mkrSupport || 0);
        tally.options[prevChoice].transfer = (0, _bignumber["default"])(tally.options[prevChoice].transfer).minus(vote.mkrSupport || 0);
      }
    }); // look for a candidate with the majority

    Object.entries(tally.options).forEach(function (_ref13) {
      var _ref14 = (0, _slicedToArray2["default"])(_ref13, 2),
          option = _ref14[0],
          _ref14$ = _ref14[1],
          firstChoice = _ref14$.firstChoice,
          transfer = _ref14$.transfer;

      if (firstChoice.plus(transfer).gt(totalMkrParticipation.div(2))) tally.winner = option;
    }); //if there's no more rounds, or if there is one or fewer options that haven't been eliminated
    // the winner is the option with the most votes

    if (tally.rounds > MAX_ROUNDS && !tally.winner || (filteredOptions.length === 1 || filteredOptions.length === 0) && !tally.winner) {
      var max = (0, _bignumber["default"])(0);
      var maxOption;
      Object.entries(tally.options).forEach(function (_ref15) {
        var _ref16 = (0, _slicedToArray2["default"])(_ref15, 2),
            option = _ref16[0],
            _ref16$ = _ref16[1],
            firstChoice = _ref16$.firstChoice,
            transfer = _ref16$.transfer;

        if (firstChoice.plus(transfer).gt(max)) {
          max = firstChoice.plus(transfer);
          maxOption = option;
        }
      });
      tally.winner = maxOption;
    } // sanity checks


    if (Object.keys(tally.options).length === 2) {
      // dead tie. this seems super unlikely, but it should be here for completeness
      // return the tally without declaring a winner
      return {
        v: tally
      };
    }

    if (Object.keys(tally.options).length === 1) {
      // this shouldn't happen
      throw new Error("Invalid ranked choice tally ".concat(tally.options));
    } // if we couldn't find one, go for another round

  };

  while (!tally.winner) {
    var _ret2 = _loop2();

    if ((0, _typeof2["default"])(_ret2) === "object") return _ret2.v;
  }

  tally.options[tally.winner].winner = true;
  return tally;
};

exports.rankedChoiceIRVAlt = rankedChoiceIRVAlt;
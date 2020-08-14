"use strict";
/*
Created from Simulation.swift
8/8/2020  Created
*/
const MAX_ROUNDS = 10;  //default for when we declare a tie
const TEAM_FRIENDLIES_DEFAULT = "Friendlies";
const TEAM_HOSTILES_DEFAULT = "Hostiles";


class Simulation {
  constructor(numberOfSimulations, showDetail, friendlies, hostiles, friendlyTeamName, hostileTeamName) {
    this.numberOfSimulations = (numberOfSimulations > 0) ? numberOfSimulations : 1;
    this.showDetail = showDetail;
    //Embed the FVTT combatants (which contain Token and Actor info) in our normal Combatant class
    this.friendlies = Combatant.makeCombatants(friendlies, friendlyTeamName);
    this.hostiles = Combatant.makeCombatants(hostiles, hostileTeamName);

    this.friendlyTeamName = TEAM_FRIENDLIES_DEFAULT;
  	this.hostileTeamName = TEAM_HOSTILES_DEFAULT;

    if (friendlyTeamName.length) this.friendlyTeamName = friendlyTeamName;
    if (hostileTeamName.length) this.hostileTeamName = hostileTeamName;
  }

// FIXME: How do we do async here?
  run(summaryOutput, detailOutput) {
    var teamFriendliesDeaths = [];
    var teamHostilesDeaths = [];
    var numTeamFriendliesWins = 0;
    var numTeamHostilesWins = 0;
    var numTies = 0;  //if we go more than MAX_ROUNDS then it will be a tie

    for (let iSimulation=0; iSimulation < this.numberOfSimulations; iSimulation++) {
      var simulationSummary = "";
      var simulationDetail = "";

      var remainingCombatants = this.friendlies.concat(this.hostiles);

      //Resets ???? including ordering remainingCombatants in initiative order descending
      Combatant.resetAtStartOfSimulation(remainingCombatants);

//FIXME: Implement Wave loop (will use Encounters within a scene to do this)
//including potentially the next Wave arrives after a set time (e.g. 2 rounds)
      var activeEffects = [];

      var waveCombatants = remainingCombatants;
      simulationDetail += "<br>Combatants in Initiative order:";
      for (let combatant of waveCombatants) {
        simulationDetail += "<br>" + combatant.initiative + ":" + combatant.nameAndHP;
        //Trigger enduring auras for combatants in this waves
  // FIXME:       combatant.applyEnduringAuras(waveCombatants, activeEffects);
      }

      //For each round of combat, loop in initiative order and pick opponents at random
      //Continue until one team is dead/unconscious
      var deadTeam = "";
      //Don't let a simulation go more than MAX_ROUNDS or declare a tie
      for (let roundNum = 1; roundNum <= MAX_ROUNDS; roundNum++) {
        simulationDetail += "<br><br>Round #" + roundNum + "<br>Active Effects: " //FIXME + Spell.activeEffectsToString(activeEffects);

        for (let combatant of waveCombatants) {
  // FIXME:         CombatantCondition.decrementDurationOnThisInitiative(combatant.initiative, WhenInTurn.startOfTurn, waveCombatants);
          combatant.takeTurn(activeEffects, waveCombatants);
          deadTeam = Simulation.teamIsDead(waveCombatants);
          if (deadTeam) break;

          //Legendary actions
// FIXME:           CombatantCondition.decrementDurationOnThisInitiative(combatant.initiative, WhenInTurn.endOfTurn, waveCombatants);
        }//end for combatants in initiative ordering
        if (deadTeam) break;
      }//end for roundNum
      summaryOutput += "";
      detailOutput += simulationDetail;
    }//end for iSimulation
    return detailOutput;
  }//end function run

// FIXME:
  static teamIsDead(combatants) {
    return null;
  }

}//end class Simulation

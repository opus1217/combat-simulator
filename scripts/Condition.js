"use strict";

/*
18-Aug-2020   Created from Condition.swift


*/

class Condition {




}

const ConditionType = {
  blinded : "blinded",
  charmed : "charmed",
  deafened : "deafened",
  fatigued : "fatigued",
  frightened : "frightened",
  grappled : "grappled",
  incapacitated : "incapacitated",
  invisible : "invisible",
  paralyzed : "paralyzed",
  petrified : "petrified",
  poisoned : "poisoned",
  prone : "prone",
  restrained : "restrained",
  stunned : "stunned",
  unconscious : "unconscious",
  exhausted : "exhausted",
  //Fit the condition structure with being added by attacks or spells, and removed with saving throws
//FIXME: Should probably create a "custom" ConditionType and then have an additional template for what it does
  muddled : "muddled",
  asleep : 'asleep',
  diseased : 'diseased',
  dimLight : "dimLight",
  concentrating : "concentrating",
  advantage : "advantage",
  disadvantage : "disadvantage",	//advantage or disadvantage on next weapon attack
  damageOverTime : "damageOverTime",
  slowed : "slowed",
  hasted : "slowed",
  noReaction : "noReaction",					//Can't take reactions until end of next turn
  enfeebled : "enfeebled",					//Deals half-damage with weapon attacks that use Str
  speed0 : 'speed0',
  blessed : "blessed",
  baned : "baned",
  wounded : 'wounded',
  burning : "burning",
  bleeding : "bleeding",
  incapacitatedTypes : new Set("incapacitated","paralyzed","petrified","stunned","unconscious","asleep")
}

class CombatantCondition {



  checkToRemoveConditionsWhereSourceLostConcentration(combatants) {
    for (let combatant of combatants) {
      combatant.conditions.forEach((element, index) => {
        combatant.conditions[index].checkSourceLostConcentration();
      });
      combatant.removeExpiredConditions()
    }
  }

  static decrementDurationOnThisInitiative(initiative, whenInTurn, combatants) {
    //FIXME
  }

  static checkToRemoveConditionsWhereSourceLostConcentration(combatants) {
    
  }
}

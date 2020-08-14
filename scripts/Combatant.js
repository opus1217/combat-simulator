"use strict";
//Created from Combatant.swift
//  8/8/2020    Copied/created
//  8/10/2020   Stubbed out

const WhenInTurn = {
    startOfTurn: "start of turn",
    endOfTurn: "end of turn"
}

const HPType = {
    min : "minimum",
    fixed : "fixed",
    random : "random",
    max : "max"
}



class Combatant {
  //PUBLIC FUNCTIONS
  constructor(fCombatant, team) {
    this.wave = 1; //FIXME combatantSerialized.wave; - will be Encounter #
    this.name = fCombatant.name;
    this.team = team;
    this.hpCalc = HPType.fixed;
    this.creature = new Creature(fCombatant.actor);

    //Dynamic variables
    this.actions = [];

    this.initiative = 0;
    this.startingHP = 0;
    this.tempHP = 0;
    this.currentHP = 0;
    this.currentSpellSlots = 0;
    this.currentLegendaryActions = 0;
    this.conditions = [];
    this.target = undefined;
    this.hasUsedReaction = false;
    this.hasUsedAction = 0;
    this.hasUsedBonusAction = false;

    this.damageTypesTaken = [];
    this.savingThrowsMade = [];
  }

  static resetAtStartOfSimulation(combatants) {
    for (let combatant of combatants) {
      combatant._resetAtStartOfSimulation();
    }

    //Reorder by initiative desc, breaking ties by dex
    combatants.sort((c1, c2) => {
      (c1.initiative > c2.initiative) ? 1 : (c1.initiative === c2.initiative) ? ((c1.dexterity > c2.dexterity) ? 1 : -1) : -1;
    })
  }

  _resetAtStartOfSimulation() {
    this.initiative = this.rollInitiative();
    this.startingHP = 50; // FIXME: this.creature.calculateStartingHP(this.hpCalc);
    this.currentHP = this.startingHP;
    this.currentSpellSlots = [4,3,3,3,3]; // FIXME: this.creature.spellSlots;
    this.conditions = [];
    this.savingThrowsMade = [];

    //2020.0423 Actions are now added earlier (when we select the combatant)
    //Mostly this is just an easy way of resetting innate counts for spells
    //and maybe other 1/day actions that we might add
// FIXME:     Action.resetActionsAtStartOfSimulation(actions: &this.actions)

    //v0.81d Also reset as if start of Turn
    this.resetAtStartOfTurn();
  }


  //embed Foundry combatants in a normal Combatant structure as .creature = foundryCombatant.actor
  static makeCombatants(foundryCombatants, teamName) {
    var combatants = [];
    foundryCombatants.forEach((fCombatant, i) => {
      let combatant = new Combatant(fCombatant, teamName);
      combatants.push(combatant);
    });
    return combatants;
  }


	resetAtStartOfTurn() {
		this.hasUsedAction = 0;
		this.hasUsedReaction = false;
		this.hasUsedBonusAction = false;
		this.target = null;
//FIXME		this.currentLegendaryActions = Feature.getLegendaryActions(this.creature.features) ?? 0
		//Can't reset damageTypesTaken until after it's been checked

		//Reset actions (for example, special abilities that recharge)
//FIXME:		Action.checkRechargeActionsAtStartOfTurn(actions: &this.actions)
	}

  takeTurn() {

  }

  rollInitiative() {
		//Should have been created by the time we get here but...
		let initiativeBonus = this.creature.getSkillBonus(SkillName.initiative) ?? this.creature.getAbilityModifier(Ability.dex);
		return rolld20() + initiativeBonus;
	}

}//end class Combatant

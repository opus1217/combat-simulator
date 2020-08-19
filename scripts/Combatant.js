"use strict";
/*
import Ability from './Creature.js';
import Spell from './Spell.js';
import Output from './Globals.js';
import Dice from './Dice.js';
import Action from './Action.js';
import {Condition, ConditionType} from './Condition.js';
*/

//Created from Combatant.swift
//  8/8/2020    Copied/created
//  8/10/2020   Stubbed out
//  8/17/2020   Added takeTurn() - stubbed out

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

  get nameAndHP() {
    return this.name + "(" + this.currentHP + ")";
  }

  static resetAtStartOfSimulation(combatants) {
    for (let combatant of combatants) {
      combatant._resetAtStartOfSimulation();
    }

    //Reorder by initiative desc, breaking ties by dex
    combatants.sort((c1, c2) => {
      return (c1.initiative > c2.initiative) ? -1 : ((c1.initiative === c2.initiative) ? ((c1.dexterity > c2.dexterity) ? -1 : 1) : 1);
    });
  }

  _resetAtStartOfSimulation() {
    this.initiative = this.rollInitiative();
    this.startingHP = this.creature.calculateStartingHP();
    this.currentHP = this.startingHP;
    this.currentSpellSlots = this.creature.spellSlots;
    this.conditions = [];
    this.savingThrowsMade = [];

    //2020.0423 Actions are now added earlier (when we select the combatant)
    //Mostly this is just an easy way of resetting innate counts for spells
    //and maybe other 1/day actions that we might add
    Action.resetActionsAtStartOfSimulation(this.actions);

    //v0.81d Also reset as if start of Turn
    this._resetAtStartOfTurn();
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


	_resetAtStartOfTurn() {
		this.hasUsedAction = 0;
		this.hasUsedReaction = false;
		this.hasUsedBonusAction = false;
		this.target = null;
		this.currentLegendaryActions = Feature.getLegendaryActions(this.creature.features) || 0;
		//Can't reset damageTypesTaken until after it's been checked

		//Reset actions (for example, special abilities that recharge)
    Action.checkRechargeActionsAtStartOfTurn(this.actions);
	}

  takeTurn(activeEffects, combatants) {
    this._resetAtStartOfTurn();

    //Show current conditions on this combatants
    Output.add("<br><br>${this.nameAndHP}");
    for (let condition in this.conditions) {
      Output.add(","+condition.toString);
    }
    Output.add(":");


		//A combat turn consists of:
		//1. TODO: Movement throughout the turn
		//2. An Action (Attacks, Cast a Spell)
		//3. A possible Bonus Action (Attack , cast a Spell)
		//In addition, you may have a Reaction taken sometime else in the Round

		//Make start-of-turn condition checks
		// - this happens even if unconscious (see https://rpg.stackexchange.com/questions/96551/do-pcs-roll-saves-for-pre-existing-effects-while-unconscious)
		this.saveVsConditions(WhenInTurn.startOfTurn, combatants, activeEffects);

		//If the Effect has expired, or if there is no ongoing AoE effect and no remaining conditions, then drop concentrating
		this.dropConcentrationIfEffectAndConditionsEnded(combatants, activeEffects);

//FIXME: Note that we don't reset damageTypesTaken in resetAtStartOfTurn because regeneration requires knowing damageTypesTaken
		//Alternatively we could perhaps move applyFeatures before saveVsConditions and then do the reset
		this._applyFeatures(combatants, activeEffects);
		this.damageTypesTaken = []	//IMPORTANT: Regeneration is a feature that requires checking damage types taken - might be possible to move reset here

		//Apply DoT to others, based on this source or to yourself - some DoTs are applied on the target's turn (e.g. burning)
		this._checkAndApplyDamageOverTime(WhenInTurn.startOfTurn, combatants, activeEffects);

		//2020.0329 Moved decrementEffectDurationTimedOnThisInitiative() to end of turn
// FIXME: This may prevent the casting of a replacement concentration spell (because you are already concentrating)

		//Effects: TODO: Don't apply any "entering" saving throws, because we have no
		//concept of movement - in any case these would happen after a move

		//Effects: BEGINNING of TURN effects: Apply effect (to this combatant)
		// (because it may apply some condition or damage that affects them)
		this.applyEffects(WhenInTurn.startOfTurn, combatants, activeEffects);

		//If you're incapacitated etc. you can't take Actions or Bonus Actions
		if (!this.isIncapacitated()) {
			this.takeActionAndBonusAction(combatants, activeEffects);
		}

		//Now some other combatants may have lost concentration or be incapacitated and therefore effects (and associated conditions) should be removed
		Spell.checkToRemoveEffectsAndConditions(combatants, activeEffects);

		//End of turn save against existing conditions
    this.saveVsConditions(WhenInTurn.endOfTurn, combatants, activeEffects);

		//Apply DoT to others, based on this source or to yourself - some DoTs are applied on the target's turn (e.g. burning)
		this._checkAndApplyDamageOverTime(WhenInTurn.endOfTurn, combatants, activeEffects);

		//Decrement the duration of all active Spells that are timed on this source
		//2020.0410: This will exclude just cast spells (wasJustCast) and then reset that flag
		this.decrementSpellDurationCastByThisSource(combatants, activeEffects);

    this.applyEffects(WhenInTurn.endOfTurn, combatants, activeEffects);
		//If the Effect has expired, or if there is no ongoing AoE effect and no remaining conditions, then drop concentrating
		this.dropConcentrationIfEffectAndConditionsEnded(combatants, activeEffects);
	}//end takeTurn()


  rollInitiative() {
		//Should have been created by the time we get here but...
    //Use the dex value if initiative is not set
		let initiativeBonus = this.creature.getSkillBonus(SkillName.initiative) || this.creature.getAbilityModifier(Ability.dex);
		return Dice.rolld20() + initiativeBonus;
	}

  _checkAndApplyDamageOverTime(whenInTurn, combatants, activeEffects) {

  }

  _applyFeatures(combatants, activeEffects) {

  }

  applyEnduringAuras(combatants, activeEffects) {

  }

  takeActionAndBonusAction(combatants, activeEffects, isLegendaryPhase = false) {

  }

  decrementSpellDurationCastByThisSource(combatants, activeEffects) {

  }

  saveVsConditions(whenInTurn, combatants, activeEffects) {

  }

  dropConcentrationIfEffectAndConditionsEnded(combatants, activeEffects) {

  }

  applyEffects(whenInTurn, combatants, activeEffects) {

  }

  //CONDITIONS
  isIncapacitated() {
    return this.hasAnyOfConditionTypes(ConditionType.incapacitatedTypes);
  }

  hasAnyOfConditionTypes(conditionTypes) {
    for (let condition of this.conditions) {
      if (conditionTypes.contains(condition.condition.type)) {return true;}
    }
    return false;
  }



}//end class Combatant

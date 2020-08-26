"use strict";

import {Output} from './Globals.js';
import {CombatantCondition} from './Condition.js';
import {ActionType, AttackType} from './Action.js';

/*
18-Aug-2020   Created from Spell.swift
24-Aug-2020   Added SpellBook; recreate each spell from the provided definitions
              (unlike swift, where we reference a common SpellReference)

*/


class Spell {
  constructor(fSpell) {
      if (!fSpell || !fSpell.data) {return;}
      let fSpellData = fSpell.data;
      this.name = fSpellData.name;
      this.priority = fSpellData.sort;
      this.innatePerDay = null;
      this.bonusDamage = null;
      this.bonusDamageType = null;

      this.level = null;
      this.description = null;
      this.scaling = null;
      this.castingTime = ActionType[fSpellData.data.activation.type];
      this.targeting = null;
      this.type = AttackType[fSpellData.data.actionType];
      this.form = new SpellForm(fSpellData.data.range.value, null);
      this.spellAttack = null;
      this.savingThrow = null;
      this.dc = null;

      this.damages = null;
      this.conditions = null;

      this.duration = null;
      this.concentration = null;

      this.prepared = true;   //Can use this to control what is simulated
  }

  //Remove effects and conditions which expired, or the caster lost concentration
  static checkToRemoveEffectsAndConditions(combatants, activeEffects) {
      Spell.checkToRemoveEffectsWhereSourceLostConcentration(activeEffects);
      CombatantCondition.checkToRemoveConditionsWhereSourceLostConcentration(combatants);
  }

  static checkToRemoveEffectsWhereSourceLostConcentration(activeEffects) {
      for (let effect in activeEffects) {
        let casterLostConcentration = effect.concentration && !(effect.source.isConcentrating() || false);
        if (casterLostConcentration) {
          effect.setExpired();
          Output.add(`<br>${effect.name} has ended (lost Concentration)`);
        }
      }
      Spell.removeExpired(activeEffects);
  }

  static removeExpired(activeEffects) {
      activeEffects = activeEffects.filter((element) => {
        return element.isExpired();
      })
  }

  static activeEffectsToString(activeEffects) {
      return activeEffects.join();
  }

  static convertSpells(fSpells) {
      if (!fSpells) {return null;}
      //Create our spell structure using Foundry definitions
// FIXME: Alternative is to read our JSON  - may still need to do that for spell scaling etc.
      var spells = [];
      fSpells.forEach((fSpell, i) => {
        let spell = new Spell(fSpell);
        if (spell) {spells.push(spell);}
      });
      return spells;
  }
}

class SpellBook {
  constructor(bonusToAttack, dc, fSpells) {
    this.bonusToAttack = bonusToAttack;
    this.dc = dc;
    this.spells = Spell.convertSpells(fSpells);
  }
}

class SpellForm {
  constructor(range, shape) {
      this.num = null;
      this.different = null;
      this.range = range;
      this.shape = shape;
      this.size = 0;
      this.width = 0;
  }

}

export {Spell, SpellBook};

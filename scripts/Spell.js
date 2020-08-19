"use strict";
/*
import Output from './Output.js';
import CombatantCondition from './Condition.js';
*/
/*
18-Aug-2020   Created from Spell.swift

*/

class Spell {


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
}

"use strict";
import {DamageType} from './Damage.js';
import {SpellBook} from './Spell.js';
//Created
//  8/10/2020   Copied/created, stubbed out
//  8/20/2020   Added CreatureClass, SpellBook

//ENUMS
const Ability = {
  str : "str",
  dex : "dex",
  con : "con",
  int : "int",
  wis : "wis",
  cha : "cha"
}

const SkillName = {
	athletics : "athletics",
	stealth : "stealth",
  acrobatics : "athletics",
  sleightOfHand : "sleight of hand",
	insight : "insight",
  arcana : "arcana",
  history : "history",
  investigation : "investigation",
  nature : "nature",
  religion : "religion",
	animalHandling : "animal handling",
  medicine : "medicine",
  perception : "perception",
  survival : "survival",
	deception : "deception",
  intimidation : "intimidation",
  performance : "performance",
  persuasion : "persuasion",
	//Pseudo-skills: Attributes with a value
	initiative : "initiative",
  passive : "passive",
  parry : "parry"
}
const SpeedType = {
	burrow : "burrow",
  climb : "climb",
  fly : "fly",
  hover : "hover",
  swim : "swim",
  walk : "walk"
}
const SizeType =  {
	G : "gigantic" ,
  H : "huge",
  L : "large",
  M : "medium",
  S : "small",
  T : "tiny"
}

/*
const CreatureType = {
	aberration, beast, celestial, construct, dragon, elemental, fey, fiend, giant, humanoid, monstrosity, ooze, plant, undead, unknown
}
const Race =  {
	dwarf, elf, gnoll, gnome, goblinoid, grimlock, human, kobold, lizardfolk, merfolk, orc, sahuagin
}
*/

class CreatureClass {
  constructor() {
    this.classType = null;
    this.subClass = "";
    this.level = null;
    this.spellBook = null;
  }
}


export class Creature {
  constructor(actor) {
    this.actor = actor;
    if (actor) {
      let creatureData = actor.data.data;
      let feats = actor.items.filter(item => {return item.type === "feat"});
      let weapons = actor.items.filter(item => {return item.type === "weapon"});
      let spells = actor.items.filter(item => {return item.type === "spell"});


      //AC and HP
      this.ac = creatureData.attributes.ac.value;
      this.hp = {
        fixed : creatureData.attributes.hp.value
      };


      //ABILITIES and SAVES
      this.abilities = {};
      this.saves = {};
      for (let key in Ability) {
          this.abilities[key] = creatureData.abilities[key].value;
          this.saves[key] = creatureData.abilities[key].save;
      }

      //VULNERABILITIES, RESISTANCES etc.
      let traits = creatureData.traits;
      if (traits) {
          let size = traits.size.toUpperCase()[0];
          this.size = SizeType[size];

          let resistances = traits.dr;
          if (resistances && resistances.length) {
              this.resistances = [];
              resistances.forEach((dr, i) => {
                this.resistances.push(DamageType[dr]);
              });
          }

          let immunities = traits.di;
          if (immunities && immunities.length) {
              this.immunities = [];
              immunities.forEach((di, i) => {
                this.immunities.push(DamageType[di]);
              });
          }

          let vulnerabilities = traits.dv;
          if (vulnerabilities && vulnerabilities.length) {
              this.vulnerabilities = [];
              vulnerabilities.forEach((dv, i) => {
                this.vulnerabilities.push(DamageType[dv]);
              });
          }

          let conditionImmunities = traits.ci;
          if (conditionImmunities && conditionImmunities.length) {
              this.conditionImmunities = [];
              conditionImmunities.forEach((ci, i) => {
                this.conditionImmunities.push(DamageType[ci]);
              });
          }
      }

      //SKILLS
      this.skills = [];
      this.skills[SkillName.initiative] = creatureData.attributes.init.mod;

      //SPELLBOOKS
      let abilityObj = creatureData.abilities[creatureData.attributes.spellcasting];
      if (abilityObj) {
          let bonusToAttack = abilityObj.mod + abilityObj.prof;
          this.spellBook = new SpellBook(bonusToAttack, creatureData.attributes.spelldc, spells);
      }

      //SPELL SLOTS
      this.spellSlots = [];
      for (let slot=1; slot<=9; slot++) {
        this.spellSlots.push(creatureData.spells["spell"+slot].value);
      }
      //Add in Pact slots if you have them
      if (creatureData.spells.pact) {
          this.spellSlots[creatureData.spells.pact.level - 1] += creatureData.spells.pact.value;
      }
    }
  }

    getSkillBonus(skill) {
      return this.skills[skill];
    }

    getAbilityModifier(ability) {
      let value = this.abilities[ability].mod;

    }

    calculateStartingHP() {
      return this.hp.fixed;
    }
}//end class Creature


/*export*/ class Feature {





  static getLegendaryActions(features) {
    //Return how many legendary Actions are available (or none)
    if (!features) {return null}
    for (let feature in features) {
      if (feature.legendaryActions) {
        return feature.legendaryActions;
      }
    }
    return null;
  }
}//end class Feature

export {Ability, Feature, SkillName};

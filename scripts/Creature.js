"use strict";
//Created
//  8/10/2020  Copied/created, stubbed out

//ENUMS
/*export*/ const Ability = {
  str : "str",
  dex : "dex",
  con : "con",
  int : "int",
  wis : "wis",
  cha : "cha"
}

/*export*/ const SkillName = {
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


/*export*/ class Creature {
  constructor(actor) {
    this.actor = actor;
    if (actor) {
      let creatureData = actor.data.data;

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

      //SKILLS
      this.skills = [];
      this.skills[SkillName.initiative] = creatureData.attributes.init.mod;

      //SPELLBOOKS


      //SPELL SLOTS
      this.spellSlots = [];
      for (let slot=1; slot<=9; slot++) {
        this.spellSlots.push(creatureData.spells["spell"+slot].value);
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

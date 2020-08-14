"use strict";
//Created
//  8/10/2020  Copied/created, stubbed out

//ENUMS
const Ability = {
  str : "strength",
  dex : "dexterity",
  con : "constitution",
  int : "intelligence",
  wis : "wisdom",
  cha : "charisma"
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


class Creature {
    constructor(actor) {
      this.actor = actor;
      this.skills = [];
      this.skills[SkillName.initiative] = actor.data.data.attributes.init.mod;
    }

    getSkillBonus(skill) {
      return this.skills[skill];
    }

    getAbilityModifier(ability) {
      return this.actor.data.data.abilities[ability].mod;
    }

}//end class Creature

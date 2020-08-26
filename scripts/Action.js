"use strict";

/*
18-Aug-2020   Created from Action.swift

*/

class Recharge {

  static checkOrRollRecharge(actionRecharge) {
    if (!actionRecharge) {
      actionRecharge.isRecharged = true;
    }
  }
}

export const ActionType = {
    action : "action",
    bonusAction : "bonus action",
    reaction : "reaction"
}

export const AttackType = {
    melee : "melee",
    ranged : "ranged",
    AoE : "AoE",
    specific : "specific"
}

export class Action {
  constructor() {
    this.recharge = new Recharge();
  }


  static resetActionsAtStartOfSimulation(actions) {

  }

  static checkRechargeActionsAtStartOfTurn(actions) {
    actions.forEach((action) => {
      //check recharge (done at the start of each turn)
      Recharge.checkOrRollRecharge(action.recharge);
    });
  }

}

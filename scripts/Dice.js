"use strict";

// 8/10/2020: Copied/recreated


class Dice {
  constructor() {
    this.nothing = 0;
  }

  static rolld20() {
    let r = new Roll("1d20");
    r.roll();
    return r.total;
  }

}

export {Dice};

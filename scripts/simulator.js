class CombatSimulator {
  static init() {
    game.settings.register("combat-simulator", "combatSimulatorVersion", {
      name: "CombatSimulatorFor5e ver 0.1.0",
      hint: "",
      scope: "world",
      config: false,
      default: "0.1.0",
      type: String
    });
    game.settings.register("combat-simulator", "numberOfSimulations", {
      name: "Number of simulations",
      hint: "How many encounter simulations to run (default is 100); for each simulation combat continues until either the Party or the Opponents are all unconscious",
      scope: "world",
      config: true,
      default: 100,
      type: Number
    });
      game.settings.register("combat-simulator", "showCombatDetail", {
      name: "Show combat detail",
      hint: "In detail mode, shows every attack, spell, saving throw, etc. for each actor. Not suggested for more than 10 simulations.",
      scope: "world",
      config: true,
      default: false,
      type: Boolean
    });
  }

  static getSceneControlButtons(buttons) {
      let tokenButton = buttons.find(b => b.name == "token")

      if (tokenButton && game.user.isGM) {
          tokenButton.tools.push({
              name: "simulate",
              title: "Simulate current encounter",
              icon: "fas fa-bolt",
              toggle: false,
              active: true,
              visible: game.user.isGM,
              onClick: (value) => CombatSimulator.openForm()
          });
      }
  }
  static setup() {

  }

  static getActorsInEncounter() {

  }

  static openForm() {
      if (this.form === undefined) {
          this.form = new CombatSimulatorApplication(game.combat);
      }
      this.form.render(true);
  }


}

Hooks.on("init", CombatSimulator.init);
Hooks.on('getSceneControlButtons', CombatSimulator.getSceneControlButtons)
Hooks.on('setup', CombatSimulator.setup)

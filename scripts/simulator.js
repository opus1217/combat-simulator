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
    game.settings.register("combat-simulator", "combatTrackerSimulate", {
      name: game.i18n.localize("CS5e.SETTING.Simulate.Name"),
      hint: game.i18n.localize("CS5e.SETTING.Simulate.Hint"),
      scope: "world",
      config: true,
      default: false,
      type: Boolean
    });
    game.settings.register("combat-simulator", "numberOfSimulations", {
      name: game.i18n.localize("CS5e.SETTING.NumberOfSimulations.Name"),
      hint: game.i18n.localize("CS5e.SETTING.NumberOfSimulations.Hint"),
      scope: "world",
      config: true,
      default: 100,
      type: Number
    });
    game.settings.register("combat-simulator", "showCombatDetail", {
      name: game.i18n.localize("CS5e.SETTING.ShowCombatDetail.Name"),
      hint: game.i18n.localize("CS5e.SETTING.ShowCombatDetail.Hint"),
      scope: "world",
      config: true,
      choices: {
        "Summary": game.i18n.localize("CS5e.SETTING.ShowCombatDetail.Summary"),
        "Detail": game.i18n.localize("CS5e.SETTING.ShowCombatDetail.Detail")
      },
      default: "Summary",
      type: String
    });
  }

  static getSceneControlButtons(buttons) {
      let tokenButton = buttons.find(b => b.name == "token")

      if (tokenButton && game.user.isGM) {
          tokenButton.tools.push({
              name: "simulate",
              title: game.i18n.localize("CS5e.BUTTON.Title"),
              icon: "fas fa-bolt",
              toggle: false,
              active: true,
              visible: game.user.isGM,
              onClick: () => CombatSimulator.openForm()
          });
      }
  }
  static setup() {

  }

  static getActorsInEncounter() {

  }

  static openForm() {
      if (this.form === undefined) {
          this.form = new CombatSimulatorApplication();
      }
      this.form.setActiveCombat(game.combat)
      this.form.render(true);
  }
}

function simulateCombat() {
      CombatSimulator.openForm();
}

Hooks.on("init", CombatSimulator.init);
Hooks.on('getSceneControlButtons', CombatSimulator.getSceneControlButtons);
Hooks.on('setup', CombatSimulator.setup);

/**
 * Override the startCombat method ("Begin Combat") from combat tracker.
 * TODO: Would like to override the button title or add another button but don't know how to do that
 */
Hooks.on('renderCombatTracker', ({combat}) => {
  if (!combat || !game.user.isGM) return;

  if (!combat.originalStartCombat) {
    combat.originalStartCombat = combat.startCombat;
  }

  let shouldSimulateCombat = game.settings.get("combat-simulator","combatTrackerSimulate");

  if (shouldSimulateCombat) {
    combat.startCombat = simulateCombat;
  } else {
    // Reset the methods.
    if (combat.originalStartCombat) {
      combat.startCombat = combat.originalStartCombat;
    }

  }
});

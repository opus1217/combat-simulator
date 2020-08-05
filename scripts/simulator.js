const MODULE_NAME = "combat-simulator"
//Global variable for combatTrackerSimulate

class CombatSimulator {
  static init() {
    game.settings.register(MODULE_NAME, "combatSimulatorVersion", {
      name: "CombatSimulatorFor5e ver 0.1.0",
      hint: "",
      scope: "world",
      config: false,
      default: "0.1.0",
      type: String
    });
    game.settings.register(MODULE_NAME, "combatTrackerSimulate", {
      name: game.i18n.localize("CS5e.SETTING.Simulate.Name"),
      hint: game.i18n.localize("CS5e.SETTING.Simulate.Hint"),
      scope: "client",
      config: true,
      default: false,
      // onChange: value => {replaceBeginCombat(game.combat)},
      type: Boolean
    });
    game.settings.register(MODULE_NAME, "numberOfSimulations", {
      name: game.i18n.localize("CS5e.SETTING.NumberOfSimulations.Name"),
      hint: game.i18n.localize("CS5e.SETTING.NumberOfSimulations.Hint"),
      scope: "world",
      config: true,
      default: 100,
      type: Number,
      range: {             // If range is specified, the resulting setting will be a range slider
        min: 1,
        max: 1000,
        step: 100
      }
    });
    game.settings.register(MODULE_NAME, "showCombatDetail", {
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

    // FIXME: Need to find a hook for replacing the Begin Combat button even if it has already been rendered
    //(maybe not a problem for a fresh install?)
  }

  static getActorsInEncounter() {

  }

  static simulateCombat() {
    let shouldSimulateCombat = game.settings.get("combat-simulator","combatTrackerSimulate");

    openForm();
  }

}

async function openForm() {
    if (this.CSAForm === undefined) {
        this.CSAForm = new CombatSimulatorApplication();
    }
    this.CSAForm.setActiveCombat(game.combat)
    this.CSAForm.render(true);
}

/* Substitute for the Begin Combat button if user is GM
  - then check each time whether to do standard Begin Combat or simulateCombat
  (have to do it this way because you could change the setting from the config)
  - if there were a hook on Begin Combat itself that would be simpler because this solution leaves us intercepting the Begin Combat button
  - doesn't solve the problem if you don't have a combat set up at all
*/
function replaceBeginCombat(combat, html) {
    if (!combat || !game.user.isGM) return;
    let shouldSimulateCombat = game.settings.get("combat-simulator","combatTrackerSimulate");
    let beginCombatButtonTitle = game.i18n.localize("COMBAT.Begin");
    let simulateCombatButtonTitle = game.i18n.localize("CS5e.Simulate");
    //Replace the button and also the call in the Combat tracker
    if (shouldSimulateCombat) {
      if (!combat.originalStartCombat) {
        combat.originalStartCombat =  combat.rollNPC;  //combat.startCombat;
      }
      combat.rollNPC = openForm.bind(combat);
      //combat.startCombat = openForm.bind(combat);
      if (html) {
        html.find("a[title='" + beginCombatButtonTitle + "']").attr("title",simulateCombatButtonTitle).text(simulateCombatButtonTitle);
      }
    } else {
      if (combat.originalStartCombat) {
        combat.startCombat = combat.originalStartCombat;
      }
      if (html) {
        html.find("a[title='" + simulateCombatButtonTitle + "']").attr("title",beginCombatButtonTitle).text(beginCombatButtonTitle);
      }
    }
}

Hooks.on("init", CombatSimulator.init);
Hooks.on('setup', CombatSimulator.setup);

/**
 * Override the startCombat method ("Begin Combat") from combat tracker.
 * TODO: Would like to override the button title or add another button but don't know how to do that
 */
Hooks.on('renderCombatTracker', ({combat}, html) => {
  if (!combat || !game.user.isGM) return;
  let shouldSimulateCombat = game.settings.get("combat-simulator","combatTrackerSimulate");
  let beginCombatButtonTitle = game.i18n.localize("COMBAT.Begin");
  let simulateCombatButtonTitle = game.i18n.localize("CS5e.Simulate");
  //Replace the button and also the call in the Combat tracker
  if (shouldSimulateCombat) {
    if (!combat.originalStartCombat) {
      combat.originalStartCombat =  combat.startCombat;
    }
    combat.startCombat = openForm.bind(combat);
    if (html) {
      html.find("a[title='" + beginCombatButtonTitle + "']").attr("title",simulateCombatButtonTitle).text(simulateCombatButtonTitle);
    }
  } else {
    if (combat.originalStartCombat) {
      combat.startCombat = combat.originalStartCombat;
    }
    if (html) {
      html.find("a[title='" + simulateCombatButtonTitle + "']").attr("title",beginCombatButtonTitle).text(beginCombatButtonTitle);
    }
  }
});

/**
 * Add the "Simulate Combat" as an option in the Combat Tracker settings
 * h/t to group-initiative module for this approach
 */
 /**
  * Add the setting option in the combat tracker config.
  */
 Hooks.on('renderCombatTrackerConfig', async (ctc, html) => {
   const data = {
     combatTrackerSimulate: game.settings.get(MODULE_NAME,"combatTrackerSimulate")
   };

   const simulateCombatCheckbox = await renderTemplate(
     'modules/combat-simulator/templates/combat-config.html',
     data
   );
   //JQuery: Set the height to auto to accomodate the new option and then add the simulateCombatCheckbox before the Submit button
   html.css({height: 'auto'}).find('button[name=submit]').before(simulateCombatCheckbox);
 });

 /**
  * Save the setting when closing the combat tracker config.
  */
 Hooks.on('closeCombatTrackerConfig', async ({form}) => {
   let combatTrackerSimulate = form.querySelector('#combatTrackerSimulate').checked;
   // Save the setting when closing the combat tracker setting.
   await game.settings.set(MODULE_NAME, "combatTrackerSimulate", combatTrackerSimulate);
 });

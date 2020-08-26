import {Simulation} from './Simulation.js';
import {MODULE_NAME} from './simulator.js';
import {Spell} from './Spell.js';
import {printError} from './Globals.js';

const FRIENDLY = 1;
const HOSTILE = -1;

export class CombatSimulatorApplication extends Application {
    constructor(Combat, options = {}) {
        super(options);
        if (!game.user.isGM) return;

        this.currentCombat = null;
        this.allyRating = {
            "Easy": 0,
            "Medium": 0,
            "Hard": 0,
            "Deadly": 0
        };
        this.totalXP = 0;
        this.perAllyXP = 0;
        this.dailyXP = 0;
        this.combatDifficulty = "Trivial";

        this.simulationResults = "";
        game.users.apps.push(this)

    }

    //Options that determine how Foundry lays out the popout window
    static get defaultOptions() {
//FIXME: Not clear that .classes or .id is being used (array of css classes to apply)
        const options = super.defaultOptions;
        options.title = game.i18n.localize("CS5e.Title");
        options.id = game.i18n.localize("CS5e.id"); //id=combat-simulator
        options.template = "modules/combat-simulator/templates/simulator-app.html";
        options.classes = ["simulator-form", "simulator"];
        options.closeOnSubmit = false;
        options.popOut = true;
        options.width = 510;
        options.height = "auto";
        options.resizable = true;
        return options;
    }


    /** @inheritdoc */
    //Add Buttons on the right side of the window  header - add an ability to change config from here
    _getHeaderButtons() {
      let buttons = super._getHeaderButtons();

      // Settings
      const canConfigure = game.user.isGM;
      if (canConfigure) {
        buttons = [
          {
            label: "Settings",
            class: "configure-sheet",
            icon: "fas fa-cog",
            onclick: ev =>  {
              ev.preventDefault();
              new CombatSimulatorSettings().render(true);
            }
          }
        ].concat(buttons);
      }
      return buttons
    }

    //Called prior to rendering
    //Split combatants for the viewed Combat into friendly and hostile based on Token Disposition
    setActiveCombat(activeCombat) {
        this.currentCombat = activeCombat;

        if (this.currentCombat) {
            console.log(this.currentCombat);
            this.combatants = this.currentCombat.data.combatants;
      // FIXME: Recover if there are tokens with not actor or disposition info (not sure how it happens but it has)

            this.friendlies = this.combatants.filter(combatant => (combatant.token.disposition === FRIENDLY));
            this.hostiles = this.combatants.filter(combatant => (combatant.token.disposition === HOSTILE));

            //Must have at least one Hostile and one Friendly for a fight!
            if (!this.friendlies.length || !this.hostiles.length) {
              ui.notifications.warn(game.i18n.localize("CS5e.ERROR.NeedBothSides"));
              return;
            }

            console.log(game.i18n.localize("CS5e.TOKEN.Friendly"));
            this.friendlies.forEach((pc, i) => {
                console.log(pc.name);
            });
            console.log(game.i18n.localize("CS5e.TOKEN.Hostile"));
            this.hostiles.forEach((npc, i) => {
                console.log(npc.name);
            });

            this.calcXPThresholds();
            this.calcRating();

        } else {
            ui.notifications.warn(game.i18n.localize("CS5e.ERROR.CreateEncounterFirst"));
        }
    }



    simulate(numberOfSimulations, showCombatDetail) {
        var simulation = new Simulation(numberOfSimulations, showCombatDetail, this.friendlies, this.hostiles, "Friendlies", "Hostiles");
        var summaryOutput = "";
        var detailOutput = "";
        this.simulationResults = simulation.run(summaryOutput, detailOutput);
    }


    async getData() {
      let showCombatDetail = game.settings.get("combat-simulator","showCombatDetail");
      let numberOfSimulations = game.settings.get("combat-simulator","numberOfSimulations");
      console.log(this.simulationResults);
      return {
          friendly: this.friendlies,
          hostile: this.hostiles,
          ratings: this.allyRating,
          allyxp: this.perAllyXP,
          totalxp: this.totalXP,
          dailyxp: this.dailyXP,
          difficultyFromDMG: this.combatDifficulty,
          difficultyFromSimulation: this.combatDifficulty,
          simulationSummary: this.simulationResults.summaryOutput,
          simulationDetail: this.simulationResults.detailOutput
      };
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        //When you click Details, show/hide the Simulation details
        let divDetails = html.find('#showDetails');
        if (divDetails) {
          divDetails.click(event => this._onToggleDetails(event));
        }
    }

    //Toggle visibility of details (for now all or nothing, but we'd like to show a summary of each simulation)
    _onToggleDetails(event) {
      event.preventDefault();
      let details = $(event.currentTarget).find('#details');
      if (details) {
        details.toggleClass("results-hidden");
      }
    }


    /**
     * Calculates XP thresholds for the PC characters, as well as the thresholds for monster/NPC combatants.
     *  From EncounterBuilderApplication, modified to use Friendlies and Hostiles (based on Token Disposition)
     * @memberof EncounterBuilderApplication
     */
  //FIXME: Remove dependency on EB or make it explicit
    calcXPThresholds() {
        let allyRating = {
            "Easy": 0,
            "Medium": 0,
            "Hard": 0,
            "Deadly": 0
        };
        let totalXP = 0;
        let dailyXP = 0;

        this.friendlies.forEach(function (combatant, index) {
            let ally = combatant.actor;
            let level;
            if (ally.data.type === "character") {
                level = parseInt(ally.data.data.details.level);
                if (level === 0) {
                    level = 1;
                }
            }
            else if (ally.data.type === "npc") {
                let xp = EB.CRtoXP[ally.data.data.details.cr];
                level = EB.xpThresholds.deadly.findIndex(e => e >= xp)
                if (level < 0) {
                    level = 19;
                }
                level += 1
            }
            allyRating["Easy"] += EB.xpThresholds.easy[level - 1];
            allyRating["Medium"] += EB.xpThresholds.medium[level - 1];
            allyRating["Hard"] += EB.xpThresholds.hard[level - 1];
            allyRating["Deadly"] += EB.xpThresholds.deadly[level - 1];
            dailyXP += EB.dailyXPBudget[level - 1];
        });
        this.hostiles.forEach(function (combatant, index) {
            let opponent = combatant.actor;
            let xp;
            if (opponent.data.type === "character") {
                let level = opponent.data.data.details.level
                if (level === 0) {
                    level = 1;
                }
                xp = EB.xpThresholds[EB.difficultyToTreatPC][level - 1]
            }
            else if (opponent.data.type === "npc") {
                xp = opponent.data.data.details.xp.value;
            }
            totalXP += xp;
        });

        let multiplier = 0;
        const numOpponents = this.hostiles.length;
        const numAllies = this.friendlies.length
        if (numAllies < 3) {
            if (numOpponents > 15) {
                multiplier = 5.0;
            }
            else if (numOpponents > 0) {
                multiplier = EB.encounterMultipliers[numOpponents + 1];
            }
        }
        else if (numAllies > 5) {
            if (numOpponents > 15) {
                multiplier = 4.0;
            }
            else if (numOpponents > 0) {
                multiplier = EB.encounterMultipliers[numOpponents - 1];
            }
        }
        else {
            if (numOpponents > 15) {
                multiplier = 4.0;
            }
            else if (numOpponents > 0) {
                multiplier = EB.encounterMultipliers[numOpponents];
            }
        }

        this.allyRating = allyRating;
        this.totalXP = multiplier * totalXP;
        this.dailyXP = dailyXP;

        let perAllyXP = Math.floor(this.totalXP / numAllies)

        if (isFinite(perAllyXP)) {
            this.perAllyXP = perAllyXP;
        }
        else {
            this.perAllyXP = 0;
        }
    }

    /**
     * Calculates the final difficulty rating of the combat (easy, medium, hard, deadly)
     *
     * @memberof EncounterBuilderApplication
     */
    calcRating() {
        let allyRating = this.allyRating;
        let totalXP = this.totalXP;
        let combatDifficulty = "Trivial";

        Object.keys(allyRating).forEach(function (key) {
            let threshold = allyRating[key]
            if (totalXP > threshold) {
                combatDifficulty = key;
            }
        });

        this.combatDifficulty = combatDifficulty;
    }

    /**
     * Ondrop template for ally and opponent fields. Attempts to return builder Application and Actor of interest.
     *
     * @param {*} event
     * @returns {Array}
     * @memberof EncounterBuilderApplication
     */
    async _onDropGeneral(event) {
        let data;
        data = JSON.parse(event.dataTransfer.getData("text/plain"));
        if (data.type !== game.actors.entity) {
            throw new Error(game.i18n.localize("EB.EntityError"));
        }

        const app = game.users.apps.find(e => e.id === game.i18n.localize("EB.id"));
        let actor;
        if (data.pack) {
            actor = await game.actors.importFromCollection(data.pack, data.id)
        }
        else {
            actor = game.actors.get(data.id)
        }
        return [app, actor]
    }

    /**
     * Ondrop for allies. Cannot have a playable character multiple times. Can have monsters/npcs multiple times.
     *
     * @param {*} event
     * @memberof EncounterBuilderApplication
     */
    async _onDropAlly(event) {
        event.preventDefault();

        let [app, actor] = await this._onDropGeneral(event);

        let actorExists;
        let actorExistsOpposing;
        if (actor.data.type === "character") {
            actorExists = app.allies.find(e => e.id === actor.id)
            actorExistsOpposing = app.opponents.find(e => e.id === actor.id);

            if (actorExistsOpposing) {
                let ix = this.opponents.findIndex(e => e.id === actor.id);
                this.opponents.splice(ix, 1);
            }
            if (!actorExists) {
                app.allies.push(actor)
            }
        }
        else if (actor.data.type === "npc") {
            app.allies.push(actor);
        }

        app.calcXPThresholds();
        app.calcRating();
        app.render();
    }

    /**
     * Ondrop for opponents. Cannot have a playable character multiple times. Can have monsters/npcs multiple times.
     *
     * @param {*} event
     * @memberof EncounterBuilderApplication
     */
    async _onDropOpponent(event) {
        event.preventDefault();

        let [app, actor] = await this._onDropGeneral(event)

        let actorExists;
        let actorExistsOpposing;
        if (actor.data.type === "character") {
            actorExists = app.opponents.find(e => e.id === actor.id);
            actorExistsOpposing = app.allies.find(e => e.id === actor.id);

            if (actorExistsOpposing) {
                let ix = this.allies.findIndex(e => e.id === actor.id);
                this.allies.splice(ix, 1);
            }
            if (!actorExists) {
                app.opponents.push(actor)
            }

        }
        else if (actor.data.type === "npc") {
            app.opponents.push(actor);
        }

        app.calcXPThresholds();
        app.calcRating();
        app.render();
    }

    _onDragOverHighlight(event) {
        const li = this;
        li.style["border"] = EB.borderStyle;
        li.style["background"] = EB.highlightStyle;
    }

    _onDragLeaveHighlight(event) {
        const li = this;
        li.style["border"] = "";
        li.style["background"] = "";
    }

    /**
     * Ondragstart for character portraits, sets data necessary to drag to canvas.
     *
     * @param {*} event
     * @memberof EncounterBuilderApplication
     */
    _onDragStart(event) {
        event.stopPropagation();
        const id = this.firstElementChild.id
        const name = this.firstElementChild.title

        event.dataTransfer.setData("text/plain", JSON.stringify({
            type: game.actors.entity,
            id: id,
            name: name
        }));
    }

    /**
     * Remove actor from calculation on clicking the portrait.
     *
     * @param {*} event
     * @memberof EncounterBuilderApplication
     */
    _onClickPortrait(event) {
        event.stopPropagation();

        const srcClass = event.srcElement.classList.value;
        const isPortrait = srcClass === "actor-portrait";
        const isHoverIcon = (srcClass === "actor-subtract") || (srcClass === "fas fa-minus");
        if ((isPortrait) || (isHoverIcon)) {
            const app = game.users.apps.find(e => e.id === game.i18n.localize("EB.id"));
            let name = event.srcElement.title;
            let actorExists;

            const parentClass = event.srcElement.parentElement.parentElement.classList.value;
            const parentParentClass = event.srcElement.parentElement.parentElement.parentElement.classList.value;
            if ((parentClass === "group-field ally-field") || (parentParentClass === "group-field ally-field")) {
                let actorExists = this.allies.find(e => e.name === name);
                if (actorExists) {
                    let ix = this.allies.findIndex(e => e.name === name);
                    this.allies.splice(ix, 1);
                }
            }
            else if ((parentClass === "group-field opponent-field") || (parentParentClass === "group-field opponent-field")) {
                let actorExists = this.opponents.find(e => e.name === name);
                if (actorExists) {
                    let ix = this.opponents.findIndex(e => e.name === name);
                    this.opponents.splice(ix, 1);
                }
            }
            app.calcXPThresholds();
            app.calcRating();
            app.render();
        }
    }

    /**
     * Clears list of allies and opponents.
     *
     * @param {*} event
     * @memberof EncounterBuilderApplication
     */
    _onClickButton(event) {
        event.stopPropagation();
        const app = game.users.apps.find(e => e.id === game.i18n.localize("CS5e.id"));
        app.allies = [];
        app.opponents = [];

        app.calcXPThresholds();
        app.calcRating();
        app.render();
    }

}

export class CombatSimulatorSettings extends FormApplication {
  /** @override */
	static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      title: game.i18n.localize("CS5e.Title"),
      id: "combat-simulator-settings",
      template: "modules/combat-simulator/templates/CS5e-settings.html",
      width: 600,
      height: "auto",
      submitOnChange: false,
      submitOnClose: true
    })
  }

  getData(options) {
    const gs = game.settings;
    const data = {
      combatTrackerSimulate: gs.get(MODULE_NAME,"combatTrackerSimulate"),
      numberOfSimulations: gs.get(MODULE_NAME,"numberOfSimulations"),
      showCombatDetail: gs.get(MODULE_NAME,"showCombatDetail")
    };

    return data;
  }

  async _updateObject(event, formData) {
    for ( let [k, v] of Object.entries(formData) ) {
      //let s = game.settings.settings.get(k);
      let current = game.settings.get(MODULE_NAME, k);
      if ( v !== current ) {
        await game.settings.set(MODULE_NAME, k, v);
      }
    }
    //If you changed the Begin Combat -> Simulate setting, it should reflect in the Combat Tracker immediately
    //so we re-render the Combat tracker
    let combatTracker = ui.combat;
    if (combatTracker) combatTracker.render();
  }
}

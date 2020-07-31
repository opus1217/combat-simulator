const FRIENDLY = 1;
const HOSTILE = -1

class CombatSimulatorApplication extends Application {
    constructor(Combat, options = {}) {
        super(options);
        if (!game.user.isGM) return;

        this.currentCombat = null;
        this.allyRating = {
            "easy": 0,
            "medium": 0,
            "hard": 0,
            "deadly": 0
        };
        this.totalXP = 0;
        this.perAllyXP = 0;
        this.dailyXP = 0;
        this.combatDifficulty = "trivial";

        game.users.apps.push(this)

    }

    setActiveCombat(activeCombat) {
      this.currentCombat = activeCombat;

      if (this.currentCombat) {
        console.log(this.currentCombat);
        this.combatants = this.currentCombat.data.combatants;

        this.friendly = this.combatants.filter(combatant => (combatant.token.disposition === FRIENDLY));
        this.hostile = this.combatants.filter(combatant => (combatant.token.disposition === HOSTILE));

        //Must have at least one Hostile and one Friendly for a fight!
        if (!this.friendly.length || !this.hostile.length) {
          ui.notifications.warn(game.i18n.localize("CS5e.ERROR.NeedBothSides"));
          return;
        }

        console.log(game.i18n.localize("CS5e.TOKEN.Friendly"));
        this.friendly.forEach((pc, i) => {
            console.log(pc.name);
        });
        console.log(game.i18n.localize("CS5e.TOKEN.Hostile"));
        this.hostile.forEach((npc, i) => {
            console.log(npc.name);
        });
      } else {
        ui.notifications.warn(game.i18n.localize("CS5e.ERROR.CreateEncounterFirst"));
      }

    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.title = game.i18n.localize("CS5e.Title");
        options.id = game.i18n.localize("CS5e.id");
        options.template = "modules/combat-simulator/templates/simulator-app.html";
        options.closeOnSubmit = true;
        options.popOut = true;
        options.width = 510;
        options.height = "auto";
        options.classes = ["simulator-form", "simulator"];
        return options;
    }


    async getData() {
      let showCombatDetail = game.settings.get("combat-simulator","showCombatDetail");
      let numberOfSimulations = game.settings.get("combat-simulator","numberOfSimulations");
      return {
          friendly: this.friendly,
          hostile: this.hostile,
          ratings: this.allyRating,
          allyxp: this.perAllyXP,
          totalxp: this.totalXP,
          dailyxp: this.dailyXP,
          difficulty: this.combatDifficulty,
          showCombatDetail: showCombatDetail,
          numberOfSimulations: numberOfSimulations
      };
    }

    activateListeners(html) {
        super.activateListeners(html);

    }

    /**
     * Calculates XP thresholds for the PC characters, as well as the thresholds for monster/NPC combatants.
     *
     * @memberof EncounterBuilderApplication
     */
    calcXPThresholds() {
        let allyRating = {
            "easy": 0,
            "medium": 0,
            "hard": 0,
            "deadly": 0
        };
        let totalXP = 0;
        let dailyXP = 0;

        this.allies.forEach(function (ally, index) {

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
            allyRating["easy"] += EB.xpThresholds.easy[level - 1];
            allyRating["medium"] += EB.xpThresholds.medium[level - 1];
            allyRating["hard"] += EB.xpThresholds.hard[level - 1];
            allyRating["deadly"] += EB.xpThresholds.deadly[level - 1];
            dailyXP += EB.dailyXPBudget[level - 1];
        });
        this.opponents.forEach(function (opponent, index) {
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
        const numOpponents = this.opponents.length;
        const numAllies = this.allies.length
        if (numAllies < 3) {
            if (numOpponents > 15) {
                multiplier = 5.0;
            }
            else if (numOpponents > 0) {
                multiplier = EB.encounterMultipliers[this.opponents.length + 1];
            }
        }
        else if (numAllies > 5) {
            if (numOpponents > 15) {
                multiplier = 4.0;
            }
            else if (numOpponents > 0) {
                multiplier = EB.encounterMultipliers[this.opponents.length - 1];
            }
        }
        else {
            if (numOpponents > 15) {
                multiplier = 4.0;
            }
            else if (numOpponents > 0) {
                multiplier = EB.encounterMultipliers[this.opponents.length];
            }
        }

        this.allyRating = allyRating;
        this.totalXP = multiplier * totalXP;
        this.dailyXP = dailyXP;

        let perAllyXP = Math.floor(this.totalXP / this.allies.length)

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
        let combatDifficulty = "trivial";

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

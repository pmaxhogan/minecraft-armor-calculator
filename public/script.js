const { MDCSelect } = mdc.select;
const { MDCChipSet } = mdc.chips;
const { MDCFormField } = mdc.formField;
const { MDCSwitch } = mdc.switchControl;
const { MDCTextField } = mdc.textField;
const { MDCTopAppBar } = mdc.topAppBar;

const zombieDamageTable = {
  peaceful: 0,
  easy: 2.5,
  normal: 3,
  hard: 4.5
};

const creeperDamageTable = {
  peaceful: 0,
  easy: 16,
  normal: 31,
  hard: 46
};

const protOptionsTable = [
  {
    id: "prot",
    name: "Protection"
  },
  {
    id: "fireProt",
    name: "Fire"
  },
  {
    id: "blastProt",
    name: "Blast"
  },
  {
    id: "projectileProt",
    name: "Projectile"
  },
  {
    id: "featherFalling",
    name: "falling"
  }
];

const armorPointsTable = {
  iron: {
    helmet: 2,
    chestplate: 6,
    leggings: 5,
    boots: 2
  },
  diamond: {
    helmet: 3,
    chestplate: 8,
    leggings: 6,
    boots: 3
  },
  netherite: {
    helmet: 3,
    chestplate: 8,
    leggings: 6,
    boots: 3
  }
};

const armorToughnessTable = {
  iron: {
    helmet: 0,
    chestplate: 0,
    leggings: 0,
    boots: 0
  },
  diamond: {
    helmet: 2,
    chestplate: 2,
    leggings: 2,
    boots: 2
  },
  netherite: {
    helmet: 3,
    chestplate: 3,
    leggings: 3,
    boots: 3
  }
};

const difficultyOptions = [
  { name: "peaceful", id: "peaceful", default: false },
  { name: "easy", id: "easy", default: false },
  { name: "normal", id: "normal", default: true },
  { name: "hard", id: "hard", default: false }
];

const damageCalcOptions = [
  {
    id: "normal",
    name: "normal / melee",
    default: true
  },
  {
    id: "fireProt",
    name: "fire attack"
  },
  {
    id: "blastProt",
    name: "explosion attack"
  },
  {
    id: "projectileProt",
    name: "projectile attack"
  }
];

const app = Vue.createApp({
  data() {
    return {
      javaEdition: true,
      featherFallingEnabled: false,
      damageCalcSelectedType: "normal",
      damageCalcSelectedAmount: 1,
      fallDamageCalcSelectedAmount: 1,
      difficultyOptions,
      protOptionsTable: protOptionsTable.filter((item) => item.id !== "none"),
      rawDamage: false,
      difficulty: null,
      damageCalcOptions,
      armor: {
        helmet: {
          material: "none",
          prot: "none"
        },
        chestplate: {
          material: "none",
          prot: "none"
        },
        leggings: {
          material: "none",
          prot: "none"
        },
        boots: {
          material: "none",
          prot: "none"
        }
      }
    };
  },
  methods: {
    scrollToTop() {
      scrollTo(0, 0);
    },

    updateRawDamage(rawDamage) {
      this.rawDamage = rawDamage;
    },

    updateProt(type, prot) {
      this.armor[type].prot = prot;
    },
    updateMaterial(type, material) {
      this.armor[type].material = material;
    },
    updateDifficulty(newDifficulty) {
      this.difficulty = newDifficulty;
    },

    calcDamageReducedFactorForAttack(attackDamage) {
      const defensePoints = this.armorPoints;
      const toughness = this.toughness;

      return (
        Math.min(
          20,
          Math.max(
            defensePoints / 5,
            defensePoints - (4 * attackDamage) / (toughness + 8)
          )
        ) / 25
      );
    },
    calcDamageForAttack(attackDamage, damageType) {
      const armorHelp =
        damageType === "featherFalling"
          ? 0
          : this.calcDamageReducedFactorForAttack(attackDamage);

      return (
        attackDamage *
        (1 - armorHelp) *
        (1 - this.enchantsDamageReductionFactor[damageType])
      );
    },

    calcFallDamage(height) {
      if (height <= 3) return 0;
      // if(height > 19) height = height - 1;
      const baseDamage = Math.ceil(height * (19 / 20)) - 3;
      return this.calcDamageForAttack(baseDamage, "featherFalling");
    },

    calcHeightThatGivesDamage(damage) {
      let height = 0;
      while (this.calcFallDamage(height) + 0.9 < damage) {
        height++;
      }
      return height;
    },

    updateFeatherFallingEnabled(featherFallingEnabled) {
      this.featherFallingEnabled = featherFallingEnabled;
    }
  },
  computed: {
    anyEnchantsOverLimit() {
      return Object.entries(this.enchantsProtectionPoints).some(
        ([type, points]) => points > 20
      );
    },
    anyEnchantsMuchOverLimit() {
      return Object.entries(this.enchantsProtectionPoints).some(
        ([type, points]) => points >= 20 + 6 && type !== "featherFalling"
      );
    },

    damageDealtByPerfectSwordCrit() {
      return this.calcDamageForAttack(15, "normal");
    },
    damageDealtByPerfectSword() {
      return this.calcDamageForAttack(11, "normal");
    },

    damageDealtByCreeper() {
      return this.calcDamageForAttack(
        creeperDamageTable[this.difficulty],
        "blastProt"
      );
    },

    damageDealtByZombie() {
      return this.calcDamageForAttack(
        zombieDamageTable[this.difficulty],
        "normal"
      );
    },

    armorPoints() {
      return Object.entries(this.armor)
        .filter(
          ([_, armor]) =>
            armor.material !== "none" && armor.material !== "elytra"
        )
        .reduce(
          (acc, [type, armor]) => acc + armorPointsTable[armor.material][type],
          0
        );
    },

    toughness() {
      return Object.entries(this.armor)
        .filter(
          ([_, armor]) =>
            armor.material !== "none" && armor.material !== "elytra"
        )
        .reduce(
          (acc, [type, armor]) =>
            acc + armorToughnessTable[armor.material][type],
          0
        );
    },

    secondsToDieInLava() {
      return 20 / this.calcDamageForAttack(4, "fireProt") / 2;
    },

    epfLimit() {
      return this.javaEdition ? 20 : 16;
    },

    enchantsProtectionPoints() {
      const calcEpfForType = (protType) =>
        Object.entries(this.armor).reduce((acc, [_, armor]) => {
          if (armor.prot === "prot") return acc + 4;
          else if (armor.prot === protType) return acc + 8;
          else return acc;
        }, 0);

      return {
        prot: calcEpfForType("prot"),
        fireProt: calcEpfForType("fireProt"),
        blastProt: calcEpfForType("blastProt"),
        projectileProt: calcEpfForType("projectileProt"),
        featherFalling:
          calcEpfForType("prot") + (this.featherFallingEnabled ? 12 : 0)
      };
    },

    enchantsDamageReductionFactor() {
      return {
        normal:
          Math.min(this.enchantsProtectionPoints.prot, this.epfLimit) / 25,
        fireProt:
          Math.min(this.enchantsProtectionPoints.fireProt, this.epfLimit) / 25,
        blastProt:
          Math.min(this.enchantsProtectionPoints.blastProt, this.epfLimit) / 25,
        projectileProt:
          Math.min(
            this.enchantsProtectionPoints.projectileProt,
            this.epfLimit
          ) / 25,
        featherFalling:
          Math.min(
            this.enchantsProtectionPoints.featherFalling,
            this.epfLimit
          ) / 25
      };
    }
  },
  mounted() {
    const topAppBarElement = this.$refs.topBar;
    const topAppBar = new MDCTopAppBar(topAppBarElement);

    const select = new MDCSelect(document.querySelector(".mdc-select"));

    select.listen("MDCSelect:change", () => {
      this.damageCalcSelectedType = select.value;
    });
    
    
const textField = new MDCTextField(document.querySelector('.mdc-text-field'))
  }
});

app.component("number-desc", {
  props: {
    number: Number,
    number2: Number,
    percent: Boolean,
    health: Boolean,
    showHealth: Boolean
  },
  template: "#number-desc-template",
  computed: {
    displayNumber() {
      const number = this.showHealth ? this.number / 2 : this.number;
      const precision = this.health ? 10 : 100;
      return Math.round(number * precision) / precision;
    }
  }
});

app.component("mdc-single-checkbox", {
  template: "#mdc-single-checkbox-template",
  emits: ["checked-update"],
  props: {
    id: String
  },
  mounted() {
    const switchElem = new MDCSwitch(this.$refs.switchElem);
    const formField = new MDCFormField(this.$refs.formField);
    formField.input = switchElem;

    this.$refs.switchElem.addEventListener("change", () =>
      this.$emit("checked-update", switchElem.checked)
    );
  }
});

app.component("mdc-chip-set", {
  template: "#mdc-chip-set-template",
  emits: ["chip-update"],
  props: ["options"],
  data (){
    return {somethingSelected: true};
  },
  computed: {
    enumOptions() {
      if (typeof this.options[0] === "string") {
        return this.options.map((option, idx) => ({
          name: option,
          id: option,
          default: idx === 0
        }));
      }
      return this.options;
    }
  },
  mounted: function () {
    this.chipSet = new MDCChipSet(this.$refs.root);
    this.$emit(
      "chip-update",
      this.enumOptions.find((option) => option.default).id
    );

    this.$refs.root.addEventListener("MDCChip:selection", (event) => {
      if(event.detail.selected){
        this.somethingSelected = true;
        this.$emit("chip-update", event.target.getAttribute("data-id"));
      }else{
        this.somethingSelected = false;
        setTimeout(() => {
          console.log("click");
          if(!this.somethingSelected) this.$refs.root.querySelector(".mdc-chip").click();
        }, 0);
      }
    });
  }
});

app.component("armor-piece", {
  template: "#armor-piece",
  props: {
    // eg. iron, diamond
    type: String,
    initialProt: String,
    initialMaterial: String
  },
  emits: ["protTypeChange", "materialChange", "featherFallingEnabled"],
  watch: {
    prot(newProt) {
      this.$emit("protTypeChange", this.type, newProt);
    },
    material(newMaterial) {
      this.$emit("materialChange", this.type, newMaterial);
    },
    featherFallingEnabled(featherFallingEnabled) {
      this.$emit("featherFallingEnabled", featherFallingEnabled);
    }
  },
  data() {
    return {
      prot: "none",
      material: "none",

      protOptions: [
        {
          id: "none",
          name: "None",
          default: true
        },
        {
          id: "prot",
          name: "Protection 4"
        },
        {
          id: "fireProt",
          name: "Fire Protection 4"
        },
        {
          id: "blastProt",
          name: "Blast Protection 4"
        },
        {
          id: "projectileProt",
          name: "Projectile Protection 4"
        }
      ],
      featherFallingEnabled: false
    };
  },
  methods: {
    updateFeatherFallingEnabled(enabled) {
      this.featherFallingEnabled = enabled;
    },

    updateMaterial(material) {
      this.material = material;

      if (material === "none") {
        this.prot = "none";
      }
    },

    updateProt(prot) {
      this.prot = prot;
    }
  },
  computed: {
    materialOptions() {
      let materialOptions = ["none"];
      if (this.type === "chestplate") materialOptions.push("elytra");
      materialOptions = materialOptions.concat([
        "iron",
        "diamond",
        "netherite"
      ]);
      return materialOptions;
    }
  }
});

app.mount("#app");

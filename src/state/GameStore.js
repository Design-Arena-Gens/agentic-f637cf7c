import { create } from "zustand";
export const useGameStore = create((set, get) => ({
    playerStats: {
        health: 100,
        maxHealth: 100,
        mana: 30,
        maxMana: 30,
        experience: 0,
        level: 1
    },
    inventory: [
        {
            id: "lunar_blade",
            name: "Lunar Blade",
            description: "Ethereal weapon forged from moonlight, excelling against shades.",
            quantity: 1,
            icon: "item_blade"
        }
    ],
    quests: {
        "echoes-of-vale": {
            id: "echoes-of-vale",
            title: "Echoes of the Verdant Vale",
            giver: "Elder Lys",
            reward: "Harmony Seal - links the spirits to the vale",
            completed: false,
            stages: [
                {
                    id: "meet-sage",
                    description: "Find Elder Lys near the astral glade.",
                    hint: "She watches the horizon beyond the northern ruins.",
                    completed: false
                },
                {
                    id: "speak-guardian",
                    description: "Seek the village guardian for passage into the lower caves.",
                    hint: "He patrols west of the luminescent well.",
                    completed: false
                },
                {
                    id: "cleanse-cavern",
                    description: "Cleanse the Whispering Cavern of the nightbound shade.",
                    hint: "The cavern entrance lies behind the crystalline ridge.",
                    completed: false
                }
            ]
        }
    },
    activeQuestId: "echoes-of-vale",
    dialogue: {
        currentId: null,
        visible: false
    },
    flags: {
        metSage: false,
        guardianApproved: false,
        shadeDefeated: false
    },
    setDialogue: (dialogue) => set({ dialogue }),
    addItem: (item) => set((state) => {
        const existing = state.inventory.find((i) => i.id === item.id);
        if (existing) {
            return {
                inventory: state.inventory.map((i) => i.id === item.id
                    ? {
                        ...i,
                        quantity: i.quantity + item.quantity
                    }
                    : i)
            };
        }
        return {
            inventory: [...state.inventory, item]
        };
    }),
    consumeItem: (id) => set((state) => {
        const target = state.inventory.find((i) => i.id === id);
        if (!target)
            return {};
        if (target.quantity <= 1) {
            return {
                inventory: state.inventory.filter((i) => i.id !== id)
            };
        }
        return {
            inventory: state.inventory.map((i) => i.id === id
                ? {
                    ...i,
                    quantity: i.quantity - 1
                }
                : i)
        };
    }),
    setQuestStageComplete: (questId, stageId) => set((state) => {
        const quest = state.quests[questId];
        if (!quest)
            return {};
        const updatedStages = quest.stages.map((stage) => stage.id === stageId ? { ...stage, completed: true } : stage);
        const completed = updatedStages.every((stage) => stage.completed);
        return {
            quests: {
                ...state.quests,
                [questId]: {
                    ...quest,
                    stages: updatedStages,
                    completed
                }
            }
        };
    }),
    setActiveQuest: (questId) => set({ activeQuestId: questId }),
    setFlag: (key, value) => set((state) => ({
        flags: {
            ...state.flags,
            [key]: value
        }
    })),
    damagePlayer: (amount) => set((state) => ({
        playerStats: {
            ...state.playerStats,
            health: Math.max(state.playerStats.health - amount, 0)
        }
    })),
    healPlayer: (amount) => set((state) => ({
        playerStats: {
            ...state.playerStats,
            health: Math.min(state.playerStats.health + amount, state.playerStats.maxHealth)
        }
    })),
    awardExperience: (amount) => set((state) => {
        const total = state.playerStats.experience + amount;
        const levelUpThreshold = state.playerStats.level * 120;
        if (total >= levelUpThreshold) {
            const overflow = total - levelUpThreshold;
            const newLevel = state.playerStats.level + 1;
            return {
                playerStats: {
                    ...state.playerStats,
                    level: newLevel,
                    experience: overflow,
                    maxHealth: state.playerStats.maxHealth + 20,
                    health: state.playerStats.maxHealth + 20,
                    maxMana: state.playerStats.maxMana + 10,
                    mana: state.playerStats.maxMana + 10
                }
            };
        }
        return {
            playerStats: {
                ...state.playerStats,
                experience: total
            }
        };
    })
}));

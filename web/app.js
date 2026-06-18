const API_BASE = "http://localhost:8000";
let isEmulatorMode = false;

// --- DOM References ---
const expRatio = document.getElementById("player-exp-ratio");
const expBar = document.getElementById("player-exp-bar");
const playerLvl = document.getElementById("player-lvl");
const playerName = document.getElementById("player-name");
const playerRank = document.getElementById("player-rank");
const bioInput = document.getElementById("bio-input");
const modelPref = document.getElementById("model-preference");
const saveBioBtn = document.getElementById("save-bio-btn");
const resetBtn = document.getElementById("reset-system-btn");
const questsContainer = document.getElementById("quests-container");
const statsContainer = document.getElementById("stats-container");
const inventoryContainer = document.getElementById("inventory-container");
const systemStatus = document.querySelector(".system-status");

// Modal Elements
const rewardModal = document.getElementById("reward-modal");
const modalCardContent = document.getElementById("modal-card-content");
const closeModalBtn = document.getElementById("close-modal-btn");

// SCRAM Modal Elements
const scramModal = document.getElementById("scram-modal");
const scramConfirmInput = document.getElementById("scram-confirm-input");
const scramExecuteBtn = document.getElementById("scram-execute-btn");
const scramAbortBtn = document.getElementById("scram-abort-btn");

// --- Emulator Default State ---
const EMULATOR_KEY = "systemos_emulator_state";
const defaultEmulatorState = {
    player: {
        id: "1",
        name: "Sung Jin-Woo",
        rank: "E-Rank",
        level: 1,
        experience: 75,
        experience_to_next_level: 100,
        bio: "I travel frequently for work but struggle with being long-distance from my girlfriend. I want to build habits to stay connected.",
        model_preference: "local",
        stats: { strength: 10, agility: 10, stamina: 10, intelligence: 10, perception: 10, discipline: 10, creativity: 10, mindfulness: 10 }
    },
    quests: [
        { id: "1", title: "Daily Warm-up (10k steps)", category: "Stamina", difficulty: "E", xp_reward: 15, gold_reward: 100, is_completed: false },
        { id: "2", title: "Maintain Relationship Focus (Call Partner)", category: "Mindfulness", difficulty: "D", xp_reward: 20, gold_reward: 250, is_completed: false },
        { id: "3", title: "Explore Local Cities (Find new cafe)", category: "Perception", difficulty: "C", xp_reward: 30, gold_reward: 500, is_completed: false }
    ],
    inventory: []
};

// --- Core Initialization & Launcher ---
window.addEventListener("DOMContentLoaded", async () => {
    // 1. Try to test connection to FastAPI
    try {
        const response = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(1500) });
        if (response.ok) {
            isEmulatorMode = false;
            systemStatus.innerHTML = '<span class="pulse-indicator" style="background-color:#4caf50;"></span>FASTAPI SERVER';
            systemStatus.style.borderColor = "rgba(76, 175, 80, 0.25)";
            systemStatus.style.backgroundColor = "rgba(76, 175, 80, 0.05)";
            systemStatus.style.color = "#4caf50";
        }
    } catch (e) {
        // Switch to Emulator Mode
        isEmulatorMode = true;
        systemStatus.innerHTML = '<span class="pulse-indicator" style="background-color:#ff9800;"></span>OFFLINE EMULATOR';
        systemStatus.style.borderColor = "rgba(255, 152, 0, 0.25)";
        systemStatus.style.backgroundColor = "rgba(255, 152, 0, 0.05)";
        systemStatus.style.color = "#ff9800";
        if (!localStorage.getItem(EMULATOR_KEY)) {
            localStorage.setItem(EMULATOR_KEY, JSON.stringify(defaultEmulatorState));
        }
    }

    // 2. Fetch and render state
    loadDashboard();
});

// --- API Helpers (Fetch vs Emulator Router) ---
async function apiGet(route) {
    if (isEmulatorMode) {
        const state = JSON.parse(localStorage.getItem(EMULATOR_KEY));
        if (route === "/api/profile") return state.player;
        if (route === "/api/quests") return state.quests;
        if (route === "/api/inventory") return state.inventory;
    } else {
        const res = await fetch(`${API_BASE}${route}`);
        return await res.json();
    }
}

async function apiPost(route, body = {}) {
    if (isEmulatorMode) {
        let state = JSON.parse(localStorage.getItem(EMULATOR_KEY));
        
        if (route === "/api/profile") {
            state.player.bio = body.bio;
            state.player.model_preference = body.model_preference;
            localStorage.setItem(EMULATOR_KEY, JSON.stringify(state));
            return { status: "success", profile: state.player };
        }
        
        if (route.startsWith("/api/quests/") && route.endsWith("/complete")) {
            const questId = route.split("/")[3];
            const quest = state.quests.find(q => q.id === questId);
            if (!quest || quest.is_completed) return null;
            
            quest.is_completed = true;
            state.player.experience += quest.xp_reward;
            
            let levelUp = false;
            if (state.player.experience >= state.player.experience_to_next_level) {
                levelUp = true;
                state.player.level += 1;
                state.player.experience -= state.player.experience_to_next_level;
                state.player.experience_to_next_level = Math.floor(state.player.experience_to_next_level * 1.5);
                for (let stat in state.player.stats) {
                    state.player.stats[stat] += 1;
                }
            }
            
            // Client-side reward synthesis
            const rewardItem = generateEmulatorReward(state.player.bio, quest.category);
            state.inventory.push(rewardItem);
            
            localStorage.setItem(EMULATOR_KEY, JSON.stringify(state));
            return {
                status: "success",
                quest_completed: quest.title,
                xp_gained: quest.xp_reward,
                level_up: levelUp,
                new_level: state.player.level,
                new_exp: state.player.experience,
                new_exp_required: state.player.experience_to_next_level,
                reward_item: rewardItem
            };
        }
        
        if (route === "/api/quests/reset") {
            localStorage.setItem(EMULATOR_KEY, JSON.stringify(defaultEmulatorState));
            return { status: "reset_success" };
        }
    } else {
        const res = await fetch(`${API_BASE}${route}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        return await res.json();
    }
}

// --- Emulator Dynamic Reward Synthesizer ---
function generateEmulatorReward(bio, category) {
    const bioLower = bio.toLowerCase();
    const itemId = Math.random().toString(36).substring(2, 11);
    
    const hasRelationship = bioLower.includes("girlfriend") || bioLower.includes("partner") || bioLower.includes("relationship");
    const likesTravel = bioLower.includes("travel") || bioLower.includes("cities") || bioLower.includes("exploration") || bioLower.includes("wandering");
    const likesCoding = bioLower.includes("code") || bioLower.includes("programming") || bioLower.includes("engineer");
    
    const roll = Math.random();
    let rarity = "Rare";
    if (roll < 0.15) rarity = "Legendary";
    else if (roll < 0.50) rarity = "Epic";
    
    let name = "Ascendant Token";
    let description = "A mysterious token hums with ancient power.";
    let statModifiers = { stamina: 3 };
    let specialEffect = null;

    if (likesTravel && (category === "Perception" || category === "Stamina")) {
        if (hasRelationship) {
            name = "Amulet of the Remote Horizon";
            description = "A floating mechanical compass whose lens projects a holographic warmth of your distant loved one, matching your coordinate alignment.";
            statModifiers = { perception: 6, mindfulness: 4 };
            specialEffect = {
                name: "Tethered Pulse",
                trigger: "When completing quests over 100 miles from home",
                description: "Gain +10% Experience rewards on all active physical and mental categories."
            };
        } else {
            name = "Vagabond's Wayfinder";
            description = "A glowing kinetic gyroscope that spins faster when moving through unfamiliar territory.";
            statModifiers = { perception: 7, agility: 3 };
            specialEffect = {
                name: "Wandering Sight",
                trigger: "Entering a new city or terminal route",
                description: "Increases passive gold acquisition speed by 15%."
            };
        }
    } else if (hasRelationship && category === "Mindfulness") {
        name = "Locket of Heartsbound Resonance";
        description = "A warm crystal pendant. The pulsing core beats in absolute harmony with the breathing cycles of your relationship partner.";
        statModifiers = { mindfulness: 8, discipline: 2 };
        specialEffect = {
            name: "Sympathy Shield",
            trigger: "Maintaining a 3-day communications streak with your partner",
            description: "Negates all focus decay and prevents fatigue attributes from dropping below baseline."
        };
    } else if (likesCoding && category === "Intelligence") {
        name = "Sigil of Compile-Time Flow";
        description = "A circuit-etched obsidian ring. It feels cool to the touch and hums when your mind enters deep analytical states.";
        statModifiers = { intelligence: 8, discipline: 4 };
        specialEffect = {
            name: "Logic Loop",
            trigger: "Completing consecutive coding challenges",
            description: "Increases creative stats by +5 during system optimization windows."
        };
    } else {
        name = "Ascendant Steel Greaves";
        description = "Heavy steel greaves carrying weight modifiers.";
        statModifiers = { strength: 4 };
    }

    if (rarity === "Rare") {
        specialEffect = null;
        for (let k in statModifiers) {
            statModifiers[k] = Math.max(1, statModifiers[k] - 2);
        }
    }

    return {
        item_id: itemId,
        name,
        description,
        rarity,
        stat_modifiers: statModifiers,
        special_effect: specialEffect
    };
}

// --- Render Operations ---
async function loadDashboard() {
    try {
        const player = await apiGet("/api/profile");
        const quests = await apiGet("/api/quests");
        const inventory = await apiGet("/api/inventory");

        // 1. Render Player Progress
        playerName.innerText = player.name;
        playerRank.innerText = `RANK: ${player.rank.toUpperCase()}`;
        playerLvl.innerText = player.level;
        bioInput.value = player.bio;
        modelPref.value = player.model_preference;

        const ratio = player.experience / player.experience_to_next_level;
        expRatio.innerText = `${player.experience} / ${player.experience_to_next_level}`;
        expBar.style.width = `${Math.min(100, ratio * 100)}%`;

        // 2. Render Quests
        questsContainer.innerHTML = "";
        quests.forEach(quest => {
            const item = document.createElement("div");
            item.className = `quest-item ${quest.is_completed ? 'completed' : ''}`;
            
            const xpText = `+${quest.xp_reward} XP`;
            const goldText = `+${quest.gold_reward}G`;
            
            item.innerHTML = `
                <div class="quest-info">
                    <i class="quest-status-icon fa-regular ${quest.is_completed ? 'fa-circle-check' : 'fa-circle'}"></i>
                    <div class="quest-details">
                        <span class="quest-title">${quest.title}</span>
                        <span class="quest-tag">${quest.category}</span>
                    </div>
                </div>
                <div class="quest-action-section">
                    <div class="quest-reward-preview">
                        <span class="xp-preview">${xpText}</span>
                        <span class="gold-preview">${goldText}</span>
                    </div>
                    ${quest.is_completed ? '' : `<button class="complete-btn" onclick="completeQuest('${quest.id}')">Complete</button>`}
                </div>
            `;
            questsContainer.appendChild(item);
        });

        // 3. Render Attributes
        statsContainer.innerHTML = "";
        for (const [stat, val] of Object.entries(player.stats)) {
            const box = document.createElement("div");
            box.className = "stat-item";
            box.innerHTML = `
                <span class="stat-label">${stat}</span>
                <span class="stat-val">${val}</span>
            `;
            statsContainer.appendChild(box);
        }

        // 4. Render Inventory
        inventoryContainer.innerHTML = "";
        if (inventory.length === 0) {
            inventoryContainer.innerHTML = '<div class="empty-state">No dynamic loot acquired. Complete a quest above!</div>';
        } else {
            inventory.forEach(item => {
                const bar = document.createElement("div");
                bar.className = `loot-item-bar ${item.rarity}`;
                
                const statsTxt = Object.entries(item.stat_modifiers)
                    .map(([k, v]) => `+${v} ${k.substring(0, 3).toUpperCase()}`)
                    .join(", ");
                
                bar.innerHTML = `
                    <div class="loot-icon-holder">
                        <i class="fa-solid fa-gem"></i>
                    </div>
                    <div class="loot-name-col">
                        <span class="loot-item-name">${item.name}</span>
                        <span class="loot-item-rarity">${item.rarity}</span>
                    </div>
                    <span class="loot-stat-preview">${statsTxt}</span>
                `;
                inventoryContainer.appendChild(bar);
            });
        }
    } catch (e) {
        console.error("Failed to load dashboard:", e);
    }
}

// --- Action Operations ---

saveBioBtn.addEventListener("click", async () => {
    saveBioBtn.disabled = true;
    saveBioBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Calibrating...';
    
    await apiPost("/api/profile", {
        bio: bioInput.value,
        model_preference: modelPref.value
    });

    setTimeout(() => {
        saveBioBtn.disabled = false;
        saveBioBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Recalibrate Engine Context';
        loadDashboard();
    }, 400);
});

resetBtn.addEventListener("click", () => {
    // Open custom SCRAM modal instead of blocking native confirm/prompt
    scramConfirmInput.value = "";
    scramConfirmInput.placeholder = "WIPE";
    scramModal.classList.add("active");
    scramConfirmInput.focus();
});

scramAbortBtn.addEventListener("click", () => {
    scramModal.classList.remove("active");
});

scramExecuteBtn.addEventListener("click", async () => {
    const verification = scramConfirmInput.value.trim();

    if (verification === "WIPE") {
        scramModal.classList.remove("active");
        
        // Apply temporary UI shake effect to signal impact
        document.body.style.animation = "shake 0.5s ease";
        setTimeout(() => { document.body.style.animation = ""; }, 500);

        await apiPost("/api/quests/reset");
        loadDashboard();
        
        // Show non-blocking success custom confirmation
        setTimeout(() => {
            alert("💥 [SYSTEM RESET COMPLETE] Progress incinerated. Returning to Level 1.");
        }, 100);
    } else {
        // Wiggle input field to show validation failure
        scramConfirmInput.classList.remove("wiggle");
        void scramConfirmInput.offsetWidth; // Trigger reflow to restart animation
        scramConfirmInput.classList.add("wiggle");
        
        scramConfirmInput.value = "";
        scramConfirmInput.placeholder = "INVALID CODE";
    }
});

async function completeQuest(questId) {
    try {
        const response = await apiPost(`/api/quests/${questId}/complete`);
        if (response && response.status === "success") {
            // Refresh underlying dashboard lists
            loadDashboard();
            
            // Pop the dynamic Loot Card Modal
            showLootModal(response.reward_item);
        }
    } catch (e) {
        console.error("Failed to complete quest:", e);
    }
}

function showLootModal(item) {
    const isLegendary = item.rarity === "Legendary";
    const isEpic = item.rarity === "Epic";
    
    const statsMarkup = Object.entries(item.stat_modifiers)
        .map(([k, v]) => `<span class="modal-stat-pill">+${v} ${k}</span>`)
        .join("");
        
    let effectMarkup = "";
    if (item.special_effect) {
        effectMarkup = `
            <div class="modal-section-title" style="margin-top: 20px;">Special Attribute</div>
            <div class="modal-effect-card">
                <div class="effect-name"><i class="fa-solid fa-wand-magic-sparkles"></i> ${item.special_effect.name}</div>
                <div class="effect-trigger">Trigger: ${item.special_effect.trigger}</div>
                <div class="effect-desc">${item.special_effect.description}</div>
            </div>
        `;
    }

    modalCardContent.className = `modal-card ${item.rarity}`;
    modalCardContent.innerHTML = `
        <div class="modal-title-announcement">[ DYNAMIC LOOT ACQUIRED ]</div>
        <h2 class="modal-item-name ${item.rarity}">${item.name}</h2>
        <span class="modal-item-rarity-badge ${item.rarity}">${item.rarity}</span>
        <div class="modal-lore-text">"${item.description}"</div>
        <div class="modal-section-title">Attribute Modifiers</div>
        <div class="modal-stats-list">${statsMarkup}</div>
        ${effectMarkup}
    `;

    rewardModal.classList.add("active");
}

closeModalBtn.addEventListener("click", () => {
    rewardModal.classList.remove("active");
});

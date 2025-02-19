import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, set, get, onValue, runTransaction } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCvW7BPr6VfMmCZvIxHhjA3Jac8o3PXXko",
    authDomain: "fut-sorteios-beta.firebaseapp.com",
    databaseURL: "https://fut-sorteios-beta-default-rtdb.firebaseio.com",
    projectId: "fut-sorteios-beta",
    storageBucket: "fut-sorteios-beta.firebasestorage.app",
    messagingSenderId: "218663543341",
    appId: "1:218663543341:web:593d1c0da17b0f9c268ea4",
    measurementId: "G-50TY6BH9FP"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const dbRef = ref(db, "players");

document.addEventListener("DOMContentLoaded", () => {
    const input = document.querySelector(".participate input");
    const draftButton = document.querySelector(".draft");
    const body = document.querySelector("body");

    let players = [];
    let teams = { A: [], B: [], Suplente: [] };
    let teamValues = { A: 0, B: 0 };
    let teamColors = {};
    const jerseys = ["red", "blue", "green", "yellow"];

    const playerValues = {
        "joao": 10, "andre": 10, "goncalo": 10, "delfim": 10,
        "fabio": 7.5, "ruben": 7.5, "claudio": 7.5, "busquets": 7.5, "daniel": 7.5, "postiga": 7.5, "marcelo": 7.5,
        "pedro": 2.5, "rafael": 2.5, "buxo": 2.5, "pedro soares": 2.5, "pedro s": 2.5,
    };

    const restrictions = [
        ["joao", "andre"],
        ["goncalo", "delfim"]
    ];

    function normalizeName(name) {
        return name
            .toLowerCase()
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "")
            .replace(/ /g, "");
    }

    function levenshteinDistance(a, b) {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    }

    function correctPlayerName(inputName) {
        let minDistance = 2;
        let correctedName = inputName;
        Object.keys(playerValues).forEach(validName => {
            let distance = levenshteinDistance(normalizeName(inputName), normalizeName(validName));
            if (distance <= minDistance) {
                minDistance = distance;
                correctedName = validName;
            }
        });
        return correctedName;
    }

    draftButton.addEventListener("click", () => {
        let playerName = input.value.trim();
        if (!playerName) return;
        playerName = correctPlayerName(playerName);
        if (players.length >= 15) {
            alert("O limite de jogadores (15) foi atingido!");
            return;
        }

        function assignPlayer(player) {
            const normalizedPlayer = normalizeName(player);
            const playerValue = playerValues[normalizedPlayer] || 5;
        
            if (players.length === 1) {
                teams.A.push(player);
                teamValues.A += playerValue;
                updateTeams();
                savePlayers();
                return;
            }
        
            if (["buxo", "pedro", "pedro soares", "pedro s", "rafael"].includes(normalizedPlayer)) {
                if (teams.A.length < 5 && !teams.A.some(p => ["buxo", "pedro", "pedro soares", "pedro s", "rafael"].includes(normalizeName(p)))) {
                    teams.A.push(player);
                } else if (teams.B.length < 5 && !teams.B.some(p => ["buxo", "pedro", "pedro soares", "pedro s", "rafael"].includes(normalizeName(p)))) {
                    teams.B.push(player);
                } else {
                    teams.Suplente.push(player);
                }
                updateTeams();
                savePlayers();
                return;
            }
        
            if (["goncalo", "delfim"].includes(normalizedPlayer)) {
                const otherKeeper = normalizedPlayer === "goncalo" ? "delfim" : "goncalo";
                const keeperTeam = teams.A.some(p => normalizeName(p) === otherKeeper) ? "B" : "A";
        
                if (teams.A.length >= 5 && teams.B.length >= 5) {
                    const removedPlayer = teams[keeperTeam].splice(Math.floor(Math.random() * teams[keeperTeam].length), 1)[0];
                    teams.Suplente.push(removedPlayer);
                    teams[keeperTeam].push(player);
                } else {
                    teams[keeperTeam].push(player);
                }
                updateTeams();
                savePlayers();
                return;
            }
        
            let availableTeams = [];
            if (teams.A.length < 5) availableTeams.push("A");
            if (teams.B.length < 5) availableTeams.push("B");
        
            restrictions.forEach(pair => {
                if (pair.includes(normalizedPlayer)) {
                    let restrictedPlayer = pair.find(name => name !== normalizedPlayer);
                    if (teams.A.some(p => normalizeName(p) === restrictedPlayer)) {
                        availableTeams = availableTeams.filter(t => t !== "A");
                    } else if (teams.B.some(p => normalizeName(p) === restrictedPlayer)) {
                        availableTeams = availableTeams.filter(t => t !== "B");
                    }
                }
            });
        
            if (availableTeams.length > 0) {
                let bestTeam = availableTeams.reduce((a, b) =>
                    teamValues[a] < teamValues[b] ? a : b
                );
                teams[bestTeam].push(player);
                teamValues[bestTeam] += playerValue;
            } else {
                teams.Suplente.push(player);
            }
        
            updateTeams();
            savePlayers();
        }        

        players.push(playerName);
        assignPlayer(playerName);
        input.value = "";
        savePlayers();
    });

    function savePlayers() {
        runTransaction(dbRef, (currentData) => {
            if (!currentData) {
                return teams;
            }
            return {
                A: teams.A,
                B: teams.B,
                Suplente: teams.Suplente
            };
        });
    }

    onValue(dbRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();

            teams.A = data.A || [];
            teams.B = data.B || [];
            teams.Suplente = data.Suplente || [];

            updateTeams();
        }
    });

    function updateTeams() {
        let teamContainer = document.querySelector(".team_container");
        if (!teamContainer) {
            teamContainer = document.createElement("section");
            teamContainer.classList.add("team_container");
            body.insertBefore(teamContainer, document.querySelector("footer"));
        }
        teamContainer.innerHTML = "";

        ["A", "B", "Suplente"].forEach(team => {
            if (teams[team].length === 0) return;
            if (!teamColors[team] && team !== "Suplente") {
                let availableColors = jerseys.filter(c => !Object.values(teamColors).includes(c));
                teamColors[team] = availableColors[Math.floor(Math.random() * availableColors.length)];
            }

            let section = document.createElement("section");
            section.classList.add("team_name");
            section.innerHTML = `<h1>Equipa ${team}</h1>`;
            teamContainer.appendChild(section);

            let playerContainer = document.createElement("section");
            playerContainer.classList.add("player_container");
            teams[team].forEach(player => {
                let playerKit = document.createElement("section");
                playerKit.classList.add("player_kit");
                let jerseyColor = team === "Suplente" ? "black" : teamColors[team];
                playerKit.innerHTML = `
                    <figure><img src="images/jersey_${jerseyColor}.png" alt="equipamento ${jerseyColor}"></figure>
                    <p>${player}</p>
                `;
                playerContainer.appendChild(playerKit);
            });
            teamContainer.appendChild(playerContainer);
        });
    }
});
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

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
  let teams = { A: [], B: [], Banco: [] };
  let teamValues = { A: 0, B: 0 };
  let teamColors = {};
  const jerseys = ["red", "blue", "green", "yellow"];

  const playerValues = {
    "joao": 10, "andre": 10, "goncalo": 10, "delfim": 10,
    "fabio": 7.5, "ruben": 7.5, "claudio": 7.5, "busquets": 7.5,
    "daniel": 7.5, "postiga": 7.5, "marcelo": 7.5,
    "pedro": 2.5, "rafael": 2.5, "buxo": 2.5
  };

  const restrictions = [
    ["joao", "andre"],
    ["goncalo", "delfim"]
  ];

  function normalizeName(name) {
    return name.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/ /g, "");
  }

  draftButton.addEventListener("click", () => {
    const playerName = input.value.trim();
    if (!playerName) return;
    if (players.length >= 15) {
      alert("O limite de jogadores (15) foi atingido!");
      return;
    }
    players.push(playerName);
    assignPlayer(playerName);
    input.value = "";
    savePlayers();
  });

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

    if (normalizedPlayer === "goncalo" || normalizedPlayer === "delfim") {
      assignGoalkeeper(player, normalizedPlayer, playerValue);
      return;
    }

    if (normalizedPlayer === "pedro" || normalizedPlayer === "rafael" || normalizedPlayer === "buxo") {
      assignLowValuePlayer(player, normalizedPlayer, playerValue);
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
        (teamValues[a] < teamValues[b] ? a : b)
      );
      teams[bestTeam].push(player);
      teamValues[bestTeam] += playerValue;
    } else {
      teams.Banco.push(player);
    }
    updateTeams();
    savePlayers();
  }

  function assignGoalkeeper(player, normalizedPlayer, playerValue) {
    if (teams.A.length === 5 && teams.B.length === 5) {
      let targetTeam = teams.A.some(p => normalizeName(p) === "delfim") ? "B" : "A";
      let removedPlayer = teams[targetTeam].splice(Math.floor(Math.random() * teams[targetTeam].length), 1)[0];
      teams.Banco.push(removedPlayer);
      teams[targetTeam].push(player);
    } else {
      if (teams.A.length < 5 && !teams.A.some(p => normalizeName(p) === "goncalo" || normalizeName(p) === "delfim")) {
        teams.A.push(player);
      } else if (teams.B.length < 5) {
        teams.B.push(player);
      } else {
        teams.Banco.push(player);
      }
    }
    updateTeams();
    savePlayers();
  }

  function assignLowValuePlayer(player, normalizedPlayer, playerValue) {
    let hasA = teams.A.some(p => ["pedro", "rafael", "buxo"].includes(normalizeName(p)));
    let hasB = teams.B.some(p => ["pedro", "rafael", "buxo"].includes(normalizeName(p)));
    if (!hasA && teams.A.length < 5) {
      teams.A.push(player);
    } else if (!hasB && teams.B.length < 5) {
      teams.B.push(player);
    } else {
      teams.Banco.push(player);
    }
    updateTeams();
    savePlayers();
  }

  function updateTeams() {
    set(dbRef, teams);
  }

  onValue(dbRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      teams.A = data.A || [];
      teams.B = data.B || [];
      teams.Banco = data.Banco || [];
      updateTeams();
    }
  });
});
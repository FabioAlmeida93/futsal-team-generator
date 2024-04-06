document.addEventListener('DOMContentLoaded', function() {
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Troca elementos
        }
    }

    const teamNumberInput = document.querySelector('.team-number input');
    const playerNumberInput = document.querySelector('.player-number input');
    const generateTeamsButton = document.getElementById('generate-teams');
    const refreshButton = document.getElementById('refresh');
    const eraseButton = document.getElementById('erase');
    const teamNamesContainer = document.querySelector('.team-names');
    const playerNamesContainer = document.querySelector('.player-names');
    const teamDisplay = document.querySelector('.team-display');

    teamNumberInput.addEventListener('input', function() {
        const numberOfTeams = parseInt(this.value, 10);
        teamNamesContainer.innerHTML = '';
        for (let i = 0; i < numberOfTeams; i++) {
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = `Equipa ${i + 1}`;
            teamNamesContainer.appendChild(input);
        }
    });

    playerNumberInput.addEventListener('input', function() {
        const numberOfPlayers = parseInt(this.value, 10);
        playerNamesContainer.innerHTML = '';
        for (let i = 0; i < numberOfPlayers; i++) {
            const div = document.createElement('div');
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = `Jogador ${i + 1}`;
            div.appendChild(input);

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = `Jogador ${i + 1}`;
            div.appendChild(checkbox);

            playerNamesContainer.appendChild(div);
        }
    });

    generateTeamsButton.addEventListener('click', function() {
        const numberOfTeams = parseInt(teamNumberInput.value, 10);
        if (!numberOfTeams) {
            alert("Por favor, insira um número válido de equipes.");
            return;
        }

        const playerDivs = Array.from(playerNamesContainer.querySelectorAll('div'));
        let players = playerDivs.map(div => ({
            name: div.querySelector('input[type="text"]').value,
            avoidTeam: div.querySelector('input[type="checkbox"]').checked
        }));

        // Separar jogadores marcados dos não marcados
        let markedPlayers = players.filter(player => player.avoidTeam);
        let unmarkedPlayers = players.filter(player => !player.avoidTeam);

        if (markedPlayers.length > numberOfTeams) {
            alert("Não é possível alocar todos os jogadores selecionados em equipes diferentes com o número de equipes disponíveis.");
            return;
        }

        shuffleArray(unmarkedPlayers);
        shuffleArray(markedPlayers);

        // Prepara as equipes
        const teams = Array.from({ length: numberOfTeams }, () => []);

        // Distribui os jogadores marcados, um por equipe
        markedPlayers.forEach((player, index) => {
            teams[index].push(player);
        });

        // Distribui os jogadores não marcados
        unmarkedPlayers.forEach(player => {
            teams.sort((a, b) => a.length - b.length); // Equipes com menos jogadores primeiro
            teams[0].push(player);
        });

        // Renderização das equipes na interface
        teamDisplay.innerHTML = '';
        teams.forEach((team, index) => {
            const teamSection = document.createElement('section');
            teamSection.className = 'teams-generated';

            const teamName = document.createElement('h2');
            teamName.textContent = `Equipa ${index + 1}`;
            teamSection.appendChild(teamName);

            team.forEach(player => {
                const playerElement = document.createElement('div');
                const playerName = document.createElement('p');
                playerName.textContent = player.name;
                playerElement.appendChild(playerName);

                const picture = document.createElement('picture');
                const img = document.createElement('img');
                let imageIndex = (index % 5) + 1; // Assume-se que existem 3 imagens diferentes de camisetas
                img.src = `images/team-${imageIndex}-shirt.png`;
                img.alt = `Camisola da Equipa ${index + 1}`;
                picture.appendChild(img);
                playerElement.appendChild(picture);

                teamSection.appendChild(playerElement);
            });

            teamDisplay.appendChild(teamSection);
        });
    });

    refreshButton.addEventListener('click', function() {
        generateTeamsButton.click();
    });

    eraseButton.addEventListener('click', function() {
        teamNamesContainer.innerHTML = '';
        playerNamesContainer.innerHTML = '';
        teamDisplay.innerHTML = '';
        teamNumberInput.value = '';
        playerNumberInput.value = '';
    });
});

document.addEventListener("DOMContentLoaded", function() {
    var sendButton = document.querySelector('.send');
    var eraseButton = document.querySelector('.erase');
    var playersTextarea = document.getElementById('players');
    var captainsSection = document.querySelector('.captains');

    sendButton.addEventListener('click', gerarEquipes);
    eraseButton.addEventListener('click', apagarSelecao);
    playersTextarea.addEventListener('input', createCaptainCheckboxes);

    function gerarEquipes() {
        var numEquipasInput = document.querySelector('.selectores input[type="number"]:nth-child(1)');
        var jogadoresPorEquipaInput = document.querySelector('.selectores input[type="number"]:nth-child(2)');
        var teamsList = document.querySelector('.teams ul');
        
        var numEquipas = parseInt(numEquipasInput.value);
        var jogadoresPorEquipa = parseInt(jogadoresPorEquipaInput.value);
        var playersArray = playersTextarea.value.split(',').map(function(item) {
            return item.trim();
        });

        captainsSection.innerHTML = ''; // Limpar a seção de capitães
        var captains = getSelectedCaptains();

        renderTeams(numEquipas, teamsList); // Renderizar equipes imediatamente

        setTimeout(function() {
            distributePlayersWithDelay(playersArray, numEquipas, jogadoresPorEquipa, captains, teamsList, 1000); // Distribuir jogadores com intervalo de 1 segundo
        }, 500); // Esperar meio segundo antes de começar a distribuir jogadores
    }

    function createCaptainCheckboxes() {
        var playersArray = playersTextarea.value.split(',').map(function(item) {
            return item.trim();
        });

        captainsSection.innerHTML = ''; // Limpar a seção de capitães

        playersArray.forEach(function(player) {
            var captainCheckbox = document.createElement('input');
            captainCheckbox.type = 'checkbox';
            captainCheckbox.value = player;
            var label = document.createElement('label');
            label.textContent = player;
            label.appendChild(captainCheckbox);
            captainsSection.appendChild(label);
        });
    }

    function getSelectedCaptains() {
        var selectedCaptains = [];
        var captainCheckboxes = document.querySelectorAll('.captains input[type="checkbox"]');
        captainCheckboxes.forEach(function(checkbox) {
            if (checkbox.checked) {
                selectedCaptains.push(checkbox.value);
            }
        });
        return selectedCaptains;
    }

    function distributePlayersWithDelay(playersArray, numTeams, playersPerTeam, captains, teamsList, delay) {
        var shuffledPlayers = shuffleArray(playersArray.filter(player => !captains.includes(player)));
        var currentPlayerIndex = 0;
        var teams = [];
        for (var i = 0; i < numTeams; i++) {
            teams.push([]);
        }

        captains.forEach(function(captain) {
            var teamIndex = currentPlayerIndex % numTeams;
            var team = teams[teamIndex];
            team.push(captain);
            currentPlayerIndex++;
        });

        var distributeNextPlayer = function() {
            var teamIndex = currentPlayerIndex % numTeams;
            var team = teams[teamIndex];
            if (currentPlayerIndex < playersArray.length) {
                var currentPlayer = shuffledPlayers[currentPlayerIndex];
                team.push(currentPlayer);
                currentPlayerIndex++;
                renderTeam(team, teamIndex + 1, teamsList);
            }

            if (currentPlayerIndex < playersArray.length) {
                setTimeout(distributeNextPlayer, delay);
            }
        };

        distributeNextPlayer();
    }

    function renderTeams(numTeams, teamsList) {
        for (var i = 1; i <= numTeams; i++) {
            var teamElement = createTeamElement(i);
            teamsList.appendChild(teamElement);
        }
    }

    function renderTeam(team, teamNumber, teamsList) {
        var teamElement = teamsList.children[teamNumber - 1]; // Equipe correspondente ao índice na lista
        teamElement.innerHTML = ''; // Limpar conteúdo anterior da equipe
        
        var teamTitle = document.createElement('h3');
        teamTitle.textContent = 'Equipa ' + teamNumber + ':';
        teamElement.appendChild(teamTitle);
        
        team.forEach(function(player) {
            var playerParagraph = document.createElement('p');
            playerParagraph.textContent = player;
            teamElement.appendChild(playerParagraph);
        });
    }

    function createTeamElement(teamNumber) {
        var team = document.createElement('li');
        return team;
    }

    function apagarSelecao() {
        var inputs = document.querySelectorAll('.selectores input[type="number"]');
        var textarea = document.getElementById('players');
        var teamsList = document.querySelector('.teams ul');

        inputs.forEach(function(input) {
            input.value = '';
        });

        textarea.value = '';
        captainsSection.innerHTML = '';
        teamsList.innerHTML = '';
    }

    function shuffleArray(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap
        }
        return array;
    }
});

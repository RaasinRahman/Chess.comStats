function analyzeMoves(moves) {
    const blunders = [];
    const mistakes = [];
    const inaccuracies = [];
    let totalCentipawnLoss = 0;
    let consistencyRating = 0;
    const evaluations = [];

    moves.forEach((move, index) => {
        const evaluation = evaluateMove(move);
        evaluations.push(evaluation);
        totalCentipawnLoss += Math.abs(evaluation.centipawnLoss);

        if (evaluation.centipawnLoss >= 300) {
            blunders.push({ moveNumber: index + 1, move: move });
        } else if (evaluation.centipawnLoss >= 100) {
            mistakes.push({ moveNumber: index + 1, move: move });
        } else if (evaluation.centipawnLoss >= 50) {
            inaccuracies.push({ moveNumber: index + 1, move: move });
        }

        if (evaluation.bestMove) {
            consistencyRating++;
        }
    });

    const averageCentipawnLoss = totalCentipawnLoss / moves.length;
    consistencyRating = (consistencyRating / moves.length) * 100;

    return {
        blunders,
        mistakes,
        inaccuracies,
        averageCentipawnLoss,
        consistencyRating,
        evaluations
    };
}

function evaluateMove(move) {
    // This is a placeholder function. In a real implementation,
    // you would use a chess engine to evaluate the position.
    const centipawnLoss = Math.floor(Math.random() * 400);
    const bestMove = Math.random() > 0.7;
    return { centipawnLoss, bestMove };
}

function findTurningPoints(evaluations) {
    const turningPoints = [];
    for (let i = 1; i < evaluations.length; i++) {
        const diff = evaluations[i] - evaluations[i-1];
        if (Math.abs(diff) > 200) {
            turningPoints.push({ moveNumber: i + 1, evaluation: evaluations[i] });
        }
    }
    return turningPoints;
}

async function getStats() {
    const username = document.getElementById('username').value;
    const statsContainer = document.getElementById('stats-container');
    statsContainer.innerHTML = 'Loading...';

    try {
        const profileUrl = `https://api.chess.com/pub/player/${username}`;
        const statsUrl = `https://api.chess.com/pub/player/${username}/stats`;

        const profileResponse = await fetch(profileUrl);
        if (!profileResponse.ok) {
            throw new Error(`Failed to fetch profile data: ${profileResponse.status}`);
        }
        const profileData = await profileResponse.json();

        const statsResponse = await fetch(statsUrl);
        if (!statsResponse.ok) {
            throw new Error(`Failed to fetch stats data: ${statsResponse.status}`);
        }
        const statsData = await statsResponse.json();

        let html = `
            <div class="stat-group">
                <h2>Profile</h2>
                <div class="stat-item"><span>Username:</span> <span>${profileData.username}</span></div>
                <div class="stat-item"><span>Name:</span> <span>${profileData.name || 'N/A'}</span></div>
                <div class="stat-item"><span>Country:</span> <span>${profileData.country || 'N/A'}</span></div>
                <div class="stat-item"><span>Followers:</span> <span>${profileData.followers || 'N/A'}</span></div>
            </div>
        `;

        const gameTypes = ['chess_rapid', 'chess_blitz', 'chess_bullet'];
        gameTypes.forEach(type => {
            if (statsData[type]) {
                const capitalizedType = type.replace('chess_', '').charAt(0).toUpperCase() + type.replace('chess_', '').slice(1);
                html += `
                    <div class="stat-group">
                        <h2>${capitalizedType}</h2>
                        <div class="stat-item"><span>Current Rating:</span> <span>${statsData[type].last?.rating || 'N/A'}</span></div>
                        <div class="stat-item"><span>Best Rating:</span> <span>${statsData[type].best?.rating || 'N/A'}</span></div>
                        <div class="stat-item"><span>Win/Loss/Draw:</span> <span>${statsData[type].record?.win || 0}/${statsData[type].record?.loss || 0}/${statsData[type].record?.draw || 0}</span></div>
                    </div>
                `;
            }
        });

        if (statsData.tactics) {
            html += `
                <div class="stat-group">
                    <h2>Tactics</h2>
                    <div class="stat-item"><span>Highest Rating:</span> <span>${statsData.tactics.highest?.rating || 'N/A'}</span></div>
                    <div class="stat-item"><span>Lowest Rating:</span> <span>${statsData.tactics.lowest?.rating || 'N/A'}</span></div>
                </div>
            `;
        }

        // Fetch the latest game data
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const gamesUrl = `https://api.chess.com/pub/player/${username}/games/${year}/${month}`;
        const gamesResponse = await fetch(gamesUrl);
        if (!gamesResponse.ok) {
            throw new Error(`Failed to fetch games data: ${gamesResponse.status}`);
        }
        const gamesData = await gamesResponse.json();

        // Analyze the latest game
        if (gamesData.games && gamesData.games.length > 0) {
            const latestGame = gamesData.games[gamesData.games.length - 1];
            const moves = latestGame.pgn.split(' ').filter(move => !move.includes('.'));
            const analysis = analyzeMoves(moves);

            html += `
                <div class="stat-group">
                    <h2>Latest Game Analysis</h2>
                    <div class="stat-item"><span>Blunders:</span> <span>${analysis.blunders.length}</span></div>
                    <div class="stat-item"><span>Mistakes:</span> <span>${analysis.mistakes.length}</span></div>
                    <div class="stat-item"><span>Inaccuracies:</span> <span>${analysis.inaccuracies.length}</span></div>
                    <div class="stat-item"><span>Average Centipawn Loss:</span> <span>${analysis.averageCentipawnLoss.toFixed(2)}</span></div>
                    <div class="stat-item"><span>Consistency Rating:</span> <span>${analysis.consistencyRating.toFixed(2)}%</span></div>
                </div>
            `;

            statsContainer.innerHTML = html;

            // Generate move-by-move evaluation graph
            const ctx = document.createElement('canvas');
            ctx.id = 'evaluationGraph';
            statsContainer.appendChild(ctx);
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: analysis.evaluations.map((_, index) => index + 1),
                    datasets: [{
                        label: 'Position Evaluation',
                        data: analysis.evaluations.map(e => e.centipawnLoss),
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            title: {
                                display: true,
                                text: 'Centipawn Loss'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Move Number'
                            }
                        }
                    }
                }
            });

            // Find turning points
            const turningPoints = findTurningPoints(analysis.evaluations.map(e => e.centipawnLoss));
            html += `
                <div class="stat-group">
                    <h2>Turning Points</h2>
                    ${turningPoints.map(tp => `<div class="stat-item"><span>Move ${tp.moveNumber}:</span> <span>Evaluation change to ${tp.evaluation}</span></div>`).join('')}
                </div>
            `;

            statsContainer.innerHTML += html;
        } else {
            html += `<div class="stat-group"><h2>No recent games found</h2></div>`;
            statsContainer.innerHTML = html;
        }
    } catch (error) {
        console.error('Error:', error);
        statsContainer.innerHTML = `Error fetching data: ${error.message}. Please try again.`;
    }
}

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

        statsContainer.innerHTML = html;
    } catch (error) {
        console.error('Error:', error);
        statsContainer.innerHTML = `Error fetching data: ${error.message}. Please try again.`;
    }
}

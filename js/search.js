const Search = {
    filter(games, query = '', category = 'all', genre = 'all') {
        return games.filter(game => {
            const matchesQuery = query === '' || 
                game.name.toLowerCase().includes(query.toLowerCase()) ||
                (game.author && game.author.toLowerCase().includes(query.toLowerCase()));
            
            const matchesCategory = category === 'all' || 
                (game.special && game.special.includes(category));
            
            const matchesGenre = genre === 'all' || 
                (game.genres && game.genres.includes(genre));
            
            return matchesQuery && matchesCategory && matchesGenre;
        });
    },

    getGenres(games) {
        const genres = new Set();
        games.forEach(game => {
            if (game.genres) {
                game.genres.forEach(g => genres.add(g));
            }
        });
        return Array.from(genres).sort();
    }
};

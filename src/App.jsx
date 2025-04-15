import React, { useState, useEffect } from 'react';
import './App.css';
import FootballChatbot from './FootballChatbot';

// New component for fetching and displaying top scorers
const TopScorers = ({ competitionId, apiKey }) => {
  const [topScorers, setTopScorers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopScorers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(
          `https://cors-anywhere.herokuapp.com/https://api.football-data.org/v4/competitions/${competitionId}/scorers?limit=5`,
          {
            headers: {
              'X-Auth-Token': apiKey
            }
          }
        );
        
        const data = await response.json();
        
        if (data.scorers) {
          setTopScorers(data.scorers);
        } else {
          setError('No top scorer data available');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching top scorers:', err);
        setError('Failed to load top scorers data');
        setLoading(false);
      }
    };

    if (competitionId) {
      fetchTopScorers();
    }
  }, [competitionId, apiKey]);

  if (loading) {
    return (
      <div className="top-scorers-section loading">
        <div className="spinner"></div>
        <p>Loading top scorers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="top-scorers-section error">
        <p>{error}</p>
      </div>
    );
  }

  if (topScorers.length === 0) {
    return (
      <div className="top-scorers-section empty">
        <p>No top scorers data available</p>
      </div>
    );
  }

  return (
    <div className="top-scorers-section">
      <h3>Top Scorers</h3>
      <div className="top-scorers-container">
        <table className="top-scorers-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Team</th>
              <th className="center">Goals</th>
              <th className="center">Assists</th>
              <th className="center">Penalties</th>
            </tr>
          </thead>
          <tbody>
            {topScorers.map((scorer, index) => (
              <tr key={`${scorer.player.id}-${index}`} className="scorer-row">
                <td className="center">{index + 1}</td>
                <td>
                  <div className="player-cell">
                    <span>{scorer.player.name}</span>
                  </div>
                </td>
                <td>
                  <div className="team-cell">
                    <img 
                      src={scorer.team.crest} 
                      alt={`${scorer.team.name} logo`} 
                      className="team-logo" 
                    />
                    <span>{scorer.team.name}</span>
                  </div>
                </td>
                <td className="center bold">{scorer.goals}</td>
                <td className="center">{scorer.assists || 0}</td>
                <td className="center">{scorer.penalties || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TeamFixturesModal = ({ team, onClose, apiKey }) => {
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!team) return;

    const fetchTeamFixtures = async () => {
      try {
        const response = await fetch(`https://cors-anywhere.herokuapp.com/https://api.football-data.org/v4/teams/${team.id}/matches?status=SCHEDULED&limit=5`, {
          headers: {
            'X-Auth-Token': apiKey
          }
        });
        
        const data = await response.json();
        setFixtures(data.matches || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching team fixtures:', err);
        setError('Failed to load upcoming matches');
        setLoading(false);
      }
    };

    fetchTeamFixtures();
  }, [team, apiKey]);

  if (!team) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="team-header">
            <img src={team.crest} alt={`${team.name} logo`} className="team-modal-logo" />
            <h2>{team.name} - Upcoming Matches</h2>
          </div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {loading && (
            <div className="modal-loading">
              <div className="spinner"></div>
            </div>
          )}
          
          {error && <div className="modal-error">{error}</div>}
          
          {!loading && !error && fixtures.length === 0 && (
            <div className="no-fixtures">No upcoming matches scheduled</div>
          )}
          
          {!loading && !error && fixtures.length > 0 && (
            <div className="fixtures-list">
              {fixtures.map(match => (
                <div key={match.id} className="fixture-card">
                  <div className="fixture-date">
                    {new Date(match.utcDate).toLocaleDateString()} - {new Date(match.utcDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  <div className="fixture-teams">
                    <div className="home-team">
                      <img src={match.homeTeam.crest} alt={`${match.homeTeam.name} logo`} className="fixture-team-logo" />
                      <span>{match.homeTeam.name}</span>
                    </div>
                    <div className="fixture-vs">vs</div>
                    <div className="away-team">
                      <img src={match.awayTeam.crest} alt={`${match.awayTeam.name} logo`} className="fixture-team-logo" />
                      <span>{match.awayTeam.name}</span>
                    </div>
                  </div>
                  <div className="fixture-competition">
                    {match.competition.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Dynamic Background Component
const DynamicBackground = ({ darkMode }) => {
  return (
    <div className={`dynamic-background ${darkMode ? 'dark-bg' : 'light-bg'}`}>
      <div className="champions-league-pattern"></div>
      <div className="starball starball-1"></div>
      <div className="starball starball-2"></div>
      <div className="starball starball-3"></div>
      <div className="starball starball-4"></div>
      <div className="pitch-overlay"></div>
    </div>
  );
};

const FootballStandings = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [competitions, setCompetitions] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [apiKey, setApiKey] = useState(process.env.REACT_APP_FOOTBALL_API_KEY);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  // Fetch available competitions on initial load
  useEffect(() => {
    const fetchCompetitions = () => {
      fetch('https://cors-anywhere.herokuapp.com/https://api.football-data.org/v4/competitions/', {
        headers: {
          'X-Auth-Token': apiKey
        }
      })
        .then(response => response.json())
        .then(data => {
          const topLeagues = ['PL', 'PD', 'BL1', 'SA', 'FL1', 'CL'];
          const filteredCompetitions = data.competitions
            .filter(comp => topLeagues.includes(comp.code))
            .map(comp => ({
              id: comp.code,
              name: comp.name,
              country: comp.area.name
            }));
          
          setCompetitions(filteredCompetitions);
        })
        .catch(err => {
          setError('Failed to load competitions. Please try again later.');
          console.error(err);
        })
        .finally(() => {
          setLoading(false);
        });
    };
  
    fetchCompetitions();
  }, [apiKey]);
  
  const fetchStandings = (competitionId) => {
    setLoading(true);
    setError(null);
  
    fetch(`https://cors-anywhere.herokuapp.com/https://api.football-data.org/v4/competitions/${competitionId}/standings/`, {
      headers: {
        'X-Auth-Token': apiKey
      }
    })
      .then(response => response.json())
      .then(data => {
        const standings = data.standings[0].table;
        setStandings(standings);
  
        const competition = competitions.find(comp => comp.id === competitionId);
        setSelectedCompetition(competition);
      })
      .catch(err => {
        setError('Failed to load standings. Please try again later.');
        console.error('Error fetching standings:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleTeamClick = (team) => {
    setSelectedTeam(team);
  };
  
  const closeFixturesModal = () => {
    setSelectedTeam(null);
  };
  
  return (
    <>
      <DynamicBackground darkMode={darkMode} />
      <div className="container">
        <div className="content-wrapper">
          <header className="app-header">
            <div className="header-left">
              <h1>⚽ Football League Standings</h1>
              <p>Choose a competition to view the current table, click on each team for more info!</p>
            </div>
            <div className="header-right">
              <button onClick={() => setDarkMode(!darkMode)} className="dark-mode-toggle">
                {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
              </button>
            </div>
          </header>

          <div className="card">
            {/* Competition Selector */}
            <div className="competition-section">
              <h2>Select Competition</h2>
              <div className="competition-grid">
                {competitions.map((competition) => (
                  <button
                    key={competition.id}
                    onClick={() => fetchStandings(competition.id)}
                    className={`competition-button ${
                      selectedCompetition?.id === competition.id
                        ? 'competition-button-active'
                        : ''
                    }`}
                  >
                    <div className="competition-name">{competition.name}</div>
                    <div className="competition-country">{competition.country}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="loading-container">
                <div className="spinner"></div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {/* Standings Table */}
            {!loading && selectedCompetition && standings.length > 0 && (
              <div className="standings-section">
                <h2>
                  {selectedCompetition.name} Standings
                </h2>
                <div className="table-container">
                  <table className="standings-table">
                    <thead>
                      <tr>
                        <th>Pos</th>
                        <th>Team</th>
                        <th className="center">MP</th>
                        <th className="center">W</th>
                        <th className="center">D</th>
                        <th className="center">L</th>
                        <th className="center">GF</th>
                        <th className="center">GA</th>
                        <th className="center">GD</th>
                        <th className="center">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((row) => (
                        <tr key={row.team.id} onClick={() => handleTeamClick(row.team)} className="team-row">
                          <td className="position-cell">{row.position}</td>
                          <td>
                            <div className="team-cell">
                              <img 
                                src={row.team.crest} 
                                alt={`${row.team.name} logo`} 
                                className="team-logo" 
                              />
                              {row.team.name}
                            </div>
                          </td>
                          <td className="center">{row.playedGames}</td>
                          <td className="center">{row.won}</td>
                          <td className="center">{row.draw}</td>
                          <td className="center">{row.lost}</td>
                          <td className="center">{row.goalsFor}</td>
                          <td className="center">{row.goalsAgainst}</td>
                          <td className="center">{row.goalDifference}</td>
                          <td className="center points-cell">{row.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="table-helper-text">
                    Click on any team to view their upcoming matches
                  </div>
                </div>
              </div>
            )}

            {/* Top Scorers Section - Add this new section below standings */}
            {!loading && selectedCompetition && standings.length > 0 && (
              <TopScorers 
                competitionId={selectedCompetition.id} 
                apiKey={apiKey} 
              />
            )}

            {/* Empty State */}
            {!loading && !error && !selectedCompetition && (
              <div className="empty-state">
                <div className="empty-state-icon">🏆</div>
                <p>Select a competition above to view standings</p>
              </div>
            )}
          </div>

          <footer>
            <p>Data provided by football-data.org API</p>
            <p>Click on any team to see their upcoming fixtures</p>
          </footer>
        </div>
        
        {/* Chatbot Component */}
        <FootballChatbot apiKey={apiKey} />
        
        {selectedTeam && (
          <TeamFixturesModal 
            team={selectedTeam} 
            onClose={closeFixturesModal}
            apiKey={apiKey}
          />
        )}
      </div>
    </>
  );
};

export default FootballStandings;
import React, { useState, useRef, useEffect } from 'react';
import './App.css';

// Chatbot Component
const FootballChatbot = ({ apiKey }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hi! I can help with football information. Try asking about fixtures, team stats, or league standings.' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to the bottom when new messages appear
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputText.trim()) return;
    
    // Add user message to chat
    const userMessage = { type: 'user', text: inputText };
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input and show loading state
    setInputText('');
    setIsLoading(true);
    
    try {
      // Process the user's question and generate a response
      const botResponse = await generateResponse(inputText, apiKey);
      setMessages(prev => [...prev, { type: 'bot', text: botResponse }]);
    } catch (error) {
      console.error('Error generating response:', error);
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: 'Sorry, I encountered an error while fetching that information. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to process queries and fetch data from API
  const generateResponse = async (query, apiKey) => {
    const lowerQuery = query.toLowerCase();
    
    // Extract potential team names from the query
    const teamMatches = lowerQuery.match(/\b(manchester united|manchester city|liverpool|chelsea|arsenal|tottenham|real madrid|barcelona|bayern|juventus|milan|inter|psg)\b/g);
    const teamName = teamMatches ? teamMatches[0] : null;
    
    // Extract potential league names from the query
    const leagueMatches = lowerQuery.match(/\b(premier league|la liga|bundesliga|serie a|ligue 1)\b/g);
    const leagueName = leagueMatches ? leagueMatches[0] : null;

    // Map common league names to their API codes
    const leagueCodes = {
      'premier league': 'PL',
      'la liga': 'PD',
      'bundesliga': 'BL1',
      'serie a': 'SA',
      'ligue 1': 'FL1'
    };

    try {
      // Handle queries about fixtures/matches for a specific team
      if (teamName && (lowerQuery.includes('fixtures') || lowerQuery.includes('matches') || lowerQuery.includes('schedule') || lowerQuery.includes('playing'))) {
        // First, find the team ID
        const teamSearchResponse = await fetch(`https://cors-anywhere.herokuapp.com/https://api.football-data.org/v4/teams?name=${encodeURIComponent(teamName)}`, {
          headers: {
            'X-Auth-Token': apiKey
          }
        });
        
        const teamData = await teamSearchResponse.json();
        
        if (!teamData.teams || teamData.teams.length === 0) {
          return `I couldn't find a team called "${teamName}". Please check the team name and try again.`;
        }
        
        const teamId = teamData.teams[0].id;
        
        // Then fetch the fixtures
        const fixturesResponse = await fetch(`https://cors-anywhere.herokuapp.com/https://api.football-data.org/v4/teams/${teamId}/matches?status=SCHEDULED&limit=5`, {
          headers: {
            'X-Auth-Token': apiKey
          }
        });
        
        const fixturesData = await fixturesResponse.json();
        
        if (!fixturesData.matches || fixturesData.matches.length === 0) {
          return `${teamName} doesn't have any upcoming matches scheduled.`;
        }
        
        // Format the response
        let response = `Here are the upcoming matches for ${teamName}:\n\n`;
        
        fixturesData.matches.forEach((match, index) => {
          const matchDate = new Date(match.utcDate);
          response += `${index + 1}. ${match.homeTeam.name} vs ${match.awayTeam.name}\n`;
          response += `   📅 ${matchDate.toLocaleDateString()} at ${matchDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}\n`;
          response += `   🏆 ${match.competition.name}\n\n`;
        });
        
        return response;
      }
      
      // Handle queries about league standings
      else if (leagueName && (lowerQuery.includes('standings') || lowerQuery.includes('table') || lowerQuery.includes('ranking'))) {
        const leagueCode = leagueCodes[leagueName];
        
        if (!leagueCode) {
          return `I don't have information for ${leagueName}. I can provide data for Premier League, La Liga, Bundesliga, Serie A, and Ligue 1.`;
        }
        
        const standingsResponse = await fetch(`https://cors-anywhere.herokuapp.com/https://api.football-data.org/v4/competitions/${leagueCode}/standings`, {
          headers: {
            'X-Auth-Token': apiKey
          }
        });
        
        const standingsData = await standingsResponse.json();
        
        if (!standingsData.standings || !standingsData.standings[0] || !standingsData.standings[0].table) {
          return `I couldn't retrieve the standings for ${leagueName}. Please try again later.`;
        }
        
        // Format the response for top 5 teams
        let response = `Here are the current top 5 teams in ${leagueName}:\n\n`;
        
        standingsData.standings[0].table.slice(0, 5).forEach((team, index) => {
          response += `${team.position}. ${team.team.name} - ${team.points} points\n`;
          response += `   W: ${team.won}, D: ${team.draw}, L: ${team.lost}, GD: ${team.goalDifference}\n\n`;
        });
        
        response += `For the full table, please check the standings section.`;
        
        return response;
      }
      
      // Handle team stats queries
      else if (teamName && (lowerQuery.includes('stats') || lowerQuery.includes('statistics') || lowerQuery.includes('record'))) {
        // Find the team ID
        const teamSearchResponse = await fetch(`https://cors-anywhere.herokuapp.com/https://api.football-data.org/v4/teams?name=${encodeURIComponent(teamName)}`, {
          headers: {
            'X-Auth-Token': apiKey
          }
        });
        
        const teamData = await teamSearchResponse.json();
        
        if (!teamData.teams || teamData.teams.length === 0) {
          return `I couldn't find a team called "${teamName}". Please check the team name and try again.`;
        }
        
        const teamId = teamData.teams[0].id;
        
        // Get the league info for this team
        const leagueMatches = ['PL', 'PD', 'BL1', 'SA', 'FL1'].map(async (leagueCode) => {
          try {
            const res = await fetch(`https://cors-anywhere.herokuapp.com/https://api.football-data.org/v4/competitions/${leagueCode}/standings`, {
              headers: {
                'X-Auth-Token': apiKey
              }
            });
            
            const data = await res.json();
            
            if (data.standings && data.standings[0] && data.standings[0].table) {
              const teamInfo = data.standings[0].table.find(t => t.team.id === teamId);
              if (teamInfo) {
                return { leagueCode, leagueName: data.competition.name, teamInfo };
              }
            }
            return null;
          } catch (e) {
            return null;
          }
        });
        
        const results = await Promise.all(leagueMatches);
        const teamLeagueInfo = results.find(r => r !== null);
        
        if (!teamLeagueInfo) {
          return `I couldn't find current league statistics for ${teamName}.`;
        }
        
        const { teamInfo, leagueName } = teamLeagueInfo;
        
        return `Here are ${teamName}'s current stats in ${leagueName}:\n\n` +
               `Position: ${teamInfo.position}\n` +
               `Points: ${teamInfo.points}\n` +
               `Matches played: ${teamInfo.playedGames}\n` +
               `Won: ${teamInfo.won}, Drawn: ${teamInfo.draw}, Lost: ${teamInfo.lost}\n` +
               `Goals scored: ${teamInfo.goalsFor}, Goals conceded: ${teamInfo.goalsAgainst}\n` +
               `Goal difference: ${teamInfo.goalDifference}`;
      }
      
      // General information about available leagues
      else if (lowerQuery.includes('leagues') || lowerQuery.includes('competitions')) {
        return "I can provide information on these football leagues:\n\n" +
               "1. Premier League (England)\n" +
               "2. La Liga (Spain)\n" +
               "3. Bundesliga (Germany)\n" +
               "4. Serie A (Italy)\n" +
               "5. Ligue 1 (France)\n\n" +
               "You can ask me about their standings or about specific teams.";
      }
      
      // Help message for unclear queries
      else {
        return "I can help you with football information! Try asking me about:\n\n" +
               "• Team fixtures (e.g., 'What are the upcoming matches for Liverpool?')\n" +
               "• League standings (e.g., 'Show me the Premier League table')\n" +
               "• Team stats (e.g., 'What are Arsenal's stats this season?')\n\n" +
               "I have data for Premier League, La Liga, Bundesliga, Serie A, and Ligue 1.";
      }
    } catch (error) {
      console.error('Error generating response:', error);
      return "Sorry, I encountered an error while processing your question. Please try again later.";
    }
  };

  return (
    <div className="chatbot-container">
      {/* Chatbot toggle button */}
      <button className="chatbot-toggle" onClick={toggleChatbot}>
        {isOpen ? '✕' : '💬'}
      </button>
      
      {/* Chatbot window */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h3>⚽ Football Assistant</h3>
          </div>
          
          <div className="chatbot-messages">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.type}`}>
                <div className="message-bubble">
                  {message.text.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < message.text.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="message bot">
                <div className="message-bubble">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          <form className="chatbot-input" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder="Ask about football matches, teams, leagues..."
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !inputText.trim()}>
              {isLoading ? '...' : '➤'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default FootballChatbot;
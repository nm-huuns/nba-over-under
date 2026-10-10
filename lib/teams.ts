import type { Team } from "./types";

// NOP is the only team where our ID doesn't map directly to ESPN's abbreviation
const ESPN_ABBREV: Record<string, string> = { NOP: "no", UTA: "utah" };

export function teamLogoUrl(id: string): string {
  const abbrev = ESPN_ABBREV[id] ?? id.toLowerCase();
  return `https://a.espncdn.com/i/teamlogos/nba/500/${abbrev}.png`;
}

export const TEAMS: Team[] = [
  // Eastern Conference
  { id: "ATL", name: "Atlanta Hawks",         conference: "East", line: null },
  { id: "BOS", name: "Boston Celtics",         conference: "East", line: null },
  { id: "BKN", name: "Brooklyn Nets",          conference: "East", line: null },
  { id: "CHA", name: "Charlotte Hornets",      conference: "East", line: null },
  { id: "CHI", name: "Chicago Bulls",          conference: "East", line: null },
  { id: "CLE", name: "Cleveland Cavaliers",    conference: "East", line: null },
  { id: "DET", name: "Detroit Pistons",        conference: "East", line: null },
  { id: "IND", name: "Indiana Pacers",         conference: "East", line: null },
  { id: "MIA", name: "Miami Heat",             conference: "East", line: null },
  { id: "MIL", name: "Milwaukee Bucks",        conference: "East", line: null },
  { id: "NYK", name: "New York Knicks",        conference: "East", line: null },
  { id: "ORL", name: "Orlando Magic",          conference: "East", line: null },
  { id: "PHI", name: "Philadelphia 76ers",     conference: "East", line: null },
  { id: "TOR", name: "Toronto Raptors",        conference: "East", line: null },
  { id: "WAS", name: "Washington Wizards",     conference: "East", line: null },
  // Western Conference
  { id: "DAL", name: "Dallas Mavericks",       conference: "West", line: null },
  { id: "DEN", name: "Denver Nuggets",         conference: "West", line: null },
  { id: "GSW", name: "Golden State Warriors",  conference: "West", line: null },
  { id: "HOU", name: "Houston Rockets",        conference: "West", line: null },
  { id: "LAC", name: "LA Clippers",            conference: "West", line: null },
  { id: "LAL", name: "Los Angeles Lakers",     conference: "West", line: null },
  { id: "MEM", name: "Memphis Grizzlies",      conference: "West", line: null },
  { id: "MIN", name: "Minnesota Timberwolves", conference: "West", line: null },
  { id: "NOP", name: "New Orleans Pelicans",   conference: "West", line: null },
  { id: "OKC", name: "Oklahoma City Thunder",  conference: "West", line: null },
  { id: "PHX", name: "Phoenix Suns",           conference: "West", line: null },
  { id: "POR", name: "Portland Trail Blazers", conference: "West", line: null },
  { id: "SAC", name: "Sacramento Kings",       conference: "West", line: null },
  { id: "SAS", name: "San Antonio Spurs",      conference: "West", line: null },
  { id: "UTA", name: "Utah Jazz",              conference: "West", line: null },
];

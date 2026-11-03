/**
 * Respostas usadas pelo ClanHub, alinhadas à API oficial
 * https://api.clashofclans.com/v1
 *
 * Os enums abaixo são os valores JSON em camelCase dos nomes
 * documentados (por exemplo MEMBER → "member", NOT_IN_WAR → "notInWar").
 * "warEnded" também aparece na guerra normal.
 */

/**
 * O schema publicado deixa `badgeUrls` e `iconUrls` sem campos.
 * As respostas trazem estas URLs quando o ícone existe.
 */
export type ClashIconUrls = {
  small?: string;
  medium?: string;
  large?: string;
};

export type ClashLeague = {
  id: number;
  name: string;
  iconUrls?: ClashIconUrls;
};

/**
 * GET /leaguetiers
 * O id da liga ranqueada atual também aparece em `leagueTier` do jogador.
 */
export type ClashLeagueTier = ClashLeague;

/**
 * GET /players/{playerTag}/leaguehistory
 * Cada item é uma semana da liga ranqueada. Não traz ataques de guerra do clã.
 * `leagueSeasonId` chega como instante Unix, em segundos.
 */
export type ClashPlayerLeagueSeason = {
  leagueSeasonId: number;
  leagueTrophies: number;
  leagueTierId: number;
  placement: number;
  attackWins: number;
  attackLosses: number;
  attackStars: number;
  defenseWins: number;
  defenseLosses: number;
  defenseStars: number;
  maxBattles: number;
};

export type ClashPlayerLeagueHistory = {
  items?: ClashPlayerLeagueSeason[];
};

export type ClashLocation = {
  id: number;
  name: string;
  localizedName?: string;
  isCountry?: boolean;
  countryCode?: string;
};

export type ClashLabel = {
  id: number;
  name: string;
  iconUrls?: ClashIconUrls;
};

export type ClashClanRole =
  "notMember" | "member" | "admin" | "coLeader" | "leader";

export type ClashClanType = "open" | "inviteOnly" | "closed";

export type ClashWarFrequency =
  | "unknown"
  | "always"
  | "moreThanOncePerWeek"
  | "oncePerWeek"
  | "lessThanOncePerWeek"
  | "never"
  | "any";

export type ClashBuilderBaseLeague = {
  id: number;
  name: string;
};

export type ClashPlayerHouseElementType = "ground" | "roof" | "foot" | "deco";

export type ClashPlayerHouse = {
  elements?: Array<{
    id: number;
    type: ClashPlayerHouseElementType;
  }>;
};

export type ClashClanMember = {
  tag: string;
  name: string;
  role: ClashClanRole;
  townHallLevel: number;
  expLevel: number;
  league?: ClashLeague;
  leagueTier?: ClashLeague;
  trophies: number;
  builderBaseTrophies?: number;
  builderBaseLeague?: ClashBuilderBaseLeague;
  clanRank: number;
  previousClanRank: number;
  donations: number;
  donationsReceived: number;
  playerHouse?: ClashPlayerHouse;
};

export type ClashClan = {
  tag: string;
  name: string;
  type: ClashClanType;
  description: string;
  location?: ClashLocation;
  isFamilyFriendly?: boolean;
  isWarLogPublic: boolean;
  clanLevel: number;
  clanPoints: number;
  clanBuilderBasePoints?: number;
  clanCapitalPoints?: number;
  requiredTrophies: number;
  requiredBuilderBaseTrophies?: number;
  requiredTownhallLevel?: number;
  warFrequency: ClashWarFrequency;
  warWinStreak: number;
  warWins: number;
  warTies: number;
  warLosses: number;
  members: number;
  warLeague?: ClashLeague;
  capitalLeague?: ClashLeague;
  labels?: ClashLabel[];
  chatLanguage?: {
    id: number;
    name: string;
    languageCode: string;
  };
  clanCapital?: {
    capitalHallLevel: number;
    districts?: Array<{
      id: number;
      name: string;
      districtHallLevel: number;
    }>;
  };
  badgeUrls: ClashIconUrls;
  memberList?: ClashClanMember[];
};

/**
 * A introdução da API mostra `paging.after` e `paging.before`.
 * Respostas também trazem os mesmos marcadores em `paging.cursors`.
 */
export type ClashPaging = {
  after?: string;
  before?: string;
  cursors?: {
    after?: string;
    before?: string;
  };
};

export type ClashPage<T> = {
  items: T[];
  paging?: ClashPaging;
};

export type ClashListQuery = {
  limit?: number;
  after?: string;
  before?: string;
};

export type ClashWarAttack = {
  order: number;
  attackerTag: string;
  defenderTag: string;
  stars: number;
  destructionPercentage: number;
  duration: number;
};

export type ClashWarMember = {
  tag: string;
  name: string;
  mapPosition: number;
  townhallLevel: number;
  opponentAttacks: number;
  attacks?: ClashWarAttack[];
  bestOpponentAttack?: ClashWarAttack;
};

export type ClashWarClan = {
  tag?: string;
  name?: string;
  badgeUrls?: ClashIconUrls;
  clanLevel?: number;
  attacks?: number;
  stars?: number;
  destructionPercentage?: number;
  expEarned?: number;
  members?: ClashWarMember[];
};

export type ClashBattleModifier = "none" | "hardMode";

export type ClashWarState =
  | "clanNotFound"
  | "accessDenied"
  | "notInWar"
  | "inMatchmaking"
  | "enterWar"
  | "matched"
  | "preparation"
  | "war"
  | "inWar"
  | "ended"
  | "warEnded";

export type ClashCurrentWar = {
  state: ClashWarState;
  teamSize?: number;
  attacksPerMember?: number;
  battleModifier?: ClashBattleModifier;
  preparationStartTime?: string;
  startTime?: string;
  endTime?: string;
  warStartTime?: string;
  clan?: ClashWarClan;
  opponent?: ClashWarClan;
};

/**
 * GET /clans/{clanTag}/currentwar/leaguegroup
 * O enum publicado lista WAR; a resposta também usa "inWar".
 * Rodadas ainda não preparadas trazem a tag "#0".
 */
export type ClashLeagueGroupState =
  "groupNotFound" | "notInWar" | "preparation" | "war" | "inWar" | "ended";

export type ClashLeagueClanMember = {
  tag: string;
  name: string;
  townHallLevel: number;
};

export type ClashLeagueClan = {
  tag: string;
  name: string;
  clanLevel: number;
  badgeUrls?: ClashIconUrls;
  members?: ClashLeagueClanMember[];
};

export type ClashLeagueRound = {
  warTags: string[];
};

export type ClashLeagueGroup = {
  tag?: string;
  state: ClashLeagueGroupState;
  season?: string;
  clans?: ClashLeagueClan[];
  rounds?: ClashLeagueRound[];
};

export type ClashWarResult = "win" | "lose" | "tie";

export type ClashWarLogEntry = {
  result?: ClashWarResult;
  endTime: string;
  teamSize: number;
  attacksPerMember?: number;
  battleModifier?: ClashBattleModifier;
  clan: ClashWarClan;
  opponent: ClashWarClan;
};

export type ClashWarLog = ClashPage<ClashWarLogEntry>;

export type ClashClanMemberList = ClashPage<ClashClanMember>;

export type ClashApiErrorBody = {
  reason?: string;
  message?: string;
  type?: string;
  detail?: unknown;
};

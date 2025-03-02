/* betSuggestion.js */
import { roundBetSize, getNextBetMartingale, getNextBetFibonacci, getNextBetPadovan } from "./helpers.js";
import { getMaxGapGroup } from "./gapCounters.js";

// Exportera progression-variabler
export let consecutiveLosses = 0;
export let currentBet = {
  betType: null, // "line" eller "column"
  betTarget: null,
  betSize: 0
};

export function initBetSuggestion() {
  // Om du vill initiera UI för bet-suggestion, gör det här.
}

export function updateBetSuggestion(params) {
  const {
    selectedNumbers,
    bankroll,
    stakeStyle,
    baseBet,
    basePercent,
    roundingFactor,
    betProgression,
    tableType,
    lineGroups,
    columnGroups,
    bettingActive,
    elements
  } = params;
  // elements: { suggestedBetDisplay, betSizeDisplay, progressionStepDisplay, winProbabilityDisplay }

  if (selectedNumbers.length < 5) {
    elements.suggestedBetDisplay.textContent = "Not enough spins yet...";
    elements.betSizeDisplay.textContent = "N/A";
    elements.progressionStepDisplay.textContent = "N/A";
    updateWinProbability(params);
    return;
  }
  if (!bettingActive) {
    elements.suggestedBetDisplay.textContent = "Betting is OFF";
    elements.betSizeDisplay.textContent = "0";
    elements.progressionStepDisplay.textContent = "N/A";
    updateWinProbability(params);
    return;
  }

  // Välj den grupp med högst gap
  const bestLine = getMaxGapGroup(lineGroups, selectedNumbers);
  const bestColumn = getMaxGapGroup(columnGroups, selectedNumbers);
  if (bestLine.gap >= bestColumn.gap) {
    currentBet.betType = "line";
    currentBet.betTarget = bestLine.name;
  } else {
    currentBet.betType = "column";
    currentBet.betTarget = bestColumn.name;
  }

  // Basinsats
  let baseStake = (stakeStyle === "fixed")
    ? baseBet
    : Math.floor((bankroll * basePercent) / 100);
  if (baseStake < 1) baseStake = 1;

  // Räkna ut nästa bet storlek
  let nextBet = 0;
  if (consecutiveLosses === 0) {
    nextBet = baseStake;
  } else {
    if (betProgression === "martingale") {
      nextBet = getNextBetMartingale(consecutiveLosses, baseStake);
    } else if (betProgression === "fibonacci") {
      nextBet = getNextBetFibonacci(consecutiveLosses, baseStake);
    } else {
      nextBet = getNextBetPadovan(consecutiveLosses, baseStake);
    }
  }
  nextBet = roundBetSize(nextBet, roundingFactor);
  currentBet.betSize = nextBet;

  // Uppdatera UI
  elements.suggestedBetDisplay.textContent = `${currentBet.betTarget} (${currentBet.betType})`;
  elements.betSizeDisplay.textContent = currentBet.betSize.toString();
  elements.progressionStepDisplay.textContent = consecutiveLosses.toString();

  updateWinProbability(params);
}

export function updateWinProbability(params) {
  const { selectedNumbers, tableType, lineGroups, columnGroups, elements } = params;
  if (selectedNumbers.length < 5) {
    elements.winProbabilityDisplay.textContent = "N/A";
    return;
  }
  const bestLine = getMaxGapGroup(lineGroups, selectedNumbers);
  const bestColumn = getMaxGapGroup(columnGroups, selectedNumbers);
  let gap = 0;
  let baseProbability = 0;
  if (bestLine.gap >= bestColumn.gap) {
    gap = bestLine.gap;
    baseProbability = tableType === "european" ? 6/37 : 6/38;
  } else {
    gap = bestColumn.gap;
    baseProbability = tableType === "european" ? 12/37 : 12/38;
  }
  const winProb = 1 - Math.pow(1 - baseProbability, gap + 1);
  elements.winProbabilityDisplay.textContent = (winProb * 100).toFixed(1) + "%";
}

// gapCounters.js - Funktioner för line och column gaps

// Beräknar gap (antal spins sedan senaste vinst) för en given grupp
export function getGroupGap(groupArray, targetName, selectedNumbers) {
  const group = groupArray.find(g => g.name === targetName);
  if (!group) return 0;
  let lastIndex = -1;
  for (let i = selectedNumbers.length - 1; i >= 0; i--) {
    if (group.numbers.includes(selectedNumbers[i])) {
      lastIndex = i;
      break;
    }
  }
  return lastIndex === -1 ? selectedNumbers.length : selectedNumbers.length - lastIndex - 1;
}

// Returnerar den grupp i groupArray med högst gap
export function getMaxGapGroup(groupArray, selectedNumbers) {
  let bestGroup = { name: "", gap: -1 };
  groupArray.forEach(group => {
    const gap = getGroupGap(groupArray, group.name, selectedNumbers);
    if (gap > bestGroup.gap) {
      bestGroup = { name: group.name, gap };
    }
  });
  return bestGroup;
}

// Uppdaterar line gaps i ett givet element
export function updateLineCounters(lineGroups, selectedNumbers, targetElement) {
  let html = "<h3>Line Gaps</h3>";
  lineGroups.forEach(group => {
    const gap = getGroupGap(lineGroups, group.name, selectedNumbers);
    html += `<p>${group.name}: ${gap} spin(s) since win</p>`;
  });
  targetElement.innerHTML = html;
}

// Uppdaterar column gaps i ett givet element
export function updateColumnCounters(columnGroups, selectedNumbers, targetElement) {
  let html = "<h3>Column Gaps</h3>";
  columnGroups.forEach(group => {
    const gap = getGroupGap(columnGroups, group.name, selectedNumbers);
    html += `<p>${group.name}: ${gap} spin(s) since win</p>`;
  });
  targetElement.innerHTML = html;
}

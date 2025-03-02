/* gapCounters.js */
export function updateLineCounters(lineGroups, selectedNumbers, targetElement) {
  let html = "<h3>Line Gaps</h3>";
  lineGroups.forEach(group => {
    const gap = getGroupGap(lineGroups, group.name, selectedNumbers);
    html += `<p>${group.name}: ${gap} spin(s) since win</p>`;
  });
  targetElement.innerHTML = html;
}

export function updateColumnCounters(columnGroups, selectedNumbers, targetElement) {
  let html = "<h3>Column Gaps</h3>";
  columnGroups.forEach(group => {
    const gap = getGroupGap(columnGroups, group.name, selectedNumbers);
    html += `<p>${group.name}: ${gap} spin(s) since win</p>`;
  });
  targetElement.innerHTML = html;
}

export function updateDoubleStreetCounters(doubleStreetGroups, selectedNumbers, targetElement) {
  let html = "<h3>Double Street Gaps</h3>";
  doubleStreetGroups.forEach(group => {
    const gap = getGroupGap(doubleStreetGroups, group.name, selectedNumbers);
    html += `<p>${group.name}: ${gap} spin(s) since win</p>`;
  });
  targetElement.innerHTML = html;
}

export function updateSingleStreetCounters(singleStreetGroups, selectedNumbers, targetElement) {
  let html = "<h3>Single Street Gaps</h3>";
  singleStreetGroups.forEach(group => {
    const gap = getGroupGap(singleStreetGroups, group.name, selectedNumbers);
    html += `<p>${group.name}: ${gap} spin(s) since win</p>`;
  });
  targetElement.innerHTML = html;
}


export function updateDozenCounters(dozenGroups, selectedNumbers, targetElement) {
  let html = "<h3>Dozen Gaps</h3>";
  dozenGroups.forEach(group => {
    const gap = getGroupGap(dozenGroups, group.name, selectedNumbers);
    html += `<p>${group.name}: ${gap} spin(s) since win</p>`;
  });
  targetElement.innerHTML = html;
}

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
  return lastIndex === -1 ? selectedNumbers.length : (selectedNumbers.length - lastIndex - 1);
}

export function getMaxGapGroup(groupArray, selectedNumbers) {
  let best = { name: "", gap: -1 };
  groupArray.forEach(g => {
    const gap = getGroupGap(groupArray, g.name, selectedNumbers);
    if (gap > best.gap) {
      best = { name: g.name, gap };
    }
  });
  return best;
}

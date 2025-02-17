// heatmap.js - Funktioner för att rita heatmap

// Returnerar antal gånger ett nummer förekommer
export function getNumberFrequencies(selectedNumbers, tableType) {
  const frequencies = {};
  const possibleNumbers = [];
  if (tableType === "european") {
    possibleNumbers.push("0");
    for (let i = 1; i <= 36; i++) {
      possibleNumbers.push(i.toString());
    }
  } else {
    possibleNumbers.push("0", "00");
    for (let i = 1; i <= 36; i++) {
      possibleNumbers.push(i.toString());
    }
  }
  possibleNumbers.forEach(num => frequencies[num] = 0);
  selectedNumbers.forEach(num => {
    if (frequencies[num] !== undefined) frequencies[num]++;
  });
  return frequencies;
}

// Färgfunktion för heatmap
export function getColorForCount(count) {
  if (count === 0) return "#fff";
  if (count === 1) return "#ffcccc";
  if (count === 2) return "#ff9999";
  if (count >= 3) return "#ff6666";
  return "#fff";
}

// Skapa en cell med heatmap-färg och border (röd/svart/grön)
export function createRouletteCell(num, freq, redNumbers) {
  const cell = document.createElement("td");
  cell.textContent = num;
  cell.classList.add("heatmap-cell");
  cell.style.backgroundColor = getColorForCount(freq);
  if (num === "0" || num === "00") {
    cell.classList.add("green-cell");
  } else if (redNumbers.includes(num)) {
    cell.classList.add("red-cell");
  } else {
    cell.classList.add("black-cell");
  }
  return cell;
}

// Visar standard-roulettet i en tabell
export function displayStandardTable(frequencies, tableType, redNumbers) {
  const table = document.createElement("table");
  table.className = "table table-sm table-bordered text-center w-auto mx-auto roulette-table";
  if (tableType === "european") {
    const row0 = document.createElement("tr");
    const cell0 = createRouletteCell("0", frequencies["0"], redNumbers);
    cell0.colSpan = 3;
    row0.appendChild(cell0);
    table.appendChild(row0);
    for (let i = 0; i < 12; i++) {
      const row = document.createElement("tr");
      for (let j = 0; j < 3; j++) {
        const num = (i * 3 + j + 1).toString();
        const cell = createRouletteCell(num, frequencies[num], redNumbers);
        row.appendChild(cell);
      }
      table.appendChild(row);
    }
  } else {
    const row0 = document.createElement("tr");
    const cell0 = createRouletteCell("0", frequencies["0"], redNumbers);
    row0.appendChild(cell0);
    const cell00 = createRouletteCell("00", frequencies["00"], redNumbers);
    cell00.colSpan = 2;
    row0.appendChild(cell00);
    table.appendChild(row0);
    for (let i = 0; i < 12; i++) {
      const row = document.createElement("tr");
      for (let j = 0; j < 3; j++) {
        const num = (i * 3 + j + 1).toString();
        const cell = createRouletteCell(num, frequencies[num], redNumbers);
        row.appendChild(cell);
      }
      table.appendChild(row);
    }
  }
  return table;
}

// Visar racetrack-layout
export function displayRacetrack(frequencies, tableType) {
  const racetrackDiv = document.createElement("div");
  racetrackDiv.className = "d-flex flex-wrap justify-content-center";
  let wheelOrder = [];
  if (tableType === "european") {
    wheelOrder = [
      "0", "32", "15", "19", "4", "21", "2", "25", "17", "34", "6", "27",
      "13", "36", "11", "30", "8", "23", "10", "5", "24", "16", "33", "1",
      "20", "14", "31", "9", "22", "18", "29", "7", "28", "12", "35", "3", "26"
    ];
  } else {
    wheelOrder = [
      "0", "28", "9", "26", "30", "11", "7", "20", "32", "17", "5", "22",
      "34", "15", "3", "24", "36", "13", "1", "00", "27", "10", "25", "29",
      "12", "8", "19", "31", "18", "6", "21", "4", "2", "23", "35", "14", "16"
    ];
  }
  wheelOrder.forEach(num => {
    const box = document.createElement("div");
    box.textContent = num;
    box.style.width = "40px";
    box.style.height = "40px";
    box.style.display = "flex";
    box.style.justifyContent = "center";
    box.style.alignItems = "center";
    box.style.margin = "2px";
    box.style.border = "1px solid #000";
    box.style.borderRadius = "4px";
    box.style.backgroundColor = getColorForCount(frequencies[num] || 0);
    racetrackDiv.appendChild(box);
  });
  return racetrackDiv;
}

// Huvudfunktion för att visa heatmap (standard eller racetrack)
export function displayHeatmap(layoutType, selectedNumbers, tableType, redNumbers) {
  const frequencies = getNumberFrequencies(selectedNumbers, tableType);
  if (layoutType === "standard") {
    return displayStandardTable(frequencies, tableType, redNumbers);
  } else {
    return displayRacetrack(frequencies, tableType);
  }
}

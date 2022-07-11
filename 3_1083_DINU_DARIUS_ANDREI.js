"use strict";

const listYears = [
  "2004",
  "2005",
  "2006",
  "2007",
  "2008",
  "2009",
  "2010",
  "2011",
  "2012",
  "2013",
  "2014",
  "2015",
  "2016",
  "2017",
  "2018",
];

const listYearsNumber = [
  2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016,
  2017, 2018,
];

let table = document.querySelector("tbody");
let listCountries = [];
let listPopulations = [];
let listSVs = [];
let listPIB = [];
let listIndicatorCountry = [];
let yearToDisplay;

const fisier = "media/eurostat.json";
let data = [];

// Preluare date in functie de an --> Pentru Tabel
async function getYearlyDataFromJSON(year) {
  let response = await fetch(fisier);
  data = await response.json(); // Preluare date din json
  let i = 0;
  for (const x in data) {
    // Parcurgere lista de date
    if (data[i].an == year) {
      if (!listCountries.includes(data[i].tara)) {
        listCountries.push(data[i].tara);
      }
      // In functie de indicatorul gasit se va popula lista aferenta
      // pentru anul selectat
      if (data[i].indicator === "POP") listPopulations.push(data[i].valoare);
      else if (data[i].indicator === "SV") listSVs.push(data[i].valoare);
      else if (data[i].indicator === "PIB") listPIB.push(data[i].valoare);
    }
    i++;
  }
  initialTable();
  colorTable();
  // Golire liste dupa fiecare afisare
  listPopulations = [];
  listSVs = [];
  listPIB = [];
}

// Preluare date in functie de an --> Pentru Chart
async function getChartDataFromJSON(year) {
  let response = await fetch(fisier);
  data = await response.json(); // Preluare date din json
  let i = 0;
  for (const x in data) {
    if (data[i].an == year) {
      if (!listCountries.includes(data[i].tara)) {
        listCountries.push(data[i].tara);
      }
      // In functie de indicatorul gasit se va popula lista aferenta
      // pentru anul selectat
      if (data[i].indicator === "POP") listPopulations.push(data[i].valoare);
      else if (data[i].indicator === "SV") listSVs.push(data[i].valoare);
      else if (data[i].indicator === "PIB") listPIB.push(data[i].valoare);
    }
    i++;
  }
  desenareChartPIB();
  desenareChartPOP();
  desenareChartSV();
  // Golire liste dupa fiecare afisare
  listPopulations = [];
  listSVs = [];
  listPIB = [];
}

// Preluare date in functie de tara
async function getCountryDataFromJSON(country, indicator) {
  let response = await fetch(fisier);
  data = await response.json(); // Preluare date din json
  let i = 0;
  for (const x in data) {
    // Parcurgere lista de date
    // Vrem ultimii 15 ani --> [2004,2018]
    if (data[i].tara == country && data[i].an >= 2004) {
      if (data[i].indicator === indicator) {
        listIndicatorCountry.push(data[i].valoare);
      }
    }
    i++;
  }
  desennareGraficSVG();
  // Golire lista date pentru a putea permite o noua accesare
  listIndicatorCountry = [];
}

// Creare tabel
function initialTable() {
  table.innerHTML = ""; //Golire tabel
  for (let i = 0; i < 27; i++) {
    let row = document.createElement("tr"); //Creare rand in tabel
    table.appendChild(row); // Adaugare rand in tabel
    // Creare celule
    let celula1 = document.createElement("td");
    let celula2 = document.createElement("td");
    let celula3 = document.createElement("td");
    let celula4 = document.createElement("td");
    // Adaugare date + formatare celule
    celula1.innerText = listCountries[i];
    celula1.style.backgroundColor = "rgba(255, 255, 255, 0.35)";
    celula1.style.color = "#464646";
    celula2.innerText = listSVs[i];
    celula2.style.color = "#464646";
    celula3.innerText = listPopulations[i];
    celula3.style.color = "#464646";
    celula4.innerText = listPIB[i];
    celula4.style.color = "#464646";
    // Adaugare celule in tabel
    row.append(celula1);
    row.append(celula2);
    row.append(celula3);
    row.append(celula4);
  }
}

//Functie care calculeaza media pentru un set de date
function mean(list) {
  let sum = 0;
  for (let i = 1; i < list.length; i++) {
    sum = sum + Number(list[i]);
  }
  return (sum / list.length).toFixed(2);
}

function colorTable() {
  // Valorile medii pentru fiecare indicator
  let meanSV = mean(listSVs);
  let meanPOP = mean(listPopulations);
  let meanPIB = mean(listPIB);

  // Am normalizat datele din liste pentru a lucra cu valori mai mici in vederea
  // stabilirii valorilor RGB --> [0,255]

  // Listele modulelor diferentelor (Indicator - MedieIndicator)
  let normalisedListSV = listSVs.map((SV) => Math.abs(SV - meanSV));
  let normalisedListPOP = listPopulations.map((POP) => Math.abs(POP - meanPOP));
  let normalisedListPIB = listPIB.map((PIB) => Math.abs(PIB - meanPIB));

  // Vom folosi media valorilor (in locul valorii maxime)
  // pentru a evita problemele cauzate de o eventuala valoare extrema

  // Media fiecarei liste de diferente
  let meanNorSV = mean(normalisedListSV);
  let meanNorPOP = mean(normalisedListPOP);
  let meanNorPIB = mean(normalisedListPIB);

  let red = 255;
  let green = 255;

  /*
  ----------------------------Colorarea tabelului----------------------------
  Pentru fiecare tara vom prelucra valorile indicatorilor si le vom
  atribui o culoare in functie de distanta fata de media Uniunii
  ---------------------------------------------------------------------------
  -> In listele normalizate avem valorile diferenelor
     -> Acestea sunt cuprinse in intervalul [0, dmax]
     -> 0 reprezinta verdele absolut RGB(0,255,0)
     -> dmax reprezinta rosul absolut RGB(255,0,0)
  -> Consideram media ca fiind valoarea de mijloc, deci pentru valorile 
     care se afla in jurul mediei, culoarea celulei va fi aproximativ RGB(255,255,0)

    Fie m = media valorilor din fiecare lista normalizata iar d = valoarea unei diferente dintr-o lista
  --> Pentru d din [0, m] vom pastra constanta cantiatea de verde si vom modifica rosul
      -> Pentru cantitatea de rosu avem nevoie de o functie crescatoare, dorind sa ajungem de la 
         verde la galben
        -> Pe masura ce ne apropiem de galben, valoarea R (red) trebuie sa creasca
        -> Rosul va avea valorea (255*d)/m, reprezentand o valoare intre 0 si 255
      -> Verdele ramane constant la 255
      OBS! Cand d == m se va obtine galben => RBG(255,255,0)

  --> Pentru d din [m,dmax] vom pastra constanta cantitatea de rosu si vom modifica verdele
      -> Rosul va ramane constant la 255
        -> Pentru cantitatea de verde avem nevoie de o functie descrescatoare, dorind sa ajungem de la 
        galben la rosu
        -> Pe masura ce ne apropiem de rosu, valoarea G (green) trebuie sa scada
      -> Verdele va avea valoarea 255*(2-d/m), reprezentand o valoare intre 0 si 255
      OBS! Cand d == m se va obtine galben => 255*(2-1) = 255 => RBG(255,255,0)
  */
  for (let i = 0; i < listCountries.length; i++) {
    // Pentru SV:
    if (normalisedListSV[i] < meanNorSV) {
      red = (255 * normalisedListSV[i]) / meanNorSV;
      table.rows[i].cells[1].style.backgroundColor = `rgba(${red},255,0, 0.35)`;
    } else {
      green = 255 * (2 - normalisedListSV[i] / meanNorSV);
      table.rows[
        i
      ].cells[1].style.backgroundColor = `rgba(255,${green},0, 0.35)`;
    }

    // Pentru POP:
    if (normalisedListPOP[i] < meanNorPOP) {
      red = (255 * normalisedListPOP[i]) / meanNorPOP;
      table.rows[i].cells[2].style.backgroundColor = `rgba(${red},255,0, 0.35)`;
    } else {
      green = 255 * (2 - normalisedListPOP[i] / meanNorPOP);
      table.rows[
        i
      ].cells[2].style.backgroundColor = `rgba(255,${green},0, 0.35)`;
    }

    // Pentru PIB:
    if (normalisedListPIB[i] < meanNorPIB) {
      red = (255 * normalisedListPIB[i]) / meanNorPIB;
      table.rows[i].cells[3].style.backgroundColor = `rgba(${red},255,0, 0.35)`;
    } else {
      green = 255 * (2 - normalisedListPIB[i] / meanNorPIB);
      table.rows[
        i
      ].cells[3].style.backgroundColor = `rgba(255,${green},0, 0.35)`;
    }
  }

  // Ultimul rand din tabela va avea valoriile medii pentru fiecare indicator

  // Creare rand
  let row = document.createElement("tr");
  table.appendChild(row);
  // Creare celule
  let celula1 = document.createElement("td");
  let celula2 = document.createElement("td");
  let celula3 = document.createElement("td");
  let celula4 = document.createElement("td");
  // Introducere date in celule
  celula1.innerText = "Media";
  celula2.innerText = meanSV;
  celula3.innerText = meanPOP;
  celula4.innerText = meanPIB;
  // Adaugare celule la tabel
  row.append(celula1);
  row.append(celula2);
  row.append(celula3);
  row.append(celula4);
  //Formatare celule
  row.style.backgroundColor = "rgba(255, 255, 255, 0.35)";
  row.style.fontWeight = "bold";
  row.style.color = "#266867";
}

function desenareChartPIB() {
  // Valorile medii pentru fiecare tara
  let meanPIB = mean(listPIB);

  // Listele normalizate pentru fiecare indicator
  let normalisedListPIB = listPIB.map((PIB) => Math.abs(PIB - meanPIB));

  // Media fiecarei liste normalizate
  let meanNorPIB = mean(normalisedListPIB);

  let red = 255;
  let green = 255;

  // Preluare canvas
  let canvasPIB = document.getElementById("ChartPIB");
  let W = canvasPIB.width;
  let H = canvasPIB.height;
  let context = canvasPIB.getContext("2d");

  // Golire canvas
  context.clearRect(0, 0, canvasPIB.width, canvasPIB.height);

  context.textAlign = "center";
  context.textBaseline = "middle";

  let n = listCountries.length;
  let w = W / n;
  let f = (0.9 * H) / Math.max.apply(null, listPIB);

  for (let i = 0; i < n; i++) {
    let hi = listPIB[i] * f;
    let xi = 0.2 * w + i * w;
    let yi = H - hi;

    let r = listPIB[i] / 500;

    // Stabilire culoare de umplere a cercului
    if (normalisedListPIB[i] < meanNorPIB) {
      red = (255 * normalisedListPIB[i]) / meanNorPIB;
      context.fillStyle = `rgba(${red}, 255, 0, 0.35)`;
    } else {
      green = 255 * (2 - normalisedListPIB[i] / meanNorPIB);
      context.fillStyle = `rgba(255,${green},0, 0.35)`;
    }

    // Creare bubble
    context.beginPath();
    context.moveTo(xi, yi);
    context.arc(xi, yi, r, 0, 2 * Math.PI);
    context.fill();

    // Desenare + colorare margine
    context.beginPath();
    context.arc(xi, yi, r, 0, 2 * Math.PI);
    if (normalisedListPIB[i] < meanNorPIB) {
      red = (255 * normalisedListPIB[i]) / meanNorPIB;
      context.strokeStyle = `rgba(${red}, 255, 0, 1)`;
    } else {
      green = 255 * (2 - normalisedListPIB[i] / meanNorPIB);
      context.strokeStyle = `rgba(255,${green},0, 1)`;
    }

    // Desenare nume tara in mijlocul fiecarui cerc
    context.stroke();
    context.fillStyle = "black";
    context.fillText(listCountries[i].toString(), xi, yi);
    context.font = "bold 18pt Arial";
    context.fillText(yearToDisplay, W * 0.95, 30);
  }
}

function desenareChartPOP() {
  // Valorile medii pentru fiecare tara
  let meanPOP = mean(listPopulations);

  // Listele normalizate pentru fiecare indicator
  let normalisedListPOP = listPopulations.map((POP) => Math.abs(POP - meanPOP));

  // Media fiecarei liste normalizate
  let meanNorPOP = mean(normalisedListPOP);

  let red = 255;
  let green = 255;

  // Preluare canvas
  let canvasPOP = document.getElementById("ChartPOP");
  let W = canvasPOP.width;
  let H = canvasPOP.height;
  let context = canvasPOP.getContext("2d");

  // Golire canvas
  context.clearRect(0, 0, canvasPOP.width, canvasPOP.height);

  context.textAlign = "center";
  context.textBaseline = "middle";
  let n = listCountries.length;
  let w = W / n;
  let f = (0.9 * H) / Math.max.apply(null, listPopulations);

  for (let i = 0; i < n; i++) {
    let hi = listPopulations[i] * f;
    let xi = 0.2 * w + i * w;
    let yi = H - hi;

    let r = listPopulations[i] / 200000;

    // Stabilire culoare de umplere a cercului
    if (normalisedListPOP[i] < meanNorPOP) {
      red = (255 * normalisedListPOP[i]) / meanNorPOP;
      context.fillStyle = `rgba(${red}, 255, 0, 0.35)`;
    } else {
      green = 255 * (2 - normalisedListPOP[i] / meanNorPOP);
      context.fillStyle = `rgba(255,${green},0, 0.35)`;
    }

    // Creare bubble
    context.beginPath();
    context.moveTo(xi, yi);
    context.arc(xi, yi, r, 0, 2 * Math.PI);
    context.fill();

    // Desenare + colorare margine
    context.beginPath();
    context.arc(xi, yi, r, 0, 2 * Math.PI);
    if (normalisedListPOP[i] < meanNorPOP) {
      red = (255 * normalisedListPOP[i]) / meanNorPOP;
      context.strokeStyle = `rgba(${red}, 255, 0, 1)`;
    } else {
      green = 255 * (2 - normalisedListPOP[i] / meanNorPOP);
      context.strokeStyle = `rgba(255,${green},0, 1)`;
    }

    // Desenare nume tara in mijlocul fiecarui cerc
    context.stroke();
    context.fillStyle = "black";
    context.fillText(listCountries[i].toString(), xi, yi);
    context.font = "bold 18pt Arial";
    context.fillText(yearToDisplay, W * 0.95, 30);
  }
}

function desenareChartSV() {
  // Valorile medii pentru fiecare indicator
  let meanSV = mean(listSVs);

  // Listele normalizate pentru fiecare indicator
  let normalisedListSV = listSVs.map((SV) => Math.abs(SV - meanSV));

  // Media fiecarei liste normalizate
  let meanNorSV = mean(normalisedListSV);

  let red = 255;
  let green = 255;

  let canvasSV = document.getElementById("ChartSV");
  let W = canvasSV.width;
  let H = canvasSV.height;
  let context = canvasSV.getContext("2d");

  // Golire canvas
  context.clearRect(0, 0, canvasSV.width, canvasSV.height);

  context.textAlign = "center";
  context.textBaseline = "middle";
  let n = listCountries.length;
  let w = W / n;
  let f = (0.9 * H) / Math.max.apply(null, listSVs);

  for (let i = 0; i < n; i++) {
    let hi = listSVs[i] * f;
    let xi = 0.2 * w + i * w;
    let yi = H * 1.1 - hi;

    let r = listSVs[i];

    // Stabilire culoare de umplere a cercului
    if (normalisedListSV[i] < meanNorSV) {
      red = (255 * normalisedListSV[i]) / meanNorSV;
      context.fillStyle = `rgba(${red}, 255, 0, 0.35)`;
    } else {
      green = 255 * (2 - normalisedListSV[i] / meanNorSV);
      context.fillStyle = `rgba(255,${green},0, 0.35)`;
    }

    // Creare bubble
    context.beginPath();
    context.moveTo(xi, yi);
    context.arc(xi, yi, r, 0, 2 * Math.PI);
    context.fill();

    // Desenare + colorare margine
    context.beginPath();
    context.arc(xi, yi, r, 0, 2 * Math.PI);
    if (normalisedListSV[i] < meanNorSV) {
      red = (255 * normalisedListSV[i]) / meanNorSV;
      context.strokeStyle = `rgba(${red}, 255, 0, 1)`;
    } else {
      green = 255 * (2 - normalisedListSV[i] / meanNorSV);
      context.strokeStyle = `rgba(255,${green},0, 1)`;
    }

    // Desenare nume tara in mijlocul fiecarui cerc
    context.stroke();
    context.fillStyle = "black";
    context.fillText(listCountries[i].toString(), xi, yi);
    context.font = "bold 18pt Arial";
    context.fillText(yearToDisplay, W * 0.95, 30);
  }
}

function desennareGraficSVG() {
  const svgTable = document.getElementById("TableSVG"); // Preluare element SVG

  // Golire spatiu SVG
  while (svgTable.lastChild) {
    svgTable.removeChild(svgTable.lastChild);
  }

  // Preluare intaltime si latime SVG
  let H = svgTable.height.baseVal.value;
  let W = svgTable.width.baseVal.value;
  const w = (W * 0.9) / listIndicatorCountry.length;
  const f = (H * 0.9) / Math.max.apply(null, listIndicatorCountry);

  // Parcurgere lista de valori pentru indicatorul selectat
  for (let i = 0; i < listIndicatorCountry.length; i++) {
    // Creare dreptunghi SVG
    let newRect = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    // Creare element de tip text
    let text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.textContent = listYears[i];

    // Stabilire inaltime, latime, coordonate pentru fiecare element al histogramei
    let height = listIndicatorCountry[i] * f;
    let x = 1.1 * i * w;
    let y = H - height;
    newRect.setAttribute("x", x); // Coordonata x
    newRect.setAttribute("y", y); // Coordonata y
    newRect.setAttribute("width", w); // Latimea
    newRect.setAttribute("height", height); //Inaltimea
    newRect.setAttribute("fill", "rgba(38,104,103,0.9)"); //Culoarea
    svgTable.appendChild(newRect); // Adaugare dreptunghi
    //Formatare text
    text.setAttribute("font-weight", "bold");
    x += w / 4;
    y -= 10;
    text.setAttribute("x", x); // Coordonata x pentru text
    text.setAttribute("y", y); // Coordonata y pentru text
    text.setAttribute("fill", "white"); // Culoarea textului
    svgTable.appendChild(text); // Adaugare text
  }
}

function aplicatie() {
  const selectTabel = document.getElementById("selectTabel"); // Preluare select tabel
  const selectGrafic = document.getElementById("selectGrafic"); // Preluare select grafic

  const canvasSV = document.getElementById("ChartSV"); // Canvas SV
  const canvasPIB = document.getElementById("ChartPIB"); // Canvas PIB
  const canvasPOP = document.getElementById("ChartPOP"); // Canvas POP

  const fullTable = document.getElementById("table"); // Preluare tabel
  const svgTable = document.getElementById("TableSVG"); // Preluare spatiu SVG

  // Ascundere Tabel + Select-uri
  selectTabel.classList.toggle("hidden");
  selectGrafic.classList.toggle("hidden");
  fullTable.classList.toggle("hidden");

  // Ascundere canvas-uri
  canvasSV.classList.toggle("hidden");
  canvasPOP.classList.toggle("hidden");
  canvasPIB.classList.toggle("hidden");

  // Ascundere spatiu SVG
  svgTable.classList.toggle("hidden");

  // Preluare butoane
  const btnTabel = document.getElementById("btnTabel");
  const btnChart = document.getElementById("btnChart");
  const btnGrafic = document.getElementById("btnGrafic");

  // Butoane pentru Chart
  const btnPIB = document.getElementById("btnPIB");
  const btnPOP = document.getElementById("btnPOP");
  const btnSV = document.getElementById("btnSV");

  // Butoane pentru SVG
  const btnPIBsvg = document.getElementById("btnPIBsvg");
  const btnPOPsvg = document.getElementById("btnPOPsvg");
  const btnSVsvg = document.getElementById("btnSVsvg");

  // Ascundere butoane Chart
  btnPIB.classList.toggle("hidden");
  btnPOP.classList.toggle("hidden");
  btnSV.classList.toggle("hidden");

  // Ascundere butoane SVG
  btnPIBsvg.classList.toggle("hidden");
  btnPOPsvg.classList.toggle("hidden");
  btnSVsvg.classList.toggle("hidden");

  // Actiune pentru butonul "Afisare tabel"
  btnTabel.addEventListener("click", function () {
    selectTabel.classList.toggle("hidden"); // Afisare select pentru tabel
    fullTable.classList.toggle("hidden"); // Afisare tabel
    selectTabel.addEventListener("change", function () {
      let year = selectTabel.value; // Preluare an selectat din select
      getYearlyDataFromJSON(year); // Apelare funtie de preluare a datelor
    });
  });

  // Actiune pentru butonul "Afisare Chart"
  btnChart.addEventListener("click", function () {
    btnPIB.classList.toggle("hidden"); // Afisare buton "PIB"
    btnPOP.classList.toggle("hidden"); // Afisare buton "POP"
    btnSV.classList.toggle("hidden"); // Afisare buton "SV"
  });

  // Actiune pentru butonul "SV"
  btnSV.addEventListener("click", function () {
    canvasSV.classList.toggle("hidden"); // Afisare canvas
    let year = 0; // contor pentru an
    let i = 1; // contor pentru numarul de ani
    yearToDisplay = 0; // anul care va fi afisat pe ecran

    // Se va afisa chart-ul actualizat pentru fiecare an la un
    // interval de 300 ms
    const interval = setInterval(() => {
      year = (year + 1) % 15;
      i++;
      yearToDisplay = year + 2004;

      getChartDataFromJSON(year + 2004); // Apelare functie de desenare Chart
      // Dupa ce trec cei 15 ani se va opri afisarea
      if (i === 15) {
        clearInterval(interval);
      }
    }, 300);

    // Ascundere canvas-uri pentru PIB si POP
    // la apasarea butonului "SV"
    if (!canvasPIB.classList.contains("hidden")) {
      canvasPIB.classList.toggle("hidden");
    }
    if (!canvasPOP.classList.contains("hidden")) {
      canvasPOP.classList.toggle("hidden");
    }
  });

  // Actiune pentru butonul "POP"
  btnPOP.addEventListener("click", function () {
    canvasPOP.classList.toggle("hidden"); // Afisare canvas
    let year = 0; // contor pentru an
    let j = 1; // contor pentru numarul de ani
    yearToDisplay = 0; // anul care va fi afisat pe ecran

    // Se va afisa chart-ul actualizat pentru fiecare an la un
    // interval de 300 ms
    const interval = setInterval(() => {
      year = (year + 1) % 15;
      yearToDisplay = year + 2004;
      j++;

      getChartDataFromJSON(year + 2004); // Apelare functie de desenare Chart
      // Dupa ce trec cei 15 ani se va opri afisarea
      if (j === 15) {
        clearInterval(interval);
      }
    }, 300);

    // Ascundere canvas-uri pentru PIB si SV
    // la apasarea butonului "POP"
    if (!canvasPIB.classList.contains("hidden")) {
      canvasPIB.classList.toggle("hidden");
    }
    if (!canvasSV.classList.contains("hidden")) {
      canvasSV.classList.toggle("hidden");
    }
  });

  // Actiune pentru butonul "PIB"
  btnPIB.addEventListener("click", function () {
    canvasPIB.classList.toggle("hidden"); // Afisare canvas
    let year = 0; // contor pentru an
    yearToDisplay = 0; // anul care va fi afisat pe ecran
    let k = 1; // contor pentru numarul de ani

    // Se va afisa chart-ul actualizat pentru fiecare an la un
    // interval de 300 ms
    const interval = setInterval(() => {
      year = (year + 1) % 15;
      yearToDisplay = year + 2004;
      k++;

      getChartDataFromJSON(year + 2004); // Apelare functie de desenare Chart
      // Dupa ce trec cei 15 ani se va opri afisarea
      if (k === 15) {
        clearInterval(interval);
      }
    }, 300);

    // Ascundere canvas-uri pentru SV si POP
    // la apasarea butonului "PIB"
    if (!canvasSV.classList.contains("hidden")) {
      canvasSV.classList.toggle("hidden");
    }
    if (!canvasPOP.classList.contains("hidden")) {
      canvasPOP.classList.toggle("hidden");
    }
  });

  // Actiune pentru butonul "Afisare Grafic"
  btnGrafic.addEventListener("click", function () {
    btnPIBsvg.classList.toggle("hidden"); // Afisare buton "PIB"
    btnPOPsvg.classList.toggle("hidden"); // Afisare buton "POP"
    btnSVsvg.classList.toggle("hidden"); // Afisare buton "SV"
    selectGrafic.classList.toggle("hidden"); // Afisare select
  });

  // Actiune pentru select-ul corespunzator Graficului
  selectGrafic.addEventListener("change", function () {
    let country = selectGrafic.value; // Preluare valoare selectata

    // La apasarea unuia din butoanele "PIB", "SV" sau "POP"
    // se va apela functia de desenare a graficului SVG in funtcie
    // de indicatorul ales

    btnPOPsvg.addEventListener("click", function () {
      getCountryDataFromJSON(country, "POP");
      svgTable.classList.toggle("hidden");
    });

    btnSVsvg.addEventListener("click", function () {
      getCountryDataFromJSON(country, "SV");
      svgTable.classList.toggle("hidden");
    });

    btnPIBsvg.addEventListener("click", function () {
      getCountryDataFromJSON(country, "PIB");
      svgTable.classList.toggle("hidden");
    });
  });
}

document.addEventListener("DOMContentLoaded", aplicatie);

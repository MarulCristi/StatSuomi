let savedMunicipalityCode = localStorage.getItem('selectedMunicipalityCode');
let savedMunicipalityName = localStorage.getItem('selectedMunicipality');

if (savedMunicipalityCode === "SSS") {
  savedMunicipalityName = "Finland"
}


let chart1Type = localStorage.getItem('savedChartType') || 'bar'
let chart2Type = localStorage.getItem('savedChart2Type') || 'bar';
let chart3Type = localStorage.getItem('savedChart3Type') || 'bar';
let chart4Type = localStorage.getItem('savedChart4Type') || 'bar';


let expandChart2 = localStorage.getItem('expandedChart2') === 'true';
let expandChart3 = localStorage.getItem('expandedChart3') === 'true';
let expandChart4 = localStorage.getItem('expandedChart4') === 'true';

const jsonQuery =
{
  "query": [
    {
      "code": "Vuosi",
      "selection": {
        "filter": "item",
        "values": [
          "1990", "1991", "1992", "1993", "1994", "1995", 
          "1996", "1997", "1998", "1999", "2000", "2001", 
          "2002", "2003", "2004", "2005", "2006", "2007", 
          "2008", "2009", "2010", "2011", "2012", "2013", 
          "2014", "2015", "2016", "2017", "2018", "2019", 
          "2020", "2021", "2022", "2023", "2024"
        ]
      }
    },
    {
      "code": "Alue",
      "selection": {
        "filter": "item",
        "values": [
            savedMunicipalityCode // This will be the selected municipality code
        ]
      }
    },
    {
      "code": "Tiedot",
      "selection": {
        "filter": "item",
        "values": [
            "vm01",     // Live births
            "vm11",     // Deaths
            "vm41",     // Immigration to Finland
            "vm42",     // Emigration from Finland
            "vm4142",   // Net migration (immigration minus emigration)
            "vm2126",   // Marriages 
            "vm3136",   // Divorces
            "vaesto"    // Total population
        ]
      }
    }
  ],
  "response": {
    "format": "json-stat2"
  }
}

const getData = async () => {
    
    const url1 = "https://statfin.stat.fi:443/PxWeb/api/v1/en/StatFin/ssaaty/statfin_ssaaty_pxt_121w.px"
    const res = await fetch(url1, {
          method: "POST",
          headers: {"content-type": "application/json"},
          body: JSON.stringify(jsonQuery)
    })
      
    if(!res.ok) {
          return;
    }
    statData = await res.json()
    console.log(statData);

    return statData
}

let changed = false;
let chart2Changed = false;

const buildChart = async () => {
    const data = await getData();

    const cityName = document.querySelector('.city-title');
    cityName.textContent = savedMunicipalityName;

    const select = document.getElementById('municipalities');
    const allMunicipalities = localStorage.getItem('allMunicipalities');

    if (allMunicipalities) {
        const municipalities = JSON.parse(allMunicipalities)

        select.innerHTML = '';

        const defaultOption = document.createElement('option');
        defaultOption.text = 'Select another municipality...';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        select.appendChild(defaultOption);

        municipalities.forEach(municipality => {
            const option = document.createElement('option');
            option.value = municipality.code;
            option.textContent = municipality.name;
            select.appendChild(option);
          
        });

        select.addEventListener('change', (event) => { // YOU CAN CHANGE MUNICIPALITY AND DATA GETS UPDATED
            const selectedCode = event.target.value;
            const selectedName = event.target.selectedOptions[0].textContent;
            if (selectedCode) {
              localStorage.setItem('selectedMunicipalityCode', selectedCode);
              localStorage.setItem('selectedMunicipality', selectedName)

              savedMunicipalityCode = selectedCode;
              location.reload(); // PAGE GETS RELOADED
            }
        });
    }


    const years = Object.values(data.dimension.Vuosi.category.label)
    const values = data.value;
    const metricsPerYear = 8;
    const yearCount = years.length;

    const births = [];
    const deaths = [];
    const vitals = [];

    const population = [];

    const immigration = [];
    const emigration = [];
    const migration = [];

    const marriages = [];
    const divorces = [];
    const families = [];

    for (let yearIndex = 0; yearIndex < yearCount; yearIndex++) {
        const baseIndex = yearIndex * metricsPerYear;
        
        births.push(values[baseIndex + 0]);     // vm01
        deaths.push(values[baseIndex + 1]);     // vm11  
        immigration.push(values[baseIndex + 2]); // vm41
        emigration.push(values[baseIndex + 3]);  // vm42
        migration.push(values[baseIndex + 4]);   // vm4142
        marriages.push(values[baseIndex + 5]);   // vm2126
        divorces.push(values[baseIndex + 6]);    // vm3136
        population.push(values[baseIndex + 7]);  // vaesto
    }

    for (let i = 0; i < yearCount; i++) { // get Net Values
        vitals.push(births[i] - deaths[i]);
        families.push(marriages[i] - divorces[i])

    }


    function formatNumber(num) {
        if (num > 0) {
            return '+' + num;
        } else {
            return num;
        }
    }




// CHART 1 (Vitals)







    let visibleDatasets = {
      births: true,
      deaths: true
    }

    let newDataset;

    if(!changed) {
      newDataset = [
          {
              name: "Births",
              values: births,
          },
          {
              name: "Deaths",
              values: deaths
          }
      ];
    }

    let title1;
    let color;

    const initialBirths = births[0]
    const finalBirths = births[births.length - 1];
    const birthsGrowth = ((finalBirths - initialBirths) / Math.abs(initialBirths || 1)) * 100;


    const initialDeaths = deaths[0]
    const finalDeaths = deaths[deaths.length - 1];
    const deathsGrowth = ((finalDeaths - initialDeaths) / Math.abs(initialDeaths || 1)) * 100;


    const initialVitals = vitals[0]
    const finalVitals = vitals[vitals.length - 1];
    const vitalsGrowth = ((finalVitals - initialVitals) / Math.abs(initialVitals || 1)) * 100;



    function updateChart1() {
        document.getElementById('chart').innerHTML = '';
        if(!changed) {
          title1 = `👶 Vital Stats`
          color = ['#00c9a7', '#ff5e57']
        }

        const currentType = localStorage.getItem('savedChartType') || 'bar';
        
        vitalityChart = new frappe.Chart("#chart", {
            title: title1,
            data: {
                labels: years,
                datasets: newDataset
            },
            type: currentType,
            height: 450,
            colors: color,
        });
    }

    document.getElementById('bar1').addEventListener('click', () => {
        chart1Type = "bar"
        localStorage.setItem('savedChartType', "bar")
        updateChart1()
        location.reload(); // Frappe.charts doesn't change without reload :(
    });
    
    document.getElementById('line1').addEventListener('click', () => {
        chart1Type = "line"
        localStorage.setItem('savedChartType', "line")
        updateChart1()
        location.reload(); // Frappe.charts doesn't change without reload :(
    });

    document.getElementById('births').addEventListener('click', () => {
        changed = true;


        newDataset = [
            {
                name: "Births",
                values: births,
            }
        ];
        title1 = `👶 Birth Stats (${formatNumber(birthsGrowth.toFixed(1))}%)`;
        color = ['#00c9a7'];
        visibleDatasets.births = true;
        visibleDatasets.deaths = false;


        document.getElementById('births').classList.add('disabled-button');
        document.getElementById('births').disabled = true;

        document.getElementById('deaths').classList.remove('disabled-button');
        document.getElementById('deaths').disabled = false;

        document.getElementById('all1').classList.remove('disabled-button');
        document.getElementById('all1').disabled = false;

        document.getElementById('net1').classList.remove('disabled-button');
        document.getElementById('net1').disabled = false;

        if(document.getElementById('chartTypeBtn1').style.display == 'none') {
            document.getElementById('chartTypeBtn1').style.display = 'block';
        }

        updateChart1();
    });

    document.getElementById('deaths').addEventListener('click', () => {
        changed = true;


        newDataset = [
            {
                name: "Deaths",
                values: deaths
            }
        ];
        title1 = `⚰️ Death Stats (${formatNumber(deathsGrowth.toFixed(1))}%)`;
        color = ['#ff5e57'];
        visibleDatasets.births = false;
        visibleDatasets.deaths = true;


        document.getElementById('deaths').classList.add('disabled-button');
        document.getElementById('deaths').disabled = true;

        document.getElementById('births').classList.remove('disabled-button');
        document.getElementById('births').disabled = false;

        document.getElementById('all1').classList.remove('disabled-button');
        document.getElementById('all1').disabled = false;

        document.getElementById('net1').classList.remove('disabled-button');
        document.getElementById('net1').disabled = false;

        if(document.getElementById('chartTypeBtn1').style.display == 'none') {
            document.getElementById('chartTypeBtn1').style.display = 'block';
        }

        updateChart1();
    });

    document.getElementById('all1').addEventListener('click', () => {
        changed = true;

        // Show both
        newDataset = [
            {
                name: "Births",
                values: births
            },
            {
                name: "Deaths",
                values: deaths
            }
        ];
        title1 = `🧍 Vital Stats`;
        color = ['#00c9a7', '#ff5e57'];
        visibleDatasets.births = true;
        visibleDatasets.deaths = true;

        document.getElementById('all1').classList.add('disabled-button');
        document.getElementById('all1').disabled = true;

        document.getElementById('births').classList.remove('disabled-button');
        document.getElementById('births').disabled = false;

        document.getElementById('deaths').classList.remove('disabled-button');
        document.getElementById('deaths').disabled = false;

        document.getElementById('net1').classList.remove('disabled-button');
        document.getElementById('net1').disabled = false;

        if(document.getElementById('chartTypeBtn1').style.display == 'none') {
            document.getElementById('chartTypeBtn1').style.display = 'block';
        }

        updateChart1();
    });


    updateChart1();

    document.getElementById('net1').addEventListener('click', () => {
        changed = true;
        chart1Type = "bar"
        localStorage.setItem('savedChartType', "bar")

        newDataset = [
            {
                name: "Vitals",
                values: vitals,
            }
        ];

        title1 = `📈 Vitals Evolution (${formatNumber(vitalsGrowth.toFixed(1))}%)`;
        color = ['#808080']
        
        document.getElementById('all1').classList.remove('disabled-button');
        document.getElementById('all1').disabled = false;
        
        document.getElementById('immigrations').classList.remove('disabled-button');
        document.getElementById('immigrations').disabled = false;
        
        document.getElementById('emigrations').classList.remove('disabled-button');
        document.getElementById('emigrations').disabled = false;

        document.getElementById('net1').classList.add('disabled-button');
        document.getElementById('net1').disabled = true;

        document.getElementById('chartTypeBtn1').style.display = 'none';

        updateChart1();
    });









// CHART 2 (Migration)








    const chartData2 = {
        labels: years,
        datasets: [
            {
                name: "Immigration",
                values: immigration,
            },
            {
                name: "Emigration",
                values: emigration
            }
        ]
    }

    let migrationDataset = chartData2.datasets;
    let title2 = `🧳 Migration Stats`;
    let color2 = ['#00c9a7', '#ff5e57'];

    const initialImmigration = immigration[0]
    const finalImmigration = immigration[immigration.length - 1];
    const immigrationGrowth = ((finalImmigration - initialImmigration) / Math.abs(initialImmigration || 1)) * 100;


    const initialEmigration = emigration[0]
    const finalEmigration = emigration[emigration.length - 1];
    const emigrationGrowth = ((finalEmigration - initialEmigration) / Math.abs(initialEmigration || 1)) * 100;

    const initialMigration = migration[0]
    const finalMigration = migration[migration.length - 1];
    const migrationGrowth = ((finalMigration - initialMigration) / Math.abs(initialMigration || 1)) * 100;
    
    function updateChart2() {
        document.getElementById('chart2').innerHTML = '';
        
        migrationChart = new frappe.Chart("#chart2", {
            title: title2,
            data: {
                labels: years,
                datasets: migrationDataset
            },
            type: chart2Type,
            height: 450,
            colors: color2,
        });
    }

    document.getElementById('bar2').addEventListener('click', () => {
        chart2Type = "bar";
        localStorage.setItem('savedChart2Type', "bar");
        location.reload()
        updateChart2();
    });
    
    document.getElementById('line2').addEventListener('click', () => {
        chart2Type = "line";
        localStorage.setItem('savedChart2Type', "line");
        location.reload();
        updateChart2();
    });
    
    document.getElementById('immigrations').addEventListener('click', () => {
        chart2Changed = true;
        
        migrationDataset = [
            {
                name: "Immigration",
                values: immigration,
            }
        ];
        title2 = `🛬 Immigration Stats (${formatNumber(immigrationGrowth.toFixed(1))}%)`;
        color2 = ['#00c9a7'];
        
        document.getElementById('immigrations').classList.add('disabled-button');
        document.getElementById('immigrations').disabled = true;
        
        document.getElementById('emigrations').classList.remove('disabled-button');
        document.getElementById('emigrations').disabled = false;
        
        document.getElementById('all2').classList.remove('disabled-button');
        document.getElementById('all2').disabled = false;

        if(document.getElementById('chartTypeBtn2').style.display == 'none') {
            document.getElementById('chartTypeBtn2').style.display = 'block';
        }

        setTimeout(() => {
            document.getElementById('chart2').scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
        }, 100);
        
        updateChart2();
    });
    
    document.getElementById('emigrations').addEventListener('click', () => {
        chart2Changed = true;
        
        migrationDataset = [
            {
                name: "Emigration",
                values: emigration
            }
        ];
        title2 = `🛫 Emigration Stats (${formatNumber(emigrationGrowth.toFixed(1))}%)`;
        color2 = ['#ff5e57'];
        
        document.getElementById('emigrations').classList.add('disabled-button');
        document.getElementById('emigrations').disabled = true;
        
        document.getElementById('immigrations').classList.remove('disabled-button');
        document.getElementById('immigrations').disabled = false;
        
        document.getElementById('all2').classList.remove('disabled-button');
        document.getElementById('all2').disabled = false;

        document.getElementById('net2').classList.remove('disabled-button');
        document.getElementById('net2').disabled = false;

        if(document.getElementById('chartTypeBtn2').style.display == 'none') {
            document.getElementById('chartTypeBtn2').style.display = 'block';
        }

        setTimeout(() => {
            document.getElementById('chart2').scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
        }, 100);
        
        updateChart2();
    });
    
    document.getElementById('all2').addEventListener('click', () => {
        chart2Changed = true;
        
        migrationDataset = [
            {
                name: "Immigration",
                values: immigration
            },
            {
                name: "Emigration",
                values: emigration
            }
        ];
        title2 = `🧳 Migration Stats`;
        color2 = ['#00c9a7', '#ff5e57'];
        
        document.getElementById('all2').classList.add('disabled-button');
        document.getElementById('all2').disabled = true;
        
        document.getElementById('immigrations').classList.remove('disabled-button');
        document.getElementById('immigrations').disabled = false;
        
        document.getElementById('emigrations').classList.remove('disabled-button');
        document.getElementById('emigrations').disabled = false;

        document.getElementById('net2').classList.remove('disabled-button');
        document.getElementById('net2').disabled = false;

        if(document.getElementById('chartTypeBtn2').style.display == 'none') {
            document.getElementById('chartTypeBtn2').style.display = 'block';
        }

        setTimeout(() => {
            document.getElementById('chart2').scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
        }, 100);
        
        updateChart2();
    });


    document.getElementById('net2').addEventListener('click', () => {
        chart2Changed = true;
        chart2Type = "bar"
        localStorage.setItem('savedChart2Type', "bar")
        migrationDataset = [
            {
                name: "Migration",
                values: migration
            }
        ];
        title2 = `📈 Migration Evolution (${formatNumber(migrationGrowth.toFixed(1))}%)`;
        color2 = ['#808080']
        
        document.getElementById('all2').classList.remove('disabled-button');
        document.getElementById('all2').disabled = false;
        
        document.getElementById('immigrations').classList.remove('disabled-button');
        document.getElementById('immigrations').disabled = false;
        
        document.getElementById('emigrations').classList.remove('disabled-button');
        document.getElementById('emigrations').disabled = false;

        document.getElementById('net2').classList.add('disabled-button');
        document.getElementById('net2').disabled = true;

        document.getElementById('chartTypeBtn2').style.display = 'none'

        setTimeout(() => {
            document.getElementById('chart2').scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
        }, 100);

        updateChart2();
    })

    if (expandChart2) {

        const bsCollapse = new bootstrap.Collapse(document.getElementById('chart2Container'), {
            show: true
        });

        setTimeout(() => {
            document.getElementById('chart2').scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
        }, 100);
    }

    document.getElementById('chart2Container').addEventListener('shown.bs.collapse', function() {
        updateChart2();
        
        setTimeout(() => {
            document.getElementById('chart2').scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
        }, 100);

        expandChart2 = true;
        localStorage.setItem('expandedChart2', 'true');
    });

    document.getElementById('chart2Container').addEventListener('hidden.bs.collapse', function() {
        expandChart2 = false;
        localStorage.setItem('expandedChart2', 'false');
    });








// CHART 3 (Family)









    const chartData3 = {
        labels: years,
        datasets: [
            {
                name: "Marriages",
                values: marriages,
            },
            {
                name: "Divorces",
                values: divorces
            }
        ]
    }

    let familyDataset = chartData3.datasets;
    let title3 = `👰 Family Stats`;
    let color3 = ['#00c9a7', '#ff5e57'];

    const initialMarriages = marriages[0]
    const finalMarriages = marriages[marriages.length - 1];
    const marriagesGrowth = ((finalMarriages - initialMarriages) / Math.abs(initialMarriages || 1)) * 100;


    const initialDivorces = divorces[0]
    const finalDivorces = divorces[divorces.length - 1];
    const divorcesGrowth = ((finalDivorces - initialDivorces) / Math.abs(initialDivorces || 1)) * 100;

    const initialFamily = families[0]
    const finalFamily = families[families.length - 1];
    const familyGrowth = ((finalFamily - initialFamily) / Math.abs(initialFamily || 1)) * 100;

    function updateChart3() {
        document.getElementById('chart3').innerHTML = '';
        
        familyChart = new frappe.Chart("#chart3", {
            title: title3,
            data: {
                labels: years,
                datasets: familyDataset
            },
            type: chart3Type,
            height: 450,
            colors: color3,
        });
    }

    document.getElementById('bar3').addEventListener('click', () => {
        chart3Type = "bar";
        localStorage.setItem('savedChart3Type', "bar");
        location.reload();
        updateChart3();
    });

    document.getElementById('line3').addEventListener('click', () => {
        chart3Type = "line";
        localStorage.setItem('savedChart3Type', "line");
        location.reload();
        updateChart3();
    });

    document.getElementById('marriages').addEventListener('click', () => {
        chart3Changed = true;
        
        familyDataset = [
            {
                name: "Marriages",
                values: marriages,
            }
        ];
        title3 = `💍 Marriage Stats (${formatNumber(marriagesGrowth.toFixed(1))}%)`;
        color3 = ['#00c9a7'];
        
        document.getElementById('marriages').classList.add('disabled-button');
        document.getElementById('marriages').disabled = true;
        
        document.getElementById('divorces').classList.remove('disabled-button');
        document.getElementById('divorces').disabled = false;
        
        document.getElementById('all3').classList.remove('disabled-button');
        document.getElementById('all3').disabled = false;

        document.getElementById('net3').classList.remove('disabled-button');
        document.getElementById('net3').disabled = false;

        if(document.getElementById('chartTypeBtn3').style.display == 'none') {
            document.getElementById('chartTypeBtn3').style.display = 'block';
        }

        setTimeout(() => {
            document.getElementById('chart3').scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
        }, 100);
        
        updateChart3();
    });

    document.getElementById('divorces').addEventListener('click', () => {
        chart3Changed = true;
        
        familyDataset = [
            {
                name: "Divorces",
                values: divorces
            }
        ];
        title3 = `💔 Divorce Stats (${formatNumber(divorcesGrowth.toFixed(1))}%)`;
        color3 = ['#ff5e57'];
        
        document.getElementById('divorces').classList.add('disabled-button');
        document.getElementById('divorces').disabled = true;
        
        document.getElementById('marriages').classList.remove('disabled-button');
        document.getElementById('marriages').disabled = false;
        
        document.getElementById('all3').classList.remove('disabled-button');
        document.getElementById('all3').disabled = false;

        document.getElementById('net3').classList.remove('disabled-button');
        document.getElementById('net3').disabled = false;

        if(document.getElementById('chartTypeBtn3').style.display == 'none') {
            document.getElementById('chartTypeBtn3').style.display = 'block';
        }

        setTimeout(() => {
            document.getElementById('chart3').scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
        }, 100);
        
        updateChart3();
    });

    document.getElementById('all3').addEventListener('click', () => {
        chart3Changed = true;
        
        familyDataset = [
            {
                name: "Marriages",
                values: marriages
            },
            {
                name: "Divorces",
                values: divorces
            }
        ];
        title3 = `👰 Family Stats`;
        color3 = ['#00c9a7', '#ff5e57'];
        
        document.getElementById('all3').classList.add('disabled-button');
        document.getElementById('all3').disabled = true;
        
        document.getElementById('marriages').classList.remove('disabled-button');
        document.getElementById('marriages').disabled = false;
        
        document.getElementById('divorces').classList.remove('disabled-button');
        document.getElementById('divorces').disabled = false;

        document.getElementById('net3').classList.remove('disabled-button');
        document.getElementById('net3').disabled = false;

        if(document.getElementById('chartTypeBtn3').style.display == 'none') {
            document.getElementById('chartTypeBtn3').style.display = 'block';
        }

        setTimeout(() => {
            document.getElementById('chart3').scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
        }, 100);
        
        updateChart3();
    });

    document.getElementById('net3').addEventListener('click', () => {
        chart3Changed = true;
        chart3Type = "bar"
        localStorage.setItem('savedChart3Type', "bar")
        
        familyDataset = [
            {
                name: "Family",
                values: families
            }
        ];
        title3 = `📈 Family Evolution (${formatNumber(familyGrowth.toFixed(1))}%)`;
        color3 = ['#808080']
        
        document.getElementById('all3').classList.remove('disabled-button');
        document.getElementById('all3').disabled = false;
        
        document.getElementById('marriages').classList.remove('disabled-button');
        document.getElementById('marriages').disabled = false;
        
        document.getElementById('divorces').classList.remove('disabled-button');
        document.getElementById('divorces').disabled = false;

        document.getElementById('net3').classList.add('disabled-button');
        document.getElementById('net3').disabled = true;

        document.getElementById('chartTypeBtn3').style.display == 'none'

        setTimeout(() => {
            document.getElementById('chart3').scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
        }, 100);

        updateChart3();
    });

    if (expandChart3) {
        const bsCollapse = new bootstrap.Collapse(document.getElementById('chart3Container'), {
            show: true
        });

        setTimeout(() => {
            document.getElementById('chart3').scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
        }, 100);
    }

    document.getElementById('chart3Container').addEventListener('shown.bs.collapse', function() {
        updateChart3();
        
        setTimeout(() => {
            document.getElementById('chart3').scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
        }, 100);

        expandChart3 = true;
        localStorage.setItem('expandedChart3', 'true');
    });

    document.getElementById('chart3Container').addEventListener('hidden.bs.collapse', function() {
        expandChart3 = false;
        localStorage.setItem('expandedChart3', 'false');
    });











// CHART 4 (Population)







    const chartData4 = {
        labels: years,
        datasets: [
            {
                name: "Population",
                values: population,
            }
        ]
    }

    const initialPopulation = population[0]
    const finalPopulation = population[population.length - 1];

    const populationGrowth = ((finalPopulation - initialPopulation) / initialPopulation) * 100;

    let title4 = `👥 Population Evolution (${formatNumber(populationGrowth.toFixed(1))}%)`;
    let color4 = ['#808080'];

    function updateChart4() {
        document.getElementById('chart4').innerHTML = '';
        
        populationChart = new frappe.Chart("#chart4", {
            title: title4,
            data: {
                labels: years,
                datasets: chartData4.datasets
            },
            type: chart4Type,
            height: 450,
            colors: color4,
        });
    }

    document.getElementById('bar4').addEventListener('click', () => {
        chart4Type = "bar";
        localStorage.setItem('savedChart4Type', "bar");
        location.reload();
        updateChart4();
    });

    document.getElementById('line4').addEventListener('click', () => {
        chart4Type = "line";
        localStorage.setItem('savedChart4Type', "line");
        location.reload();
        updateChart4();
    });

    if (expandChart4) {
        const bsCollapse = new bootstrap.Collapse(document.getElementById('chart4Container'), {
            show: true
        });

        setTimeout(() => {
            document.getElementById('chart4').scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
        }, 100);
    }

    document.getElementById('chart4Container').addEventListener('shown.bs.collapse', function() {
        updateChart4();
        
        setTimeout(() => {
            document.getElementById('chart4').scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
        }, 100);

        expandChart4 = true;
        localStorage.setItem('expandedChart4', 'true');
    });

    document.getElementById('chart4Container').addEventListener('hidden.bs.collapse', function() {
        expandChart4 = false;
        localStorage.setItem('expandedChart4', 'false');
    });

}









buildChart();

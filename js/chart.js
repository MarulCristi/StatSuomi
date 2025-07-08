let savedMunicipalityCode = localStorage.getItem('selectedMunicipalityCode');
let savedMunicipalityName = localStorage.getItem('selectedMunicipality');

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

const buildChart = async () => {
    const data = await getData();

    const cityName = document.querySelector('.city-title');
    cityName.textContent = savedMunicipalityName;

    const years = Object.values(data.dimension.Vuosi.category.label)
    const values = data.value;
    const metricsPerYear = 8;
    const yearCount = years.length;

    const births = [];
    const deaths = [];

    const population = [];

    const immigration = [];
    const emigration = [];
    const migration = [];

    const marriages = [];
    const divorces = [];

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

    const chartData1 = {
        labels: years,
        datasets: [
            {
                name: "Births",
                values: births,
            },
            {
                name: "Deaths",
                values: deaths
            }
        ]
    }

    const vitalityChart = new frappe.Chart("#chart", {
        title: `👶 Vital Stats`,
        data: chartData1,
        type: "bar",
        height: 450,
        colors: ['#00c9a7', '#ff5e57'],
    })

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

    let expandChart2 = false;
    
    document.getElementById('chart2Container').addEventListener('shown.bs.collapse', function() {
      if (!expandChart2) {
        const migrationChart = new frappe.Chart("#chart2", {
          title: `🧳 Migration Stats`,
          data: chartData2,
          type: "bar",
          height: 450,
          colors: ['#00c9a7', '#ff5e57'],
        });
        expandChart2 = true;
      }

    document.getElementById('chart2').scrollIntoView({ // Automatic scrolling effect
        behavior: 'smooth',
        block: 'start'
      });
    });

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

    let expandChart3 = false;
    
    document.getElementById('chart3Container').addEventListener('shown.bs.collapse', function() {
      if (!expandChart3) {
        const familyChart = new frappe.Chart("#chart3", {
          title: `👰 Family Stats`,
          data: chartData3,
          type: "bar",
          height: 450,
          colors: ['#00c9a7', '#ff5e57'],
        });
        expandChart2 = true;
      }

    document.getElementById('chart3').scrollIntoView({ // Automatic scrolling effect
        behavior: 'smooth',
        block: 'start'
      });
    });

    document.getElementById('chart3Container').addEventListener('hidden.bs.collapse', function() {
      expandChart3 = false;
    });
}

buildChart();

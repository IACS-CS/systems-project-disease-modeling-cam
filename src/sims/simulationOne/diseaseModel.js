import { shufflePopulation } from "../../lib/shufflePopulation";

/* Update this code to simulate a simple disease model! */

/* For this simulation, let's consider a simple disease that spreads through contact.
You can implement a simple model which does one of the following:

1. Model the different effects of different numbers of contacts: in my Handshake Model, two people are in 
   contact each round. What happens if you put three people in contact? Four? Five? Consider different options
   such as always putting people in contact with the people "next" to them (i.e. the people before or after them
   in line) or randomly selecting people to be in contact (just do one of these for your model).

2. Take the "handshake" simulation code as your model, but make it so you can recover from the disease. How does the
spread of the disease change when you set people to recover after a set number of days?

3. Add a "quarantine" percentage to the handshake model: if a person is infected, they have a chance of being quarantined
and not interacting with others in each round.

*/

/**
 * Authors: 
 * 
 * What we are simulating:
 * A disease spreads, people get sick, people quarantine after 50% of the population gets sick,
 * people recover and then quarantine ends when 1% of people are not sick.
 * 
 * What elements we have to add:
 * - Faster spread until 50% of the population is infected.
 * - Adjusted infection rate dynamically.
 * - Increased contact per round for faster spread.
 */

export const defaultSimulationParameters = {
  infectionChance: 70, // Increased initial infection chance for faster spread
  recoveryTime: 20, // Number of rounds before recovery
};

/* Creates your initial population. By default, we *only* track whether people
are infected. Any other attributes you want to track would have to be added
as properties on your initial individual. 

For example, if you want to track a disease which lasts for a certain number
of rounds (e.g. an incubation period or an infectious period), you would need
to add a property such as daysInfected which tracks how long they've been infected.

Similarly, if you wanted to track immunity, you would need a property that shows
whether people are susceptible or immune (i.e. susceptibility or immunity) */
export const createPopulation = (size = 1600) => {
  const population = [];
  const sideSize = Math.sqrt(size);
  for (let i = 0; i < size; i++) {
    population.push({
      id: i,
      x: (100 * (i % sideSize)) / sideSize,
      y: (100 * Math.floor(i / sideSize)) / sideSize,
      infected: false,
      daysInfected: 0, // Tracks how long a person has been infected
    });
  }
  let patientZero = population[Math.floor(Math.random() * size)];
  patientZero.infected = true;
  return population;
};

// Updates a single individual based on contacts
const updateIndividual = (person, contacts, params) => {
  if (person.infected) {
    person.daysInfected++;
    if (person.daysInfected >= params.recoveryTime) {
      person.infected = false; // Recover after set rounds
      person.daysInfected = 0;
    }
  }

  for (let contact of contacts) {
    if (contact.infected && Math.random() * 100 < params.infectionChance && !person.infected) {
      person.infected = true;
      person.daysInfected = 1;
      break; // Only need one contact to infect
    }
  }
};

// Updates the entire population each round
export const updatePopulation = (population, params) => {
  let infectedCount = population.filter(p => p.infected).length;
  let totalPopulation = population.length;
  
  let inQuarantine = infectedCount / totalPopulation >= 0.5;
  let endQuarantine = infectedCount / totalPopulation === 0.01;

  // Adjust infection chance: high at start, lower over time
  if (!inQuarantine) {
    if (infectedCount < totalPopulation * 0.5) {
      params.infectionChance = 90; // Make it very easy to spread before quarantine
    } else {
      params.infectionChance = 50; // Reduce infection rate after quarantine begins
    }
  }

  // If quarantined, just let people recover
  if (inQuarantine) {
    return population.map(person => {
      if (person.infected) {
        person.daysInfected++;
        if (person.daysInfected >= params.recoveryTime) {
          person.infected = false;
          person.daysInfected = 0;
        }
      }
      return person;
    });
  }

  if (endQuarantine) {
    inQuarantine = false;
  }

  // Spread disease: each person contacts two neighbors
  for (let i = 0; i < population.length; i++) {
    let p = population[i];
    let contacts = [
      population[(i + 1) % population.length], // Next person
      population[(i - 1 + population.length) % population.length], // Previous person
    ];
    updateIndividual(p, contacts, params);
  }

  return population;
};

// Stats to track (students can add more)
// Any stats you add here should be computed
// by Compute Stats below
export const trackedStats = [
  { label: "Total Infected", value: "infected" },
];

// Example: Compute stats (students customize)
export const computeStatistics = (population, round) => {
  let infected = population.filter(p => p.infected).length;
  return { round, infected };
};

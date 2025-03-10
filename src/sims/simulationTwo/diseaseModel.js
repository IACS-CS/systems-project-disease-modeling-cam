import { shufflePopulation } from "../../lib/shufflePopulation";
/* Update this code to simulate a simple disease model! */

/* For this simulation, you should model a *real world disease* based on some real information about it.
*
* Options are:
* - Mononucleosis, which has an extremely long incubation period.
*
* - The flu: an ideal model for modeling vaccination. The flu evolves each season, so you can model
    a new "season" of the flu by modeling what percentage of the population gets vaccinated and how
    effective the vaccine is.
* 
* - An emerging pandemic: you can model a new disease (like COVID-19) which has a high infection rate.
*    Try to model the effects of an intervention like social distancing on the spread of the disease.
*    You can model the effects of subclinical infections (people who are infected but don't show symptoms)
*    by having a percentage of the population be asymptomatic carriers on the spread of the disease.
*
* - Malaria: a disease spread by a vector (mosquitoes). You can model the effects of the mosquito population
*    (perhaps having it vary seasonally) on the spread of the disease, or attempt to model the effects of
*    interventions like bed nets or insecticides.
*
* For whatever illness you choose, you should include at least one citation showing what you are simulating
* is based on real world data about a disease or a real-world intervention.
*/

/**
 * Authors: 
 * Cam Mihir
 * What we are simulating:
 *   This simulation models an infectious disease with quarantine, an incubation period, and reinfection mechanics.
 *   It has been adjusted to recreate COVID-19.
 * 
 * What we are attempting to model from the real world:
 *   We simulate features of COVID-19:
 *     - An incubation period during which individuals are exposed but not yet infectious.
 *     - A period of active infection where patients show symptoms.
 *     - Recovery with a very low chance of reinfection.
 *     - Quarantine measures that reduce the infection rate when a threshold of active infections is reached.
 *   
 * 
 * What we are leaving out of our model:
 *   Detailed movement, demographic factors, and the full spectrum of disease severity.
 * 
 * What elements we have to add:
 *   - Tracking each individual's state: "healthy", "exposed", "infected", or "recovered".
 *   - Counters for the incubation period (daysExposed) and the infection period (daysInfected).
 *   - Quarantine mechanics that reduce the effective infection rate when active infections exceed a threshold.
 *   - Reinfection mechanics allowing recovered individuals to lose immunity (though rarely).
 * 
 * What parameters we will allow users to "tweak" to adjust the model:
 *   - infectionRate: Base chance of transmission per contact.
 *   - incubationTime: Number of simulation turns an individual remains in the exposed state.
 *   - recoveryTime: Number of simulation turns an individual remains infected before recovering.
 *   - reinfectionProbability: Chance per turn that a recovered individual loses immunity.
 *   - quarantineThreshold: Fraction of the active infected population that triggers quarantine measures.
 *   - quarantineReductionFactor: Factor to reduce the infection rate when quarantine is active.
 * 
 * In plain language, what our model does:
 *   Infected individuals spread the disease to nearby healthy ones. Once exposed, individuals undergo an incubation period
 *   before becoming infectious. After a set period of infection, they recover, though there is a very small chance they lose immunity.
 *   If enough people are actively infected, quarantine measures are activated, reducing further transmission.
 //used ChatGPT constantly to bring ideas to code 

// Default parameters -- any properties you add here
// will be passed to your disease model when it runs.
export const defaultSimulationParameters = {
  infectionRate: 0.3,             // Base chance of transmission per contact
  incubationTime: 5,              // Turns an individual remains exposed (incubation period)
  recoveryTime: 14,               // Turns an individual remains infected before recovering
  reinfectionProbability: 0.01,   // Chance per turn that a recovered person loses immunity
  quarantineThreshold: 0.1,       // Fraction of active infections to trigger quarantine
  quarantineReductionFactor: 0.3, // Factor to reduce infection rate when quarantine is active
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
      x: (100 * (i % sideSize)) / sideSize, // X-coordinate within 100 units
      y: (100 * Math.floor(i / sideSize)) / sideSize, // Y-coordinate scaled similarly
      // Updated properties for detailed simulation:
      state: "healthy",     // "healthy", "exposed", "infected", or "recovered"
      daysExposed: 0,       // Counter for how long the person has been in the exposed state
      daysInfected: 0,      // Counter for how long the person has been infected
      quarantined: false,   // Flag to indicate if the person is in quarantine
      newlyExposed: false,  // Flag to mark a person as a new case in the exposed state (for display purposes)
      newlyInfected: false, // Flag to mark a person as a new case in the infected state (for display purposes)
    });
  }
  // Infect patient zero...
  let patientZero = population[Math.floor(Math.random() * size)];
  patientZero.state = "infected";
  patientZero.daysInfected = 0;
  return population;
};

// Example: Update population (students decide what happens each turn)
export const updatePopulation = (population, params) => {
  // Determine current fraction of active (infected) individuals.
  let infectedCount = population.filter(p => p.state === "infected").length;
  let fractionInfected = infectedCount / population.length;

  // Determine effective infection rate (reduced if quarantine is active).
  let effectiveInfectionRate = params.infectionRate;
  let quarantineActive = false;
  if (fractionInfected >= params.quarantineThreshold) {
    quarantineActive = true;
    effectiveInfectionRate = params.infectionRate * params.quarantineReductionFactor;
  }

  // Attempt to infect nearby healthy individuals.
  // Increased infectionDistance to 6 to allow adjacent individuals (spaced 5 apart) to get infected.
  const infectionDistance = 6;
  let newExposures = [];
  for (let p of population) {
    if (p.state === "infected") {
      // Mark as quarantined if quarantine is active.
      p.quarantined = quarantineActive;
      // Check for healthy neighbors within the infection distance.
      for (let other of population) {
        if (other.state === "healthy") {
          let dx = p.x - other.x;
          let dy = p.y - other.y;
          let dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= infectionDistance) {
            if (Math.random() < effectiveInfectionRate) {
              if (!newExposures.includes(other)) {
                newExposures.push(other);
              }
            }
          }
        }
      }
    }
  }

  // Mark newly exposed individuals.
  newExposures.forEach(person => {
    person.state = "exposed";
    person.daysExposed = 0;
    person.newlyExposed = true;
  });

  // Update each individual's state.
  for (let p of population) {
    if (p.state === "exposed") {
      // Clear the flag for new exposure after one turn.
      if (p.newlyExposed) {
        p.newlyExposed = false;
      }
      p.daysExposed += 1;
      // Transition from exposed to infected after the incubation period.
      if (p.daysExposed >= params.incubationTime) {
        p.state = "infected";
        p.daysExposed = 0;
        p.daysInfected = 0;
        p.newlyInfected = true;
      }
    } else if (p.state === "infected") {
      // Clear the flag for new infection after one turn.
      if (p.newlyInfected) {
        p.newlyInfected = false;
      }
      p.daysInfected += 1;
      // Check if the individual recovers.
      if (p.daysInfected >= params.recoveryTime) {
        p.state = "recovered";
        p.daysInfected = 0;
        p.quarantined = false;
      }
    } else if (p.state === "recovered") {
      // Allow for loss of immunity and reinfection.
      if (Math.random() < params.reinfectionProbability) {
        p.state = "healthy";
      }
    }
  }

  return population;
};

// Stats to track (students can add more)
// Any stats you add here should be computed by Compute Stats below
export const trackedStats = [
  { label: "Healthy", value: "healthy" },
  { label: "Exposed", value: "exposed" },
  { label: "Infected", value: "infected" },
  { label: "Recovered", value: "recovered" },
];

// Example: Compute stats (students customize)
export const computeStatistics = (population, round) => {
  let healthy = population.filter(p => p.state === "healthy").length;
  let exposed = population.filter(p => p.state === "exposed").length;
  let infected = population.filter(p => p.state === "infected").length;
  let recovered = population.filter(p => p.state === "recovered").length;
  return { round, healthy, exposed, infected, recovered };
};

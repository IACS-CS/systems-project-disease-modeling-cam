import React, { useEffect, useState } from "react";
import {
  createPopulation,
  updatePopulation,
  computeStatistics,
  trackedStats,
  defaultSimulationParameters,
} from "./diseaseModel";
import { renderChart } from "../../lib/renderChart";
import { renderTable } from "../../lib/renderTable";

let boxSize = 500; // World box size in pixels
let maxSize = 1000; // Max number of icons we render (we can simulate big populations, but don't render them all...)

/**
 * Renders a subset of the population as a list of patients with emojis indicating their infection status.
 */
const renderPatients = (population) => {
  let amRenderingSubset = population.length > maxSize;
  const popSize = population.length;
  if (popSize > maxSize) {
    population = population.slice(0, maxSize);
  }

  function renderEmoji(p) {
    if (p.newlyExposed) {
      return "🤧"; // Sneezing Face for new exposures
    } else if (p.state === "exposed") {
      return "😐"; // Neutral face for exposed (incubating)
    } else if (p.state === "infected") {
      return p.quarantined ? "😷" : "🤢"; // Quarantined: Masked; Infected: Vomiting Face
    } else if (p.state === "recovered") {
      return "😌"; // Relieved face for recovered
    } else {
      return "😀"; // Healthy person
    }
  }

  function renderSubsetWarning() {
    if (amRenderingSubset) {
      return (
        <div className="subset-warning">
          Only showing {maxSize} ({((maxSize * 100) / popSize).toFixed(2)}%) of{" "}
          {popSize} patients...
        </div>
      );
    }
  }

  return (
    <>
      {renderSubsetWarning()}
      {population.map((p) => (
        <div
          key={p.id}
          data-patient-id={p.id}
          data-patient-x={p.x}
          data-patient-y={p.y}
          className="patient"
          style={{
            transform: `translate(${(p.x / 100) * boxSize}px, ${
              (p.y / 100) * boxSize
            }px)`,
          }}
        >
          {renderEmoji(p)}
        </div>
      ))}
    </>
  );
};

const Simulation = () => {
  const [popSize, setPopSize] = useState(20);
  const [population, setPopulation] = useState(
    createPopulation(popSize * popSize)
  );
  const [diseaseData, setDiseaseData] = useState([]);
  const [lineToGraph, setLineToGraph] = useState("infected");
  const [autoMode, setAutoMode] = useState(false);
  const [simulationParameters, setSimulationParameters] = useState(
    defaultSimulationParameters
  );

  // Runs a single simulation step
  const runTurn = () => {
    let newPopulation = updatePopulation([...population], simulationParameters);
    setPopulation(newPopulation);
    let newStats = computeStatistics(newPopulation, diseaseData.length);
    setDiseaseData([...diseaseData, newStats]);
  };

  // Resets the simulation
  const resetSimulation = () => {
    setPopulation(createPopulation(popSize * popSize));
    setDiseaseData([]);
  };

  // Auto-run simulation effect
  useEffect(() => {
    if (autoMode) {
      const timer = setTimeout(runTurn, 500);
      return () => clearTimeout(timer);
    }
  }, [autoMode, population]);

  return (
    <div>
      <section className="top">
        <h1>COVID‑19 Simulation with Quarantine, Incubation & Reinfection</h1>
        <p>
         <code>diseaseModel.js</code>  This model
          includes an incubation period, quarantine mechanics, and reinfection dynamics to recreate COVID‑19.
        </p>

        <p>
          Population: {population.length}. Infected:{" "}
          {population.filter((p) => p.state === "infected").length}
        </p>

        <button onClick={runTurn}>Next Turn</button>
        <button onClick={() => setAutoMode(true)}>AutoRun</button>
        <button onClick={() => setAutoMode(false)}>Stop</button>
        <button onClick={resetSimulation}>Reset Simulation</button>

        <div className="controls">
          {/* Original population size controls */}
          <label>
            Population:
            <div className="vertical-stack">
              {/* Population uses a "square" size to allow a UI that makes it easy to slide
          from a small population to a large one. */}
              <input
                type="range"
                min="3"
                max="1000"
                value={popSize}
                onChange={(e) => setPopSize(parseInt(e.target.value))}
              />
              <input
                type="number"
                value={Math.round(popSize * popSize)}
                step="10"
                onChange={(e) =>
                  setPopSize(Math.sqrt(parseInt(e.target.value)))
                }
              />
            </div>
          </label>
          {/* Additional simulation parameter sliders */}
          <div className="parameter-sliders">
            <label>
              Infection Rate:
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={simulationParameters.infectionRate}
                onChange={(e) =>
                  setSimulationParameters({
                    ...simulationParameters,
                    infectionRate: parseFloat(e.target.value),
                  })
                }
              />
              {simulationParameters.infectionRate}
            </label>
            <label>
              Incubation Time:
              <input
                type="range"
                min="1"
                max="14"
                step="1"
                value={simulationParameters.incubationTime}
                onChange={(e) =>
                  setSimulationParameters({
                    ...simulationParameters,
                    incubationTime: parseInt(e.target.value),
                  })
                }
              />
              {simulationParameters.incubationTime}
            </label>
            <label>
              Recovery Time:
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={simulationParameters.recoveryTime}
                onChange={(e) =>
                  setSimulationParameters({
                    ...simulationParameters,
                    recoveryTime: parseInt(e.target.value),
                  })
                }
              />
              {simulationParameters.recoveryTime}
            </label>
            <label>
              Reinfection Probability:
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={simulationParameters.reinfectionProbability}
                onChange={(e) =>
                  setSimulationParameters({
                    ...simulationParameters,
                    reinfectionProbability: parseFloat(e.target.value),
                  })
                }
              />
              {simulationParameters.reinfectionProbability}
            </label>
            <label>
              Quarantine Threshold:
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={simulationParameters.quarantineThreshold}
                onChange={(e) =>
                  setSimulationParameters({
                    ...simulationParameters,
                    quarantineThreshold: parseFloat(e.target.value),
                  })
                }
              />
              {simulationParameters.quarantineThreshold}
            </label>
            <label>
              Quarantine Reduction Factor:
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={simulationParameters.quarantineReductionFactor}
                onChange={(e) =>
                  setSimulationParameters({
                    ...simulationParameters,
                    quarantineReductionFactor: parseFloat(e.target.value),
                  })
                }
              />
              {simulationParameters.quarantineReductionFactor}
            </label>
          </div>
        </div>
      </section>

      <section className="side-by-side">
        {renderChart(diseaseData, lineToGraph, setLineToGraph, trackedStats)}

        <div className="world">
          <div
            className="population-box"
            style={{ width: boxSize, height: boxSize }}
          >
            {renderPatients(population)}
          </div>
        </div>

        {renderTable(diseaseData, trackedStats)}
      </section>
    </div>
  );
};

export default Simulation;

describe('Genetic Algorithm Integration', () => {
  let GeneticOptimizer;
  let AutoTuningService;

  beforeAll(() => {
    GeneticOptimizer = require('../src/services/GeneticOptimizer');
    AutoTuningService = require('../src/services/AutoTuningService');
  });

  afterAll(() => {
    GeneticOptimizer.reset();
  });

  describe('GeneticOptimizer', () => {
    test('has correct initial configuration', () => {
      expect(GeneticOptimizer.populationSize).toBe(20);
      expect(GeneticOptimizer.maxGenerations).toBe(50);
      expect(GeneticOptimizer.crossoverRate).toBe(0.8);
      expect(GeneticOptimizer.mutationRate).toBe(0.1);
    });

    test('has valid bounds for genes', () => {
      expect(GeneticOptimizer.bounds.zero).toEqual([0, 0]);
      expect(GeneticOptimizer.bounds.veryShort).toEqual([1, 10]);
      expect(GeneticOptimizer.bounds.veryLong).toEqual([30, 120]);
    });

    test('has default genes', () => {
      expect(GeneticOptimizer.defaultGenes).toEqual([0, 5, 12, 25, 40, 60]);
    });

    test('initializePopulation creates valid population', () => {
      GeneticOptimizer.initializePopulation();
      expect(GeneticOptimizer.population.length).toBe(GeneticOptimizer.populationSize);
      expect(GeneticOptimizer.generation).toBe(0);
    });

    test('population genes maintain ascending order', () => {
      for (const genes of GeneticOptimizer.population) {
        for (let i = 2; i < genes.length; i++) {
          expect(genes[i]).toBeGreaterThanOrEqual(genes[i - 1]);
        }
      }
    });

    test('tournamentSelection returns valid parent', () => {
      const parent = GeneticOptimizer.tournamentSelection(
        GeneticOptimizer.population,
        GeneticOptimizer.population.map(() => Math.random())
      );
      expect(parent).toHaveLength(6);
      expect(Array.isArray(parent)).toBe(true);
    });

    test('crossover maintains gene structure', () => {
      const parent1 = [0, 5, 12, 25, 40, 60];
      const parent2 = [0, 8, 15, 30, 45, 70];
      const child = GeneticOptimizer.crossover(parent1, parent2);
      expect(child).toHaveLength(6);
      expect(child[0]).toBe(0);
    });

    test('mutation modifies genes within bounds', () => {
      const genes = [0, 5, 12, 25, 40, 60];
      const mutated = GeneticOptimizer.mutation(genes);
      expect(mutated).toHaveLength(6);
      expect(mutated[0]).toBe(0);
      for (let i = 1; i < mutated.length; i++) {
        const [min, max] = GeneticOptimizer.bounds[Object.keys(GeneticOptimizer.bounds)[i]];
        expect(mutated[i]).toBeGreaterThanOrEqual(min);
        expect(mutated[i]).toBeLessThanOrEqual(max);
      }
    });

    test('evaluateFitness returns numeric value', () => {
      const genes = [0, 5, 12, 25, 40, 60];
      const dataLogs = [
        { soilMoistureError: 20, rainProb: 0, hour: 12, actualDurationUsed: 30, stressFlag: 0 }
      ];
      const fitness = GeneticOptimizer.evaluateFitness(genes, dataLogs);
      expect(typeof fitness).toBe('number');
      expect(isFinite(fitness)).toBe(true);
    });

    test('simulateFuzzy returns duration within bounds', () => {
      const genes = [0, 5, 12, 25, 40, 60];
      const duration = GeneticOptimizer.simulateFuzzy(30, 0, 12, genes);
      expect(typeof duration).toBe('number');
      expect(duration).toBeGreaterThanOrEqual(0);
      expect(duration).toBeLessThanOrEqual(120);
    });

    test('runOptimization improves fitness over generations', async () => {
      const mockData = Array.from({ length: 20 }, (_, i) => ({
        soilMoistureError: (i % 10) * 5 - 20,
        rainProb: (i % 5) * 20,
        hour: 6 + (i % 12),
        actualDurationUsed: Math.max(0, i * 2),
        stressFlag: i > 15 ? 1 : 0
      }));

      GeneticOptimizer.maxGenerations = 5;
      const result = await GeneticOptimizer.runOptimization(mockData);

      expect(result).toHaveProperty('bestSolution');
      expect(result).toHaveProperty('bestFitness');
      expect(result.bestSolution).toHaveLength(6);
    }, 30000);

    test('getStatus returns system status', () => {
      const status = GeneticOptimizer.getStatus();
      expect(status).toHaveProperty('generation');
      expect(status).toHaveProperty('bestSolution');
      expect(status).toHaveProperty('populationSize');
      expect(status).toHaveProperty('maxGenerations');
    });

    test('reset restores initial state', () => {
      const beforeReset = GeneticOptimizer.generation;
      GeneticOptimizer.reset();
      expect(GeneticOptimizer.generation).toBe(0);
      expect(GeneticOptimizer.population.length).toBe(GeneticOptimizer.populationSize);
    });
  });

  describe('AutoTuningService', () => {
    test('generateMockData creates valid dataset', () => {
      const data = AutoTuningService.generateMockData();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);

      const sample = data[0];
      expect(sample).toHaveProperty('soilMoistureError');
      expect(sample).toHaveProperty('rainProb');
      expect(sample).toHaveProperty('hour');
      expect(sample).toHaveProperty('actualDurationUsed');
      expect(sample).toHaveProperty('stressFlag');
    });

    test('startAutoTuning returns control object', () => {
      const controls = AutoTuningService.startAutoTuning();
      expect(controls).toHaveProperty('run');
      expect(controls).toHaveProperty('stop');
      expect(controls).toHaveProperty('getOptimizerStatus');
      controls.stop();
    });

    test('startImmediate returns optimization result', async () => {
      const result = await AutoTuningService.startImmediate();
      expect(result).toHaveProperty('bestSolution');
      expect(result).toHaveProperty('bestFitness');
    }, 30000);
  });

  describe('Integration with Fuzzy Controller', () => {
    test('GeneticOptimizer updates FuzzyController singletons', async () => {
      const fuzzy = require('../src/services/IrrigationFuzzyController');
      const originalSingletons = { ...fuzzy.outputSingletons };

      const mockData = [
        { soilMoistureError: 25, rainProb: 0, hour: 12, actualDurationUsed: 35, stressFlag: 0 }
      ];

      GeneticOptimizer.maxGenerations = 3;
      await GeneticOptimizer.runOptimization(mockData);

      expect(fuzzy.outputSingletons).not.toEqual(originalSingletons);
    });
  });
});
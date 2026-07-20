export const FINANCIAL_DEFAULTS = Object.freeze({
  productionPerKwp: 1650,
  residentialLimitKwp: 22.5,
  residentialSelfUseShare: 1 / 3,
  residentialBuyRate: 0.64,
  residentialExportRate: 0.48,
  industrialExportRate: 0.39,
  annualPanelDegradation: 0.004,
  installCostPerKwp: 2900,
  vatRate: 0.18,
  panelKwp: 0.63,
  usableRoofFactor: 0.82,
  sqmPerKwp: 7,
  analysisYears: 25
});

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function calculateFinancialModel(input = {}, overrides = {}) {
  const config = { ...FINANCIAL_DEFAULTS, ...overrides };
  const dcCapacityKwp = Math.max(number(input.dcCapacityKwp), 0);
  const annualConsumptionKwh = Math.max(number(input.annualConsumptionKwh), 0);
  const productionFactor = Math.max(number(input.productionFactor, 1), 0);
  const annualProductionYear1 = dcCapacityKwp * config.productionPerKwp * productionFactor;
  const isResidential = dcCapacityKwp <= config.residentialLimitKwp;

  let selfConsumedYear1 = 0;
  let exportedYear1 = annualProductionYear1;
  let annualValueYear1 = annualProductionYear1 * config.industrialExportRate;
  let effectiveTariffYear1 = config.industrialExportRate;
  let calculationMode = 'industrial';

  if (isResidential) {
    const targetSelfConsumption = annualProductionYear1 * config.residentialSelfUseShare;
    selfConsumedYear1 = Math.min(targetSelfConsumption, annualConsumptionKwh || targetSelfConsumption);
    exportedYear1 = Math.max(annualProductionYear1 - selfConsumedYear1, 0);
    annualValueYear1 =
      selfConsumedYear1 * config.residentialBuyRate +
      exportedYear1 * config.residentialExportRate;
    effectiveTariffYear1 = annualValueYear1 / Math.max(annualProductionYear1, 1);
    calculationMode = 'residential';
  }

  const yearly = [];
  let grossValue25 = 0;
  let totalProduction25 = 0;

  for (let year = 1; year <= config.analysisYears; year += 1) {
    const degradationFactor = Math.pow(1 - config.annualPanelDegradation, year - 1);
    const productionKwh = annualProductionYear1 * degradationFactor;
    let selfConsumedKwh = 0;
    let exportedKwh = productionKwh;
    let value = productionKwh * config.industrialExportRate;

    if (isResidential) {
      const targetSelfConsumption = productionKwh * config.residentialSelfUseShare;
      selfConsumedKwh = Math.min(targetSelfConsumption, annualConsumptionKwh || targetSelfConsumption);
      exportedKwh = Math.max(productionKwh - selfConsumedKwh, 0);
      value =
        selfConsumedKwh * config.residentialBuyRate +
        exportedKwh * config.residentialExportRate;
    }

    yearly.push({ year, productionKwh, selfConsumedKwh, exportedKwh, value });
    grossValue25 += value;
    totalProduction25 += productionKwh;
  }

  const costBeforeVat = dcCapacityKwp * config.installCostPerKwp;
  const costWithVat = costBeforeVat * (1 + config.vatRate);
  const paybackBeforeVat = costBeforeVat / Math.max(annualValueYear1, 1);
  const paybackWithVat = costWithVat / Math.max(annualValueYear1, 1);

  return {
    calculationMode,
    isResidential,
    dcCapacityKwp,
    annualProduction: annualProductionYear1,
    annualProductionYear1,
    annualConsumptionKwh,
    selfConsumed: selfConsumedYear1,
    selfConsumedYear1,
    exported: exportedYear1,
    exportedYear1,
    selfUseShare: annualProductionYear1 ? selfConsumedYear1 / annualProductionYear1 : 0,
    exportShare: annualProductionYear1 ? exportedYear1 / annualProductionYear1 : 1,
    annualSavings: annualValueYear1,
    annualValueYear1,
    effectiveTariff: effectiveTariffYear1,
    effectiveTariffYear1,
    tariffUsed: isResidential ? config.residentialExportRate : config.industrialExportRate,
    buyRateUsed: isResidential ? config.residentialBuyRate : null,
    panelDegradationRate: config.annualPanelDegradation,
    cost: costBeforeVat,
    costBeforeVat,
    costWithVat,
    payback: paybackWithVat,
    paybackBeforeVat,
    paybackWithVat,
    gross25: grossValue25,
    totalProduction25,
    avgTariff25: grossValue25 / Math.max(totalProduction25, 1),
    profit25BeforeVat: grossValue25 - costBeforeVat,
    profit25WithVat: grossValue25 - costWithVat,
    profit25: grossValue25 - costWithVat,
    yearly,
    config
  };
}

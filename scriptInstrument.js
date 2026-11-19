function calculateWheelSpokes({
  erd,
  spokeCount,
  flangeLeft,
  flangeRight,
  offsetLeft,
  offsetRight,
  crossesLeft,
  crossesRight,
  spokeHoleDiameter = 2.5,
  rimOffset = 0
}) {
  const calcSide = (flangeDia, centerToFlange, crosses, effectiveRimOffset) => {
    const rRim = erd / 2;
    const rHub = flangeDia / 2;
    const spokesPerFlange = spokeCount / 2;
    const angle = (2 * Math.PI * crosses) / spokesPerFlange;
    const totalOffset = centerToFlange + effectiveRimOffset;

    const length = Math.sqrt(
      Math.pow(rRim, 2) +
      Math.pow(rHub, 2) +
      Math.pow(totalOffset, 2) -
      2 * rRim * rHub * Math.cos(angle)
    ) - (spokeHoleDiameter / 2);

    return Number(length.toFixed(1));
  };

  return {
    left: calcSide(flangeLeft, offsetLeft, crossesLeft, -rimOffset),
    right: calcSide(flangeRight, offsetRight, crossesRight, rimOffset)
  };
}

function calculateTirePressure({
  riderWeight,
  bikeWeight = 13.5,
  tireWidth,
  wheelDiameter = '29',
  setup = 'tubeless',
  surface = 'trail',
  condition = 'dry'
}) {
  const totalWeight = riderWeight + bikeWeight;
  const widthFactor = Math.pow(tireWidth / 25, 1.55);

  let frontBar = ((totalWeight * 0.44) / 7.5) / widthFactor;
  let rearBar = ((totalWeight * 0.56) / 7.5) / widthFactor;

  const diameterModifiers = {
    '29': 0.96,
    '27.5': 1.0,
    '26': 1.04
  };

  const surfaceModifiers = {
    xc: 0.78,
    trail: 0.72,
    enduro: 0.76,
    pump: 1.05
  };

  const conditionModifiers = {
    dry: 1.0,
    wet: 0.92
  };

  const setupMod = setup === 'tubeless' ? 0.88 : 1.0;
  const diaMod = diameterModifiers[wheelDiameter] || 0.96;
  const surfMod = surfaceModifiers[surface] || 0.72;
  const condMod = conditionModifiers[condition] || 1.0;

  const totalMod = setupMod * diaMod * surfMod * condMod;

  frontBar *= totalMod;
  rearBar *= totalMod;

  const toPsi = (bar) => Math.round(bar * 14.5038);

  return {
    frontBar: Number(frontBar.toFixed(1)),
    frontPsi: toPsi(frontBar),
    rearBar: Number(rearBar.toFixed(1)),
    rearPsi: toPsi(rearBar)
  };
}

function calculateForkPressure({
  riderWeight,
  forkType = 'trail',
  style = 'balanced',
  tokens = 1
}) {
  const typePresets = {
    dj:     { mult: 1.65, offset: 25 },
    xc:     { mult: 1.22, offset: 5 },
    trail:  { mult: 1.08, offset: 8 },
    enduro: { mult: 1.02, offset: 10 },
    dh:     { mult: 0.92, offset: 12 }
  };

  const styleModifiers = {
    plush:    0.92,
    balanced: 1.0,
    firm:     1.08
  };

  const tokenModifiers = {
    0: 1.03,
    1: 1.0,
    3: 0.96
  };

  const sagLabels = {
    plush: '25–30%',
    balanced: '20%',
    firm: '15%'
  };

  const preset = typePresets[forkType] || typePresets.trail;
  const styleMod = styleModifiers[style] || 1.0;
  const tokenMod = tokenModifiers[tokens] || 1.0;

  const rawPsi = ((riderWeight * preset.mult) + preset.offset) * styleMod * tokenMod;
  const psi = Math.round(rawPsi);
  const bar = Number((psi / 14.5038).toFixed(1));

  const reboundClicks = Math.max(2, Math.min(18, Math.round(16 - (psi / 11))));

  return {
    psi,
    bar,
    sag: forkType === 'dj' ? '10–15%' : (sagLabels[style] || '20%'),
    rebound: `${reboundClicks} кликов`
  };
}

document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.link-list a[data-calc]');
  const calcSections = document.querySelectorAll('.calc-section');
  const collapseBtns = document.querySelectorAll('.collapse-btn');

  function closeAllCalculators() {
    navLinks.forEach(l => l.classList.remove('active-tab'));
    calcSections.forEach(sec => sec.classList.remove('active'));
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('data-calc');
      const targetSection = document.getElementById(targetId);
      const isAlreadyOpen = targetSection?.classList.contains('active');

      closeAllCalculators();

      if (!isAlreadyOpen && targetSection) {
        link.classList.add('active-tab');
        targetSection.classList.add('active');
      }
    });
  });

  collapseBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      closeAllCalculators();
    });
  });

  const getFloat = (el, fallback = NaN) => {
    const val = parseFloat(el?.value);
    return Number.isNaN(val) ? fallback : val;
  };

  const getInt = (el, fallback = NaN) => {
    const val = parseInt(el?.value, 10);
    return Number.isNaN(val) ? fallback : val;
  };

  const spokeInputs = {
    erd: document.getElementById('sp-erd'),
    count: document.getElementById('sp-count'),
    flangeL: document.getElementById('sp-flange-l'),
    flangeR: document.getElementById('sp-flange-r'),
    offsetL: document.getElementById('sp-offset-l'),
    offsetR: document.getElementById('sp-offset-r'),
    crossesL: document.getElementById('sp-crosses-l'),
    crossesR: document.getElementById('sp-crosses-r'),
    holeDia: document.getElementById('sp-hole-dia'),
    rimOffset: document.getElementById('sp-rim-offset')
  };

  const spokeOutputs = {
    left: document.getElementById('res-spoke-l'),
    right: document.getElementById('res-spoke-r')
  };

  function updateSpokes() {
    const erd = getFloat(spokeInputs.erd);
    const spokeCount = getInt(spokeInputs.count);
    const flangeLeft = getFloat(spokeInputs.flangeL);
    const flangeRight = getFloat(spokeInputs.flangeR);
    const offsetLeft = getFloat(spokeInputs.offsetL);
    const offsetRight = getFloat(spokeInputs.offsetR);
    const crossesLeft = getInt(spokeInputs.crossesL, 3);
    const crossesRight = getInt(spokeInputs.crossesR, 3);
    const spokeHoleDiameter = getFloat(spokeInputs.holeDia, 2.5);
    const rimOffset = getFloat(spokeInputs.rimOffset, 0);

    const isInvalid =
      erd <= 0 || Number.isNaN(erd) ||
      spokeCount <= 0 || Number.isNaN(spokeCount) || spokeCount % 2 !== 0 ||
      flangeLeft <= 0 || Number.isNaN(flangeLeft) ||
      flangeRight <= 0 || Number.isNaN(flangeRight) ||
      Number.isNaN(offsetLeft) ||
      Number.isNaN(offsetRight) ||
      crossesLeft < 0 ||
      crossesRight < 0;

    if (isInvalid) {
      if (spokeOutputs.left) spokeOutputs.left.textContent = '—';
      if (spokeOutputs.right) spokeOutputs.right.textContent = '—';
      return;
    }

    const result = calculateWheelSpokes({
      erd,
      spokeCount,
      flangeLeft,
      flangeRight,
      offsetLeft,
      offsetRight,
      crossesLeft,
      crossesRight,
      spokeHoleDiameter,
      rimOffset
    });

    if (spokeOutputs.left) spokeOutputs.left.textContent = `${result.left} мм`;
    if (spokeOutputs.right) spokeOutputs.right.textContent = `${result.right} мм`;
  }

  Object.values(spokeInputs).forEach(el => {
    if (el) el.addEventListener('input', updateSpokes);
  });

  const tireInputs = {
    rider: document.getElementById('tr-rider'),
    bike: document.getElementById('tr-bike'),
    width: document.getElementById('tr-width'),
    diameter: document.getElementById('tr-diameter'),
    setup: document.getElementById('tr-setup'),
    surface: document.getElementById('tr-surface'),
    condition: document.getElementById('tr-condition')
  };

  const tireOutputs = {
    front: document.getElementById('res-tire-f'),
    rear: document.getElementById('res-tire-r')
  };

  function updateTires() {
    const riderWeight = getFloat(tireInputs.rider);
    const bikeWeight = getFloat(tireInputs.bike, 0);
    const tireWidth = getFloat(tireInputs.width);
    const wheelDiameter = tireInputs.diameter?.value || '29';
    const setup = tireInputs.setup?.value || 'tubeless';
    const surface = tireInputs.surface?.value || 'trail';
    const condition = tireInputs.condition?.value || 'dry';

    const isInvalid =
      riderWeight <= 0 || Number.isNaN(riderWeight) ||
      bikeWeight < 0 || Number.isNaN(bikeWeight) ||
      tireWidth <= 0 || Number.isNaN(tireWidth);

    if (isInvalid) {
      if (tireOutputs.front) tireOutputs.front.textContent = '—';
      if (tireOutputs.rear) tireOutputs.rear.textContent = '—';
      return;
    }

    const result = calculateTirePressure({
      riderWeight,
      bikeWeight,
      tireWidth,
      wheelDiameter,
      setup,
      surface,
      condition
    });

    if (tireOutputs.front) tireOutputs.front.textContent = `${result.frontBar} Bar (${result.frontPsi} PSI)`;
    if (tireOutputs.rear) tireOutputs.rear.textContent = `${result.rearBar} Bar (${result.rearPsi} PSI)`;
  }

  Object.values(tireInputs).forEach(el => {
    if (el) el.addEventListener('input', updateTires);
  });

  const forkInputs = {
    weight: document.getElementById('fk-weight'),
    type: document.getElementById('fk-type'),
    style: document.getElementById('fk-style'),
    tokens: document.getElementById('fk-tokens')
  };

  const forkOutputs = {
    psi: document.getElementById('res-fork-psi'),
    sag: document.getElementById('res-fork-sag'),
    rebound: document.getElementById('res-fork-rebound')
  };

  function updateFork() {
    const riderWeight = getFloat(forkInputs.weight);
    const forkType = forkInputs.type?.value || 'trail';
    const style = forkInputs.style?.value || 'balanced';
    const tokens = getInt(forkInputs.tokens, 1);

    if (riderWeight <= 0 || Number.isNaN(riderWeight)) {
      if (forkOutputs.psi) forkOutputs.psi.textContent = '—';
      if (forkOutputs.sag) forkOutputs.sag.textContent = '—';
      if (forkOutputs.rebound) forkOutputs.rebound.textContent = '—';
      return;
    }

    const result = calculateForkPressure({
      riderWeight,
      forkType,
      style,
      tokens
    });

    if (forkOutputs.psi) forkOutputs.psi.textContent = `${result.psi} PSI (${result.bar} Bar)`;
    if (forkOutputs.sag) forkOutputs.sag.textContent = result.sag;
    if (forkOutputs.rebound) forkOutputs.rebound.textContent = result.rebound;
  }

  Object.values(forkInputs).forEach(el => {
    if (el) el.addEventListener('input', updateFork);
  });

  updateSpokes();
  updateTires();
  updateFork();
});

import { reactive } from 'vue';
import { ChipRegistry } from './registry';

const MAX_ITERATIONS = 100;

export const systemState = reactive({
  components: [],
  wires: [],
  clock: 0 
});

//組譯
export function assembleCode(code) {
  systemState.components = [];
  systemState.wires = []; 
  systemState.clock = 0;
  
  const lines = code.split('\n').map(l => l.trim()).filter(l => l);

  const parsedComponents = [];
  const tempWires = [];

  // 第一次迴圈 : 初始化 : 建立元件
  lines.forEach(line => {
    const parts = line.split(/\s+/);
    if (parts.length < 2) return;
    const type = parts[0].toUpperCase();
    if (type === 'WIRE') return;

    if (parts.length >= 2) {
      const id = parts[1];
      
      const x = parts.length >= 4 ? parseInt(parts[2]) : undefined;
      const y = parts.length >= 4 ? parseInt(parts[3]) : undefined;

      const comp = {
        id: id,
        type: type,
        x: x, 
        y: y,
        value: 0,
        nextValue: 0,
        expanded: false,
        inputStates: {},
        outputStates: {},
        internals: null
      };

      if (ChipRegistry[type]) {
        comp.internals = buildInternals(type);
      }
      parsedComponents.push(comp);
    }
  });

  // 第二次迴圈：處理連線
  lines.forEach(line => {
    const parts = line.split(/\s+/);
    if (parts.length < 2) return;
    const type = parts[0].toUpperCase();

    if (type === 'WIRE' && parts.length >= 3) {
      const sourceId = parts[1];
      const targetId = parts[2];
      const arg1 = parts[3];
      const arg2 = parts[4];

      let fromPin = null;
      let toPin = null;

      if (arg2) {
        fromPin = arg1; toPin = arg2;
      } else if (arg1) {
        const targetComp = parsedComponents.find(c => c.id === targetId);
        const targetDef = targetComp ? ChipRegistry[targetComp.type] : null;
        const isTargetInput = targetDef && targetDef.inputs && targetDef.inputs.includes(arg1);
        if (isTargetInput) toPin = arg1;
        else fromPin = arg1;
      }

      tempWires.push({ from: sourceId, to: targetId, fromPin, toPin });
    }
  });

  const inputComps = parsedComponents.filter(c => c.type === 'INPUT');
  const nonInputComps = parsedComponents.filter(c => c.type !== 'INPUT');
  
  let mainTargetComp = null;
  
  for (const targetComp of nonInputComps) {
    const hasInputWire = tempWires.some(w => w.to === targetComp.id && inputComps.some(i => i.id === w.from));
    if (hasInputWire) {
      mainTargetComp = targetComp;
      break;
    }
  }

  let sortedInputComps = inputComps;

  if (mainTargetComp) {
    const mainTargetDef = ChipRegistry[mainTargetComp.type];
    const targetInputPins = mainTargetDef?.inputs || []; 

    // node的查表邏輯
    const inputToPinMap = {};
    tempWires.filter(w => w.to === mainTargetComp.id && w.toPin).forEach(w => {
      if (inputComps.some(i => i.id === w.from)) {
        inputToPinMap[w.from] = w.toPin;
      }
    });

    // 實例化node
    const newOrder = [];
    targetInputPins.forEach(pinName => {
      const inputId = Object.keys(inputToPinMap).find(id => inputToPinMap[id] === pinName);

      if (inputId) {
        const inputComp = inputComps.find(c => c.id === inputId);
        if (inputComp) newOrder.push(inputComp);
      }
    });
    
    // node接線實例化
    const connectedIds = newOrder.map(c => c.id);
    const unconnectedInputs = inputComps.filter(c => !connectedIds.includes(c.id));
    
    sortedInputComps = [...newOrder, ...unconnectedInputs];
  }
  systemState.components = parsedComponents;
  systemState.wires = tempWires;
  
  applyAutoLayout(systemState.components, sortedInputComps);
  
  //結束後執行邏輯運算
  evaluateSystem();
}

//處理排版的演算法
function applyAutoLayout(components, sortedInputComps) {
  const INPUT_X = 50;
  const INPUT_START_Y = 50;
  const INPUT_GAP_Y = 100; 

  const GRID_START_X = 250;
  const GRID_START_Y = 50;
  const CELL_W = 400; 
  const CELL_H = 300; 
  const COLS = 3;     

  let inputCount = 0;
  
  sortedInputComps.forEach(comp => {
    if ((comp.x === undefined || isNaN(comp.x) || comp.y === undefined || isNaN(comp.y)) && comp.type === 'INPUT') {
        comp.x = INPUT_X;
        comp.y = INPUT_START_Y + (inputCount * INPUT_GAP_Y);
        inputCount++;
    }
  });

  let mainCount = 0;
  components.forEach(comp => {
    if (comp.type === 'INPUT') return; 

    // 只有在座標缺失時才自動排版
    if (comp.x === undefined || isNaN(comp.x) || comp.y === undefined || isNaN(comp.y)) {
      
      const col = mainCount % COLS;
      const row = Math.floor(mainCount / COLS);
      
      comp.x = GRID_START_X + (col * CELL_W);
      comp.y = GRID_START_Y + (row * CELL_H);
      mainCount++;
    }
  });
}

function buildInternals(type) {
  const blueprint = ChipRegistry[type];
  if (!blueprint || !blueprint.components) return null;

  const internals = {
    components: blueprint.components.map(c => ({
      ...c,
      value: 0,
      nextValue: 0,
      inputStates: {},
      outputStates: {},
      internals: ChipRegistry[c.type] ? buildInternals(c.type) : null
    })),
    wires: JSON.parse(JSON.stringify(blueprint.wires || []))
  };
  return internals;
}

//sequential system的更新邏輯
export function tickSystem() {
  systemState.clock++;
  updateDFFs(systemState.components);
  evaluateSystem();
}

function updateDFFs(components) {
  components.forEach(comp => {
    if (comp.type === 'DFF') {
      comp.value = comp.nextValue;
      comp.outputStates = { OUT: comp.value };
    }
    if (comp.internals && comp.internals.components) {
      updateDFFs(comp.internals.components);
    }
  });
}

// combinationnal system的更新邏輯
export function evaluateSystem() {
  let stabilized = false;
  let iterations = 0;

  while (!stabilized && iterations < MAX_ITERATIONS) {
    stabilized = true;
    iterations++;
    const hasChanged = simulateScope(systemState.components, systemState.wires, {}, {});
    if (hasChanged) stabilized = false;
  }
}

function simulateScope(components, wires, parentInputs = {}, scopeInputs = {}) {
  let scopeChanged = false;

  components.forEach(comp => {
    const oldInputs = JSON.stringify(comp.inputStates);
    const newInputs = getInputs(comp, wires, components, parentInputs, scopeInputs);
    
    if (JSON.stringify(newInputs) !== oldInputs) {
      comp.inputStates = newInputs;
      scopeChanged = true;
    }

    const oldVal = comp.value;
    const oldOutputStates = JSON.stringify(comp.outputStates);

    if (comp.type === 'DFF') {
      const inputVal = newInputs['In'] !== undefined ? Number(newInputs['In']) : 0;
      if (comp.nextValue !== inputVal) {
        comp.nextValue = inputVal;
      }
      comp.outputStates = { OUT: comp.value };
    }
    else if (comp.internals && ChipRegistry[comp.type]) {
      const mapping = ChipRegistry[comp.type].ioMapping;
      
      const internalChanged = simulateScope(
        comp.internals.components, 
        comp.internals.wires, 
        newInputs, 
        newInputs
      );

      if (internalChanged) scopeChanged = true;

      if (mapping.outputs) {
        Object.keys(mapping.outputs).forEach(portName => {
          const target = mapping.outputs[portName];
          let internalId, internalPin;

          if (typeof target === 'object') {
            internalId = target.id; internalPin = target.pin;
          } else {
            internalId = target; internalPin = null;
          }

          const internalComp = comp.internals.components.find(c => c.id === internalId);
          if (internalComp) {
            if (internalPin && internalComp.outputStates && internalComp.outputStates[internalPin] !== undefined) {
              comp.outputStates[portName] = internalComp.outputStates[internalPin];
            } else {
              comp.outputStates[portName] = internalComp.value;
            }
          } else {
            comp.outputStates[portName] = 0;
          }
        });
      }

      const outputId = typeof mapping.output === 'string' ? mapping.output : mapping.output?.main;
      if (outputId) {
        const outputComp = comp.internals.components.find(c => c.id === outputId);
        comp.value = outputComp ? outputComp.value : 0;
      }

    } else {
      comp.value = calculateLogic(comp.type, newInputs, comp.value);
      comp.outputStates = { OUT: comp.value }; 
    }

    if (comp.value !== oldVal || JSON.stringify(comp.outputStates) !== oldOutputStates) {
      scopeChanged = true;
    }
  });

  return scopeChanged;
}

// 最底層邏輯運算
function calculateLogic(type, inputsMap, currentValue) {
  if (type === 'INPUT') return currentValue;
  if (type === 'DFF') return currentValue;

  const registryDef = ChipRegistry[type];
  const inputOrder = registryDef ? registryDef.inputs : ['A', 'B']; 
  
  const valArr = inputOrder.map(pin => {
    const val = inputsMap[pin];
    return (val !== undefined) ? Number(val) : 0;
  });

  const a = valArr[0];
  const b = valArr[1];

  switch (type) {
    case 'AND': return (a === 1 && b === 1) ? 1 : 0;
    case 'OR':  return (a === 1 || b === 1) ? 1 : 0;
    case 'NOT': return (a === 0) ? 1 : 0;
    case 'NAND': return !(a === 1 && b === 1) ? 1 : 0;
    case 'XOR': return (a !== b) ? 1 : 0;
    default: return 0;
  }
}

function getInputs(targetComp, wires, components, parentInputs, scopeInputs) {
  const inputMap = {};
  const definedInputs = ChipRegistry[targetComp.type]?.inputs || ['A', 'B'];
  
  const setVal = (pin, val) => { inputMap[pin] = val; };

  wires.filter(w => w.to === targetComp.id).forEach(w => {
    let val = 0;
    const sourceComp = components.find(c => c.id === w.from);
    
    if (sourceComp) {
      if (w.fromPin) val = sourceComp.outputStates[w.fromPin] || 0;
      else val = sourceComp.value;
    } 
    else if (parentInputs[w.from] !== undefined) val = parentInputs[w.from];
    else if (scopeInputs[w.from] !== undefined) val = scopeInputs[w.from];

    if (w.toPin) setVal(w.toPin, val);
    else {
      const firstFreePin = definedInputs.find(pin => inputMap[pin] === undefined);
      if (firstFreePin) setVal(firstFreePin, val);
    }
  });
  return inputMap;
}

//當調整input時，呼叫combinational system重新進行運算
export function toggleInput(componentId) {
  const comp = systemState.components.find(c => c.id === componentId);
  if (comp && comp.type === 'INPUT') {
    comp.value = comp.value === 0 ? 1 : 0;
    comp.outputStates = { OUT: comp.value }; 
    evaluateSystem();
  }
}

// src/useSystem.js
import { reactive } from 'vue';
import { ChipRegistry } from './registry';

const MAX_ITERATIONS = 100;

export const systemState = reactive({
  components: [],
  wires: [],
  clock: 0 // 🕒 新增：全域時鐘
});

/**
 * 1. 組譯代碼
 */
export function assembleCode(code) {
  systemState.components = [];
  systemState.wires = []; 
  systemState.clock = 0;
  
  const lines = code.split('\n').map(l => l.trim()).filter(l => l);

  // 第一遍：建立元件
  lines.forEach(line => {
    const parts = line.split(/\s+/);
    if (parts.length < 2) return;
    const type = parts[0].toUpperCase();
    if (type === 'WIRE') return;

    if (parts.length >= 4) {
      const [_, id, x, y] = parts;
      const comp = {
        id: id,
        type: type,
        x: parseInt(x),
        y: parseInt(y),
        value: 0,
        nextValue: 0, // 🕒 DFF 專用：暫存下一個狀態
        expanded: false,
        inputStates: {},
        outputStates: {},
        internals: null
      };

      if (ChipRegistry[type]) {
        comp.internals = buildInternals(type);
      }
      systemState.components.push(comp);
    }
  });

  // 第二遍：處理連線
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
        const targetComp = systemState.components.find(c => c.id === targetId);
        const targetDef = targetComp ? ChipRegistry[targetComp.type] : null;
        const isTargetInput = targetDef && targetDef.inputs && targetDef.inputs.includes(arg1);
        if (isTargetInput) toPin = arg1;
        else fromPin = arg1;
      }

      systemState.wires.push({ from: sourceId, to: targetId, fromPin, toPin });
    }
  });

  evaluateSystem();
}

function buildInternals(type) {
  const blueprint = ChipRegistry[type];
  if (!blueprint || !blueprint.components) return null;

  const internals = {
    components: blueprint.components.map(c => ({
      ...c,
      value: 0,
      nextValue: 0, // 🕒 子元件也要有 nextValue
      inputStates: {},
      outputStates: {},
      internals: ChipRegistry[c.type] ? buildInternals(c.type) : null
    })),
    wires: JSON.parse(JSON.stringify(blueprint.wires || []))
  };
  return internals;
}

/**
 * 🕒 核心功能：時鐘跳動 (Tick)
 * 只有在 Tick 時，DFF 才會把 nextValue 寫入 value
 */
export function tickSystem() {
  systemState.clock++;
  
  // 1. 更新所有 DFF 的數值
  updateDFFs(systemState.components);
  
  // 2. DFF 更新後，電路狀態改變，需要重新計算直到穩定
  evaluateSystem();
}

// 遞迴更新 DFF
function updateDFFs(components) {
  components.forEach(comp => {
    if (comp.type === 'DFF') {
      comp.value = comp.nextValue; // ⚡️ 更新發生在這裡
      comp.outputStates = { OUT: comp.value };
    }
    
    if (comp.internals && comp.internals.components) {
      updateDFFs(comp.internals.components);
    }
  });
}

/**
 * 2. 模擬引擎
 */
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
    // A. 收集輸入
    const oldInputs = JSON.stringify(comp.inputStates);
    const newInputs = getInputs(comp, wires, components, parentInputs, scopeInputs);
    
    if (JSON.stringify(newInputs) !== oldInputs) {
      comp.inputStates = newInputs;
      scopeChanged = true;
    }

    // B. 計算邏輯
    const oldVal = comp.value;
    const oldOutputStates = JSON.stringify(comp.outputStates);

    // 🕒 DFF 特殊邏輯
    if (comp.type === 'DFF') {
      // DFF 讀取輸入，但只存到 nextValue
      // 它的 value (輸出) 在 Tick 之前絕對不會變！
      const inputVal = newInputs['In'] !== undefined ? Number(newInputs['In']) : 0;
      if (comp.nextValue !== inputVal) {
        comp.nextValue = inputVal;
        // 注意：nextValue 變了不算 scopeChanged，因為輸出沒變，不會影響下游
      }
      comp.outputStates = { OUT: comp.value };
    }
    else if (comp.internals && ChipRegistry[comp.type]) {
      // === 複合晶片 ===
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
      // === 基本邏輯閘 ===
      comp.value = calculateLogic(comp.type, newInputs, comp.value);
      comp.outputStates = { OUT: comp.value }; 
    }

    if (comp.value !== oldVal || JSON.stringify(comp.outputStates) !== oldOutputStates) {
      scopeChanged = true;
    }
  });

  return scopeChanged;
}

function calculateLogic(type, inputsMap, currentValue) {
  if (type === 'INPUT') return currentValue;
  if (type === 'DFF') return currentValue; // DFF 不在這裡計算

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
  
  // DFF 只有一個輸入 'In'
  if (targetComp.type === 'DFF' && !ChipRegistry['DFF']) {
     // 隱式定義
  }

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

export function toggleInput(componentId) {
  const comp = systemState.components.find(c => c.id === componentId);
  if (comp && comp.type === 'INPUT') {
    comp.value = comp.value === 0 ? 1 : 0;
    comp.outputStates = { OUT: comp.value }; 
    evaluateSystem();
  }
}
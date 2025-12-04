// src/registry.js
export const ChipRegistry = {
  'AND': { inputs: ['A', 'B'], outputs: ['OUT'] },
  'OR':  { inputs: ['A', 'B'], outputs: ['OUT'] },
  'NAND':{ inputs: ['A', 'B'], outputs: ['OUT'] },
  'NOT': { inputs: ['In'], outputs: ['OUT'] },

  'XOR': {
    inputs: ['A', 'B'],
    outputs: ['OUT'],
    components: [
      { id: 'n1', type: 'OR', x: 50, y: 50, value: 0 },
      { id: 'n2', type: 'NAND', x: 50, y: 150, value: 0 },
      { id: 'n3', type: 'AND', x: 200, y: 100, value: 0 }
    ],
    wires: [
      { from: 'n1', to: 'n3' }, { from: 'n2', to: 'n3' },
      { from: 'A', to: 'n1', toPin: 'A' }, { from: 'A', to: 'n2', toPin: 'A' },
      { from: 'B', to: 'n1', toPin: 'B' }, { from: 'B', to: 'n2', toPin: 'B' }
    ],
    ioMapping: {
      inputs: { 
        'A': [ { id: 'n1', pin: 'A' }, { id: 'n2', pin: 'A' } ], 
        'B': [ { id: 'n1', pin: 'B' }, { id: 'n2', pin: 'B' } ] 
      }, 
      output: 'n3'
    }
  },

  'MUX': {
    inputs: ['A', 'B', 'Sel'],
    outputs: ['OUT'],
    components: [
      { id: 'not1', type: 'NOT', x: 50, y: 150, value: 0 },
      { id: 'and1', type: 'AND', x: 200, y: 50, value: 0 },
      { id: 'and2', type: 'AND', x: 200, y: 200, value: 0 },
      { id: 'or1',  type: 'OR',  x: 350, y: 125, value: 0 }
    ],
    wires: [
      { from: 'Sel', to: 'not1', toPin: 'In' }, 
      { from: 'not1', to: 'and1', toPin: 'B' }, 
      { from: 'Sel', to: 'and2', toPin: 'B' },
      { from: 'A', to: 'and1', toPin: 'A' },
      { from: 'B', to: 'and2', toPin: 'A' },
      { from: 'and1', to: 'or1', toPin: 'A' },
      { from: 'and2', to: 'or1', toPin: 'B' }
    ],
    ioMapping: {
      inputs: {
        'A':   [{ id: 'and1', pin: 'A' }],
        'B':   [{ id: 'and2', pin: 'A' }],
        'Sel': [{ id: 'not1', pin: 'In' }, { id: 'and2', pin: 'B' }]
      },
      output: 'or1'
    }
  },

  'MUX_4_BIT': {
    inputs: ['A0', 'A1', 'A2', 'A3', 'B0', 'B1', 'B2', 'B3', 'Sel'],
    outputs: ['Out0', 'Out1', 'Out2', 'Out3'],
    components: [
      { id: 'm0', type: 'MUX', x: 50, y: 50, value: 0 },
      { id: 'm1', type: 'MUX', x: 50, y: 150, value: 0 },
      { id: 'm2', type: 'MUX', x: 50, y: 250, value: 0 },
      { id: 'm3', type: 'MUX', x: 50, y: 350, value: 0 }
    ],
    wires: [
      { from: 'Sel', to: 'm0', toPin: 'Sel' }, { from: 'Sel', to: 'm1', toPin: 'Sel' },
      { from: 'Sel', to: 'm2', toPin: 'Sel' }, { from: 'Sel', to: 'm3', toPin: 'Sel' },
      { from: 'A0', to: 'm0', toPin: 'A' }, { from: 'B0', to: 'm0', toPin: 'B' },
      { from: 'A1', to: 'm1', toPin: 'A' }, { from: 'B1', to: 'm1', toPin: 'B' },
      { from: 'A2', to: 'm2', toPin: 'A' }, { from: 'B2', to: 'm2', toPin: 'B' },
      { from: 'A3', to: 'm3', toPin: 'A' }, { from: 'B3', to: 'm3', toPin: 'B' }
    ],
    ioMapping: {
      inputs: {
        'Sel': [{id:'m0',pin:'Sel'}, {id:'m1',pin:'Sel'}, {id:'m2',pin:'Sel'}, {id:'m3',pin:'Sel'}],
        'A0': [{id:'m0',pin:'A'}], 'B0': [{id:'m0',pin:'B'}],
        'A1': [{id:'m1',pin:'A'}], 'B1': [{id:'m1',pin:'B'}],
        'A2': [{id:'m2',pin:'A'}], 'B2': [{id:'m2',pin:'B'}],
        'A3': [{id:'m3',pin:'A'}], 'B3': [{id:'m3',pin:'B'}]
      },
      outputs: { 'Out0': 'm0', 'Out1': 'm1', 'Out2': 'm2', 'Out3': 'm3' }
    }
  },

  'NOT_4_BIT': {
    inputs: ['In0', 'In1', 'In2', 'In3'],
    outputs: ['Out0', 'Out1', 'Out2', 'Out3'],
    components: [
      { id: 'n0', type: 'NOT', x: 50, y: 50, value: 0 },
      { id: 'n1', type: 'NOT', x: 50, y: 150, value: 0 },
      { id: 'n2', type: 'NOT', x: 50, y: 250, value: 0 },
      { id: 'n3', type: 'NOT', x: 50, y: 350, value: 0 }
    ],
    wires: [
      { from: 'In0', to: 'n0', toPin: 'In' }, { from: 'In1', to: 'n1', toPin: 'In' },
      { from: 'In2', to: 'n2', toPin: 'In' }, { from: 'In3', to: 'n3', toPin: 'In' }
    ],
    ioMapping: {
      inputs: {
        'In0': [{id:'n0',pin:'In'}], 'In1': [{id:'n1',pin:'In'}],
        'In2': [{id:'n2',pin:'In'}], 'In3': [{id:'n3',pin:'In'}]
      },
      outputs: { 'Out0': 'n0', 'Out1': 'n1', 'Out2': 'n2', 'Out3': 'n3' }
    }
  },

  'AND_4_BIT': {
    inputs: ['A0', 'A1', 'A2', 'A3', 'B0', 'B1', 'B2', 'B3'],
    outputs: ['Out0', 'Out1', 'Out2', 'Out3'],
    components: [
      { id: 'a0', type: 'AND', x: 50, y: 50, value: 0 },
      { id: 'a1', type: 'AND', x: 50, y: 150, value: 0 },
      { id: 'a2', type: 'AND', x: 50, y: 250, value: 0 },
      { id: 'a3', type: 'AND', x: 50, y: 350, value: 0 }
    ],
    wires: [
      { from: 'A0', to: 'a0', toPin: 'A' }, { from: 'B0', to: 'a0', toPin: 'B' },
      { from: 'A1', to: 'a1', toPin: 'A' }, { from: 'B1', to: 'a1', toPin: 'B' },
      { from: 'A2', to: 'a2', toPin: 'A' }, { from: 'B2', to: 'a2', toPin: 'B' },
      { from: 'A3', to: 'a3', toPin: 'A' }, { from: 'B3', to: 'a3', toPin: 'B' }
    ],
    ioMapping: {
      inputs: {
        'A0': [{id:'a0',pin:'A'}], 'B0': [{id:'a0',pin:'B'}],
        'A1': [{id:'a1',pin:'A'}], 'B1': [{id:'a1',pin:'B'}],
        'A2': [{id:'a2',pin:'A'}], 'B2': [{id:'a2',pin:'B'}],
        'A3': [{id:'a3',pin:'A'}], 'B3': [{id:'a3',pin:'B'}]
      },
      outputs: { 'Out0': 'a0', 'Out1': 'a1', 'Out2': 'a2', 'Out3': 'a3' }
    }
  },

  'HALF_ADDER': {
    inputs: ['A', 'B'],
    ioMapping: {
      inputs: { 
        'A': [ { id: 'xor0', pin: 'A' }, { id: 'and0', pin: 'A' } ], 
        'B': [ { id: 'xor0', pin: 'B' }, { id: 'and0', pin: 'B' } ] 
      },
      output: 'xor0', 
      outputs: { 'SUM': 'xor0', 'CARRY': 'and0' }
    },
    components: [
      { id: 'xor0', type: 'XOR', x: 200, y: 50, value: 0 },
      { id: 'and0', type: 'AND', x: 200, y: 200, value: 0 }
    ],
    wires: [
      { from: 'A', to: 'xor0', toPin: 'A' }, { from: 'A', to: 'and0', toPin: 'A' },
      { from: 'B', to: 'xor0', toPin: 'B' }, { from: 'B', to: 'and0', toPin: 'B' }
    ]
  },

  'FULL_ADDER': {
    inputs: ['A', 'B', 'Cin'],
    outputs: ['SUM', 'Cout'],
    components: [
      { id: 'ha1', type: 'HALF_ADDER', x: 50, y: 50, value: 0 },
      { id: 'ha2', type: 'HALF_ADDER', x: 400, y: 50, value: 0 },
      { id: 'or1', type: 'OR', x: 400, y: 250, value: 0 }
    ],
    wires: [
      { from: 'ha1', fromPin: 'SUM', to: 'ha2', toPin: 'A' },
      { from: 'ha1', fromPin: 'CARRY', to: 'or1' },
      { from: 'ha2', fromPin: 'CARRY', to: 'or1' },
      { from: 'A', to: 'ha1', toPin: 'A' },
      { from: 'B', to: 'ha1', toPin: 'B' },
      { from: 'Cin', to: 'ha2', toPin: 'B' }
    ],
    ioMapping: {
      inputs: {
        'A': [ { id: 'ha1', pin: 'A' } ], 
        'B': [ { id: 'ha1', pin: 'B' } ],
        'Cin': [ { id: 'ha2', pin: 'B' } ] 
      },
      output: 'ha2', 
      outputs: { 'SUM': 'ha2', 'Cout': 'or1' }
    }
  },

  'ADDER_4_BIT': {
    inputs: ['A0', 'B0', 'A1', 'B1', 'A2', 'B2', 'A3', 'B3'], 
    outputs: ['S0', 'S1', 'S2', 'S3', 'Cout'],
    components: [
      { id: 'fa0', type: 'FULL_ADDER', x: 50, y: 50, value: 0 },
      { id: 'fa1', type: 'FULL_ADDER', x: 350, y: 50, value: 0 },
      { id: 'fa2', type: 'FULL_ADDER', x: 650, y: 50, value: 0 },
      { id: 'fa3', type: 'FULL_ADDER', x: 950, y: 50, value: 0 }
    ],
    wires: [
      { from: 'fa0', fromPin: 'Cout', to: 'fa1', toPin: 'Cin' },
      { from: 'fa1', fromPin: 'Cout', to: 'fa2', toPin: 'Cin' },
      { from: 'fa2', fromPin: 'Cout', to: 'fa3', toPin: 'Cin' },
      { from: 'A0', to: 'fa0', toPin: 'A' }, { from: 'B0', to: 'fa0', toPin: 'B' },
      { from: 'A1', to: 'fa1', toPin: 'A' }, { from: 'B1', to: 'fa1', toPin: 'B' },
      { from: 'A2', to: 'fa2', toPin: 'A' }, { from: 'B2', to: 'fa2', toPin: 'B' },
      { from: 'A3', to: 'fa3', toPin: 'A' }, { from: 'B3', to: 'fa3', toPin: 'B' }
    ],
    ioMapping: {
      inputs: {
        'A0': [{id:'fa0',pin:'A'}], 'B0': [{id:'fa0',pin:'B'}],
        'A1': [{id:'fa1',pin:'A'}], 'B1': [{id:'fa1',pin:'B'}],
        'A2': [{id:'fa2',pin:'A'}], 'B2': [{id:'fa2',pin:'B'}],
        'A3': [{id:'fa3',pin:'A'}], 'B3': [{id:'fa3',pin:'B'}],
      },
      output: 'fa3',
      outputs: { 
        'S0': 'fa0', 'S1': 'fa1', 'S2': 'fa2', 
        'S3': { id: 'fa3', pin: 'SUM' }, 
        'Cout': { id: 'fa3', pin: 'Cout' } 
      }
    }
  },

  'ALU_4_BIT': {
    inputs: [
      'X0','X1','X2','X3', 
      'Y0','Y1','Y2','Y3',
      'zx', 'nx', 'zy', 'ny', 'f', 'no'
    ],
    outputs: ['Out0', 'Out1', 'Out2', 'Out3'],
    
    components: [
      { id: 'mux_zx', type: 'MUX_4_BIT', x: 50, y: 50, value: 0 }, 
      { id: 'not_nx', type: 'NOT_4_BIT', x: 200, y: 50, value: 0 },
      { id: 'mux_nx', type: 'MUX_4_BIT', x: 350, y: 50, value: 0 },
      { id: 'mux_zy', type: 'MUX_4_BIT', x: 50, y: 350, value: 0 },
      { id: 'not_ny', type: 'NOT_4_BIT', x: 200, y: 350, value: 0 },
      { id: 'mux_ny', type: 'MUX_4_BIT', x: 350, y: 350, value: 0 },
      { id: 'alu_and', type: 'AND_4_BIT',   x: 600, y: 100, value: 0 },
      { id: 'alu_add', type: 'ADDER_4_BIT', x: 600, y: 300, value: 0 },
      { id: 'mux_f',   type: 'MUX_4_BIT',   x: 800, y: 200, value: 0 },
      { id: 'not_no', type: 'NOT_4_BIT', x: 950, y: 100, value: 0 },
      { id: 'mux_no', type: 'MUX_4_BIT', x: 1100, y: 200, value: 0 }
    ],

    wires: [
      { from: 'zx', to: 'mux_zx', toPin: 'Sel' },
      { from: 'X0', to: 'mux_zx', toPin: 'A0' }, { from: 'X1', to: 'mux_zx', toPin: 'A1' },
      { from: 'X2', to: 'mux_zx', toPin: 'A2' }, { from: 'X3', to: 'mux_zx', toPin: 'A3' },
      { from: 'mux_zx', fromPin:'Out0', to:'not_nx', toPin:'In0' }, { from: 'mux_zx', fromPin:'Out1', to:'not_nx', toPin:'In1' },
      { from: 'mux_zx', fromPin:'Out2', to:'not_nx', toPin:'In2' }, { from: 'mux_zx', fromPin:'Out3', to:'not_nx', toPin:'In3' },
      { from: 'nx', to: 'mux_nx', toPin: 'Sel' },
      { from: 'mux_zx', fromPin:'Out0', to:'mux_nx', toPin:'A0' }, { from: 'not_nx', fromPin:'Out0', to:'mux_nx', toPin:'B0' },
      { from: 'mux_zx', fromPin:'Out1', to:'mux_nx', toPin:'A1' }, { from: 'not_nx', fromPin:'Out1', to:'mux_nx', toPin:'B1' },
      { from: 'mux_zx', fromPin:'Out2', to:'mux_nx', toPin:'A2' }, { from: 'not_nx', fromPin:'Out2', to:'mux_nx', toPin:'B2' },
      { from: 'mux_zx', fromPin:'Out3', to:'mux_nx', toPin:'A3' }, { from: 'not_nx', fromPin:'Out3', to:'mux_nx', toPin:'B3' },
      { from: 'zy', to: 'mux_zy', toPin: 'Sel' },
      { from: 'Y0', to: 'mux_zy', toPin: 'A0' }, { from: 'Y1', to: 'mux_zy', toPin: 'A1' },
      { from: 'Y2', to: 'mux_zy', toPin: 'A2' }, { from: 'Y3', to: 'mux_zy', toPin: 'A3' },
      { from: 'mux_zy', fromPin:'Out0', to:'not_ny', toPin:'In0' }, { from: 'mux_zy', fromPin:'Out1', to:'not_ny', toPin:'In1' },
      { from: 'mux_zy', fromPin:'Out2', to:'not_ny', toPin:'In2' }, { from: 'mux_zy', fromPin:'Out3', to:'not_ny', toPin:'In3' },
      { from: 'ny', to: 'mux_ny', toPin: 'Sel' },
      { from: 'mux_zy', fromPin:'Out0', to:'mux_ny', toPin:'A0' }, { from: 'not_ny', fromPin:'Out0', to:'mux_ny', toPin:'B0' },
      { from: 'mux_zy', fromPin:'Out1', to:'mux_ny', toPin:'A1' }, { from: 'not_ny', fromPin:'Out1', to:'mux_ny', toPin:'B1' },
      { from: 'mux_zy', fromPin:'Out2', to:'mux_ny', toPin:'A2' }, { from: 'not_ny', fromPin:'Out2', to:'mux_ny', toPin:'B2' },
      { from: 'mux_zy', fromPin:'Out3', to:'mux_ny', toPin:'A3' }, { from: 'not_ny', fromPin:'Out3', to:'mux_ny', toPin:'B3' },
      { from: 'mux_nx', fromPin:'Out0', to:'alu_and', toPin:'A0' }, { from: 'mux_ny', fromPin:'Out0', to:'alu_and', toPin:'B0' },
      { from: 'mux_nx', fromPin:'Out1', to:'alu_and', toPin:'A1' }, { from: 'mux_ny', fromPin:'Out1', to:'alu_and', toPin:'B1' },
      { from: 'mux_nx', fromPin:'Out2', to:'alu_and', toPin:'A2' }, { from: 'mux_ny', fromPin:'Out2', to:'alu_and', toPin:'B2' },
      { from: 'mux_nx', fromPin:'Out3', to:'alu_and', toPin:'A3' }, { from: 'mux_ny', fromPin:'Out3', to:'alu_and', toPin:'B3' },
      { from: 'mux_nx', fromPin:'Out0', to:'alu_add', toPin:'A0' }, { from: 'mux_ny', fromPin:'Out0', to:'alu_add', toPin:'B0' },
      { from: 'mux_nx', fromPin:'Out1', to:'alu_add', toPin:'A1' }, { from: 'mux_ny', fromPin:'Out1', to:'alu_add', toPin:'B1' },
      { from: 'mux_nx', fromPin:'Out2', to:'alu_add', toPin:'A2' }, { from: 'mux_ny', fromPin:'Out2', to:'alu_add', toPin:'B2' },
      { from: 'mux_nx', fromPin:'Out3', to:'alu_add', toPin:'A3' }, { from: 'mux_ny', fromPin:'Out3', to:'alu_add', toPin:'B3' },
      { from: 'f', to: 'mux_f', toPin: 'Sel' },
      { from: 'alu_and', fromPin:'Out0', to:'mux_f', toPin:'A0' }, { from: 'alu_add', fromPin:'S0', to:'mux_f', toPin:'B0' },
      { from: 'alu_and', fromPin:'Out1', to:'mux_f', toPin:'A1' }, { from: 'alu_add', fromPin:'S1', to:'mux_f', toPin:'B1' },
      { from: 'alu_and', fromPin:'Out2', to:'mux_f', toPin:'A2' }, { from: 'alu_add', fromPin:'S2', to:'mux_f', toPin:'B2' },
      { from: 'alu_and', fromPin:'Out3', to:'mux_f', toPin:'A3' }, { from: 'alu_add', fromPin:'S3', to:'mux_f', toPin:'B3' },
      { from: 'mux_f', fromPin:'Out0', to:'not_no', toPin:'In0' },
      { from: 'mux_f', fromPin:'Out1', to:'not_no', toPin:'In1' },
      { from: 'mux_f', fromPin:'Out2', to:'not_no', toPin:'In2' },
      { from: 'mux_f', fromPin:'Out3', to:'not_no', toPin:'In3' },
      { from: 'no', to: 'mux_no', toPin: 'Sel' },
      { from: 'mux_f', fromPin:'Out0', to:'mux_no', toPin:'A0' }, { from: 'not_no', fromPin:'Out0', to:'mux_no', toPin:'B0' },
      { from: 'mux_f', fromPin:'Out1', to:'mux_no', toPin:'A1' }, { from: 'not_no', fromPin:'Out1', to:'mux_no', toPin:'B1' },
      { from: 'mux_f', fromPin:'Out2', to:'mux_no', toPin:'A2' }, { from: 'not_no', fromPin:'Out2', to:'mux_no', toPin:'B2' },
      { from: 'mux_f', fromPin:'Out3', to:'mux_no', toPin:'A3' }, { from: 'not_no', fromPin:'Out3', to:'mux_no', toPin:'B3' }
    ],
    ioMapping: {
      inputs: {
        'zx': [{id:'mux_zx', pin:'Sel'}],
        'nx': [{id:'mux_nx', pin:'Sel'}],
        'zy': [{id:'mux_zy', pin:'Sel'}],
        'ny': [{id:'mux_ny', pin:'Sel'}],
        'f':  [{id:'mux_f', pin:'Sel'}],
        'no': [{id:'mux_no', pin:'Sel'}],
        'X0': [{id:'mux_zx',pin:'A0'}], 'X1': [{id:'mux_zx',pin:'A1'}],
        'X2': [{id:'mux_zx',pin:'A2'}], 'X3': [{id:'mux_zx',pin:'A3'}],
        'Y0': [{id:'mux_zy',pin:'A0'}], 'Y1': [{id:'mux_zy',pin:'A1'}],
        'Y2': [{id:'mux_zy',pin:'A2'}], 'Y3': [{id:'mux_zy',pin:'A3'}]
      },
      outputs: {
        'Out0': {id:'mux_no', pin:'Out0'},
        'Out1': {id:'mux_no', pin:'Out1'},
        'Out2': {id:'mux_no', pin:'Out2'},
        'Out3': {id:'mux_no', pin:'Out3'}
      }
    }
  }
};
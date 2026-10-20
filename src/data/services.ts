import records from './service-records.json';
import type { Service } from './types';
export const services = records as Service[];
export const textures = [
  { name: 'Cobblestone', rating: 3, recommendation: 'EDC' },
  { name: 'Gravel', rating: 3, recommendation: 'EDC' },
  { name: 'Kevlar', rating: 5, recommendation: 'EDC / Range' },
  { name: 'Coffin', rating: 6, recommendation: 'EDC / Range' },
  { name: 'Chainmail', rating: 7, recommendation: 'EDC / Range · OWB / Range' },
  { name: 'Tread', rating: 9, recommendation: 'OWB / Range' },
  { name: 'Rip-N-Dots', rating: 8, recommendation: 'OWB / Range' },
];
export const stipplingOptions = [
  'Single undercut',
  'Single undercut with scallop',
  'Double undercut',
  'Double undercut with scallop',
  'Double undercut with stippling',
  'Accelerator cut',
  'Shooter ledge',
  'Polished ledge',
  'Glove bevel',
  'Mag release scallop',
  'High tang',
  'Low tang',
  'Borders',
];
export const portingUpcoming = [
  'Smith & Wesson M&P — X Ports',
  'Glock — X Ports',
  'Glock — SOS Ports',
  'Glock — C Ports',
  'Stealth Arms Platypus — Raptor Ports',
  'Stealth Arms Platypus — Hornet Ports',
  'CZ Shadow 2 — Inline 4',
  'Walther PDP — X Ports',
];

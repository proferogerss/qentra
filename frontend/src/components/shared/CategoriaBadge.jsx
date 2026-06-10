const MAP = {
  virus:          { label: 'Virus',          cls: 'badge-virus' },
  bacterias:      { label: 'Bacterias',       cls: 'badge-bacterias' },
  hongos:         { label: 'Hongos',          cls: 'badge-hongos' },
  parasitos:      { label: 'Parásitos',       cls: 'badge-parasitos' },
  disfuncion:     { label: 'Disfunción',      cls: 'badge-disfuncion' },
  psicoemocional: { label: 'Psicoemocional',  cls: 'badge-psicoemocional' },
  reservorios:    { label: 'Reservorios',     cls: 'badge-reservorios' },
  complejos:      { label: 'Complejos',       cls: 'badge-complejos' },
};

export default function CategoriaBadge({ categoria }) {
  const info = MAP[categoria] || { label: categoria || '?', cls: 'bg-white/10 text-white/50' };
  return <span className={`badge ${info.cls}`}>{info.label}</span>;
}

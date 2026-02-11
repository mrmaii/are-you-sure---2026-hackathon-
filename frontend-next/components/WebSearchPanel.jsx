export default function WebSearchPanel() {
  return (
    <div
      id="web-search-panel"
      className="fixed top-1/2 right-8 -translate-y-1/2 w-[380px] max-w-[90vw] rounded-lg p-5 z-30 opacity-0 pointer-events-none transition-all duration-300 translate-x-4 overflow-hidden flex flex-col min-w-0 solid-card"
      style={{
        boxShadow: '6px 6px 0 var(--border-light)'
      }}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider" style={{
          background: 'var(--cobalt)',
          color: 'white',
          fontFamily: "'IBM Plex Mono', monospace"
        }}>
          // SELECT_SOURCE
        </span>
        <button
          type="button"
          id="web-search-panel-close"
          className="w-8 h-8 rounded-sm flex items-center justify-center transition-colors hover:bg-[var(--sand)]"
          aria-label="关闭"
          style={{ color: 'var(--text-primary)' }}
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
      <p
        id="web-search-panel-intro"
        className="font-medium text-sm leading-relaxed mb-4 break-words"
        style={{ color: 'var(--text-secondary)' }}
      ></p>
      <div
        id="web-search-panel-list"
        className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto overflow-x-hidden custom-scrollbar pr-1 min-w-0"
      ></div>
    </div>
  );
}

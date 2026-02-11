export default function Sidebar() {
  return (
    <>
      <button
        type="button"
        id="sidebar-toggle"
        aria-label="打开菜单"
        className="fixed top-6 left-6 z-[110] w-14 h-14 solid-card flex items-center justify-center text-gray-600 hover:text-gray-900 transition-all"
      >
        <i className="fas fa-bars text-xl"></i>
      </button>

      <div id="sidebar-backdrop" className="fixed inset-0 bg-black/20 z-[108]"></div>

      <aside
        id="sidebar"
        className="fixed left-0 top-0 h-full w-80 bg-[var(--cream)] z-[109] flex flex-col border-r-[3px] border-[var(--border-light)]"
      >
        <div className="flex items-center justify-between p-5 border-b-2 border-[var(--border-light)]">
          <span className="font-bold text-xl" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>/// MENU</span>
          <button
            type="button"
            id="sidebar-close"
            aria-label="关闭"
            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-[var(--sand)] transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-5 border-b-2 border-[var(--border-light)]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 flex items-center justify-center text-lg font-bold" style={{
              background: 'var(--cobalt)',
              color: 'white',
              boxShadow: '0 3px 0 #2d4560'
            }}>
              演
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>演示用户</p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>demo@mindbridge.ai</p>
            </div>
          </div>
          <p className="text-[10px] mt-3 px-1" style={{ color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
            [demo_mode_active]
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <h3 className="text-[10px] font-bold uppercase tracking-wider mb-4" style={{
            color: 'var(--text-muted)',
            fontFamily: "'IBM Plex Mono', monospace"
          }}>
            // WORK_MODE
          </h3>
          <div className="space-y-2">
            <label
              className="mode-option disabled flex items-center gap-4 p-4 cursor-pointer hover:bg-[var(--sand)] opacity-70"
              data-mode="screenplay"
            >
              <span className="w-10 h-10 flex items-center justify-center" style={{
                background: 'var(--sand)',
                color: 'var(--text-muted)'
              }}>
                <i className="fas fa-film text-sm"></i>
              </span>
              <span className="flex-1 font-medium" style={{ color: 'var(--text-secondary)' }}>编剧模式</span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>WIP</span>
            </label>

            <label
              className="mode-option flex items-center gap-4 p-4 cursor-pointer hover:bg-[var(--sand)]"
              style={{
                background: 'var(--sand)',
                borderLeft: '3px solid var(--cobalt)',
                fontWeight: '600'
              }}
              data-mode="hackathon"
            >
              <span className="w-10 h-10 flex items-center justify-center" style={{
                background: 'var(--cobalt)',
                color: 'white'
              }}>
                <i className="fas fa-trophy text-sm"></i>
              </span>
              <span className="flex-1" style={{ color: 'var(--text-primary)' }}>黑客松模式</span>
              <span className="text-[10px]" style={{ color: 'var(--cobalt)' }}>ACTIVE</span>
            </label>

            <label
              className="mode-option disabled flex items-center gap-4 p-4 cursor-not-allowed opacity-70"
              data-mode="developer"
            >
              <span className="w-10 h-10 flex items-center justify-center" style={{
                background: 'var(--sand)',
                color: 'var(--text-muted)'
              }}>
                <i className="fas fa-code text-sm"></i>
              </span>
              <span className="flex-1 font-medium" style={{ color: 'var(--text-secondary)' }}>开发者模式</span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>WIP</span>
            </label>

            <label
              className="mode-option disabled flex items-center gap-4 p-4 cursor-not-allowed opacity-70"
              data-mode="essay"
            >
              <span className="w-10 h-10 flex items-center justify-center" style={{
                background: 'var(--sand)',
                color: 'var(--text-muted)'
              }}>
                <i className="fas fa-pen-fancy text-sm"></i>
              </span>
              <span className="flex-1 font-medium" style={{ color: 'var(--text-secondary)' }}>文章辅导模式</span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>WIP</span>
            </label>
          </div>
        </div>

        <div className="p-5 border-t-2 border-[var(--border-light)] text-center" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            entropy_map // hackathon_edition
          </p>
        </div>
      </aside>
    </>
  );
}
